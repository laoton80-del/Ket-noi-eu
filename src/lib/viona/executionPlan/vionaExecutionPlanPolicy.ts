/**
 * Pack30A — Pure controlled execution decision layer (no side effects, no execution, no persistence).
 *
 * Deny-by-default: any missing/uncertain safety signal results in a safe denial.
 * Reuses existing Pack27/Pack29/Pack26D pure planning layers — does not duplicate their policy tables.
 */

import { evaluateVionaRequestExecutionEligibility } from '../executionGate/vionaRequestExecutionEligibilityGuard';
import { evaluateVionaExecutionReadinessGate } from '../executionLane/vionaExecutionLanePolicy';
import { evaluateVionaHumanLoopGate } from '../operatorApproval/vionaOperatorApprovalPolicy';
import {
  VIONA_PACK30A_BLOCKING_SAFETY_LABELS,
  type VionaExecutionPlanDecisionEvaluation,
  type VionaExecutionPlanDecisionInput,
  type VionaExecutionPlanDenialReason,
} from './vionaExecutionPlanTypes';

const DEFAULT_ACTION_ID = 'request.assign';

function findBlockingLabels(labels: readonly string[] | undefined): readonly string[] {
  if (!labels || labels.length === 0) return [];
  const blocking = new Set<string>(VIONA_PACK30A_BLOCKING_SAFETY_LABELS as readonly string[]);
  return labels.filter((label) => blocking.has(label.trim()));
}

function messagesForDenial(reason: VionaExecutionPlanDenialReason): Readonly<{
  operatorMessage: string;
  userFacingMessage: string;
}> {
  switch (reason) {
    case 'invalid_input':
      return {
        operatorMessage: 'Invalid Pack30A execution plan input.',
        userFacingMessage: 'This action is not available.',
      };
    case 'unsupported_action':
      return {
        operatorMessage: 'Unsupported action — Pack30A execution plan blocked.',
        userFacingMessage: 'This action is not available.',
      };
    case 'ineligible_status':
      return {
        operatorMessage: 'Request status not eligible — Pack30A execution plan blocked.',
        userFacingMessage: 'Your request is not ready for this action.',
      };
    case 'blocked_safety_label':
      return {
        operatorMessage: 'Hold/safety label present — Pack30A execution plan blocked (Pack25 hold bypass forbidden).',
        userFacingMessage: 'This request cannot proceed right now.',
      };
    case 'blocked_lane':
      return {
        operatorMessage: 'Blocked execution lane (Pack27 policy) — Pack30A execution plan blocked.',
        userFacingMessage: 'This action is not available.',
      };
    case 'missing_operator_approval':
      return {
        operatorMessage: 'Operator approval not granted — Pack30A execution plan blocked.',
        userFacingMessage: 'This action requires approval before it can proceed.',
      };
    case 'missing_user_consent':
      return {
        operatorMessage: 'User consent not granted — Pack30A execution plan blocked.',
        userFacingMessage: 'Your consent is required before this action can proceed.',
      };
    case 'not_denied':
    default:
      return {
        operatorMessage:
          'Pack30A mock-only execution plan allowed — no real execution, no persistent audit write, no external side effects.',
        userFacingMessage: 'Mock-only preview allowed — no automated action.',
      };
  }
}

/**
 * Pure Pack30A execution plan decision — no execution, no persistence, no external calls.
 * VionaRequest only. Safe-by-default: any uncertain/missing signal denies.
 */
export function evaluateVionaExecutionPlanDecision(
  input: VionaExecutionPlanDecisionInput,
): VionaExecutionPlanDecisionEvaluation {
  const requestId = input.requestId.trim();
  const requestStatus = input.requestStatus.trim();
  const actionId = (input.actionId ?? DEFAULT_ACTION_ID).trim();

  const eligibility = evaluateVionaRequestExecutionEligibility({
    requestId,
    requestStatus,
    actionId,
  });

  const readinessGate = evaluateVionaExecutionReadinessGate({
    actionId,
    targetType: 'viona_request',
    targetId: requestId,
    requestedByRole: 'request_owner',
  });

  const humanLoopGate = evaluateVionaHumanLoopGate({
    actionId,
    targetType: 'viona_request',
    targetId: requestId,
    requestedByRole: 'request_owner',
  });

  const matchedBlockingLabels = findBlockingLabels(input.requestSafetyLabels);

  let denialReason: VionaExecutionPlanDenialReason = 'not_denied';

  if (requestId.length === 0 || requestStatus.length === 0 || actionId.length === 0) {
    denialReason = 'invalid_input';
  } else if (!eligibility.eligible && eligibility.reason === 'unsupported_action') {
    denialReason = 'unsupported_action';
  } else if (!eligibility.eligible) {
    denialReason = 'ineligible_status';
  } else if (matchedBlockingLabels.length > 0) {
    denialReason = 'blocked_safety_label';
  } else if (readinessGate.blocked) {
    denialReason = 'blocked_lane';
  } else if (input.operatorApprovalGranted !== true) {
    denialReason = 'missing_operator_approval';
  } else if (input.userConsentGranted !== true) {
    denialReason = 'missing_user_consent';
  }

  const allowed = denialReason === 'not_denied';
  const messages = messagesForDenial(denialReason);

  return Object.freeze({
    allowed,
    denialReason,
    requestId,
    requestStatus,
    actionId,
    matchedBlockingLabels,
    eligibility,
    readinessGate,
    humanLoopGate,
    operatorApprovalGranted: input.operatorApprovalGranted === true,
    userConsentGranted: input.userConsentGranted === true,
    operatorMessage: messages.operatorMessage,
    userFacingMessage: messages.userFacingMessage,
  });
}
