import type { VionaExecutionAttemptEnvelope } from '../../lib/viona/executionLane/vionaExecutionLaneTypes';
import type { VionaExecutionReadinessGateEvaluation } from '../../lib/viona/executionLane/vionaExecutionLaneTypes';
import type { VionaHumanLoopGateEvaluation } from '../../lib/viona/operatorApproval/vionaOperatorApprovalTypes';
import type { VionaRequestExecutionEligibilityEvaluation } from '../../lib/viona/executionGate/vionaRequestExecutionEligibilityGuard';
import type { VionaRequestDetailDto } from './vionaRequestReadDto';

export const VIONA_REQUEST_EXECUTION_GATE_SAFETY = {
  executionPreviewOnly: true,
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

export type PreviewVionaRequestExecutionGateInput = Readonly<{
  authUserId: string;
  requestId: string;
  actionId?: string;
  clientCorrelationId?: string;
  idempotencyKey?: string;
}>;

export type PreviewVionaRequestExecutionGateFailure =
  | 'invalid_input'
  | 'request_not_found'
  | 'status_not_eligible'
  | 'unsupported_action';

export type PreviewVionaRequestExecutionGateActionMeta = Readonly<{
  eventType: 'action.execution_preview';
  mode: 'dry_run';
  actionId: string;
  eligibility: VionaRequestExecutionEligibilityEvaluation;
  readinessGate: VionaExecutionReadinessGateEvaluation;
  humanLoopGate: VionaHumanLoopGateEvaluation;
  attemptEnvelope: VionaExecutionAttemptEnvelope;
  operatorApprovalRequired: true;
  externalExecutionBlocked: true;
  persistentAuditWritten: false;
  idempotencyKey?: string;
  clientCorrelationId?: string;
}>;

export type PreviewVionaRequestExecutionGateResult =
  | Readonly<{
      ok: true;
      data: VionaRequestDetailDto;
      action: PreviewVionaRequestExecutionGateActionMeta;
      safety: typeof VIONA_REQUEST_EXECUTION_GATE_SAFETY;
    }>
  | Readonly<{ ok: false; reason: PreviewVionaRequestExecutionGateFailure }>;
