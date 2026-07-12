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

export type PreviewVionaExecutionPlanRealProviderPocFailure = 'invalid_input' | 'request_not_found';

export type PreviewVionaExecutionPlanRealProviderPocResult =
  | Readonly<{
      ok: true;
      requestId: string;
      actionId: string;
      planAllowed: boolean;
      denialReason: VionaExecutionPlanDenialReasonForRealProviderPoc;
      realProviderResult: VionaTwilioRealExecutionResult | null;
    }>
  | Readonly<{ ok: false; reason: PreviewVionaExecutionPlanRealProviderPocFailure }>;

/** Re-exported narrowly to avoid a second import of the Pack30A executionPlan module's type. */
type VionaExecutionPlanDenialReasonForRealProviderPoc = ReturnType<typeof buildVionaExecutionPlan>['denialReason'];

/**
 * Builds the same Pack30A execution plan used by the mock-only path, then — **only if the plan
 * is allowed** — delegates to the Pack30D-4 Twilio Test-Credentials adapter's `executeReal()`
 * (which itself re-checks the feature flag, validates the magic-number-only intent, and binds
 * every outcome to the audit ledger). If the plan is denied, `executeReal()` is never called and
 * a `executionBlockedOperator`/`executionBlockedPolicy` audit row is written directly, mirroring
 * the existing Pack30D-1 denial-audit pattern used by `previewVionaExecutionPlanRoute` above.
 */
export async function previewVionaExecutionPlanRealProviderPocRoute(
  input: PreviewVionaExecutionPlanRealProviderPocInput,
): Promise<PreviewVionaExecutionPlanRealProviderPocResult> {
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

  const detail = await getVionaRequestById({ authUserId, requestId });
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
    const auditResult = await appendVionaExecutionAuditEvent({
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
      realProviderResult: null,
    };
  }

  const realProviderResult = await executeVionaTwilioTestPocReal({
    requestId,
    actionId: plan.actionId,
    intent: { fromNumber, toNumber, body: input.body },
    idempotencyKey: input.idempotencyKey ?? null,
    actorUserId: authUserId,
    actorRoleLabel,
  });

  return {
    ok: true,
    requestId,
    actionId: plan.actionId,
    planAllowed: true,
    denialReason: plan.denialReason,
    realProviderResult,
  };
}
