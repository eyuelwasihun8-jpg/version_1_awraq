import { createClient } from '@/lib/supabase-server';
import { CoursesListClient } from '@/components/courses/CoursesListClient';

export const dynamic = 'force-dynamic';

async function getCourses() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('courses')
    .select('*, instructor:profiles(full_name, avatar_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function CoursesPage() {
  const courses = await getCourses();
  return <CoursesListClient initialCourses={courses} />;
}