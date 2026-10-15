import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { deleteR2File } from '@/lib/r2-delete';
import { BUCKETS } from '@/lib/r2';

async function requireStaff(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin', 'admin', 'instructor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const updates: Record<string, any> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.price !== undefined) updates.price = parseFloat(body.price) || 0;
  if (body.fileKey !== undefined) updates.file_key = body.fileKey;
  if (body.fileType !== undefined) updates.file_type = body.fileType;
  if (body.thumbnailUrl !== undefined) updates.thumbnail_url = body.thumbnailUrl;
  if (body.isPublished !== undefined) updates.is_published = body.isPublished;

  // Delete old files from R2 when replacing
  if (body.fileKey !== undefined || body.thumbnailUrl !== undefined) {
    const adminDb = createAdminClient();
    const { data: current } = await adminDb
      .from('digital_products')
      .select('file_key, thumbnail_url')
      .eq('id', id)
      .single();

    if (current) {
      if (body.fileKey !== undefined && current.file_key && body.fileKey !== current.file_key) {
        await deleteR2File(BUCKETS.content, current.file_key);
      }
      if (body.thumbnailUrl !== undefined && current.thumbnail_url && body.thumbnailUrl !== current.thumbnail_url) {
        await deleteR2File(BUCKETS.content, current.thumbnail_url);
      }
    }
  }

  const { data, error } = await supabase
    .from('digital_products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, product: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const adminDb = createAdminClient();

  // 1. Get file keys before deleting
  const { data: product } = await adminDb
    .from('digital_products')
    .select('file_key, thumbnail_url')
    .eq('id', id)
    .single();

  // 2. Delete DB row
  const { error } = await supabase.from('digital_products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Clean up R2 files
  if (product) {
    await deleteR2File(BUCKETS.content, product.file_key);
    await deleteR2File(BUCKETS.content, product.thumbnail_url);
  }

  return NextResponse.json({ success: true });
}