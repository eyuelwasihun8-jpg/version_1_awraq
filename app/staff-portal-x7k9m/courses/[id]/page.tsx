import { createClient } from '@/lib/supabase-server';
import { CourseFormClient } from '@/components/admin/CourseFormClient';
import { ModulesBuilder } from '@/components/admin/ModulesBuilder';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single();
  if (!course) notFound();

  return (
    <div className="space-y-8">
      <CourseFormClient course={course} />
      <ModulesBuilder courseId={id} />
    </div>
  );
}