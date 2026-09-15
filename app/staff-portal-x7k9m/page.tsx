import { createClient } from '@/lib/supabase-server';
import { StaffDashboardClient } from '@/components/admin/StaffDashboardClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StaffOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
  ) {
    redirect('/');
  }

  return (
    <StaffDashboardClient
      role={profile.role}
      name={profile.full_name || 'Staff'}
    />
  );
}