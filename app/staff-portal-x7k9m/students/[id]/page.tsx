import { createClient } from '@/lib/supabase-server';
import { StudentDetailClient } from '@/components/admin/StudentDetailClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentDetailPage({
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

  // Fetch sales reps for the assignment dropdown
  const { data: salesReps } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'sales')
    .eq('is_active', true)
    .order('full_name');

  return (
    <StudentDetailClient
      studentId={id}
      role={profile.role}
      salesReps={salesReps || []}
    />
  );
}