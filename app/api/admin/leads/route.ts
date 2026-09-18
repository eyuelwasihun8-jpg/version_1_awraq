import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

async function requireStaff(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
  ) {
    return { error: 'Forbidden', status: 403 };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);

  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || searchParams.get('q') || '';

  const offset = (page - 1) * limit;

  // Build query on profiles table for student leads
  let query = supabase
    .from('profiles')
    .select(
      'id, full_name, phone, gender, age_group, life_status, role, is_active, onboarding_completed, created_at',
      { count: 'exact' }
    )
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  // Add search filter if search term provided
  if (search.trim()) {
    query = query.or(
      `full_name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`
    );
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: leads, count, error } = await query;

  if (error) {
    console.error('Leads fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    success: true,
    leads: leads || [],
    total,
    page,
    limit,
    totalPages,
  });
}