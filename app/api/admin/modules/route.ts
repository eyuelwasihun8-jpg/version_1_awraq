import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

async function requireStaff(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
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

// GET all modules for a course (with lessons nested)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const courseId = request.nextUrl.searchParams.get('courseId');
  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  // Fetch modules
  const { data: modules, error } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch all lessons for this course
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  // Group lessons under their module
  const modulesWithLessons = (modules || []).map((m) => ({
    ...m,
    lessons: (lessons || []).filter((l) => l.module_id === m.id),
  }));

  return NextResponse.json({ modules: modulesWithLessons });
}

// CREATE new module
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { courseId, title, description } = body;

  if (!courseId || !title?.trim()) {
    return NextResponse.json({ error: 'courseId and title required' }, { status: 400 });
  }

  // Get next order_index
  const { data: existing } = await supabase
    .from('course_modules')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data, error } = await supabase
    .from('course_modules')
    .insert({
      course_id: courseId,
      title: title.trim(),
      description: description?.trim() || null,
      order_index: nextOrder,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, module: { ...data, lessons: [] } });
}