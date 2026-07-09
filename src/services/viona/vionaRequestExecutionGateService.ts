import { buildDryRunOnlyVionaExecutionAttempt } from '../../lib/viona/executionLane/vionaExecutionLaneBuilders';
import { evaluateVionaExecutionReadinessGate } from '../../lib/viona/executionLane/vionaExecutionLanePolicy';
import {
  VIONA_PACK29_ALLOWED_EXECUTION_ACTION_IDS,
  VIONA_PACK29_DEFAULT_EXECUTION_ACTION_ID,
  evaluateVionaRequestExecutionEligibility,
} from '../../lib/viona/executionGate/vionaRequestExecutionEligibilityGuard';
import { evaluateVionaHumanLoopGate } from '../../lib/viona/operatorApproval/vionaOperatorApprovalPolicy';
import { getVionaRequestById } from './vionaRequestReadService';
import type {
  PreviewVionaRequestExecutionGateInput,
  PreviewVionaRequestExecutionGateResult,
} from './vionaRequestExecutionGateDto';
import { VIONA_REQUEST_EXECUTION_GATE_SAFETY } from './vionaRequestExecutionGateDto';

const CLIENT_CORRELATION_ID_MAX_LENGTH = 128;
const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

function normalizeOptionalKey(value: string | undefined, maxLength: number): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return undefined;
  return trimmed;
}

function isAllowedActionId(actionId: string): boolean {
  return (VIONA_PACK29_ALLOWED_EXECUTION_ACTION_IDS as readonly string[]).includes(actionId);
}

function mapEligibilityFailure(
  reason: ReturnType<typeof evaluateVionaRequestExecutionEligibility>['reason'],
): PreviewVionaRequestExecutionGateResult {
  if (reason === 'unsupported_action') {
    return { ok: false, reason: 'unsupported_action' };
  }
  if (reason === 'invalid_input') {
    return { ok: false, reason: 'invalid_input' };
  }
  return { ok: false, reason: 'status_not_eligible' };
}

/**
 * Pack29 staging-first execution preview — read-only eligibility + dry-run envelope only.
 * No status change, no persistent audit write, no external/provider/notification side effects.
 */
export async function previewVionaRequestExecutionGate(
  input: PreviewVionaRequestExecutionGateInput,
): Promise<PreviewVionaRequestExecutionGateResult> {
  const authUserId = input.authUserId.trim();
  const requestId = input.requestId.trim();
  const rawActionId = (input.actionId ?? VIONA_PACK29_DEFAULT_EXECUTION_ACTION_ID).trim();

  const idempotencyKey = normalizeOptionalKey(input.idempotencyKey, IDEMPOTENCY_KEY_MAX_LENGTH);
  const clientCorrelationId = normalizeOptionalKey(
    input.clientCorrelationId,
    CLIENT_CORRELATION_ID_MAX_LENGTH,
  );

  if (authUserId.length === 0 || requestId.length === 0 || rawActionId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (input.idempotencyKey != null && idempotencyKey == null) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (input.clientCorrelationId != null && clientCorrelationId == null) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (!isAllowedActionId(rawActionId)) {
    return { ok: false, reason: 'unsupported_action' };
  }

  const detail = await getVionaRequestById({ authUserId, requestId });
  if (!detail.ok) {
    return { ok: false, reason: 'request_not_found' };
  }

  const eligibility = evaluateVionaRequestExecutionEligibility({
    requestId,
    requestStatus: detail.data.request.status,
    actionId: rawActionId,
  });

  if (!eligibility.eligible) {
    return mapEligibilityFailure(eligibility.reason);
  }

  const readinessGate = evaluateVionaExecutionReadinessGate({
    actionId: rawActionId,
    targetType: 'viona_request',
    targetId: requestId,
    requestedByRole: 'request_owner',
  });

  const humanLoopGate = evaluateVionaHumanLoopGate({
    actionId: rawActionId,
    targetType: 'viona_request',
    targetId: requestId,
    requestedByRole: 'request_owner',
  });

  const attemptEnvelope = buildDryRunOnlyVionaExecutionAttempt({
    executionAttemptId: `pack29-dry-run-${requestId}`,
    actionId: rawActionId,
    targetType: 'viona_request',
    targetId: requestId,
    requestedByRole: 'request_owner',
    idempotencyKey: idempotencyKey ?? null,
    correlationId: clientCorrelationId ?? null,
    createdAt: new Date(0).toISOString(),
    operatorMessage:
      'Pack29 staging-first dry-run — operator approval required before any real external action.',
    userFacingMessage: 'Preview only — no automated action.',
  });

  return {
    ok: true,
    data: detail.data,
    action: {
      eventType: 'action.execution_preview',
      mode: 'dry_run',
      actionId: rawActionId,
      eligibility,
      readinessGate,
      humanLoopGate,
      attemptEnvelope,
      operatorApprovalRequired: true,
      externalExecutionBlocked: true,
      persistentAuditWritten: false,
      idempotencyKey,
      clientCorrelationId,
    },
    safety: VIONA_REQUEST_EXECUTION_GATE_SAFETY,
  };
}
