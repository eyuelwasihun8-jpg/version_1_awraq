import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getUploadUrl, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const contentType: string = (body.contentType || '').toLowerCase();
    const size: number = Number(body.size || 0);

    if (!ALLOWED[contentType]) {
      return NextResponse.json(
        { error: 'Avatar must be a JPG, PNG, or WebP image' },
        { status: 400 }
      );
    }

    if (size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 });
    }

    const ext = ALLOWED[contentType];
    const fileKey = `avatars/${user.id}/${uuidv4()}.${ext}`;

    const uploadUrl = await getUploadUrl(BUCKETS.content, fileKey, contentType, 600);

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (err: any) {
    console.error('Avatar upload-url error:', err);
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}