import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getDownloadUrl, BUCKETS } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Use admin client to bypass RLS for public read of published testimonials
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(24);

    if (error) {
      console.error('Public testimonials fetch error:', error);
      return NextResponse.json({ testimonials: [] });
    }

    const testimonials = await Promise.all(
      (data || []).map(async (t) => {
        let src = '';
        let poster: string | undefined = undefined;

        if (t.media_key) {
          try {
            src = await getDownloadUrl(BUCKETS.content, t.media_key, 3600);
          } catch (err) {
            console.error('Failed to sign media_key:', err);
          }
        }

        if (t.poster_key) {
          try {
            poster = await getDownloadUrl(BUCKETS.content, t.poster_key, 3600);
          } catch (err) {
            console.error('Failed to sign poster_key:', err);
          }
        }

        return {
          id: t.id,
          name: t.name,
          role: t.role,
          type: t.media_type as 'image' | 'video',
          src,
          poster,
          quote: t.quote || undefined,
          rating: t.rating ?? 5,
        };
      })
    );

    return NextResponse.json({ testimonials });
  } catch (e) {
    console.error('Testimonials route exception:', e);
    return NextResponse.json({ testimonials: [] });
  }
}