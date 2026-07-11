/**
 * Pack30B — Execution-plan route wiring contract types (mock-only, no real execution).
 *
 * Wires the Pack30A pure decision layer (`src/lib/viona/executionPlan`) and mock adapter
 * (`src/lib/viona/mockAdapter`) to a read-only preview route. No status change, no persistent
 * audit write, no external side effects, no real provider calls.
 *
 * See docs/product/VIONA_REQUEST_PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_PLAN_PACKET.md.
 */

import type {
  VionaExecutionPlan,
  VionaExecutionPlanDenialReason,
} from '../../lib/viona/executionPlan';
import type { VionaMockAdapterResult } from '../../lib/viona/mockAdapter';
import type { VionaRequestDetailDto } from './vionaRequestReadDto';

export const VIONA_EXECUTION_PLAN_ROUTE_SAFETY = {
  executionPlanPreviewOnly: true,
  mockOnly: true,
  dryRunNoOp: true,
  noStatusChange: true,
  noPersistentAuditWrite: true,
  noExternalSideEffects: true,
  noPaymentSettlement: true,
  noBookingFulfillment: true,
  noEmergencyEscalation: true,
  operatorApprovalRequiredBeforeRealAction: true,
  externalExecutionBlocked: true,
  notProductionReady: true,
  stagingFirst: true,
} as const;

export type PreviewVionaExecutionPlanRouteInput = Readonly<{
  authUserId: string;
  requestId: string;
  actionId?: string;
  operatorApprovalGranted?: boolean;
  userConsentGranted?: boolean;
  requestSafetyLabels?: readonly string[];
  idempotencyKey?: string;
  clientCorrelationId?: string;
  /** Caller-requested — the mock adapter itself still refuses to invoke if the plan is denied. */
  invokeMockAdapter?: boolean;
}>;

export type PreviewVionaExecutionPlanRouteFailure = 'invalid_input' | 'request_not_found';

export type PreviewVionaExecutionPlanRouteActionMeta = Readonly<{
  eventType: 'action.execution_plan_preview';
  mode: 'mock_only';
  actionId: string;
  plan: VionaExecutionPlan;
  /** Whether the mock adapter function was called at all (transport-level, not business outcome). */
  mockAdapterCalled: boolean;
  mockResult: VionaMockAdapterResult | null;
  denialReason: VionaExecutionPlanDenialReason;
  operatorApprovalRequired: true;
  externalExecutionBlocked: true;
  persistentAuditWritten: false;
  clientCorrelationId?: string;
}>;

export type PreviewVionaExecutionPlanRouteResult =
  | Readonly<{
      ok: true;
      data: VionaRequestDetailDto;
      action: PreviewVionaExecutionPlanRouteActionMeta;
      safety: typeof VIONA_EXECUTION_PLAN_ROUTE_SAFETY;
    }>
  | Readonly<{ ok: false; reason: PreviewVionaExecutionPlanRouteFailure }>;
