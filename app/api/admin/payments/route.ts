import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'sales'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get('status');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '50');
  const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0');

  try {
    // Simple query — no joins
    let query = supabase
      .from('payment_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('Payments query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json({ payments: [], total: 0, hasMore: false });
    }

    // Manually enrich each row (safer than SQL joins)
    const userIds = Array.from(new Set(payments.map((p) => p.user_id).filter(Boolean)));
    const reviewerIds = Array.from(new Set(payments.map((p) => p.reviewed_by).filter(Boolean)));
    const allProfileIds = Array.from(new Set([...userIds, ...reviewerIds]));

    // Fetch profiles
    let profilesMap = new Map();
    if (allProfileIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', allProfileIds);
      (profiles || []).forEach((p) => profilesMap.set(p.id, p));
    }

    // Fetch items
    const courseIds = payments.filter((p) => p.item_type === 'course').map((p) => p.item_id);
    const productIds = payments.filter((p) => p.item_type === 'digital_product').map((p) => p.item_id);

    let coursesMap = new Map();
    let productsMap = new Map();

    if (courseIds.length > 0) {
      const { data: courses } = await supabase.from('courses').select('id, title').in('id', courseIds);
      (courses || []).forEach((c) => coursesMap.set(c.id, c));
    }
    if (productIds.length > 0) {
      const { data: products } = await supabase.from('digital_products').select('id, title').in('id', productIds);
      (products || []).forEach((p) => productsMap.set(p.id, p));
    }

    // Build final response
    const enriched = await Promise.all(
      payments.map(async (p) => {
        let receiptUrl = null;
        if (p.receipt_image_key) {
          try {
            receiptUrl = await getDownloadUrl(BUCKETS.receipts, p.receipt_image_key, 600);
          } catch (err) {
            console.error('Signed URL error:', err);
          }
        }

        let itemTitle = null;
        if (p.item_type === 'course') {
          itemTitle = coursesMap.get(p.item_id)?.title || null;
        } else if (p.item_type === 'digital_product') {
          itemTitle = productsMap.get(p.item_id)?.title || null;
        }

        return {
          ...p,
          receipt_url: receiptUrl,
          item_title: itemTitle,
          user: profilesMap.get(p.user_id) || null,
          reviewer: profilesMap.get(p.reviewed_by) || null,
        };
      })
    );

    return NextResponse.json({
      payments: enriched,
      total: count ?? 0,
      hasMore: (count ?? 0) > offset + limit,
    });
  } catch (err: any) {
    console.error('Payments handler error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}