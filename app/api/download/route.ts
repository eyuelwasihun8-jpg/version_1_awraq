import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const productId = request.nextUrl.searchParams.get('productId');
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 });
  }

  // Verify purchase
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single();

  if (!purchase) {
    return NextResponse.json({ error: 'Not purchased' }, { status: 403 });
  }

  const { data: product } = await supabase
    .from('digital_products')
    .select('file_key, title')
    .eq('id', productId)
    .single();

  if (!product || !product.file_key) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const url = await getDownloadUrl(BUCKETS.content, product.file_key, 600);

  return NextResponse.json({ url, title: product.title });
}