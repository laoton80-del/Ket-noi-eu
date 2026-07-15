/**
 * Pack30B — Execution-plan route wiring service (mock-only, no real execution).
 *
 * Orchestration only: reads the request read-only via the existing Pack19/Pack29
 * `getVionaRequestById` lookup, then delegates entirely to the Pack30A pure decision layer
 * (`buildVionaExecutionPlan`) and, only if explicitly requested by the caller, the Pack30A mock
 * adapter (`invokeVionaMockExecutionAdapter`). This module never calls a real provider, never
 * mutates request status, and never adds DB schema.
 *
 * Pack30D-1 (see docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md §6, §8)
 * adds a durable, append-only audit-ledger write for every call, via
 * `vionaExecutionAuditWriteService.ts`. This does not change the response shape, status codes,
 * or existing mock-adapter behavior described above — it only makes the already-happening
 * mock-only preview call durably auditable. An audit-write failure is logged and never thrown
 * back to the caller (see `previewVionaExecutionPlanRoute`).
 *
 * See docs/product/VIONA_REQUEST_PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_PLAN_PACKET.md.
 */

import { buildVionaExecutionPlan } from '../../lib/viona/executionPlan';
import {
  createInMemoryVionaMockIdempotencyStore,
  invokeVionaMockExecutionAdapter,
} from '../../lib/viona/mockAdapter';
import type { VionaRequestAuditEventType } from '../../domain/requests/vionaRequestAuditEventTypes';
import { getVionaRequestById } from './vionaRequestReadService';
import { appendVionaExecutionAuditEvent } from './vionaExecutionAuditWriteService';
import type { VionaExecutionAuditPayloadJson } from './vionaExecutionAuditWriteService';
import type {
  PreviewVionaExecutionPlanRouteActionMeta,
  PreviewVionaExecutionPlanRouteInput,
  PreviewVionaExecutionPlanRouteResult,
} from './vionaExecutionPlanRouteDto';
import { VIONA_EXECUTION_PLAN_ROUTE_SAFETY } from './vionaExecutionPlanRouteDto';
import {
  executeVionaTwilioTestPocReal,
  type VionaTwilioRealExecutionResult,
} from '../../lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter';
import {
  holdVionaRequestExecutionCost,
  settleVionaRequestExecutionHold,
  type HoldVionaRequestExecutionCostFailureReason,
  type VionaRequestEscrowHoldResolvedStatus,
} from './vionaRequestEscrowHoldService';

const IDEMPOTENCY_KEY_MAX_LENGTH = 128;
const CLIENT_CORRELATION_ID_MAX_LENGTH = 128;

function normalizeOptionalKey(value: string | undefined, maxLength: number): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return undefined;
  return trimmed;
}

/**
 * Process-local, non-persistent idempotency placeholder shared across requests handled by this
 * server process only (module-level singleton). Never durable, never a substitute for a real
 * audit ledger — matches the Pack30A mock adapter's documented placeholder-only contract.
 */
const routeMockIdempotencyStore = createInMemoryVionaMockIdempotencyStore();

export type BuildVionaExecutionPlanPreviewActionInput = Readonly<{
  requestId: string;
  requestStatus: string;
  actionId?: string;
  operatorApprovalGranted?: boolean;
  userConsentGranted?: boolean;
  requestSafetyLabels?: readonly string[];
  idempotencyKey?: string | null;
  clientCorrelationId?: string;
  invokeMockAdapter?: boolean;
}>;

/**
 * Core Pack30A wiring — builds the execution plan and, only if requested, invokes the mock
 * adapter, given an **already-resolved** request status. Deliberately has **no DB access** so
 * this wiring logic (the actual Pack30B contribution) can be unit-tested without a live
 * database connection. The only DB-touching call in this file is the existing, unmodified
 * `getVionaRequestById` read-only lookup used by `previewVionaExecutionPlanRoute` below.
 */
