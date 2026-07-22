/**
 * Pack B — Local create provider-source loader (GET /api/local/providers).
 *
 * Client convenience only — server revalidates on POST /api/local/requests.
 * No Tourism / BizType / history / raw UUID / fixture fallback.
 */
import type { LocalServiceTypeClient } from '../../domain/local/localServiceRequestClientContract';
import {
  mapProviderOptionsToCreateOptions,
  sanitizeLocalCreateBusinessOptions,
  type LocalCreateBusinessOption,
  type LocalCreateProviderSourceStatus,
} from './localCreateBusinessOptionModel';
import {
  listLocalProviders,
  type ListLocalProvidersDeps,
  type ListLocalProvidersResult,
} from './localProviderListClient';

export type { LocalCreateBusinessOption, LocalCreateProviderSourceStatus };
export {
  sanitizeLocalCreateBusinessOptions,
  isLocalCreateBusinessSelected,
  findLocalCreateBusinessOption,
  isLocalProviderSelectionCompatible,
  mapProviderOptionsToCreateOptions,
} from './localCreateBusinessOptionModel';

export type LocalCreateBusinessSourceResult = Readonly<{
  status: LocalCreateProviderSourceStatus;
  options: readonly LocalCreateBusinessOption[];
}>;

export type LocalCreateBusinessSourceLoader = (input: {
  serviceType: LocalServiceTypeClient;
}) => Promise<LocalCreateBusinessSourceResult>;

export type LocalCreateBusinessSourceDeps = Readonly<{
  listProviders: (
    input: { serviceType: LocalServiceTypeClient },
    deps?: ListLocalProvidersDeps
  ) => Promise<ListLocalProvidersResult>;
  listDeps?: ListLocalProvidersDeps;
}>;

function mapListFailure(
  reason: 'auth' | 'network' | 'server' | 'malformed'
): LocalCreateProviderSourceStatus {
  switch (reason) {
    case 'auth':
      return 'PROVIDER_AUTH_REQUIRED_OR_EXPIRED';
    case 'network':
      return 'PROVIDER_NETWORK_ERROR';
    case 'server':
    case 'malformed':
      return 'PROVIDER_SERVER_ERROR';
  }
}

/**
 * Default Pack B loader — authenticated GET filtered by serviceType.
 */
export async function loadLocalCreateBusinessOptions(
  input: { serviceType: LocalServiceTypeClient },
  deps?: LocalCreateBusinessSourceDeps
): Promise<LocalCreateBusinessSourceResult> {
  const listProviders = deps?.listProviders ?? listLocalProviders;
  const result = await listProviders(
    { serviceType: input.serviceType },
    deps?.listDeps
  );

  if (!result.ok) {
    return {
      status: mapListFailure(result.reason),
      options: sanitizeLocalCreateBusinessOptions([]),
    };
  }

  const options = mapProviderOptionsToCreateOptions(result.data.items);
  if (options.length === 0) {
    return { status: 'PROVIDER_EMPTY', options: [] };
  }
  return { status: 'PROVIDER_READY', options };
}

/** True only when an eligible selectable list is ready. */
export function localCreateProviderSelectionEnabled(
  status: LocalCreateProviderSourceStatus,
  options: readonly LocalCreateBusinessOption[]
): boolean {
  return status === 'PROVIDER_READY' && options.length > 0;
}

/**
 * Pure stale-response gate: apply only when generation + serviceType still match.
 */
export function shouldApplyProviderListResult(input: {
  responseGeneration: number;
  activeGeneration: number;
  responseServiceType: LocalServiceTypeClient;
  activeServiceType: LocalServiceTypeClient | null;
}): boolean {
  if (input.activeServiceType == null) return false;
  if (input.responseGeneration !== input.activeGeneration) return false;
  return input.responseServiceType === input.activeServiceType;
}
