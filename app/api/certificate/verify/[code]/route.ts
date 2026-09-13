import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

// Public endpoint — no auth required
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Use admin client to bypass RLS for public verification
  const supabase = createAdminClient();

  const { data: cert } = await supabase
    .from('certificates')
    .select(`
      student_name,
      issued_at,
      certificate_code,
      courses ( title )
    `)
    .eq('certificate_code', code)
    .maybeSingle();

  if (!cert) {
    return NextResponse.json({ valid: false, message: 'Certificate not found' }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    studentName: cert.student_name,
    courseName: (cert.courses as any)?.title,
    issuedAt: cert.issued_at,
    code: cert.certificate_code,
  });
}