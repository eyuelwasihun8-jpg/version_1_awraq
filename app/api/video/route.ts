import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { videoQuerySchema } from '@/lib/validators';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';
import { createHandler, withAuth } from '@/lib/api-handler';

const STAFF_ROLES = ['super_admin', 'admin', 'sales', 'instructor'];

export const GET = createHandler(
  null,
  videoQuerySchema,
  withAuth(async (request) => {
    const { validatedQuery } = request;
    const { user, profile } = request.auth!;
    const { courseId, lessonId } = validatedQuery;
    const isStaff = STAFF_ROLES.includes(profile.role);

    // If not staff, enforce active student enrollment
    const supabase = await createClient();
    const [enrollmentResult, lessonResult] = await Promise.all([
      isStaff
        ? Promise.resolve({ data: true })
        : supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .eq('is_active', true)
            .maybeSingle(),
      supabase
        .from('lessons')
        .select('id, video_key, course_id, lesson_type')
        .eq('id', lessonId)
        .eq('course_id', courseId)
        .maybeSingle(),
    ]);

    if (!isStaff && !enrollmentResult.data) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    const lesson = lessonResult.data;

    // Allow video streaming as long as a video_key exists
    if (!lesson || !lesson.video_key || !lesson.video_key.trim()) {
      return NextResponse.json({ error: 'Video not found for this lesson' }, { status: 404 });
    }

    const url = await getDownloadUrl(BUCKETS.content, lesson.video_key, 600);

    return NextResponse.json({ url, expiresIn: 600 });
  }, 'user')
);