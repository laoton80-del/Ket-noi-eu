import { restApiFetchJson, type ApiRequestResult } from './apiClient';

export type LocalOpsRequestDisplay = Readonly<{
  noPaymentCaptured: true;
  requestOnlyNoCharge: boolean;
}>;

export type LocalOpsActorLabel = Readonly<{
  userId: string;
  role: string;
  roleLabel: string;
}>;

export type LocalOpsMerchantDecision = 'pending_review' | 'confirmed' | 'declined' | 'none';

export type LocalOpsRequestListItem = Readonly<{
  id: string;
  status: string;
  statusLabel: string;
  serviceType: string;
  title: string;
  walletMode: string;
  walletPhase: string;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  rejectedAt: string | null;
  merchantDecision: LocalOpsMerchantDecision;
  display: LocalOpsRequestDisplay;
  requester: LocalOpsActorLabel;
  business: Readonly<{
    id: string;
    name: string;
    category: string;
    owner: LocalOpsActorLabel;
  }>;
  tenantIsolation: Readonly<{
    requesterUserId: string;
    businessOwnerUserId: string;
    requesterIsBusinessOwner: boolean;
  }>;
}>;

export type LocalOpsRequestListResponse = Readonly<{
  requests: readonly LocalOpsRequestListItem[];
  pagination: Readonly<{ limit: number; skip: number; returned: number }>;
  safety: Readonly<{
    readOnly: true;
    requestOnlyNoCharge: true;
    noPaymentCaptured: true;
    confirmedDoesNotMeanPaid: true;
  }>;
}>;

const OPS_LIST_PATH = '/api/local/ops/requests';

/** `GET /api/local/ops/requests` — super-admin read-only (no mutations). */
export async function fetchOpsLocalServiceRequests(
  query?: Readonly<{ status?: string; businessId?: string; limit?: number; skip?: number }>
): Promise<ApiRequestResult<LocalOpsRequestListResponse>> {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.businessId) params.set('businessId', query.businessId);
  if (query?.limit != null) params.set('limit', String(query.limit));
  if (query?.skip != null) params.set('skip', String(query.skip));
  const qs = params.toString();
  const path = qs.length > 0 ? `${OPS_LIST_PATH}?${qs}` : OPS_LIST_PATH;
  return restApiFetchJson<LocalOpsRequestListResponse>(path, { method: 'GET' });
}

/** `GET /api/local/ops/requests/:id` — super-admin read-only detail. */
export async function fetchOpsLocalServiceRequestById(
  requestId: string
): Promise<ApiRequestResult<LocalOpsRequestListItem>> {
  return restApiFetchJson<LocalOpsRequestListItem>(
    `${OPS_LIST_PATH}/${encodeURIComponent(requestId)}`,
    { method: 'GET' }
  );
}