export function buildVionaExecutionPlanPreviewAction(
  input: BuildVionaExecutionPlanPreviewActionInput,
): PreviewVionaExecutionPlanRouteActionMeta {
  const plan = buildVionaExecutionPlan({
    planId: `pack30b-plan-${input.requestId}-${input.actionId ?? 'default'}`,
    createdAt: new Date().toISOString(),
    requestId: input.requestId,
    requestStatus: input.requestStatus,
    actionId: input.actionId,
    requestSafetyLabels: input.requestSafetyLabels,
    operatorApprovalGranted: input.operatorApprovalGranted === true,
    userConsentGranted: input.userConsentGranted === true,
    idempotencyKey: input.idempotencyKey ?? null,
  });

  const mockAdapterCalled = input.invokeMockAdapter === true;
  const mockResult = mockAdapterCalled
    ? invokeVionaMockExecutionAdapter(
        { plan, invokedAt: new Date().toISOString() },
        routeMockIdempotencyStore,
      )
    : null;

  return {
    eventType: 'action.execution_plan_preview',
    mode: 'mock_only',
    actionId: plan.actionId,
    plan,
    mockAdapterCalled,
    mockResult,
    denialReason: plan.denialReason,
    operatorApprovalRequired: true,
    externalExecutionBlocked: true,
    persistentAuditWritten: false,
    clientCorrelationId: input.clientCorrelationId,
  };
}

/**
 * Pack30D-1 — pure mapping from an already-computed execution-plan-preview action outcome to the
 * `VionaRequestAuditEventType` that must be durably recorded for it. No DB access; fully
 * unit-testable in isolation, mirroring §6.2 of the Pack30D design packet:
 *   - denied for missing operator approval  -> `executionBlockedOperator`
 *   - denied for any other policy reason    -> `executionBlockedPolicy`
 *   - allowed, mock adapter invoked          -> `executionMockInvoked` (including replays)
 *   - allowed, mock adapter not invoked      -> `executionPlanBuilt`
 */
export function resolveVionaExecutionAuditEventType(
  action: PreviewVionaExecutionPlanRouteActionMeta,
): VionaRequestAuditEventType {
  if (!action.plan.allowed) {
    return action.denialReason === 'missing_operator_approval'
      ? 'executionBlockedOperator'
      : 'executionBlockedPolicy';
  }
  return action.mockAdapterCalled ? 'executionMockInvoked' : 'executionPlanBuilt';
}

/**
 * Pack30D-1 — pure helper resolving a human-readable actor role label for the audit row, reusing
 * fields already present on the read-only request detail DTO (no extra DB query). Mirrors the
 * existing `resolveActorRoleLabel` pattern used by `vionaRequestNoteActionService.ts`.
 */
export function resolveVionaExecutionAuditActorRoleLabel(
  request: Readonly<{ requesterUserId: string | null; ownerUserId: string | null }>,
  authUserId: string,
): string {
  if (request.requesterUserId === authUserId) return 'requester';
  if (request.ownerUserId === authUserId) return 'owner';
  return 'participant';
}

/**
 * Pack30D-1 — pure builder for the audit-event payload recorded alongside every execution-plan
 * preview evaluation. No DB access; fully unit-testable in isolation.
 */
export function buildVionaExecutionAuditPayload(
  action: PreviewVionaExecutionPlanRouteActionMeta,
): VionaExecutionAuditPayloadJson {
  return {
    actionId: action.actionId,
    planId: action.plan.planId,
    planState: action.plan.state,
    denialReason: action.denialReason,
    mockAdapterCalled: action.mockAdapterCalled,
    clientCorrelationId: action.clientCorrelationId ?? null,
    metadata: {
      replay: action.mockResult?.replay ?? false,
    },
  };
}

/**
 * Pack30B staging-first mock-only execution-plan preview — read-only eligibility + mock-only
 * envelope. No status change, no external/provider side effects.
 *
 * Pack30D-1 adds a durable, append-only audit-ledger write (see module header) after the
 * response is computed. A failure of that write is logged and never thrown back to the caller —
 * the response returned below is always the pre-existing, unmodified Pack30B response shape.
 */
