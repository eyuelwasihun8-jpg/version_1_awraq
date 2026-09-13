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

  // 1. Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. Get enrolled courses via enrollments table
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, enrolled_at')
    .eq('user_id', user.id);

  const courseIds = enrollments?.map((e) => e.course_id) || [];

  // 3. Get purchased digital products via purchases table
  const { data: purchases } = await supabase
    .from('purchases')
    .select('product_id, purchased_at')
    .eq('user_id', user.id);

  const productIds = purchases?.map((p) => p.product_id) || [];

  // 4. Fetch enrolled course details
  let enrolledCourses: any[] = [];
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from('courses')
      .select('*, instructor:profiles(full_name)')
      .in('id', courseIds);
    enrolledCourses = data || [];
  }

  // 5. Fetch purchased product details
  let enrolledProducts: any[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase
      .from('digital_products')
      .select('*')
      .in('id', productIds);
    enrolledProducts = data || [];
  }

  // 6. Recommended courses (published + not enrolled)
  let recommendedCourses: any[] = [];
  const recQuery = supabase
    .from('courses')
    .select('*, instructor:profiles(full_name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6);

  const { data: recData } = courseIds.length
    ? await recQuery.not('id', 'in', `(${courseIds.map((id) => `"${id}"`).join(',')})`)
    : await recQuery;

  recommendedCourses = recData || [];

  // 7. Fetch progress per course (FIXED: use lessons + lesson_progress correctly)
  const progressMap: Record<string, { completed: number; total: number }> = {};

  for (const course of enrolledCourses) {
    // Get all lesson IDs for this course
    const { data: courseLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', course.id);

    const lessonIds = (courseLessons || []).map((l) => l.id);

    if (lessonIds.length === 0) {
      progressMap[course.id] = { total: 0, completed: 0 };
      continue;
    }

    // Count completed lessons
    const { count: completedCount } = await supabase
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .in('lesson_id', lessonIds);

    progressMap[course.id] = {
      total: lessonIds.length,
      completed: completedCount || 0,
    };
  }

  // 8. Fetch certificates with course titles
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, courses(title, thumbnail_url)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  // 9. Fetch all notes with course + lesson titles
  const { data: notes } = await supabase
    .from('lesson_notes')
    .select(
      `
      id,
      content,
      created_at,
      updated_at,
      lesson_id,
      course_id,
      lessons(title),
      courses(title)
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 10. Fetch all payments and enrich with item titles
  const { data: rawPayments } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  let allPayments: any[] = [];
  if (rawPayments && rawPayments.length > 0) {
    const payCourseIds = rawPayments
      .filter((p) => p.item_type === 'course')
      .map((p) => p.item_id);
    const payProductIds = rawPayments
      .filter((p) => p.item_type === 'digital_product')
      .map((p) => p.item_id);

    let coursesMap = new Map();
    let productsMap = new Map();

    if (payCourseIds.length > 0) {
      const { data: c } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', payCourseIds);
      (c || []).forEach((x) => coursesMap.set(x.id, x));
    }
    if (payProductIds.length > 0) {
      const { data: p } = await supabase
        .from('digital_products')
        .select('id, title')
        .in('id', payProductIds);
      (p || []).forEach((x) => productsMap.set(x.id, x));
    }

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