import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: leads } = await supabase
    .from('profiles')
    .select('full_name, phone, gender, age_group, life_status, created_at')
    .eq('onboarding_completed', true)
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  const headers = ['Full Name', 'Phone', 'Gender', 'Age Group', 'Life Status', 'Signup Date'];
  const rows = (leads ?? []).map((l) => [
    escapeCsv(l.full_name),
    escapeCsv(l.phone),
    escapeCsv(l.gender),
    escapeCsv(l.age_group),
    escapeCsv(l.life_status),
    escapeCsv(new Date(l.created_at).toLocaleDateString()),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const filename = `leads-${new Date().toISOString().split('T')[0]}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}