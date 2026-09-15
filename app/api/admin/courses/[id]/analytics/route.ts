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
  const { id: courseId } = await params;
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if ('error' in auth && auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user, role } = auth as { user: any; role: string };
  const adminDb = createAdminClient();

  // Course
  const { data: course, error: courseErr } = await adminDb
    .from('courses')
    .select('id, title, price, is_published, instructor_id, thumbnail_url, category, created_at')
    .eq('id', courseId)
    .single();

  if (courseErr || !course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Instructors can only view their own courses
  if (role === 'instructor' && course.instructor_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Modules + lessons
  const { data: modules } = await adminDb
    .from('course_modules')
    .select('id, title, order_index')
    .eq('course_id', courseId)
    .order('order_index');

  const { data: lessons } = await adminDb
    .from('lessons')
    .select('id, title, module_id, order_index, lesson_type, duration_seconds, is_published')
    .eq('course_id', courseId)
    .order('order_index');

  const publishedLessons = (lessons || []).filter((l) => l.is_published !== false);
  const lessonIds = publishedLessons.map((l) => l.id);

  // Active enrollments
  const { data: enrollments, count: totalEnrolled } = await adminDb
    .from('enrollments')
    .select('user_id, enrolled_at, enrollment_source, is_active', { count: 'exact' })
    .eq('course_id', courseId)
    .eq('is_active', true);

  const studentIds = (enrollments || []).map((e) => e.user_id);

  // Progress for this course's lessons
  let progressRows: any[] = [];
  if (lessonIds.length > 0 && studentIds.length > 0) {
    const { data } = await adminDb
      .from('lesson_progress')
      .select('user_id, lesson_id, is_completed, watch_seconds, scroll_percentage')
      .in('lesson_id', lessonIds)
      .in('user_id', studentIds);
    progressRows = data || [];
  }

  // Per-student completion
  const totalLessons = publishedLessons.length || 1;
  const studentProgressMap = new Map<string, number>();

  studentIds.forEach((sid) => {
    const completed = progressRows.filter(
      (p) => p.user_id === sid && p.is_completed
    ).length;
    const pct = Math.round((completed / totalLessons) * 100);
    studentProgressMap.set(sid, pct);
  });

  const progressValues = Array.from(studentProgressMap.values());
  const avgCompletion =
    progressValues.length > 0
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : 0;

  const completedStudents = progressValues.filter((p) => p >= 100).length;
  const notStarted = progressValues.filter((p) => p === 0).length;
  const inProgress = progressValues.filter((p) => p > 0 && p < 100).length;

  // Progress distribution buckets
  const distribution = {
    '0%': notStarted,
    '1-25%': progressValues.filter((p) => p >= 1 && p <= 25).length,
    '26-50%': progressValues.filter((p) => p >= 26 && p <= 50).length,
    '51-75%': progressValues.filter((p) => p >= 51 && p <= 75).length,
    '76-99%': progressValues.filter((p) => p >= 76 && p <= 99).length,
    '100%': completedStudents,
  };

  // Lesson drop-off: completion rate per lesson
  const lessonStats = publishedLessons.map((lesson) => {
    const completedCount = progressRows.filter(
      (p) => p.lesson_id === lesson.id && p.is_completed
    ).length;
    const startedCount = progressRows.filter(
      (p) => p.lesson_id === lesson.id
    ).length;
    const completionRate =
      studentIds.length > 0
        ? Math.round((completedCount / studentIds.length) * 100)
        : 0;

    return {
      id: lesson.id,
      title: lesson.title,
      moduleId: lesson.module_id,
      lessonType: lesson.lesson_type,
      orderIndex: lesson.order_index,
      completedCount,
      startedCount,
      completionRate,
      dropOffRate: 100 - completionRate,
    };
  });

  // Most abandoned = lowest completion among lessons that have been started
  const mostAbandoned =
    lessonStats.length > 0
      ? [...lessonStats].sort((a, b) => a.completionRate - b.completionRate)[0]
      : null;

  const mostCompleted =
    lessonStats.length > 0
      ? [...lessonStats].sort((a, b) => b.completionRate - a.completionRate)[0]
      : null;

  // Revenue from approved payments for this course
  const { data: payments } = await adminDb
    .from('payment_requests')
    .select('id, amount, status, created_at, user_id, enrollment_source')
    .eq('item_type', 'course')
    .eq('item_id', courseId);

  const approvedPayments = (payments || []).filter((p) => p.status === 'approved');
  const pendingPayments = (payments || []).filter((p) => p.status === 'pending');
  const rejectedPayments = (payments || []).filter((p) => p.status === 'rejected');
  const totalRevenue = approvedPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  // Certificates
  const { count: certificatesIssued } = await adminDb
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);

  // Reviews
  const { data: reviews } = await adminDb
    .from('reviews')
    .select('id, rating, review_text, created_at, user_id')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  const avgRating =
    reviews && reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length) *
            10
        ) / 10
      : 0;

  // Quiz performance
  let quizStats: any[] = [];
  if (lessonIds.length > 0) {
    const { data: quizAttempts } = await adminDb
      .from('lesson_quiz_attempts')
      .select('lesson_id, score, passed, attempted_at')
      .in('lesson_id', lessonIds);

    const quizLessons = publishedLessons.filter(
      (l) => l.lesson_type === 'quiz' || l.lesson_type === 'mixed'
    );

    quizStats = quizLessons.map((ql) => {
      const attempts = (quizAttempts || []).filter((a) => a.lesson_id === ql.id);
      const avgScore =
        attempts.length > 0
          ? Math.round(
              attempts.reduce((s, a) => s + Number(a.score || 0), 0) / attempts.length
            )
          : 0;
      const passCount = attempts.filter((a) => a.passed).length;

      return {
        lessonId: ql.id,
        title: ql.title,
        attemptCount: attempts.length,
        avgScore,
        passCount,
        passRate:
          attempts.length > 0 ? Math.round((passCount / attempts.length) * 100) : 0,
      };
    });
  }

  // Recent enrollments with names
  const recentEnrollments = (enrollments || [])
    .sort(
      (a, b) =>
        new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
    )
    .slice(0, 10);

  let recentWithNames: any[] = [];
  if (recentEnrollments.length > 0) {
    const ids = recentEnrollments.map((e) => e.user_id);
    const { data: profiles } = await adminDb
      .from('profiles')
      .select('id, full_name, avatar_url, phone')
      .in('id', ids);

    const map = new Map((profiles || []).map((p) => [p.id, p]));
    recentWithNames = recentEnrollments.map((e) => ({
      ...e,
      student: map.get(e.user_id) || null,
      progress: studentProgressMap.get(e.user_id) || 0,
    }));
  }

  // Enrollment sources breakdown
  const sourceBreakdown = {
    purchase: (enrollments || []).filter((e) => e.enrollment_source === 'purchase').length,
    manual: (enrollments || []).filter((e) => e.enrollment_source === 'manual').length,
    gift: (enrollments || []).filter((e) => e.enrollment_source === 'gift').length,
    promotion: (enrollments || []).filter((e) => e.enrollment_source === 'promotion').length,
  };

  // Modules with lesson stats
  const modulesWithStats = (modules || []).map((m) => {
    const modLessons = lessonStats.filter((l) => l.moduleId === m.id);
    const avgModCompletion =
      modLessons.length > 0
        ? Math.round(
            modLessons.reduce((s, l) => s + l.completionRate, 0) / modLessons.length
          )
        : 0;
    return {
      ...m,
      lessonCount: modLessons.length,
      avgCompletion: avgModCompletion,
      lessons: modLessons,
    };
  });

  return NextResponse.json({
    course,
    summary: {
      totalEnrolled: totalEnrolled || 0,
      avgCompletion,
      completedStudents,
      inProgress,
      notStarted,
      totalLessons: publishedLessons.length,
      totalModules: (modules || []).length,
      totalRevenue,
      certificatesIssued: certificatesIssued || 0,
      avgRating,
      reviewCount: (reviews || []).length,
      pendingPayments: pendingPayments.length,
      approvedPayments: approvedPayments.length,
      rejectedPayments: rejectedPayments.length,
    },
    distribution,
    sourceBreakdown,
    lessonStats,
    mostAbandoned,
    mostCompleted,
    modulesWithStats,
    quizStats,
    recentEnrollments: recentWithNames,
    reviews: (reviews || []).slice(0, 10),
  });
}