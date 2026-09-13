import { createClient } from '@/lib/supabase-server';
import { CourseOverviewClient } from '@/components/learn/CourseOverviewClient';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LearnCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrollment) redirect(`/courses/${courseId}`);

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (!course) notFound();

  // Fetch modules
  const { data: modules } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  // Fetch all published lessons in this course
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, lesson_type, duration_seconds, order_index, module_id, is_published')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const publishedLessons = (lessons || []).filter((l) => l.is_published !== false);

  // Group lessons under modules
  const modulesWithLessons = (modules || []).map((m) => ({
    ...m,
    lessons: publishedLessons.filter((l) => l.module_id === m.id),
  }));

  // Fetch progress
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', user.id)
    .in(
      'lesson_id',
      publishedLessons.map((l) => l.id)
    );

  return (
    <CourseOverviewClient
      course={course}
      modules={modulesWithLessons}
      allLessons={publishedLessons}
      progress={progress || []}
    />
  );
}