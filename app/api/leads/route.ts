import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';
import { verifyTurnstile, getClientIp } from '@/lib/turnstile';

// Rate limit: 5 requests per minute, 20 per hour per IP
const RATE_LIMIT_MINUTE = { max: 5, windowMs: 60 * 1000 };
const RATE_LIMIT_HOUR = { max: 20, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request) || 'unknown';

    // Check minute rate limit
    const minuteLimit = rateLimit(`leads:${clientIp}:min`, RATE_LIMIT_MINUTE.max, RATE_LIMIT_MINUTE.windowMs);
    if (!minuteLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(minuteLimit.retryAfter || 60) } }
      );
    }

    // Check hour rate limit
    const hourLimit = rateLimit(`leads:${clientIp}:hour`, RATE_LIMIT_HOUR.max, RATE_LIMIT_HOUR.windowMs);
    if (!hourLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(hourLimit.retryAfter || 3600) } }
      );
    }

    const body = await request.json();
    const { full_name, email, business_type, topic, notes, time_slot, source, turnstileToken } = body;

    // Verify Turnstile token (required for anonymous submissions)
    const turnstileResult = await verifyTurnstile(turnstileToken, clientIp);
    if (!turnstileResult.success) {
      console.warn('[Leads] Turnstile verification failed:', turnstileResult['error-codes']);
      return NextResponse.json(
        { error: 'Security verification failed. Please try again.' },
        { status: 403 }
      );
    }

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Sanitize inputs (basic)
    const sanitizedName = full_name.trim().slice(0, 100);
    const sanitizedEmail = email.trim().toLowerCase().slice(0, 254);
    const sanitizedBusinessType = business_type?.trim().slice(0, 50) || null;
    const sanitizedTopic = topic?.trim().slice(0, 100) || null;
    const sanitizedNotes = notes?.trim().slice(0, 1000) || null;
    const sanitizedTimeSlot = time_slot?.trim().slice(0, 50) || null;
    const sanitizedSource = source?.trim().slice(0, 50) || 'website';

    const supabase = await createClient();

    // Try to get logged-in user (optional — leads can be anonymous)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('leads')
      .insert({
        full_name: sanitizedName,
        email: sanitizedEmail,
        business_type: sanitizedBusinessType,
        topic: sanitizedTopic,
        notes: sanitizedNotes,
        time_slot: sanitizedTimeSlot,
        source: sanitizedSource,
        user_id: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to save request. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (err) {
    console.error('Lead submission error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}