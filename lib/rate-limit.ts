type RateLimitEntry = { count: number; resetAt: number };

export function checkRateLimit(
  store: Record<string, RateLimitEntry>,
  key: string,
  max: number
): boolean {
  const now = Date.now();
  const entry = store[key];

  if (entry && entry.resetAt > now) {
    if (entry.count >= max) return false;
    entry.count++;
    return true;
  }

  store[key] = { count: 1, resetAt: now + 3600000 };
  return true;
}
