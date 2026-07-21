/**
 * FC-P0 Local user request create client — focused pure + source-scan tests.
 *
 * Run: npx tsx scripts/test-local-user-request-create-client.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  LOCAL_CREATE_CLIENT_SOURCE,
  LOCAL_CREATE_FORBIDDEN_BODY_KEYS,
  LOCAL_REQUEST_SOURCE,
  LOCAL_SERVICE_TYPE,
  LOCAL_WALLET_MODE,
  isLocalServiceTypeClient,
} from '../src/domain/local/localServiceRequestClientContract';
import {
  assertLocalCreateBodySafe,
  buildLocalCreateRequestBody,
  canSubmitLocalCreate,
  defaultLocalCreateFormValues,
  fieldsEditableInLocalCreateState,
  findLikelyCreatedRequestId,
  mapCreateApiResultToUiState,
  validateLocalCreateForm,
} from '../src/screens/b2c/localUserRequestCreateFlow';

const ROOT = path.resolve(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function assertNoPrismaInMobileCreateGraph(): void {
  const files = [
    'src/screens/b2c/LocalUserRequestStatusScreen.tsx',
    'src/screens/b2c/localUserRequestCreateFlow.ts',
    'src/components/local/LocalUserRequestCreateComposer.tsx',
    'src/services/localUserRequestApi.ts',
    'src/domain/local/localServiceRequestClientContract.ts',
  ];
  for (const file of files) {
    const src = read(file);
    assert.equal(
      src.includes("@prisma/client") || src.includes('from \'@prisma/client\'') || src.includes('from "@prisma/client"'),
      false,
      `${file} must not import Prisma`
    );
  }
}

function run(): void {
  // DTO mapping + fixed source
  const form = {
    ...defaultLocalCreateFormValues(),
    businessId: '  biz-123  ',
    serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
    title: '  Need help  ',
    description: '  optional  ',
  };
  const body = buildLocalCreateRequestBody(form);
  assert.equal(body.businessId, 'biz-123');
  assert.equal(body.title, 'Need help');
  assert.equal(body.source, LOCAL_CREATE_CLIENT_SOURCE);
  assert.equal(body.source, LOCAL_REQUEST_SOURCE.LOCAL_SCREEN);
  assert.equal(body.serviceType, LOCAL_SERVICE_TYPE.GENERIC_REQUEST);
  assert.equal(body.description, 'optional');
  assertLocalCreateBodySafe(body);

  // Forbidden keys excluded
  for (const key of LOCAL_CREATE_FORBIDDEN_BODY_KEYS) {
    assert.equal(Object.prototype.hasOwnProperty.call(body, key), false, key);
  }
  assert.equal(Object.prototype.hasOwnProperty.call(body, 'requesterUserId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(body, 'status'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(body, 'walletMode'), false);

  // Required-field validation
  assert.ok(validateLocalCreateForm(defaultLocalCreateFormValues()));
  assert.equal(
    validateLocalCreateForm({
      businessId: 'b',
      serviceType: LOCAL_SERVICE_TYPE.FIXER_HIRE,
      title: 't',
      description: '',
    }),
    null
  );
  assert.equal(isLocalServiceTypeClient('NOT_REAL'), false);

  // Submit / editability machine
  assert.equal(canSubmitLocalCreate('IDLE', form), true);
  assert.equal(canSubmitLocalCreate('SUBMITTING', form), false);
  assert.equal(canSubmitLocalCreate('NETWORK_RESULT_UNKNOWN', form), false);
  assert.equal(canSubmitLocalCreate('CREATED_SUCCESS', form), false);
  assert.equal(fieldsEditableInLocalCreateState('SUBMITTING'), false);
  assert.equal(fieldsEditableInLocalCreateState('IDLE'), true);

  // HTTP mapping
  assert.equal(
    mapCreateApiResultToUiState({
      ok: true,
      status: 201,
      data: {
        id: 'req-1',
        requesterUserId: 'u',
        businessId: 'b',
        serviceId: null,
        serviceType: 'GENERIC_REQUEST',
        title: 't',
        status: 'REQUESTED',
        walletMode: LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE,
        walletPhase: 'NONE',
        totalVioCredits: null,
        heldVioCredits: null,
        releasedVioCredits: null,
        platformFeeVioCredits: null,
        providerEarningsVioCredits: null,
        message: 'ok',
      },
    }),
    'CREATED_SUCCESS'
  );
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 400, error: 'bad' }),
    'SERVER_VALIDATION_ERROR'
  );
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 401, error: 'auth' }),
    'AUTH_REQUIRED_OR_EXPIRED'
  );
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 404, error: 'missing' }),
    'SERVER_VALIDATION_ERROR'
  );
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 429, error: 'rate' }),
    'RATE_LIMITED'
  );
  assert.equal(
    mapCreateApiResultToUiState({ ok: false, status: 500, error: 'boom' }),
    'SERVER_ERROR'
  );
  assert.equal(
    mapCreateApiResultToUiState({
      ok: false,
      status: 0,
      error: 'net',
      unreachable: true,
    }),
    'NETWORK_RESULT_UNKNOWN'
  );

  // Created id recovery / expand helper
  assert.equal(
    findLikelyCreatedRequestId({
      createdRequestId: 'req-9',
      listIds: ['req-9', 'req-1'],
      title: 'Need help',
      businessId: 'biz-123',
      candidates: [],
    }),
    'req-9'
  );
  assert.equal(
    findLikelyCreatedRequestId({
      createdRequestId: null,
      listIds: ['a'],
      title: 'Need help',
      businessId: 'biz-123',
      candidates: [{ id: 'a', title: 'Need help', businessId: 'biz-123' }],
    }),
    'a'
  );

  // Source scans — adapter + auth + no retry + fixed source
  const apiSrc = read('src/services/localUserRequestApi.ts');
  assert.match(apiSrc, /createUserLocalServiceRequest/);
  assert.match(apiSrc, /POST.*\/api\/local\/requests|\/api\/local\/requests/);
  assert.match(apiSrc, /restApiFetchJson/);
  assert.equal(apiSrc.includes('EXPO_PUBLIC_DEV_REST_JWT'), false);
  assert.equal(/retry/i.test(apiSrc) && apiSrc.includes('createUserLocalServiceRequest') && /retry.*create/i.test(apiSrc), false);

  const apiClient = read('src/services/apiClient.ts');
  assert.match(apiClient, /getRestApiJwt/);
  assert.match(apiClient, /if \(jwt\) headers\.Authorization/);
  assert.equal(apiClient.includes('EXPO_PUBLIC_DEV_REST_JWT'), false);
  assert.equal(/for\s*\(.*retry|retryCount|maxRetries/i.test(apiClient), false);

  const composer = read('src/components/local/LocalUserRequestCreateComposer.tsx');
  assert.match(composer, /inFlightRef/);
  assert.match(composer, /SUBMITTING/);
  assert.match(composer, /LOCAL_CREATE_CLIENT_SOURCE|LOCAL_SCREEN/);
  assert.match(composer, /NETWORK_RESULT_UNKNOWN/);
  assert.match(composer, /createUserLocalServiceRequest/);

  const screen = read('src/screens/b2c/LocalUserRequestStatusScreen.tsx');
  assert.match(screen, /LocalUserRequestCreateComposer/);
  assert.match(screen, /setExpandedId\(result\.id\)/);
  assert.match(screen, /fetchUserLocalServiceRequests/);
  assert.match(screen, /cancelUserLocalServiceRequest/);
  assert.match(screen, /fetchUserLocalRequestTimeline/);
  assert.equal(screen.includes('Stack.Screen'), false);

  // List/timeline/cancel adapters unchanged signatures
  assert.match(apiSrc, /export async function fetchUserLocalServiceRequests/);
  assert.match(apiSrc, /export async function fetchUserLocalRequestTimeline/);
  assert.match(apiSrc, /export async function cancelUserLocalServiceRequest/);

  // i18n keys present
  const en = JSON.parse(read('src/i18n/locales/en.json')) as {
    local: { userRequestStatus: { create: { openBtn: string } } };
  };
  const vi = JSON.parse(read('src/i18n/locales/vi.json')) as {
    local: { userRequestStatus: { create: { openBtn: string } } };
  };
  assert.ok(en.local.userRequestStatus.create.openBtn.length > 0);
  assert.ok(vi.local.userRequestStatus.create.openBtn.length > 0);

  assertNoPrismaInMobileCreateGraph();

  console.log('[test-local-user-request-create-client] OK');
}

run();
