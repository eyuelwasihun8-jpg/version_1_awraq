import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';
const LOGIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_LOGIN_SLUG || 'staff-login-x7k9m';

// Staff roles that can access the staff portal
const STAFF_ROLES = ['super_admin', 'admin', 'sales', 'instructor'] as const;

/**
 * Get user safely — returns null silently if visitor is not logged in.
 * Retries only for genuine transient network errors.
 */
async function getUserWithRetry(supabase: any, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // "AuthSessionMissingError" is normal when a visitor is unauthenticated.
        // Return null immediately without retrying or logging error spam.
        if (
          error.name === 'AuthSessionMissingError' ||
          error.message?.includes('Auth session missing') ||
          error.status === 400
        ) {
          return null;
        }
        throw error;
      }
      return user;
    } catch (err: any) {
      if (
        err?.name === 'AuthSessionMissingError' ||
        err?.message?.includes('Auth session missing') ||
        err?.status === 400
      ) {
        return null;
      }

      if (i === retries) {
        console.warn('[Middleware] Transient getUser error after retries:', err);
        return null;
      }
      // Wait before retry for real network errors: 100ms, 200ms
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
  return null;
}

/**
 * Get user profile with role and is_active status.
 * Returns null if profile not found or on query error.
 */
async function getUserProfile(supabase: any, userId: string): Promise<{ role: string; is_active: boolean } | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', userId)
      .single();
    if (error || !profile) return null;
    return { role: profile.role, is_active: profile.is_active };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Safely check auth session
  const user = await getUserWithRetry(supabase);
  const path = request.nextUrl.pathname;

  // 1. Block legacy /admin routes
  if (path === '/admin' || path.startsWith('/admin/')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Redirect logged-in users away from auth pages to /dashboard
  if (user) {
    const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
    if (authPaths.some(p => path === p || path.startsWith(p + '/'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // 3. Protect Student Protected Areas
  if (path.startsWith('/dashboard') || path.startsWith('/learn')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }
  }

  // 4. Protect Staff Portal Area
  if (path === `/${PORTAL_SLUG}` || path.startsWith(`/${PORTAL_SLUG}/`)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${LOGIN_SLUG}`;
      return NextResponse.redirect(url);
    }

    const profile = await getUserProfile(supabase, user.id);
    if (!profile || !STAFF_ROLES.includes(profile.role as any) || !profile.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // 5. If logged-in staff visits staff-login -> redirect to staff portal
  if (path === `/${LOGIN_SLUG}` && user) {
    const profile = await getUserProfile(supabase, user.id);
    if (profile && STAFF_ROLES.includes(profile.role as any) && profile.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = `/${PORTAL_SLUG}`;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};