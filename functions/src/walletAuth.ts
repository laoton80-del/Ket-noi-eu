import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import type { Request } from 'firebase-functions/v2/https';

export async function requireFirebaseBearerUser(
  req: Request
): Promise<{ ok: true; uid: string } | { ok: false; status: number; error: string }> {
  const raw = String(req.header('authorization') ?? req.header('Authorization') ?? '');
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) return { ok: false, status: 401, error: 'missing_bearer_token' };
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, status: 401, error: 'invalid_id_token' };
  }
}

export async function requireFirebaseBearerUserDecoded(
  req: Request
): Promise<{ ok: true; uid: string; decoded: DecodedIdToken } | { ok: false; status: number; error: string }> {
  const raw = String(req.header('authorization') ?? req.header('Authorization') ?? '');
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) return { ok: false, status: 401, error: 'missing_bearer_token' };
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return { ok: true, uid: decoded.uid, decoded };
  } catch {
    return { ok: false, status: 401, error: 'invalid_id_token' };
  }
}
