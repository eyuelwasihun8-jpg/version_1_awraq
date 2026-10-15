import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { deleteR2File } from '@/lib/r2-delete';
import { BUCKETS } from '@/lib/r2';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin', 'admin', 'instructor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const adminDb = createAdminClient();

  // 1. Get file key before deleting
  const { data: resource } = await adminDb
    .from('lesson_resources')
    .select('file_key, resource_type')
    .eq('id', id)
    .single();

  // 2. Delete DB row
  const { error } = await supabase.from('lesson_resources').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Clean up R2 file (only for uploaded files, not external links)
  if (resource && resource.resource_type !== 'link' && resource.file_key) {
    await deleteR2File(BUCKETS.content, resource.file_key);
  }

  return NextResponse.json({ success: true });
}