import { createClient } from '@/lib/supabase-server';
import { LessonClient } from '@/components/learn/LessonClient';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: courseId, lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrollment) redirect(`/courses/${courseId}`);

  // Course info
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, thumbnail_url')
    .eq('id', courseId)
    .single();

  // All modules for this course
  const { data: modules } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  // All published lessons for this course
  const { data: allLessonsRaw } = await supabase
    .from('lessons')
    .select('id, title, order_index, lesson_type, duration_seconds, module_id, is_published')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const publishedLessons = (allLessonsRaw || []).filter((l) => l.is_published !== false);

  // Verify current lesson exists AND is published
  const currentLesson = publishedLessons.find((l) => l.id === lessonId);
  if (!course || !currentLesson) notFound();

  // Group lessons under modules
  const modulesWithLessons = (modules || []).map((m) => ({
    ...m,
    lessons: publishedLessons.filter((l) => l.module_id === m.id),
  }));

  // Determine prev / next based on flat published order
  const currentIdx = publishedLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? publishedLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < publishedLessons.length - 1 ? publishedLessons[currentIdx + 1] : null;

  // Full data for current lesson (includes text_content, video_key, quiz_data)
  const { data: lessonFull } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  // All progress for sidebar checkmarks
  const { data: allProgress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', user.id)
    .in('lesson_id', publishedLessons.map((l) => l.id));

  const currentProgress = allProgress?.find((p) => p.lesson_id === lessonId) || null;

  return (
    <LessonClient
      course={course}
      lesson={lessonFull}
      modules={modulesWithLessons}
      allLessons={publishedLessons}
      allProgress={allProgress || []}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      initialProgress={currentProgress}
      lessonNumber={currentIdx + 1}
    />
  );
}