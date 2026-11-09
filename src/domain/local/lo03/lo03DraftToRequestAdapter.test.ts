import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOCAL_CREATE_CLIENT_SOURCE,
  LOCAL_CREATE_FORBIDDEN_BODY_KEYS,
  LOCAL_SERVICE_TYPE,
} from '../localServiceRequestClientContract';
import { prepareLo03LocalRequestCandidate } from './lo03DraftToRequestAdapter';

const eligibleProvider = {
  businessId: 'synthetic-provider-id',
  displayName: 'Synthetic Handyman Provider',
  supportedServiceTypes: [LOCAL_SERVICE_TYPE.FIXER_HIRE],
};

function fixture() {
  return {
    draft: {
      phase: 'CONFIRMED_LOCALLY_NOT_SUBMITTED',
      categoryId: 'furniture',
      title: 'Assemble a sample chair',
      description: 'Synthetic furniture assembly example',
    },
    providerSelection: {
      sourceStatus: 'PROVIDER_READY',
      selectedBusinessId: eligibleProvider.businessId,
      options: [eligibleProvider],
    },
  };
}

test('prepares only a fixed Local candidate, never a lifecycle record or submission', () => {
  const result = prepareLo03LocalRequestCandidate(fixture());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(LOCAL_SERVICE_TYPE.FIXER_HIRE, 'FIXER_HIRE');
  assert.equal(LOCAL_CREATE_CLIENT_SOURCE, 'LOCAL_SCREEN');
  assert.equal(result.kind, 'candidate_not_submitted');
  assert.equal(result.requiresExplicitUserSubmit, true);
  assert.equal(result.unmappedDemoCategoryId, 'furniture');
  assert.deepEqual(result.requestBody, {
    businessId: 'synthetic-provider-id',
    serviceType: LOCAL_SERVICE_TYPE.FIXER_HIRE,
    title: 'Assemble a sample chair',
    source: LOCAL_CREATE_CLIENT_SOURCE,
    description: 'Synthetic furniture assembly example',
  });
  assert.deepEqual(Object.keys(result.requestBody).sort(), [
    'businessId',
    'description',
    'serviceType',
    'source',
    'title',
  ]);
  assert.equal(Object.hasOwn(result.requestBody, 'status'), false);
  assert.equal(Object.hasOwn(result.requestBody, 'requesterUserId'), false);
  assert.equal(Object.hasOwn(result.requestBody, 'category'), false);
  assert.equal(Object.hasOwn(result.requestBody, 'serviceId'), false);
});

test('requires local confirmation but never treats it as real submit authority', () => {
  for (const phase of ['DRAFT_LOCAL', 'REVIEW_LOCAL']) {
    const input = fixture();
    assert.deepEqual(
      prepareLo03LocalRequestCandidate({
        ...input,
        draft: { ...input.draft, phase },
      }),
      { ok: false, reason: 'local_confirmation_required' }
    );
  }
  const result = prepareLo03LocalRequestCandidate(fixture());
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.requiresExplicitUserSubmit, true);
});

test('returns precise failures for missing, malformed, and ineligible providers', () => {
  const input = fixture();
  const cases: Array<{ providerSelection: unknown; reason: string }> = [
    { providerSelection: null, reason: 'provider_selection_required' },
    { providerSelection: undefined, reason: 'provider_selection_required' },
    {
      providerSelection: { ...input.providerSelection, selectedBusinessId: '' },
      reason: 'provider_selection_required',
    },
    {
      providerSelection: { ...input.providerSelection, selectedBusinessId: 42 },
      reason: 'provider_selection_required',
    },
    {
      providerSelection: { ...input.providerSelection, selectedBusinessId: 'unlisted-provider' },
      reason: 'provider_not_eligible_for_fixer_hire',
    },
    {
      providerSelection: { ...input.providerSelection, sourceStatus: 'PROVIDER_EMPTY' },
      reason: 'provider_selection_required',
    },
    {
      providerSelection: {
        ...input.providerSelection,
        options: [{ ...eligibleProvider, supportedServiceTypes: [LOCAL_SERVICE_TYPE.SERVICE_MENU] }],
      },
      reason: 'provider_not_eligible_for_fixer_hire',
    },
  ];
  for (const { providerSelection, reason } of cases) {
    assert.deepEqual(
      prepareLo03LocalRequestCandidate({ ...input, providerSelection }),
      { ok: false, reason }
    );
  }
});

test('rejects missing or invalid title and unknown demo category', () => {
  const input = fixture();
  for (const title of ['', '   ', 42, null, {}, []]) {
    assert.deepEqual(
      prepareLo03LocalRequestCandidate({ ...input, draft: { ...input.draft, title } }),
      { ok: false, reason: 'invalid_title' }
    );
  }
  assert.deepEqual(
    prepareLo03LocalRequestCandidate({
      ...input,
      draft: { ...input.draft, categoryId: 'unknown-category' },
    }),
    { ok: false, reason: 'invalid_category' }
  );
  assert.deepEqual(
    prepareLo03LocalRequestCandidate({
      ...input,
      draft: { ...input.draft, categoryId: undefined },
    }),
    { ok: false, reason: 'invalid_category' }
  );
});

