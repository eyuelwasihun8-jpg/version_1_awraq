import { createClient } from '@/lib/supabase-server';
import { PurchaseClient } from '@/components/purchase/PurchaseClient';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PurchasePage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;

  if (type !== 'course' && type !== 'digital_product') {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  let item: any = null;
  if (type === 'course') {
    const { data } = await supabase
      .from('courses')
      .select('id, title, description, price, thumbnail_url')
      .eq('id', id)
      .eq('is_published', true)
      .single();
    item = data;
  } else {
    const { data } = await supabase
      .from('digital_products')
      .select('id, title, description, price, thumbnail_url')
      .eq('id', id)
      .eq('is_published', true)
      .single();
    item = data;
  }

  if (!item) notFound();

  const { data: existing } = await supabase
    .from('payment_requests')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('item_type', type)
    .eq('item_id', id)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existing?.status === 'approved') {
    if (type === 'course') redirect(`/learn/${id}`);
    else redirect('/dashboard');
  }

  if (existing?.status === 'pending') {
    redirect(`/purchase/waiting/${existing.id}`);
  }

  return <PurchaseClient item={item} itemType={type as 'course' | 'digital_product'} />;
}