/**
 * Shared CORS + reverse-proxy settings for Express and Socket.IO.
 *
 * - `API_CORS_ORIGINS`: comma-separated browser origins (e.g. `https://app.example.com,http://localhost:8081`).
 *   When unset: **development** allows all origins; **production** denies cross-origin until configured.
 * - `TRUST_PROXY_HOPS`: set to `1` when behind one trusted reverse proxy (AWS ALB, nginx) so rate limits use the real client IP.
 */

import type { CorsOptions } from 'cors';

export function getTrustProxyHops(): number {
  const raw = process.env.TRUST_PROXY_HOPS?.trim() ?? '0';
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 5) return 0;
  return Math.trunc(n);
}

export function getApiCorsOriginList(): readonly string[] {
  const raw = process.env.API_CORS_ORIGINS?.trim() ?? '';
  if (!raw) return [];
  return raw
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
}

export function buildExpressCorsOptions(): CorsOptions {
  const origins = getApiCorsOriginList();
  if (origins.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      return { origin: false, credentials: true };
    }
    return { origin: true, credentials: true };
  }
  const allowList = [...origins];
  return {
    credentials: true,
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      cb(null, allowList.includes(origin));
    },
  };
}

/** Socket.IO `cors.origin` — align with REST CORS allowlist when set. */
export function buildSocketIoCorsOrigin(): boolean | string[] {
  const origins = getApiCorsOriginList();
  if (origins.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }
  return [...origins];
}
