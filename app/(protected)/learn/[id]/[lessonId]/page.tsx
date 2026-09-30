import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
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

  // Verify active enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('is_active', true)
    .maybeSingle();

  if (!enrollment) redirect(`/courses/${courseId}`);

  const adminDb = createAdminClient();

  // Course info
  const { data: course } = await adminDb
    .from('courses')
    .select('id, title, thumbnail_url')
    .eq('id', courseId)
    .single();

  // Modules
  const { data: modules } = await adminDb
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  // Published lessons
  const { data: allLessonsRaw } = await adminDb
    .from('lessons')
    .select('id, title, order_index, lesson_type, duration_seconds, module_id, is_published')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const publishedLessons = (allLessonsRaw || []).filter((l) => l.is_published !== false);

  const currentLesson = publishedLessons.find((l) => l.id === lessonId);
  if (!course || !currentLesson) notFound();

  const modulesWithLessons = (modules || []).map((m) => ({
    ...m,
    lessons: publishedLessons.filter((l) => l.module_id === m.id),
  }));

  const currentIdx = publishedLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? publishedLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < publishedLessons.length - 1 ? publishedLessons[currentIdx + 1] : null;

  // Full data for current lesson
  const { data: lessonFull } = await adminDb
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  // Progress via adminDb to bypass stale session cookies in RSC
  const { data: allProgress } = await adminDb
    .from('lesson_progress')
    .select('lesson_id, is_completed, watch_seconds, scroll_percentage')
    .eq('user_id', user.id)
    .in('lesson_id', publishedLessons.map((l) => l.id));

  const currentProgress = allProgress?.find((p) => p.lesson_id === lessonId) || null;

  return (
    <LessonClient
      key={lessonId}
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