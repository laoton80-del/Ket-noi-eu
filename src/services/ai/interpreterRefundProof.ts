import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

const SECRET_ENV = 'VIONA_INTERPRETER_REFUND_PROOF_SECRET';
const MAX_TOKEN_LENGTH = 4096;
const MAX_RECEIPT_AGE_MS = 60 * 60 * 1000;
const MAX_FAILURE_PROOF_AGE_MS = 10 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 30 * 1000;

export type InterpreterHoldReceiptClaims = Readonly<{
  v: 1;
  kind: 'interpreter_hold_receipt';
  subjectId: string;
  holdKey: string;
  nonce: string;
  issuedAtMs: number;
}>;

export type InterpreterProviderFailureClaims = Readonly<{
  v: 1;
  kind: 'interpreter_provider_failure';
  subjectId: string;
  holdKey: string;
  nonce: string;
  source: 'firebase_stt' | 'express_chat';
  status: number;
  issuedAtMs: number;
}>;

type SignedClaims = InterpreterHoldReceiptClaims | InterpreterProviderFailureClaims;

function proofSecret(): string | null {
  const value = process.env[SECRET_ENV]?.trim() ?? '';
  return value.length >= 32 ? value : null;
}

export function isInterpreterRefundProofConfigured(): boolean {
  return proofSecret() !== null;
}

function signClaims(claims: SignedClaims): string | null {
  const secret = proofSecret();
  if (!secret) return null;
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token: string): Record<string, unknown> | null {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null;
  const secret = proofSecret();
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
  const expected = createHmac('sha256', secret).update(parts[0]).digest();
  const actual = Buffer.from(parts[1], 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isFresh(issuedAtMs: unknown, maxAgeMs: number, nowMs: number): issuedAtMs is number {
  return typeof issuedAtMs === 'number' && Number.isSafeInteger(issuedAtMs) &&
    issuedAtMs <= nowMs + MAX_FUTURE_SKEW_MS && nowMs - issuedAtMs <= maxAgeMs;
}

export function createInterpreterRefundNonce(): string {
  return randomUUID();
}

export function createInterpreterHoldReceipt(subjectId: string, holdKey: string, nonce: string): string | null {
  if (!subjectId || subjectId.length > 256 || !holdKey || holdKey.length > 900 || !nonce || nonce.length > 128) {
    return null;
  }
  return signClaims({
    v: 1,
    kind: 'interpreter_hold_receipt',
    subjectId,
    holdKey,
    nonce,
    issuedAtMs: Date.now(),
  });
}

export function verifyInterpreterHoldReceipt(
  token: string,
  expected: Readonly<{ subjectId?: string; holdKey?: string }>,
  nowMs = Date.now()
): InterpreterHoldReceiptClaims | null {
  const claims = verifyToken(token);
  const subjectId = claims?.subjectId;
  const holdKey = claims?.holdKey;
  const nonce = claims?.nonce;
  const issuedAtMs = claims?.issuedAtMs;
  if (
    !claims ||
    claims.v !== 1 ||
    claims.kind !== 'interpreter_hold_receipt' ||
    typeof subjectId !== 'string' || subjectId.length === 0 || subjectId.length > 256 ||
    typeof holdKey !== 'string' || holdKey.length === 0 || holdKey.length > 900 ||
    typeof nonce !== 'string' || nonce.length === 0 || nonce.length > 128 ||
    !isFresh(issuedAtMs, MAX_RECEIPT_AGE_MS, nowMs) ||
    (expected.subjectId !== undefined && subjectId !== expected.subjectId) ||
    (expected.holdKey !== undefined && holdKey !== expected.holdKey)
  ) {
    return null;
  }
  return { v: 1, kind: 'interpreter_hold_receipt', subjectId, holdKey, nonce, issuedAtMs };
}

export function isDefinitiveInterpreterProviderStatus(status: unknown): status is number {
  return typeof status === 'number' && Number.isInteger(status) && status >= 400 && status < 500 && status !== 408 && status !== 409;
}

export function createInterpreterProviderFailureProof(
  receipt: string,
  status: number,
  source: InterpreterProviderFailureClaims['source']
): string | null {
  if (!isDefinitiveInterpreterProviderStatus(status)) return null;
  const hold = verifyInterpreterHoldReceipt(receipt, {});
  if (!hold) return null;
  return signClaims({
    v: 1,
    kind: 'interpreter_provider_failure',
    subjectId: hold.subjectId,
    holdKey: hold.holdKey,
    nonce: hold.nonce,
    source,
    status,
    issuedAtMs: Date.now(),
  });
}

export function verifyInterpreterProviderFailureProof(
  token: string,
  expected: Readonly<{ subjectId: string; holdKey: string; nonce: string }>,
  nowMs = Date.now()
): InterpreterProviderFailureClaims | null {
  const claims = verifyToken(token);
  const subjectId = claims?.subjectId;
  const holdKey = claims?.holdKey;
  const nonce = claims?.nonce;
  const source = claims?.source;
  const status = claims?.status;
  const issuedAtMs = claims?.issuedAtMs;
  if (
    !claims ||
    claims.v !== 1 ||
    claims.kind !== 'interpreter_provider_failure' ||
    subjectId !== expected.subjectId ||
    holdKey !== expected.holdKey ||
    nonce !== expected.nonce ||
    (source !== 'firebase_stt' && source !== 'express_chat') ||
    !isDefinitiveInterpreterProviderStatus(status) ||
    !isFresh(issuedAtMs, MAX_FAILURE_PROOF_AGE_MS, nowMs)
  ) {
    return null;
  }
  return { v: 1, kind: 'interpreter_provider_failure', subjectId, holdKey, nonce, source, status, issuedAtMs };
}
