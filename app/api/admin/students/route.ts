import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

async function requireStaff(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
  ) {
    return { error: 'Forbidden', status: 403 as const };
  }

  return { user, role: profile.role as string };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireStaff(supabase);
  if ('error' in auth && auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user, role } = auth as { user: any; role: string };

  const sp = request.nextUrl.searchParams;
  const search = sp.get('search')?.trim() || null;
  const courseId = sp.get('courseId') || null;
  const hasPurchases = sp.get('hasPurchases') || 'all';
  const sort = sp.get('sort') || 'newest';
  const page = Math.max(parseInt(sp.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(sp.get('limit') || '10', 10), 1), 50);
  const offset = (page - 1) * limit;

  // Instructors only see students in their courses
  const instructorId = role === 'instructor' ? user.id : null;
  // Sales only see their assigned students
  const salesId = role === 'sales' ? user.id : null;

  const adminDb = createAdminClient();

  const { data, error } = await adminDb.rpc('get_students_page', {
    p_search: search,
    p_course_id: courseId,
    p_has_purchases: hasPurchases,
    p_sort: sort,
    p_limit: limit,
    p_offset: offset,
    p_instructor_id: instructorId,
    p_sales_id: salesId,
  });

  if (error) {
    console.error('get_students_page error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const total = rows.length > 0 ? Number(rows[0].total_count || 0) : 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return NextResponse.json({
    students: rows.map((s: any) => ({
      id: s.id,
      fullName: s.full_name,
      phone: s.phone,
      avatarUrl: s.avatar_url,
      email: s.email,
      gender: s.gender,
      ageGroup: s.age_group,
      lifeStatus: s.life_status,
      isActive: s.is_active,
      createdAt: s.created_at,
      coursesCount: Number(s.courses_count || 0),
      productsCount: Number(s.products_count || 0),
      avgProgress: Number(s.avg_progress || 0),
      lastActivity: s.last_activity,
      assignedToId: s.assigned_to,
      assignedToName: s.assigned_to_name,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}