import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const category = request.nextUrl.searchParams.get('category');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20');
  const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0');

  let dbQuery = supabase
    .from('courses')
    .select('id, title, description, category, price, thumbnail_url, created_at', {
      count: 'exact',
    })
    .eq('is_published', true);

  // Fuzzy search on title OR description
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (category && category !== 'all') {
    dbQuery = dbQuery.eq('category', category);
  }

  dbQuery = dbQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Raw thumbnail keys returned. Frontend <CourseThumbnail /> resolves them.
  return NextResponse.json({
    courses: data ?? [],
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + limit,
  });
}