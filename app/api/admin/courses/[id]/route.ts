import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

async function checkAccess(supabase: any, courseId: string) {
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

  // Instructors can only edit their own
  if (profile.role === 'instructor') {
    const { data: course } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single();

    if (!course || course.instructor_id !== user.id) {
      return { error: 'Not your course', status: 403 };
    }
  }

  return { user, profile };
}

// UPDATE course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await checkAccess(supabase, id);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.category !== undefined) updates.category = body.category;
  if (body.price !== undefined) updates.price = body.price;
  if (body.thumbnailUrl !== undefined) updates.thumbnail_url = body.thumbnailUrl;
  if (body.certificateTemplateKey !== undefined)
    updates.certificate_template_key = body.certificateTemplateKey;
  if (body.isPublished !== undefined) updates.is_published = body.isPublished;

  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, course: data });
}

// DELETE course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await checkAccess(supabase, id);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}