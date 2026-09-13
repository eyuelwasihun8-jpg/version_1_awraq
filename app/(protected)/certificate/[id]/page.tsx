import { createClient } from '@/lib/supabase-server';
import { CertificateClient } from '@/components/certificate/CertificateClient';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrollment) redirect(`/courses/${courseId}`);

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, thumbnail_url')
    .eq('id', courseId)
    .single();

  if (!course) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return <CertificateClient course={course} defaultName={profile?.full_name || ''} />;
}