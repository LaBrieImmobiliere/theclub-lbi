const rateMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter.
 * @param key - unique identifier (e.g. IP + route)
 * @param limit - max requests per window
 * @param windowMs - time window in milliseconds
 * @returns { success: boolean; remaining: number }
 */
export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - entry.count };
}

/**
 * Alternative rate limiter with allowed/remaining semantics.
 * Useful for stricter auth endpoints (login, inscription).
 * @param key - unique identifier (e.g. "inscription:" + IP)
 * @param maxAttempts - max requests per window (default 5)
 * @param windowMs - time window in milliseconds (default 15 min)
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

// Periodic cleanup to prevent memory leaks (every 30 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateMap.entries()) {
      if (now > entry.resetAt) {
        rateMap.delete(key);
      }
    }
  }, 30 * 60 * 1000);
}
