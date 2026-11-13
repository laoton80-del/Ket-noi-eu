/**
 * Best-effort per-function, per-uid rate limit (single Cloud Function instance).
 * Under scale-out, limits are per instance; pair with Cloud Armor / API Gateway for global caps.
 */
const buckets = new Map<string, { windowStart: number; count: number; windowMs: number }>();
const PRUNE_EVERY = 500;
let pruneCounter = 0;

export function takeAiProxyRateSlot(
  uid: string,
  maxPerWindow: number,
  windowMs: number,
  scope: 'aiProxy' | 'analyzeDocumentProxy' = 'aiProxy'
): boolean {
  if (maxPerWindow <= 0) return true;
  const now = Date.now();
  const key = JSON.stringify([scope, uid]);
  const cur = buckets.get(key);
  if (!cur || now - cur.windowStart >= windowMs) {
    buckets.set(key, { windowStart: now, count: 1, windowMs });
    pruneCounter += 1;
    if (pruneCounter >= PRUNE_EVERY) {
      pruneCounter = 0;
      for (const [k, v] of buckets) {
        if (now - v.windowStart > v.windowMs * 3) buckets.delete(k);
      }
    }
    return true;
  }
  if (cur.count >= maxPerWindow) return false;
  cur.count += 1;
  return true;
}
