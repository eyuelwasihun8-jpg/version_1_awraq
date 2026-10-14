import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';
import { createHandler, withAuth, withRateLimit } from '@/lib/api-handler';

const certDownloadQuerySchema = z.object({
  courseId: z.string().uuid(),
});

export const GET = createHandler(
  null,
  certDownloadQuerySchema,
  withRateLimit(
    withAuth(async (request) => {
      const { validatedQuery } = request;
      const { user } = (request as any).auth;
      const supabase = await createClient();

      const { courseId } = validatedQuery;

      const { data: cert } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (!cert || !cert.certificate_url) {
        return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
      }

      const url = await getDownloadUrl(BUCKETS.certificates, cert.certificate_url, 600);

      return NextResponse.json({ url, certificate: cert });
    }, 'user'),
    { max: 30, windowMs: 60 * 60 * 1000, keyPrefix: 'cert-download' }
  )
);