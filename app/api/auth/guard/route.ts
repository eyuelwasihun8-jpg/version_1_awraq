import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHandler, withRateLimit } from '@/lib/api-handler';
import { verifyTurnstile, getClientIp } from '@/lib/turnstile';

const authGuardSchema = z.object({
  action: z.enum(['signup', 'login', 'login_challenge', 'register']).default('login'),
  turnstileToken: z.string().optional(),
});

const RATE_LIMIT_MINUTE = { max: 20, windowMs: 60 * 1000, keyPrefix: 'auth-guard' };
const RATE_LIMIT_HOUR_SIGNUP = { max: 10, windowMs: 60 * 60 * 1000, keyPrefix: 'auth-guard' };
const RATE_LIMIT_HOUR_LOGIN = { max: 40, windowMs: 60 * 60 * 1000, keyPrefix: 'auth-guard' };

export const POST = createHandler(
  authGuardSchema,
  null,
  async (request) => {
    const { validatedData: body, clientIp } = request;
    const action = body.action;

    // Check minute rate limit
    const minuteLimit = await import('@/lib/rate-limit').then(m =>
      m.rateLimit(`auth-guard:${clientIp}:min`, RATE_LIMIT_MINUTE.max, RATE_LIMIT_MINUTE.windowMs)
    );
    if (!minuteLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many attempts. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(minuteLimit.retryAfter || 60) } }
      );
    }

    // Check hour rate limit
    const hourMax = action === 'signup' || action === 'register' ? 10 : 40;
    const hourLimit = await import('@/lib/rate-limit').then(m =>
      m.rateLimit(`auth-guard:${clientIp}:hour:${action}`, hourMax, 60 * 60 * 1000)
    );
    if (!hourLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(hourLimit.retryAfter || 3600) } }
      );
    }

    const needsTurnstile = action === 'signup' || action === 'login_challenge' || action === 'register';

    if (needsTurnstile) {
      const { isTurnstileConfigured } = await import('@/lib/turnstile');
      if (isTurnstileConfigured()) {
        if (!body.turnstileToken) {
          return NextResponse.json(
            { ok: false, error: 'Please complete the security check.' },
            { status: 400 }
          );
        }
        const result = await verifyTurnstile(body.turnstileToken, clientIp);
        if (!result.success) {
          console.warn('[auth/guard] Turnstile failed', result['error-codes']);
          return NextResponse.json(
            { ok: false, error: 'Security verification failed. Please try again.' },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  }
);