test('rejects invalid drafts, phases, and non-string descriptions', () => {
  const input = fixture();
  for (const draft of [null, undefined, [], 'synthetic draft']) {
    assert.deepEqual(
      prepareLo03LocalRequestCandidate({ ...input, draft }),
      { ok: false, reason: 'invalid_draft' }
    );
  }
  for (const phase of [undefined, null, 'REQUESTED', 'UNKNOWN_PHASE']) {
    assert.deepEqual(
      prepareLo03LocalRequestCandidate({
        ...input,
        draft: { ...input.draft, phase },
      }),
      { ok: false, reason: 'invalid_phase' }
    );
  }
  assert.deepEqual(
    prepareLo03LocalRequestCandidate({
      ...input,
      draft: { ...input.draft, description: 42 },
    }),
    { ok: false, reason: 'invalid_draft' }
  );
});

test('accepts only the three source-defined demo categories without production mapping', () => {
  for (const categoryId of ['light-electrical', 'furniture', 'household-water']) {
    const input = fixture();
    const result = prepareLo03LocalRequestCandidate({
      ...input,
      draft: { ...input.draft, categoryId },
    });
    assert.equal(result.ok, true);
    if (!result.ok) continue;
    assert.equal(result.unmappedDemoCategoryId, categoryId);
    assert.equal(Object.hasOwn(result.requestBody, 'categoryId'), false);
    assert.equal(Object.hasOwn(result.requestBody, 'serviceId'), false);
  }
  const input = fixture();
  assert.deepEqual(
    prepareLo03LocalRequestCandidate({
      ...input,
      draft: { ...input.draft, categoryId: 'furniture-assembly' },
    }),
    { ok: false, reason: 'invalid_category' }
  );
});

test('does not translate synthetic locality or time IDs into production fields', () => {
  const input = fixture();
  for (const patch of [{ localityId: 'sample-block' }, { timeId: 'tomorrow-morning' }]) {
    assert.deepEqual(
      prepareLo03LocalRequestCandidate({ ...input, draft: { ...input.draft, ...patch } }),
      { ok: false, reason: 'unsupported_locality_or_time' }
    );
  }
  const result = prepareLo03LocalRequestCandidate({
    ...input,
    draft: {
      ...input.draft,
      locationText: 'synthetic address',
      city: 'synthetic city',
      countryCode: 'ZZ',
      scheduledStartAt: 'synthetic start',
      scheduledEndAt: 'synthetic end',
    },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  for (const key of ['locationText', 'city', 'countryCode', 'scheduledStartAt', 'scheduledEndAt']) {
    assert.equal(Object.hasOwn(result.requestBody, key), false);
  }
});

test('rejects attempts to inject requester or lifecycle authority', () => {
  const input = fixture();
  const forbiddenKeys = new Set<string>([
    ...LOCAL_CREATE_FORBIDDEN_BODY_KEYS,
    'requesterUserId',
    'status',
    'businessId',
    'serviceType',
    'source',
    'serviceId',
    'metadata',
    'walletMode',
    'walletPhase',
    'quotedAmountCredits',
    'holdAmountCredits',
    'settledAmountCredits',
    'platformFeeCredits',
    'totalVioCredits',
    'heldVioCredits',
    'releasedVioCredits',
    'platformFeeVioCredits',
    'providerEarningsVioCredits',
  ]);
  for (const key of forbiddenKeys) {
    assert.deepEqual(
      prepareLo03LocalRequestCandidate({
        ...input,
        draft: { ...input.draft, [key]: 'synthetic-authority-injection' },
      }),
      { ok: false, reason: 'forbidden_authority_field' }
    );
  }
  for (const key of ['requesterUserId', 'status', 'serviceType', 'walletMode']) {
    assert.deepEqual(
      prepareLo03LocalRequestCandidate({
        ...input,
        providerSelection: { ...input.providerSelection, [key]: 'synthetic-authority-injection' },
      }),
      { ok: false, reason: 'provider_selection_required' }
    );
  }
});

test('does not mutate the input or convert local confirmation into submission', () => {
  const input = structuredClone(fixture());
  const before = structuredClone(input);
  Object.freeze(input.draft);
  Object.freeze(input.providerSelection.options[0].supportedServiceTypes);
  Object.freeze(input.providerSelection.options[0]);
  Object.freeze(input.providerSelection.options);
  Object.freeze(input.providerSelection);
  Object.freeze(input);
  const result = prepareLo03LocalRequestCandidate(input);
  assert.deepEqual(input, before);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.kind, 'candidate_not_submitted');
  assert.equal(result.requiresExplicitUserSubmit, true);
  assert.equal(Object.hasOwn(result.requestBody, 'phase'), false);
  assert.equal(Object.hasOwn(result.requestBody, 'status'), false);
});
