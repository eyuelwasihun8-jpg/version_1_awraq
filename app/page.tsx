import { createClient } from '@/lib/supabase-server';
import { HomePageClient } from '@/components/home/HomePageClient';
import type { Course, DigitalProduct } from '@/lib/types';
import { redirect } from 'next/navigation';

// Force dynamic rendering so user session and newly published courses update instantly
export const dynamic = 'force-dynamic';

async function getHomeData() {
  const supabase = await createClient();

  // 1. If student is logged in, redirect directly to Dashboard ("My Learning")
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (!profile?.onboarding_completed) {
      redirect('/onboarding');
    } else {
      redirect('/dashboard');
    }
  }

  // 2. Guest visitors -> Fetch homepage courses and products
  const { data: coursesRaw, error: courseErr } = await supabase
    .from('courses')
    .select('*, instructor:profiles(full_name, avatar_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(12);

  if (courseErr) {
    console.error('Homepage courses fetch error:', courseErr);
  }

  const { data: productsRaw, error: prodErr } = await supabase
    .from('digital_products')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(8);

  if (prodErr) {
    console.error('Homepage products fetch error:', prodErr);
  }

  return {
    courses: (coursesRaw || []) as Course[],
    products: (productsRaw || []) as DigitalProduct[],
  };
}

export default async function HomePage() {
  const data = await getHomeData();
  return <HomePageClient courses={data.courses} products={data.products} />;
}