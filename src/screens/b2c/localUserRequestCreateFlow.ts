/**
 * FC-P0 Local user request create — pure mapping / state helpers (no network).
 */
import {
  LOCAL_CREATE_CLIENT_SOURCE,
  LOCAL_CREATE_FORBIDDEN_BODY_KEYS,
  LOCAL_SERVICE_TYPE,
  isLocalServiceTypeClient,
  type LocalServiceTypeClient,
  type LocalUserRequestCreateBody,
  type LocalUserRequestCreateResult,
} from '../../domain/local/localServiceRequestClientContract';
import {
  isLocalCreateFailureCode,
  LOCAL_CREATE_FAILURE_CODE,
  type LocalCreateFailureCode,
} from '../../domain/local/localCreateFailureCodes';
import type { ApiRequestResult } from '../../services/apiClient';
import {
  isLocalProviderSelectionCompatible,
  type LocalCreateBusinessOption,
} from '../../services/local/localCreateBusinessOptionModel';

export type LocalCreateUiState =
  | 'IDLE'
  | 'VALIDATION_ERROR'
  | 'SUBMITTING'
  | 'CREATED_SUCCESS'
  | 'AUTH_REQUIRED_OR_EXPIRED'
  | 'RATE_LIMITED'
  | 'SERVER_VALIDATION_ERROR'
  | 'NETWORK_RESULT_UNKNOWN'
  | 'SERVER_ERROR';

export type LocalCreateFormValues = Readonly<{
  businessId: string;
  /** Null until the user selects a service type (Pack B service-type-first). */
  serviceType: LocalServiceTypeClient | null;
  title: string;
  description: string;
}>;

export type LocalCreateFieldErrors = Readonly<{
  businessId?: string;
  serviceType?: string;
  title?: string;
}>;

export const LOCAL_CREATE_SERVICE_TYPE_OPTIONS: readonly LocalServiceTypeClient[] = [
  LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
  LOCAL_SERVICE_TYPE.SERVICE_MENU,
  LOCAL_SERVICE_TYPE.FIXER_HIRE,
  LOCAL_SERVICE_TYPE.LEGAL_INTAKE,
  LOCAL_SERVICE_TYPE.CLASSIFIED_LEAD,
];

export function defaultLocalCreateFormValues(): LocalCreateFormValues {
  return {
    businessId: '',
    serviceType: null,
    title: '',
    description: '',
  };
}

