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

export async function GET() {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabase
    .from('digital_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { title, description, price, fileKey, fileType, thumbnailUrl, isPublished } = body;

  if (!title?.trim() || price === undefined || !fileKey) {
    return NextResponse.json({ error: 'title, price and file are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('digital_products')
    .insert({
      title: title.trim(),
      description,
      price: parseFloat(price) || 0,
      file_key: fileKey,
      file_type: fileType || 'pdf',
      thumbnail_url: thumbnailUrl,
      is_published: !!isPublished,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, product: data });
}