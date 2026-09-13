import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Staff roles only — never return students from this endpoint
const STAFF_ROLES = ['super_admin', 'admin', 'sales', 'instructor'] as const;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const role = request.nextUrl.searchParams.get('role'); // optional filter
  const search = request.nextUrl.searchParams.get('search')?.trim();
  const isActive = request.nextUrl.searchParams.get('active');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '50');
  const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0');

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .in('role', [...STAFF_ROLES]) // ← ONLY staff
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Optional: filter by one staff role
  if (role && role !== 'all' && STAFF_ROLES.includes(role as any)) {
    query = query.eq('role', role);
  }

  if (isActive === 'true') query = query.eq('is_active', true);
  if (isActive === 'false') query = query.eq('is_active', false);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    users: data ?? [],
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + limit,
  });
}