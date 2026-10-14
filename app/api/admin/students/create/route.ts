import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createStudentSchema } from '@/lib/validators';
import { createHandler } from '@/lib/api-handler';

function generateSecurePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let pw = '';
  for (let i = 0; i < length; i++) {
    pw += chars.charAt(bytes[i] % chars.length);
  }
  return pw;
}

export const POST = createHandler(
  createStudentSchema,
  null,
  async (request) => {
    const { validatedData: body } = request;

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

    const {
      email,
      fullName,
      phone,
      password: customPassword,
      gender,
      ageGroup,
      lifeStatus,
      assignedTo,
    } = body;

    // Auto-assign: If sales rep creates a student, assign to themselves
    // If admin/super admin creates, use provided assignedTo (nullable)
    let finalAssignedTo: string | null = null;
    if (profile.role === 'sales') {
      finalAssignedTo = user.id;
    } else if (['super_admin', 'admin'].includes(profile.role) && assignedTo) {
      finalAssignedTo = assignedTo;
    }

    // Generate secure password if not provided
    const password =
      customPassword && String(customPassword).length >= 6
        ? String(customPassword)
        : generateSecurePassword(12);

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
);