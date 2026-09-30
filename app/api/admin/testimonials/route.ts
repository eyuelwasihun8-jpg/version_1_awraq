import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';

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
  return { user, profile };
}

export async function GET() {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const adminDb = createAdminClient();

  const { data, error } = await adminDb
    .from('testimonials')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = await Promise.all(
    (data || []).map(async (t) => {
      let mediaUrl: string | null = null;
      let posterUrl: string | null = null;
      try {
        if (t.media_key) mediaUrl = await getDownloadUrl(BUCKETS.content, t.media_key, 600);
        if (t.poster_key) posterUrl = await getDownloadUrl(BUCKETS.content, t.poster_key, 600);
      } catch {}
      return { ...t, mediaUrl, posterUrl };
    })
  );

  return NextResponse.json({ testimonials: items });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const {
    name,
    role,
    quote,
    rating,
    mediaType,
    mediaKey,
    posterKey,
    isPublished,
    sortOrder,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const type = mediaType === 'video' ? 'video' : 'image';
  const adminDb = createAdminClient();

  const { data, error } = await adminDb
    .from('testimonials')
    .insert({
      name: name.trim(),
      role: (role || 'Awraq Learner').trim(),
      quote: quote?.trim() || null,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      media_type: type,
      media_key: mediaKey || null,
      poster_key: type === 'video' ? posterKey || null : null,
      is_published: isPublished !== false,
      sort_order: Number(sortOrder) || 0,
    })
    .select();

  if (error) {
    console.error('Testimonial insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const testimonial = data?.[0];
  if (!testimonial) {
    return NextResponse.json({ error: 'Failed to create testimonial record' }, { status: 500 });
  }

  return NextResponse.json({ success: true, testimonial });
}