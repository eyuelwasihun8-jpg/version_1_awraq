import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { searchQuerySchema } from '@/lib/validators';
import { createHandler } from '@/lib/api-handler';

export const GET = createHandler(
  null,
  searchQuerySchema,
  async (request) => {
    const { validatedQuery } = request;

    const supabase = await createClient();

    const { q, category, limit, offset } = validatedQuery;

    let dbQuery = supabase
      .from('courses')
      .select('id, title, description, category, price, thumbnail_url, created_at', {
        count: 'exact',
      })
      .eq('is_published', true);

    // Fuzzy search on title OR description
    if (q) {
      dbQuery = dbQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
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
);