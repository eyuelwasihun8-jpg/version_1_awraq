import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';
import { createClient } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/turnstile';

const CACHE_MAX_AGE = 3300; // 55 min (signed URL lasts 60 min, cache 55 min)

// Rate limits: 10 req/min GET, 5 req/min POST per IP
const GET_RATE_LIMIT = { max: 10, windowMs: 60 * 1000 };
const POST_RATE_LIMIT = { max: 5, windowMs: 60 * 1000 };

// Private prefixes: media behind enrollment/ownership checks. These must ONLY be
// served by /api/video and /api/download (which verify access), never signed here.
const BLOCKED_PREFIXES = ['courses/', 'products/', 'receipts/', 'videos/'];

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|avif)$/i;

/**
 * Allowlist for thumbnail keys — IMAGES ONLY.
 *
 * Order matters: the blocked-prefix check runs BEFORE the extension check.
 * (An earlier version tested the extension first, so `courses/lesson-1.jpg`
 * — or any image-named key inside a private prefix — was still signed.)
 *
 *   1. reject malformed / traversal-ish keys outright
 *   2. reject the private prefixes (never servable here)
 *   3. allow only image extensions
 */
function isAllowed(key: string): boolean {
  const k = key.trim();

  // 1. shape / traversal guards
  if (!k || k.length > 512) return false;
  if (k.startsWith('/') || k.includes('..') || k.includes('\\') || k.includes('?')) return false;

  // 2. private prefixes — blocked before anything else can allow them
  if (BLOCKED_PREFIXES.some((prefix) => k.startsWith(prefix))) return false;

  // 3. images only (covers thumbnails/, avatars/, certificates/ and legacy uploads)
  return IMAGE_EXT.test(k);
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