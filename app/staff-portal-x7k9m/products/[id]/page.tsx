import { createClient } from '@/lib/supabase-server';
import { ProductFormClient } from '@/components/admin/ProductFormClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from('digital_products').select('*').eq('id', id).single();
  if (!product) notFound();
  return <ProductFormClient product={product} />;
}