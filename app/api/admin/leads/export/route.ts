import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
  ) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const adminDb = createAdminClient();

  // Fetch ALL student profiles without pagination limit
  const { data: leads, error } = await adminDb
    .from('profiles')
    .select('id, full_name, phone, gender, age_group, life_status, onboarding_completed, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Export fetch error:', error);
    return new NextResponse('Failed to export leads', { status: 500 });
  }

  // Fetch student emails in bulk
  const userEmailMap = new Map<string, string>();
  try {
    const { data: authData } = await adminDb.auth.admin.listUsers({ perPage: 1000 });
    (authData?.users || []).forEach((u) => {
      userEmailMap.set(u.id, u.email || '');
    });
  } catch (e) {
    console.error('Failed to list auth users for export:', e);
  }

  // Generate CSV string
  const headers = ['Full Name', 'Email', 'Phone', 'Gender', 'Age Group', 'Life Status', 'Onboarding Complete', 'Joined Date'];
  const rows = (leads || []).map((l) => [
    `"${(l.full_name || '').replace(/"/g, '""')}"`,
    `"${(userEmailMap.get(l.id) || '').replace(/"/g, '""')}"`,
    `"${(l.phone || '').replace(/"/g, '""')}"`,
    `"${(l.gender || '').replace(/"/g, '""')}"`,
    `"${(l.age_group || '').replace(/"/g, '""')}"`,
    `"${(l.life_status || '').replace(/"/g, '""')}"`,
    l.onboarding_completed ? 'Yes' : 'No',
    `"${new Date(l.created_at).toLocaleDateString()}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="all-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}