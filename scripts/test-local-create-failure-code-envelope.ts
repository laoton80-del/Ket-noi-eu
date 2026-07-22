/**
 * FC-P0 Local create — public failure-code envelope contract tests.
 *
 * Deterministic only — no DB, no migrate-apply, no live API.
 *
 * Run: npx tsx scripts/test-local-create-failure-code-envelope.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';

import {
  LOCAL_CREATE_FAILURE_CODE,
  isLocalCreateFailureCode,
  localCreateInvalidInputFailure,
  mapLocalCreateDomainFailureToPublic,
  type LocalCreateDomainFailureReason,
} from '../src/domain/local/localCreateFailureCodes';
import { postCreateLocalServiceRequest } from '../src/controllers/LocalRequestController';
import { jsonFail, jsonLocalCreateFail } from '../src/utils/apiEnvelope';
import { parseRestApiJsonEnvelope } from '../src/utils/restApiJsonEnvelope';
import {
  mapCreateApiResultToSubmitOutcome,
  classifyLocalCreateRecovery,
} from '../src/screens/b2c/localUserRequestCreateFlow';

const ROOT = path.resolve(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function pass(id: string, detail: string): void {
  console.log(`PASS envelope ${id} — ${detail}`);
}

function mockRes(): {
  res: Response;
  statusCode: number;
  body: unknown;
} {
  let statusCode = 200;
  let body: unknown = null;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  } as unknown as Response;
  return {
    res,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
  };
}

async function run(): Promise<void> {
  // --- Domain → public mapping ---
  const cases: ReadonlyArray<{
    reason: LocalCreateDomainFailureReason;
    status: number;
    code: string;
  }> = [
    {
      reason: 'provider_not_available',
      status: 404,
      code: LOCAL_CREATE_FAILURE_CODE.PROVIDER_NOT_AVAILABLE,
    },
    {
      reason: 'business_not_found',
      status: 404,
      code: LOCAL_CREATE_FAILURE_CODE.PROVIDER_NOT_AVAILABLE,
    },
    {
      reason: 'service_type_not_supported',
      status: 400,
      code: LOCAL_CREATE_FAILURE_CODE.SERVICE_TYPE_NOT_SUPPORTED,
    },
    {
      reason: 'invalid_input',
      status: 400,
      code: LOCAL_CREATE_FAILURE_CODE.INVALID_INPUT,
    },
    {
      reason: 'self_request_forbidden',
      status: 400,
      code: LOCAL_CREATE_FAILURE_CODE.SELF_REQUEST_FORBIDDEN,
    },
    {
      reason: 'service_business_mismatch',
      status: 400,
      code: LOCAL_CREATE_FAILURE_CODE.SERVICE_BUSINESS_MISMATCH,
    },
    {
      reason: 'service_not_found',
      status: 404,
      code: LOCAL_CREATE_FAILURE_CODE.SERVICE_NOT_FOUND,
    },
  ];

  for (const row of cases) {
    const mapped = mapLocalCreateDomainFailureToPublic(row.reason);
    assert.equal(mapped.status, row.status);
    assert.equal(mapped.code, row.code);
    assert.equal(typeof mapped.error, 'string');
    assert.ok(mapped.error.length > 0);
    assert.ok(!mapped.error.toLowerCase().includes('prisma'));
    assert.ok(!mapped.error.toLowerCase().includes('suspend'));
    assert.ok(!mapped.error.toLowerCase().includes('retired'));
    const boxed = mockRes();
    jsonLocalCreateFail(boxed.res, mapped.status, mapped.code, mapped.error);
    assert.equal(boxed.statusCode, row.status);
    assert.deepEqual(boxed.body, {
      success: false,
      code: row.code,
      error: mapped.error,
    });
  }
  pass('E1', 'domain reason → public status/code/error envelope');

  // --- Controller field validation (no DB) ---
  {
    const boxed = mockRes();
    await postCreateLocalServiceRequest(
      { authUserId: 'user-1', body: null } as unknown as Request,
      boxed.res
    );
    assert.equal(boxed.statusCode, 400);
    assert.deepEqual(boxed.body, {
      success: false,
      code: LOCAL_CREATE_FAILURE_CODE.INVALID_INPUT,
      error: 'Invalid JSON body',
    });
  }
  {
    const boxed = mockRes();
    await postCreateLocalServiceRequest(
      {
        authUserId: 'user-1',
        body: {
          businessId: 'biz-1',
          serviceType: 'GENERIC_REQUEST',
          title: 'Hello',
          source: 'NOT_A_SOURCE',
        },
      } as unknown as Request,
      boxed.res
    );
    assert.equal(boxed.statusCode, 400);
    assert.deepEqual(boxed.body, {
      success: false,
      code: LOCAL_CREATE_FAILURE_CODE.INVALID_INPUT,
      error: 'Invalid source',
    });
  }
  {
    const boxed = mockRes();
    await postCreateLocalServiceRequest(
      {
        authUserId: 'user-1',
        body: {
          businessId: 'biz-1',
          serviceType: 'GENERIC_REQUEST',
          title: '',
          source: 'LOCAL_SCREEN',
        },
      } as unknown as Request,
      boxed.res
    );
    assert.equal(boxed.statusCode, 400);
    const body = boxed.body as { success: false; code: string; error: string };
    assert.equal(body.success, false);
    assert.equal(body.code, LOCAL_CREATE_FAILURE_CODE.INVALID_INPUT);
    assert.ok(body.error.includes('required'));
  }
  {
    const boxed = mockRes();
    await postCreateLocalServiceRequest(
      { body: { title: 'x' } } as unknown as Request,
      boxed.res
    );
    assert.equal(boxed.statusCode, 401);
    assert.deepEqual(boxed.body, { success: false, error: 'Unauthorized' });
    assert.ok(!('code' in (boxed.body as object)));
  }
  pass('E2', 'controller field validation + 401 without code');

  // --- jsonFail backward compatibility ---
  {
    const boxed = mockRes();
    jsonFail(boxed.res, 'Legacy error', 400);
    assert.deepEqual(boxed.body, { success: false, error: 'Legacy error' });
    assert.ok(!('code' in (boxed.body as object)));
  }
  {
    const boxed = mockRes();
    jsonFail(boxed.res, 'With code', 404, 'provider_not_available');
    assert.deepEqual(boxed.body, {
      success: false,
      error: 'With code',
      code: 'provider_not_available',
    });
  }
  {
    const fail = localCreateInvalidInputFailure('Invalid title shape');
    assert.equal(fail.code, LOCAL_CREATE_FAILURE_CODE.INVALID_INPUT);
  }
  pass('E3', 'jsonFail optional code preserves legacy shape');

  // --- Allowlist runtime validation ---
  assert.equal(isLocalCreateFailureCode('provider_not_available'), true);
  assert.equal(isLocalCreateFailureCode('service_type_not_supported'), true);
  assert.equal(isLocalCreateFailureCode('invalid_input'), true);
  assert.equal(isLocalCreateFailureCode('self_request_forbidden'), true);
  assert.equal(isLocalCreateFailureCode('service_business_mismatch'), true);
  assert.equal(isLocalCreateFailureCode('service_not_found'), true);
  assert.equal(isLocalCreateFailureCode('unknown_code'), false);
  assert.equal(isLocalCreateFailureCode(null), false);
  assert.equal(isLocalCreateFailureCode(123), false);
  assert.equal(isLocalCreateFailureCode(''), false);
  pass('E4', 'LocalCreateFailureCode allowlist');

  // --- Client envelope parse preserves code (RN-free) ---
  {
    const parsed = parseRestApiJsonEnvelope(
      JSON.stringify({
        success: false,
        code: 'service_type_not_supported',
        error: 'Unsupported service type for this provider',
      })
    );
    assert.deepEqual(parsed, {
      success: false,
      code: 'service_type_not_supported',
      error: 'Unsupported service type for this provider',
    });
    const outcome = mapCreateApiResultToSubmitOutcome({
      ok: false,
      status: 400,
      code: parsed && !parsed.success ? parsed.code : undefined,
      error: parsed && !parsed.success ? parsed.error : '',
    });
    assert.equal(outcome.kind, 'service_type_not_supported');
    assert.equal(classifyLocalCreateRecovery(outcome), 'REFRESH_PROVIDER_AUTHORITY_ONCE');
  }
  {
    const parsed = parseRestApiJsonEnvelope(
      JSON.stringify({ success: false, error: 'Legacy only' })
    );
    assert.deepEqual(parsed, { success: false, error: 'Legacy only' });
    assert.ok(parsed && !parsed.success && parsed.code === undefined);
  }
  {
    const parsed = parseRestApiJsonEnvelope(
      JSON.stringify({ success: false, error: 'bad', code: 99 })
    );
    assert.deepEqual(parsed, { success: false, error: 'bad' });
  }
  {
    const apiClientSrc = read('src/services/apiClient.ts');
    assert.ok(apiClientSrc.includes('parseRestApiJsonEnvelope'));
    assert.ok(apiClientSrc.includes('code?: string'));
  }
  pass('E5', 'client preserves status/code/error; drops malformed code');

  // --- Source gates ---
  const controller = read('src/controllers/LocalRequestController.ts');
  assert.ok(controller.includes('jsonLocalCreateFail'));
  assert.ok(controller.includes('mapLocalCreateDomainFailureToPublic'));
  const createFnStart = controller.indexOf('export async function postCreateLocalServiceRequest');
  assert.ok(createFnStart >= 0);
  const createFn = controller.slice(createFnStart);
  assert.ok(createFn.includes('jsonLocalCreateFail'));
  assert.ok(!createFn.includes('msgMap[result.reason]'));
  const composer = read('src/components/local/LocalUserRequestCreateComposer.tsx');
  assert.ok(composer.includes("recoveryAction === 'REFRESH_PROVIDER_AUTHORITY_ONCE'"));
  assert.ok(!composer.includes("result.uiState === 'SERVER_VALIDATION_ERROR' && form.serviceType"));
  pass('E6', 'controller/composer source gates');

  console.log('\nAll Local create failure-code envelope tests PASS.');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
