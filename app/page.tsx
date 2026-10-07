import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { HomePageClient } from '@/components/home/HomePageClient';
import type { Course, DigitalProduct } from '@/lib/types';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://awraqskills.com';

export const metadata: Metadata = {
  title: 'Awraq — Master Digital Marketing',
  description:
    'Practical digital marketing courses for Facebook Ads, Google Ads, content, social media, design, and agency skills. Learn step by step and build real results.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Awraq — Master Digital Marketing',
    description:
      'Practical digital marketing courses for Facebook Ads, Google Ads, content, social media, design, and agency skills.',
    url: APP_URL,
    type: 'website',
    images: [
      {
        url: '/hero-poster.jpg',
        width: 1200,
        height: 630,
        alt: 'Awraq Skills homepage',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Awraq — Master Digital Marketing',
    description:
      'Practical digital marketing courses for Facebook Ads, Google Ads, content, social media, design, and agency skills.',
    images: ['/hero-poster.jpg'],
  },
};

async function getHomeData() {
  const supabase = await createClient();

  // Logged-in users go to learning area
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (!profile?.onboarding_completed) {
      redirect('/onboarding');
    } else {
      redirect('/dashboard');
    }
  }

  const { data: coursesRaw, error: courseErr } = await supabase
    .from('courses')
    .select('*, instructor:profiles(full_name, avatar_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(12);

  if (courseErr) console.error('Homepage courses fetch error:', courseErr);

  const { data: productsRaw, error: prodErr } = await supabase
    .from('digital_products')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(8);

  if (prodErr) console.error('Homepage products fetch error:', prodErr);

  return {
    courses: (coursesRaw || []) as Course[],
    products: (productsRaw || []) as DigitalProduct[],
  };
}

function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Awraq Skills',
    url: APP_URL,
    logo: `${APP_URL}/awraq-logo-black.png`,
    sameAs: ['https://t.me/AwraqHustlehub'],
    description:
      'Awraq Skills offers practical digital marketing courses and digital products for freelancers, students, and business owners.',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Awraq Skills',
    url: APP_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${APP_URL}/courses?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <HomePageClient courses={data.courses} products={data.products} />
    </>
  );
}