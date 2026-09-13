import { createClient } from '@/lib/supabase-server';
import { UserEditClient } from '@/components/admin/UserEditClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (!user) notFound();

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser!.id)
    .single();

  return <UserEditClient user={user} currentRole={currentProfile?.role || 'admin'} />;
}