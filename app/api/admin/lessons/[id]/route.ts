import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';
import { sanitizeLessonTextContent } from '@/lib/sanitizeLessonHtml';
import { deleteR2File, deleteR2Files } from '@/lib/r2-delete';

async function canEditLesson(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
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
  if (body.videoTitle !== undefined) updates.video_title = body.videoTitle?.trim() || null;
  if (body.videoDescription !== undefined) updates.video_description = body.videoDescription?.trim() || null;
  if (body.textContent !== undefined) updates.text_content = sanitizeLessonTextContent(body.textContent);
  if (body.quizData !== undefined) updates.quiz_data = body.quizData || null;

  // Delete old video from R2 when replacing
  if (body.videoKey !== undefined && current.video_key && body.videoKey !== current.video_key) {
    await deleteR2File(BUCKETS.content, current.video_key);
  }

  const finalVideo = body.videoKey !== undefined ? body.videoKey : current.video_key;
  const finalText =
    body.textContent !== undefined
      ? sanitizeLessonTextContent(body.textContent)
      : current.text_content;
  const finalQuiz = body.quizData !== undefined ? body.quizData : current.quiz_data;

  const hasVideo = !!(finalVideo && String(finalVideo).trim());
  const hasText = !!sanitizeLessonTextContent(finalText);
  const hasQuiz = !!(finalQuiz?.questions && finalQuiz.questions.length > 0);

  const willBePublished =
    body.isPublished !== undefined ? !!body.isPublished : current.is_published !== false;

  if (willBePublished && !hasVideo && !hasText && !hasQuiz) {
    return NextResponse.json(
      { error: 'A published lesson needs at least one section (Video, Text, or Quiz). Save as Draft instead.' },
      { status: 400 }
    );
  }

  if (body.videoKey !== undefined && !finalVideo) {
    updates.video_title = null;
    updates.video_description = null;
  }

  const count = [hasVideo, hasText, hasQuiz].filter(Boolean).length;
  updates.lesson_type =
    count > 1 ? 'mixed' : hasVideo ? 'video' : hasText ? 'text' : hasQuiz ? 'quiz' : 'text';

  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

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

  const adminDb = createAdminClient();

  // 1. Get lesson video key + resource file keys before deleting
  const { data: lesson } = await adminDb
    .from('lessons')
    .select('video_key')
    .eq('id', id)
    .single();

  const { data: resources } = await adminDb
    .from('lesson_resources')
    .select('file_key')
    .eq('lesson_id', id);

  // 2. Delete DB row (cascades to progress, quiz attempts, notes, resources)
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Clean up R2 files
  const filesToDelete = [
    lesson?.video_key,
    ...(resources || []).map((r) => r.file_key),
  ];
  await deleteR2Files(BUCKETS.content, filesToDelete);

  return NextResponse.json({ success: true });
}