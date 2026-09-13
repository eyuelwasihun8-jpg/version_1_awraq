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
  const { lessonOrders } = body;
  // lessonOrders: [{ id, order_index, module_id? }]

  if (!Array.isArray(lessonOrders)) {
    return NextResponse.json({ error: 'lessonOrders must be an array' }, { status: 400 });
  }

  const results = await Promise.all(
    lessonOrders.map((lo: { id: string; order_index: number; module_id?: string }) => {
      const updates: Record<string, any> = { order_index: lo.order_index };
      if (lo.module_id) updates.module_id = lo.module_id;
      return supabase.from('lessons').update(updates).eq('id', lo.id);
    })
  );

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Some updates failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}