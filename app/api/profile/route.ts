import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET current user's profile
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    profile: data,
    email: user.email,
  });
}

// UPDATE profile (name, phone, gender, age, life status, avatar)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { fullName, phone, gender, ageGroup, lifeStatus, avatarUrl } = body;

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (fullName !== undefined) updates.full_name = fullName?.trim() || null;
  if (phone !== undefined) updates.phone = phone?.trim() || null;
  if (gender !== undefined) updates.gender = gender || null;
  if (ageGroup !== undefined) updates.age_group = ageGroup || null;
  if (lifeStatus !== undefined) updates.life_status = lifeStatus || null;
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl || null;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, profile: data });
}