import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';
const LOGIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_LOGIN_SLUG || 'staff-login-x7k9m';

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

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 1. Block legacy /admin routes
  if (path === '/admin' || path.startsWith('/admin/')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Redirect authenticated users away from public pages (home, login, signup, etc.)
  // They should always go to their learning dashboard
  if (user) {
    const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/courses'];
    const isPublicPath = publicPaths.some(p => path === p || path.startsWith(p + '/'));

    if (isPublicPath && !path.startsWith('/learn') && !path.startsWith('/dashboard') && !path.startsWith('/profile') && !path.startsWith('/purchase') && !path.startsWith('/certificate')) {
      const url = request.nextUrl.clone();
      // Check if user has enrolled courses - if so go to learn, else dashboard
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // 3. Protect Student Protected Areas
  if (path.startsWith('/dashboard') || path.startsWith('/learn')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // 4. Protect Staff Portal Area (redirect unauthenticated to staff login)
  if (path === `/${PORTAL_SLUG}` || path.startsWith(`/${PORTAL_SLUG}/`)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${LOGIN_SLUG}`;
      return NextResponse.redirect(url);
    }
  }

  // 5. If logged-in staff visits staff-login -> redirect to staff portal
  if (path === `/${LOGIN_SLUG}` && user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${PORTAL_SLUG}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};