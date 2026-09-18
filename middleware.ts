import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';
const LOGIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_LOGIN_SLUG || 'staff-login-x7k9m';

// Staff roles that can access the staff portal
const STAFF_ROLES = ['super_admin', 'admin', 'sales', 'instructor'] as const;

// Retry getUser with exponential backoff to handle transient Supabase errors
// Returns null on failure (not throwing) so public pages still render
async function getUserWithRetry(supabase: any, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (err) {
      if (i === retries) {
        // Log but don't throw - treat as "no user" for public pages
        console.warn('[Middleware] getUser failed after retries:', err);
        return null;
      }
      // Wait before retry: 100ms, 200ms
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
  return null;
}

/**
 * Get user profile with role and is_active status.
 * Returns null if profile not found or error.
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

  // Refresh auth session with retry logic
  // On failure, user will be null (not throw) - public pages still render
  const user = await getUserWithRetry(supabase);

  const path = request.nextUrl.pathname;

  // 1. Block legacy /admin routes
  if (path === '/admin' || path.startsWith('/admin/')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Allow authenticated users to access public pages (courses, etc.)
  // Don't redirect them away - they should be able to browse
  // Only redirect from login/signup if already authenticated
  if (user) {
    const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
    if (authPaths.some(p => path === p || path.startsWith(p + '/'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // 3. Protect Student Protected Areas
  // Only redirect if we're SURE there's no user (not just a transient error)
  if (path.startsWith('/dashboard') || path.startsWith('/learn')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }
  }

  // 4. Protect Staff Portal Area
  // - Redirect unauthenticated to staff login
  // - Redirect authenticated non-staff to dashboard
  // - Redirect inactive staff to dashboard
  if (path === `/${PORTAL_SLUG}` || path.startsWith(`/${PORTAL_SLUG}/`)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${LOGIN_SLUG}`;
      return NextResponse.redirect(url);
    }

    // User is authenticated - check role and active status
    const profile = await getUserProfile(supabase, user.id);
    if (!profile || !STAFF_ROLES.includes(profile.role as any) || !profile.is_active) {
      // Not authorized for staff portal
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