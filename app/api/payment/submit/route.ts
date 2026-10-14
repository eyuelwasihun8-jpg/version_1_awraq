import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { submitPaymentSchema } from '@/lib/validators';
import { createHandler, withAuth, withRateLimit } from '@/lib/api-handler';

const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000, keyPrefix: 'payment-submit' };

export const POST = createHandler(
  submitPaymentSchema,
  null,
  withRateLimit(
    withAuth(async (request) => {
      const { validatedData: body } = request;

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { itemType, itemId, paymentMethod, receiptImageKey } = body;

      // Existing active enrollment / purchase check
      if (itemType === 'course') {
        const { data: activeEnrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', itemId)
          .eq('is_active', true)
          .maybeSingle();

        if (activeEnrollment) {
          return NextResponse.json({ error: 'You are already enrolled in this course' }, { status: 400 });
        }
      } else {
        const { data: activePurchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', itemId)
          .eq('is_active', true)
          .maybeSingle();

        if (activePurchase) {
          return NextResponse.json({ error: 'You have already purchased this product' }, { status: 400 });
        }
      }

      // Pending payment check
      const { data: pendingPayment } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('status', 'pending')
        .maybeSingle();

      if (pendingPayment) {
        return NextResponse.json(
          { error: 'You already have a pending payment request for this item. Please wait for review.' },
          { status: 400 }
        );
      }

      // Server-side price lookup
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

      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
          amount: amount,
          payment_method: paymentMethod,
          receipt_image_key: receiptImageKey,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, payment: data });
    }, 'user'),
    RATE_LIMIT
  )
);