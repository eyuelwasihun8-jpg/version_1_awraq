import { createClient } from '@/lib/supabase-server';
import { LessonEditorClient } from '@/components/admin/LessonEditorClient';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: courseId, lessonId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/staff-login-x7k9m');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'instructor'].includes(profile.role)) {
    redirect('/');
  }

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single();

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, course_modules(id, title)')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .single();

  if (!course || !lesson) notFound();

  return <LessonEditorClient course={course} initialLesson={lesson} />;
}