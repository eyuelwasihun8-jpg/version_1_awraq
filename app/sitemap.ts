import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://awraqskills.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${APP_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${APP_URL}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  try {
    const adminDb = createAdminClient();

    const [{ data: courses }, { data: products }] = await Promise.all([
      adminDb
        .from('courses')
        .select('id, updated_at, created_at')
        .eq('is_published', true),
      adminDb
        .from('digital_products')
        .select('id, created_at')
        .eq('is_published', true),
    ]);

    const courseRoutes: MetadataRoute.Sitemap = (courses || []).map((c) => ({
      url: `${APP_URL}/courses/${c.id}`,
      lastModified: new Date(c.updated_at || c.created_at || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const productRoutes: MetadataRoute.Sitemap = (products || []).map((p) => ({
      url: `${APP_URL}/products/${p.id}`,
      lastModified: new Date(p.created_at || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...courseRoutes, ...productRoutes];
  } catch (err) {
    console.error('Sitemap generation error:', err);
    return staticRoutes;
  }
}