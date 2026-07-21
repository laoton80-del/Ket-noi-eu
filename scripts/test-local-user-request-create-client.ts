/**
 * FC-P0 Local create — Tourism coupling containment + preserved guard/auth tests.
 *
 * Run: npx tsx scripts/test-local-user-request-create-client.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  LOCAL_CREATE_CLIENT_SOURCE,
  LOCAL_CREATE_FORBIDDEN_BODY_KEYS,
  LOCAL_SERVICE_TYPE,
  LOCAL_WALLET_MODE,
  type LocalUserRequestCreateBody,
  type LocalUserRequestCreateResult,
} from '../src/domain/local/localServiceRequestClientContract';
import {
  findLocalCreateBusinessOption,
  isLocalCreateBusinessSelected,
  sanitizeLocalCreateBusinessOptions,
  type LocalCreateBusinessOption,
} from '../src/services/local/localCreateBusinessOptionModel';
import {
  loadLocalCreateBusinessOptions,
  localCreateProviderSelectionEnabled,
} from '../src/services/local/localCreateBusinessSource';
import type { ApiRequestResult } from '../src/services/apiClient';
import {
  assertLocalCreateBodySafe,
  buildLocalCreateRequestBody,
  canSubmitLocalCreate,
  defaultLocalCreateFormValues,
  findLikelyCreatedRequestId,
  mapCreateApiResultToUiState,
  runLocalCreateSubmit,
  validateLocalCreateForm,
} from '../src/screens/b2c/localUserRequestCreateFlow';

const ROOT = path.resolve(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

/** Synthetic Local-eligible options for guard/auth tests only (not a product authority). */
function sampleEligibleOptions(): readonly LocalCreateBusinessOption[] {
  return sanitizeLocalCreateBusinessOptions([
    { businessId: 'biz-eligible-1', displayName: 'Eligible Local Merchant', categoryLabel: 'LOCAL' },
  ]);
}

function okCreate(id: string): LocalUserRequestCreateResult {
  return {
    id,
    requesterUserId: 'u1',
    businessId: 'biz-eligible-1',
    serviceId: null,
    serviceType: 'GENERIC_REQUEST',
    title: 'Need help',
    status: 'REQUESTED',
    walletMode: LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE,
    walletPhase: 'NONE',
    totalVioCredits: null,
    heldVioCredits: null,
    releasedVioCredits: null,
    platformFeeVioCredits: null,
    providerEarningsVioCredits: null,
    message: 'Request submitted for merchant review.',
  };
}

