import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { CourseDetailClient } from '@/components/courses/CourseDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://awraqskills.com';
const R2_PUBLIC = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

function buildImageUrl(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  if (!R2_PUBLIC) return null;
  return `${R2_PUBLIC.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
}

function truncate(text: string | null | undefined, max = 160): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + '…';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const adminDb = createAdminClient();

  const { data: course } = await adminDb
    .from('courses')
    .select('id, title, description, category, thumbnail_url, is_published')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (!course) {
    return {
      title: 'Course Not Found',
      description: 'This course is not available.',
      robots: { index: false, follow: false },
    };
  }

  const title = course.title;
  const description =
    truncate(course.description, 160) ||
    `Learn ${course.title} with practical lessons from Awraq Skills.`;
  const image =
    buildImageUrl(course.thumbnail_url) || `${APP_URL}/hero-poster.jpg`;
  const url = `${APP_URL}/courses/${course.id}`;

  return {
    title,
    description,
    alternates: { canonical: `/courses/${course.id}` },
    openGraph: {
      type: 'website',
      url,
      title: `${title} | Awraq Skills`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Awraq Skills`,
      description,
      images: [image],
    },
  };
}

function CourseJsonLd({
  course,
  url,
  image,
  avgRating,
  totalReviews,
  studentCount,
}: {
  course: any;
  url: string;
  image: string | null;
  avgRating: number;
  totalReviews: number;
  studentCount: number;
}) {
  const base: any = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description:
      (course.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ||
      course.title,
    url,
    provider: {
      '@type': 'Organization',
      name: 'Awraq Skills',
      sameAs: APP_URL,
    },
    inLanguage: 'en',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      inLanguage: 'en',
    },
  };

  if (image) base.image = image;

  if (course.instructor?.full_name) {
    base.instructor = {
      '@type': 'Person',
      name: course.instructor.full_name,
    };
  }

  if (course.price != null) {
    base.offers = {
      '@type': 'Offer',
      price: Number(course.price || 0),
      priceCurrency: 'ETB',
      availability: 'https://schema.org/InStock',
      url,
    };
  }

  if (totalReviews > 0 && avgRating > 0) {
    base.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (studentCount > 0) {
    base.audience = {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(base) }}
    />
  );
}

function BreadcrumbJsonLd({ courseTitle, courseId }: { courseTitle: string; courseId: string }) {
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
      {
        '@type': 'ListItem',
        position: 3,
        name: courseTitle,
        item: `${APP_URL}/courses/${courseId}`,
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

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('*, instructor:profiles(full_name, avatar_url)')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (!course) notFound();

  const { count: lessonCount } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)
    .neq('is_published', false);

  const { count: studentCount } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)
    .eq('is_active', true);

  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('id, rating, review_text, created_at, user_id')
    .eq('course_id', id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6);

  const userIds = Array.from(new Set((reviewsRaw || []).map((r) => r.user_id)));
  let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);
    (profiles || []).forEach((p) => profileMap.set(p.id, p));
  }

  const reviews = (reviewsRaw || []).map((r) => ({
    ...r,
    user: profileMap.get(r.user_id) || null,
  }));

  const { data: allPublished } = await supabase
    .from('reviews')
    .select('rating')
    .eq('course_id', id)
    .eq('is_published', true);

  const avgRating =
    allPublished && allPublished.length > 0
      ? allPublished.reduce((sum, r) => sum + r.rating, 0) / allPublished.length
      : 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isEnrolled = false;
  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .eq('is_active', true)
      .maybeSingle();
    isEnrolled = !!enrollment;
  }

  const totalReviews = allPublished?.length || 0;
  const roundedAvg = Math.round(avgRating * 10) / 10;
  const image = buildImageUrl(course.thumbnail_url);
  const url = `${APP_URL}/courses/${course.id}`;

  return (
    <>
      <BreadcrumbJsonLd courseTitle={course.title} courseId={course.id} />
      <CourseJsonLd
        course={course}
        url={url}
        image={image}
        avgRating={roundedAvg}
        totalReviews={totalReviews}
        studentCount={studentCount || 0}
      />
      <CourseDetailClient
        course={course}
        lessonCount={lessonCount || 0}
        studentCount={studentCount || 0}
        reviews={reviews}
        averageRating={roundedAvg}
        totalReviews={totalReviews}
        isLoggedIn={!!user}
        isEnrolled={isEnrolled}
      />
    </>
  );
}