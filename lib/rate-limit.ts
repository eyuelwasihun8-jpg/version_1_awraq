/**
 * Sliding window rate limiter with in-memory store.
 * Periodic cleanup prevents memory leaks.
 * For production with multiple instances, replace with Redis.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup interval: every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_STORE_SIZE = 10000; // Safety cap

let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime < now) {
        store.delete(key);
        cleaned++;
      }
    }
    // If still too large, evict oldest entries
    if (store.size > MAX_STORE_SIZE) {
      const entries = Array.from(store.entries()).sort((a, b) => a[1].resetTime - b[1].resetTime);
      const toDelete = entries.slice(0, store.size - MAX_STORE_SIZE);
      toDelete.forEach(([key]) => store.delete(key));
    }
  }, CLEANUP_INTERVAL_MS);
  // Don't prevent process exit
  cleanupTimer.unref?.();
}

function stopCleanup() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Check and increment rate limit for a key.
 * @param key Unique identifier (e.g., IP address, user ID)
 * @param max Maximum requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns { allowed: boolean, remaining: number, resetTime: number, retryAfter?: number }
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  startCleanup();

  const now = Date.now();
  const windowStart = now - windowMs;
  const resetTime = now + windowMs;

  const entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    // First request or window expired
    store.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: max - 1, resetTime };
  }

  if (entry.count >= max) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetTime: entry.resetTime, retryAfter };
  }

  // Increment and allow
  entry.count++;
  store.set(key, entry);
  return { allowed: true, remaining: max - entry.count, resetTime: entry.resetTime };
}

/**
 * Get current rate limit status without incrementing.
 */
export function getRateLimitStatus(
  key: string,
  max: number,
  windowMs: number
): { remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    return { remaining: max, resetTime: now + windowMs };
  }

  return { remaining: Math.max(0, max - entry.count), resetTime: entry.resetTime };
}

/**
 * Reset rate limit for a key (e.g., on successful auth).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Get store stats for monitoring.
 */
export function getRateLimitStats(): { size: number; maxSize: number } {
  return { size: store.size, maxSize: MAX_STORE_SIZE };
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('exit', stopCleanup);
  process.on('SIGINT', stopCleanup);
  process.on('SIGTERM', stopCleanup);
}