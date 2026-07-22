/**
 * FC-P0 Local create — Pack B recovery discrimination (C1–C20).
 *
 * Behavioral counters for POST / create + automatic provider GET refresh.
 * Deterministic mocks only — no live API, no migrate-apply, no deploy.
 *
 * Run: npx tsx scripts/test-local-create-pack-b-recovery-discrimination.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  LOCAL_SERVICE_TYPE,
  LOCAL_WALLET_MODE,
  type LocalUserRequestCreateResult,
} from '../src/domain/local/localServiceRequestClientContract';
import { LOCAL_CREATE_FAILURE_CODE } from '../src/domain/local/localCreateFailureCodes';
import type { ApiRequestResult } from '../src/services/apiClient';
import {
  loadLocalCreateBusinessOptions,
  shouldApplyProviderListResult,
  type LocalCreateBusinessOption,
  type LocalCreateProviderSourceStatus,
} from '../src/services/local/localCreateBusinessSource';
import {
  classifyLocalCreateRecovery,
  mapCreateApiResultToSubmitOutcome,
  mapSubmitOutcomeToUiState,
  runLocalCreateSubmit,
  type LocalCreateFormValues,
  type LocalCreateSubmitResult,
} from '../src/screens/b2c/localUserRequestCreateFlow';

const ROOT = path.resolve(__dirname, '..');

function pass(id: string, detail: string): void {
  console.log(`PASS recovery ${id} — ${detail}`);
}

function sampleOption(
  id: string,
  name: string
): LocalCreateBusinessOption {
  return {
    businessId: id,
    displayName: name,
    supportedServiceTypes: [LOCAL_SERVICE_TYPE.GENERIC_REQUEST],
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

type Counters = {
  jwt: number;
  post: number;
  autoGet: number;
  explicitGet: number;
  totalGet: number;
  autoPostRetry: number;
};

type Session = {
  form: LocalCreateFormValues;
  options: readonly LocalCreateBusinessOption[];
  providerStatus: LocalCreateProviderSourceStatus;
  providerGeneration: number;
  providerRefreshBudget: number;
  providerAuthorityRejected: boolean;
  counters: Counters;
};

function freshSession(options: readonly LocalCreateBusinessOption[]): Session {
  return {
    form: {
      businessId: options[0]?.businessId ?? '',
      serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
      title: 'Need help',
      description: 'Details stay',
    },
    options: [...options],
    providerStatus: 'PROVIDER_READY',
    providerGeneration: 1,
    providerRefreshBudget: 0,
    providerAuthorityRejected: false,
    counters: {
      jwt: 0,
      post: 0,
      autoGet: 0,
      explicitGet: 0,
      totalGet: 0,
      autoPostRetry: 0,
    },
  };
}

/** Composer: on REFRESH_PROVIDER_AUTHORITY_ONCE — clear selection + arm one-shot budget. */
function beginProviderAuthorityReject(session: Session, submit: LocalCreateSubmitResult): void {
  if (submit.recoveryAction !== 'REFRESH_PROVIDER_AUTHORITY_ONCE') return;
  session.providerAuthorityRejected = true;
  session.form = { ...session.form, businessId: '' };
  session.providerRefreshBudget = 1;
}

/**
 * Mirrors loadProvidersForServiceType(..., 'post_reject_refresh') budget gate + generation.
 */
async function runPostRejectProviderGet(
  session: Session,
  listResult: Awaited<ReturnType<typeof loadLocalCreateBusinessOptions>>
): Promise<void> {
  if (session.form.serviceType == null) return;
  if (session.providerRefreshBudget <= 0) return;
  session.providerRefreshBudget -= 1;

  session.providerGeneration += 1;
  const generation = session.providerGeneration;
  session.providerStatus = 'PROVIDER_LOADING';
  session.options = [];
  session.form = { ...session.form, businessId: '' };

  session.counters.autoGet += 1;
  session.counters.totalGet += 1;

  const serviceType = session.form.serviceType;
  if (serviceType == null) return;

  if (
    !shouldApplyProviderListResult({
      responseGeneration: generation,
      activeGeneration: session.providerGeneration,
      responseServiceType: serviceType,
      activeServiceType: serviceType,
    })
  ) {
    return;
  }

  session.providerStatus = listResult.status;
  session.options = listResult.options;
  if (listResult.status !== 'PROVIDER_READY' || listResult.options.length === 0) {
    session.form = { ...session.form, businessId: '' };
  }
}

