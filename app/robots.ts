import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://awraqskills.com';
const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';
const LOGIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_LOGIN_SLUG || 'staff-login-x7k9m';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/learn',
          '/purchase',
          '/profile',
          '/onboarding',
          '/certificate',
          '/api/',
          `/${PORTAL_SLUG}`,
          `/${PORTAL_SLUG}/`,
          `/${LOGIN_SLUG}`,
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}