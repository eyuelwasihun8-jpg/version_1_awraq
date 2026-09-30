import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { verifyTurnstile, getClientIp, isTurnstileConfigured } from '@/lib/turnstile';

/**
 * POST /api/auth/guard
 * Body: { action: 'signup' | 'login' | 'login_challenge', turnstileToken?: string }
 *
 * - signup: always requires Turnstile (if configured) + stricter rate limit
 * - login: light rate limit; Turnstile optional unless action=login_challenge
 * - login_challenge: requires Turnstile after failed attempts
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request) || 'unknown';
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || 'login');
    const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';

    // IP rate limits
    const minute = rateLimit(`auth-guard:${ip}:min`, 20, 60 * 1000);
    if (!minute.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many attempts. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(minute.retryAfter || 60) } }
      );
    }

    const hourMax = action === 'signup' ? 10 : 40;
    const hour = rateLimit(`auth-guard:${ip}:hour:${action}`, hourMax, 60 * 60 * 1000);
    if (!hour.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(hour.retryAfter || 3600) } }
      );
    }

    const needsTurnstile =
      action === 'signup' ||
      action === 'login_challenge' ||
      action === 'register';

    if (needsTurnstile) {
      if (isTurnstileConfigured()) {
        if (!token) {
          return NextResponse.json(
            { ok: false, error: 'Please complete the security check.' },
            { status: 400 }
          );
        }
        const result = await verifyTurnstile(token, ip);
        if (!result.success) {
          console.warn('[auth/guard] Turnstile failed', result['error-codes']);
          return NextResponse.json(
            { ok: false, error: 'Security verification failed. Please try again.' },
            { status: 403 }
          );
        }
      }
      // If Turnstile not configured, allow (dev) — same as leads route
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[auth/guard]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}