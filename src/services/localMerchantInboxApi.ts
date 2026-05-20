import { restApiFetchJson, type ApiRequestResult } from './apiClient';
import type { LocalMerchantInboxActions } from './local/localMerchantInboxView';

export type LocalMerchantInboxRequest = Readonly<{
  id: string;
  status: string;
  businessId: string;
  serviceId: string | null;
  title: string;
  description: string;
  category: string | null;
  locationText: string | null;
  city: string | null;
  countryCode: string | null;
  walletMode: string;
  walletPhase: string;
  createdAt: string;
  updatedAt: string;
  requester: Readonly<{
    userId: string;
    displayName: string | null;
  }>;
  actions: LocalMerchantInboxActions;
}>;

export type LocalMerchantInboxResponse = Readonly<{
  requests: readonly LocalMerchantInboxRequest[];
}>;

export type LocalMerchantRequestActionResult = Readonly<{
  id: string;
  status: string;
  walletMode?: string;
  walletPhase?: string;
  idempotent?: boolean;
}>;

/** `GET /api/local/merchant/requests` */
export async function fetchMerchantLocalServiceRequests(): Promise<
  ApiRequestResult<LocalMerchantInboxResponse>
> {
  return restApiFetchJson<LocalMerchantInboxResponse>('/api/local/merchant/requests', {
    method: 'GET',
  });
}

/** `POST /api/local/merchant/requests/:id/confirm` */
export async function confirmMerchantLocalServiceRequest(
  requestId: string
): Promise<ApiRequestResult<LocalMerchantRequestActionResult>> {
  return restApiFetchJson<LocalMerchantRequestActionResult>(
    `/api/local/merchant/requests/${encodeURIComponent(requestId)}/confirm`,
    { method: 'POST', body: {} }
  );
}

/** `POST /api/local/merchant/requests/:id/reject` */
export async function rejectMerchantLocalServiceRequest(
  requestId: string
): Promise<ApiRequestResult<LocalMerchantRequestActionResult>> {
  return restApiFetchJson<LocalMerchantRequestActionResult>(
    `/api/local/merchant/requests/${encodeURIComponent(requestId)}/reject`,
    { method: 'POST', body: {} }
  );
}
