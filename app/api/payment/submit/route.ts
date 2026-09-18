import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { itemType, itemId, paymentMethod, receiptImageKey } = body;

  if (!itemType || !itemId || !paymentMethod || !receiptImageKey) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate itemType
  if (!['course', 'digital_product'].includes(itemType)) {
    return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
  }

  // Validate paymentMethod
  if (!['cbe', 'telebirr'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  }

  // SERVER-SIDE PRICE LOOKUP: Never trust client-provided amount
  // Use admin client to bypass RLS for price lookup
  const adminDb = createAdminClient();
  let amount = 0;

  if (itemType === 'course') {
    const { data: course, error: courseError } = await adminDb
      .from('courses')
      .select('price')
      .eq('id', itemId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    amount = Number(course.price || 0);
  } else {
    const { data: product, error: productError } = await adminDb
      .from('digital_products')
      .select('price')
      .eq('id', itemId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    amount = Number(product.price || 0);
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
  }

  // Insert into payment_requests table with server-computed amount
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