import { NextRequest, NextResponse } from 'next/server';
import { requireStaff, getAdminClient } from '@/lib/auth';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';
import { handleApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    await requireStaff();

    const adminDb = getAdminClient();
    const sp = request.nextUrl.searchParams;
    const status = sp.get('status') || 'pending';
    const page = Math.max(parseInt(sp.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(sp.get('limit') || '10', 10), 1), 50);
    const offset = (page - 1) * limit;
    const search = sp.get('search')?.trim() || '';

    // If search term is provided, search profiles first to get matching user_ids
    let matchingUserIds: string[] = [];
    if (search) {
      const { data: matchedProfiles } = await adminDb
        .from('profiles')
        .select('id')
        .or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);

      if (matchedProfiles) {
        matchingUserIds = matchedProfiles.map((p) => p.id);
      }
    }

    let query = adminDb
      .from('payment_requests')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      if (matchingUserIds.length > 0) {
        query = query.or(
          `transaction_number.ilike.%${search}%,user_id.in.(${matchingUserIds.join(',')})`
        );
      } else {
        query = query.ilike('transaction_number', `%${search}%`);
      }
    }

    // Apply DB range pagination
    const { data: payments, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    // Fetch student profiles for payments on this page
    const userIds = Array.from(new Set((payments || []).map((p) => p.user_id)));
    const profilesMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: profiles } = await adminDb
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .in('id', userIds);
      (profiles || []).forEach((p) => profilesMap.set(p.id, p));
    }

    // Fetch Item Titles (Courses & Digital Products)
    const courseIds = (payments || []).filter((p) => p.item_type === 'course').map((p) => p.item_id);
    const productIds = (payments || [])
      .filter((p) => p.item_type === 'digital_product')
      .map((p) => p.item_id);

    const coursesMap = new Map<string, string>();
    const productsMap = new Map<string, string>();

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

    // Enrich with receipts, profile data, and item titles
    const enriched = await Promise.all(
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
              ? coursesMap.get(p.item_id) || 'Unknown Course'
              : productsMap.get(p.item_id) || 'Unknown Product',
          receipt_url: receiptUrl,
        };
      })
    );

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
  } catch (error) {
    return handleApiError(error);
  }
}