import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminDb = createAdminClient();

  const { data: profile } = await adminDb
    .from('profiles')
    .select('role, full_name, is_active')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !profile.is_active ||
    !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const role = profile.role;

  // ─────────── SALES DASHBOARD ───────────
  if (role === 'sales') {
    const { data: myStudents } = await adminDb
      .from('profiles')
      .select('id, full_name, avatar_url, created_at, phone')
      .eq('role', 'student')
      .eq('assigned_to', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const studentIds = (myStudents || []).map((s) => s.id);

    let enrolledCount = 0;
    let avgProgress = 0;
    let recentProgress: any[] = [];

    if (studentIds.length > 0) {
      const { count } = await adminDb
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .in('user_id', studentIds)
        .eq('is_active', true);
      enrolledCount = count || 0;

      const { data: progressRows } = await adminDb
        .from('student_progress_summary')
        .select('user_id, progress_percent, course_title, enrolled_at')
        .in('user_id', studentIds)
        .eq('enrollment_active', true);

      if (progressRows && progressRows.length > 0) {
        avgProgress = Math.round(
          progressRows.reduce((s, r) => s + Number(r.progress_percent || 0), 0) /
            progressRows.length
        );
        recentProgress = progressRows.slice(0, 8);
      }
    }

    // Payments reviewed by this sales rep (optional)
    const { count: myApprovals } = await adminDb
      .from('payment_requests')
      .select('id', { count: 'exact', head: true })
      .eq('reviewed_by', user.id)
      .eq('status', 'approved');

    const { count: pendingPayments } = await adminDb
      .from('payment_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    return NextResponse.json({
      role,
      name: profile.full_name,
      sales: {
        assignedStudents: myStudents?.length || 0,
        studentsWithEnrollments: enrolledCount,
        avgProgress,
        myApprovals: myApprovals || 0,
        pendingPayments: pendingPayments || 0,
        recentStudents: (myStudents || []).slice(0, 8),
        recentProgress,
      },
    });
  }

  // ─────────── INSTRUCTOR DASHBOARD ───────────
  if (role === 'instructor') {
    const { data: myCourses } = await adminDb
      .from('courses')
      .select('id, title, price, is_published, thumbnail_url, created_at')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });

    const courseIds = (myCourses || []).map((c) => c.id);

    let totalEnrolled = 0;
    let avgCompletion = 0;
    let certificatesIssued = 0;
    let recentEnrollments: any[] = [];

    if (courseIds.length > 0) {
      const { data: enrollments, count } = await adminDb
        .from('enrollments')
        .select('user_id, course_id, enrolled_at, is_active', { count: 'exact' })
        .in('course_id', courseIds)
        .eq('is_active', true)
        .order('enrolled_at', { ascending: false })
        .limit(10);

      totalEnrolled = count || 0;

      const { data: progressRows } = await adminDb
        .from('student_progress_summary')
        .select('progress_percent, course_id, user_id, course_title')
        .in('course_id', courseIds)
        .eq('enrollment_active', true);

      if (progressRows && progressRows.length > 0) {
        avgCompletion = Math.round(
          progressRows.reduce((s, r) => s + Number(r.progress_percent || 0), 0) /
            progressRows.length
        );
      }

      const { count: certCount } = await adminDb
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .in('course_id', courseIds);
      certificatesIssued = certCount || 0;

      // Attach student names
      if (enrollments && enrollments.length > 0) {
        const uids = enrollments.map((e) => e.user_id);
        const { data: profiles } = await adminDb
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', uids);
        const map = new Map((profiles || []).map((p) => [p.id, p]));
        const courseMap = new Map((myCourses || []).map((c) => [c.id, c.title]));

        recentEnrollments = enrollments.map((e) => ({
          ...e,
          student: map.get(e.user_id) || null,
          courseTitle: courseMap.get(e.course_id) || 'Course',
        }));
      }
    }

    return NextResponse.json({
      role,
      name: profile.full_name,
      instructor: {
        coursesCount: myCourses?.length || 0,
        publishedCourses: (myCourses || []).filter((c) => c.is_published).length,
        totalEnrolled,
        avgCompletion,
        certificatesIssued,
        myCourses: myCourses || [],
        recentEnrollments,
      },
    });
  }

  // ─────────── ADMIN / SUPER ADMIN DASHBOARD ───────────
  const [
    { count: pendingPayments },
    { count: approvedPayments },
    { count: totalStudents },
    { count: totalCourses },
    { count: unassignedStudents },
    { count: totalSales },
    { data: recentPayments },
    { data: revenueData },
  ] = await Promise.all([
    adminDb
      .from('payment_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    adminDb
      .from('payment_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student'),
    adminDb.from('courses').select('id', { count: 'exact', head: true }),
    adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .is('assigned_to', null),
    adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'sales')
      .eq('is_active', true),
    adminDb
      .from('payment_requests')
      .select('id, amount, status, created_at, item_type, user_id')
      .order('created_at', { ascending: false })
      .limit(8),
    adminDb.from('payment_requests').select('amount').eq('status', 'approved'),
  ]);

  const totalRevenue = (revenueData || []).reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0
  );

  // Attach names to recent payments
  let recentWithNames: any[] = [];
  if (recentPayments && recentPayments.length > 0) {
    const uids = recentPayments.map((p) => p.user_id);
    const { data: profiles } = await adminDb
      .from('profiles')
      .select('id, full_name')
      .in('id', uids);
    const map = new Map((profiles || []).map((p) => [p.id, p.full_name]));
    recentWithNames = recentPayments.map((p) => ({
      ...p,
      studentName: map.get(p.user_id) || 'Student',
    }));
  }

  return NextResponse.json({
    role,
    name: profile.full_name,
    admin: {
      pendingPayments: pendingPayments || 0,
      approvedPayments: approvedPayments || 0,
      totalStudents: totalStudents || 0,
      totalCourses: totalCourses || 0,
      unassignedStudents: unassignedStudents || 0,
      totalSales: totalSales || 0,
      totalRevenue,
      recentPayments: recentWithNames,
    },
  });
}