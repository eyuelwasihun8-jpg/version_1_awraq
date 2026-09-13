import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

async function requireAdminOrInstructor(supabase: any) {
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
  return { user, profile };
}

// LIST courses (admin view — includes unpublished)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdminOrInstructor(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let query = supabase
    .from('courses')
    .select('*, instructor:profiles!courses_instructor_id_fkey ( id, full_name )')
    .order('created_at', { ascending: false });

  // Instructors only see their own courses
  if (auth.profile!.role === 'instructor') {
    query = query.eq('instructor_id', auth.user!.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ courses: data ?? [] });
}

// CREATE a course
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdminOrInstructor(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { title, description, category, price, thumbnailUrl, certificateTemplateKey } = body;

  if (!title?.trim() || price === undefined) {
    return NextResponse.json({ error: 'title and price required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('courses')
    .insert({
      instructor_id: auth.user!.id,
      title: title.trim(),
      description,
      category,
      price,
      thumbnail_url: thumbnailUrl,
      certificate_template_key: certificateTemplateKey,
      is_published: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, course: data });
}