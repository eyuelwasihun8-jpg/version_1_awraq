import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

async function requireStaff(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
  ) {
    return { error: 'Forbidden', status: 403 as const };
  }

  return { user, role: profile.role as string };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if ('error' in auth && auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user, role } = auth as { user: any; role: string };
  const adminDb = createAdminClient();

  // Profile + email
  const { data: profile, error: profileErr } = await adminDb
    .from('profiles')
    .select('*, assigned_sales:profiles!profiles_assigned_to_fkey(id, full_name)')
    .eq('id', id)
    .eq('role', 'student')
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // SALES SCOPE: sales can only view their assigned students
  if (role === 'sales' && profile.assigned_to !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // INSTRUCTOR SCOPE
  if (role === 'instructor') {
    const { count } = await adminDb
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('is_active', true)
      .in(
        'course_id',
        (
          await adminDb
            .from('courses')
            .select('id')
            .eq('instructor_id', user.id)
        ).data?.map((c: any) => c.id) || []
      );

    if (!count) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { data: authUser } = await adminDb.auth.admin.getUserById(id);

  // Course progress
  const { data: courseProgress } = await adminDb
    .from('student_progress_summary')
    .select('*')
    .eq('user_id', id)
    .order('enrolled_at', { ascending: false });

  // Digital products
  const { data: products } = await adminDb
    .from('purchases')
    .select('*, digital_products(id, title, price, file_type, thumbnail_url)')
    .eq('user_id', id)
    .order('purchased_at', { ascending: false });

  // Payments
  const { data: payments } = await adminDb
    .from('payment_requests')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  // Certificates
  const { data: certificates } = await adminDb
    .from('certificates')
    .select('*, courses(title)')
    .eq('user_id', id)
    .order('issued_at', { ascending: false });

  // Quiz attempts
  const { data: quizAttempts } = await adminDb
    .from('lesson_quiz_attempts')
    .select('*, lessons(title, course_id)')
    .eq('user_id', id)
    .order('attempted_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    student: {
      ...profile,
      email: authUser?.user?.email || null,
    },
    courses: courseProgress || [],
    products: products || [],
    payments: payments || [],
    certificates: certificates || [],
    quizAttempts: quizAttempts || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if ('error' in auth && auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user, role } = auth as { user: any; role: string };

  if (!['super_admin', 'admin', 'sales'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const adminDb = createAdminClient();

  // If sales is trying to edit, verify they own this student
  if (role === 'sales') {
    const { data: existingProfile } = await adminDb
      .from('profiles')
      .select('assigned_to')
      .eq('id', id)
      .single();

    if (existingProfile?.assigned_to !== user.id) {
      return NextResponse.json({ error: 'You can only edit your assigned students' }, { status: 403 });
    }
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.fullName !== undefined) updates.full_name = body.fullName?.trim() || null;
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
  if (body.isActive !== undefined) updates.is_active = !!body.isActive;
  if (body.gender !== undefined) updates.gender = body.gender || null;
  if (body.ageGroup !== undefined) updates.age_group = body.ageGroup || null;
  if (body.lifeStatus !== undefined) updates.life_status = body.lifeStatus || null;

  // Only super_admin and admin can change assignments
  if (body.assignedTo !== undefined && ['super_admin', 'admin'].includes(role)) {
    updates.assigned_to = body.assignedTo || null;
  }

  const { data, error } = await adminDb
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .eq('role', 'student')
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log for assignment change
  if (body.assignedTo !== undefined && ['super_admin', 'admin'].includes(role)) {
    await adminDb.from('audit_logs').insert({
      actor_id: user.id,
      actor_role: role,
      action: 'reassign_student',
      target_type: 'profile',
      target_id: id,
      details: {
        assigned_to: body.assignedTo,
      },
    });
  }

  return NextResponse.json({ success: true, student: data });
}