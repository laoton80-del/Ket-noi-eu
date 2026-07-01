/**
 * Pack28 — Pure execution integration readiness policy mapping (no side effects, no execution).
 */

import type {
  VionaExecutionIntegrationGateEvaluation,
  VionaExecutionIntegrationGateInput,
  VionaExecutionIntegrationPolicy,
  VionaIntegrationLaneClassification,
  VionaIntegrationReadinessBucket,
} from './vionaExecutionIntegrationTypes';
import {
  vionaIntegrationLaneClassifications,
  vionaIntegrationReadinessBuckets,
} from './vionaExecutionIntegrationTypes';

export const VIONA_PACK28_INTEGRATION_READINESS_BUCKETS = vionaIntegrationReadinessBuckets;

export const VIONA_PACK28_INTEGRATION_LANE_CLASSIFICATIONS = vionaIntegrationLaneClassifications;

const PACK28_POLICY_DEFAULTS = {
  uiBackendWiringAuthorized: false as const,
  executionAuthorized: false as const,
  dbWriteAuthorized: false as const,
  statusPostAuthorized: false as const,
  liveQaAuthorized: false as const,
};

const BUCKET_TO_CLASSIFICATION: Readonly<Record<VionaIntegrationReadinessBucket, VionaIntegrationLaneClassification>> =
  Object.freeze({
    not_authorized: 'no_integration',
    documentation_only: 'docs_reference_only',
    contract_reference_only: 'contract_readiness_reference',
    preview_planning_candidate: 'preview_contract_candidate',
    dry_run_planning_candidate: 'dry_run_contract_candidate',
    human_approval_planning_candidate: 'human_gate_contract_candidate',
    operator_review_planning_candidate: 'operator_gate_contract_candidate',
    blocked_sensitive_integration: 'blocked_sensitive_lane',
    future_implementation_requires_phrase: 'future_phrase_required',
  });

const FUTURE_IMPLEMENTATION_GATE =
  'APPROVE_PACK28_EXECUTION_INTEGRATION_READINESS_IMPLEMENTATION_STAGING_SAFE';

function classificationForBucket(bucket: VionaIntegrationReadinessBucket): VionaIntegrationLaneClassification {
  return BUCKET_TO_CLASSIFICATION[bucket];
}

function buildPolicy(
  actionId: string,
  actionFamily: string,
  bucket: VionaIntegrationReadinessBucket,
  options: {
    requiresHumanApproval: boolean;
    requiresOperatorReview: boolean;
    sensitiveLane: boolean;
    allowedReferenceMode: VionaExecutionIntegrationPolicy['allowedReferenceMode'];
    requiredFutureGate: string;
    blockedReason: string | null;
    operatorMessage: string;
    userFacingMessage: string;
    notes: string;
  },
): VionaExecutionIntegrationPolicy {
  return Object.freeze({
    actionId,
    actionFamily,
    pack26bActionExists: true,
    pack27PolicyExists: true,
    integrationReadinessBucket: bucket,
    integrationLaneClassification: classificationForBucket(bucket),
    requiresHumanApproval: options.requiresHumanApproval,
    requiresOperatorReview: options.requiresOperatorReview,
    sensitiveLane: options.sensitiveLane,
    allowedReferenceMode: options.allowedReferenceMode,
    requiredFutureGate: options.requiredFutureGate,
    blockedReason: options.blockedReason,
    operatorMessage: options.operatorMessage,
    userFacingMessage: options.userFacingMessage,
    notes: options.notes,
    ...PACK28_POLICY_DEFAULTS,
  });
}

