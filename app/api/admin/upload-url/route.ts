import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getUploadUrl, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIZE_BYTES = 500 * 1024 * 1024;

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

  try {
    const body = await request.json().catch(() => ({}));
    const contentType: string = body.contentType || 'application/octet-stream';
    const folder: string = (body.folder || 'uploads').replace(/^\/+|\/+$/g, '');
    const filename: string = body.filename || '';
    const size: number = Number(body.size || 0);

    if (size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${Math.round(MAX_SIZE_BYTES / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    const rawExt =
      filename && filename.includes('.')
        ? filename.split('.').pop() || 'bin'
        : contentType.split('/')[1] || 'bin';

    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';

    const fileKey = `${folder}/${uuidv4()}.${ext}`;

    const uploadUrl = await getUploadUrl(BUCKETS.content, fileKey, contentType, 900);

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (err: any) {
    console.error('upload-url (admin) error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}