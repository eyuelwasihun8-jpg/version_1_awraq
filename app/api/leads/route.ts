import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, business_type, topic, notes, time_slot, source } = body;

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

    const supabase = await createClient();

    // Try to get logged-in user (optional — leads can be anonymous)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('leads')
      .insert({
        full_name,
        email,
        business_type: business_type || null,
        topic: topic || null,
        notes: notes || null,
        time_slot: time_slot || null,
        source: source || 'website',
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