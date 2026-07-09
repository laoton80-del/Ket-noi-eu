/**
 * Pack29 — Pure post-triage execution eligibility guard (no side effects, no execution).
 */

import {
  vionaRequestStatuses,
  type VionaRequestStatus,
} from '../../../domain/requests/vionaRequestTypes';

export const VIONA_PACK29_POST_TRIAGE_ELIGIBLE_STATUSES = [
  'triage',
  'needsHumanConfirmation',
  'sentToPartner',
  'partnerResponded',
  'completed',
] as const satisfies readonly VionaRequestStatus[];

export const VIONA_PACK29_EXECUTION_BLOCKED_STATUSES = [
  'draft',
  'submitted',
  'cancelled',
  'failed',
] as const satisfies readonly VionaRequestStatus[];

/** Default Pack29 post-triage dry-run action — Pack27 `request.assign` lane. */
export const VIONA_PACK29_DEFAULT_EXECUTION_ACTION_ID = 'request.assign';

export const VIONA_PACK29_ALLOWED_EXECUTION_ACTION_IDS = [
  VIONA_PACK29_DEFAULT_EXECUTION_ACTION_ID,
] as const;

export type VionaRequestExecutionEligibilityReason =
  | 'eligible'
  | 'invalid_input'
  | 'status_pre_triage'
  | 'status_cancelled_or_failed'
  | 'status_not_post_triage'
  | 'unsupported_action';

export type VionaRequestExecutionEligibilityInput = Readonly<{
  requestId: string;
  requestStatus: string;
  actionId?: string;
}>;

export type VionaRequestExecutionEligibilityEvaluation = Readonly<{
  eligible: boolean;
  reason: VionaRequestExecutionEligibilityReason;
  requestId: string;
  requestStatus: string;
  actionId: string;
  operatorMessage: string;
  userFacingMessage: string;
}>;

function isKnownRequestStatus(value: string): value is VionaRequestStatus {
  return (vionaRequestStatuses as readonly string[]).includes(value);
}

function isAllowedPack29ActionId(actionId: string): boolean {
  return (VIONA_PACK29_ALLOWED_EXECUTION_ACTION_IDS as readonly string[]).includes(actionId);
}

/** True when request status is triage or a later approved lifecycle state. */
export function isVionaPack29PostTriageEligibleStatus(status: string): boolean {
  return (VIONA_PACK29_POST_TRIAGE_ELIGIBLE_STATUSES as readonly string[]).includes(status);
}

/** Pure eligibility evaluation — no execution, no persistence, no external calls. */
export function evaluateVionaRequestExecutionEligibility(
  input: VionaRequestExecutionEligibilityInput,
): VionaRequestExecutionEligibilityEvaluation {
  const requestId = input.requestId.trim();
  const requestStatus = input.requestStatus.trim();
  const actionId = (input.actionId ?? VIONA_PACK29_DEFAULT_EXECUTION_ACTION_ID).trim();

  if (requestId.length === 0 || requestStatus.length === 0 || actionId.length === 0) {
    return Object.freeze({
      eligible: false,
      reason: 'invalid_input',
      requestId,
      requestStatus,
      actionId,
      operatorMessage: 'Invalid execution preview input.',
      userFacingMessage: 'This action is not available.',
    });
  }

  if (!isAllowedPack29ActionId(actionId)) {
    return Object.freeze({
      eligible: false,
      reason: 'unsupported_action',
      requestId,
      requestStatus,
      actionId,
      operatorMessage: 'Unsupported execution action — Pack29 staging gate blocked.',
      userFacingMessage: 'This action is not available.',
    });
  }

  if (!isKnownRequestStatus(requestStatus)) {
    return Object.freeze({
      eligible: false,
      reason: 'status_not_post_triage',
      requestId,
      requestStatus,
      actionId,
      operatorMessage: 'Unknown request status — execution preview blocked.',
      userFacingMessage: 'This action is not available.',
    });
  }

  if (
    requestStatus === 'draft' ||
    requestStatus === 'submitted' ||
    (VIONA_PACK29_EXECUTION_BLOCKED_STATUSES as readonly string[]).includes(requestStatus)
  ) {
    const reason: VionaRequestExecutionEligibilityReason =
      requestStatus === 'draft' || requestStatus === 'submitted'
        ? 'status_pre_triage'
        : 'status_cancelled_or_failed';

    return Object.freeze({
      eligible: false,
      reason,
      requestId,
      requestStatus,
      actionId,
      operatorMessage:
        reason === 'status_pre_triage'
          ? 'Request must reach triage before execution preview — lifecycle not bypassed.'
          : 'Terminal blocked status — execution preview not allowed.',
      userFacingMessage: 'Your request is not ready for this preview.',
    });
  }

  if (!isVionaPack29PostTriageEligibleStatus(requestStatus)) {
    return Object.freeze({
      eligible: false,
      reason: 'status_not_post_triage',
      requestId,
      requestStatus,
      actionId,
      operatorMessage: 'Request status is not post-triage eligible — execution preview blocked.',
      userFacingMessage: 'Your request is not ready for this preview.',
    });
  }

  return Object.freeze({
    eligible: true,
    reason: 'eligible',
    requestId,
    requestStatus,
    actionId,
    operatorMessage:
      'Post-triage dry-run eligible — operator approval required before any real external action.',
    userFacingMessage: 'Preview only — no automated action.',
  });
}
