import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Only super admin can create staff
  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admin can create staff' }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, fullName, role, phone } = body;

  if (!email || !password || !fullName || !role) {
    return NextResponse.json({ error: 'Email, password, full name, and role required' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const validRoles = ['admin', 'sales', 'instructor'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role. Only admin, sales, or instructor allowed.' }, { status: 400 });
  }

  const adminDb = createAdminClient();

  // Create auth user (auto-confirmed since admin created them)
  const { data: newUser, error: createError } = await adminDb.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true, // Skip email verification
    user_metadata: {
      full_name: fullName.trim(),
    },
  });

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message || 'Failed to create user' },
      { status: 500 }
    );
  }

  // Update profile with role
  const { error: profileError } = await adminDb
    .from('profiles')
    .update({
      full_name: fullName.trim(),
      phone: phone?.trim() || null,
      role,
      is_active: true,
      onboarding_completed: true, // Skip onboarding for staff
    })
    .eq('id', newUser.user.id);

  if (profileError) {
    // Rollback — delete the auth user
    await adminDb.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Log to audit
  await adminDb.from('audit_logs').insert({
    actor_id: user.id,
    actor_role: 'super_admin',
    action: 'create_staff',
    target_type: 'profile',
    target_id: newUser.user.id,
    details: {
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      role,
    },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: newUser.user.id,
      email: newUser.user.email,
      full_name: fullName,
      role,
    },
  });
}