import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

async function requireStaff(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin', 'admin', 'instructor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user };
}

function deriveLessonType(hasVideo: boolean, hasText: boolean, hasQuiz: boolean) {
  const count = [hasVideo, hasText, hasQuiz].filter(Boolean).length;
  if (count > 1) return 'mixed';
  if (hasVideo) return 'video';
  if (hasText) return 'text';
  if (hasQuiz) return 'quiz';
  return 'text';
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const courseId = request.nextUrl.searchParams.get('courseId');
  const moduleId = request.nextUrl.searchParams.get('moduleId');
  if (!courseId && !moduleId) {
    return NextResponse.json({ error: 'courseId or moduleId required' }, { status: 400 });
  }
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let query = supabase.from('lessons').select('*').order('order_index', { ascending: true });
  if (moduleId) query = query.eq('module_id', moduleId);
  else if (courseId) query = query.eq('course_id', courseId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lessons: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const {
    courseId,
    moduleId,
    title,
    videoKey,
    textContent,
    quizData,
    orderIndex,
    durationSeconds,
    isPublished,
  } = body;

  if (!courseId || !moduleId || !title?.trim()) {
    return NextResponse.json({ error: 'courseId, moduleId and title required' }, { status: 400 });
  }

  const hasVideo = !!(videoKey && String(videoKey).trim());
  const hasText = !!(textContent && String(textContent).replace(/<[^>]*>/g, '').trim().length > 0);
  const hasQuiz = !!(quizData?.questions && Array.isArray(quizData.questions) && quizData.questions.length > 0);

  if (!hasVideo && !hasText && !hasQuiz) {
    return NextResponse.json(
      { error: 'Add at least one of: Video, Text, or Quiz' },
      { status: 400 }
    );
  }

  if (hasQuiz) {
    const invalid = quizData.questions.some(
      (q: any) =>
        !q.question?.trim() ||
        !q.options?.some((o: any) => o.is_correct) ||
        q.options?.some((o: any) => !o.text?.trim() && q.type !== 'true_false')
    );
    if (invalid) {
      return NextResponse.json({ error: 'Some quiz questions are incomplete' }, { status: 400 });
    }
  }

  const lessonType = deriveLessonType(hasVideo, hasText, hasQuiz);

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      course_id: courseId,
      module_id: moduleId,
      title: title.trim(),
      lesson_type: lessonType,
      video_key: hasVideo ? videoKey : null,
      text_content: hasText ? textContent : null,
      quiz_data: hasQuiz ? quizData : null,
      order_index: orderIndex ?? 0,
      duration_seconds: durationSeconds ?? (hasVideo ? 0 : 60),
      is_published: isPublished !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, lesson: data });
}