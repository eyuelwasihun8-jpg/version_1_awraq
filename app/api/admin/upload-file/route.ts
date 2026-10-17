import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHandler, withAuth, withRateLimit } from '@/lib/api-handler';
import { r2, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const uploadFormSchema = z.object({
  folder: z.string().min(1).max(100).regex(/^[a-zA-Z0-9/_-]+$/),
});

export const POST = createHandler(
  null,
  null,
  withRateLimit(
    withAuth(async (request) => {
      const { profile } = request.auth!;
      if (!['super_admin', 'admin', 'instructor'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        return NextResponse.json({ error: 'Invalid upload form data' }, { status: 400 });
      }

      const parsedForm = uploadFormSchema.safeParse({
        folder: formData.get('folder'),
      });
      if (!parsedForm.success) {
        return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 });
      }

      const file = formData.get('file');
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: 'Please select a file to upload' }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Files uploaded through this endpoint must be 4 MB or smaller' },
          { status: 413 }
        );
      }

      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
      const fileKey = `${parsedForm.data.folder}/${uuidv4()}.${extension}`;

      try {
        await r2.send(
          new PutObjectCommand({
            Bucket: BUCKETS.content,
            Key: fileKey,
            Body: Buffer.from(await file.arrayBuffer()),
            ContentType: file.type || 'application/octet-stream',
          })
        );
      } catch (error) {
        console.error('Admin file upload failed:', error);
        return NextResponse.json({ error: 'Failed to store uploaded file' }, { status: 500 });
      }

      return NextResponse.json({ fileKey });
    }, 'staff'),
    { max: 30, windowMs: 60 * 60 * 1000, keyPrefix: 'admin-file-upload' }
  )
);
