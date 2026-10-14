/**
 * CSRF Protection Utilities
 * Double-submit cookie pattern for protecting mutating endpoints.
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

// Secret for signing CSRF tokens (should be from env in production)
function getCsrfSecret(): Uint8Array {
  const secret = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'dev-csrf-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

// ============================================
// Token Generation & Validation
// ============================================

/**
 * Generate a new CSRF token (signed JWT)
 */
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

/**
 * Verify a CSRF token
 */
export async function verifyCsrfToken(token: string): Promise<boolean> {
  try {
    const secret = getCsrfSecret();
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get CSRF token from request (header or cookie)
 */
export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  // Check header first (for AJAX requests)
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) return headerToken;

  // Check cookie (for form submissions)
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  return null;
}

// ============================================
// Cookie Management
// ============================================

/**
 * Set CSRF token cookie on response
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_TOKEN_TTL,
  });
}

/**
 * Get or create CSRF token for the current session
 */
export async function getOrCreateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existing && await verifyCsrfToken(existing)) {
    return existing;
  }

  // Generate new token
  const token = await generateCsrfToken();

  // Set cookie (will be applied to next response)
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
// Middleware Protection
// ============================================

/**
 * List of safe methods that don't require CSRF protection
 */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Paths that are exempt from CSRF protection
 * (e.g., webhooks, public APIs)
 */
const CSRF_EXEMPT_PATHS = [
  '/api/auth/callback',
  '/api/certificate/verify',
  '/api/webhooks', // if you add webhooks later
];

/**
 * Check if a path is exempt from CSRF
 */
function isCsrfExempt(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some(exempt =>
    path === exempt || path.startsWith(exempt + '/')
  );
}

/**
 * Middleware function to validate CSRF token
 * Returns NextResponse with error if invalid, null if valid/exempt
 */
export async function validateCsrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const method = request.method;
  const path = request.nextUrl.pathname;

  // Skip for safe methods
  if (SAFE_METHODS.includes(method)) {
    return null;
  }

  // Skip for exempt paths
  if (isCsrfExempt(path)) {
    return null;
  }

  // Skip for API routes that use other auth (e.g., service-to-service)
  // You can customize this logic based on your needs

  // Get token from request
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

  return null; // Valid
}

/**
 * Wrapper to add CSRF protection to a route handler
 */
export function withCsrfProtection<T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse>
) {
  return async (request: T): Promise<NextResponse> => {
    const error = await validateCsrfMiddleware(request as NextRequest);
    if (error) return error;
    return handler(request);
  };
}

// ============================================
// Client-side Helpers
// ============================================

/**
 * Get CSRF token for client-side use (call from Server Component)
 */
export async function getCsrfTokenForClient(): Promise<string> {
  return getOrCreateCsrfToken();
}

/**
 * Read CSRF token from cookie (client-side)
 * Usage: const token = document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
 */
export const CSRF_COOKIE_NAME_CLIENT = CSRF_COOKIE_NAME;
export const CSRF_HEADER_NAME_CLIENT = CSRF_HEADER_NAME;