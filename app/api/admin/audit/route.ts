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

  if (!profile || profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const page = Math.max(parseInt(sp.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(sp.get('limit') || '10', 10), 1), 50);
  const offset = (page - 1) * limit;
  const action = sp.get('action')?.trim() || '';

  let query = adminDb
    .from('audit_logs')
    .select('*, actor:profiles!audit_logs_actor_id_fkey(full_name, role)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (action) query = query.eq('action', action);

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count || 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return NextResponse.json({
    logs: data || [],
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