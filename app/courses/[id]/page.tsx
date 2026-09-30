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
    .eq('course_id', id)
    .neq('is_published', false);

  // Active enrollments only
  const { count: studentCount } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)
    .eq('is_active', true);

  // ONLY published reviews, max 6 (2 rows × 3)
  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('id, rating, review_text, created_at, user_id')
    .eq('course_id', id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6);

  const userIds = Array.from(new Set((reviewsRaw || []).map((r) => r.user_id)));
  let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);
    (profiles || []).forEach((p) => profileMap.set(p.id, p));
  }

  const reviews = (reviewsRaw || []).map((r) => ({
    ...r,
    user: profileMap.get(r.user_id) || null,
  }));

  // Average from ALL published reviews
  const { data: allPublished } = await supabase
    .from('reviews')
    .select('rating')
    .eq('course_id', id)
    .eq('is_published', true);

  const avgRating =
    allPublished && allPublished.length > 0
      ? allPublished.reduce((sum, r) => sum + r.rating, 0) / allPublished.length
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
      .eq('is_active', true)
      .maybeSingle();
    isEnrolled = !!enrollment;
  }

  return (
    <CourseDetailClient
      course={course}
      lessonCount={lessonCount || 0}
      studentCount={studentCount || 0}
      reviews={reviews}
      averageRating={Math.round(avgRating * 10) / 10}
      totalReviews={allPublished?.length || 0}
      isLoggedIn={!!user}
      isEnrolled={isEnrolled}
    />
  );
}