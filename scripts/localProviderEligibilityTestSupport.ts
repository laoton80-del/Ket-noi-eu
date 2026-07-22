/**
 * Pack A1 test support for Local provider eligibility under NO_MIGRATION_APPLY.
 * Detects whether LocalProviderEligibility exists without applying migrations.
 */
import { randomUUID } from 'node:crypto';

import {
  LocalProviderEligibilityStatus,
  LocalServiceRequestAuditActorType,
  LocalServiceRequestAuditEventType,
  LocalServiceRequestStatus,
  LocalServiceType,
  LocalWalletMode,
  LocalWalletPhase,
  type PrismaClient,
} from '@prisma/client';

import {
  assertLocalRequestAuditWritten,
  buildRequestAuditSafeMessage,
  createLocalRequestAuditEvent,
} from '../src/services/local/localRequestAuditEventService';
import {
  createLocalServiceRequest,
  LOCAL_REQUEST_CREATE_SUCCESS_MESSAGE,
  type CreateLocalServiceRequestInput,
  type CreateLocalServiceRequestResult,
} from '../src/services/local/localRequestCreateService';

export async function localProviderEligibilityTableExists(
  prisma: PrismaClient
): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1 FROM "LocalProviderEligibility" LIMIT 0`;
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes('LocalProviderEligibility') &&
      (message.includes('does not exist') || message.includes('P2021') || message.includes('42P01'))
    ) {
      return false;
    }
    throw err;
  }
}

/** Ensures an ACTIVE public selectable eligibility row when the table is applied. */
export async function ensureSelectableLocalProviderEligibility(
  prisma: PrismaClient,
  businessId: string,
  serviceTypes: LocalServiceType[] = [LocalServiceType.GENERIC_REQUEST]
): Promise<'applied' | 'unapplied'> {
  if (!(await localProviderEligibilityTableExists(prisma))) {
    return 'unapplied';
  }

  await prisma.localProviderEligibility.upsert({
    where: { businessId },
    create: {
      id: randomUUID(),
      businessId,
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: serviceTypes,
      activatedAt: new Date(),
    },
    update: {
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: serviceTypes,
      activatedAt: new Date(),
      suspendedAt: null,
      retiredAt: null,
    },
  });

  return 'applied';
}

/**
 * Creates a Local request for regression fixtures.
 * When eligibility table is applied: seeds ACTIVE eligibility then uses createLocalServiceRequest.
 * When unapplied (NO_MIGRATION_APPLY): inserts request + request audit directly (no remote migrate).
 */
export async function createLocalServiceRequestForRegression(
  prisma: PrismaClient,
  input: CreateLocalServiceRequestInput
): Promise<CreateLocalServiceRequestResult> {
  const mode = await ensureSelectableLocalProviderEligibility(prisma, input.businessId, [
    input.serviceType,
  ]);

  if (mode === 'applied') {
    return createLocalServiceRequest(input);
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, reason: 'invalid_input' };
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.localServiceRequest.create({
      data: {
        requesterUserId: input.requesterUserId,
        businessId: input.businessId,
        serviceType: input.serviceType,
        title,
        source: input.source,
        status: LocalServiceRequestStatus.REQUESTED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        ...(input.serviceId?.trim() ? { serviceId: input.serviceId.trim() } : {}),
        ...(input.fixerProfileKey?.trim()
          ? { fixerProfileKey: input.fixerProfileKey.trim() }
          : {}),
        ...(input.category != null ? { category: input.category } : {}),
        description: input.description?.trim() ?? '',
        ...(input.locationText?.trim() ? { locationText: input.locationText.trim() } : {}),
        ...(input.city?.trim() ? { city: input.city.trim() } : {}),
        ...(input.countryCode?.trim() ? { countryCode: input.countryCode.trim() } : {}),
        ...(input.scheduledStartAt != null ? { scheduledStartAt: input.scheduledStartAt } : {}),
        ...(input.scheduledEndAt != null ? { scheduledEndAt: input.scheduledEndAt } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      },
    });

    assertLocalRequestAuditWritten(
      await createLocalRequestAuditEvent({
        db: tx,
        requestId: created.id,
        eventType: LocalServiceRequestAuditEventType.REQUEST_CREATED,
        actorType: LocalServiceRequestAuditActorType.REQUESTER,
        actorUserId: input.requesterUserId,
        businessId: input.businessId,
        fromStatus: null,
        toStatus: LocalServiceRequestStatus.REQUESTED,
        safeMessage: buildRequestAuditSafeMessage(
          LocalServiceRequestAuditEventType.REQUEST_CREATED
        ),
      })
    );

    return created;
  });

  return {
    ok: true,
    request: {
      id: row.id,
      requesterUserId: row.requesterUserId,
      businessId: row.businessId,
      serviceId: row.serviceId,
      serviceType: row.serviceType,
      title: row.title,
      status: row.status,
      walletMode: row.walletMode,
      walletPhase: row.walletPhase,
      totalVioCredits: row.totalVioCredits,
      heldVioCredits: row.heldVioCredits,
      releasedVioCredits: row.releasedVioCredits,
      platformFeeVioCredits: row.platformFeeVioCredits,
      providerEarningsVioCredits: row.providerEarningsVioCredits,
      message: LOCAL_REQUEST_CREATE_SUCCESS_MESSAGE,
    },
  };
}

export async function deleteLocalProviderEligibilityIfPresent(
  prisma: PrismaClient,
  businessId: string
): Promise<void> {
  if (!(await localProviderEligibilityTableExists(prisma))) return;
  await prisma.localProviderEligibility.deleteMany({ where: { businessId } });
}
