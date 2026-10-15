import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getUploadUrl, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';
import { rateLimit } from '@/lib/rate-limit';

const MAX_SIZE_BYTES = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await rateLimit(`upload-url:${user.id}`, 30, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many upload requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter || 60) } }
    );
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

    const safeFolder = folder.startsWith(user.id) ? folder : `${folder}/${user.id}`;
    const fileKey = `${safeFolder}/${uuidv4()}.${ext}`;

    const uploadUrl = await getUploadUrl(BUCKETS.content, fileKey, contentType, 600);

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (err: any) {
    console.error('upload-url (user) error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}