import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { updateProfileSchema } from '@/lib/validators';
import { createHandler, withAuth, withRateLimit } from '@/lib/api-handler';

const RATE_LIMIT = { max: 20, windowMs: 60 * 60 * 1000, keyPrefix: 'profile' };

// GET current user's profile
export const GET = createHandler(
  null,
  null,
  withAuth(async (request) => {
    const supabase = await createClient();
    const { user } = request.auth!;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      profile: data,
      email: user.email,
    });
  }, 'user')
);

// UPDATE profile (name, phone, gender, age, life status, avatar)
export const PATCH = createHandler(
  updateProfileSchema,
  null,
  withRateLimit(
    withAuth(async (request) => {
      const { validatedData: body } = request;
      const supabase = await createClient();
      const { user } = request.auth!;

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (body.fullName !== undefined) updates.full_name = body.fullName?.trim() || null;
      if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
      if (body.gender !== undefined) updates.gender = body.gender || null;
      if (body.ageGroup !== undefined) updates.age_group = body.ageGroup || null;
      if (body.lifeStatus !== undefined) updates.life_status = body.lifeStatus || null;
      if (body.avatarUrl !== undefined) updates.avatar_url = body.avatarUrl || null;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true, profile: data });
    }, 'user'),
    RATE_LIMIT
  )
);