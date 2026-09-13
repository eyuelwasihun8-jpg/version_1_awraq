import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';

const CACHE_MAX_AGE = 3300; // 55 min (signed URL lasts 60 min, cache 55 min)

function isAllowed(key: string) {
  return (
    key.startsWith('thumbnails/') ||
    key.startsWith('products/') ||
    key.startsWith('certificates/') ||
    key.startsWith('courses/') ||
    key.startsWith('avatars/') ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(key)
  );
}

// GET single (kept for backwards compat)
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
  if (!isAllowed(key)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const url = await getDownloadUrl(BUCKETS.content, key, 3600);
    return NextResponse.json(
      { url },
      {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST batch (fetches 10+ URLs in one request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const keys: string[] = Array.isArray(body.keys) ? body.keys : [];

    if (keys.length === 0) return NextResponse.json({ urls: {} });
    if (keys.length > 50) {
      return NextResponse.json({ error: 'Max 50 keys per request' }, { status: 400 });
    }

    const validKeys = keys.filter((k) => k && typeof k === 'string' && isAllowed(k));

    // Sign all URLs in PARALLEL (Promise.all)
    const results = await Promise.all(
      validKeys.map(async (key) => {
        try {
          const url = await getDownloadUrl(BUCKETS.content, key, 3600);
          return [key, url] as [string, string];
        } catch {
          return [key, null] as [string, null];
        }
      })
    );

    const urls: Record<string, string | null> = {};
    results.forEach(([key, url]) => {
      urls[key] = url;
    });

    return NextResponse.json(
      { urls },
      {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
        },
      }
    );
  } catch (err) {
    console.error('Batch thumbnail error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}