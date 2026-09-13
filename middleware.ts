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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Block old /admin
  if (path === '/admin' || path.startsWith('/admin/')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Protect Student Areas
  if (path.startsWith('/dashboard') || path.startsWith('/learn')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect Staff Portal Area
  if (path === `/${PORTAL_SLUG}` || path.startsWith(`/${PORTAL_SLUG}/`)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${LOGIN_SLUG}`;
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (
      !profile?.is_active ||
      !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
    ) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // If already staff and visits staff-login -> redirect to staff portal
  if (path === `/${LOGIN_SLUG}` && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (
      profile?.is_active &&
      ['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
    ) {
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