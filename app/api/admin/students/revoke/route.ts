import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Only super_admin and admin can revoke
  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { studentId, itemType, itemId, reason } = body;

  if (!studentId || !itemType || !itemId) {
    return NextResponse.json(
      { error: 'studentId, itemType and itemId required' },
      { status: 400 }
    );
  }

  const adminDb = createAdminClient();

  if (itemType === 'course') {
    const { error } = await adminDb
      .from('enrollments')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revoke_reason: reason?.trim() || 'Revoked by admin',
      })
      .eq('user_id', studentId)
      .eq('course_id', itemId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (itemType === 'digital_product') {
    const { error } = await adminDb
      .from('purchases')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revoke_reason: reason?.trim() || 'Revoked by admin',
      })
      .eq('user_id', studentId)
      .eq('product_id', itemId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: 'Invalid itemType' }, { status: 400 });
  }

  await adminDb.from('audit_logs').insert({
    actor_id: user.id,
    actor_role: profile.role,
    action: 'revoke_access',
    target_type: itemType,
    target_id: itemId,
    details: {
      student_id: studentId,
      reason: reason || null,
    },
  });

  return NextResponse.json({ success: true });
}