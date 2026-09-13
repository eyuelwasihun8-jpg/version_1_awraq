import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if user is admin or sales
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin', 'admin', 'sales'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { paymentId, transactionNumber } = body;

  // Your database constraint requires this!
  if (!transactionNumber) {
    return NextResponse.json({ error: 'Transaction number is required to approve' }, { status: 400 });
  }

  // Update DB. The handle_payment_approval trigger we wrote in SQL will automatically 
  // create the enrollment and log the audit trail.
  const { data, error } = await supabase
    .from('payment_requests')
    .update({
      status: 'approved',
      transaction_number: transactionNumber,
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