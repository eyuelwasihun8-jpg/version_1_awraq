import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60; // 60s execution limit

export async function POST(request: NextRequest) {
  try {
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

    const contentTypeHeader = request.headers.get('content-type') || '';
    const searchParams = request.nextUrl.searchParams;
    const folderParam = searchParams.get('folder');
    const filenameParam = searchParams.get('filename');

    let buffer: Buffer;
    let folder = folderParam || 'uploads';
    let ext = 'bin';
    let contentType = 'application/octet-stream';

    // 🟢 RAW STREAM PATH (Default for binary files, PDFs, PPTs, videos)
    if (filenameParam || !contentTypeHeader.includes('multipart/form-data')) {
      const arrayBuffer = await request.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return NextResponse.json({ error: 'File body is empty' }, { status: 400 });
      }

      buffer = Buffer.from(arrayBuffer);
      const fname = filenameParam || 'file.bin';
      ext = fname.split('.').pop() || 'bin';
      contentType = contentTypeHeader || 'application/octet-stream';
    } else {
      // 🔵 FORM DATA PATH (Legacy fallback)
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        folder = (formData.get('folder') as string) || folder;

        if (!file) {
          return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        buffer = Buffer.from(await file.arrayBuffer());
        ext = file.name.split('.').pop() || 'bin';
        contentType = file.type || 'application/octet-stream';
      } catch {
        const arrayBuffer = await request.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          return NextResponse.json({ error: 'Failed to process file' }, { status: 400 });
        }
        buffer = Buffer.from(arrayBuffer);
      }
    }

    const fileKey = `${folder}/${uuidv4()}.${ext}`;

    // Upload to Cloudflare R2
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKETS.content,
        Key: fileKey,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return NextResponse.json({ success: true, fileKey });
  } catch (err: any) {
    console.error('Admin upload route error:', err);
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}