/**
 * In-memory & LocalStorage cache for presigned R2 thumbnail URLs.
 * Prevents re-fetching thumbnail presigned URLs on every page navigation.
 */

const cache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_DURATION_MS = 8 * 60 * 1000; // 8 minutes (R2 URLs expire in 10 minutes)

export function getCachedThumbnail(key: string): string | null {
  if (!key) return null;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.url;
}

export function cacheThumbnail(key: string, url: string): void {
  if (!key || !url) return;
  cache.set(key, {
    url,
    expiresAt: Date.now() + CACHE_DURATION_MS,
  });
}

/** Preload an array of thumbnail keys in background */
export async function preloadThumbnails(keys: (string | null | undefined)[]): Promise<void> {
  const validKeys = keys.filter(
    (k): k is string => typeof k === 'string' && k.trim().length > 0 && !getCachedThumbnail(k)
  );

  if (validKeys.length === 0) return;

  await Promise.all(
    validKeys.map(async (key) => {
      try {
        const res = await fetch(`/api/thumbnail?key=${encodeURIComponent(key)}`);
        const data = await res.json();
        if (data.url) {
          cacheThumbnail(key, data.url);
        }
      } catch {}
    })
  );
}

/** Get cached or fetch new thumbnail URL */
export async function getThumbnailUrl(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  const cached = getCachedThumbnail(key);
  if (cached) return cached;

  try {
    const res = await fetch(`/api/thumbnail?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data.url) {
      cacheThumbnail(key, data.url);
      return data.url;
    }
  } catch {}

  return null;
}