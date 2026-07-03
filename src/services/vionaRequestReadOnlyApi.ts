/**
 * Pack17 read-only inbox client — GET endpoints only.
 * Uses existing REST auth/session bridge (`restApiFetchJson` + stored JWT).
 */
import {
  fetchVionaRequestById,
  fetchVionaRequests,
  VIONA_REQUEST_READ_SAFETY,
  type VionaRequestDetail,
  type VionaRequestListItem,
  type VionaRequestListResponse,
} from './vionaRequestApi';
import type { ApiRequestResult } from './apiClient';

export {
  VIONA_REQUEST_READ_SAFETY,
  type VionaRequestDetail,
  type VionaRequestListItem,
  type VionaRequestListResponse,
};

export type VionaRequestReadListQuery = Readonly<{
  status?: string;
  universe?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  skip?: number;
}>;

/** `GET /api/viona/requests` — Pack17 read-only list. */
export async function fetchVionaRequestsReadOnly(
  query?: VionaRequestReadListQuery
): Promise<ApiRequestResult<VionaRequestListResponse>> {
  return fetchVionaRequests(query);
}

/** `GET /api/viona/requests/:id` — Pack17 read-only detail. */
export async function fetchVionaRequestByIdReadOnly(
  requestId: string
): Promise<ApiRequestResult<VionaRequestDetail>> {
  return fetchVionaRequestById(requestId);
}
