import { createClient } from '@/lib/supabase-server';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: enrollments },
    { data: purchases },
    { data: certificates },
    { data: notes },
    { data: rawPayments },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('enrollments').select('course_id, enrolled_at').eq('user_id', user.id),
    supabase.from('purchases').select('product_id, purchased_at').eq('user_id', user.id),
    supabase
      .from('certificates')
      .select('*, courses(title, thumbnail_url)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),
    supabase
      .from('lesson_notes')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        lesson_id,
        course_id,
        lessons(title),
        courses(title)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('payment_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const courseIds = enrollments?.map((e) => e.course_id) || [];
  const productIds = purchases?.map((p) => p.product_id) || [];

  const recQuery = supabase
    .from('courses')
    .select('*, instructor:profiles(full_name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6);

  const [{ data: courseData }, { data: productData }, { data: recData }, { data: courseLessons }] =
    await Promise.all([
      courseIds.length
        ? supabase
            .from('courses')
            .select('*, instructor:profiles(full_name)')
            .in('id', courseIds)
        : Promise.resolve({ data: [] }),
      productIds.length
        ? supabase.from('digital_products').select('*').in('id', productIds)
        : Promise.resolve({ data: [] }),
      courseIds.length
        ? recQuery.not('id', 'in', `(${courseIds.map((id) => `"${id}"`).join(',')})`)
        : recQuery,
      courseIds.length
        ? supabase.from('lessons').select('id, course_id').in('course_id', courseIds)
        : Promise.resolve({ data: [] }),
    ]);

  const enrolledCourses = courseData || [];
  const enrolledProducts = productData || [];
  const recommendedCourses = recData || [];

  const progressMap: Record<string, { completed: number; total: number }> = {};
  const lessonIdsByCourse = new Map<string, string[]>();

  for (const lesson of courseLessons || []) {
    const ids = lessonIdsByCourse.get(lesson.course_id) || [];
    ids.push(lesson.id);
    lessonIdsByCourse.set(lesson.course_id, ids);
  }

  const allLessonIds = Array.from(lessonIdsByCourse.values()).flat();
  const { data: completedProgress } = allLessonIds.length
    ? await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .in('lesson_id', allLessonIds)
    : { data: [] };

  const completedByLesson = new Set((completedProgress || []).map((p) => p.lesson_id));
  for (const course of enrolledCourses) {
    const courseLessonIds = lessonIdsByCourse.get(course.id) || [];
    progressMap[course.id] = {
      total: courseLessonIds.length,
      completed: courseLessonIds.filter((id) => completedByLesson.has(id)).length,
    };
  }

  let allPayments: any[] = [];
  if (rawPayments && rawPayments.length > 0) {
    const payCourseIds = rawPayments
      .filter((p) => p.item_type === 'course')
      .map((p) => p.item_id);
    const payProductIds = rawPayments
      .filter((p) => p.item_type === 'digital_product')
      .map((p) => p.item_id);

    const coursesMap = new Map();
    const productsMap = new Map();

    const [{ data: paymentCourses }, { data: paymentProducts }] = await Promise.all([
      payCourseIds.length
        ? supabase.from('courses').select('id, title').in('id', payCourseIds)
        : Promise.resolve({ data: [] }),
      payProductIds.length
        ? supabase.from('digital_products').select('id, title').in('id', payProductIds)
        : Promise.resolve({ data: [] }),
    ]);

    (paymentCourses || []).forEach((x) => coursesMap.set(x.id, x));
    (paymentProducts || []).forEach((x) => productsMap.set(x.id, x));

    allPayments = rawPayments.map((p) => ({
      ...p,
      item_title:
        p.item_type === 'course'
          ? coursesMap.get(p.item_id)?.title
          : productsMap.get(p.item_id)?.title,
    }));
  }

  return {
    profile,
    enrolledCourses,
    enrolledProducts,
    recommendedCourses,
    progressMap,
    certificates: certificates || [],
    notes: notes || [],
    allPayments,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient {...data} />;
}