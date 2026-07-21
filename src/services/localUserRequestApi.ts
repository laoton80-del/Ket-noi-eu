import type {
  LocalUserRequestCreateBody,
  LocalUserRequestCreateResult,
} from '../domain/local/localServiceRequestClientContract';
import { restApiFetchJson, type ApiRequestResult } from './apiClient';

export type LocalUserRequestListItemDisplay = Readonly<{
  noPaymentCaptured: true;
  requestOnlyNoCharge: boolean;
}>;

export type {
  LocalUserRequestCreateBody,
  LocalUserRequestCreateResult,
} from '../domain/local/localServiceRequestClientContract';

export type LocalUserRequestListItem = Readonly<{
  id: string;
  status: string;
  serviceType: string;
  category: string | null;
  title: string;
  description: string;
  businessId: string;
  serviceId: string | null;
  locationText: string | null;
  city: string | null;
  countryCode: string | null;
  walletMode: string;
  walletPhase: string;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  statusLabel: string;
  display: LocalUserRequestListItemDisplay;
  business: Readonly<{
    id: string;
    name: string;
    category: string;
  }>;
}>;

export type LocalUserRequestListResponse = Readonly<{
  requests: readonly LocalUserRequestListItem[];
  safety: Readonly<{
    readOnly: true;
    requestOnlyNoCharge: true;
    noPaymentCaptured: true;
  }>;
}>;

export type LocalUserRequestTimelineItem = Readonly<{
  type: string;
  title: string;
  message: string;
  at: string;
  noPaymentCaptured: true;
}>;

export type LocalUserRequestTimelineResponse = Readonly<{
  requestId: string;
  status: string;
  timeline: readonly LocalUserRequestTimelineItem[];
  safety: Readonly<{
    readOnly: true;
    requestOnlyNoCharge: true;
    noPaymentCaptured: true;
  }>;
}>;

export type LocalUserRequestCancelResult = Readonly<{
  id: string;
  status: string;
  walletMode?: string;
  walletPhase?: string;
  idempotent?: boolean;
  message?: string;
}>;

/** `GET /api/local/requests` */
export async function fetchUserLocalServiceRequests(
  query?: Readonly<{ status?: string; limit?: number; skip?: number }>
): Promise<ApiRequestResult<LocalUserRequestListResponse>> {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.limit != null) params.set('limit', String(query.limit));
  if (query?.skip != null) params.set('skip', String(query.skip));
  const qs = params.toString();
  const path = qs.length > 0 ? `/api/local/requests?${qs}` : '/api/local/requests';
  return restApiFetchJson<LocalUserRequestListResponse>(path, { method: 'GET' });
}

/** `GET /api/local/requests/:id/timeline` */
export async function fetchUserLocalRequestTimeline(
  requestId: string
): Promise<ApiRequestResult<LocalUserRequestTimelineResponse>> {
  return restApiFetchJson<LocalUserRequestTimelineResponse>(
    `/api/local/requests/${encodeURIComponent(requestId)}/timeline`,
    { method: 'GET' }
  );
}

/** `POST /api/local/requests/:id/cancel` */
export async function cancelUserLocalServiceRequest(
  requestId: string
): Promise<ApiRequestResult<LocalUserRequestCancelResult>> {
  return restApiFetchJson<LocalUserRequestCancelResult>(
    `/api/local/requests/${encodeURIComponent(requestId)}/cancel`,
    { method: 'POST', body: {} }
  );
}

/**
 * `POST /api/local/requests` — request-only create (no charge).
 * Uses session JWT via restApiFetchJson; no automatic retry.
 */
export async function createUserLocalServiceRequest(
  body: LocalUserRequestCreateBody
): Promise<ApiRequestResult<LocalUserRequestCreateResult>> {
  return restApiFetchJson<LocalUserRequestCreateResult>('/api/local/requests', {
    method: 'POST',
    body,
  });
}
