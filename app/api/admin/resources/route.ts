import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

async function requireStaff(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin', 'admin', 'instructor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user };
}

// GET all resources for a lesson (admin view)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const lessonId = request.nextUrl.searchParams.get('lessonId');
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });

  const { data, error } = await supabase
    .from('lesson_resources')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resources: data || [] });
}

// CREATE
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { lessonId, title, resourceType, fileKey, externalUrl } = body;

  if (!lessonId || !title || !resourceType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('lesson_resources')
    .insert({
      lesson_id: lessonId,
      title,
      resource_type: resourceType,
      file_key: fileKey,
      external_url: externalUrl,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, resource: data });
}