/** Explicit user retryProviders — mode 'user' (no post_reject budget gate). */
async function runExplicitProviderGet(
  session: Session,
  listResult: Awaited<ReturnType<typeof loadLocalCreateBusinessOptions>>
): Promise<void> {
  if (session.form.serviceType == null) return;

  session.providerGeneration += 1;
  const generation = session.providerGeneration;
  session.providerStatus = 'PROVIDER_LOADING';
  session.options = [];
  session.form = { ...session.form, businessId: '' };

  session.counters.explicitGet += 1;
  session.counters.totalGet += 1;

  const serviceType = session.form.serviceType;
  if (serviceType == null) return;

  if (
    !shouldApplyProviderListResult({
      responseGeneration: generation,
      activeGeneration: session.providerGeneration,
      responseServiceType: serviceType,
      activeServiceType: serviceType,
    })
  ) {
    return;
  }

  session.providerStatus = listResult.status;
  session.options = listResult.options;
  if (listResult.status !== 'PROVIDER_READY' || listResult.options.length === 0) {
    session.form = { ...session.form, businessId: '' };
  }
}

async function applyAuthorityRejectRefresh(
  session: Session,
  submit: LocalCreateSubmitResult,
  listResult: Awaited<ReturnType<typeof loadLocalCreateBusinessOptions>>
): Promise<void> {
  beginProviderAuthorityReject(session, submit);
  await runPostRejectProviderGet(session, listResult);
}

async function submitOnce(
  session: Session,
  createResult: ApiRequestResult<LocalUserRequestCreateResult>
): Promise<LocalCreateSubmitResult> {
  const titleBefore = session.form.title;
  const detailsBefore = session.form.description;
  const businessBefore = session.form.businessId;
  const optionsBefore = session.options;
  const generationBefore = session.providerGeneration;
  const statusBefore = session.providerStatus;

  const submit = await runLocalCreateSubmit({
    form: session.form,
    options: session.options,
    inFlight: { current: false },
    deps: {
      getJwt: async () => {
        session.counters.jwt += 1;
        return 'tok';
      },
      createRequest: async () => {
        session.counters.post += 1;
        return createResult;
      },
    },
  });

  // Coordinator never auto-retries POST.
  assert.equal(session.counters.autoPostRetry, 0);
  assert.ok(session.form.title === titleBefore);
  assert.ok(session.form.description === detailsBefore);

  if (submit.recoveryAction === 'NONE') {
    assert.equal(session.form.businessId, businessBefore);
    assert.deepEqual(session.options, optionsBefore);
    assert.equal(session.providerGeneration, generationBefore);
    assert.equal(session.providerStatus, statusBefore);
    assert.equal(session.counters.autoGet, 0);
  }

  return submit;
}

