import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  async headers() {
    return [
      // Video files: enable byte-range streaming
      {
        source: '/videos/:path*',
        headers: [
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'video/mp4' },
        ],
      },
      {
        source: '/:path*.mp4',
        headers: [
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https: data: blob:",
              // Scripts: allow self and Cloudflare Turnstile (no unsafe-inline)
              "script-src 'self' https://challenges.cloudflare.com https://js.stripe.com",
              // Styles: allow self and inline (needed for Tailwind/Dynamic styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images
              "img-src 'self' https: data: blob: *.cloudflarestorage.com *.r2.cloudflarestorage.com",
              // Media (video/audio)
              "media-src 'self' https: data: blob: *.cloudflarestorage.com *.r2.cloudflarestorage.com",
              // Connect (fetch, WebSocket, EventSource)
              "connect-src 'self' https: wss: *.supabase.co *.cloudflarestorage.com *.r2.cloudflarestorage.com https://challenges.cloudflare.com https://api.stripe.com",
              // Frames (Turnstile, Stripe)
              "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
              // Form actions
              "form-action 'self'",
              // Base URI
              "base-uri 'self'",
              // Object/Embed
              "object-src 'none'",
              // Upgrade insecure requests
              "upgrade-insecure-requests",
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS - enforce HTTPS for 1 year with subdomains and preload
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;