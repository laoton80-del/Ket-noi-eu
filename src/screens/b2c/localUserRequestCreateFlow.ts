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
import type { ApiRequestResult } from '../../services/apiClient';
import {
  isLocalCreateBusinessSelected,
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
  serviceType: LocalServiceTypeClient;
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
    serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
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
  } else if (options && !isLocalCreateBusinessSelected(form.businessId, options)) {
    errors.businessId = 'unavailable';
  }
  if (!isLocalServiceTypeClient(form.serviceType)) {
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

export function mapCreateApiResultToUiState(
  result: ApiRequestResult<LocalUserRequestCreateResult>
): LocalCreateUiState {
  if (result.ok) {
    return result.status === 201 ? 'CREATED_SUCCESS' : 'SERVER_ERROR';
  }
  if (result.unreachable === true || result.status === 0) {
    return 'NETWORK_RESULT_UNKNOWN';
  }
  if (result.status === 401) return 'AUTH_REQUIRED_OR_EXPIRED';
  if (result.status === 429) return 'RATE_LIMITED';
  if (result.status === 400 || result.status === 404) return 'SERVER_VALIDATION_ERROR';
  if (result.status >= 500) return 'SERVER_ERROR';
  return 'SERVER_ERROR';
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
  | 'providersLoadError';

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
  created: LocalUserRequestCreateResult | null;
  bodyPosted: LocalUserRequestCreateBody | null;
}>;

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
    return { uiState: 'SUBMITTING', created: null, bodyPosted: null };
  }

  const fieldErrors = validateLocalCreateForm(input.form, input.options);
  if (fieldErrors) {
    return { uiState: 'VALIDATION_ERROR', created: null, bodyPosted: null };
  }

  input.inFlight.current = true;

  try {
    const jwt = await input.deps.getJwt();
    if (!jwt) {
      return { uiState: 'AUTH_REQUIRED_OR_EXPIRED', created: null, bodyPosted: null };
    }

    if (!isLocalCreateBusinessSelected(input.form.businessId, input.options)) {
      return { uiState: 'VALIDATION_ERROR', created: null, bodyPosted: null };
    }

    const body = buildLocalCreateRequestBody(input.form);
    assertLocalCreateBodySafe(body);

    const result = await input.deps.createRequest(body);
    const uiState = mapCreateApiResultToUiState(result);
    if (uiState === 'CREATED_SUCCESS' && result.ok) {
      return { uiState, created: result.data, bodyPosted: body };
    }
    return { uiState, created: null, bodyPosted: body };
  } finally {
    input.inFlight.current = false;
  }
}
