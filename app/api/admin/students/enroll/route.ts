import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  let pw = '';
  for (let i = 0; i < length; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminDb = createAdminClient();

    // Verify staff using Admin Client (bypasses RLS blocks on profiles table)
    const { data: profile } = await adminDb
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      !profile.is_active ||
      !['super_admin', 'admin', 'sales'].includes(profile.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      // Student details
      studentId: existingStudentId,
      email,
      fullName,
      phone,
      password: customPassword,

      // Item & payment details
      itemType, // 'course' | 'digital_product'
      itemId,
      source = 'manual', // 'manual' | 'gift' | 'promotion'
      transactionNumber,
      notes,
      createPaymentRecord = true,
      amount,
    } = body;

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'itemType and itemId are required' },
        { status: 400 }
      );
    }

    let targetStudentId = existingStudentId;
    let generatedPassword = customPassword;

    // 1. CREATE STUDENT ACCOUNT IF NEW
    if (!targetStudentId) {
      if (!email?.trim() || !fullName?.trim()) {
        return NextResponse.json(
          { error: 'Email and full name are required for new students' },
          { status: 400 }
        );
      }

      generatedPassword =
        customPassword && String(customPassword).length >= 6
          ? String(customPassword)
          : generatePassword(10);

      // Create in Auth
      const { data: newUser, error: createErr } = await adminDb.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: generatedPassword,
        email_confirm: true, // Auto-confirm
        user_metadata: {
          full_name: fullName.trim(),
        },
      });

      if (createErr || !newUser.user) {
        return NextResponse.json(
          { error: createErr?.message || 'Failed to create student account' },
          { status: 500 }
        );
      }

      targetStudentId = newUser.user.id;

      // Update Profile
      const { error: profileErr } = await adminDb
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone?.trim() || null,
          role: 'student',
          is_active: true,
          onboarding_completed: true, // Skip onboarding for manual staff enrollments
        })
        .eq('id', targetStudentId);

      if (profileErr) {
        await adminDb.auth.admin.deleteUser(targetStudentId);
        return NextResponse.json({ error: profileErr.message }, { status: 500 });
      }
    }

    // 2. VERIFY ITEM EXISTS
    let itemTitle = '';
    let itemPrice = 0;

    if (itemType === 'course') {
      const { data: course } = await adminDb
        .from('courses')
        .select('id, title, price')
        .eq('id', itemId)
        .single();
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      itemTitle = course.title;
      itemPrice = course.price || 0;
    } else {
      const { data: product } = await adminDb
        .from('digital_products')
        .select('id, title, price')
        .eq('id', itemId)
        .single();
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      itemTitle = product.title;
      itemPrice = product.price || 0;
    }

    let paymentId: string | null = null;
    const finalAmount = source === 'gift' || source === 'promotion' ? 0 : (amount ?? itemPrice);

    // 3. CREATE BOOKKEEPING PAYMENT RECORD
    if (createPaymentRecord) {
      const { data: payment, error: payErr } = await adminDb
        .from('payment_requests')
        .insert({
          user_id: targetStudentId,
          item_type: itemType,
          item_id: itemId,
          amount: finalAmount,
          payment_method: source === 'manual' ? 'cbe' : 'telebirr',
          status: 'approved',
          transaction_number: transactionNumber?.trim() || `MANUAL-${Date.now()}`,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          receipt_image_key: null,
        })
        .select()
        .single();

      if (!payErr && payment) {
        paymentId = payment.id;
      }
    }

    // 4. GRANT ACCESS (ENROLLMENT / PURCHASE)
    if (itemType === 'course') {
      const { error: enrollErr } = await adminDb.from('enrollments').upsert(
        {
          user_id: targetStudentId,
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

      if (enrollErr) return NextResponse.json({ error: enrollErr.message }, { status: 500 });
    } else {
      const { error: purchaseErr } = await adminDb.from('purchases').upsert(
        {
          user_id: targetStudentId,
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

      if (purchaseErr) return NextResponse.json({ error: purchaseErr.message }, { status: 500 });
    }

    // 5. WRITE AUDIT LOG
    await adminDb.from('audit_logs').insert({
      actor_id: user.id,
      actor_role: profile.role,
      action: 'manual_enroll',
      target_type: itemType,
      target_id: itemId,
      details: {
        student_id: targetStudentId,
        student_name: fullName,
        source,
        transaction_number: transactionNumber || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${fullName} has been enrolled successfully!`,
      credentials: existingStudentId
        ? null
        : {
            email: email.trim().toLowerCase(),
            password: generatedPassword,
          },
      student: {
        id: targetStudentId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
      },
      item: {
        id: itemId,
        title: itemTitle,
        amount: finalAmount,
      },
    });
  } catch (err: any) {
    console.error('Enroll API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}