import type {
  VionaRequestRecord,
  VionaRequestStatus,
  VionaRequestUniverse,
} from './vionaRequestTypes';

export function getRequestStatusSafetyLabel(status: VionaRequestStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft — preview only';
    case 'submitted':
      return 'Request submitted — no payment captured';
    case 'triage':
      return 'Ops triage — not booking confirmed';
    case 'needsHumanConfirmation':
      return 'Needs human confirmation';
    case 'sentToPartner':
      return 'Sent to partner — preview only';
    case 'partnerResponded':
      return 'Partner response received — not booking confirmed';
    case 'inProgress':
      return 'Execution in progress — real-provider call attempted, outcome pending';
    case 'completed':
      return 'Workflow completed — not settled';
    case 'cancelled':
      return 'Cancelled — no action taken';
    case 'failed':
      return 'Failed — ops readiness required';
  }
}

export function getRequestUniverseSafetyNote(universe: VionaRequestUniverse): string {
  switch (universe) {
    case 'sos':
      return 'SOS guidance only — no SOS dispatch unless ops are ready.';
    case 'business':
    case 'b2bWholesale':
      return 'Merchant preview only — no live merchant execution.';
    case 'travel':
      return 'Travel help preview — not booking confirmed.';
    case 'local':
      return 'Local service preview — not booking confirmed.';
    case 'academy':
      return 'Learning help preview — no official certification claim.';
    case 'account':
      return 'Account help preview — auth changes require human confirmation.';
    case 'home':
      return 'Home request preview — read-only display.';
  }
}

export function getRequestHumanConfirmationNote(request: VionaRequestRecord): string {
  if (
    request.status === 'needsHumanConfirmation' ||
    request.humanConfirmation === 'required' ||
    request.humanConfirmation === 'requested'
  ) {
    return 'Needs human confirmation — AI cannot autonomously pay, book, or dispatch.';
  }
  if (request.humanConfirmation === 'confirmed') {
    return 'Human confirmation recorded — protected actions still require ops readiness gates.';
  }
  if (request.humanConfirmation === 'declined') {
    return 'Human confirmation declined — no protected action permitted.';
  }
  return 'Human confirmation not required for this preview state.';
}

export function getRequestNotProductionCopy(request: VionaRequestRecord): string {
  const parts = [
    'Read-only preview',
    getRequestStatusSafetyLabel(request.status),
    getRequestUniverseSafetyNote(request.universe),
    getRequestHumanConfirmationNote(request),
  ];
  return parts.join(' · ');
}
