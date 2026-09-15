import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  let pw = '';
  for (let i = 0; i < length; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

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

  // Only super_admin, admin, sales can create students
  if (!profile || !['super_admin', 'admin', 'sales'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, fullName, phone, password: customPassword } = body;

  if (!email?.trim() || !fullName?.trim()) {
    return NextResponse.json(
      { error: 'Email and full name are required' },
      { status: 400 }
    );
  }

  const password =
    customPassword && String(customPassword).length >= 6
      ? String(customPassword)
      : generatePassword(10);

  const adminDb = createAdminClient();

  // Create auth user (auto-confirmed)
  const { data: newUser, error: createErr } = await adminDb.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName.trim(),
    },
  });

  if (createErr || !newUser.user) {
    return NextResponse.json(
      { error: createErr?.message || 'Failed to create user' },
      { status: 500 }
    );
  }

  // Update profile
  const { error: profileErr } = await adminDb
    .from('profiles')
    .update({
      full_name: fullName.trim(),
      phone: phone?.trim() || null,
      role: 'student',
      is_active: true,
      onboarding_completed: true, // Skip onboarding for manually created students
    })
    .eq('id', newUser.user.id);

  if (profileErr) {
    // Rollback auth user
    await adminDb.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Audit log
  await adminDb.from('audit_logs').insert({
    actor_id: user.id,
    actor_role: profile.role,
    action: 'create_student',
    target_type: 'profile',
    target_id: newUser.user.id,
    details: {
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      phone: phone?.trim() || null,
      source: 'manual',
    },
  });

  return NextResponse.json({
    success: true,
    student: {
      id: newUser.user.id,
      email: newUser.user.email,
      fullName: fullName.trim(),
      phone: phone?.trim() || null,
    },
    credentials: {
      email: newUser.user.email,
      password, // Only returned once
    },
  });
}