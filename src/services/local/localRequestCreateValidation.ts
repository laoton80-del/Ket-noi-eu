import {
  BizType,
  LocalRequestSource,
  LocalServiceType,
} from '@prisma/client';

/** Client-supplied keys that must never influence request-only create. */
export const DANGEROUS_LOCAL_REQUEST_CREATE_BODY_KEYS = [
  'status',
  'walletMode',
  'walletPhase',
  'quotedAmountCredits',
  'holdAmountCredits',
  'settledAmountCredits',
  'platformFeeCredits',
  'totalVioCredits',
  'heldVioCredits',
  'releasedVioCredits',
  'platformFeeVioCredits',
  'providerEarningsVioCredits',
  'merchantConfirmedAt',
  'confirmedAt',
  'rejectedAt',
  'completedAt',
  'cancelledAt',
  'providerSettledAt',
  'expiredAt',
  'merchantReviewDeadlineAt',
  'requesterUserId',
  'assignedProviderUserId',
  'legacyBookingId',
  'cancelReason',
  'rejectReason',
  'cancelledByRole',
] as const;

export type DangerousLocalRequestCreateBodyKey =
  (typeof DANGEROUS_LOCAL_REQUEST_CREATE_BODY_KEYS)[number];

export function findDangerousLocalRequestCreateBodyKeys(
  body: unknown
): DangerousLocalRequestCreateBodyKey[] {
  if (typeof body !== 'object' || body === null) return [];
  const keys = Object.keys(body);
  const dangerous = new Set<string>(DANGEROUS_LOCAL_REQUEST_CREATE_BODY_KEYS);
  return keys.filter((k): k is DangerousLocalRequestCreateBodyKey => dangerous.has(k));
}

export function parseLocalServiceType(raw: unknown): LocalServiceType | null {
  if (typeof raw !== 'string' || raw.trim().length === 0) return null;
  const value = raw.trim().toUpperCase();
  if (value in LocalServiceType) {
    return LocalServiceType[value as keyof typeof LocalServiceType];
  }
  return null;
}

export function parseLocalRequestSource(raw: unknown): LocalRequestSource | null {
  if (raw == null) return LocalRequestSource.API_DIRECT;
  if (typeof raw !== 'string' || raw.trim().length === 0) return null;
  const value = raw.trim().toUpperCase();
  if (value in LocalRequestSource) {
    return LocalRequestSource[value as keyof typeof LocalRequestSource];
  }
  return null;
}

export function parseBizType(raw: unknown): BizType | null | undefined {
  if (raw == null || raw === '') return undefined;
  if (typeof raw !== 'string' || raw.trim().length === 0) return null;
  const value = raw.trim().toUpperCase();
  if (value in BizType) {
    return BizType[value as keyof typeof BizType];
  }
  return null;
}

export function parseMetadataJson(raw: unknown): Record<string, unknown> | null | undefined {
  if (raw == null) return undefined;
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

export function parseIsoDate(raw: unknown): Date | null | undefined {
  if (raw == null || raw === '') return undefined;
  if (typeof raw !== 'string' || raw.trim().length === 0) return null;
  const d = new Date(raw.trim());
  if (Number.isNaN(d.getTime())) return null;
  return d;
}
