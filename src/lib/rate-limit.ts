const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const current = hits.get(key);

  if (!current || now > current.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (current.count >= limit) {
    return { ok: false, retryAt: current.resetAt };
  }

  current.count += 1;
  hits.set(key, current);
  return { ok: true };
}
