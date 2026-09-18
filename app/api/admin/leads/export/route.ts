import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

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

  const { data: leads } = await supabase
    .from('profiles')
    .select('full_name, phone, gender, age_group, life_status, onboarding_completed, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  // Generate CSV string
  const headers = ['Full Name', 'Phone', 'Gender', 'Age Group', 'Life Status', 'Onboarding Complete', 'Joined Date'];
  const rows = (leads || []).map((l) => [
    `"${l.full_name || ''}"`,
    `"${l.phone || ''}"`,
    `"${l.gender || ''}"`,
    `"${l.age_group || ''}"`,
    `"${l.life_status || ''}"`,
    l.onboarding_completed ? 'Yes' : 'No',
    `"${new Date(l.created_at).toLocaleDateString()}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}