export function validateLocalCreateForm(
  form: LocalCreateFormValues,
  options?: readonly LocalCreateBusinessOption[]
): LocalCreateFieldErrors | null {
  const errors: { businessId?: string; serviceType?: string; title?: string } = {};
  if (form.businessId.trim().length === 0) {
    errors.businessId = 'required';
  } else if (
    options &&
    (form.serviceType == null ||
      !isLocalProviderSelectionCompatible(form.businessId, form.serviceType, options))
  ) {
    errors.businessId = 'unavailable';
  }
  if (form.serviceType == null || !isLocalServiceTypeClient(form.serviceType)) {
    errors.serviceType = 'required';
  }
  if (form.title.trim().length === 0) {
    errors.title = 'required';
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export function buildLocalCreateRequestBody(
  form: LocalCreateFormValues
): LocalUserRequestCreateBody {
  if (form.serviceType == null || !isLocalServiceTypeClient(form.serviceType)) {
    throw new Error('Local create requires a selected serviceType');
  }
  const description = form.description.trim();
  return {
    businessId: form.businessId.trim(),
    serviceType: form.serviceType,
    title: form.title.trim(),
    source: LOCAL_CREATE_CLIENT_SOURCE,
    ...(description.length > 0 ? { description } : {}),
  };
}

/** Ensures no forbidden server-authority keys leak onto the POST body. */
export function assertLocalCreateBodySafe(body: LocalUserRequestCreateBody): void {
  const keys = Object.keys(body);
  for (const key of keys) {
    if ((LOCAL_CREATE_FORBIDDEN_BODY_KEYS as readonly string[]).includes(key)) {
      throw new Error(`Forbidden Local create body key: ${key}`);
    }
  }
  if (body.source !== LOCAL_CREATE_CLIENT_SOURCE) {
    throw new Error('Local create source must be LOCAL_SCREEN');
  }
}

export function canSubmitLocalCreate(
  uiState: LocalCreateUiState,
  form: LocalCreateFormValues,
  options?: readonly LocalCreateBusinessOption[]
): boolean {
  if (uiState === 'SUBMITTING') return false;
  if (uiState === 'CREATED_SUCCESS') return false;
  if (uiState === 'NETWORK_RESULT_UNKNOWN') return false;
  return validateLocalCreateForm(form, options) === null;
}

export function fieldsEditableInLocalCreateState(uiState: LocalCreateUiState): boolean {
  return uiState !== 'SUBMITTING';
}

/**
 * Structured create submit outcome — control-flow source of truth.
 * Presentation (UI state) and recovery side effects map from this separately.
 */
export type LocalCreateSubmitOutcome =
  | { kind: 'created'; requestId: string }
  | {
      kind: 'provider_unavailable';
      status: 404;
      code: typeof LOCAL_CREATE_FAILURE_CODE.PROVIDER_NOT_AVAILABLE;
    }
  | {
      kind: 'service_type_not_supported';
      status: 400;
      code: typeof LOCAL_CREATE_FAILURE_CODE.SERVICE_TYPE_NOT_SUPPORTED;
    }
  | {
      kind: 'validation_error';
      status: 400 | 404;
      code?: LocalCreateFailureCode;
    }
  | { kind: 'auth_required'; status: 401 }
  | { kind: 'rate_limited'; status: 429 }
  | { kind: 'network_result_unknown' }
  | { kind: 'server_error'; status?: number };

export type LocalCreateRecoveryAction = 'NONE' | 'REFRESH_PROVIDER_AUTHORITY_ONCE';

/**
 * Map HTTP create result → structured outcome.
 * Unknown/missing/malformed codes fail closed as generic validation_error (no recovery).
 * Never parses human error prose.
 */
export function mapCreateApiResultToSubmitOutcome(
  result: ApiRequestResult<LocalUserRequestCreateResult>
): LocalCreateSubmitOutcome {
  if (result.ok) {
    if (result.status === 201 && typeof result.data.id === 'string' && result.data.id.length > 0) {
      return { kind: 'created', requestId: result.data.id };
    }
    return { kind: 'server_error', status: result.status };
  }
  if (result.unreachable === true || result.status === 0) {
    return { kind: 'network_result_unknown' };
  }
  if (result.status === 401) return { kind: 'auth_required', status: 401 };
  if (result.status === 429) return { kind: 'rate_limited', status: 429 };

  const code = isLocalCreateFailureCode(result.code) ? result.code : undefined;

  if (
    result.status === 404 &&
    code === LOCAL_CREATE_FAILURE_CODE.PROVIDER_NOT_AVAILABLE
  ) {
    return {
      kind: 'provider_unavailable',
      status: 404,
      code: LOCAL_CREATE_FAILURE_CODE.PROVIDER_NOT_AVAILABLE,
    };
  }
  if (
    result.status === 400 &&
    code === LOCAL_CREATE_FAILURE_CODE.SERVICE_TYPE_NOT_SUPPORTED
  ) {
    return {
      kind: 'service_type_not_supported',
      status: 400,
      code: LOCAL_CREATE_FAILURE_CODE.SERVICE_TYPE_NOT_SUPPORTED,
    };
  }
  if (result.status === 400 || result.status === 404) {
    return {
      kind: 'validation_error',
      status: result.status as 400 | 404,
      ...(code ? { code } : {}),
    };
  }
  if (result.status >= 500) return { kind: 'server_error', status: result.status };
  return { kind: 'server_error', status: result.status };
}

export function mapSubmitOutcomeToUiState(
  outcome: LocalCreateSubmitOutcome
): LocalCreateUiState {
  switch (outcome.kind) {
    case 'created':
      return 'CREATED_SUCCESS';
    case 'provider_unavailable':
    case 'service_type_not_supported':
    case 'validation_error':
      return 'SERVER_VALIDATION_ERROR';
    case 'auth_required':
      return 'AUTH_REQUIRED_OR_EXPIRED';
    case 'rate_limited':
      return 'RATE_LIMITED';
    case 'network_result_unknown':
      return 'NETWORK_RESULT_UNKNOWN';
    case 'server_error':
      return 'SERVER_ERROR';
    default: {
      const _exhaustive: never = outcome;
      return _exhaustive;
    }
  }
}

/**
 * Recovery side-effect classifier — independent of UI presentation state.
 * Refresh only for exact provider-authority codes + matching HTTP status.
 */
export function classifyLocalCreateRecovery(
  outcome: LocalCreateSubmitOutcome
): LocalCreateRecoveryAction {
  if (
    outcome.kind === 'provider_unavailable' &&
    outcome.status === 404 &&
    outcome.code === LOCAL_CREATE_FAILURE_CODE.PROVIDER_NOT_AVAILABLE
  ) {
    return 'REFRESH_PROVIDER_AUTHORITY_ONCE';
  }
  if (
    outcome.kind === 'service_type_not_supported' &&
    outcome.status === 400 &&
    outcome.code === LOCAL_CREATE_FAILURE_CODE.SERVICE_TYPE_NOT_SUPPORTED
  ) {
    return 'REFRESH_PROVIDER_AUTHORITY_ONCE';
  }
  return 'NONE';
}

/** @deprecated Prefer mapCreateApiResultToSubmitOutcome → mapSubmitOutcomeToUiState. */
export function mapCreateApiResultToUiState(
  result: ApiRequestResult<LocalUserRequestCreateResult>
): LocalCreateUiState {
  return mapSubmitOutcomeToUiState(mapCreateApiResultToSubmitOutcome(result));
}

export type LocalCreateFeedbackKey =
  | 'validation'
  | 'auth'
  | 'rateLimited'
  | 'serverValidation'
  | 'networkUnknown'
  | 'serverError'
  | 'success'
  | 'refreshWarning'
  | 'providerUnavailable'
  | 'providersEmpty'
  | 'providersLoadError'
  | 'providerAuthRequired'
  | 'providerNetworkError'
  | 'providerServerError'
  | 'chooseServiceType'
  | 'chooseProvider';

export function feedbackKeyForCreateState(uiState: LocalCreateUiState): LocalCreateFeedbackKey | null {
  switch (uiState) {
    case 'VALIDATION_ERROR':
      return 'validation';
    case 'AUTH_REQUIRED_OR_EXPIRED':
      return 'auth';
    case 'RATE_LIMITED':
      return 'rateLimited';
    case 'SERVER_VALIDATION_ERROR':
      return 'serverValidation';
    case 'NETWORK_RESULT_UNKNOWN':
      return 'networkUnknown';
    case 'SERVER_ERROR':
      return 'serverError';
    case 'CREATED_SUCCESS':
      return 'success';
    default:
      return null;
  }
}

/** After NETWORK_RESULT_UNKNOWN list refresh — prefer matching created id when known. */
export function findLikelyCreatedRequestId(input: Readonly<{
  createdRequestId: string | null;
  listIds: readonly string[];
  title: string;
  businessId: string;
  candidates: readonly Readonly<{
    id: string;
    title: string;
    businessId: string;
  }>[];
}>): string | null {
  if (input.createdRequestId && input.listIds.includes(input.createdRequestId)) {
    return input.createdRequestId;
  }
  const title = input.title.trim();
  const businessId = input.businessId.trim();
  const match = input.candidates.find(
    (row) => row.title === title && row.businessId === businessId
  );
  return match?.id ?? null;
}

export type LocalCreateSubmitDeps = Readonly<{
  getJwt: () => Promise<string | null>;
  createRequest: (
    body: LocalUserRequestCreateBody
  ) => Promise<ApiRequestResult<LocalUserRequestCreateResult>>;
}>;

export type LocalCreateSubmitResult = Readonly<{
  uiState: LocalCreateUiState;
  recoveryAction: LocalCreateRecoveryAction;
  outcome: LocalCreateSubmitOutcome | null;
  created: LocalUserRequestCreateResult | null;
  bodyPosted: LocalUserRequestCreateBody | null;
}>;

function submitResult(
  partial: Omit<LocalCreateSubmitResult, 'recoveryAction'> & {
    recoveryAction?: LocalCreateRecoveryAction;
  }
): LocalCreateSubmitResult {
  const outcome = partial.outcome;
  const recoveryAction =
    partial.recoveryAction ??
    (outcome ? classifyLocalCreateRecovery(outcome) : 'NONE');
  return {
    uiState: partial.uiState,
    recoveryAction,
    outcome,
    created: partial.created,
    bodyPosted: partial.bodyPosted,
  };
}

/**
 * Single-flight create runner.
 * Sets `inFlight.current = true` synchronously BEFORE any await (JWT / POST).
 */
export async function runLocalCreateSubmit(input: Readonly<{
  form: LocalCreateFormValues;
  options: readonly LocalCreateBusinessOption[];
  inFlight: { current: boolean };
  deps: LocalCreateSubmitDeps;
}>): Promise<LocalCreateSubmitResult> {
  if (input.inFlight.current) {
    return submitResult({
      uiState: 'SUBMITTING',
      outcome: null,
      created: null,
      bodyPosted: null,
      recoveryAction: 'NONE',
    });
  }

  const fieldErrors = validateLocalCreateForm(input.form, input.options);
  if (fieldErrors) {
    return submitResult({
      uiState: 'VALIDATION_ERROR',
      outcome: null,
      created: null,
      bodyPosted: null,
      recoveryAction: 'NONE',
    });
  }

  input.inFlight.current = true;

  try {
    const jwt = await input.deps.getJwt();
    if (!jwt) {
      return submitResult({
        uiState: 'AUTH_REQUIRED_OR_EXPIRED',
        outcome: { kind: 'auth_required', status: 401 },
        created: null,
        bodyPosted: null,
      });
    }

    if (
      input.form.serviceType == null ||
      !isLocalProviderSelectionCompatible(
        input.form.businessId,
        input.form.serviceType,
        input.options
      )
    ) {
      return submitResult({
        uiState: 'VALIDATION_ERROR',
        outcome: null,
        created: null,
        bodyPosted: null,
        recoveryAction: 'NONE',
      });
    }

    const body = buildLocalCreateRequestBody(input.form);
    assertLocalCreateBodySafe(body);

    const result = await input.deps.createRequest(body);
    const outcome = mapCreateApiResultToSubmitOutcome(result);
    const uiState = mapSubmitOutcomeToUiState(outcome);
    const recoveryAction = classifyLocalCreateRecovery(outcome);
    if (uiState === 'CREATED_SUCCESS' && result.ok) {
      return submitResult({
        uiState,
        outcome,
        recoveryAction,
        created: result.data,
        bodyPosted: body,
      });
    }
    return submitResult({
      uiState,
      outcome,
      recoveryAction,
      created: null,
      bodyPosted: body,
    });
  } finally {
    input.inFlight.current = false;
  }
}
