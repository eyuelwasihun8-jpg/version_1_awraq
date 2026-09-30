import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';

const MIN_REVIEW_LENGTH = 30;

/**
 * GET /api/reviews?courseId=...
 *   - Public list: published reviews only (max 6) + averageRating + totalReviews
 *
 * GET /api/reviews?courseId=...&mine=1
 *   - Authenticated: current user's own review (for certificate gate)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const courseId = request.nextUrl.searchParams.get('courseId');
  const mine = request.nextUrl.searchParams.get('mine') === '1';

  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  // ── Own review (certificate page gate) ───────────────────
  if (mine) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review });
  }

  // ── Public list: published only, max 6 ───────────────────
  let reviews: any[] | null = null;

  const { data: embedded, error: embedError } = await supabase
    .from('reviews')
    .select(
      `
      id,
      rating,
      review_text,
      created_at,
      is_published,
      profiles ( full_name, avatar_url )
    `
    )
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (!embedError) {
    reviews = (embedded || []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      review_text: r.review_text,
      created_at: r.created_at,
      user: r.profiles || null,
      profiles: r.profiles || null,
    }));
  } else {
    const { data: raw, error: rawError } = await supabase
      .from('reviews')
      .select('id, rating, review_text, created_at, user_id')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (rawError) {
      return NextResponse.json({ error: rawError.message }, { status: 500 });
    }

    const userIds = Array.from(new Set((raw || []).map((r) => r.user_id)));
    const profileMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      (profiles || []).forEach((p) => profileMap.set(p.id, p));
    }

    reviews = (raw || []).map((r) => {
      const profile = profileMap.get(r.user_id) || null;
      return {
        ...r,
        user: profile,
        profiles: profile,
      };
    });
  }

  // Average + total from ALL published
  const { data: allPublished } = await supabase
    .from('reviews')
    .select('rating')
    .eq('course_id', courseId)
    .eq('is_published', true);

  const totalReviews = allPublished?.length ?? 0;
  const averageRating =
    totalReviews > 0
      ? Math.round(
          (allPublished!.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10
        ) / 10
      : 0;

  return NextResponse.json({
    reviews: reviews ?? [],
    averageRating,
    totalReviews,
  });
}

/**
 * POST /api/reviews
 * Body: { courseId, rating, reviewText }
 * Rate limit: 3 per hour per user
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 3 review submissions per hour per user
  const rl = rateLimit(`reviews-post:${user.id}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many review submissions. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter || 3600) } }
    );
  }

  const body = await request.json();
  const courseId = body.courseId as string | undefined;
  const rating = Number(body.rating);
  const reviewText = String(body.reviewText ?? body.review_text ?? '').trim();

  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be an integer from 1 to 5' }, { status: 400 });
  }

  if (reviewText.length < MIN_REVIEW_LENGTH) {
    return NextResponse.json(
      {
        error: `Please write at least ${MIN_REVIEW_LENGTH} characters about your experience`,
      },
      { status: 400 }
    );
  }

  // Must be actively enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('is_active', true)
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
  }

  // Must have completed all published lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
    .neq('is_published', false);

  if (!lessons || lessons.length === 0) {
    return NextResponse.json({ error: 'No published lessons in this course' }, { status: 400 });
  }

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', user.id)
    .in(
      'lesson_id',
      lessons.map((l) => l.id)
    );

  const done = progress?.filter((p) => p.is_completed).length ?? 0;
  if (done < lessons.length) {
    return NextResponse.json(
      { error: 'Complete all lessons before leaving a review' },
      { status: 403 }
    );
  }

  // Existing review?
  const { data: existing } = await supabase
    .from('reviews')
    .select('id, is_published')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing?.is_published) {
    return NextResponse.json(
      { error: 'Your review is already published and cannot be edited' },
      { status: 400 }
    );
  }

  // Update existing unpublished review
  if (existing) {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating,
        review_text: reviewText,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, review: data, updated: true });
  }

  // Insert new review (starts unpublished — admin must publish)
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      course_id: courseId,
      rating,
      review_text: reviewText,
      is_published: false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: raced, error: raceErr } = await supabase
        .from('reviews')
        .update({ rating, review_text: reviewText })
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('is_published', false)
        .select()
        .maybeSingle();

      if (raceErr || !raced) {
        return NextResponse.json(
          { error: raceErr?.message || 'You already submitted a review for this course' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, review: raced, updated: true });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, review: data, updated: false });
}