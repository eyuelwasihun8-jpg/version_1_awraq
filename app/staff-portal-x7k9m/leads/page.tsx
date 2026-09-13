import { createClient } from '@/lib/supabase-server';
import { LeadsClient } from '@/components/admin/LeadsClient';

export const dynamic = 'force-dynamic';

async function getLeads() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('onboarding_completed', true)
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function LeadsPage() {
  const leads = await getLeads();
  return <LeadsClient initialLeads={leads} />;
}