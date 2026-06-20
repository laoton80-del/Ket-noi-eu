import type { Prisma } from '@prisma/client';

import {
  getRequestStatusSafetyLabel,
  getRequestUniverseSafetyNote,
} from '../../domain/requests/vionaRequestSafetyCopy';
import type {
  VionaRequestStatus,
  VionaRequestUniverse,
} from '../../domain/requests/vionaRequestTypes';
import { vionaRequestStatuses, vionaRequestUniverses } from '../../domain/requests/vionaRequestTypes';
import type {
  VionaRequestAttachmentReferenceDto,
  VionaRequestAuditEventDto,
  VionaRequestDetailDto,
  VionaRequestListItemDto,
  VionaRequestParticipantDto,
  VionaRequestReadDisplayDto,
  VionaRequestSourceLinkDto,
  VionaRequestStatusEventDto,
} from './vionaRequestReadDto';
import { VIONA_REQUEST_READ_SAFETY } from './vionaRequestReadDto';

type VionaRequestCoreRow = Readonly<{
  id: string;
  tenantId: string;
  requesterUserId: string | null;
  ownerUserId: string | null;
  sourceUniverse: string;
  sourceFeature: string | null;
  requestType: string;
  status: string;
  title: string;
  summary: string;
  locale: string | null;
  countryCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}>;

function toIso(d: Date): string {
  return d.toISOString();
}

function isVionaRequestStatus(value: string): value is VionaRequestStatus {
  return (vionaRequestStatuses as readonly string[]).includes(value);
}

function isVionaRequestUniverse(value: string): value is VionaRequestUniverse {
  return (vionaRequestUniverses as readonly string[]).includes(value);
}

function mapDisplay(sourceUniverse: string, status: string): VionaRequestReadDisplayDto {
  const statusLabel = isVionaRequestStatus(status)
    ? getRequestStatusSafetyLabel(status)
    : 'Request updated — read-only preview';

  const universeNote = isVionaRequestUniverse(sourceUniverse)
    ? getRequestUniverseSafetyNote(sourceUniverse)
    : 'Read-only preview — not production-ready.';

  return {
    statusLabel,
    notProductionCopy: `Read-only preview · ${statusLabel} · ${universeNote}`,
  };
}

export function mapVionaRequestListItem(row: VionaRequestCoreRow): VionaRequestListItemDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    requesterUserId: row.requesterUserId,
    ownerUserId: row.ownerUserId,
    sourceUniverse: row.sourceUniverse,
    sourceFeature: row.sourceFeature,
    requestType: row.requestType,
    status: row.status,
    title: row.title,
    summary: row.summary,
    locale: row.locale,
    countryCode: row.countryCode,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    closedAt: row.closedAt != null ? toIso(row.closedAt) : null,
    display: mapDisplay(row.sourceUniverse, row.status),
  };
}

export const VIONA_REQUEST_LIST_SELECT = {
  id: true,
  tenantId: true,
  requesterUserId: true,
  ownerUserId: true,
  sourceUniverse: true,
  sourceFeature: true,
  requestType: true,
  status: true,
  title: true,
  summary: true,
  locale: true,
  countryCode: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
} as const satisfies Prisma.VionaRequestSelect;

export const VIONA_REQUEST_DETAIL_SELECT = {
  ...VIONA_REQUEST_LIST_SELECT,
  participants: {
    select: {
      id: true,
      userRef: true,
      participantRoleLabel: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  sourceLinks: {
    select: {
      id: true,
      sourceSystem: true,
      sourceEntityType: true,
      sourceEntityId: true,
      linkStatus: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  statusEvents: {
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      changedByUserId: true,
      reason: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  auditEvents: {
    select: {
      id: true,
      eventType: true,
      actorUserId: true,
      actorRoleLabel: true,
      message: true,
      payloadJson: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  attachmentReferences: {
    select: {
      id: true,
      externalRef: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const satisfies Prisma.VionaRequestSelect;

type VionaRequestDetailRow = Prisma.VionaRequestGetPayload<{
  select: typeof VIONA_REQUEST_DETAIL_SELECT;
}>;

export function mapVionaRequestDetail(row: VionaRequestDetailRow): VionaRequestDetailDto {
  const request = mapVionaRequestListItem(row);

  const participants: VionaRequestParticipantDto[] = row.participants.map((p) => ({
    id: p.id,
    userRef: p.userRef,
    participantRoleLabel: p.participantRoleLabel,
    displayName: p.displayName,
    createdAt: toIso(p.createdAt),
    updatedAt: toIso(p.updatedAt),
  }));

  const sourceLinks: VionaRequestSourceLinkDto[] = row.sourceLinks.map((link) => ({
    id: link.id,
    sourceSystem: link.sourceSystem,
    sourceEntityType: link.sourceEntityType,
    sourceEntityId: link.sourceEntityId,
    linkStatus: link.linkStatus,
    createdAt: toIso(link.createdAt),
    updatedAt: toIso(link.updatedAt),
  }));

  const statusEvents: VionaRequestStatusEventDto[] = row.statusEvents.map((event) => ({
    id: event.id,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    changedByUserId: event.changedByUserId,
    reason: event.reason,
    createdAt: toIso(event.createdAt),
  }));

  const auditEvents: VionaRequestAuditEventDto[] = row.auditEvents.map((event) => ({
    id: event.id,
    eventType: event.eventType,
    actorUserId: event.actorUserId,
    actorRoleLabel: event.actorRoleLabel,
    message: event.message,
    payloadJson: event.payloadJson ?? null,
    createdAt: toIso(event.createdAt),
  }));

  const attachmentReferences: VionaRequestAttachmentReferenceDto[] =
    row.attachmentReferences.map((ref) => ({
      id: ref.id,
      externalRef: ref.externalRef,
      filename: ref.filename,
      mimeType: ref.mimeType,
      sizeBytes: ref.sizeBytes,
      createdAt: toIso(ref.createdAt),
    }));

  return {
    request,
    participants,
    sourceLinks,
    statusEvents,
    auditEvents,
    attachmentReferences,
    safety: VIONA_REQUEST_READ_SAFETY,
  };
}
