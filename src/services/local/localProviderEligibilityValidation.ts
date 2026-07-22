/**
 * Pack A2 — Local provider eligibility request validation (query/body).
 */
import { LocalServiceType } from '@prisma/client';

import { parseLocalServiceType } from './localRequestCreateValidation';

export const LOCAL_PROVIDER_LIST_DEFAULT_LIMIT = 50;
export const LOCAL_PROVIDER_LIST_MAX_LIMIT = 100;
export const LOCAL_PROVIDER_AUDIT_REASON_MAX_LEN = 280;

const REGISTER_ALLOWED = new Set(['businessId', 'supportedServiceTypes', 'publicB2cVisible']);
const PATCH_ALLOWED = new Set(['supportedServiceTypes', 'publicB2cVisible']);
const REASON_BODY_ALLOWED = new Set(['reason']);

export type LocalProviderValidationFailure = 'invalid_input';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function findUnknownKeys(body: unknown, allowed: ReadonlySet<string>): string[] {
  if (!isPlainObject(body)) return [];
  return Object.keys(body).filter((k) => !allowed.has(k));
}

export function parseLocalServiceTypeList(raw: unknown): LocalServiceType[] | null {
  if (!Array.isArray(raw)) return null;
  const out: LocalServiceType[] = [];
  for (const item of raw) {
    const parsed = parseLocalServiceType(item);
    if (parsed == null) return null;
    out.push(parsed);
  }
  return out;
}

export function sameServiceTypeLists(
  a: readonly LocalServiceType[],
  b: readonly LocalServiceType[]
): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export type LocalProviderListQuery =
  | Readonly<{ ok: true; limit: number; skip: number; serviceType?: LocalServiceType }>
  | Readonly<{ ok: false; reason: LocalProviderValidationFailure }>;

export function validateLocalProviderListQuery(query: unknown): LocalProviderListQuery {
  const q = isPlainObject(query) ? query : {};

  let limit = LOCAL_PROVIDER_LIST_DEFAULT_LIMIT;
  if (q.limit != null) {
    const n = typeof q.limit === 'string' ? Number(q.limit) : typeof q.limit === 'number' ? q.limit : NaN;
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > LOCAL_PROVIDER_LIST_MAX_LIMIT) {
      return { ok: false, reason: 'invalid_input' };
    }
    limit = n;
  }

  let skip = 0;
  if (q.skip != null) {
    const n = typeof q.skip === 'string' ? Number(q.skip) : typeof q.skip === 'number' ? q.skip : NaN;
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      return { ok: false, reason: 'invalid_input' };
    }
    skip = n;
  }

  let serviceType: LocalServiceType | undefined;
  if (q.serviceType != null && q.serviceType !== '') {
    const parsed = parseLocalServiceType(q.serviceType);
    if (parsed == null) return { ok: false, reason: 'invalid_input' };
    serviceType = parsed;
  }

  return { ok: true, limit, skip, ...(serviceType ? { serviceType } : {}) };
}

export type RegisterLocalProviderBody =
  | Readonly<{
      ok: true;
      businessId: string;
      supportedServiceTypes: LocalServiceType[];
      publicB2cVisible: boolean;
    }>
  | Readonly<{ ok: false; reason: LocalProviderValidationFailure }>;

export function validateRegisterLocalProviderBody(body: unknown): RegisterLocalProviderBody {
  if (!isPlainObject(body)) return { ok: false, reason: 'invalid_input' };
  if (findUnknownKeys(body, REGISTER_ALLOWED).length > 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const businessId = typeof body.businessId === 'string' ? body.businessId.trim() : '';
  if (!businessId) return { ok: false, reason: 'invalid_input' };

  let supportedServiceTypes: LocalServiceType[] = [];
  if (body.supportedServiceTypes !== undefined) {
    const parsed = parseLocalServiceTypeList(body.supportedServiceTypes);
    if (parsed == null) return { ok: false, reason: 'invalid_input' };
    supportedServiceTypes = parsed;
  }

  let publicB2cVisible = false;
  if (body.publicB2cVisible !== undefined) {
    if (typeof body.publicB2cVisible !== 'boolean') return { ok: false, reason: 'invalid_input' };
    publicB2cVisible = body.publicB2cVisible;
  }

  return { ok: true, businessId, supportedServiceTypes, publicB2cVisible };
}

export type PatchLocalProviderBody =
  | Readonly<{
      ok: true;
      supportedServiceTypes?: LocalServiceType[];
      publicB2cVisible?: boolean;
    }>
  | Readonly<{ ok: false; reason: LocalProviderValidationFailure }>;

export function validatePatchLocalProviderBody(body: unknown): PatchLocalProviderBody {
  if (!isPlainObject(body)) return { ok: false, reason: 'invalid_input' };
  if (findUnknownKeys(body, PATCH_ALLOWED).length > 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const hasTypes = body.supportedServiceTypes !== undefined;
  const hasVisible = body.publicB2cVisible !== undefined;
  if (!hasTypes && !hasVisible) return { ok: false, reason: 'invalid_input' };

  let supportedServiceTypes: LocalServiceType[] | undefined;
  if (hasTypes) {
    const parsed = parseLocalServiceTypeList(body.supportedServiceTypes);
    if (parsed == null) return { ok: false, reason: 'invalid_input' };
    supportedServiceTypes = parsed;
  }

  let publicB2cVisible: boolean | undefined;
  if (hasVisible) {
    if (typeof body.publicB2cVisible !== 'boolean') return { ok: false, reason: 'invalid_input' };
    publicB2cVisible = body.publicB2cVisible;
  }

  return {
    ok: true,
    ...(supportedServiceTypes !== undefined ? { supportedServiceTypes } : {}),
    ...(publicB2cVisible !== undefined ? { publicB2cVisible } : {}),
  };
}

export type TransitionReasonBody =
  | Readonly<{ ok: true; reason: string | null }>
  | Readonly<{ ok: false; reason: LocalProviderValidationFailure }>;

export function validateTransitionReasonBody(body: unknown): TransitionReasonBody {
  if (body == null || body === '') return { ok: true, reason: null };
  if (!isPlainObject(body)) return { ok: false, reason: 'invalid_input' };
  if (Object.keys(body).length === 0) return { ok: true, reason: null };
  if (findUnknownKeys(body, REASON_BODY_ALLOWED).length > 0) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (body.reason === undefined || body.reason === null) {
    return { ok: true, reason: null };
  }
  if (typeof body.reason !== 'string') return { ok: false, reason: 'invalid_input' };
  const trimmed = body.reason.trim();
  if (trimmed.length === 0) return { ok: true, reason: null };
  if (trimmed.length > LOCAL_PROVIDER_AUDIT_REASON_MAX_LEN) {
    return { ok: false, reason: 'invalid_input' };
  }
  const lower = trimmed.toLowerCase();
  for (const bad of ['password', 'secret', 'token', 'stripe', 'private_key'] as const) {
    if (lower.includes(bad)) return { ok: false, reason: 'invalid_input' };
  }
  return { ok: true, reason: trimmed };
}
