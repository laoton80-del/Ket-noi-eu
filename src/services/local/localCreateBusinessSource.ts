/**
 * Source-backed Local create business options for first-time B2C users.
 * Reuses existing public GET /api/tourism/discover (Postgres Business.id + name).
 */
import type { ApiRequestResult } from '../apiClient';
import { fetchTourismDiscover } from '../viGlobalTourismApi';
import {
  mapTourismDiscoverToLocalCreateOptions,
  type LocalCreateBusinessOption,
} from './localCreateBusinessOptionModel';

export type { LocalCreateBusinessOption };
export {
  mapTourismDiscoverToLocalCreateOptions,
  mergeHistoryBusinessHints,
  isLocalCreateBusinessSelected,
  findLocalCreateBusinessOption,
} from './localCreateBusinessOptionModel';

export type LocalCreateBusinessSourceLoader = () => Promise<
  ApiRequestResult<readonly LocalCreateBusinessOption[]>
>;

/** Default loader — existing tourism discover adapter (no new backend). */
export async function loadLocalCreateBusinessOptionsFromTourismDiscover(): Promise<
  ApiRequestResult<readonly LocalCreateBusinessOption[]>
> {
  const result = await fetchTourismDiscover();
  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      error: result.error,
      unreachable: result.unreachable,
    };
  }
  return {
    ok: true,
    status: result.status,
    data: mapTourismDiscoverToLocalCreateOptions(result.data),
  };
}
