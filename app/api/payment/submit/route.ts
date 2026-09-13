import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { itemType, itemId, amount, paymentMethod, receiptImageKey } = body;

  if (!itemType || !itemId || !amount || !paymentMethod || !receiptImageKey) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Insert into payment_requests table. Status defaults to 'pending'
  const { data, error } = await supabase
    .from('payment_requests')
    .insert({
      user_id: user.id,
      item_type: itemType,
      item_id: itemId,
      amount: amount,
      payment_method: paymentMethod,
      receipt_image_key: receiptImageKey,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, payment: data });
}