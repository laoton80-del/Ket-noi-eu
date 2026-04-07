/**
 * Best-effort per-uid rate limit for aiProxy (single Cloud Function instance).
 * Under scale-out, limits are per instance; pair with Cloud Armor / API Gateway for global caps.
 */
const buckets = new Map<string, { windowStart: number; count: number }>();
const PRUNE_EVERY = 500;
let pruneCounter = 0;

export function takeAiProxyRateSlot(uid: string, maxPerWindow: number, windowMs: number): boolean {
  if (maxPerWindow <= 0) return true;
  const now = Date.now();
  const cur = buckets.get(uid);
  if (!cur || now - cur.windowStart >= windowMs) {
    buckets.set(uid, { windowStart: now, count: 1 });
    pruneCounter += 1;
    if (pruneCounter >= PRUNE_EVERY) {
      pruneCounter = 0;
      for (const [k, v] of buckets) {
        if (now - v.windowStart > windowMs * 3) buckets.delete(k);
      }
    }
    return true;
  }
  if (cur.count >= maxPerWindow) return false;
  cur.count += 1;
  return true;
}
