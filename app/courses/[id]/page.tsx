import { createClient } from '@/lib/supabase-server';
import { CourseDetailClient } from '@/components/courses/CourseDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('*, instructor:profiles(full_name, avatar_url)')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (!course) notFound();

  const { count: lessonCount } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id);

  // Number of students who enrolled in this course
  const { count: studentCount } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id);

  // Reviews / testimonials for this course
  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      'id, rating, review_text, created_at, user:profiles(full_name, avatar_url)'
    )
    .eq('course_id', id)
    .order('created_at', { ascending: false })
    .limit(30);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isEnrolled = false;
  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .maybeSingle();
    isEnrolled = !!enrollment;
  }

  return (
    <CourseDetailClient
      course={course}
      lessonCount={lessonCount || 0}
      studentCount={studentCount || 0}
      reviews={reviews || []}
      averageRating={Math.round(avgRating * 10) / 10}
      isLoggedIn={!!user}
      isEnrolled={isEnrolled}
    />
  );
}