import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60; // 60s timeout for large video uploads

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

    // Get parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder') || 'testimonials';
    const filename = searchParams.get('filename') || 'file.bin';
    const contentType =
      request.headers.get('content-type') || 'application/octet-stream';

    // Read raw binary buffer directly (bypasses FormData limits completely)
    const arrayBuffer = await request.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'File body is empty' }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);
    const ext = filename.split('.').pop() || 'bin';
    const fileKey = `${folder}/${uuidv4()}.${ext}`;

    // Upload directly to Cloudflare R2 content bucket
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
    console.error('Testimonials upload route error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}