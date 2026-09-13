import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getUploadUrl, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

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

  if (!profile || !['super_admin', 'admin', 'instructor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const contentType = body.contentType || 'application/octet-stream';
  const folder = body.folder || 'uploads';

  const ext = (contentType.split('/')[1] || 'bin').split(';')[0];
  const fileKey = `${folder}/${uuidv4()}.${ext}`;

  try {
    const uploadUrl = await getUploadUrl(BUCKETS.content, fileKey, contentType, 900);
    return NextResponse.json({ uploadUrl, fileKey });
  } catch (err: any) {
    console.error('upload-url error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create upload URL' }, { status: 500 });
  }
}