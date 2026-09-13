import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { lessonId, watchSeconds, scrollPercentage, timeOnPageSeconds } = body;

  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId required' }, { status: 400 });
  }

  // Verify user is enrolled in the course this lesson belongs to
  const { data: lesson } = await supabase
    .from('lessons')
    .select('course_id')
    .eq('id', lessonId)
    .single();

  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', lesson.course_id)
    .single();

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
  }

  // Fetch current progress (if any) so we NEVER decrease values
  // Prevents cheating (e.g. student sending watchSeconds=0 to reset)
  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('watch_seconds, scroll_percentage, time_on_page_seconds')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  const newWatch = Math.max(existing?.watch_seconds ?? 0, watchSeconds ?? 0);
  const newScroll = Math.max(existing?.scroll_percentage ?? 0, scrollPercentage ?? 0);
  const newTime = Math.max(existing?.time_on_page_seconds ?? 0, timeOnPageSeconds ?? 0);

  // Upsert (insert or update)
  // The DB trigger auto-sets is_completed=true when thresholds are met
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        watch_seconds: newWatch,
        scroll_percentage: newScroll,
        time_on_page_seconds: newTime,
      },
      { onConflict: 'user_id,lesson_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    progress: data,
    isCompleted: data.is_completed,
  });
}

// GET current progress for a lesson (used when page loads)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lessonId = request.nextUrl.searchParams.get('lessonId');
  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId required' }, { status: 400 });
  }

  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  return NextResponse.json({ progress: data });
}