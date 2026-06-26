type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;
  return 'unknown';
}

/** In-memory fixed-window limiter (per serverless instance). */
export function rateLimitByKey(
  bucketKey: string,
  opts: { limit: number; windowMs: number },
): boolean {
  const now = Date.now();

  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }

  const cur = buckets.get(bucketKey);
  if (!cur || cur.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + opts.windowMs });
    return false;
  }

  cur.count += 1;
  return cur.count > opts.limit;
}

export function rateLimitRequest(
  request: Request,
  opts: { key: string; limit: number; windowMs: number },
): boolean {
  const ip = clientIp(request);
  return rateLimitByKey(`${opts.key}:${ip}`, opts);
}
