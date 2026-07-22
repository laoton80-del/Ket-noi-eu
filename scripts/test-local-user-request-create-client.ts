/**
 * FC-P0 Local create — Pack B provider wiring + preserved guard/auth tests.
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
    {
      businessId: 'biz-eligible-1',
      displayName: 'Eligible Local Merchant',
      supportedServiceTypes: [LOCAL_SERVICE_TYPE.GENERIC_REQUEST],
      categoryLabel: 'LOCAL',
    },
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
  // Pack B: default loader requires auth — without JWT → PROVIDER_AUTH_REQUIRED_OR_EXPIRED
  const authority = await loadLocalCreateBusinessOptions(
    { serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST },
    {
      listProviders: async (_input, listDeps) => {
        const jwt = listDeps ? await listDeps.getJwt() : null;
        if (!jwt) {
          return { ok: false, reason: 'auth', path: '/api/local/providers' };
        }
        return {
          ok: true,
          path: '/api/local/providers',
          data: { items: [], pagination: { limit: 100, skip: 0, returned: 0 } },
        };
      },
      listDeps: {
        getJwt: async () => null,
        fetchJson: async () => {
          throw new Error('unreachable');
        },
      },
    }
  );
  assert.equal(authority.status, 'PROVIDER_AUTH_REQUIRED_OR_EXPIRED');
  assert.equal(authority.options.length, 0);
  assert.equal(localCreateProviderSelectionEnabled(authority.status, authority.options), false);

  // No POST without valid selected provider (empty authority)
  const emptyForm = {
    ...defaultLocalCreateFormValues(),
    serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
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
  assert.match(composer, /PROVIDER_IDLE|PROVIDER_LOADING/);
  assert.match(composer, /local-create-provider-unavailable/);
  assert.match(sourceTs, /listLocalProviders/);

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
  assert.equal(formEmpty.serviceType, null);
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
    mapCreateApiResultToUiState({ ok: false, status: 401, error: 'x' }),
    'AUTH_REQUIRED_OR_EXPIRED'
  );
  assert.equal(mapCreateApiResultToUiState({ ok: false, status: 429, error: 'x' }), 'RATE_LIMITED');
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 0, error: 'x', unreachable: true }),
    'NETWORK_RESULT_UNKNOWN'
  );

  const nullJwt = await runLocalCreateSubmit({
    form: formOk,
    options: mapped,
    inFlight: { current: false },
    deps: {
      getJwt: async () => null,
      createRequest: async () => {
        throw new Error('POST must not run');
      },
    },
  });
  assert.equal(nullJwt.uiState, 'AUTH_REQUIRED_OR_EXPIRED');
  assert.equal(nullJwt.bodyPosted, null);

  assert.equal(
    findLikelyCreatedRequestId({
      createdRequestId: 'c1',
      listIds: ['c1', 'c2'],
      title: 'Need help',
      businessId: selectedId,
      candidates: [],
    }),
    'c1'
  );

  // Client files must not import Prisma
  for (const rel of [
    'src/components/local/LocalUserRequestCreateComposer.tsx',
    'src/services/local/localCreateBusinessSource.ts',
    'src/services/local/localProviderListClient.ts',
    'src/screens/b2c/localUserRequestCreateFlow.ts',
  ]) {
    assert.equal(read(rel).includes('@prisma/client'), false, rel);
  }

  // EN/VI create key parity for Pack B feedback
  const en = JSON.parse(read('src/i18n/locales/en.json')) as {
    local: { userRequestStatus: { create: { feedback: Record<string, string> } } };
  };
  const vi = JSON.parse(read('src/i18n/locales/vi.json')) as {
    local: { userRequestStatus: { create: { feedback: Record<string, string> } } };
  };
  for (const key of Object.keys(en.local.userRequestStatus.create.feedback)) {
    assert.ok(
      vi.local.userRequestStatus.create.feedback[key],
      `vi missing create.feedback.${key}`
    );
  }

  // Tourism discover still exists for Travel (not Local create)
  assert.match(read('src/services/viGlobalTourismApi.ts'), /discover/);

  console.log('[test-local-user-request-create-client] OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
