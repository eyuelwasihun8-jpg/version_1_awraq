import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getUploadUrl, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';
import { rateLimit } from '@/lib/rate-limit';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await rateLimit(`payment-upload:${user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many upload requests. Please wait.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter || 3600) } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const contentType: string = (body.contentType || '').toLowerCase();
    const size: number = Number(body.size || 0);

    if (!ALLOWED_MIME_TYPES[contentType]) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, or WebP images are allowed.' },
        { status: 400 }
      );
    }

    if (size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File must be under ${Math.round(MAX_SIZE_BYTES / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    const ext = ALLOWED_MIME_TYPES[contentType];
    const fileKey = `${user.id}/${uuidv4()}.${ext}`;

    const uploadUrl = await getUploadUrl(BUCKETS.receipts, fileKey, contentType, 600);

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (err: any) {
    console.error('payment upload-url error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}