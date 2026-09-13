import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// SUBMIT a review
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { courseId, rating, reviewText } = body;

  if (!courseId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Must be enrolled to review
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
  }

  // Upsert so students can update their review later
  const { data, error } = await supabase
    .from('reviews')
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        rating,
        review_text: reviewText?.trim() || null,
      },
      { onConflict: 'user_id,course_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, review: data });
}

// LIST reviews for a course (public)
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const courseId = request.nextUrl.searchParams.get('courseId');
  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      review_text,
      created_at,
      profiles ( full_name, avatar_url )
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  // Calculate average rating
  const { data: allRatings } = await supabase
    .from('reviews')
    .select('rating')
    .eq('course_id', courseId);

  const average =
    allRatings && allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

  return NextResponse.json({
    reviews: reviews ?? [],
    averageRating: Math.round(average * 10) / 10,
    totalReviews: allRatings?.length ?? 0,
  });
}