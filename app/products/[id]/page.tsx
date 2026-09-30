import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminDb = createAdminClient();

  const { data: product } = await adminDb
    .from('digital_products')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (!product) notFound();

  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  let alreadyOwned = false;
  let pendingPaymentId: string | null = null;

  if (user) {
    const { data: purchase } = await adminDb
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', id)
      .eq('is_active', true)
      .maybeSingle();

    alreadyOwned = !!purchase;

    if (!alreadyOwned) {
      const { data: pending } = await adminDb
        .from('payment_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', 'digital_product')
        .eq('item_id', id)
        .eq('status', 'pending')
        .maybeSingle();

      pendingPaymentId = pending?.id || null;
    }
  }

  return (
    <ProductDetailClient
      product={product}
      isLoggedIn={!!user}
      alreadyOwned={alreadyOwned}
      pendingPaymentId={pendingPaymentId}
    />
  );
}