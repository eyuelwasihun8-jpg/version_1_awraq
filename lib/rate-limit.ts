/**
 * Rate Limiter with pluggable storage backends.
 * Supports in-memory (dev) and Redis (production) stores.
 */

import { createClient } from 'redis';

// ============================================
// Types
// ============================================

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimiterStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry): Promise<void>;
  delete(key: string): Promise<void>;
  cleanup(): Promise<number>;
  getStats(): Promise<{ size: number; maxSize: number }>;
}

// ============================================
// In-Memory Store (Development / Single Instance)
// ============================================

class MemoryStore implements RateLimiterStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private readonly cleanupIntervalMs = 5 * 60 * 1000;
  private readonly maxStoreSize = 10000;

  private startCleanup() {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
    this.cleanupTimer.unref?.();
  }

  getSync(key: string): RateLimitEntry | null {
    this.startCleanup();
    const entry = this.store.get(key);
    if (!entry || entry.resetTime < Date.now()) {
      if (entry) this.store.delete(key);
      return null;
    }
    return entry;
  }

  setSync(key: string, entry: RateLimitEntry): void {
    this.startCleanup();
    if (this.store.size >= this.maxStoreSize) {
      const entries = Array.from(this.store.entries())
        .sort((a, b) => a[1].resetTime - b[1].resetTime);
      const toDelete = entries.slice(0, this.store.size - this.maxStoreSize + 100);
      toDelete.forEach(([k]) => this.store.delete(k));
    }
    this.store.set(key, entry);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    return this.getSync(key);
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.setSync(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }

  async getStats(): Promise<{ size: number; maxSize: number }> {
    return { size: this.store.size, maxSize: this.maxStoreSize };
  }
}

// ============================================
// Redis Store (Production / Multi-Instance)
// ============================================

class RedisStore implements RateLimiterStore {
  private client: ReturnType<typeof createClient> | null = null;
  private connected = false;
  private readonly keyPrefix = 'ratelimit:';

  constructor(private readonly redisUrl?: string) {}

  private async ensureConnected() {
    if (this.connected && this.client) return;

    const url = this.redisUrl || process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
    if (!url) {
      throw new Error('Redis URL not configured. Set REDIS_URL or UPSTASH_REDIS_URL environment variable.');
    }

    this.client = createClient({ url });
    this.client.on('error', (err) => console.error('[RateLimit Redis] Client error:', err));
    await this.client.connect();
    this.connected = true;
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    await this.ensureConnected();
    const data = await this.client!.get(this.getKey(key));
    if (!data) return null;
    const entry = JSON.parse(data) as RateLimitEntry;
    if (entry.resetTime < Date.now()) {
      await this.delete(key);
      return null;
    }
    return entry;
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    await this.ensureConnected();
    const ttl = Math.ceil((entry.resetTime - Date.now()) / 1000);
    if (ttl > 0) {
      await this.client!.setEx(this.getKey(key), ttl, JSON.stringify(entry));
    }
  }

  async delete(key: string): Promise<void> {
    if (this.client) {
      await this.client.del(this.getKey(key));
    }
  }

  async cleanup(): Promise<number> {
    return 0;
  }

  async getStats(): Promise<{ size: number; maxSize: number }> {
    if (!this.client) return { size: 0, maxSize: 0 };
    try {
      const keys = await this.client.keys(`${this.keyPrefix}*`);
      return { size: keys.length, maxSize: -1 };
    } catch {
      return { size: 0, maxSize: -1 };
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.connected = false;
    }
  }
}

// ============================================
// Store Factory
// ============================================

let storeInstance: RateLimiterStore | null = null;

function getStore(): RateLimiterStore {
  if (storeInstance) return storeInstance;

  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (redisUrl && process.env.NODE_ENV === 'production') {
    storeInstance = new RedisStore(redisUrl);
  } else {
    storeInstance = new MemoryStore();
  }

  return storeInstance;
}

export function setRateLimitStore(store: RateLimiterStore) {
  storeInstance = store;
}

export function getRateLimitStore(): RateLimiterStore {
  return getStore();
}

// ============================================
// Main Rate Limit Function (Async)
// ============================================

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const store = getStore();
  const now = Date.now();
  const resetTime = now + windowMs;

  const entry = await store.get(key);

  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = { count: 1, resetTime };
    await store.set(key, newEntry);
    return { allowed: true, remaining: max - 1, resetTime };
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetTime: entry.resetTime, retryAfter };
  }

  entry.count++;
  await store.set(key, entry);
  return { allowed: true, remaining: max - entry.count, resetTime: entry.resetTime };
}

export async function getRateLimitStatus(
  key: string,
  max: number,
  windowMs: number
): Promise<{ remaining: number; resetTime: number }> {
  const store = getStore();
  const now = Date.now();
  const entry = await store.get(key);

  if (!entry || entry.resetTime < now) {
    return { remaining: max, resetTime: now + windowMs };
  }

  return { remaining: Math.max(0, max - entry.count), resetTime: entry.resetTime };
}

export async function resetRateLimit(key: string): Promise<void> {
  const store = getStore();
  await store.delete(key);
}

export async function getRateLimitStats(): Promise<{ size: number; maxSize: number }> {
  const store = getStore();
  return store.getStats();
}

// ============================================
// Backward Compatibility (Synchronous Memory Store)
// ============================================

const syncStore = new MemoryStore();

export function rateLimitSync(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const resetTime = now + windowMs;
  const entry = syncStore.getSync(key);

  if (!entry || entry.resetTime < now) {
    syncStore.setSync(key, { count: 1, resetTime });
    return { allowed: true, remaining: max - 1, resetTime };
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetTime: entry.resetTime, retryAfter };
  }

  entry.count++;
  syncStore.setSync(key, { count: entry.count, resetTime: entry.resetTime });
  return { allowed: true, remaining: max - entry.count, resetTime: entry.resetTime };
}