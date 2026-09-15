import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

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
  const search = sp.get('search')?.trim() || '';
  const page = Math.max(parseInt(sp.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(sp.get('limit') || '10', 10), 1), 50);
  const offset = (page - 1) * limit;

  // Sales sees only assigned
  let query = adminDb
    .from('profiles')
    .select('id, full_name, phone, gender, age_group, life_status, created_at, assigned_to', {
      count: 'exact',
    })
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (profile.role === 'sales') {
    query = query.eq('assigned_to', user.id);
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count || 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return NextResponse.json({
    leads: data || [],
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