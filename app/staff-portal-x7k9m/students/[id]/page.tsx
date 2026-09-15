import { createClient } from '@/lib/supabase-server';
import { StudentDetailClient } from '@/components/admin/StudentDetailClient';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)) {
    redirect('/');
  }

  // Pass token/auth implicitly via client component fetch
  // We'll let the client component fetch the data so it handles loading states nicely
  return <StudentDetailClient studentId={id} role={profile.role} />;
}