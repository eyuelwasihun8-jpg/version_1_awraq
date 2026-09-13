import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['super_admin', 'admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'thumbnails';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'png';
    const fileKey = `${folder}/${uuidv4()}.${ext}`;

    // Upload directly from Server to R2 (No Browser CORS!)
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKETS.content,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type || 'image/png',
      })
    );

    return NextResponse.json({ success: true, fileKey });
  } catch (err: any) {
    console.error('Server upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}