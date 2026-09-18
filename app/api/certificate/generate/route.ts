import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

function generateCertCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${year}-${random}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { courseId } = body;

  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  // 1. Get user profile for full name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const currentStudentName = profile?.full_name || 'Student';

  // 2. Fetch course & instructor info
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('id', courseId)
    .single();

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  let instructorName = 'Awraq Instructor';
  if (course.instructor_id) {
    const { data: instructor } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', course.instructor_id)
      .single();
    if (instructor?.full_name) instructorName = instructor.full_name;
  }

  // 3. Verify 100% course completion
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId);

  if (!lessons || lessons.length === 0) {
    return NextResponse.json({ error: 'No lessons found for this course' }, { status: 400 });
  }

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', user.id)
    .in('lesson_id', lessons.map((l) => l.id));

  const done = progress?.filter((p) => p.is_completed).length ?? 0;
  if (done < lessons.length) {
    return NextResponse.json(
      { error: 'Course not fully completed yet' },
      { status: 403 }
    );
  }

  // 4. Use Admin Client to safely read/write certificates
  const adminDb = createAdminClient();

  // Try to find existing certificate
  let { data: cert } = await adminDb
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  // 5. If it doesn't exist yet, insert a new row
  if (!cert) {
    const newCertCode = generateCertCode();
    const newIssuedAt = new Date().toISOString();

    const { data: insertedCert, error: insertErr } = await adminDb
      .from('certificates')
      .insert({
        user_id: user.id,
        course_id: courseId,
        student_name: currentStudentName,
        certificate_code: newCertCode,
        issued_at: newIssuedAt,
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      // If it failed due to unique constraint (already created in parallel), fetch existing
      if (insertErr.code === '23505') {
        const { data: existingCert } = await adminDb
          .from('certificates')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();
        
        cert = existingCert;
      } else {
        console.error('Certificate insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    } else {
      cert = insertedCert;
    }
  }

  if (!cert) {
    return NextResponse.json({ error: 'Failed to process certificate' }, { status: 500 });
  }

  const finalStudentName = cert.student_name || currentStudentName;
  const certCode = cert.certificate_code;
  const issuedAt = cert.issued_at || new Date().toISOString();

  const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://awraqskills.com';

  return NextResponse.json({
    success: true,
    data: {
      studentName: finalStudentName,
      courseName: course.title,
      instructorName,
      issueDate: formattedDate,
      certificateId: certCode,
      verificationUrl: `${appUrl}/verify/${certCode}`,
      organizationName: 'Awraq Skills',
    },
  });
}