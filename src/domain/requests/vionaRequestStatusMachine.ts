import { vionaRequestStatuses, type VionaRequestStatus } from './vionaRequestTypes';

const transitionMap = {
  draft: ['submitted', 'cancelled'],
  submitted: ['triage', 'needsHumanConfirmation', 'cancelled', 'failed'],
  triage: ['needsHumanConfirmation', 'sentToPartner', 'completed', 'cancelled', 'failed'],
  needsHumanConfirmation: ['triage', 'sentToPartner', 'cancelled', 'failed'],
  sentToPartner: ['partnerResponded', 'triage', 'cancelled', 'failed'],
  partnerResponded: ['needsHumanConfirmation', 'completed', 'sentToPartner', 'cancelled', 'failed'],
  completed: [],
  cancelled: [],
  failed: ['draft'],
} as const satisfies Readonly<Record<VionaRequestStatus, readonly VionaRequestStatus[]>>;

export function canTransitionRequestStatus(
  from: VionaRequestStatus,
  to: VionaRequestStatus
): boolean {
  const allowedTransitions: readonly VionaRequestStatus[] = transitionMap[from];
  return allowedTransitions.includes(to);
}

export function getAllowedRequestStatusTransitions(
  from: VionaRequestStatus
): readonly VionaRequestStatus[] {
  return transitionMap[from];
}

export function explainRequestStatusTransition(
  from: VionaRequestStatus,
  to: VionaRequestStatus
): string {
  if (!vionaRequestStatuses.includes(from) || !vionaRequestStatuses.includes(to)) {
    return 'Unknown request status. Use the typed VIONA request status list.';
  }

  if (from === to) {
    return `Request status remains ${from}; no workflow movement is needed.`;
  }

  if (!canTransitionRequestStatus(from, to)) {
    return `Cannot transition request status from ${from} to ${to}; this would skip a safety or audit checkpoint.`;
  }

  if (to === 'needsHumanConfirmation') {
    return 'Allowed: the request needs explicit human confirmation before any externally visible action.';
  }

  if (to === 'sentToPartner') {
    return 'Allowed: the request can be sent to a partner only after triage or human confirmation gates are satisfied.';
  }

  if (to === 'completed') {
    return 'Allowed: the request workflow can close, but this status does not represent ledger or fulfillment truth.';
  }

  return `Allowed: request status can move from ${from} to ${to}.`;
}
