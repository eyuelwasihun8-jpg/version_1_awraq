'use client';

// In-memory cache: key -> { url, expires }
type CacheEntry = { url: string; expires: number };
const cache = new Map<string, CacheEntry>();

// Pending requests to prevent duplicate fetches for the same key
const pending = new Map<string, Promise<string | null>>();

// Batch queue: keys waiting to be sent together
let batchQueue = new Set<string>();
let batchTimer: NodeJS.Timeout | null = null;
const batchResolvers = new Map<string, (url: string | null) => void>();

const CACHE_TTL = 55 * 60 * 1000; // 55 minutes

function loadFromSession(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`thumb:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expires > Date.now()) return parsed.url;
    sessionStorage.removeItem(`thumb:${key}`);
    return null;
  } catch {
    return null;
  }
}

function saveToSession(key: string, url: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      `thumb:${key}`,
      JSON.stringify({ url, expires: Date.now() + CACHE_TTL })
    );
  } catch {}
}

async function flushBatch() {
  const keys = Array.from(batchQueue);
  batchQueue = new Set();
  batchTimer = null;

  if (keys.length === 0) return;

  try {
    const res = await fetch('/api/thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    });
    const data = await res.json();
    const urls: Record<string, string | null> = data.urls || {};

    keys.forEach((key) => {
      const url = urls[key] || null;
      const resolver = batchResolvers.get(key);

      if (url) {
        cache.set(key, { url, expires: Date.now() + CACHE_TTL });
        saveToSession(key, url);
      }

      if (resolver) resolver(url);
      batchResolvers.delete(key);
      pending.delete(key);
    });
  } catch {
    keys.forEach((key) => {
      const resolver = batchResolvers.get(key);
      if (resolver) resolver(null);
      batchResolvers.delete(key);
      pending.delete(key);
    });
  }
}

/**
 * Get a thumbnail URL — INSTANT if public bucket enabled, otherwise cached/batched
 */
export function getThumbnailUrl(key: string): Promise<string | null> {
  if (!key) return Promise.resolve(null);

  // 1. Full URL passthrough (e.g. Google OAuth avatars, blob URLs)
  if (
    key.startsWith('http://') ||
    key.startsWith('https://') ||
    key.startsWith('blob:') ||
    key.startsWith('data:')
  ) {
    return Promise.resolve(key);
  }

  // 2. 🔥 ULTRA-FAST PATH: If NEXT_PUBLIC_R2_PUBLIC_URL is set, load directly from CDN!
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (publicBase) {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    const directUrl = `${publicBase}/${cleanKey}`;
    return Promise.resolve(directUrl);
  }

  // 3. Memory cache hit — INSTANT
  const memHit = cache.get(key);
  if (memHit && memHit.expires > Date.now()) {
    return Promise.resolve(memHit.url);
  }

  // 4. Session cache hit — INSTANT
  const sessionUrl = loadFromSession(key);
  if (sessionUrl) {
    cache.set(key, { url: sessionUrl, expires: Date.now() + CACHE_TTL });
    return Promise.resolve(sessionUrl);
  }

  // 5. Already fetching same key — reuse promise
  const pendingPromise = pending.get(key);
  if (pendingPromise) return pendingPromise;

  // 6. Add to batch queue (fallback if public URL is not configured)
  const promise = new Promise<string | null>((resolve) => {
    batchResolvers.set(key, resolve);
    batchQueue.add(key);

    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(flushBatch, 30);
  });

  pending.set(key, promise);
  return promise;
}

export function preloadThumbnails(keys: (string | null | undefined)[]) {
  keys.forEach((k) => {
    if (k && typeof k === 'string') getThumbnailUrl(k);
  });
}