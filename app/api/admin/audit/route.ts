import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const action = request.nextUrl.searchParams.get('action');
  const actorId = request.nextUrl.searchParams.get('actorId');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '100');
  const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0');

  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      actor:profiles!audit_logs_actor_id_fkey ( id, full_name, role )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) query = query.eq('action', action);
  if (actorId) query = query.eq('actor_id', actorId);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + limit,
  });
}