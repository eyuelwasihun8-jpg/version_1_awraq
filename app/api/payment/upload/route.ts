import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase-server';
import { BUCKETS, r2 } from '@/lib/r2';
import { rateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;

const MAX_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Please select a receipt image' }, { status: 400 });
  }

  const contentType = file.type.toLowerCase();
  const extension = ALLOWED_MIME_TYPES[contentType];
  if (!extension) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPEG, PNG, or WebP images are allowed.' },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'The selected receipt image is empty.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Receipt image must not exceed 4 MB after compression.' },
      { status: 400 }
    );
  }

  const fileKey = `${user.id}/${uuidv4()}.${extension}`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKETS.receipts,
        Key: fileKey,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: contentType,
      })
    );

    return NextResponse.json({ fileKey });
  } catch (error) {
    console.error('Payment receipt upload failed:', error);
    return NextResponse.json({ error: 'Failed to store receipt image' }, { status: 500 });
  }
}
