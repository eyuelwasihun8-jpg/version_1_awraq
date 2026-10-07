import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://awraqskills.com';
const R2_PUBLIC = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

function buildImageUrl(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  if (!R2_PUBLIC) return null;
  return `${R2_PUBLIC.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
}

function truncate(text: string | null | undefined, max = 160): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + '…';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const adminDb = createAdminClient();

  const { data: product } = await adminDb
    .from('digital_products')
    .select('id, title, description, thumbnail_url, is_published, file_type')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'This product is not available.',
      robots: { index: false, follow: false },
    };
  }

  const title = product.title;
  const description =
    truncate(product.description, 160) ||
    `${product.title} — a digital product from Awraq Skills.`;
  const image =
    buildImageUrl(product.thumbnail_url) || `${APP_URL}/hero-poster.jpg`;
  const url = `${APP_URL}/products/${product.id}`;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      type: 'website',
      url,
      title: `${title} | Awraq Skills`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Awraq Skills`,
      description,
      images: [image],
    },
  };
}

function ProductJsonLd({
  product,
  url,
  image,
}: {
  product: any;
  url: string;
  image: string | null;
}) {
  const base: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description:
      (product.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ||
      product.title,
    url,
    brand: {
      '@type': 'Brand',
      name: 'Awraq Skills',
    },
    category: 'Digital Product',
  };

  if (image) base.image = image;

  if (product.price != null) {
    base.offers = {
      '@type': 'Offer',
      price: Number(product.price || 0),
      priceCurrency: 'ETB',
      availability: 'https://schema.org/InStock',
      url,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(base) }}
    />
  );
}

function BreadcrumbJsonLd({
  productTitle,
  productId,
}: {
  productTitle: string;
  productId: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: APP_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Courses & Products',
        item: `${APP_URL}/courses`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: productTitle,
        item: `${APP_URL}/products/${productId}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminDb = createAdminClient();

  const { data: product } = await adminDb
    .from('digital_products')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (!product) notFound();

  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  let alreadyOwned = false;
  let pendingPaymentId: string | null = null;

  if (user) {
    const { data: purchase } = await adminDb
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', id)
      .eq('is_active', true)
      .maybeSingle();

    alreadyOwned = !!purchase;

    if (!alreadyOwned) {
      const { data: pending } = await adminDb
        .from('payment_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', 'digital_product')
        .eq('item_id', id)
        .eq('status', 'pending')
        .maybeSingle();

      pendingPaymentId = pending?.id || null;
    }
  }

  const image = buildImageUrl(product.thumbnail_url);
  const url = `${APP_URL}/products/${product.id}`;

  return (
    <>
      <BreadcrumbJsonLd productTitle={product.title} productId={product.id} />
      <ProductJsonLd product={product} url={url} image={image} />
      <ProductDetailClient
        product={product}
        isLoggedIn={!!user}
        alreadyOwned={alreadyOwned}
        pendingPaymentId={pendingPaymentId}
      />
    </>
  );
}