async function run(): Promise<void> {
  const readyOptions = [sampleOption('biz-ready', 'Ready Biz')];
  const refreshReady = await loadLocalCreateBusinessOptions(
    { serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST },
    {
      listProviders: async () => ({
        ok: true,
        path: '/api/local/providers',
        data: {
          items: [
            {
              businessId: 'biz-alt',
              displayName: 'Alt Biz',
              supportedServiceTypes: [LOCAL_SERVICE_TYPE.GENERIC_REQUEST],
            },
          ],
          pagination: { limit: 100, skip: 0, returned: 1 },
        },
      }),
    }
  );
  const refreshFail = await loadLocalCreateBusinessOptions(
    { serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST },
    {
      listProviders: async () => ({
        ok: false,
        reason: 'network',
        path: '/api/local/providers',
      }),
    }
  );

  // --- C1 provider_not_available ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 404,
      code: LOCAL_CREATE_FAILURE_CODE.PROVIDER_NOT_AVAILABLE,
      error: 'Provider not available',
    });
    assert.equal(s.counters.post, 1);
    assert.equal(submit.recoveryAction, 'REFRESH_PROVIDER_AUTHORITY_ONCE');
    assert.equal(submit.outcome?.kind, 'provider_unavailable');
    assert.equal(mapSubmitOutcomeToUiState(submit.outcome!), 'SERVER_VALIDATION_ERROR');
    await applyAuthorityRejectRefresh(s, submit, refreshReady);
    assert.equal(s.counters.autoGet, 1);
    assert.equal(s.counters.totalGet, 1);
    assert.equal(s.counters.autoPostRetry, 0);
    assert.equal(s.form.businessId, '');
    assert.equal(s.form.title, 'Need help');
    assert.equal(s.form.description, 'Details stay');
    assert.equal(s.providerStatus, 'PROVIDER_READY');
    assert.equal(s.options[0]?.businessId, 'biz-alt');
    assert.equal(s.providerAuthorityRejected, true);
    // second POST blocked until new selection — empty businessId fails validation
    const blocked = await runLocalCreateSubmit({
      form: s.form,
      options: s.options,
      inFlight: { current: false },
      deps: {
        getJwt: async () => {
          s.counters.jwt += 1;
          return 'tok';
        },
        createRequest: async () => {
          s.counters.post += 1;
          s.counters.autoPostRetry += 1;
          return { ok: true, status: 201, data: okCreate('x', 'biz-alt') };
        },
      },
    });
    assert.equal(blocked.uiState, 'VALIDATION_ERROR');
    assert.equal(s.counters.post, 1);
    assert.equal(s.counters.autoPostRetry, 0);
  }
  pass('C1', 'provider_not_available — 1 POST, 1 auto GET, provider cleared');

  // --- C2 service_type_not_supported ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 400,
      code: LOCAL_CREATE_FAILURE_CODE.SERVICE_TYPE_NOT_SUPPORTED,
      error: 'Unsupported service type for this provider',
    });
    assert.equal(submit.recoveryAction, 'REFRESH_PROVIDER_AUTHORITY_ONCE');
    assert.equal(submit.outcome?.kind, 'service_type_not_supported');
    await applyAuthorityRejectRefresh(s, submit, refreshReady);
    assert.equal(s.counters.post, 1);
    assert.equal(s.counters.autoGet, 1);
    assert.equal(s.form.businessId, '');
    assert.equal(s.form.serviceType, LOCAL_SERVICE_TYPE.GENERIC_REQUEST);
    assert.equal(s.form.title, 'Need help');
  }
  pass('C2', 'service_type_not_supported — 1 POST, 1 auto GET');

  // --- C3 invalid_input ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 400,
      code: LOCAL_CREATE_FAILURE_CODE.INVALID_INPUT,
      error: 'Invalid local request',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(s.form.businessId, 'biz-ready');
    assert.equal(s.counters.autoGet, 0);
    assert.equal(s.providerGeneration, 1);
    assert.equal(s.providerStatus, 'PROVIDER_READY');
  }
  pass('C3', 'invalid_input — no GET, provider preserved');

  // --- C4 self_request_forbidden ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 400,
      code: LOCAL_CREATE_FAILURE_CODE.SELF_REQUEST_FORBIDDEN,
      error: 'Self-request is prohibited for integrity reasons.',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(s.form.businessId, 'biz-ready');
    assert.equal(s.counters.autoGet, 0);
  }
  pass('C4', 'self_request_forbidden — no GET');

  // --- C5 service_business_mismatch ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 400,
      code: LOCAL_CREATE_FAILURE_CODE.SERVICE_BUSINESS_MISMATCH,
      error: 'Service does not belong to the given business',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(s.form.businessId, 'biz-ready');
    assert.equal(s.counters.autoGet, 0);
  }
  pass('C5', 'service_business_mismatch — no GET');

  // --- C6 service_not_found (non-provider 404) ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 404,
      code: LOCAL_CREATE_FAILURE_CODE.SERVICE_NOT_FOUND,
      error: 'Service not found',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(submit.outcome?.kind, 'validation_error');
    assert.equal(s.form.businessId, 'biz-ready');
    assert.equal(s.counters.autoGet, 0);
  }
  pass('C6', 'service_not_found — no GET (not provider authority)');

  // --- C7 missing code 400 ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 400,
      error: 'Legacy only',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(s.form.businessId, 'biz-ready');
    assert.equal(s.counters.autoGet, 0);
  }
  pass('C7', 'missing code 400 — fail closed, no GET');

  // --- C8 unknown code 400 ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 400,
      code: 'totally_unknown',
      error: 'whatever',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(s.form.businessId, 'biz-ready');
    assert.equal(s.counters.autoGet, 0);
  }
  pass('C8', 'unknown code 400 — fail closed');

  // --- C9 malformed / non-allowlisted treated as absent ---
  {
    const outcome = mapCreateApiResultToSubmitOutcome({
      ok: false,
      status: 400,
      error: 'bad',
      // code omitted after client drop of non-string
    });
    assert.equal(classifyLocalCreateRecovery(outcome), 'NONE');
    assert.equal(outcome.kind, 'validation_error');
  }
  pass('C9', 'malformed/absent code — no recovery');

  // --- C10 non-provider 404 (missing code or wrong code) ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 404,
      error: 'Business not found',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(s.counters.autoGet, 0);
    assert.equal(s.form.businessId, 'biz-ready');
  }
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 404,
      code: LOCAL_CREATE_FAILURE_CODE.INVALID_INPUT,
      error: 'weird',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(s.counters.autoGet, 0);
  }
  pass('C10', 'non-provider 404 — no status-only refresh');

  // --- C11 refresh GET fails ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 404,
      code: LOCAL_CREATE_FAILURE_CODE.PROVIDER_NOT_AVAILABLE,
      error: 'Provider not available',
    });
    await applyAuthorityRejectRefresh(s, submit, refreshFail);
    assert.equal(s.counters.post, 1);
    assert.equal(s.counters.autoGet, 1);
    // Budget spent — further post_reject GETs are no-ops
    await runPostRejectProviderGet(s, refreshFail);
    assert.equal(s.counters.autoGet, 1);
    assert.equal(s.counters.totalGet, 1);
    assert.equal(s.providerStatus, 'PROVIDER_NETWORK_ERROR');
    assert.equal(s.form.businessId, '');
    assert.equal(s.counters.autoPostRetry, 0);
  }
  pass('C11', 'refresh GET fails — no recursive GET, no POST retry');

  // --- C12 repeated render after rejection ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 400,
      code: LOCAL_CREATE_FAILURE_CODE.SERVICE_TYPE_NOT_SUPPORTED,
      error: 'Unsupported service type for this provider',
    });
    await applyAuthorityRejectRefresh(s, submit, refreshReady);
    assert.equal(s.counters.autoGet, 1);
    // Re-render must not re-arm budget or create another automatic GET
    await runPostRejectProviderGet(s, refreshReady);
    assert.equal(s.counters.autoGet, 1);
  }
  pass('C12', 'repeated render — no second automatic GET');

  // --- C13 explicit retry after failed refresh ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 404,
      code: LOCAL_CREATE_FAILURE_CODE.PROVIDER_NOT_AVAILABLE,
      error: 'Provider not available',
    });
    await applyAuthorityRejectRefresh(s, submit, refreshFail);
    assert.equal(s.counters.autoGet, 1);
    await runExplicitProviderGet(s, refreshReady);
    assert.equal(s.counters.explicitGet, 1);
    assert.equal(s.counters.autoGet, 1);
    assert.equal(s.counters.totalGet, 2);
    assert.equal(s.counters.post, 1);
  }
  pass('C13', 'explicit retry — one explicit GET, zero POST');

  // --- C14 stale prior GET ignored ---
  {
    let generation = 1;
    generation += 1; // rejection refresh
    const staleGen = 1;
    const activeGen = generation;
    assert.equal(
      shouldApplyProviderListResult({
        responseGeneration: staleGen,
        activeGeneration: activeGen,
        responseServiceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
        activeServiceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
      }),
      false
    );
    assert.equal(
      shouldApplyProviderListResult({
        responseGeneration: activeGen,
        activeGeneration: activeGen,
        responseServiceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
        activeServiceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
      }),
      true
    );
  }
  pass('C14', 'stale prior GET ignored after rejection refresh');

  // --- C15 401 ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(submit.uiState, 'AUTH_REQUIRED_OR_EXPIRED');
    assert.equal(s.counters.autoGet, 0);
  }
  pass('C15', '401 — zero compatibility GET');

  // --- C16 429 ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 429,
      error: 'slow',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(s.form.businessId, 'biz-ready');
    assert.equal(s.counters.autoGet, 0);
  }
  pass('C16', '429 — zero provider GET');

  // --- C17 network uncertainty ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 0,
      error: 'down',
      unreachable: true,
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(submit.uiState, 'NETWORK_RESULT_UNKNOWN');
    assert.equal(s.counters.autoGet, 0);
  }
  pass('C17', 'POST network unknown — zero recovery GET');

  // --- C18 5xx ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: false,
      status: 500,
      error: 'boom',
    });
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(s.form.businessId, 'biz-ready');
    assert.equal(s.counters.autoGet, 0);
  }
  pass('C18', '5xx — zero provider GET');

  // --- C19 pre-await lock ---
  {
    const options = readyOptions;
    const inFlight = { current: false };
    let jwtN = 0;
    let postN = 0;
    let lockBeforeJwt = false;
    const form: LocalCreateFormValues = {
      businessId: 'biz-ready',
      serviceType: LOCAL_SERVICE_TYPE.GENERIC_REQUEST,
      title: 'Need help',
      description: '',
    };
    const [a, b] = await Promise.all([
      runLocalCreateSubmit({
        form,
        options,
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
        form,
        options,
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
    assert.equal(a.uiState, 'CREATED_SUCCESS');
    assert.equal(b.uiState, 'SUBMITTING');
  }
  pass('C19', 'pre-await lock — one JWT, one POST');

  // --- C20 successful create ---
  {
    const s = freshSession(readyOptions);
    const submit = await submitOnce(s, {
      ok: true,
      status: 201,
      data: okCreate('req-ok', 'biz-ready'),
    });
    assert.equal(submit.uiState, 'CREATED_SUCCESS');
    assert.equal(submit.recoveryAction, 'NONE');
    assert.equal(submit.created?.id, 'req-ok');
    assert.equal(s.counters.autoGet, 0);
    assert.equal(s.form.businessId, 'biz-ready');
  }
  pass('C20', 'successful create — no recovery GET');

  // Composer must not refresh on UI state alone
  const composer = fs.readFileSync(
    path.join(ROOT, 'src/components/local/LocalUserRequestCreateComposer.tsx'),
    'utf8'
  );
  assert.ok(composer.includes("recoveryAction === 'REFRESH_PROVIDER_AUTHORITY_ONCE'"));
  assert.ok(!composer.includes("result.uiState === 'SERVER_VALIDATION_ERROR' && form.serviceType"));

  console.log('\nAll Pack B recovery discrimination C1–C20 PASS.');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
