import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'instructor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { moduleOrders } = body; // Array of { id, order_index }

  if (!Array.isArray(moduleOrders)) {
    return NextResponse.json({ error: 'moduleOrders must be an array' }, { status: 400 });
  }

  const results = await Promise.all(
    moduleOrders.map((m: { id: string; order_index: number }) =>
      supabase.from('course_modules').update({ order_index: m.order_index }).eq('id', m.id)
    )
  );

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Some updates failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}