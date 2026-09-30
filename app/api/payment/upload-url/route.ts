import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';
import { rateLimit } from '@/lib/rate-limit';

const RATE_LIMIT = { max: 10, windowMs: 60 * 60 * 1000 };

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Magic-byte signatures (server-side true type check)
function detectImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  // PNG
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'image/png';
  // WEBP: "RIFF....WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp';
  return null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = rateLimit(`payment-upload:${user.id}`, RATE_LIMIT.max, RATE_LIMIT.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter || 3600) } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 15MB' }, { status: 400 });
    }

    const claimedMime = file.type?.toLowerCase() || '';
    if (!ALLOWED_MIME_TYPES[claimedMime]) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // True magic-byte check
    const realMime = detectImageType(buffer);
    if (!realMime || !ALLOWED_MIME_TYPES[realMime]) {
      return NextResponse.json(
        { error: 'File contents do not match a supported image format.' },
        { status: 400 }
      );
    }

    const extension = ALLOWED_MIME_TYPES[realMime];
    const fileKey = `${user.id}/${uuidv4()}.${extension}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKETS.receipts,
        Key: fileKey,
        Body: buffer,
        ContentType: realMime,
      })
    );

    return NextResponse.json({ success: true, fileKey });
  } catch (err: any) {
    console.error('Receipt upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload receipt' },
      { status: 500 }
    );
  }
}