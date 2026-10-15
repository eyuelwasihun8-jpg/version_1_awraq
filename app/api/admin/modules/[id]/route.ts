import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { deleteR2Files } from '@/lib/r2-delete';
import { BUCKETS } from '@/lib/r2';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;

  const { data, error } = await supabase
    .from('course_modules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, module: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const adminDb = createAdminClient();

  // 1. Collect all R2 file keys from lessons inside this module
  const { data: lessons } = await adminDb
    .from('lessons')
    .select('id, video_key')
    .eq('module_id', id);

  const lessonIds = (lessons || []).map((l) => l.id);

  let resourceKeys: string[] = [];
  if (lessonIds.length > 0) {
    const { data: resources } = await adminDb
      .from('lesson_resources')
      .select('file_key')
      .in('lesson_id', lessonIds);
    resourceKeys = (resources || [])
      .map((r) => r.file_key)
      .filter((k): k is string => !!k);
  }

  // 2. Delete DB row (FK cascade deletes lessons → progress, quiz attempts, notes, resources)
  const { error } = await supabase.from('course_modules').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Clean up R2 files
  const filesToDelete = [
    ...(lessons || []).map((l) => l.video_key),
    ...resourceKeys,
  ];
  await deleteR2Files(BUCKETS.content, filesToDelete);

  return NextResponse.json({ success: true });
}