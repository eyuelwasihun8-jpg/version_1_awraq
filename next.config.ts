import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from Cloudflare R2 and external providers
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
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https: data: blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' https: data: blob: *.cloudflarestorage.com *.r2.cloudflarestorage.com",
              // 🔑 THIS IS THE CRITICAL LINE THAT ALLOWS R2 VIDEO STREAMING:
              "media-src 'self' https: data: blob: *.cloudflarestorage.com *.r2.cloudflarestorage.com",
              "connect-src 'self' https: wss: *.supabase.co *.cloudflarestorage.com *.r2.cloudflarestorage.com https://challenges.cloudflare.com",
              "frame-src 'self' https://challenges.cloudflare.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;