import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { downloadQuerySchema } from '@/lib/validators';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';
import { createHandler, withAuth } from '@/lib/api-handler';

export const GET = createHandler(
  null,
  downloadQuerySchema,
  withAuth(async (request) => {
    const { validatedQuery } = request;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId } = validatedQuery;

    // Must be an active purchase (revoked purchases blocked)
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('is_active', true)
      .maybeSingle();

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
  }, 'user')
);