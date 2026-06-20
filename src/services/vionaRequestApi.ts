import { restApiFetchJson, type ApiRequestResult } from './apiClient';

export const VIONA_REQUEST_READ_SAFETY = {
  readOnly: true,
  noPaymentCaptured: true,
  noBookingConfirmed: true,
  noSosDispatch: true,
  notProductionReady: true,
} as const;

export type VionaRequestReadDisplay = Readonly<{
  statusLabel: string;
  notProductionCopy: string;
}>;

export type VionaRequestListItem = Readonly<{
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
  display: VionaRequestReadDisplay;
}>;

export type VionaRequestParticipant = Readonly<{
  id: string;
  userRef: string | null;
  participantRoleLabel: string | null;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type VionaRequestSourceLink = Readonly<{
  id: string;
  sourceSystem: string;
  sourceEntityType: string;
  sourceEntityId: string;
  linkStatus: string;
  createdAt: string;
  updatedAt: string;
}>;

export type VionaRequestStatusEvent = Readonly<{
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedByUserId: string | null;
  reason: string | null;
  createdAt: string;
}>;

export type VionaRequestAuditEvent = Readonly<{
  id: string;
  eventType: string;
  actorUserId: string | null;
  actorRoleLabel: string | null;
  message: string | null;
  payloadJson: unknown;
  createdAt: string;
}>;

export type VionaRequestAttachmentReference = Readonly<{
  id: string;
  externalRef: string | null;
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}>;

export type VionaRequestDetail = Readonly<{
  request: VionaRequestListItem;
  participants: readonly VionaRequestParticipant[];
  sourceLinks: readonly VionaRequestSourceLink[];
  statusEvents: readonly VionaRequestStatusEvent[];
  auditEvents: readonly VionaRequestAuditEvent[];
  attachmentReferences: readonly VionaRequestAttachmentReference[];
  safety: typeof VIONA_REQUEST_READ_SAFETY;
}>;

export type VionaRequestListResponse = Readonly<{
  requests: readonly VionaRequestListItem[];
  pagination: Readonly<{ limit: number; skip: number; returned: number }>;
  safety: typeof VIONA_REQUEST_READ_SAFETY;
}>;

/** `GET /api/viona/requests` — read-only list (Pack16). */
export async function fetchVionaRequests(
  query?: Readonly<{
    status?: string;
    universe?: string;
    createdFrom?: string;
    createdTo?: string;
    limit?: number;
    skip?: number;
  }>
): Promise<ApiRequestResult<VionaRequestListResponse>> {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.universe) params.set('universe', query.universe);
  if (query?.createdFrom) params.set('createdFrom', query.createdFrom);
  if (query?.createdTo) params.set('createdTo', query.createdTo);
  if (query?.limit != null) params.set('limit', String(query.limit));
  if (query?.skip != null) params.set('skip', String(query.skip));
  const qs = params.toString();
  const path = qs.length > 0 ? `/api/viona/requests?${qs}` : '/api/viona/requests';
  return restApiFetchJson<VionaRequestListResponse>(path, { method: 'GET' });
}

/** `GET /api/viona/requests/:id` — read-only detail (Pack16). */
export async function fetchVionaRequestById(
  requestId: string
): Promise<ApiRequestResult<VionaRequestDetail>> {
  return restApiFetchJson<VionaRequestDetail>(
    `/api/viona/requests/${encodeURIComponent(requestId)}`,
    { method: 'GET' }
  );
}