export const VIONA_PACK28_ACTION_INTEGRATION_POLICIES: readonly VionaExecutionIntegrationPolicy[] = [
  buildPolicy('request.status.submitted_to_triage', 'request_status', 'preview_planning_candidate', {
    requiresHumanApproval: false,
    requiresOperatorReview: false,
    sensitiveLane: false,
    allowedReferenceMode: 'preview_plan',
    requiredFutureGate: 'Pack25 Option C hold; separate authorization for any status action',
    blockedReason: null,
    operatorMessage: 'Preview planning only — no UI/backend wiring in Pack28.',
    userFacingMessage: 'Preview only — no automated action.',
    notes: 'Pack25 reference — Option C hold; no further status-post action.',
  }),
  buildPolicy('request.assign', 'request_assign', 'operator_review_planning_candidate', {
    requiresHumanApproval: false,
    requiresOperatorReview: true,
    sensitiveLane: false,
    allowedReferenceMode: 'dry_run_plan',
    requiredFutureGate: 'Operator review + future implementation phrase',
    blockedReason: null,
    operatorMessage: 'Operator review planning only — execution not enabled in Pack28.',
    userFacingMessage: 'Your request is under review.',
    notes: 'Operator assignment lane — planning only; not executable.',
  }),
  buildPolicy('request.confirm', 'request_confirm', 'human_approval_planning_candidate', {
    requiresHumanApproval: true,
    requiresOperatorReview: false,
    sensitiveLane: false,
    allowedReferenceMode: 'dry_run_plan',
    requiredFutureGate: 'Pack26D human approval + future implementation phrase',
    blockedReason: null,
    operatorMessage: 'Human approval planning only — execution not enabled in Pack28.',
    userFacingMessage: 'Your request requires review.',
    notes: 'Human approval required before any future confirm integration.',
  }),
  buildPolicy('request.cancel', 'request_cancel', 'human_approval_planning_candidate', {
    requiresHumanApproval: true,
    requiresOperatorReview: false,
    sensitiveLane: false,
    allowedReferenceMode: 'dry_run_plan',
    requiredFutureGate: 'Pack26D human approval + future implementation phrase',
    blockedReason: null,
    operatorMessage: 'Human approval planning only — execution not enabled in Pack28.',
    userFacingMessage: 'Your request requires review.',
    notes: 'Human approval required before any future cancel integration.',
  }),
  buildPolicy('booking.request', 'booking', 'blocked_sensitive_integration', {
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: true,
    allowedReferenceMode: 'none',
    requiredFutureGate: 'Separate sensitive-lane authorization',
    blockedReason: 'Booking fulfillment not authorized in Pack28.',
    operatorMessage: 'Blocked sensitive integration — execution not enabled in Pack28.',
    userFacingMessage: 'This action is not available.',
    notes: 'Booking fulfillment not authorized.',
  }),
  buildPolicy('payment.intent', 'payment', 'blocked_sensitive_integration', {
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: true,
    allowedReferenceMode: 'none',
    requiredFutureGate: 'Separate sensitive-lane authorization',
    blockedReason: 'Payment or money movement blocked in Pack28.',
    operatorMessage: 'Blocked sensitive integration — execution not enabled in Pack28.',
    userFacingMessage: 'This action is not available.',
    notes: 'Payment or money movement blocked.',
  }),
  buildPolicy('sos.assist', 'sos', 'blocked_sensitive_integration', {
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: true,
    allowedReferenceMode: 'none',
    requiredFutureGate: 'Separate sensitive-lane authorization',
    blockedReason: 'SOS or safety lane blocked in Pack28.',
    operatorMessage: 'Blocked sensitive integration — execution not enabled in Pack28.',
    userFacingMessage: 'This action is not available.',
    notes: 'SOS or safety lane blocked.',
  }),
  buildPolicy('wallet.adjustment', 'wallet', 'blocked_sensitive_integration', {
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: true,
    allowedReferenceMode: 'none',
    requiredFutureGate: 'Separate sensitive-lane authorization',
    blockedReason: 'Wallet or ledger lane blocked in Pack28.',
    operatorMessage: 'Blocked sensitive integration — execution not enabled in Pack28.',
    userFacingMessage: 'This action is not available.',
    notes: 'Wallet or ledger lane blocked.',
  }),
  buildPolicy('live_ai.action', 'live_ai', 'blocked_sensitive_integration', {
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: true,
    allowedReferenceMode: 'none',
    requiredFutureGate: 'Separate sensitive-lane authorization',
    blockedReason: 'Live AI autonomy blocked in Pack28.',
    operatorMessage: 'Blocked sensitive integration — execution not enabled in Pack28.',
    userFacingMessage: 'This action is not available.',
    notes: 'Live AI autonomy blocked.',
  }),
];

const POLICIES_BY_ACTION_ID: Readonly<Record<string, VionaExecutionIntegrationPolicy>> = Object.freeze(
  Object.fromEntries(VIONA_PACK28_ACTION_INTEGRATION_POLICIES.map((policy) => [policy.actionId, policy])),
);

