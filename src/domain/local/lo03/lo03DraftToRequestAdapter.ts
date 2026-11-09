/**
 * Pure LO-03 draft adapter. It prepares a Local create candidate only; it never
 * authorizes submission, reads provider data, or creates a request.
 */
import {
  LOCAL_CREATE_CLIENT_SOURCE,
  LOCAL_CREATE_FORBIDDEN_BODY_KEYS,
  LOCAL_SERVICE_TYPE,
  type LocalUserRequestCreateBody,
} from '../localServiceRequestClientContract';

const LO03_DEMO_CATEGORY_IDS = new Set([
  'light-electrical',
  'furniture',
  'household-water',
]);

type Lo03CandidateBody = Pick<
  LocalUserRequestCreateBody,
  'businessId' | 'serviceType' | 'title' | 'source' | 'description'
>;

export type Lo03DraftAdapterFailure =
  | 'invalid_draft'
  | 'invalid_phase'
  | 'local_confirmation_required'
  | 'invalid_category'
  | 'invalid_title'
  | 'unsupported_locality_or_time'
  | 'forbidden_authority_field'
  | 'provider_selection_required'
  | 'provider_not_eligible_for_fixer_hire';

export type Lo03DraftAdapterResult =
  | Readonly<{
      ok: true;
      kind: 'candidate_not_submitted';
      requestBody: Readonly<Lo03CandidateBody>;
      /** Demo category is deliberately not a Local API category or serviceId. */
      unmappedDemoCategoryId: string;
      requiresExplicitUserSubmit: true;
    }>
  | Readonly<{ ok: false; reason: Lo03DraftAdapterFailure }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasForbiddenAuthorityField(value: Record<string, unknown>): boolean {
  const forbidden = [
    ...LOCAL_CREATE_FORBIDDEN_BODY_KEYS,
    'businessId',
    'serviceType',
    'source',
    'serviceId',
    'metadata',
  ];
  return forbidden.some((key) => Object.prototype.hasOwnProperty.call(value, key));
}

/**
 * `providerSelection` must be based on the authenticated Local provider list.
 * This pure check cannot prove list provenance; Local create must recheck it.
 */
export function prepareLo03LocalRequestCandidate(input: Readonly<{
  draft: unknown;
  providerSelection: unknown;
}>): Lo03DraftAdapterResult {
  const { draft, providerSelection } = input;
  if (!isRecord(draft)) return { ok: false, reason: 'invalid_draft' };
  if (hasForbiddenAuthorityField(draft)) {
    return { ok: false, reason: 'forbidden_authority_field' };
  }

  if (draft.phase === 'DRAFT_LOCAL' || draft.phase === 'REVIEW_LOCAL') {
    return { ok: false, reason: 'local_confirmation_required' };
  }
  if (draft.phase !== 'CONFIRMED_LOCALLY_NOT_SUBMITTED') {
    return { ok: false, reason: 'invalid_phase' };
  }
  if (typeof draft.categoryId !== 'string' || !LO03_DEMO_CATEGORY_IDS.has(draft.categoryId)) {
    return { ok: false, reason: 'invalid_category' };
  }
  if (typeof draft.title !== 'string' || draft.title.trim().length === 0) {
    return { ok: false, reason: 'invalid_title' };
  }
  if (draft.description !== undefined && typeof draft.description !== 'string') {
    return { ok: false, reason: 'invalid_draft' };
  }
  // Offline locality/time option IDs are examples, not production identities.
  if (draft.localityId !== undefined || draft.timeId !== undefined) {
    return { ok: false, reason: 'unsupported_locality_or_time' };
  }

  if (!isRecord(providerSelection) || hasForbiddenAuthorityField(providerSelection)) {
    return { ok: false, reason: 'provider_selection_required' };
  }
  const selectedBusinessId = providerSelection.selectedBusinessId;
  if (
    providerSelection.sourceStatus !== 'PROVIDER_READY' ||
    typeof selectedBusinessId !== 'string' ||
    selectedBusinessId.trim().length === 0 ||
    !Array.isArray(providerSelection.options)
  ) {
    return { ok: false, reason: 'provider_selection_required' };
  }

  const businessId = selectedBusinessId.trim();
  const selectedOption = providerSelection.options.find(
    (option: unknown) =>
      isRecord(option) &&
      typeof option.businessId === 'string' &&
      option.businessId === businessId
  );
  if (
    !isRecord(selectedOption) ||
    typeof selectedOption.displayName !== 'string' ||
    selectedOption.displayName.trim().length === 0 ||
    !Array.isArray(selectedOption.supportedServiceTypes) ||
    !selectedOption.supportedServiceTypes.includes(LOCAL_SERVICE_TYPE.FIXER_HIRE)
  ) {
    return { ok: false, reason: 'provider_not_eligible_for_fixer_hire' };
  }

  const description = (draft.description as string | undefined)?.trim();
  const requestBody: Lo03CandidateBody = {
    businessId,
    serviceType: LOCAL_SERVICE_TYPE.FIXER_HIRE,
    title: draft.title.trim(),
    source: LOCAL_CREATE_CLIENT_SOURCE,
    ...(description ? { description } : {}),
  };

  return {
    ok: true,
    kind: 'candidate_not_submitted',
    requestBody,
    unmappedDemoCategoryId: draft.categoryId,
    requiresExplicitUserSubmit: true,
  };
}
