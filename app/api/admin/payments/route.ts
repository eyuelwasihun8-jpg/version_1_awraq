import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: profile } = await adminDb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'sales'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const status = sp.get('status') || 'pending';
  const page = Math.max(parseInt(sp.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(sp.get('limit') || '10', 10), 1), 50);
  const offset = (page - 1) * limit;
  const search = sp.get('search')?.trim() || '';

  let query = adminDb
    .from('payment_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: payments, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with user names + receipt URLs
  const userIds = Array.from(new Set((payments || []).map((p) => p.user_id)));
  let profilesMap = new Map();
  if (userIds.length > 0) {
    const { data: profiles } = await adminDb
      .from('profiles')
      .select('id, full_name, phone, avatar_url')
      .in('id', userIds);
    (profiles || []).forEach((p) => profilesMap.set(p.id, p));
  }

  // Item titles
  const courseIds = (payments || []).filter((p) => p.item_type === 'course').map((p) => p.item_id);
  const productIds = (payments || [])
    .filter((p) => p.item_type === 'digital_product')
    .map((p) => p.item_id);

  const coursesMap = new Map();
  const productsMap = new Map();

  if (courseIds.length > 0) {
    const { data: courses } = await adminDb.from('courses').select('id, title').in('id', courseIds);
    (courses || []).forEach((c) => coursesMap.set(c.id, c.title));
  }
  if (productIds.length > 0) {
    const { data: products } = await adminDb
      .from('digital_products')
      .select('id, title')
      .in('id', productIds);
    (products || []).forEach((p) => productsMap.set(p.id, p.title));
  }

  let enriched = await Promise.all(
    (payments || []).map(async (p) => {
      let receiptUrl = null;
      if (p.receipt_image_key) {
        try {
          receiptUrl = await getDownloadUrl(BUCKETS.receipts, p.receipt_image_key, 600);
        } catch {}
      }
      const profile = profilesMap.get(p.user_id);
      return {
        ...p,
        student_name: profile?.full_name || 'Unknown',
        student_phone: profile?.phone || null,
        student_avatar: profile?.avatar_url || null,
        item_title:
          p.item_type === 'course'
            ? coursesMap.get(p.item_id)
            : productsMap.get(p.item_id) || 'Unknown',
        receipt_url: receiptUrl,
      };
    })
  );

  // Optional client-side-ish search filter after enrich
  if (search) {
    const q = search.toLowerCase();
    enriched = enriched.filter(
      (p) =>
        p.student_name?.toLowerCase().includes(q) ||
        p.item_title?.toLowerCase().includes(q) ||
        p.transaction_number?.toLowerCase().includes(q)
    );
  }

  const total = count || 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return NextResponse.json({
    payments: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
  });
}