export const VIONA_PACK28_UNKNOWN_ACTION_POLICY: VionaExecutionIntegrationPolicy = Object.freeze({
  actionId: '',
  actionFamily: 'unknown',
  pack26bActionExists: false,
  pack27PolicyExists: false,
  integrationReadinessBucket: 'not_authorized',
  integrationLaneClassification: 'no_integration',
  uiBackendWiringAuthorized: false,
  executionAuthorized: false,
  dbWriteAuthorized: false,
  statusPostAuthorized: false,
  liveQaAuthorized: false,
  requiresHumanApproval: true,
  requiresOperatorReview: true,
  sensitiveLane: true,
  allowedReferenceMode: 'none',
  requiredFutureGate: FUTURE_IMPLEMENTATION_GATE,
  blockedReason: 'Unknown action ID — safe blocked policy.',
  operatorMessage: 'Unknown action — integration readiness layer blocked.',
  userFacingMessage: 'This action is not available.',
  notes: 'Unknown action ID — safe blocked policy.',
});

/** Lookup integration readiness policy for a Pack26B action ID; unknown IDs return safe blocked policy. */
export function getVionaExecutionIntegrationPolicyForAction(actionId: string): VionaExecutionIntegrationPolicy {
  const policy = POLICIES_BY_ACTION_ID[actionId];
  if (!policy) {
    return { ...VIONA_PACK28_UNKNOWN_ACTION_POLICY, actionId };
  }
  return policy;
}

/** Resolve integration lane classification for a Pack26B action ID. */
export function getVionaExecutionIntegrationClassificationForAction(
  actionId: string,
): VionaIntegrationLaneClassification {
  return getVionaExecutionIntegrationPolicyForAction(actionId).integrationLaneClassification;
}

function isBlockedBucket(bucket: VionaIntegrationReadinessBucket): boolean {
  return (
    bucket === 'not_authorized' ||
    bucket === 'blocked_sensitive_integration' ||
    bucket === 'future_implementation_requires_phrase'
  );
}

/** Pure integration gate evaluation — no execution, no persistence. */
export function evaluateVionaExecutionIntegrationGate(
  input: VionaExecutionIntegrationGateInput,
): VionaExecutionIntegrationGateEvaluation {
  const policy = getVionaExecutionIntegrationPolicyForAction(input.actionId);
  const knownAction = POLICIES_BY_ACTION_ID[input.actionId] !== undefined;
  const blocked = !knownAction || isBlockedBucket(policy.integrationReadinessBucket) || policy.sensitiveLane;

  const blockedReason = !knownAction
    ? 'Unknown action ID — blocked by Pack28 integration readiness policy.'
    : policy.blockedReason ?? (blocked ? 'Integration blocked by Pack28 policy.' : null);

  const allowedToReferenceContract =
    knownAction &&
    !blocked &&
    (policy.allowedReferenceMode === 'contract_types_only' ||
      policy.allowedReferenceMode === 'preview_plan' ||
      policy.allowedReferenceMode === 'dry_run_plan' ||
      policy.integrationReadinessBucket === 'contract_reference_only' ||
      policy.integrationReadinessBucket === 'documentation_only');

  const allowedToBuildPreviewPlan =
    knownAction &&
    !blocked &&
    (policy.integrationReadinessBucket === 'preview_planning_candidate' ||
      policy.allowedReferenceMode === 'preview_plan');

  const allowedToBuildDryRunPlan =
    knownAction &&
    !blocked &&
    (policy.integrationReadinessBucket === 'dry_run_planning_candidate' ||
      policy.allowedReferenceMode === 'dry_run_plan');

  return Object.freeze({
    actionId: input.actionId,
    integrationReadinessBucket: policy.integrationReadinessBucket,
    integrationLaneClassification: policy.integrationLaneClassification,
    allowedToReferenceContract,
    allowedToBuildPreviewPlan,
    allowedToBuildDryRunPlan,
    uiBackendWiringAuthorized: false,
    executionAuthorized: false,
    dbWriteAuthorized: false,
    statusPostAuthorized: false,
    liveQaAuthorized: false,
    blocked,
    blockedReason,
    requiresHumanApproval: policy.requiresHumanApproval,
    requiresOperatorReview: policy.requiresOperatorReview,
    operatorMessage: policy.operatorMessage,
    userFacingMessage: policy.userFacingMessage,
  });
}
