import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// CREATE a new note
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { lessonId, courseId, content } = body;

  if (!lessonId || !courseId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('lesson_notes')
    .insert({
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, note: data });
}

// LIST notes — filter by courseId OR lessonId
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courseId = request.nextUrl.searchParams.get('courseId');
  const lessonId = request.nextUrl.searchParams.get('lessonId');

  let query = supabase
    .from('lesson_notes')
    .select(`
      id,
      content,
      created_at,
      updated_at,
      lesson_id,
      course_id,
      lessons ( title ),
      courses ( title )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (courseId) query = query.eq('course_id', courseId);
  if (lessonId) query = query.eq('lesson_id', lessonId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notes: data });
}