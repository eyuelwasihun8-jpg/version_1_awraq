import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { CoursesListClient } from '@/components/courses/CoursesListClient';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const supabase = await createClient();
  const adminDb = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: courses }, { data: products }] = await Promise.all([
    adminDb
      .from('courses')
      .select('*, instructor:profiles(full_name, avatar_url)')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    adminDb
      .from('digital_products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ]);

  let enrolledCourseIds: string[] = [];
  let completedCourseIds: string[] = [];
  let purchasedProductIds: string[] = [];

  if (user) {
    const [{ data: enrollments }, { data: purchases }] = await Promise.all([
      adminDb
        .from('enrollments')
        .select('course_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true),
      adminDb
        .from('purchases')
        .select('product_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true),
    ]);

    enrolledCourseIds = (enrollments || []).map((e) => e.course_id);
    purchasedProductIds = (purchases || []).map((p) => p.product_id);

    if (enrolledCourseIds.length > 0) {
      const { data: progress } = await adminDb
        .from('student_progress_summary')
        .select('course_id, progress_percent')
        .eq('user_id', user.id)
        .eq('enrollment_active', true)
        .in('course_id', enrolledCourseIds);

      completedCourseIds = (progress || [])
        .filter((p) => Number(p.progress_percent) >= 100)
        .map((p) => p.course_id);
    }
  }

  return (
    <CoursesListClient
      initialCourses={courses || []}
      initialProducts={products || []}
      enrolledCourseIds={enrolledCourseIds}
      completedCourseIds={completedCourseIds}
      purchasedProductIds={purchasedProductIds}
      isLoggedIn={!!user}
    />
  );
}