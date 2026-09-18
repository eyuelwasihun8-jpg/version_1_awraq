import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = createAdminClient();

  const { data: cert } = await supabase
    .from('certificates')
    .select(`
      student_name,
      issued_at,
      certificate_code,
      courses ( title, instructor_id )
    `)
    .eq('certificate_code', code.toUpperCase())
    .maybeSingle();

  if (!cert) {
    return NextResponse.json(
      { valid: false, message: 'Certificate not found' },
      { status: 404 }
    );
  }

  let instructorName = 'Awraq Instructor';
  const courseData = cert.courses as any;

  if (courseData?.instructor_id) {
    const { data: instructor } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', courseData.instructor_id)
      .single();
    if (instructor?.full_name) instructorName = instructor.full_name;
  }

  const formattedDate = new Date(cert.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://awraqskills.com';

  return NextResponse.json({
    valid: true,
    data: {
      studentName: cert.student_name,
      courseName: courseData?.title || 'Digital Marketing',
      instructorName,
      issueDate: formattedDate,
      certificateId: cert.certificate_code,
      verificationUrl: `${appUrl}/verify/${cert.certificate_code}`,
      organizationName: 'Awraq Skills',
    },
  });
}