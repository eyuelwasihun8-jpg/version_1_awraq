import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';

const STAFF_ROLES = ['super_admin', 'admin', 'sales', 'instructor'];

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = request.nextUrl.searchParams.get('courseId');
  const lessonId = request.nextUrl.searchParams.get('lessonId');

  if (!courseId || !lessonId) {
    return NextResponse.json({ error: 'Missing courseId or lessonId' }, { status: 400 });
  }

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isStaff = profile && STAFF_ROLES.includes(profile.role);

  // If not staff, enforce active student enrollment
  if (!isStaff) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }
  }

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, video_key, course_id, lesson_type')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .single();

  // Allow video streaming as long as a video_key exists
  if (!lesson || !lesson.video_key || !lesson.video_key.trim()) {
    return NextResponse.json({ error: 'Video not found for this lesson' }, { status: 404 });
  }

  const url = await getDownloadUrl(BUCKETS.content, lesson.video_key, 600);

  return NextResponse.json({ url, expiresIn: 600 });
}