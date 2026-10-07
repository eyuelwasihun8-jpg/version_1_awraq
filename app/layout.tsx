import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import { Toaster } from 'sonner';
import NextTopLoader from 'nextjs-toploader';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://awraqskills.com';
const APP_NAME = 'Awraq Skills';
const DEFAULT_TITLE = 'Awraq — Master Digital Marketing';
const DEFAULT_DESCRIPTION =
  'Learn digital marketing step by step with practical courses, Facebook & Google Ads, content strategy, design, and real campaign skills. Built for freelancers, students, and business owners.';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ddb049',
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | Awraq Skills',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    'digital marketing course',
    'Facebook ads training',
    'Google ads course',
    'social media marketing',
    'SEO course',
    'content marketing',
    'graphic design course',
    'video editing course',
    'marketing agency training',
    'Awraq Skills',
    'Ethiopia digital marketing',
    'online marketing courses',
  ],
  authors: [{ name: 'Awraq Skills' }],
  creator: 'Awraq Skills',
  publisher: 'Awraq Skills',
  category: 'education',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: APP_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/hero-poster.jpg', // put a 1200x630 share image in /public
        width: 1200,
        height: 630,
        alt: 'Awraq Skills — Master Digital Marketing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/hero-poster.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/awraq-icon.png', type: 'image/png' },
    ],
    apple: [{ url: '/awraq-icon.png' }],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased font-sans" suppressHydrationWarning>
        <NextTopLoader
          color="#ddb049"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #ddb049,0 0 5px #ddb049"
        />

        <RootLayoutClient>{children}</RootLayoutClient>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: { fontSize: '14px', fontWeight: 500 },
          }}
        />
      </body>
    </html>
  );
}