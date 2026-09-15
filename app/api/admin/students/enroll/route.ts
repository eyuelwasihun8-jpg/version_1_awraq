import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'sales'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const {
    studentId,
    itemType, // 'course' | 'digital_product'
    itemId,
    source = 'manual', // 'manual' | 'gift' | 'promotion'
    transactionNumber,
    notes,
    createPaymentRecord = true,
    amount,
  } = body;

  if (!studentId || !itemType || !itemId) {
    return NextResponse.json(
      { error: 'studentId, itemType and itemId are required' },
      { status: 400 }
    );
  }

  if (!['course', 'digital_product'].includes(itemType)) {
    return NextResponse.json({ error: 'Invalid itemType' }, { status: 400 });
  }

  if (!['manual', 'gift', 'promotion', 'purchase'].includes(source)) {
    return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
  }

  const adminDb = createAdminClient();

  // Verify student exists
  const { data: student } = await adminDb
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', studentId)
    .single();

  if (!student || student.role !== 'student') {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // Verify item exists
  if (itemType === 'course') {
    const { data: course } = await adminDb
      .from('courses')
      .select('id, title, price')
      .eq('id', itemId)
      .single();
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
  } else {
    const { data: product } = await adminDb
      .from('digital_products')
      .select('id, title, price')
      .eq('id', itemId)
      .single();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
  }

  let paymentId: string | null = null;

  // Optionally create an approved payment record (for bookkeeping)
  if (createPaymentRecord) {
    // Get item price if amount not provided
    let finalAmount = amount;
    if (finalAmount === undefined || finalAmount === null) {
      if (itemType === 'course') {
        const { data: c } = await adminDb
          .from('courses')
          .select('price')
          .eq('id', itemId)
          .single();
        finalAmount = c?.price || 0;
      } else {
        const { data: p } = await adminDb
          .from('digital_products')
          .select('price')
          .eq('id', itemId)
          .single();
        finalAmount = p?.price || 0;
      }
    }

    // For free/gift, amount can be 0
    if (source === 'gift' || source === 'promotion') {
      finalAmount = 0;
    }

    const { data: payment, error: payErr } = await adminDb
      .from('payment_requests')
      .insert({
        user_id: studentId,
        item_type: itemType,
        item_id: itemId,
        amount: finalAmount,
        payment_method: source === 'manual' ? 'cbe' : 'other',
        status: 'approved',
        transaction_number:
          transactionNumber?.trim() ||
          `MANUAL-${Date.now()}`,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        receipt_image_key: null,
      })
      .select()
      .single();

    if (payErr) {
      // If payment_method check fails on 'other', fall back
      console.error('Payment create error:', payErr);
      // Continue without payment record if schema is strict
    } else {
      paymentId = payment.id;
    }
  }

  // Grant access
  if (itemType === 'course') {
    const { error: enrollErr } = await adminDb.from('enrollments').upsert(
      {
        user_id: studentId,
        course_id: itemId,
        payment_request_id: paymentId,
        enrolled_by: user.id,
        enrollment_source: source,
        notes: notes?.trim() || null,
        is_active: true,
        enrolled_at: new Date().toISOString(),
        revoked_at: null,
        revoked_by: null,
        revoke_reason: null,
      },
      { onConflict: 'user_id,course_id' }
    );

    if (enrollErr) {
      return NextResponse.json({ error: enrollErr.message }, { status: 500 });
    }
  } else {
    const { error: purchaseErr } = await adminDb.from('purchases').upsert(
      {
        user_id: studentId,
        product_id: itemId,
        payment_request_id: paymentId,
        enrolled_by: user.id,
        enrollment_source: source,
        notes: notes?.trim() || null,
        is_active: true,
        purchased_at: new Date().toISOString(),
        revoked_at: null,
        revoked_by: null,
        revoke_reason: null,
      },
      { onConflict: 'user_id,product_id' }
    );

    if (purchaseErr) {
      return NextResponse.json({ error: purchaseErr.message }, { status: 500 });
    }
  }

  // Audit
  await adminDb.from('audit_logs').insert({
    actor_id: user.id,
    actor_role: profile.role,
    action: 'manual_enroll',
    target_type: itemType,
    target_id: itemId,
    details: {
      student_id: studentId,
      student_name: student.full_name,
      source,
      transaction_number: transactionNumber || null,
      notes: notes || null,
      payment_id: paymentId,
    },
  });

  return NextResponse.json({
    success: true,
    message: `${student.full_name} has been enrolled successfully`,
    paymentId,
  });
}