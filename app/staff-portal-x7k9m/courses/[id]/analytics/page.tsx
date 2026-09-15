import { createClient } from '@/lib/supabase-server';
import { CourseAnalyticsClient } from '@/components/admin/CourseAnalyticsClient';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CourseAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
  ) {
    redirect('/');
  }

  // Basic existence check
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('id', id)
    .single();

  if (!course) notFound();

  // Instructors only their courses
  if (profile.role === 'instructor' && course.instructor_id !== user.id) {
    notFound();
  }

  return <CourseAnalyticsClient courseId={id} role={profile.role} />;
}