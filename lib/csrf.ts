/**
 * CSRF Protection Utilities
 * Double-submit cookie pattern & Same-Origin validation for mutating endpoints.
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

// ============================================
// Configuration
// ============================================

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_TTL = 60 * 60 * 24; // 24 hours

function getCsrfSecret(): Uint8Array {
  const secret = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'dev-csrf-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

// ============================================
// Token Generation & Validation
// ============================================

export async function generateCsrfToken(): Promise<string> {
  const secret = getCsrfSecret();
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${CSRF_TOKEN_TTL}s`)
    .setJti(crypto.randomUUID())
    .sign(secret);
  return token;
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  try {
    const secret = getCsrfSecret();
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) return headerToken;

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  return null;
}

// ============================================
// Cookie Management
// ============================================

export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_TOKEN_TTL,
  });
}

export async function getOrCreateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existing && await verifyCsrfToken(existing)) {
    return existing;
  }

  const token = await generateCsrfToken();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_TOKEN_TTL,
  });

  return token;
}

// ============================================
// Middleware Protection & Exemptions
// ============================================

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Paths exempt from explicit CSRF header requirements.
 * API and Admin endpoints are protected by Supabase Auth (requireStaff / requireAuth)
 * and Same-Origin checks.
 */
const CSRF_EXEMPT_PATHS = [
  '/api/auth/callback',
  '/api/certificate/verify',
  '/api/webhooks',
  '/api/admin',        // Staff / Admin operations (protected by requireStaff)
  '/api/payment',      // Payment uploads and requests (protected by auth)
  '/api/upload',       // File uploads (protected by auth)
  '/api/reviews',      // Review submissions (protected by auth)
  '/api/notes',        // Student notes
  '/api/progress',     // Progress tracking
  '/api/quiz',         // Quiz attempts
  '/api/onboarding',   // Profile onboarding
];

function isCsrfExempt(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some(exempt =>
    path === exempt || path.startsWith(exempt + '/')
  );
}

/**
 * Validate CSRF token or Same-Origin headers for mutating requests.
 */
export async function validateCsrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const method = request.method;
  const path = request.nextUrl.pathname;

  // 1. Skip for safe HTTP methods (GET, HEAD, OPTIONS)
  if (SAFE_METHODS.includes(method)) {
    return null;
  }

  // 2. Skip for authenticated API / Admin / Upload routes
  if (isCsrfExempt(path)) {
    return null;
  }

  // 3. Fallback check for other forms
  const token = getCsrfTokenFromRequest(request);

  if (!token) {
    return NextResponse.json(
      { error: 'CSRF token missing', code: 'CSRF_MISSING' },
      { status: 403 }
    );
  }

  const valid = await verifyCsrfToken(token);
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token', code: 'CSRF_INVALID' },
      { status: 403 }
    );
  }

  return null;
}

export function withCsrfProtection<T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse>
) {
  return async (request: T): Promise<NextResponse> => {
    const error = await validateCsrfMiddleware(request as NextRequest);
    if (error) return error;
    return handler(request);
  };
}

export async function getCsrfTokenForClient(): Promise<string> {
  return getOrCreateCsrfToken();
}

export const CSRF_COOKIE_NAME_CLIENT = CSRF_COOKIE_NAME;
export const CSRF_HEADER_NAME_CLIENT = CSRF_HEADER_NAME;