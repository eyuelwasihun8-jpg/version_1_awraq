import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/turnstile';

/**
 * GET /api/certificate/verify/[code]
 * Public endpoint - verifies certificate authenticity by code.
 * Rate limited to prevent code enumeration attacks.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // Anti-enumeration rate limit: 30 requests per minute per IP
  const ip = getClientIp(request) || 'unknown';
  const rl = rateLimit(`cert-verify:${ip}`, 30, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many verification requests. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter || 60) } }
    );
  }

  const { code } = await params;

  if (!code || !code.trim()) {
    return NextResponse.json({ valid: false, error: 'Certificate code required' }, { status: 400 });
  }

  const cleanCode = code.trim().toUpperCase();

  // Basic format validation before hitting DB
  if (!/^CERT-\d{4}-[A-Z0-9]+$/i.test(cleanCode)) {
    return NextResponse.json({ valid: false, error: 'Invalid certificate format' }, { status: 400 });
  }

  const adminDb = createAdminClient();

  const { data: cert, error } = await adminDb
    .from('certificates')
    .select('id, certificate_code, student_name, issued_at, course_id, user_id')
    .eq('certificate_code', cleanCode)
    .maybeSingle();

  if (error) {
    console.error('Certificate verify error:', error);
    return NextResponse.json(
      { valid: false, error: 'Verification service unavailable' },
      { status: 500 }
    );
  }

  if (!cert) {
    return NextResponse.json(
      { valid: false, error: 'Certificate not found or invalid' },
      { status: 404 }
    );
  }

  // Fetch course info
  const { data: course } = await adminDb
    .from('courses')
    .select('id, title, instructor_id')
    .eq('id', cert.course_id)
    .single();

  // Fetch instructor name
  let instructorName = 'Awraq Instructor';
  if (course?.instructor_id) {
    const { data: instructor } = await adminDb
      .from('profiles')
      .select('full_name')
      .eq('id', course.instructor_id)
      .single();
    if (instructor?.full_name) instructorName = instructor.full_name;
  }

  const formattedDate = new Date(cert.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return NextResponse.json({
    valid: true,
    certificate: {
      certificateId: cert.certificate_code,
      studentName: cert.student_name,
      courseName: course?.title || 'Awraq Course',
      instructorName,
      issueDate: formattedDate,
      organizationName: 'Awraq Skills',
    },
  });
}