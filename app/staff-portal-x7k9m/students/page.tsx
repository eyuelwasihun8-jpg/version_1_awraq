import { StudentsClient } from '@/components/admin/StudentsClient';
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Instructors can view students (restricted to their courses by API)
  if (!profile || !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)) {
    redirect('/');
  }

  // Fetch all courses for the filter dropdown
  let coursesQuery = supabase.from('courses').select('id, title').order('title');
  if (profile.role === 'instructor') {
    coursesQuery = coursesQuery.eq('instructor_id', user.id);
  }
  const { data: courses } = await coursesQuery;

  return <StudentsClient courses={courses || []} role={profile.role} />;
}