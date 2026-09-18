import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';
import { createClient } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/turnstile';

const CACHE_MAX_AGE = 3300; // 55 min (signed URL lasts 60 min, cache 55 min)

// Rate limits: 10 req/min GET, 5 req/min POST per IP
const GET_RATE_LIMIT = { max: 10, windowMs: 60 * 1000 };
const POST_RATE_LIMIT = { max: 5, windowMs: 60 * 1000 };

/**
 * Allowlist for thumbnail keys.
 * ONLY thumbnails, avatars, certificates, and direct image files.
 * Videos (courses/), product files (products/) are BLOCKED here -
 * they must use /api/video and /api/download which enforce enrollment checks.
 */
function isAllowed(key: string): boolean {
  // Allowed prefixes
  if (key.startsWith('thumbnails/')) return true;
  if (key.startsWith('avatars/')) return true;
  if (key.startsWith('certificates/')) return true;

  // Allowed image extensions (only for keys not matching above prefixes)
  // This handles any legacy direct image uploads
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(key)) return true;

  // Explicitly BLOCKED: courses/ (videos), products/ (zip files)
  if (key.startsWith('courses/')) return false;
  if (key.startsWith('products/')) return false;

  return false;
}

// GET single (kept for backwards compat)
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIp = getClientIp(request) || 'unknown';
  const limit = rateLimit(`thumbnail:get:${clientIp}`, GET_RATE_LIMIT.max, GET_RATE_LIMIT.windowMs);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter || 60) } }
    );
  }

  // Authentication required
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  // Rate limiting (stricter for batch)
  const clientIp = getClientIp(request) || 'unknown';
  const limit = rateLimit(`thumbnail:post:${clientIp}`, POST_RATE_LIMIT.max, POST_RATE_LIMIT.windowMs);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter || 60) } }
    );
  }

  // Authentication required
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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