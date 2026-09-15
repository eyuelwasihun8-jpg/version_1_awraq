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

  const adminDb = createAdminClient();

  const { data: profile } = await adminDb
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !profile.is_active ||
    !['super_admin', 'admin', 'sales'].includes(profile.role)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, fullName, phone, password: customPassword, gender, ageGroup, lifeStatus, assignedTo } = body;

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

  // Auto-assign: If sales rep creates a student, assign to themselves
  // If admin/super admin creates, use provided assignedTo (nullable)
  let finalAssignedTo: string | null = null;
  if (profile.role === 'sales') {
    finalAssignedTo = user.id;
  } else if (['super_admin', 'admin'].includes(profile.role) && assignedTo) {
    finalAssignedTo = assignedTo;
  }

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

  // Update profile with all details
  const { error: profileErr } = await adminDb
    .from('profiles')
    .update({
      full_name: fullName.trim(),
      phone: phone?.trim() || null,
      gender: gender || null,
      age_group: ageGroup || null,
      life_status: lifeStatus || null,
      role: 'student',
      is_active: true,
      onboarding_completed: true,
      assigned_to: finalAssignedTo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', newUser.user.id);

  if (profileErr) {
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
      gender: gender || null,
      age_group: ageGroup || null,
      life_status: lifeStatus || null,
      assigned_to: finalAssignedTo,
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
      assignedTo: finalAssignedTo,
    },
    credentials: {
      email: newUser.user.email,
      password,
    },
  });
}