import {
  LocalServiceRequestAuditActorType,
  LocalServiceRequestAuditEventType,
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
  Prisma,
  type BizType,
  type LocalRequestSource,
  type LocalServiceType,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

import {
  assertLocalRequestAuditWritten,
  buildRequestAuditSafeMessage,
  createLocalRequestAuditEvent,
} from './localRequestAuditEventService';

export const LOCAL_REQUEST_CREATE_SUCCESS_MESSAGE =
  'Request submitted for merchant review.' as const;

export type CreateLocalServiceRequestInput = Readonly<{
  requesterUserId: string;
  businessId: string;
  serviceType: LocalServiceType;
  title: string;
  source: LocalRequestSource;
  serviceId?: string;
  fixerProfileKey?: string;
  category?: BizType;
  description?: string;
  locationText?: string;
  city?: string;
  countryCode?: string;
  scheduledStartAt?: Date;
  scheduledEndAt?: Date;
  metadata?: Prisma.InputJsonValue;
}>;

export type CreateLocalServiceRequestFailure =
  | 'invalid_input'
  | 'business_not_found'
  | 'service_not_found'
  | 'service_business_mismatch'
  | 'self_request_forbidden';

export type CreateLocalServiceRequestResult =
  | Readonly<{
      ok: true;
      request: Readonly<{
        id: string;
        requesterUserId: string;
        businessId: string;
        serviceId: string | null;
        serviceType: LocalServiceType;
        title: string;
        status: LocalServiceRequestStatus;
        walletMode: LocalWalletMode;
        walletPhase: LocalWalletPhase;
        totalVioCredits: number | null;
        heldVioCredits: number | null;
        releasedVioCredits: number | null;
        platformFeeVioCredits: number | null;
        providerEarningsVioCredits: number | null;
        message: typeof LOCAL_REQUEST_CREATE_SUCCESS_MESSAGE;
      }>;
    }>
  | Readonly<{ ok: false; reason: CreateLocalServiceRequestFailure }>;

/**
 * Request-only Local create — durable Prisma SoT row with no wallet ledger mutation.
 */
export async function createLocalServiceRequest(
  input: CreateLocalServiceRequestInput
): Promise<CreateLocalServiceRequestResult> {
  const requesterUserId = input.requesterUserId.trim();
  const businessId = input.businessId.trim();
  const title = input.title.trim();
  const serviceId = input.serviceId?.trim();

  if (requesterUserId.length === 0 || businessId.length === 0 || title.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const prisma = getPrisma();

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    return { ok: false, reason: 'business_not_found' };
  }

  if (requesterUserId === business.ownerId) {
    return { ok: false, reason: 'self_request_forbidden' };
  }

  if (serviceId && serviceId.length > 0) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return { ok: false, reason: 'service_not_found' };
    }
    if (service.businessId !== businessId) {
      return { ok: false, reason: 'service_business_mismatch' };
    }
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.localServiceRequest.create({
      data: {
        requesterUserId,
        businessId,
        serviceType: input.serviceType,
        title,
        source: input.source,
        status: LocalServiceRequestStatus.REQUESTED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        ...(serviceId && serviceId.length > 0 ? { serviceId } : {}),
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
        actorUserId: requesterUserId,
        businessId,
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
