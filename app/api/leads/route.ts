import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { submitLeadSchema } from '@/lib/validators';
import { createHandler, withRateLimit } from '@/lib/api-handler';
import { verifyTurnstile, getClientIp } from '@/lib/turnstile';

const RATE_LIMIT_MINUTE = { max: 5, windowMs: 60 * 1000, keyPrefix: 'leads' };
const RATE_LIMIT_HOUR = { max: 20, windowMs: 60 * 60 * 1000, keyPrefix: 'leads' };

export const POST = createHandler(
  submitLeadSchema,
  null,
  withRateLimit(
    async (request) => {
      const { validatedData: body, clientIp } = request;

      // Verify Turnstile token (required for anonymous submissions)
      const turnstileResult = await verifyTurnstile(body.turnstileToken, clientIp);
      if (!turnstileResult.success) {
        console.warn('[Leads] Turnstile verification failed:', turnstileResult['error-codes']);
        return NextResponse.json(
          { error: 'Security verification failed. Please try again.' },
          { status: 403 }
        );
      }

      const supabase = await createClient();

      // Try to get logged-in user (optional — leads can be anonymous)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('leads')
        .insert({
          full_name: body.fullName.trim(),
          email: body.email.trim().toLowerCase(),
          business_type: body.businessType?.trim() || null,
          topic: body.topic?.trim() || null,
          notes: body.notes?.trim() || null,
          time_slot: body.timeSlot?.trim() || null,
          source: body.source?.trim() || 'website',
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
    },
    RATE_LIMIT_MINUTE
  )
);