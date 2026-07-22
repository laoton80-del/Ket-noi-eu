/**
 * Pack A2 — append-only LocalProviderEligibilityAuditEvent create helper.
 * Must only be called inside a mutation transaction alongside eligibility mutation.
 */
import {
  LocalProviderEligibilityAuditEventType,
  LocalProviderEligibilityStatus,
} from '@prisma/client';

import type {
  LocalProviderAuditCreateInput,
  LocalProviderAuthorityTx,
} from './localProviderEligibilityAuthorityTypes';

export function assertLocalProviderEligibilityAuditPriorState(
  input: Pick<
    LocalProviderAuditCreateInput,
    'eventType' | 'priorStatus' | 'priorPublicB2cVisible'
  >
): void {
  if (input.eventType === LocalProviderEligibilityAuditEventType.REGISTERED) {
    if (input.priorStatus != null || input.priorPublicB2cVisible != null) {
      throw new Error('REGISTERED audit requires null prior status and visibility');
    }
    return;
  }
  if (input.priorStatus == null || input.priorPublicB2cVisible == null) {
    throw new Error('Non-REGISTERED audit requires non-null prior status and visibility');
  }
  // Exhaustiveness: priorStatus when present must be a real enum value.
  void (input.priorStatus as LocalProviderEligibilityStatus);
}

export async function createLocalProviderEligibilityAuditEvent(
  tx: LocalProviderAuthorityTx,
  input: LocalProviderAuditCreateInput
): Promise<{ id: string }> {
  assertLocalProviderEligibilityAuditPriorState(input);
  return tx.createAuditEvent(input);
}
