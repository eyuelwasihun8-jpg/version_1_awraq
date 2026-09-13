import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courseId = request.nextUrl.searchParams.get('courseId');
  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  const { data: cert } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (!cert || !cert.certificate_url) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  const url = await getDownloadUrl(BUCKETS.certificates, cert.certificate_url, 600);

  return NextResponse.json({ url, certificate: cert });
}