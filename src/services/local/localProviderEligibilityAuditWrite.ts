/**
 * Pack A2 — append-only LocalProviderEligibilityAuditEvent create helper.
 * Must only be called inside a Prisma transaction alongside eligibility mutation.
 */
import {
  LocalProviderEligibilityAuditActorType,
  LocalProviderEligibilityAuditEventType,
  LocalProviderEligibilityStatus,
  type LocalServiceType,
  type Prisma,
} from '@prisma/client';

export type CreateLocalProviderEligibilityAuditEventInput = Readonly<{
  db: Prisma.TransactionClient;
  eligibilityId: string;
  businessId: string;
  actorUserId: string;
  eventType: LocalProviderEligibilityAuditEventType;
  priorStatus: LocalProviderEligibilityStatus | null;
  nextStatus: LocalProviderEligibilityStatus;
  priorPublicB2cVisible: boolean | null;
  nextPublicB2cVisible: boolean;
  priorSupportedServiceTypes: readonly LocalServiceType[];
  nextSupportedServiceTypes: readonly LocalServiceType[];
  reason?: string | null;
}>;

export async function createLocalProviderEligibilityAuditEvent(
  input: CreateLocalProviderEligibilityAuditEventInput
): Promise<{ id: string }> {
  if (input.eventType === LocalProviderEligibilityAuditEventType.REGISTERED) {
    if (input.priorStatus != null || input.priorPublicB2cVisible != null) {
      throw new Error('REGISTERED audit requires null prior status and visibility');
    }
  } else if (input.priorStatus == null || input.priorPublicB2cVisible == null) {
    throw new Error('Non-REGISTERED audit requires non-null prior status and visibility');
  }

  const row = await input.db.localProviderEligibilityAuditEvent.create({
    data: {
      eligibilityId: input.eligibilityId,
      businessId: input.businessId,
      actorUserId: input.actorUserId,
      actorType: LocalProviderEligibilityAuditActorType.ROLE_ADMIN,
      eventType: input.eventType,
      priorStatus: input.priorStatus,
      nextStatus: input.nextStatus,
      priorPublicB2cVisible: input.priorPublicB2cVisible,
      nextPublicB2cVisible: input.nextPublicB2cVisible,
      priorSupportedServiceTypes: [...input.priorSupportedServiceTypes],
      nextSupportedServiceTypes: [...input.nextSupportedServiceTypes],
      ...(input.reason != null && input.reason.length > 0 ? { reason: input.reason } : {}),
    },
    select: { id: true },
  });

  return row;
}
