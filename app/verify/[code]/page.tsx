import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase-admin';
import { CertificateVerification } from '@/components/certificates/CertificateVerification';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://awraqskills.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  if (!code) return { title: 'Certificate Verification' };

  const cleanCode = code.trim().toUpperCase();
  const adminDb = createAdminClient();

  const { data: cert } = await adminDb
    .from('certificates')
    .select('student_name, course_id, certificate_code')
    .eq('certificate_code', cleanCode)
    .maybeSingle();

  if (!cert) {
    return {
      title: 'Invalid Certificate',
      description: 'The requested certificate code could not be verified.',
      robots: { index: false, follow: false },
    };
  }

  const { data: course } = await adminDb
    .from('courses')
    .select('title')
    .eq('id', cert.course_id)
    .single();

  const studentName = cert.student_name || 'Graduate';
  const courseName = course?.title || 'Awraq Course';
  const title = `Verified Certificate — ${studentName}`;
  const description = `Official certificate verification for ${studentName} for completing ${courseName} at Awraq Skills.`;
  const url = `${APP_URL}/verify/${cleanCode}`;

  return {
    title,
    description,
    alternates: { canonical: `/verify/${cleanCode}` },
    openGraph: {
      type: 'article',
      url,
      title: `${title} | Awraq Skills`,
      description,
      images: [
        {
          url: '/hero-poster.jpg',
          width: 1200,
          height: 630,
          alt: `Certificate of Completion for ${studentName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Awraq Skills`,
      description,
      images: ['/hero-poster.jpg'],
    },
  };
}

function CertificateVerificationJsonLd({
  code,
  studentName,
  courseTitle,
}: {
  code: string;
  studentName: string;
  courseTitle: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalCredential',
    name: `Certificate of Completion — ${courseTitle}`,
    description: `Official Awraq Skills credential issued to ${studentName}`,
    credentialCategory: 'Certificate',
    identifier: code,
    recognizedBy: {
      '@type': 'Organization',
      name: 'Awraq Skills',
      url: APP_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code) notFound();

  const cleanCode = code.trim().toUpperCase();
  const adminDb = createAdminClient();

  const { data: cert } = await adminDb
    .from('certificates')
    .select('*, courses(title)')
    .eq('certificate_code', cleanCode)
    .maybeSingle();

  return (
    <>
      {cert && (
        <CertificateVerificationJsonLd
          code={cleanCode}
          studentName={cert.student_name}
          courseTitle={cert.courses?.title || 'Awraq Course'}
        />
      )}
      <div className="min-h-screen bg-[#fbfaf7] pt-24 pb-16 flex items-center justify-center p-4">
        <CertificateVerification code={cleanCode} initialCert={cert} />
      </div>
    </>
  );
}