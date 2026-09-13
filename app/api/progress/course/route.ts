import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courseId = request.nextUrl.searchParams.get('courseId');
  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  // Get all lessons in the course
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId);

  if (!lessons || lessons.length === 0) {
    return NextResponse.json({
      totalLessons: 0,
      completedLessons: 0,
      percentage: 0,
      isCourseComplete: false,
    });
  }

  const lessonIds = lessons.map((l) => l.id);

  // Get all progress rows for this user in this course
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', user.id)
    .in('lesson_id', lessonIds);

  const completedLessons = progress?.filter((p) => p.is_completed).length ?? 0;
  const totalLessons = lessons.length;
  const percentage = Math.round((completedLessons / totalLessons) * 100);

  return NextResponse.json({
    totalLessons,
    completedLessons,
    percentage,
    isCourseComplete: completedLessons === totalLessons,
  });
}