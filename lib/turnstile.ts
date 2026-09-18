/**
 * Cloudflare Turnstile verification utility.
 * Verifies challenge tokens server-side.
 */

import { getEnv } from './env';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResult {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Verify a Turnstile token with Cloudflare.
 * @param token The token from the client (cf-turnstile-response)
 * @param ip Optional client IP for additional verification
 * @returns Promise resolving to verification result
 */
export async function verifyTurnstile(
  token: string,
  ip?: string
): Promise<TurnstileVerifyResult> {
  const env = getEnv();

  if (!env.TURNSTILE_SECRET_KEY) {
    // Turnstile not configured - allow but log warning
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY not configured, skipping verification');
    return { success: true };
  }

  if (!token || typeof token !== 'string') {
    return {
      success: false,
      'error-codes': ['missing-input-response'],
    };
  }

  const formData = new URLSearchParams();
  formData.append('secret', env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  if (ip) {
    formData.append('remoteip', ip);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error('[Turnstile] Verification request failed:', response.status);
      return {
        success: false,
        'error-codes': ['verification-failed'],
      };
    }

    const result = (await response.json()) as TurnstileVerifyResult;
    return result;
  } catch (error) {
    // Network error, timeout, etc.
    // Fail open in development, fail closed in production
    const isDev = process.env.NODE_ENV === 'development';
    console.error('[Turnstile] Verification error:', error);

    if (isDev) {
      console.warn('[Turnstile] Development mode: allowing request despite verification failure');
      return { success: true };
    }

    return {
      success: false,
      'error-codes': ['internal-error'],
    };
  }
}

/**
 * Check if Turnstile is configured (has secret key).
 */
export function isTurnstileConfigured(): boolean {
  const env = getEnv();
  return !!env.TURNSTILE_SECRET_KEY;
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string | undefined {
  // Check various proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  // Next.js specific
  const nextForwarded = request.headers.get('x-vercel-forwarded-for');
  if (nextForwarded) {
    return nextForwarded.split(',')[0].trim();
  }
  return undefined;
}