import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { fullName, phone, gender, ageGroup, lifeStatus } = body;

  // Validate required fields
  if (!fullName?.trim() || !phone?.trim() || !gender || !ageGroup || !lifeStatus) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  const validGenders = ['male', 'female', 'other'];
  const validAgeGroups = ['13-17', '18-24', '25-34', '35-44', '45+'];
  const validLifeStatus = ['student', 'worker', 'business_owner', 'freelancer', 'other'];

  if (!validGenders.includes(gender)) {
    return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
  }
  if (!validAgeGroups.includes(ageGroup)) {
    return NextResponse.json({ error: 'Invalid age group' }, { status: 400 });
  }
  if (!validLifeStatus.includes(lifeStatus)) {
    return NextResponse.json({ error: 'Invalid life status' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName.trim(),
      phone: phone.trim(),
      gender,
      age_group: ageGroup,
      life_status: lifeStatus,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, profile: data });
}

// GET current onboarding status (used to decide whether to show the modal)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name, phone, gender, age_group, life_status')
    .eq('id', user.id)
    .single();

  return NextResponse.json({ profile: data });
}