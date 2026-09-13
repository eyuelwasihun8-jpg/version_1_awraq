import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { lessonId, answers } = body;

  if (!lessonId || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'lessonId and answers required' }, { status: 400 });
  }

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, course_id, quiz_data, lesson_type')
    .eq('id', lessonId)
    .single();

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

  // FIXED: Accept ANY lesson that has quiz_data, not just lesson_type = 'quiz'
  // This supports mixed lessons (video + text + quiz)
  if (!lesson.quiz_data || !lesson.quiz_data.questions?.length) {
    return NextResponse.json({ error: 'This lesson has no quiz' }, { status: 400 });
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', lesson.course_id)
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
  }

  const quizData = lesson.quiz_data as any;
  const questions = quizData.questions || [];

  let correctCount = 0;
  const feedback: any[] = [];

  for (const question of questions) {
    const userAnswer = answers.find((a) => a.questionId === question.id);
    const correctOptionIds = new Set<string>(
      (question.options || [])
        .filter((o: any) => o.is_correct)
        .map((o: any) => o.id as string)
    );

    const selectedIds = new Set<string>(userAnswer?.selectedOptionIds || []);

    const isCorrect =
      correctOptionIds.size === selectedIds.size &&
      Array.from(correctOptionIds).every((id) => selectedIds.has(id));

    if (isCorrect) correctCount++;

    feedback.push({
      questionId: question.id,
      isCorrect,
      correctOptionIds: Array.from(correctOptionIds),
      selectedOptionIds: Array.from(selectedIds),
    });
  }

  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  // Save attempt (no passing score logic — quizzes are always optional)
  const { data: attempt, error } = await supabase
    .from('lesson_quiz_attempts')
    .insert({
      user_id: user.id,
      lesson_id: lessonId,
      answers,
      score,
      passed: score === 100, // Passed = got 100%, purely for display
    })
    .select()
    .single();

  if (error) {
    console.error('Quiz save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    score,
    correctCount,
    totalQuestions: questions.length,
    feedback,
    attempt,
  });
}

// GET past attempts
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lessonId = request.nextUrl.searchParams.get('lessonId');
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });

  const { data, error } = await supabase
    .from('lesson_quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .order('attempted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ attempts: data || [] });
}