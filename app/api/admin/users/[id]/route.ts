import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

const VALID_ROLES = ['super_admin', 'admin', 'sales', 'instructor', 'student'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: actorProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Only super admin can change roles / toggle users
  if (actorProfile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admin can do this' }, { status: 403 });
  }

  // Can't demote/disable yourself
  if (targetUserId === user.id) {
    return NextResponse.json({ error: "Can't modify your own account here" }, { status: 400 });
  }

  const body = await request.json();
  const { role, isActive } = body;

  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Load current state for audit log
  const adminDb = createAdminClient();
  const { data: before } = await adminDb
    .from('profiles')
    .select('role, is_active, full_name')
    .eq('id', targetUserId)
    .single();

  if (!before) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.is_active = isActive;

  const { data: updated, error } = await adminDb
    .from('profiles')
    .update(updates)
    .eq('id', targetUserId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Write to audit log
  await adminDb.from('audit_logs').insert({
    actor_id: user.id,
    actor_role: 'super_admin',
    action: role !== undefined ? 'change_role' : 'toggle_user_active',
    target_type: 'profile',
    target_id: targetUserId,
    details: {
      target_name: before.full_name,
      before: { role: before.role, is_active: before.is_active },
      after: { role: updated.role, is_active: updated.is_active },
    },
  });

  return NextResponse.json({ success: true, user: updated });
}