import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Must be an image' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = (file.type.split('/')[1] || 'png').split(';')[0];
    const fileKey = `avatars/${user.id}/${uuidv4()}.${ext}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKETS.content,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      })
    );

    return NextResponse.json({ success: true, fileKey });
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}