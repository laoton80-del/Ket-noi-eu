/**
 * FC-P0 Local create — public wire failure codes (language-neutral, allowlisted).
 * Used by POST /api/local/requests failure envelope and client recovery classification.
 * Never display these strings directly in UI.
 */

export const LOCAL_CREATE_FAILURE_CODE = {
  PROVIDER_NOT_AVAILABLE: 'provider_not_available',
  SERVICE_TYPE_NOT_SUPPORTED: 'service_type_not_supported',
  INVALID_INPUT: 'invalid_input',
  SELF_REQUEST_FORBIDDEN: 'self_request_forbidden',
  SERVICE_BUSINESS_MISMATCH: 'service_business_mismatch',
  SERVICE_NOT_FOUND: 'service_not_found',
} as const;

export type LocalCreateFailureCode =
  (typeof LOCAL_CREATE_FAILURE_CODE)[keyof typeof LOCAL_CREATE_FAILURE_CODE];

const LOCAL_CREATE_FAILURE_CODE_SET: ReadonlySet<string> = new Set(
  Object.values(LOCAL_CREATE_FAILURE_CODE)
);

export function isLocalCreateFailureCode(value: unknown): value is LocalCreateFailureCode {
  return typeof value === 'string' && LOCAL_CREATE_FAILURE_CODE_SET.has(value);
}

/** Domain create failure reasons (server-internal). */
export type LocalCreateDomainFailureReason =
  | 'invalid_input'
  | 'business_not_found'
  | 'service_not_found'
  | 'service_business_mismatch'
  | 'self_request_forbidden'
  | 'provider_not_available'
  | 'service_type_not_supported';

export type LocalCreatePublicFailure = Readonly<{
  status: number;
  code: LocalCreateFailureCode;
  error: string;
}>;

/**
 * Privacy-preserving map: domain reason → public status/code/error.
 * business_not_found collapses to provider_not_available (no existence leak).
 * service_not_found remains distinct and is NOT a provider-authority refresh trigger.
 */
export function mapLocalCreateDomainFailureToPublic(
  reason: LocalCreateDomainFailureReason
): LocalCreatePublicFailure {
  switch (reason) {
    case 'provider_not_available':
    case 'business_not_found':
      return {
        status: 404,
        code: LOCAL_CREATE_FAILURE_CODE.PROVIDER_NOT_AVAILABLE,
        error: 'Provider not available',
      };
    case 'service_type_not_supported':
      return {
        status: 400,
        code: LOCAL_CREATE_FAILURE_CODE.SERVICE_TYPE_NOT_SUPPORTED,
        error: 'Unsupported service type for this provider',
      };
    case 'invalid_input':
      return {
        status: 400,
        code: LOCAL_CREATE_FAILURE_CODE.INVALID_INPUT,
        error: 'Invalid local request',
      };
    case 'self_request_forbidden':
      return {
        status: 400,
        code: LOCAL_CREATE_FAILURE_CODE.SELF_REQUEST_FORBIDDEN,
        error: 'Self-request is prohibited for integrity reasons.',
      };
    case 'service_business_mismatch':
      return {
        status: 400,
        code: LOCAL_CREATE_FAILURE_CODE.SERVICE_BUSINESS_MISMATCH,
        error: 'Service does not belong to the given business',
      };
    case 'service_not_found':
      return {
        status: 404,
        code: LOCAL_CREATE_FAILURE_CODE.SERVICE_NOT_FOUND,
        error: 'Service not found',
      };
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

/** Controller field/body validation → public invalid_input (safe human message preserved). */
export function localCreateInvalidInputFailure(error: string): LocalCreatePublicFailure {
  return {
    status: 400,
    code: LOCAL_CREATE_FAILURE_CODE.INVALID_INPUT,
    error,
  };
}
