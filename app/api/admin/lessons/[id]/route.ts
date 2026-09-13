import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';

async function canEditLesson(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin', 'admin', 'instructor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await canEditLesson(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: lesson, error } = await supabase.from('lessons').select('*').eq('id', id).single();
  if (error || !lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let videoUrl: string | null = null;
  if (lesson.video_key) {
    try {
      videoUrl = await getDownloadUrl(BUCKETS.content, lesson.video_key, 600);
    } catch {}
  }

  return NextResponse.json({ lesson, videoUrl });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await canEditLesson(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { data: current } = await supabase.from('lessons').select('*').eq('id', id).single();
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Record<string, any> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.orderIndex !== undefined) updates.order_index = body.orderIndex;
  if (body.durationSeconds !== undefined) updates.duration_seconds = body.durationSeconds;
  if (body.moduleId !== undefined) updates.module_id = body.moduleId;
  if (body.isPublished !== undefined) updates.is_published = body.isPublished;
  if (body.videoKey !== undefined) updates.video_key = body.videoKey || null;
  if (body.textContent !== undefined) updates.text_content = body.textContent || null;
  if (body.quizData !== undefined) updates.quiz_data = body.quizData || null;

  const finalVideo = body.videoKey !== undefined ? body.videoKey : current.video_key;
  const finalText = body.textContent !== undefined ? body.textContent : current.text_content;
  const finalQuiz = body.quizData !== undefined ? body.quizData : current.quiz_data;

  const hasVideo = !!(finalVideo && String(finalVideo).trim());
  const hasText = !!(finalText && String(finalText).replace(/<[^>]*>/g, '').trim().length > 0);
  const hasQuiz = !!(finalQuiz?.questions && finalQuiz.questions.length > 0);

  if (!hasVideo && !hasText && !hasQuiz) {
    return NextResponse.json({ error: 'Lesson must have at least one content section' }, { status: 400 });
  }

  const count = [hasVideo, hasText, hasQuiz].filter(Boolean).length;
  updates.lesson_type = count > 1 ? 'mixed' : hasVideo ? 'video' : hasText ? 'text' : 'quiz';

  const { data, error } = await supabase.from('lessons').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, lesson: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await canEditLesson(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}