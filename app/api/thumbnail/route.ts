import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/turnstile';

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request) || 'unknown';
    const limit = await rateLimit(`thumbnail:${clientIp}`, 300, 60 * 1000);
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

    if (/^https?:\/\//i.test(cleanKey)) {
      return NextResponse.json(
        { url: cleanKey },
        { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } }
      );
    }

    if (R2_PUBLIC_URL) {
      const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${cleanKey.replace(/^\//, '')}`;
      return NextResponse.json(
        { url: publicUrl },
        { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } }
      );
    }

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