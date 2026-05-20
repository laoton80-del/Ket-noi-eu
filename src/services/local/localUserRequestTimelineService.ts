import {
  LocalServiceRequestAuditEventType,
  LocalServiceRequestStatus,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

export const LOCAL_USER_REQUEST_TIMELINE_SAFETY = {
  readOnly: true,
  requestOnlyNoCharge: true,
  noPaymentCaptured: true,
} as const;

/** Internal / ops-only audit types omitted from requester-facing timeline. */
const OMITTED_PUBLIC_TIMELINE_EVENT_TYPES = new Set<LocalServiceRequestAuditEventType>([
  LocalServiceRequestAuditEventType.MERCHANT_REVIEW_STARTED,
  LocalServiceRequestAuditEventType.EXPIRY_DRY_RUN_IDENTIFIED,
  LocalServiceRequestAuditEventType.EXPIRY_APPLY_ATTEMPTED,
  LocalServiceRequestAuditEventType.EXPIRY_APPLY_SKIPPED_RACE_CONDITION,
  LocalServiceRequestAuditEventType.EXPIRY_APPLY_COMPLETED,
]);

export type LocalUserRequestTimelineItemDto = Readonly<{
  type: string;
  title: string;
  message: string;
  at: string;
  noPaymentCaptured: true;
}>;

export type LocalUserRequestTimelineResponse = Readonly<{
  requestId: string;
  status: string;
  timeline: readonly LocalUserRequestTimelineItemDto[];
  safety: typeof LOCAL_USER_REQUEST_TIMELINE_SAFETY;
}>;

export type ReadLocalUserRequestTimelineInput = Readonly<{
  requesterUserId: string;
  requestId: string;
}>;

export type ReadLocalUserRequestTimelineFailure = 'invalid_input' | 'request_not_found';

export type ReadLocalUserRequestTimelineResult =
  | Readonly<{ ok: true; data: LocalUserRequestTimelineResponse }>
  | Readonly<{ ok: false; reason: ReadLocalUserRequestTimelineFailure }>;

function toIso(d: Date): string {
  return d.toISOString();
}

function mapPublicTimelineCopy(
  eventType: LocalServiceRequestAuditEventType
): { title: string; message: string } | null {
  switch (eventType) {
    case LocalServiceRequestAuditEventType.REQUEST_CREATED:
      return {
        title: 'Request submitted',
        message: 'Your request was submitted for merchant review.',
      };
    case LocalServiceRequestAuditEventType.MERCHANT_CONFIRMED:
      return {
        title: 'Merchant confirmed',
        message: 'Merchant confirmed your request. No payment has been captured.',
      };
    case LocalServiceRequestAuditEventType.MERCHANT_REJECTED:
      return {
        title: 'Merchant rejected',
        message: 'Merchant rejected your request. No payment was captured.',
      };
    case LocalServiceRequestAuditEventType.USER_CANCELLED:
      return {
        title: 'Request cancelled',
        message: 'Request cancelled. No payment was captured.',
      };
    case LocalServiceRequestAuditEventType.OPS_CANCELLED:
      return {
        title: 'Request cancelled',
        message: 'Request cancelled by support. No payment was captured.',
      };
    case LocalServiceRequestAuditEventType.REQUEST_EXPIRED:
      return {
        title: 'Request expired',
        message: 'Request expired because the merchant did not respond in time.',
      };
    default:
      if (OMITTED_PUBLIC_TIMELINE_EVENT_TYPES.has(eventType)) {
        return null;
      }
      return {
        title: 'Request updated',
        message: 'Your request status was updated.',
      };
  }
}

function mapAuditRowToTimelineItem(row: {
  eventType: LocalServiceRequestAuditEventType;
  createdAt: Date;
}): LocalUserRequestTimelineItemDto | null {
  const copy = mapPublicTimelineCopy(row.eventType);
  if (copy == null) {
    return null;
  }

  return {
    type: row.eventType,
    title: copy.title,
    message: copy.message,
    at: toIso(row.createdAt),
    noPaymentCaptured: true,
  };
}

/**
 * Requester read-only safe public timeline for one LocalServiceRequest (no mutations).
 */
export async function readLocalUserRequestTimeline(
  input: ReadLocalUserRequestTimelineInput
): Promise<ReadLocalUserRequestTimelineResult> {
  const requesterUserId = input.requesterUserId.trim();
  const requestId = input.requestId.trim();

  if (requesterUserId.length === 0 || requestId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const prisma = getPrisma();

  const request = await prisma.localServiceRequest.findUnique({
    where: { id: requestId },
    select: { id: true, requesterUserId: true, status: true },
  });

  if (!request || request.requesterUserId !== requesterUserId) {
    return { ok: false, reason: 'request_not_found' };
  }

  const rows = await prisma.localServiceRequestAuditEvent.findMany({
    where: { requestId },
    orderBy: { createdAt: 'asc' },
    select: {
      eventType: true,
      createdAt: true,
    },
  });

  const timeline: LocalUserRequestTimelineItemDto[] = [];
  for (const row of rows) {
    const item = mapAuditRowToTimelineItem(row);
    if (item != null) {
      timeline.push(item);
    }
  }

  return {
    ok: true,
    data: {
      requestId,
      status: request.status as LocalServiceRequestStatus,
      timeline,
      safety: LOCAL_USER_REQUEST_TIMELINE_SAFETY,
    },
  };
}
