import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().default('https://placeholder.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder-service-key'),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().default('placeholder-r2-account'),
  R2_ACCESS_KEY_ID: z.string().default('placeholder-r2-key'),
  R2_SECRET_ACCESS_KEY: z.string().default('placeholder-r2-secret'),
  R2_BUCKET_CONTENT: z.string().default('content'),
  R2_BUCKET_RECEIPTS: z.string().default('receipts'),
  R2_BUCKET_CERTIFICATES: z.string().default('certificates'),
  NEXT_PUBLIC_R2_PUBLIC_URL: z.string().default('https://placeholder.r2.dev'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().default('https://awraqskills.com'),

  // Admin Portal
  NEXT_PUBLIC_ADMIN_SLUG: z.string().min(1).default('staff-portal-x7k9m'),
  NEXT_PUBLIC_ADMIN_LOGIN_SLUG: z.string().min(1).default('staff-login-x7k9m'),

  // Security
  TURNSTILE_SECRET_KEY: z.string().optional(),
  TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.warn('[Env] Some environment variables are unconfigured. Using defaults for build.');
    cachedEnv = envSchema.parse({});
    return cachedEnv;
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}