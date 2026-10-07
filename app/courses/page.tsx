import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { CoursesListClient } from '@/components/courses/CoursesListClient';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://awraqskills.com';

export const metadata: Metadata = {
  title: 'All Courses & Digital Products',
  description:
    'Browse all Awraq Skills courses and digital products: Facebook & Google Ads, social media marketing, content, design, and agency building. Learn step by step and build real skills.',
  alternates: { canonical: '/courses' },
  openGraph: {
    title: 'All Courses & Digital Products | Awraq Skills',
    description:
      'Browse all Awraq Skills courses and digital products — Facebook & Google Ads, social media, content, design, and agency building.',
    url: `${APP_URL}/courses`,
    type: 'website',
    images: [
      {
        url: '/hero-poster.jpg',
        width: 1200,
        height: 630,
        alt: 'Awraq Skills — Courses & Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Courses & Digital Products | Awraq Skills',
    description:
      'Browse all Awraq Skills courses and digital products — Facebook & Google Ads, social media, content, design, and agency building.',
    images: ['/hero-poster.jpg'],
  },
};

function BreadcrumbJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: APP_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Courses',
        item: `${APP_URL}/courses`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function ItemListJsonLd({ courses }: { courses: any[] }) {
  if (!courses || courses.length === 0) return null;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: courses.slice(0, 20).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${APP_URL}/courses/${c.id}`,
      name: c.title,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function CoursesPage() {
  const supabase = await createClient();
  const adminDb = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: courses }, { data: products }] = await Promise.all([
    adminDb
      .from('courses')
      .select('*, instructor:profiles(full_name, avatar_url)')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    adminDb
      .from('digital_products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ]);

  let enrolledCourseIds: string[] = [];
  let completedCourseIds: string[] = [];
  let purchasedProductIds: string[] = [];

  if (user) {
    const [{ data: enrollments }, { data: purchases }] = await Promise.all([
      adminDb
        .from('enrollments')
        .select('course_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true),
      adminDb
        .from('purchases')
        .select('product_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true),
    ]);

    enrolledCourseIds = (enrollments || []).map((e) => e.course_id);
    purchasedProductIds = (purchases || []).map((p) => p.product_id);

    if (enrolledCourseIds.length > 0) {
      const { data: progress } = await adminDb
        .from('student_progress_summary')
        .select('course_id, progress_percent')
        .eq('user_id', user.id)
        .eq('enrollment_active', true)
        .in('course_id', enrolledCourseIds);

      completedCourseIds = (progress || [])
        .filter((p) => Number(p.progress_percent) >= 100)
        .map((p) => p.course_id);
    }
  }

  return (
    <>
      <BreadcrumbJsonLd />
      <ItemListJsonLd courses={courses || []} />
      <CoursesListClient
        initialCourses={courses || []}
        initialProducts={products || []}
        enrolledCourseIds={enrolledCourseIds}
        completedCourseIds={completedCourseIds}
        purchasedProductIds={purchasedProductIds}
        isLoggedIn={!!user}
      />
    </>
  );
}