import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { onboardingSchema } from '@/lib/validators';
import { createHandler, withAuth, withRateLimit } from '@/lib/api-handler';

const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000, keyPrefix: 'onboarding' };

export const POST = createHandler(
  onboardingSchema,
  null,
  withRateLimit(
    withAuth(async (request) => {
      const { validatedData: body } = request;

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: body.fullName.trim(),
          phone: body.phone.trim(),
          gender: body.gender,
          age_group: body.ageGroup,
          life_status: body.lifeStatus,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true, profile: data });
    }, 'user'),
    RATE_LIMIT
  )
);

export const GET = createHandler(
  null,
  null,
  withAuth(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed, full_name, phone, gender, age_group, life_status')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ profile: data });
  }, 'user')
);