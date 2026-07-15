export const VIONA_REQUEST_READ_SAFETY = {
  readOnly: true,
  noPaymentCaptured: true,
  noBookingConfirmed: true,
  noSosDispatch: true,
  notProductionReady: true,
} as const;

export type VionaRequestReadDisplayDto = Readonly<{
  statusLabel: string;
  notProductionCopy: string;
}>;

export type VionaRequestListItemDto = Readonly<{
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
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  display: VionaRequestReadDisplayDto;
}>;

export type VionaRequestParticipantDto = Readonly<{
  id: string;
  userRef: string | null;
  participantRoleLabel: string | null;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type VionaRequestSourceLinkDto = Readonly<{
  id: string;
  sourceSystem: string;
  sourceEntityType: string;
  sourceEntityId: string;
  linkStatus: string;
  createdAt: string;
  updatedAt: string;
}>;

export type VionaRequestStatusEventDto = Readonly<{
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedByUserId: string | null;
  reason: string | null;
  createdAt: string;
}>;

export type VionaRequestAuditEventDto = Readonly<{
  id: string;
  eventType: string;
  actorUserId: string | null;
  actorRoleLabel: string | null;
  message: string | null;
  payloadJson: unknown;
  createdAt: string;
}>;

export type VionaRequestAttachmentReferenceDto = Readonly<{
  id: string;
  externalRef: string | null;
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}>;

export type VionaRequestDetailDto = Readonly<{
  request: VionaRequestListItemDto;
  participants: readonly VionaRequestParticipantDto[];
  sourceLinks: readonly VionaRequestSourceLinkDto[];
  statusEvents: readonly VionaRequestStatusEventDto[];
  auditEvents: readonly VionaRequestAuditEventDto[];
  attachmentReferences: readonly VionaRequestAttachmentReferenceDto[];
  safety: typeof VIONA_REQUEST_READ_SAFETY;
}>;

export type VionaRequestDirectReadPolicy = 'pack40a_provenance';

export type ListVionaRequestsInput = Readonly<{
  authUserId: string;
  status?: string;
  universe?: string;
  createdFrom?: Date;
  createdTo?: Date;
  limit?: number;
  skip?: number;
  directReadPolicy?: VionaRequestDirectReadPolicy;
}>;

export type ListVionaRequestsResult = Readonly<{
  requests: readonly VionaRequestListItemDto[];
  pagination: Readonly<{ limit: number; skip: number; returned: number }>;
  safety: typeof VIONA_REQUEST_READ_SAFETY;
}>;

export type GetVionaRequestByIdInput = Readonly<{
  authUserId: string;
  requestId: string;
  directReadPolicy?: VionaRequestDirectReadPolicy;
}>;

export type GetVionaRequestByIdFailure = 'invalid_input' | 'request_not_found';

export type GetVionaRequestByIdResult =
  | Readonly<{ ok: true; data: VionaRequestDetailDto }>
  | Readonly<{ ok: false; reason: GetVionaRequestByIdFailure }>;
