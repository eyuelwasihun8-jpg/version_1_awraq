import { createClient } from '@/lib/supabase-server';
import { HomePageClient } from '@/components/home/HomePageClient';
import type { Course, DigitalProduct } from '@/lib/types';

// Force dynamic rendering so newly published courses appear immediately
export const dynamic = 'force-dynamic';

async function getHomeData() {
  const supabase = await createClient();

  // Fetch published courses with instructor info
  const { data: coursesRaw, error: courseErr } = await supabase
    .from('courses')
    .select('*, instructor:profiles(full_name, avatar_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(12);

  if (courseErr) {
    console.error('Homepage courses fetch error:', courseErr);
  }

  // Fetch published digital products
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
  const { courses, products } = await getHomeData();

  return <HomePageClient courses={courses} products={products} />;
}