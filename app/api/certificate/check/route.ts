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

  // Already has a certificate?
  const { data: existing } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      eligible: true,
      alreadyIssued: true,
      certificate: existing,
    });
  }

  // Check completion — all lessons must be complete
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId);

  if (!lessons || lessons.length === 0) {
    return NextResponse.json({ eligible: false, reason: 'No lessons in course' });
  }

  const lessonIds = lessons.map((l) => l.id);

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', user.id)
    .in('lesson_id', lessonIds);

  const completedCount = progress?.filter((p) => p.is_completed).length ?? 0;

  if (completedCount < lessons.length) {
    return NextResponse.json({
      eligible: false,
      reason: 'Course not fully completed',
      completedLessons: completedCount,
      totalLessons: lessons.length,
    });
  }

  return NextResponse.json({
    eligible: true,
    alreadyIssued: false,
    totalLessons: lessons.length,
  });
}