async function run(): Promise<void> {
  // Path 2: default loader → PROVIDER_SELECTION_UNAVAILABLE; no Tourism
  const authority = await loadLocalCreateBusinessOptions();
  assert.equal(authority.status, 'PROVIDER_SELECTION_UNAVAILABLE');
  assert.equal(authority.options.length, 0);
  assert.equal(localCreateProviderSelectionEnabled(authority.status, authority.options), false);

  // No POST without valid selected provider (empty authority)
  const emptyForm = {
    ...defaultLocalCreateFormValues(),
    businessId: 'any-id',
    title: 'Need help',
  };
  assert.equal(canSubmitLocalCreate('IDLE', emptyForm, authority.options), false);
  const blocked = await runLocalCreateSubmit({
    form: emptyForm,
    options: authority.options,
    inFlight: { current: false },
    deps: {
      getJwt: async () => 'tok',
      createRequest: async () => {
        throw new Error('POST must not run without eligible options');
      },
    },
  });
  assert.equal(blocked.uiState, 'VALIDATION_ERROR');
  assert.equal(blocked.bodyPosted, null);

  // Source files: no Tourism coupling in Local create path
  const sourceTs = read('src/services/local/localCreateBusinessSource.ts');
  const modelTs = read('src/services/local/localCreateBusinessOptionModel.ts');
  const composer = read('src/components/local/LocalUserRequestCreateComposer.tsx');
  assert.equal(sourceTs.includes('viGlobalTourismApi'), false);
  assert.equal(sourceTs.includes('fetchTourismDiscover'), false);
  assert.equal(sourceTs.includes('/api/tourism/discover'), false);
  assert.equal(/from ['"].*viGlobalTourismApi['"]/.test(sourceTs), false);
  assert.equal(modelTs.includes('mapTourismDiscover'), false);
  assert.equal(/from ['"].*viGlobalTourismApi['"]/.test(modelTs), false);
  assert.equal(composer.includes('viGlobalTourismApi'), false);
  assert.equal(composer.includes('fetchTourismDiscover'), false);
  assert.equal(composer.includes('loadLocalCreateBusinessOptionsFromTourismDiscover'), false);
  assert.match(composer, /loadLocalCreateBusinessOptions/);
  assert.match(composer, /PROVIDER_SELECTION_UNAVAILABLE|providerSelectionUnavailable/);
  assert.match(composer, /local-create-provider-unavailable/);

  // Raw UUID remains absent
  assert.equal(composer.includes('local-create-business-id'), false);
  assert.equal(composer.includes('Paste business UUID'), false);
  assert.equal(composer.includes('businessIdPlaceholder'), false);
  assert.equal(/Paste business/i.test(composer), false);

  // Guard/auth tests with synthetic eligible options (coordinator DI)
  const mapped = sampleEligibleOptions();
  const selectedId = mapped[0]!.businessId;
  assert.equal(isLocalCreateBusinessSelected(selectedId, mapped), true);
  assert.equal(findLocalCreateBusinessOption(selectedId, mapped)?.displayName, 'Eligible Local Merchant');

  const formEmpty = defaultLocalCreateFormValues();
  assert.ok(validateLocalCreateForm(formEmpty, mapped));
  assert.equal(canSubmitLocalCreate('IDLE', formEmpty, mapped), false);

  const formStale = {
    ...defaultLocalCreateFormValues(),
    businessId: 'gone-biz',
    title: 'Help',
    serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
  };
  assert.equal(validateLocalCreateForm(formStale, mapped)?.businessId, 'unavailable');
  assert.equal(canSubmitLocalCreate('IDLE', formStale, mapped), false);

  const formOk = {
    ...defaultLocalCreateFormValues(),
    businessId: selectedId,
    title: 'Need help',
    serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
    description: 'optional',
  };
  assert.equal(validateLocalCreateForm(formOk, mapped), null);

  const body = buildLocalCreateRequestBody(formOk);
  assert.equal(body.source, LOCAL_CREATE_CLIENT_SOURCE);
  assertLocalCreateBodySafe(body);
  for (const key of LOCAL_CREATE_FORBIDDEN_BODY_KEYS) {
    assert.equal(Object.prototype.hasOwnProperty.call(body, key), false);
  }

  let jwtCalls = 0;
  let postCalls = 0;
  const postedBodies: LocalUserRequestCreateBody[] = [];
  const inFlight = { current: false };
  let sawLockBeforeJwt = false;

  const slowJwt = async (): Promise<string | null> => {
    sawLockBeforeJwt = inFlight.current === true;
    jwtCalls += 1;
    await new Promise((r) => setTimeout(r, 20));
    return 'session-jwt';
  };

  const createRequest = async (
    b: LocalUserRequestCreateBody
  ): Promise<ApiRequestResult<LocalUserRequestCreateResult>> => {
    postCalls += 1;
    postedBodies.push(b);
    return { ok: true, status: 201, data: okCreate('req-created-1') };
  };

  const p1 = runLocalCreateSubmit({
    form: formOk,
    options: mapped,
    inFlight,
    deps: { getJwt: slowJwt, createRequest },
  });
  const p2 = runLocalCreateSubmit({
    form: formOk,
    options: mapped,
    inFlight,
    deps: { getJwt: slowJwt, createRequest },
  });
  const [r1, r2] = await Promise.all([p1, p2]);
  assert.equal(jwtCalls, 1, 'exactly one JWT lookup');
  assert.equal(postCalls, 1, 'exactly one POST');
  assert.equal(sawLockBeforeJwt, true, 'inFlight set synchronously before JWT await');
  assert.equal(r1.uiState, 'CREATED_SUCCESS');
  assert.equal(r1.created?.id, 'req-created-1');
  assert.equal(r2.uiState, 'SUBMITTING');
  assert.equal(inFlight.current, false);
  assert.equal(postedBodies[0]?.source, 'LOCAL_SCREEN');
  assert.equal(postedBodies[0]?.businessId, selectedId);

  function buildAuthHeader(token: string | null): Record<string, string> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }
  assert.deepEqual(buildAuthHeader(null), {});
  assert.deepEqual(buildAuthHeader('abc'), { Authorization: 'Bearer abc' });

  const apiClientSrc = read('src/services/apiClient.ts');
  assert.equal(apiClientSrc.includes('EXPO_PUBLIC_DEV_REST_JWT'), false);
  assert.match(apiClientSrc, /export async function getRestApiJwt/);
  assert.match(
    apiClientSrc,
    /if \(jwt\)[\s\S]{0,120}Authorization[\s\S]{0,40}Bearer/
  );
  assert.equal(/maxRetries|retryCount/i.test(apiClientSrc), false);

  let failPosts = 0;
  const failOnce = async (): Promise<ApiRequestResult<LocalUserRequestCreateResult>> => {
    failPosts += 1;
    return { ok: false, status: 500, error: 'boom' };
  };
  const failFlight = { current: false };
  const failResult = await runLocalCreateSubmit({
    form: formOk,
    options: mapped,
    inFlight: failFlight,
    deps: { getJwt: async () => 'tok', createRequest: failOnce },
  });
  assert.equal(failPosts, 1);
  assert.equal(failResult.uiState, 'SERVER_ERROR');

  assert.equal(
    findLikelyCreatedRequestId({
      createdRequestId: 'req-created-1',
      listIds: ['req-created-1'],
      title: 'Need help',
      businessId: selectedId,
      candidates: [],
    }),
    'req-created-1'
  );
  assert.ok(r1.created?.id);

  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 400, error: 'x' }), 'SERVER_VALIDATION_ERROR');
  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 401, error: 'x' }), 'AUTH_REQUIRED_OR_EXPIRED');
  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 404, error: 'x' }), 'SERVER_VALIDATION_ERROR');
  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 429, error: 'x' }), 'RATE_LIMITED');
  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 500, error: 'x' }), 'SERVER_ERROR');
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 0, error: 'n', unreachable: true }),
    'NETWORK_RESULT_UNKNOWN'
  );

  let netPosts = 0;
  const netFlight = { current: false };
  const netResult = await runLocalCreateSubmit({
    form: formOk,
    options: mapped,
    inFlight: netFlight,
    deps: {
      getJwt: async () => 'tok',
      createRequest: async () => {
        netPosts += 1;
        return { ok: false, status: 0, error: 'down', unreachable: true };
      },
    },
  });
  assert.equal(netResult.uiState, 'NETWORK_RESULT_UNKNOWN');
  assert.equal(netPosts, 1);

  let authPosts = 0;
  const authFlight = { current: false };
  const authResult = await runLocalCreateSubmit({
    form: formOk,
    options: mapped,
    inFlight: authFlight,
    deps: {
      getJwt: async () => null,
      createRequest: async () => {
        authPosts += 1;
        return { ok: true, status: 201, data: okCreate('x') };
      },
    },
  });
  assert.equal(authResult.uiState, 'AUTH_REQUIRED_OR_EXPIRED');
  assert.equal(authPosts, 0);
  assert.equal(authFlight.current, false);

  const apiSrc = read('src/services/localUserRequestApi.ts');
  assert.match(apiSrc, /export async function fetchUserLocalServiceRequests/);
  assert.match(apiSrc, /export async function fetchUserLocalRequestTimeline/);
  assert.match(apiSrc, /export async function cancelUserLocalServiceRequest/);
  assert.match(apiSrc, /export async function createUserLocalServiceRequest/);

  for (const file of [
    'src/screens/b2c/LocalUserRequestStatusScreen.tsx',
    'src/screens/b2c/localUserRequestCreateFlow.ts',
    'src/components/local/LocalUserRequestCreateComposer.tsx',
    'src/services/localUserRequestApi.ts',
    'src/services/local/localCreateBusinessSource.ts',
    'src/services/local/localCreateBusinessOptionModel.ts',
    'src/domain/local/localServiceRequestClientContract.ts',
  ]) {
    const src = read(file);
    assert.equal(src.includes('@prisma/client'), false, file);
  }

  const en = JSON.parse(read('src/i18n/locales/en.json')) as {
    local: { userRequestStatus: { create: Record<string, unknown> } };
  };
  const vi = JSON.parse(read('src/i18n/locales/vi.json')) as {
    local: { userRequestStatus: { create: Record<string, unknown> } };
  };
  const enCreate = en.local.userRequestStatus.create;
  const viCreate = vi.local.userRequestStatus.create;
  for (const key of Object.keys(enCreate)) {
    assert.ok(key in viCreate, `VI missing create.${key}`);
  }
  const enFb = enCreate.feedback as Record<string, string>;
  const viFb = viCreate.feedback as Record<string, string>;
  for (const key of Object.keys(enFb)) {
    assert.ok(key in viFb, `VI missing create.feedback.${key}`);
  }
  assert.equal('businessIdPlaceholder' in enCreate, false);
  assert.equal('businessIdLabel' in enCreate, false);
  assert.ok(typeof enFb.providerSelectionUnavailable === 'string');
  assert.match(enFb.providerSelectionUnavailable, /not available yet/i);
  assert.equal(/UUID|Paste business/i.test(JSON.stringify(enCreate)), false);
  assert.equal(/UUID|Paste business/i.test(JSON.stringify(viCreate)), false);

  // Tourism discover route itself unchanged (still present for Travel)
  const tourismRoutes = read('src/routes/tourismRoutes.ts');
  assert.match(tourismRoutes, /\/discover/);

  console.log('[test-local-user-request-create-client] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
