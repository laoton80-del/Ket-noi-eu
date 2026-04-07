import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'firebase-functions/v2/https';

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

function sig(secret: string, ts: string, body: string): string {
  return createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
}

export function verifySignedRequest(req: Request, secret: string): { ok: boolean; reason?: string } {
  const ts = String(req.header('x-ketnoi-ts') ?? '');
  const incoming = String(req.header('x-ketnoi-signature') ?? '');
  if (!ts || !incoming) return { ok: false, reason: 'missing_signature_headers' };
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, reason: 'invalid_timestamp' };
  if (Math.abs(Date.now() - tsNum) > REPLAY_WINDOW_MS) return { ok: false, reason: 'replay_window_exceeded' };
  const bodyRaw = typeof req.rawBody === 'string' ? req.rawBody : Buffer.from(req.rawBody ?? '').toString('utf8');
  const expected = sig(secret, ts, bodyRaw);
  const a = Buffer.from(expected);
  const b = Buffer.from(incoming);
  if (a.length !== b.length) return { ok: false, reason: 'signature_mismatch' };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: 'signature_mismatch' };
  return { ok: true };
}
