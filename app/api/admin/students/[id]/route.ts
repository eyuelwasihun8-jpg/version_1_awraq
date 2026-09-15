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

  // 1. Fetch main profile cleanly (no complex FK syntax)
  const { data: profile, error: profileErr } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (profileErr || !profile) {
    console.error('Student fetch error:', profileErr);
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // 2. Fetch assigned sales rep profile if exists
  let assignedSales: { id: string; full_name: string } | null = null;
  if (profile.assigned_to) {
    const { data: salesProfile } = await adminDb
      .from('profiles')
      .select('id, full_name')
      .eq('id', profile.assigned_to)
      .maybeSingle();
    
    if (salesProfile) {
      assignedSales = salesProfile;
    }
  }

  // SALES SCOPE: sales reps can only view their assigned students
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

  // Fetch email safely from auth
  let email: string | null = null;
  try {
    const { data: authUser } = await adminDb.auth.admin.getUserById(id);
    email = authUser?.user?.email || null;
  } catch (e) {
    console.error('Auth user fetch error:', e);
  }

  // Fetch course progress summary (fallback gracefully if empty/error)
  let courseProgress: any[] = [];
  try {
    const { data } = await adminDb
      .from('student_progress_summary')
      .select('*')
      .eq('user_id', id)
      .order('enrolled_at', { ascending: false });
    courseProgress = data || [];
  } catch (e) {
    console.error('Progress summary fetch error:', e);
  }

  // Fetch digital products
  let products: any[] = [];
  try {
    const { data } = await adminDb
      .from('purchases')
      .select('*, digital_products(id, title, price, file_type, thumbnail_url)')
      .eq('user_id', id)
      .order('purchased_at', { ascending: false });
    products = data || [];
  } catch (e) {
    console.error('Purchases fetch error:', e);
  }

  // Fetch payments
  let payments: any[] = [];
  try {
    const { data } = await adminDb
      .from('payment_requests')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    payments = data || [];
  } catch (e) {
    console.error('Payments fetch error:', e);
  }

  // Fetch certificates
  let certificates: any[] = [];
  try {
    const { data } = await adminDb
      .from('certificates')
      .select('*, courses(title)')
      .eq('user_id', id)
      .order('issued_at', { ascending: false });
    certificates = data || [];
  } catch (e) {
    console.error('Certificates fetch error:', e);
  }

  // Fetch quiz attempts
  let quizAttempts: any[] = [];
  try {
    const { data } = await adminDb
      .from('lesson_quiz_attempts')
      .select('*, lessons(title, course_id)')
      .eq('user_id', id)
      .order('attempted_at', { ascending: false })
      .limit(50);
    quizAttempts = data || [];
  } catch (e) {
    console.error('Quiz attempts fetch error:', e);
  }

  return NextResponse.json({
    student: {
      ...profile,
      email,
      assigned_sales: assignedSales,
    },
    courses: courseProgress,
    products,
    payments,
    certificates,
    quizAttempts,
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

  // If sales is trying to edit, verify ownership
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