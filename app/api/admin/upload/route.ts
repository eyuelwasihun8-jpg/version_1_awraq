import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';
import { requireStaff } from '@/lib/auth';
import { uploadQuerySchema } from '@/lib/validators';
import { createHandler, withAuth, withRateLimit } from '@/lib/api-handler';

export const maxDuration = 60; // 60s execution limit

export const POST = createHandler(
  null,
  uploadQuerySchema,
  withRateLimit(
    withAuth(async (request) => {
      const supabase = await createClient();
      const auth = await requireStaff(supabase);

      if (!auth) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { user, profile } = auth;
      const { validatedQuery } = request;

      const contentTypeHeader = request.headers.get('content-type') || '';
      const { folder, filename } = validatedQuery;

      let buffer: Buffer;
      let ext = 'bin';
      let contentType = 'application/octet-stream';

      // 🟢 RAW STREAM PATH (Default for binary files, PDFs, PPTs, videos)
      if (filename || !contentTypeHeader.includes('multipart/form-data')) {
        const arrayBuffer = await request.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          return NextResponse.json({ error: 'File body is empty' }, { status: 400 });
        }

        buffer = Buffer.from(arrayBuffer);
        const fname = filename || 'file.bin';
        ext = fname.split('.').pop() || 'bin';
        contentType = contentTypeHeader || 'application/octet-stream';
      } else {
        // 🔵 FORM DATA PATH (Legacy fallback)
        try {
          const formData = await request.formData();
          const file = formData.get('file') as File | null;
          const formFolder = (formData.get('folder') as string) || folder;

          if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
          }

          buffer = Buffer.from(await file.arrayBuffer());
          ext = file.name.split('.').pop() || 'bin';
          contentType = file.type || 'application/octet-stream';
          validatedQuery.folder = formFolder;
        } catch {
          const arrayBuffer = await request.arrayBuffer();
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            return NextResponse.json({ error: 'Failed to process file' }, { status: 400 });
          }
          buffer = Buffer.from(arrayBuffer);
        }
      }

      const folderPath = validatedQuery.folder || 'uploads';
      const fileKey = `${folderPath}/${uuidv4()}.${ext}`;

      // Upload to Cloudflare R2
      await r2.send(
        new PutObjectCommand({
          Bucket: BUCKETS.content,
          Key: fileKey,
          Body: buffer,
          ContentType: contentType,
        })
      );

      // Audit log
      const adminDb = (await import('@/lib/supabase-admin')).createAdminClient();
      await adminDb.from('audit_logs').insert({
        actor_id: user.id,
        actor_role: profile.role,
        action: 'upload_file',
        target_type: 'file',
        target_id: fileKey,
        details: { file_key: fileKey, content_type: contentType, size: buffer.length },
      });

      return NextResponse.json({ success: true, fileKey });
    }, 'staff'),
    { max: 20, windowMs: 60 * 60 * 1000, keyPrefix: 'admin-upload' }
  )
);