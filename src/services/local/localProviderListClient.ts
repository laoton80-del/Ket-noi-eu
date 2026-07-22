/**
 * Pack B — authenticated GET /api/local/providers client adapter.
 * Read-only; no create authority. Server revalidates on POST.
 */
import type { LocalServiceTypeClient } from '../../domain/local/localServiceRequestClientContract';
import type { ApiRequestResult } from '../apiClient';
import {
  buildLocalProvidersQueryPath,
  LOCAL_PROVIDER_LIST_CLIENT_LIMIT,
  LOCAL_PROVIDER_LIST_CLIENT_SKIP,
  parseLocalProviderListData,
  type LocalProviderListData,
} from './localProviderListClientTypes';

export type ListLocalProvidersInput = Readonly<{
  serviceType: LocalServiceTypeClient;
  limit?: number;
  skip?: number;
}>;

export type ListLocalProvidersDeps = Readonly<{
  getJwt: () => Promise<string | null>;
  fetchJson: <T>(
    path: string,
    init?: Readonly<{ method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; }>
  ) => Promise<ApiRequestResult<T>>;
}>;

export type ListLocalProvidersFailureReason =
  | 'auth'
  | 'network'
  | 'server'
  | 'malformed';

export type ListLocalProvidersResult =
  | Readonly<{ ok: true; data: LocalProviderListData; path: string }>
  | Readonly<{ ok: false; reason: ListLocalProvidersFailureReason; path: string }>;

/**
 * Lazy production defaults — avoid static apiClient → DemoSandbox → react-native
 * import graph in Node behavioral tests that inject deps.
 */
function defaultDeps(): ListLocalProvidersDeps {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const api = require('../apiClient') as typeof import('../apiClient');
  return {
    getJwt: api.getRestApiJwt,
    fetchJson: api.restApiFetchJson,
  };
}

/**
 * Authenticated provider list for Pack B UX.
 * Requires session JWT before GET; no unauthenticated fallback; no DEV JWT.
 */
export async function listLocalProviders(
  input: ListLocalProvidersInput,
  deps?: ListLocalProvidersDeps
): Promise<ListLocalProvidersResult> {
  const resolved = deps ?? defaultDeps();
  const path = buildLocalProvidersQueryPath({
    serviceType: input.serviceType,
    limit: input.limit ?? LOCAL_PROVIDER_LIST_CLIENT_LIMIT,
    skip: input.skip ?? LOCAL_PROVIDER_LIST_CLIENT_SKIP,
  });

  const jwt = await resolved.getJwt();
  if (!jwt) {
    return { ok: false, reason: 'auth', path };
  }

  const result = await resolved.fetchJson<unknown>(path, { method: 'GET' });
  if (!result.ok) {
    if (result.status === 401) return { ok: false, reason: 'auth', path };
    if (result.unreachable === true || result.status === 0) {
      return { ok: false, reason: 'network', path };
    }
    return { ok: false, reason: 'server', path };
  }

  const parsed = parseLocalProviderListData(result.data);
  if (!parsed) {
    return { ok: false, reason: 'malformed', path };
  }

  return { ok: true, data: parsed, path };
}
