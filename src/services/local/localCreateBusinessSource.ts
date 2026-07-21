/**
 * Local create provider-source loader.
 *
 * Path 2 containment: no VALID_LOCAL_PROVIDER_AUTHORITY exists in active source.
 * Does NOT call Travel/discover endpoints.
 */
import {
  sanitizeLocalCreateBusinessOptions,
  type LocalCreateBusinessOption,
  type LocalCreateProviderSourceStatus,
} from './localCreateBusinessOptionModel';

export type { LocalCreateBusinessOption, LocalCreateProviderSourceStatus };
export {
  sanitizeLocalCreateBusinessOptions,
  isLocalCreateBusinessSelected,
  findLocalCreateBusinessOption,
} from './localCreateBusinessOptionModel';

export type LocalCreateBusinessSourceResult = Readonly<{
  status: LocalCreateProviderSourceStatus;
  options: readonly LocalCreateBusinessOption[];
}>;

export type LocalCreateBusinessSourceLoader = () => Promise<LocalCreateBusinessSourceResult>;

/**
 * Default loader — honest containment until a Local eligibility authority exists.
 * Synchronous authority absence (no network); never imports Travel discover APIs.
 */
export async function loadLocalCreateBusinessOptions(): Promise<LocalCreateBusinessSourceResult> {
  return {
    status: 'PROVIDER_SELECTION_UNAVAILABLE',
    options: sanitizeLocalCreateBusinessOptions([]),
  };
}

/** True only when an eligible selectable list is ready. */
export function localCreateProviderSelectionEnabled(
  status: LocalCreateProviderSourceStatus,
  options: readonly LocalCreateBusinessOption[]
): boolean {
  return status === 'PROVIDERS_READY' && options.length > 0;
}
