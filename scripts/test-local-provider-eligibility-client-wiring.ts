/**
 * Pack B — Local provider eligibility client wiring (B1–B17).
 *
 * Deterministic mocks only — no live provider API, no migration apply, no deploy.
 *
 * Run: npx tsx scripts/test-local-provider-eligibility-client-wiring.ts
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
import type { ApiRequestResult } from '../src/services/apiClient';
import {
  findLocalCreateBusinessOption,
  isLocalProviderSelectionCompatible,
  localCreateProviderSelectionEnabled,
  loadLocalCreateBusinessOptions,
  shouldApplyProviderListResult,
  type LocalCreateBusinessOption,
} from '../src/services/local/localCreateBusinessSource';
import {
  buildLocalProvidersQueryPath,
  LOCAL_PROVIDER_LIST_CLIENT_LIMIT,
  mapLocalProviderPublicItem,
  parseLocalProviderListData,
} from '../src/services/local/localProviderListClientTypes';
import {
  listLocalProviders,
  type ListLocalProvidersDeps,
} from '../src/services/local/localProviderListClient';
import {
  assertLocalCreateBodySafe,
  buildLocalCreateRequestBody,
  canSubmitLocalCreate,
  defaultLocalCreateFormValues,
  mapCreateApiResultToUiState,
  runLocalCreateSubmit,
  validateLocalCreateForm,
} from '../src/screens/b2c/localUserRequestCreateFlow';

const ROOT = path.resolve(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function pass(id: string, detail: string): void {
  console.log(`PASS Pack B ${id} — ${detail}`);
}

function sampleOption(
  id: string,
  name: string,
  types: readonly (typeof LOCAL_SERVICE_TYPE)[keyof typeof LOCAL_SERVICE_TYPE][] = [
    LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
  ]
): LocalCreateBusinessOption {
  return {
    businessId: id,
    displayName: name,
    supportedServiceTypes: [...types],
  };
}

function okCreate(id: string, businessId: string): LocalUserRequestCreateResult {
  return {
    id,
    requesterUserId: 'u1',
    businessId,
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
  // --- B1 authenticated provider request ---
  let jwtCalls = 0;
  let fetchedPath = '';
  const depsB1: ListLocalProvidersDeps = {
    getJwt: async () => {
      jwtCalls += 1;
      return 'session-jwt';
    },
    fetchJson: async <T>(path: string) => {
      fetchedPath = path;
      return {
        ok: true,
        status: 200,
        data: {
          items: [
            {
              businessId: 'biz-1',
              displayName: 'Alpha Cafe',
              supportedServiceTypes: [LOCAL_SERVICE_TYPE.GENERIC_REQUEST],
            },
          ],
          pagination: { limit: 100, skip: 0, returned: 1 },
        },
      } as ApiRequestResult<T>;
    },
  };
  const listed = await listLocalProviders(
    { serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST },
    depsB1
  );
  assert.equal(listed.ok, true);
  assert.equal(jwtCalls, 1);
  assert.ok(fetchedPath.startsWith('/api/local/providers?'));
  assert.ok(fetchedPath.includes('serviceType=GENERIC_REQUEST'));
  assert.ok(fetchedPath.includes('limit=100'));
  assert.ok(fetchedPath.includes('skip=0'));
  assert.equal(LOCAL_PROVIDER_LIST_CLIENT_LIMIT, 100);
  assert.equal(
    buildLocalProvidersQueryPath({ serviceType: LOCAL_SERVICE_TYPE.FIXER_HIRE }),
    '/api/local/providers?serviceType=FIXER_HIRE&limit=100&skip=0'
  );
  const noAuth = await listLocalProviders(
    { serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST },
    {
      getJwt: async () => null,
      fetchJson: async () => {
        throw new Error('must not fetch without JWT');
      },
    }
  );
  assert.equal(noAuth.ok, false);
  if (!noAuth.ok) assert.equal(noAuth.reason, 'auth');
  pass('B1', 'authenticated provider request');

  // --- B2 response contract ---
  assert.ok(
    mapLocalProviderPublicItem({
      businessId: 'b',
      displayName: 'N',
      supportedServiceTypes: [LOCAL_SERVICE_TYPE.GENERIC_REQUEST],
      status: 'ACTIVE',
      secret: true,
    })
  );
  const mappedPrivacy = mapLocalProviderPublicItem({
    businessId: 'b',
    displayName: 'N',
    supportedServiceTypes: [LOCAL_SERVICE_TYPE.GENERIC_REQUEST],
    status: 'ACTIVE',
  });
  assert.deepEqual(Object.keys(mappedPrivacy!).sort(), [
    'businessId',
    'displayName',
    'supportedServiceTypes',
  ]);
  assert.equal(mapLocalProviderPublicItem({ businessId: 'b', displayName: '  ', supportedServiceTypes: [] }), null);
  assert.equal(
    mapLocalProviderPublicItem({
      businessId: 'b',
      displayName: 'N',
      supportedServiceTypes: ['NOT_A_TYPE'],
    }),
    null
  );
  assert.equal(parseLocalProviderListData({ items: 'x', pagination: {} }), null);
  assert.ok(
    parseLocalProviderListData({
      items: [],
      pagination: { limit: 100, skip: 0, returned: 0 },
    })
  );
  pass('B2', 'response contract + privacy');

  // --- B3 provider loading states ---
  const idleEnabled = localCreateProviderSelectionEnabled('PROVIDER_IDLE', []);
  assert.equal(idleEnabled, false);
  assert.equal(localCreateProviderSelectionEnabled('PROVIDER_LOADING', []), false);
  assert.equal(
    localCreateProviderSelectionEnabled('PROVIDER_READY', [sampleOption('a', 'A')]),
    true
  );
  assert.equal(localCreateProviderSelectionEnabled('PROVIDER_EMPTY', []), false);
  assert.equal(
    localCreateProviderSelectionEnabled('PROVIDER_AUTH_REQUIRED_OR_EXPIRED', []),
    false
  );
  assert.equal(localCreateProviderSelectionEnabled('PROVIDER_NETWORK_ERROR', []), false);
  assert.equal(localCreateProviderSelectionEnabled('PROVIDER_SERVER_ERROR', []), false);

  const emptyLoad = await loadLocalCreateBusinessOptions(
    { serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST },
    {
      listProviders: async () => ({
        ok: true,
        path: '/api/local/providers',
        data: { items: [], pagination: { limit: 100, skip: 0, returned: 0 } },
      }),
    }
  );
  assert.equal(emptyLoad.status, 'PROVIDER_EMPTY');

  const authLoad = await loadLocalCreateBusinessOptions(
    { serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST },
    {
      listProviders: async () => ({
        ok: false,
        reason: 'auth',
        path: '/api/local/providers',
      }),
    }
  );
  assert.equal(authLoad.status, 'PROVIDER_AUTH_REQUIRED_OR_EXPIRED');

  const netLoad = await loadLocalCreateBusinessOptions(
    { serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST },
    {
      listProviders: async () => ({
        ok: false,
        reason: 'network',
        path: '/api/local/providers',
      }),
    }
  );
  assert.equal(netLoad.status, 'PROVIDER_NETWORK_ERROR');

  const serverLoad = await loadLocalCreateBusinessOptions(
    { serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST },
    {
      listProviders: async () => ({
        ok: false,
        reason: 'malformed',
        path: '/api/local/providers',
      }),
    }
  );
  assert.equal(serverLoad.status, 'PROVIDER_SERVER_ERROR');

  const readyLoad = await loadLocalCreateBusinessOptions(
    { serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST },
    {
      listProviders: async () => ({
        ok: true,
        path: '/api/local/providers',
        data: {
          items: [
            {
              businessId: 'biz-ready',
              displayName: 'Ready Biz',
              supportedServiceTypes: [LOCAL_SERVICE_TYPE.GENERIC_REQUEST],
            },
          ],
          pagination: { limit: 100, skip: 0, returned: 1 },
        },
      }),
    }
  );
  assert.equal(readyLoad.status, 'PROVIDER_READY');
  assert.equal(readyLoad.options[0]?.displayName, 'Ready Biz');
  pass('B3', 'provider loading states');

  // --- B4 human-readable selection ---
  const opt = findLocalCreateBusinessOption('biz-ready', readyLoad.options);
  assert.equal(opt?.displayName, 'Ready Biz');
  assert.ok(!JSON.stringify(opt).includes('status'));
  const composer = read('src/components/local/LocalUserRequestCreateComposer.tsx');
  assert.equal(composer.includes('local-create-business-id'), false);
  assert.equal(/Paste business/i.test(composer), false);
  assert.ok(composer.includes('biz.displayName'));
  pass('B4', 'human-readable selection');

  // --- B5 service-type change semantics (pure) ---
  assert.equal(
    isLocalProviderSelectionCompatible(
      'biz-ready',
      LOCAL_SERVICE_TYPE.FIXER_HIRE,
      readyLoad.options
    ),
    false
  );
  assert.equal(
    isLocalProviderSelectionCompatible(
      'biz-ready',
      LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
      readyLoad.options
    ),
    true
  );
  assert.ok(composer.includes('businessId: \'\''));
  assert.ok(composer.includes('loadProvidersForServiceType'));
  pass('B5', 'service-type change clears selection');

  // --- B6 stale response ---
  assert.equal(
    shouldApplyProviderListResult({
      responseGeneration: 1,
      activeGeneration: 2,
      responseServiceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
      activeServiceType: LOCAL_SERVICE_TYPE.FIXER_HIRE,
    }),
    false
  );
  assert.equal(
    shouldApplyProviderListResult({
      responseGeneration: 2,
      activeGeneration: 2,
      responseServiceType: LOCAL_SERVICE_TYPE.FIXER_HIRE,
      activeServiceType: LOCAL_SERVICE_TYPE.FIXER_HIRE,
    }),
    true
  );
  assert.equal(
    shouldApplyProviderListResult({
      responseGeneration: 2,
      activeGeneration: 2,
      responseServiceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
      activeServiceType: LOCAL_SERVICE_TYPE.FIXER_HIRE,
    }),
    false
  );
  pass('B6', 'stale-response protection');

  // --- B7 no fallback ---
  const source = read('src/services/local/localCreateBusinessSource.ts');
  const model = read('src/services/local/localCreateBusinessOptionModel.ts');
  assert.equal(source.includes('viGlobalTourismApi'), false);
  assert.equal(source.includes('/api/tourism/discover'), false);
  assert.equal(composer.includes('viGlobalTourismApi'), false);
  assert.equal(model.includes('mapTourismDiscover'), false);
  assert.equal(composer.includes('knownBusinesses.map'), false);
  assert.ok(composer.includes('knownBusinesses: _knownBusinesses'));
  pass('B7', 'no Tourism/history/UUID fallback');

  // --- B8 submit guard ---
  const formNoType = defaultLocalCreateFormValues();
  assert.equal(formNoType.serviceType, null);
  assert.equal(canSubmitLocalCreate('IDLE', formNoType, readyLoad.options), false);
  const formNoSel = {
    ...defaultLocalCreateFormValues(),
    serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
    title: 'Help',
  };
  assert.equal(canSubmitLocalCreate('IDLE', formNoSel, readyLoad.options), false);
  const formOk = {
    ...defaultLocalCreateFormValues(),
    serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
    businessId: 'biz-ready',
    title: 'Need help',
  };
  assert.equal(validateLocalCreateForm(formOk, readyLoad.options), null);
  assert.equal(canSubmitLocalCreate('IDLE', formOk, readyLoad.options), true);
  assert.equal(canSubmitLocalCreate('SUBMITTING', formOk, readyLoad.options), false);
  const staleSel = {
    ...formOk,
    businessId: 'gone',
  };
  assert.equal(canSubmitLocalCreate('IDLE', staleSel, readyLoad.options), false);
  pass('B8', 'submit guards');

  // --- B9 create body ---
  const body = buildLocalCreateRequestBody(formOk);
  assert.equal(body.businessId, 'biz-ready');
  assert.equal(body.serviceType, LOCAL_SERVICE_TYPE.GENERIC_REQUEST);
  assert.equal(body.source, LOCAL_CREATE_CLIENT_SOURCE);
  assertLocalCreateBodySafe(body);
  for (const key of LOCAL_CREATE_FORBIDDEN_BODY_KEYS) {
    assert.equal(Object.prototype.hasOwnProperty.call(body, key), false);
  }
  pass('B9', 'create body');

  // --- B10 pre-await in-flight ---
  let jwtN = 0;
  let postN = 0;
  const inFlight = { current: false };
  let lockBeforeJwt = false;
  const [r1, r2] = await Promise.all([
    runLocalCreateSubmit({
      form: formOk,
      options: readyLoad.options,
      inFlight,
      deps: {
        getJwt: async () => {
          lockBeforeJwt = inFlight.current === true;
          jwtN += 1;
          await new Promise((r) => setTimeout(r, 15));
          return 'tok';
        },
        createRequest: async () => {
          postN += 1;
          return { ok: true, status: 201, data: okCreate('req-1', 'biz-ready') };
        },
      },
    }),
    runLocalCreateSubmit({
      form: formOk,
      options: readyLoad.options,
      inFlight,
      deps: {
        getJwt: async () => {
          jwtN += 1;
          return 'tok';
        },
        createRequest: async () => {
          postN += 1;
          return { ok: true, status: 201, data: okCreate('req-2', 'biz-ready') };
        },
      },
    }),
  ]);
  assert.equal(jwtN, 1);
  assert.equal(postN, 1);
  assert.equal(lockBeforeJwt, true);
  assert.equal(r1.uiState, 'CREATED_SUCCESS');
  assert.equal(r2.uiState, 'SUBMITTING');
  pass('B10', 'pre-await one-in-flight');

  // --- B11 / B12 provider-authority recovery (code-discriminated; no auto POST retry) ---
  assert.ok(composer.includes("'post_reject_refresh'"));
  assert.ok(composer.includes('providerRefreshBudgetRef'));
  assert.ok(composer.includes("recoveryAction === 'REFRESH_PROVIDER_AUTHORITY_ONCE'"));
  assert.ok(!composer.includes("result.uiState === 'SERVER_VALIDATION_ERROR' && form.serviceType"));

  let b11Posts = 0;
  const b11 = await runLocalCreateSubmit({
    form: formOk,
    options: readyLoad.options,
    inFlight: { current: false },
    deps: {
      getJwt: async () => 'tok',
      createRequest: async () => {
        b11Posts += 1;
        return {
          ok: false,
          status: 404,
          code: 'provider_not_available',
          error: 'Provider not available',
        };
      },
    },
  });
  assert.equal(b11Posts, 1);
  assert.equal(b11.uiState, 'SERVER_VALIDATION_ERROR');
  assert.equal(b11.recoveryAction, 'REFRESH_PROVIDER_AUTHORITY_ONCE');
  assert.equal(b11.outcome?.kind, 'provider_unavailable');
  // Composer arms exactly one post_reject GET (budget=1) — proven in C1 harness;
  // coordinator itself does not POST-retry.
  pass('B11', '404+provider_not_available — 1 POST, recovery REFRESH, 0 POST retry');

  let b12Posts = 0;
  const b12 = await runLocalCreateSubmit({
    form: formOk,
    options: readyLoad.options,
    inFlight: { current: false },
    deps: {
      getJwt: async () => 'tok',
      createRequest: async () => {
        b12Posts += 1;
        return {
          ok: false,
          status: 400,
          code: 'service_type_not_supported',
          error: 'Unsupported service type for this provider',
        };
      },
    },
  });
  assert.equal(b12Posts, 1);
  assert.equal(b12.uiState, 'SERVER_VALIDATION_ERROR');
  assert.equal(b12.recoveryAction, 'REFRESH_PROVIDER_AUTHORITY_ONCE');
  assert.equal(b12.outcome?.kind, 'service_type_not_supported');

  // Negative: invalid_input must NOT behave like B12
  let invalidPosts = 0;
  const invalid = await runLocalCreateSubmit({
    form: formOk,
    options: readyLoad.options,
    inFlight: { current: false },
    deps: {
      getJwt: async () => 'tok',
      createRequest: async () => {
        invalidPosts += 1;
        return {
          ok: false,
          status: 400,
          code: 'invalid_input',
          error: 'Invalid local request',
        };
      },
    },
  });
  assert.equal(invalidPosts, 1);
  assert.equal(invalid.uiState, 'SERVER_VALIDATION_ERROR');
  assert.equal(invalid.recoveryAction, 'NONE');
  assert.equal(invalid.outcome?.kind, 'validation_error');

  // Status-only 404 without code must NOT refresh
  const bare404 = await runLocalCreateSubmit({
    form: formOk,
    options: readyLoad.options,
    inFlight: { current: false },
    deps: {
      getJwt: async () => 'tok',
      createRequest: async () => ({
        ok: false,
        status: 404,
        error: 'missing',
      }),
    },
  });
  assert.equal(bare404.recoveryAction, 'NONE');
  assert.equal(bare404.uiState, 'SERVER_VALIDATION_ERROR');
  pass('B12', '400+service_type_not_supported refreshes; invalid_input / bare 404 do not');

  // --- B13 create auth/rate/network/server regression ---
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 401, error: 'auth' }),
    'AUTH_REQUIRED_OR_EXPIRED'
  );
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 429, error: 'slow' }),
    'RATE_LIMITED'
  );
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 0, error: 'down', unreachable: true }),
    'NETWORK_RESULT_UNKNOWN'
  );
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 500, error: 'boom' }),
    'SERVER_ERROR'
  );
  pass('B13', 'create auth/rate/network/server mapping');

  // --- B14 post-create success markers ---
  assert.ok(composer.includes('onCreated(result.created)'));
  assert.ok(composer.includes('setRefreshWarning(true)'));
  assert.ok(composer.includes('CREATED_SUCCESS'));
  assert.ok(composer.includes('local-create-created-id'));
  pass('B14', 'post-create success + refresh warning');

  // --- B15 session change clearing ---
  assert.ok(composer.includes('PROVIDER_AUTH_REQUIRED_OR_EXPIRED'));
  assert.ok(composer.includes('clearProviderAuthority'));
  assert.ok(composer.includes('onAuthRequired()'));
  pass('B15', 'session/auth clears provider authority');

  // --- B16 i18n / a11y ---
  const en = JSON.parse(read('src/i18n/locales/en.json')) as {
    local: { userRequestStatus: { create: { feedback: Record<string, string>; providerListA11y: string } } };
  };
  const vi = JSON.parse(read('src/i18n/locales/vi.json')) as {
    local: { userRequestStatus: { create: { feedback: Record<string, string>; providerListA11y: string } } };
  };
  for (const key of [
    'chooseServiceType',
    'chooseProvider',
    'providersEmpty',
    'providerAuthRequired',
    'providerNetworkError',
    'providerServerError',
    'providerUnavailable',
  ]) {
    assert.ok(en.local.userRequestStatus.create.feedback[key], `en missing ${key}`);
    assert.ok(vi.local.userRequestStatus.create.feedback[key], `vi missing ${key}`);
  }
  assert.ok(en.local.userRequestStatus.create.providerListA11y);
  assert.ok(composer.includes('providerListA11y'));
  assert.ok(composer.includes('accessibilityState'));
  assert.equal(composer.includes('"Loading providers"'), false);
  pass('B16', 'i18n + accessibility');

  // --- B17 client freeze (server/schema untouched) ---
  assert.equal(fs.existsSync(path.join(ROOT, 'prisma/schema.prisma')), true);
  // Pack B must not touch prisma migration folder content in this change set — verified via git in CI.
  assert.ok(!source.includes('getPrisma'));
  assert.ok(!composer.includes('@prisma/client'));
  assert.ok(!read('src/services/local/localProviderListClient.ts').includes('@prisma/client'));
  assert.ok(composer.includes('REQUEST_ONLY_NO_CHARGE') || read('src/i18n/locales/en.json').includes('Request-only'));
  assert.equal(Object.prototype.hasOwnProperty.call(body, 'walletMode'), false);
  pass('B17', 'client freeze — no server authority move');

  console.log('[test-local-provider-eligibility-client-wiring] OK B1–B17');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
