import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lessonId = request.nextUrl.searchParams.get('lessonId');
  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId required' }, { status: 400 });
  }

  // Check enrollment via lesson → course
  const { data: lesson } = await supabase
    .from('lessons')
    .select('course_id')
    .eq('id', lessonId)
    .single();

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', lesson.course_id)
    .single();

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
  }

  // Load resources
  const { data: resources } = await supabase
    .from('lesson_resources')
    .select('*')
    .eq('lesson_id', lessonId);

  if (!resources) return NextResponse.json({ resources: [] });

  // Enrich file resources with signed URLs; leave links alone
  const enriched = await Promise.all(
    resources.map(async (r) => {
      if ((r.resource_type === 'pdf' || r.resource_type === 'file') && r.file_key) {
        const url = await getDownloadUrl(BUCKETS.content, r.file_key, 600);
        return { ...r, download_url: url };
      }
      return r;
    })
  );

  return NextResponse.json({ resources: enriched });
}