import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/turnstile';

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

export async function GET(request: NextRequest) {
  try {
    // 1. Generous rate limit for public thumbnail loading (300 requests/min per IP)
    const clientIp = getClientIp(request) || 'unknown';
    const limit = rateLimit(`thumbnail:${clientIp}`, 300, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter || 60) } }
      );
    }

    const key = request.nextUrl.searchParams.get('key');
    if (!key || !key.trim()) {
      return NextResponse.json({ error: 'Thumbnail key is required' }, { status: 400 });
    }

    const cleanKey = key.trim();

    // 2. Direct HTTP URL check
    if (/^https?:\/\//i.test(cleanKey)) {
      return NextResponse.json({ url: cleanKey }, {
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
      });
    }

    // 3. Fast path: Public R2 domain if configured
    if (R2_PUBLIC_URL) {
      const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${cleanKey.replace(/^\//, '')}`;
      return NextResponse.json({ url: publicUrl }, {
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
      });
    }

    // 4. Fallback: Generate signed R2 URL (expires in 1 hour for public caching)
    const url = await getDownloadUrl(BUCKETS.content, cleanKey, 3600);

    return NextResponse.json(
      { url },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      }
    );
  } catch (err: any) {
    console.error('Thumbnail API error:', err);
    return NextResponse.json({ error: 'Failed to resolve thumbnail' }, { status: 500 });
  }
}