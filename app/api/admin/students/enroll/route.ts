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
      studentId: existingStudentId,
      email,
      fullName,
      phone,
      password: customPassword,
      gender,
      ageGroup,
      lifeStatus,
      itemType,
      itemId,
      source = 'manual',
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
    let finalFullName = fullName?.trim() || '';
    let finalEmail = email?.trim()?.toLowerCase() || '';
    let finalPhone = phone?.trim() || null;

    // CREATE NEW STUDENT IF NEEDED
    if (!targetStudentId) {
      if (!finalEmail || !finalFullName) {
        return NextResponse.json(
          { error: 'Email and full name are required for new students' },
          { status: 400 }
        );
      }

      if (!gender || !ageGroup || !lifeStatus) {
        return NextResponse.json(
          { error: 'Gender, age group, and life status are required' },
          { status: 400 }
        );
      }

      generatedPassword =
        customPassword && String(customPassword).length >= 6
          ? String(customPassword)
          : generatePassword(10);

      const { data: newUser, error: createErr } = await adminDb.auth.admin.createUser({
        email: finalEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          full_name: finalFullName,
        },
      });

      if (createErr || !newUser.user) {
        return NextResponse.json(
          { error: createErr?.message || 'Failed to create student account' },
          { status: 500 }
        );
      }

      targetStudentId = newUser.user.id;

      const { error: profileErr } = await adminDb
        .from('profiles')
        .update({
          full_name: finalFullName,
          phone: finalPhone,
          gender: gender || null,
          age_group: ageGroup || null,
          life_status: lifeStatus || null,
          role: 'student',
          is_active: true,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetStudentId);

      if (profileErr) {
        await adminDb.auth.admin.deleteUser(targetStudentId);
        return NextResponse.json({ error: profileErr.message }, { status: 500 });
      }
    } else {
      // Existing student: load name/email for response
      const { data: existingProfile } = await adminDb
        .from('profiles')
        .select('full_name, phone')
        .eq('id', targetStudentId)
        .single();

      const { data: authUser } = await adminDb.auth.admin.getUserById(targetStudentId);

      finalFullName = existingProfile?.full_name || finalFullName || 'Student';
      finalEmail = authUser?.user?.email || finalEmail;
      finalPhone = existingProfile?.phone || finalPhone;
    }

    // VERIFY ITEM
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
      itemPrice = Number(course.price || 0);
    } else {
      const { data: product } = await adminDb
        .from('digital_products')
        .select('id, title, price')
        .eq('id', itemId)
        .single();
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      itemTitle = product.title;
      itemPrice = Number(product.price || 0);
    }

    let paymentId: string | null = null;
    const finalAmount =
      source === 'gift' || source === 'promotion' ? 0 : amount ?? itemPrice;

    // CREATE PAYMENT RECORD
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

    // GRANT ACCESS
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

      if (enrollErr) {
        return NextResponse.json({ error: enrollErr.message }, { status: 500 });
      }
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

      if (purchaseErr) {
        return NextResponse.json({ error: purchaseErr.message }, { status: 500 });
      }
    }

    // AUDIT
    await adminDb.from('audit_logs').insert({
      actor_id: user.id,
      actor_role: profile.role,
      action: 'manual_enroll',
      target_type: itemType,
      target_id: itemId,
      details: {
        student_id: targetStudentId,
        student_name: finalFullName,
        gender: gender || null,
        age_group: ageGroup || null,
        life_status: lifeStatus || null,
        source,
        transaction_number: transactionNumber || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${finalFullName} has been enrolled successfully!`,
      credentials: existingStudentId
        ? null
        : {
            email: finalEmail,
            password: generatedPassword,
          },
      student: {
        id: targetStudentId,
        fullName: finalFullName,
        email: finalEmail,
        phone: finalPhone,
        gender: gender || null,
        ageGroup: ageGroup || null,
        lifeStatus: lifeStatus || null,
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