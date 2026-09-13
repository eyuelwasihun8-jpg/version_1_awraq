import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { NewStaffClient } from '@/components/admin/NewStaffClient';

export const dynamic = 'force-dynamic';

export default async function NewStaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile?.role !== 'super_admin') {
    redirect(`/${process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m'}/users`);
  }

  return <NewStaffClient />;
}