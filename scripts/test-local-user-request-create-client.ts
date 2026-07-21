/**
 * FC-P0 Local create remediation — executed behavioral tests (DI), not source-scan only.
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
  mapTourismDiscoverToLocalCreateOptions,
  mergeHistoryBusinessHints,
  isLocalCreateBusinessSelected,
  findLocalCreateBusinessOption,
  type LocalCreateBusinessOption,
} from '../src/services/local/localCreateBusinessOptionModel';
import type { TourismDiscoverPayload } from '../src/services/viGlobalTourismApi';
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

function sampleDiscover(): TourismDiscoverPayload {
  return {
    stays: [{ id: 'stay-1', name: 'Stay One', category: 'HOTEL', locationLat: 0, locationLng: 0, description: '', isTopAd: false, tourismServices: [] }],
    tours: [],
    gastronomy: [{ id: 'food-1', name: 'Pho House', category: 'RESTAURANT', locationLat: 0, locationLng: 0, description: '', isTopAd: false, tourismServices: [] }],
    localFixers: [
      {
        id: 'fix-1',
        name: 'Local Fixer A',
        category: 'LOCAL_EXPERIENCE',
        locationLat: 0,
        locationLng: 0,
        description: '',
        isTopAd: false,
        tourismServices: [],
      },
    ],
  };
}

function okCreate(id: string): LocalUserRequestCreateResult {
  return {
    id,
    requesterUserId: 'u1',
    businessId: 'fix-1',
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
  // 1–4: zero-history source-backed options (no request history)
  const mapped = mapTourismDiscoverToLocalCreateOptions(sampleDiscover());
  assert.ok(mapped.length >= 1);
  assert.equal(mapped[0]?.businessId, 'fix-1');
  assert.equal(mapped[0]?.displayName, 'Local Fixer A');
  assert.ok(mapped.every((o) => o.businessId && o.displayName));
  assert.equal(
    mapped.some((o) => /uuid|UUID/i.test(o.displayName)),
    false
  );

  // History merge does not remove discover options for first-time (empty history)
  const zeroHistory = mergeHistoryBusinessHints(mapped, []);
  assert.deepEqual(zeroHistory, mapped);

  // 5–6: selection stores internal id; human name available
  const selectedId = mapped[0]!.businessId;
  assert.equal(isLocalCreateBusinessSelected(selectedId, mapped), true);
  assert.equal(findLocalCreateBusinessOption(selectedId, mapped)?.displayName, 'Local Fixer A');

  // Missing / stale selection prevents submit
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

  // 7–8: source + forbidden keys
  const body = buildLocalCreateRequestBody(formOk);
  assert.equal(body.source, LOCAL_CREATE_CLIENT_SOURCE);
  assertLocalCreateBodySafe(body);
  for (const key of LOCAL_CREATE_FORBIDDEN_BODY_KEYS) {
    assert.equal(Object.prototype.hasOwnProperty.call(body, key), false);
  }

  // 9–12: guard before JWT await; double submit → one JWT + one POST
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

  // 13–14: Authorization header behavior (pure rule + apiClient source contract)
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
  // No Authorization when token absent — restApiFetchJson only sets Bearer when jwt truthy
  assert.match(
    apiClientSrc,
    /if \(jwt\)[\s\S]{0,120}Authorization[\s\S]{0,40}Bearer/
  );
  assert.equal(/maxRetries|retryCount/i.test(apiClientSrc), false);

  // 15: no automatic retry — single createRequest call already proven; failing once stays one call
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

  // 16–19: 201 id + refresh-success semantics helpers
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

  // Refresh failure remains success is UI responsibility; runner already returned CREATED_SUCCESS with id.
  assert.ok(r1.created?.id);

  // 20–25: HTTP / network mapping
  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 400, error: 'x' }), 'SERVER_VALIDATION_ERROR');
  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 401, error: 'x' }), 'AUTH_REQUIRED_OR_EXPIRED');
  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 404, error: 'x' }), 'SERVER_VALIDATION_ERROR');
  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 429, error: 'x' }), 'RATE_LIMITED');
  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 500, error: 'x' }), 'SERVER_ERROR');
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 0, error: 'n', unreachable: true }),
    'NETWORK_RESULT_UNKNOWN'
  );

  // 26: NETWORK_RESULT_UNKNOWN does not auto-resubmit (runner does not loop)
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

  // Auth missing clears without POST
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

  // 27–29: list/timeline/cancel signatures preserved
  const apiSrc = read('src/services/localUserRequestApi.ts');
  assert.match(apiSrc, /export async function fetchUserLocalServiceRequests/);
  assert.match(apiSrc, /export async function fetchUserLocalRequestTimeline/);
  assert.match(apiSrc, /export async function cancelUserLocalServiceRequest/);
  assert.match(apiSrc, /export async function createUserLocalServiceRequest/);

  // 2 / raw UUID removed from composer
  const composer = read('src/components/local/LocalUserRequestCreateComposer.tsx');
  assert.equal(composer.includes('local-create-business-id'), false);
  assert.equal(composer.includes('Paste business UUID'), false);
  assert.equal(composer.includes('businessIdPlaceholder'), false);
  assert.match(composer, /local-create-provider-list/);
  assert.match(composer, /loadLocalCreateBusinessOptionsFromTourismDiscover|loadBusinessOptions/);
  assert.match(composer, /runLocalCreateSubmit/);

  // 30: no Prisma on mobile create graph
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

  // 31: EN/VI key alignment for create
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
  assert.equal('businessIdPlaceholder' in enCreate, false);
  assert.equal('businessIdLabel' in enCreate, false);
  assert.ok(typeof enCreate.providerLabel === 'string');
  assert.ok(typeof (enCreate.feedback as Record<string, string>).providersEmpty === 'string');

  // apiClient: no DEV JWT, no retry loop (covered above via apiClientSrc)
  assert.equal(apiClientSrc.includes('EXPO_PUBLIC_DEV_REST_JWT'), false);

  console.log('[test-local-user-request-create-client] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
