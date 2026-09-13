import { createClient } from '@supabase/supabase-js';

// ONLY use in API routes for admin actions (approve payment, etc.)
// NEVER import this in client components
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}