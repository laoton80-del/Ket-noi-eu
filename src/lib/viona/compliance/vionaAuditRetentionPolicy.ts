/**
 * Pack33 — Global Data Retention Policy for `VionaRequestAuditEvent` (see
 * docs/product/VIONA_PACK33_GLOBAL_COMPLIANCE_PLAN.md §4).
 *
 * Pure, synchronous decision + transform functions — no DB access, no I/O. The batch job that
 * actually reads/writes rows (`scripts/viona-pack33-audit-retention-job.ts`) is a thin, separate
 * wrapper around these functions so the policy itself stays fully unit-testable without a live
 * database.
 *
 * Design intent (plan §4.4): anonymize-in-place is the default, never hard-delete, because the
 * audit ledger is relied on by Pack31 (financial reconciliation) and Pack32 (safety review) —
 * anonymization preserves row count / `eventType` / `createdAt` / `requestId` linkage while
 * removing PII content.
 *
 * `retentionWindow()`'s exact day counts are explicitly **illustrative, not legally reviewed**
 * (plan §5, §9) — a prerequisite legal/compliance review must confirm these values before any
 * production rollout of the batch job.
 */

import { scrubVionaPiiDeep, type VionaPiiScrubRegion } from './vionaPiiScrubber';

/**
 * Illustrative retention windows, in days, per resolved region. NOT a legally-reviewed final
 * value — see module header. A future legal review updates only this table; no other code in this
 * module or its callers needs to change when that happens.
 */
const VIONA_AUDIT_RETENTION_WINDOW_DAYS: Readonly<Record<VionaPiiScrubRegion, number>> = {
  eu_gdpr: 180,
  br_lgpd: 180,
  us_ccpa: 365,
  jp_appi: 365,
  default: 365,
};

/** Pure lookup — never throws, always returns a positive integer number of days. */
export function retentionWindowDays(region: VionaPiiScrubRegion): number {
  return VIONA_AUDIT_RETENTION_WINDOW_DAYS[region];
}

export type VionaAuditRetentionRowInput = Readonly<{
  retentionRegion: string | null;
  createdAt: Date;
  anonymizedAt: Date | null;
}>;

/**
 * Pure predicate: should this row be anonymized *now* (relative to `now`)? Already-anonymized
 * rows are never re-selected (idempotent by construction) — `anonymizedAt` is set once and never
 * cleared (plan §4.2).
 */
export function shouldAnonymizeVionaAuditEventRow(
  input: VionaAuditRetentionRowInput,
  now: Date = new Date(),
): boolean {
  if (input.anonymizedAt != null) return false;
  const region = (input.retentionRegion as VionaPiiScrubRegion | null) ?? 'default';
  const windowDays = retentionWindowDays(
    isKnownVionaPiiScrubRegion(region) ? region : 'default',
  );
  const cutoffMs = input.createdAt.getTime() + windowDays * 24 * 60 * 60 * 1000;
  return now.getTime() >= cutoffMs;
}

function isKnownVionaPiiScrubRegion(value: string): value is VionaPiiScrubRegion {
  return value in VIONA_AUDIT_RETENTION_WINDOW_DAYS;
}

export type VionaAuditRetentionAnonymizeInput = Readonly<{
  message: string | null;
  payloadJson: unknown;
  retentionRegion: string | null;
}>;

export type VionaAuditRetentionAnonymizeResult = Readonly<{
  message: string | null;
  payloadJson: unknown;
  anonymizedAt: Date;
}>;

/**
 * Produces the anonymized `message`/`payloadJson` for a row past its retention window, reusing the
 * exact same scrubber rules used at write time (§3) — shape-preserving (keys/array order/non-string
 * primitives untouched), content-removing. Pure; the caller is responsible for persisting the
 * result and for never calling this twice on the same row (guarded by `shouldAnonymizeVionaAuditEventRow`
 * already excluding rows with `anonymizedAt != null`).
 */
export function anonymizeVionaAuditEventRow(
  input: VionaAuditRetentionAnonymizeInput,
  now: Date = new Date(),
): VionaAuditRetentionAnonymizeResult {
  // `retentionRegion` was frozen at write time (plan §4.2) — the parent VionaRequest's
  // `countryCode` may have changed since, so anonymization deliberately does not re-resolve a
  // region from it. Scrubbing with no `countryCode` resolves to `'default'`, the strictest rule
  // set (see `resolveVionaPiiScrubRegion`) — anonymization must never be weaker than the original
  // write-time scrub, only ever equal or stricter.
  return {
    message: input.message == null ? null : (scrubVionaPiiDeep(input.message) as string),
    payloadJson: input.payloadJson == null ? null : scrubVionaPiiDeep(input.payloadJson),
    anonymizedAt: now,
  };
}