export async function previewVionaExecutionPlanRoute(
  input: PreviewVionaExecutionPlanRouteInput,
): Promise<PreviewVionaExecutionPlanRouteResult> {
  const authUserId = input.authUserId.trim();
  const requestId = input.requestId.trim();
  const actionId = input.actionId?.trim();

  const idempotencyKey = normalizeOptionalKey(input.idempotencyKey, IDEMPOTENCY_KEY_MAX_LENGTH);
  const clientCorrelationId = normalizeOptionalKey(
    input.clientCorrelationId,
    CLIENT_CORRELATION_ID_MAX_LENGTH,
  );

  if (authUserId.length === 0 || requestId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (input.idempotencyKey != null && idempotencyKey == null) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (input.clientCorrelationId != null && clientCorrelationId == null) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (actionId != null && actionId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const detail = await getVionaRequestById({ authUserId, requestId });
  if (!detail.ok) {
    return { ok: false, reason: 'request_not_found' };
  }

  const action = buildVionaExecutionPlanPreviewAction({
    requestId,
    requestStatus: detail.data.request.status,
    actionId,
    requestSafetyLabels: input.requestSafetyLabels,
    operatorApprovalGranted: input.operatorApprovalGranted,
    userConsentGranted: input.userConsentGranted,
    idempotencyKey: idempotencyKey ?? null,
    clientCorrelationId,
    invokeMockAdapter: input.invokeMockAdapter,
  });

  const auditWriteResult = await appendVionaExecutionAuditEvent({
    requestId,
    eventType: resolveVionaExecutionAuditEventType(action),
    actorUserId: authUserId,
    actorRoleLabel: resolveVionaExecutionAuditActorRoleLabel(detail.data.request, authUserId),
    message: 'Pack30B execution-plan preview evaluated (mock-only, durable audit record).',
    payloadJson: buildVionaExecutionAuditPayload(action),
  });

  if (!auditWriteResult.ok) {
    // Pack30D-1: an audit-write failure must never turn this side-effect-free, mock-only
    // response into a 5xx — log and continue with the pre-existing Pack30B response shape.
    console.error(
      `[pack30d1-audit-write] failed to append execution-plan-preview audit event for request ${requestId}: ${auditWriteResult.error}`,
    );
  }

  return {
    ok: true,
    data: detail.data,
    action,
    safety: VIONA_EXECUTION_PLAN_ROUTE_SAFETY,
  };
}

/**
 * Pack30D-4 — Twilio Test-Credentials real-provider POC route wiring.
 *
 * Deliberately a **brand-new, additive** function, not a modification of
 * `previewVionaExecutionPlanRoute` above: this keeps that existing function, its DTO
 * (`vionaExecutionPlanRouteDto.ts`), and its static `VIONA_EXECUTION_PLAN_ROUTE_SAFETY` constant
 * byte-for-byte unchanged, and guarantees the pre-existing mock-only HTTP route
 * (`POST /api/viona/requests/:id/actions/execution-plan-preview`) can never accidentally return a
 * misleading `mockOnly: true` / `noExternalSideEffects: true` safety label for a call that
 * actually reached a real provider. This function is **not** wired to any Express controller or
 * route in this change — it exists as a directly unit-testable service-layer capability only
 * (see the evidence README for the explicit rationale for this narrower-than-planned scope).
 *
 * Reuses, unmodified: `buildVionaExecutionPlan` (Pack30A), `getVionaRequestById` (Pack19/29),
 * `appendVionaExecutionAuditEvent` (Pack30D-1), `resolveVionaExecutionAuditActorRoleLabel`
 * (Pack30D-1). Never mutates `VionaRequest.status`. Never touches the Pack30A mock adapter.
 */
export type PreviewVionaExecutionPlanRealProviderPocInput = Readonly<{
  authUserId: string;
  requestId: string;
  actionId?: string;
  operatorApprovalGranted?: boolean;
  userConsentGranted?: boolean;
  requestSafetyLabels?: readonly string[];
  idempotencyKey?: string | null;
  fromNumber: string;
  toNumber: string;
  body: string;
}>;

export type PreviewVionaExecutionPlanRealProviderPocFailure =
  | 'invalid_input'
  | 'request_not_found'
  /** Pack40D3B — direct POC bypass closed; use Pack40D coordinator. */
  | 'provider_bypass_closed';

/**
 * Pack31 — VIO Credits escrow outcome for this specific real-provider POC call. `attempted: false`
 * means the plan was denied before any hold was ever attempted (mirrors the pre-existing
 * `planAllowed: false` early-return, unchanged). See vionaRequestEscrowHoldService.ts.
 */
export type PreviewVionaExecutionPlanRealProviderPocEscrowOutcome =
  | Readonly<{ attempted: false }>
  | Readonly<{ attempted: true; holdOk: false; reason: HoldVionaRequestExecutionCostFailureReason }>
  | Readonly<{
      attempted: true;
      holdOk: true;
      holdId: string;
      heldAmountVIO: number;
      resolvedStatus: VionaRequestEscrowHoldResolvedStatus | null;
      settledAmountVIO: number | null;
      refundedAmountVIO: number | null;
    }>;

export type PreviewVionaExecutionPlanRealProviderPocResult =
  | Readonly<{
      ok: true;
      requestId: string;
      actionId: string;
      planAllowed: boolean;
      denialReason: VionaExecutionPlanDenialReasonForRealProviderPoc;
      escrow: PreviewVionaExecutionPlanRealProviderPocEscrowOutcome;
      realProviderResult: VionaTwilioRealExecutionResult | null;
    }>
  | Readonly<{ ok: false; reason: PreviewVionaExecutionPlanRealProviderPocFailure }>;

/** Re-exported narrowly to avoid a second import of the Pack30A executionPlan module's type. */
type VionaExecutionPlanDenialReasonForRealProviderPoc = ReturnType<typeof buildVionaExecutionPlan>['denialReason'];

/**
 * Pack31 — fixed, symbolic estimated cost (VIO Credits) used to exercise the Zero-Loss hold/settle
 * gate for this Twilio Test-Credentials POC. This is a **business charge placeholder**, not a
 * pass-through of Twilio's real invoice cost (Test Credentials are guaranteed zero-cost by Twilio,
 * §docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md §3) — a future genuinely-billable
 * provider would compute `estimatedAmountVIO` from that provider's own cost model instead of this
 * constant. Policy: the user is charged the full estimate only if the call actually **succeeded**
 * (service delivered); any blocked/failed outcome is refunded in full (§5 of the escrow plan).
 */
export const VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO = 0.01;

/**
 * Pack32.5 — Core System Integration Audit finding: this function previously had **zero**
 * dependency-injection surface, meaning no test in this repo could ever exercise its full
 * plan -> hold -> executeReal -> settle chain without a live database (via `getVionaRequestById`)
 * and, if the feature flag were ever enabled, a live Twilio call. Every other function in this
 * chain (`holdVionaRequestExecutionCost`, `executeVionaTwilioTestPocReal`,
 * `settleVionaRequestExecutionHold`) already accepts injectable deps — this was the one missing
 * seam. Adding it is a narrow, additive, backward-compatible bug-fix (every field is optional and
 * defaults to the exact pre-existing real function, so omitting `deps` reproduces byte-for-byte
 * the pre-Pack32.5 behavior) — not new business logic. See
 * scripts/test-viona-pack32-5-core-integration-audit.ts and the evidence README for the audit that
 * discovered this gap and the true end-to-end tests it now enables.
 */
export type PreviewVionaExecutionPlanRealProviderPocDeps = Readonly<{
  getVionaRequestByIdFn?: typeof getVionaRequestById;
  holdFn?: typeof holdVionaRequestExecutionCost;
  executeRealFn?: typeof executeVionaTwilioTestPocReal;
  settleFn?: typeof settleVionaRequestExecutionHold;
  auditWriter?: typeof appendVionaExecutionAuditEvent;
  /**
   * Pack40D3B — direct Twilio/escrow POC path is closed by default.
   * Local unit tests that exercise the legacy hold→execute→settle chain must pass
   * `allowDirectProviderBypass: true` (or inject test doubles).
   */
  allowDirectProviderBypass?: boolean;
}>;

/**
 * Builds the same Pack30A execution plan used by the mock-only path, then — **only if the plan
 * is allowed** — delegates to the Pack30D-4 Twilio Test-Credentials adapter's `executeReal()`
 * (which itself re-checks the feature flag, validates the magic-number-only intent, and binds
 * every outcome to the audit ledger). If the plan is denied, `executeReal()` is never called and
 * a `executionBlockedOperator`/`executionBlockedPolicy` audit row is written directly, mirroring
 * the existing Pack30D-1 denial-audit pattern used by `previewVionaExecutionPlanRoute` above.
 *
 * Pack31 adds a mandatory VIO Credits escrow hold **between** the plan-allowed check and the
 * `executeVionaTwilioTestPocReal()` call: if `holdVionaRequestExecutionCost()` does not return
 * `ok: true`, `executeReal()` is never reached (see docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md
 * §5, the Zero-Loss gate). After the real outcome is known, the hold is settled (full charge on
 * `succeeded`, full refund on any blocked/failed outcome) via `settleVionaRequestExecutionHold()`.
 *
 * Pack32.5 — a hold failure (e.g. `insufficient_funds`) now also writes an `executionBlockedPolicy`
 * audit row before returning (audit-ledger integration gap found by the Core System Integration
 * Audit — previously a hold failure was only `console.error`-logged, never durably recorded).
 */
export async function previewVionaExecutionPlanRealProviderPocRoute(
  input: PreviewVionaExecutionPlanRealProviderPocInput,
  deps: PreviewVionaExecutionPlanRealProviderPocDeps = {},
): Promise<PreviewVionaExecutionPlanRealProviderPocResult> {
  const getVionaRequestByIdFn = deps.getVionaRequestByIdFn ?? getVionaRequestById;
  const holdFn = deps.holdFn ?? holdVionaRequestExecutionCost;
  const executeRealFn = deps.executeRealFn ?? executeVionaTwilioTestPocReal;
  const settleFn = deps.settleFn ?? settleVionaRequestExecutionHold;
  const auditWriter = deps.auditWriter ?? appendVionaExecutionAuditEvent;
  const authUserId = input.authUserId.trim();
  const requestId = input.requestId.trim();
  const actionId = input.actionId?.trim();
  const fromNumber = input.fromNumber.trim();
  const toNumber = input.toNumber.trim();

  if (
    authUserId.length === 0 ||
    requestId.length === 0 ||
    fromNumber.length === 0 ||
    toNumber.length === 0 ||
    input.body.trim().length === 0
  ) {
    return { ok: false, reason: 'invalid_input' };
  }

  // Pack40D3B — close direct provider bypass. Injected test doubles or an explicit opt-in reopen
  // the legacy chain for local fake-provider suites only.
  const hasInjectedTestDoubles =
    deps.getVionaRequestByIdFn != null ||
    deps.holdFn != null ||
    deps.executeRealFn != null ||
    deps.settleFn != null;
  if (deps.allowDirectProviderBypass !== true && !hasInjectedTestDoubles) {
    return { ok: false, reason: 'provider_bypass_closed' };
  }

  const detail = await getVionaRequestByIdFn({ authUserId, requestId });
  if (!detail.ok) {
    return { ok: false, reason: 'request_not_found' };
  }

  const plan = buildVionaExecutionPlan({
    planId: `pack30d4-real-poc-plan-${requestId}-${actionId ?? 'default'}`,
    createdAt: new Date().toISOString(),
    requestId,
    requestStatus: detail.data.request.status,
    actionId,
    requestSafetyLabels: input.requestSafetyLabels,
    operatorApprovalGranted: input.operatorApprovalGranted === true,
    userConsentGranted: input.userConsentGranted === true,
    idempotencyKey: input.idempotencyKey ?? null,
  });

  const actorRoleLabel = resolveVionaExecutionAuditActorRoleLabel(detail.data.request, authUserId);

  if (!plan.allowed) {
    const eventType: VionaRequestAuditEventType =
      plan.denialReason === 'missing_operator_approval' ? 'executionBlockedOperator' : 'executionBlockedPolicy';
    const auditResult = await auditWriter({
      requestId,
      eventType,
      actorUserId: authUserId,
      actorRoleLabel,
      message:
        'Pack30D-4 Twilio Test-Credentials real-provider POC: execution plan denied before any provider call.',
      payloadJson: {
        provider: 'twilio_test_credentials',
        actionId: plan.actionId,
        planId: plan.planId,
        planState: plan.state,
        denialReason: plan.denialReason,
      },
    });
    if (!auditResult.ok) {
      console.error(
        `[pack30d4-real-provider-poc] failed to append plan-denied audit event for request ${requestId}: ${auditResult.error}`,
      );
    }
    return {
      ok: true,
      requestId,
      actionId: plan.actionId,
      planAllowed: false,
      denialReason: plan.denialReason,
      escrow: { attempted: false },
      realProviderResult: null,
    };
  }

  // Pack31 Zero-Loss gate: hold BEFORE calling executeReal(). If the hold does not return
  // `ok: true`, `executeVionaTwilioTestPocReal()` is never reached — mirrors exactly how
  // `executeReal()` itself never falls through its own feature-flag check by accident.
  const escrowIdempotencyKey = input.idempotencyKey ?? `pack31-hold-${requestId}-${plan.actionId}`;
  const hold = await holdFn({
    requestId,
    actionId: plan.actionId,
    userId: authUserId,
    estimatedAmountVIO: VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO,
    idempotencyKey: escrowIdempotencyKey,
    auditActorRoleLabel: actorRoleLabel,
  });

  if (!hold.ok) {
    console.error(
      `[pack31-escrow] hold denied for request ${requestId}, action ${plan.actionId}: ${hold.reason}`,
    );
    // Pack32.5 — audit-ledger integration gap fix: a hold failure must be durably recorded, not
    // just console-logged, so the Core System Integration Audit's "ledger records the error"
    // requirement holds for every denial path, not only the plan-denied path above.
    const holdFailureAuditResult = await auditWriter({
      requestId,
      eventType: 'executionBlockedPolicy',
      actorUserId: authUserId,
      actorRoleLabel,
      message: `Pack31 escrow hold denied (${hold.reason}) — executeReal() never called (Zero-Loss gate).`,
      payloadJson: {
        provider: 'twilio_test_credentials',
        actionId: plan.actionId,
        planId: plan.planId,
        holdFailureReason: hold.reason,
      },
    });
    if (!holdFailureAuditResult.ok) {
      console.error(
        `[pack31-escrow] failed to append hold-denied audit event for request ${requestId}: ${holdFailureAuditResult.error}`,
      );
    }
    return {
      ok: true,
      requestId,
      actionId: plan.actionId,
      planAllowed: true,
      denialReason: plan.denialReason,
      escrow: { attempted: true, holdOk: false, reason: hold.reason },
      realProviderResult: null,
    };
  }

  const realProviderResult = await executeRealFn({
    requestId,
    actionId: plan.actionId,
    intent: { fromNumber, toNumber, body: input.body },
    idempotencyKey: input.idempotencyKey ?? null,
    actorUserId: authUserId,
    actorRoleLabel,
  });

  // Zero-Loss settle: full charge only if the call actually succeeded; any blocked/failed
  // outcome is refunded in full (no real cost was ever incurred by the platform). A settle
  // failure (typed `ok: false`, or an unexpected throw) is logged and flagged for
  // reconciliation — it must never overwrite or lose the already-known `realProviderResult`
  // returned above (test plan case 9).
  const actualCostVIO = realProviderResult.outcome.outcome === 'succeeded' ? hold.heldAmountVIO : 0;
  let resolved: Awaited<ReturnType<typeof settleVionaRequestExecutionHold>>;
  try {
    resolved = await settleFn({
      holdId: hold.holdId,
      requestId,
      actualCostVIO,
      auditActorUserId: authUserId,
      auditActorRoleLabel: actorRoleLabel,
    });
  } catch (error) {
    console.error(
      `[pack31-escrow] settle threw for hold ${hold.holdId} on request ${requestId}: ${error instanceof Error ? error.message : 'unknown_error'}`,
    );
    resolved = { ok: false, reason: 'settle_error' };
  }
  if (!resolved.ok) {
    console.error(
      `[pack31-escrow] settle failed for hold ${hold.holdId} on request ${requestId}: ${resolved.reason}`,
    );
  }

  return {
    ok: true,
    requestId,
    actionId: plan.actionId,
    planAllowed: true,
    denialReason: plan.denialReason,
    escrow: {
      attempted: true,
      holdOk: true,
      holdId: hold.holdId,
      heldAmountVIO: hold.heldAmountVIO,
      resolvedStatus: resolved.ok ? resolved.status : null,
      settledAmountVIO: resolved.ok ? resolved.settledAmountVIO : null,
      refundedAmountVIO: resolved.ok ? resolved.refundedAmountVIO : null,
    },
    realProviderResult,
  };
}
