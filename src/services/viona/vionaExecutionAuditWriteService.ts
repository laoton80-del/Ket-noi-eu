/**
 * Pack30D-1 — Persistent execution-audit ledger writer (mock-only, no real execution).
 *
 * Append-only write path into the existing, already-reviewed `VionaRequestAuditEvent` Prisma
 * table (no new table, no migration, no schema change — see
 * docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md §6). This module
 * exposes exactly one write method, `appendVionaExecutionAuditEvent`; no update/delete method is
 * ever added, matching the append-only enforcement rule in §6.3 of that packet.
 *
 * This writer is invoked only from the existing, unmodified Pack30B mock-only
 * execution-plan-preview route (`vionaExecutionPlanRouteService.ts`) — it never calls a real
 * provider, never mutates `VionaRequest.status`, and never introduces network/env access.
 *
 * Failures are caught and returned as a typed result rather than thrown, so a transient audit
 * write failure can never turn an otherwise-successful, side-effect-free mock-only response into
 * a 5xx for the caller (see design packet §9, test case 5).
 *
 * Pack33 — Region-Aware PII Scrubber integration (see
 * docs/product/VIONA_PACK33_GLOBAL_COMPLIANCE_PLAN.md §3, §7 item 6). `message` and every string
 * leaf inside `payloadJson` are scrubbed via `scrubVionaPiiDeep()` **before** the Prisma `create()`
 * call, and the resolved `retentionRegion` is stored on the row (frozen at write time — see
 * `vionaAuditRetentionPolicy.ts`). This wraps the existing write path only; every pre-existing
 * call site is unchanged and benefits automatically, exactly as designed in the planning packet —
 * the new, optional `countryCode` input lets a caller resolve a specific region, and omitting it
 * (as every pre-existing call site does today) resolves to `'default'`, the strictest baseline,
 * never "skip scrubbing". This module is never imported by, and never applied to, any
 * real-provider adapter's outbound call payload (see `vionaPiiScrubber.ts` module header).
 */

import type { Prisma, PrismaClient } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import type { VionaRequestAuditEventType } from '../../domain/requests/vionaRequestAuditEventTypes';
import { resolveVionaPiiScrubRegion, scrubVionaPiiDeep } from '../../lib/viona/compliance/vionaPiiScrubber';

/** Minimal Prisma surface this writer depends on — enables dependency injection in unit tests. */
export type VionaExecutionAuditWritePrismaClient = Pick<PrismaClient, 'vionaRequestAuditEvent'>;

/**
 * Re-exported so callers outside this module (e.g. the Pack30B route service) can type their
 * audit payload without importing `Prisma` from `@prisma/client` directly.
 */
export type VionaExecutionAuditPayloadJson = Prisma.InputJsonObject;

export type AppendVionaExecutionAuditEventInput = Readonly<{
  requestId: string;
  eventType: VionaRequestAuditEventType;
  actorUserId?: string | null;
  actorRoleLabel?: string | null;
  message?: string | null;
  payloadJson?: Prisma.InputJsonValue | null;
  /**
   * Pack33 — optional ISO 3166-1 alpha-2 country code, used only to resolve which PII-scrub rules
   * apply and which `retentionRegion` is frozen onto the row. Never forwarded to any real-provider
   * call. Omitted by every pre-existing call site today — resolves to the strictest `'default'`
   * region, never to "skip scrubbing".
   */
  countryCode?: string | null;
}>;

export type AppendVionaExecutionAuditEventResult =
  | Readonly<{ ok: true; auditEventId: string }>
  | Readonly<{ ok: false; reason: 'audit_write_failed'; error: string }>;

/**
 * Append a single, immutable row to the existing `VionaRequestAuditEvent` table. This is the
 * only write method this module exposes — there is intentionally no update/delete counterpart.
 *
 * Accepts an optional Prisma client (defaulting to the shared process singleton via
 * `getPrisma()`) so callers/tests can inject a fake client, including one that simulates a
 * write failure, without touching a live database connection.
 */
export async function appendVionaExecutionAuditEvent(
  input: AppendVionaExecutionAuditEventInput,
  prismaClient: VionaExecutionAuditWritePrismaClient = getPrisma(),
): Promise<AppendVionaExecutionAuditEventResult> {
  try {
    const retentionRegion = resolveVionaPiiScrubRegion(input.countryCode);
    const scrubbedMessage =
      input.message == null ? null : (scrubVionaPiiDeep(input.message, input.countryCode) as string);
    const scrubbedPayloadJson =
      input.payloadJson == null ? undefined : scrubVionaPiiDeep(input.payloadJson, input.countryCode);

    const created = await prismaClient.vionaRequestAuditEvent.create({
      data: {
        requestId: input.requestId,
        eventType: input.eventType,
        actorUserId: input.actorUserId ?? null,
        actorRoleLabel: input.actorRoleLabel ?? null,
        message: scrubbedMessage,
        payloadJson: (scrubbedPayloadJson as Prisma.InputJsonValue | undefined) ?? undefined,
        retentionRegion,
      },
      select: { id: true },
    });

    return { ok: true, auditEventId: created.id };
  } catch (error) {
    return {
      ok: false,
      reason: 'audit_write_failed',
      error: error instanceof Error ? error.message : 'unknown_audit_write_error',
    };
  }
}
