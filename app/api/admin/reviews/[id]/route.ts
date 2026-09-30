import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

async function requireManager(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'sales'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 as const };
  }

  return { user, role: profile.role as string };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireManager(supabase);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const adminDb = createAdminClient();

  const updates: Record<string, any> = {};

  if (typeof body.isPublished === 'boolean') {
    updates.is_published = body.isPublished;
    updates.published_at = body.isPublished ? new Date().toISOString() : null;
    updates.published_by = body.isPublished ? auth.user.id : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  // FIXED: Removed broken profiles embed join
  const { data, error } = await adminDb
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .select('*, courses(title)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit Log
  await adminDb.from('audit_logs').insert({
    actor_id: auth.user.id,
    actor_role: auth.role,
    action: body.isPublished ? 'publish_review' : 'unpublish_review',
    target_type: 'review',
    target_id: id,
    details: { course_id: data.course_id, rating: data.rating },
  });

  return NextResponse.json({ success: true, review: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireManager(supabase);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const adminDb = createAdminClient();
  const { error } = await adminDb.from('reviews').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminDb.from('audit_logs').insert({
    actor_id: auth.user.id,
    actor_role: auth.role,
    action: 'delete_review',
    target_type: 'review',
    target_id: id,
  });

  return NextResponse.json({ success: true });
}