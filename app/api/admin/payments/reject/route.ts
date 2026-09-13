import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin', 'admin', 'sales'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { paymentId, rejectionReason } = body;

  // Your database constraint requires this!
  if (!rejectionReason) {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('payment_requests')
    .update({
      status: 'rejected',
      rejection_reason: rejectionReason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, payment: data });
}