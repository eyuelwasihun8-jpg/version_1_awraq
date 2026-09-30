import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

async function requireStaff(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.role !== undefined) updates.role = body.role.trim();
  if (body.quote !== undefined) updates.quote = body.quote?.trim() || null;
  if (body.rating !== undefined) {
    updates.rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
  }
  if (body.mediaType !== undefined) {
    updates.media_type = body.mediaType === 'video' ? 'video' : 'image';
  }
  if (body.mediaKey !== undefined) updates.media_key = body.mediaKey || null;
  if (body.posterKey !== undefined) updates.poster_key = body.posterKey || null;
  if (body.isPublished !== undefined) updates.is_published = !!body.isPublished;
  if (body.sortOrder !== undefined) updates.sort_order = Number(body.sortOrder) || 0;

  const adminDb = createAdminClient();

  const { data, error } = await adminDb
    .from('testimonials')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Testimonial update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const testimonial = data?.[0];
  if (!testimonial) {
    return NextResponse.json({ error: 'Testimonial not found in database' }, { status: 404 });
  }

  return NextResponse.json({ success: true, testimonial });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const adminDb = createAdminClient();

  const { error } = await adminDb.from('testimonials').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}