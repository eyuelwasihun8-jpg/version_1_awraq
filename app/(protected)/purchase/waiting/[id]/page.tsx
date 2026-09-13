import { createClient } from '@/lib/supabase-server';
import { WaitingClient } from '@/components/purchase/WaitingClient';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function WaitingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: paymentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: payment } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .single();

  if (!payment) notFound();

  return <WaitingClient initialPayment={payment} />;
}