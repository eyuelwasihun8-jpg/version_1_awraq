import { createClient } from '@/lib/supabase-server';
import { CourseFormClient } from '@/components/admin/CourseFormClient';
import { ModulesBuilder } from '@/components/admin/ModulesBuilder';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !['super_admin', 'admin', 'instructor'].includes(profile.role)
  ) {
    redirect('/');
  }

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (!course) notFound();

  // Instructors can only edit their own courses
  if (profile.role === 'instructor' && course.instructor_id !== user.id) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Top action bar with Analytics link */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href={`/${PORTAL_SLUG}/courses`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Courses</span>
        </Link>

        <Link
          href={`/${PORTAL_SLUG}/courses/${id}/analytics`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#07CCFD] to-[#06B8E4] border-b-[3px] border-[#05A3CA] hover:border-b-[1px] hover:translate-y-[2px] text-[#0F172A] text-sm font-bold shadow-[0_8px_20px_rgba(7,204,253,0.3)] transition-all cursor-pointer"
        >
          <BarChart3 className="w-4 h-4" />
          <span>View Analytics</span>
        </Link>
      </div>

      <CourseFormClient course={course} />
      <ModulesBuilder courseId={id} />
    </div>
  );
}