import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_CONTENT: z.string().min(1),
  R2_BUCKET_RECEIPTS: z.string().min(1),
  R2_BUCKET_CERTIFICATES: z.string().min(1),
  // Optional: when empty, the app falls back to signed URLs via /api/thumbnail.
  // (Making this required meant a missing var crashed /api/leads + /api/thumbnail
  // at import time, with no useful error.)
  NEXT_PUBLIC_R2_PUBLIC_URL: z.string().url().optional().or(z.literal('')),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Admin Portal
  NEXT_PUBLIC_ADMIN_SLUG: z.string().min(1).default('staff-portal-x7k9m'),
  NEXT_PUBLIC_ADMIN_LOGIN_SLUG: z.string().min(1).default('staff-login-x7k9m'),

  // Security (optional but recommended)
  TURNSTILE_SECRET_KEY: z.string().optional(),
  TURNSTILE_SITE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .flatMap(([field, errs]) => errs.map((e) => `${field}: ${e}`))
      .join('\n');
    throw new Error(`Invalid environment variables:\n${messages}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

// Validate on import in server context
if (typeof window === 'undefined') {
  getEnv();
}