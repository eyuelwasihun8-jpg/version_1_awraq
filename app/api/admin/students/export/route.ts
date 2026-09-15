import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const search = sp.get('search')?.trim() || null;
  const courseId = sp.get('courseId') || null;
  const hasPurchases = sp.get('hasPurchases') || 'all';
  const sort = sp.get('sort') || 'newest';
  const instructorId = profile.role === 'instructor' ? user.id : null;

  const adminDb = createAdminClient();

  // Export up to 5000 rows
  const { data, error } = await adminDb.rpc('get_students_page', {
    p_search: search,
    p_course_id: courseId,
    p_has_purchases: hasPurchases,
    p_sort: sort,
    p_limit: 5000,
    p_offset: 0,
    p_instructor_id: instructorId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];

  // Build CSV
  const headers = [
    'Full Name',
    'Email',
    'Phone',
    'Gender',
    'Age Group',
    'Life Status',
    'Courses Count',
    'Products Count',
    'Avg Progress %',
    'Active',
    'Joined Date',
    'Last Activity',
  ];

  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(','),
    ...rows.map((s: any) =>
      [
        s.full_name,
        s.email,
        s.phone,
        s.gender,
        s.age_group,
        s.life_status,
        s.courses_count,
        s.products_count,
        s.avg_progress,
        s.is_active ? 'Yes' : 'No',
        s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : '',
        s.last_activity ? new Date(s.last_activity).toISOString().slice(0, 10) : '',
      ]
        .map(escape)
        .join(',')
    ),
  ];

  const csv = lines.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="awraq-students-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}