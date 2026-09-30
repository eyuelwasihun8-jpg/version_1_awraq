import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ApiError, handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw ApiError.unauthorized();

    const body = await request.json();
    const { lessonId, watchSeconds, scrollPercentage, timeOnPageSeconds } = body;

    if (!lessonId) throw ApiError.badRequest('lessonId required');

    // Verify enrollment and get lesson info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('course_id, duration_seconds, lesson_type, video_key, text_content, quiz_data')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) throw ApiError.notFound('Lesson not found');

    // Must be actively enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!enrollment) throw ApiError.forbidden('Not enrolled');

    // Fetch existing metrics to prevent decrease
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('watch_seconds, scroll_percentage, time_on_page_seconds, is_completed, completed_at')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const duration = lesson.duration_seconds ?? 0;

    // 1. watchSeconds: prevent decrease
    let validatedWatch = existing?.watch_seconds ?? 0;
    if (typeof watchSeconds === 'number' && watchSeconds > 0) {
      const absoluteMax = duration > 0 ? Math.min(watchSeconds, duration) : Math.min(watchSeconds, 7200);
      validatedWatch = Math.max(validatedWatch, absoluteMax);
    }

    // 2. scrollPercentage: clamp 0-100, prevent decrease
    let validatedScroll = existing?.scroll_percentage ?? 0;
    if (typeof scrollPercentage === 'number') {
      const clamped = Math.max(0, Math.min(100, scrollPercentage));
      validatedScroll = Math.max(validatedScroll, clamped);
    }

    // 3. timeOnPageSeconds: prevent decrease
    let validatedTime = existing?.time_on_page_seconds ?? 0;
    if (typeof timeOnPageSeconds === 'number' && timeOnPageSeconds > 0) {
      const capped = Math.min(timeOnPageSeconds, 24 * 60 * 60);
      validatedTime = Math.max(validatedTime, capped);
    }

    // Determine completion (never revert a completed lesson back to incomplete)
    let isCompleted = existing?.is_completed || false;

    if (!isCompleted) {
      const hasVideo = !!(lesson.video_key && lesson.video_key.trim());
      const hasText = !!(lesson.text_content && lesson.text_content.replace(/<[^>]*>/g, '').trim());

      const videoOk = hasVideo ? (duration > 0 ? validatedWatch >= duration * 0.8 : validatedWatch >= 1) : false;
      const textOk = hasText ? validatedScroll >= 80 : false;

      if (videoOk || textOk) {
        isCompleted = true;
      }
    }

    const completedAt = isCompleted
      ? (existing?.completed_at || new Date().toISOString())
      : null;

    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          watch_seconds: validatedWatch,
          scroll_percentage: validatedScroll,
          time_on_page_seconds: validatedTime,
          is_completed: isCompleted,
          completed_at: completedAt,
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      progress: data,
      isCompleted: data.is_completed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw ApiError.unauthorized();

    const lessonId = request.nextUrl.searchParams.get('lessonId');
    if (!lessonId) throw ApiError.badRequest('lessonId required');

    const { data } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    return NextResponse.json({ progress: data });
  } catch (error) {
    return handleApiError(error);
  }
}