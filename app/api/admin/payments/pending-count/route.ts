import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = await createClient();

    // Race auth check against a 4-second timeout to prevent 20s+ hangs
    let user = null;
    try {
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), 4000)
      );

      const result = await Promise.race([authPromise, timeoutPromise]) as any;
      user = result?.data?.user || null;
    } catch {
      // Auth timed out or failed — return 0 gracefully instead of 401
      return NextResponse.json({ count: 0 });
    }

    if (!user) {
      // Return 0 gracefully instead of 401 error during transient network lag
      return NextResponse.json({ count: 0 });
    }

    const adminDb = createAdminClient();
    const { data: profile } = await adminDb
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (
      !profile?.is_active ||
      !['super_admin', 'admin', 'sales'].includes(profile.role)
    ) {
      return NextResponse.json({ count: 0 });
    }

    const { count, error } = await adminDb
      .from('payment_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch {
    // Any uncaught error — return 0 gracefully so sidebar badge doesn't break
    return NextResponse.json({ count: 0 });
  }
}