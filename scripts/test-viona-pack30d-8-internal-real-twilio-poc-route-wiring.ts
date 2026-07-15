/**
 * Pack30D-8 — Internal real Twilio POC HTTP route wiring tests.
 *
 * Operator authorization: `APPROVE_PACK30D_8_STAGING_WIRING_INTERNAL_ROUTE`.
 * No live HTTP server, no live DB, no live Twilio call.
 *
 * Run: npx tsx scripts/test-viona-pack30d-8-internal-real-twilio-poc-route-wiring.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

import { postVionaInternalTriggerRealTwilioPoc } from '../src/controllers/VionaInternalRealTwilioPocController';
import {
  VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
  isVionaInternalRealTwilioPocRouteAllowed,
} from '../src/lib/viona/internalRoute/vionaInternalRealTwilioPocRouteGate';
import { vionaInternalDeploymentStageGateMiddleware } from '../src/middleware/vionaInternalDeploymentStageGateMiddleware';
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readSourceNoComments(relativePath: string): string {
  const raw = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function assertNoneMatch(files: readonly string[], patterns: readonly RegExp[], label: string): void {
  for (const file of files) {
    const source = readSourceNoComments(file);
    for (const pattern of patterns) {
      assert(!pattern.test(source), `${label}: ${file} must not match forbidden pattern ${pattern}`);
    }
  }
}

type FakeResponseState = { statusCode: number | null; body: unknown };

function createFakeResponse(): { res: any; state: FakeResponseState } {
  const state: FakeResponseState = { statusCode: null, body: null };
  const res: any = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return res;
    },
  };
  return { res, state };
}

function createFakeRequest(
  overrides: Partial<{ authUserId: string | undefined; body: Record<string, unknown> }> = {},
): any {
  return {
    authUserId: overrides.authUserId,
    body: overrides.body ?? {},
  };
}

let passed = 0;

async function runTest(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

async function main(): Promise<void> {
// ---------------------------------------------------------------------------
// 1–2. Source scan — gate + auth ordering
// ---------------------------------------------------------------------------

await runTest('internalRoutes applies deployment-stage gate before viona sub-router', () => {
  const source = readSourceNoComments('../src/routes/internalRoutes.ts');
  const gateIdx = source.indexOf('vionaInternalDeploymentStageGateMiddleware');
  const vionaMountIdx = source.indexOf("internalRouter.use('/viona'");
  const authIdx = source.indexOf('authMiddleware');
  const routeIdx = source.indexOf('/trigger-real-twilio-poc');
  assert(gateIdx >= 0, 'gate middleware must be registered');
  assert(vionaMountIdx >= 0, 'viona sub-router must be mounted');
  assert(authIdx >= 0, 'authMiddleware must be registered');
  assert(routeIdx >= 0, 'trigger-real-twilio-poc route must be registered');
  assert(gateIdx < vionaMountIdx, 'gate must run before viona sub-router is mounted');
  assert(authIdx < routeIdx, 'auth must run before route handler registration');
});

await runTest('app.ts mounts internalRouter at /api/internal', () => {
  const source = readSourceNoComments('../src/app.ts');
  assert(source.includes("app.use('/api/internal', internalRouter)"), 'app must mount internal router');
});

// ---------------------------------------------------------------------------
// 3–6. Deployment-stage gate pure function
// ---------------------------------------------------------------------------

await runTest('gate allows staging deployment stage', () => {
  assert(
    isVionaInternalRealTwilioPocRouteAllowed({ VIONA_DEPLOYMENT_STAGE: 'staging' }),
    'staging must be allowed',
  );
});

await runTest('gate allows local/dev deployment stage', () => {
  assert(
    isVionaInternalRealTwilioPocRouteAllowed({ VIONA_DEPLOYMENT_STAGE: 'development' }),
    'development must be allowed',
  );
  assert(
    isVionaInternalRealTwilioPocRouteAllowed({ VIONA_DEPLOYMENT_STAGE: 'local' }),
    'local alias must be allowed',
  );
});

await runTest('gate blocks production deployment stage', () => {
  assert(
    !isVionaInternalRealTwilioPocRouteAllowed({ VIONA_DEPLOYMENT_STAGE: 'production' }),
    'production must be blocked',
  );
});

await runTest('gate blocks unknown deployment stage', () => {
  assert(!isVionaInternalRealTwilioPocRouteAllowed({}), 'unset stage must be blocked');
  assert(
    !isVionaInternalRealTwilioPocRouteAllowed({ VIONA_DEPLOYMENT_STAGE: 'qa' }),
    'unknown stage must be blocked',
  );
});

// ---------------------------------------------------------------------------
// 7. Gate middleware returns 403 when blocked
// ---------------------------------------------------------------------------

await runTest('gate middleware returns 403 on production deployment', () => {
  const { res, state } = createFakeResponse();
  let nextCalled = false;
  vionaInternalDeploymentStageGateMiddleware(
    createFakeRequest(),
    res,
    () => {
      nextCalled = true;
    },
    { isAllowed: () => false },
  );
  assert(!nextCalled, 'next must not be called when blocked');
  assert(state.statusCode === 403, 'must return 403');
  assert(
    (state.body as { success?: boolean; error?: string }).success === false,
    'body must be failure envelope',
  );
});

// ---------------------------------------------------------------------------
// 8–12. Controller — fake route executor, no DB/Twilio
// ---------------------------------------------------------------------------

await runTest('unauthenticated request -> 401', async () => {
  const { res, state } = createFakeResponse();
  await postVionaInternalTriggerRealTwilioPoc(createFakeRequest({ authUserId: undefined }), res, {
    coordinator: async () => {
      throw new Error('coordinator must not be called');
    },
  });
  assert(state.statusCode === 401, 'expected 401');
});

await runTest('missing requestId -> 400', async () => {
  const { res, state } = createFakeResponse();
  let called = false;
  await postVionaInternalTriggerRealTwilioPoc(
    createFakeRequest({
      authUserId: 'user-1',
      body: { operatorApprovalGranted: true, userConsentGranted: true },
    }),
    res,
    {
      coordinator: async () => {
        called = true;
        return { ok: false, reason: 'invalid_input' };
      },
    },
  );
  assert(!called, 'coordinator must not be called');
  assert(state.statusCode === 400, 'expected 400');
});

await runTest('missing approval flags -> 400', async () => {
  const { res, state } = createFakeResponse();
  let called = false;
  await postVionaInternalTriggerRealTwilioPoc(
    createFakeRequest({
      authUserId: 'user-1',
      body: { requestId: 'req-1' },
    }),
    res,
    {
      coordinator: async () => {
        called = true;
        return { ok: false, reason: 'invalid_input' };
      },
    },
  );
  assert(!called, 'coordinator must not be called');
  assert(state.statusCode === 400, 'expected 400');
});

await runTest('happy path -> 200 and forced magic numbers passed to coordinator', async () => {
  const { res, state } = createFakeResponse();
  let capturedInput: Record<string, unknown> | null = null;
  await postVionaInternalTriggerRealTwilioPoc(
    createFakeRequest({
      authUserId: 'user-1',
      body: {
        requestId: 'req-1',
        operatorApprovalGranted: true,
        userConsentGranted: true,
        messageBody: 'hello staging',
      },
    }),
    res,
    {
      coordinator: async (input) => {
        capturedInput = { ...input };
        return {
          ok: true,
          requestId: 'req-1',
          attemptId: 'attempt-1',
          fromStatus: 'triage',
          finalStatus: 'completed',
          providerInvoked: true,
        };
      },
    },
  );
  assert(state.statusCode === 200, 'expected 200');
  assert(capturedInput != null, 'coordinator must be called');
  assert(
    capturedInput!.fromNumber === VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
    'fromNumber must be forced magic number',
  );
  assert(
    capturedInput!.toNumber === VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
    'toNumber must be forced magic number',
  );
  assert(capturedInput!.body === 'hello staging', 'messageBody must pass through');
  const data = (state.body as { success?: boolean; data?: Record<string, unknown> }).data;
  assert(data?.finalStatus === 'completed', 'finalStatus must be returned');
  assert(
    (data?.safety as { forcedToNumber?: string })?.forcedToNumber ===
      VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
    'safety metadata must be present',
  );
});

await runTest('coordinator invalid_state -> 404', async () => {
  const { res, state } = createFakeResponse();
  await postVionaInternalTriggerRealTwilioPoc(
    createFakeRequest({
      authUserId: 'user-1',
      body: {
        requestId: 'missing',
        operatorApprovalGranted: true,
        userConsentGranted: true,
      },
    }),
    res,
    {
      coordinator: async () => ({ ok: false, reason: 'invalid_state' }),
    },
  );
  assert(state.statusCode === 404, 'expected 404');
});

// ---------------------------------------------------------------------------
// 13–15. Source scan — no bypass of service-layer protections
// ---------------------------------------------------------------------------

await runTest('controller delegates to Pack40D coordinator only', () => {
  const source = readSourceNoComments('../src/controllers/VionaInternalRealTwilioPocController.ts');
  assert(
    source.includes('executeVionaRequestBusinessFlow'),
    'must call Pack40D coordinator',
  );
  assert(
    !source.includes('previewVionaExecutionPlanRealProviderPocRoute'),
    'must not call legacy real-provider POC route directly',
  );
  assert(
    !source.includes('executeVionaTwilioTestPocReal('),
    'must not call executeVionaTwilioTestPocReal directly',
  );
});

await runTest('controller never reads fromNumber/toNumber from request body', () => {
  const source = readSourceNoComments('../src/controllers/VionaInternalRealTwilioPocController.ts');
  assert(!source.includes('body.fromNumber'), 'must not accept body.fromNumber');
  assert(!source.includes('body.toNumber'), 'must not accept body.toNumber');
  assert(
    source.includes('VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER'),
    'must use forced magic number constant',
  );
});

await runTest('forbidden bypass patterns absent from new controller/routes', () => {
  assertNoneMatch(
    [
      '../src/controllers/VionaInternalRealTwilioPocController.ts',
      '../src/routes/internalRoutes.ts',
    ],
    [
      /isRealProviderExecutionEnabled\s*\(\s*\)\s*=\s*true/,
      /PACK30_REAL_PROVIDER_EXECUTION_ENABLED\s*=\s*['"]true['"]/,
      /evaluateVionaProviderCircuitBreaker/,
    ],
    'no flag/circuit-breaker bypass in HTTP layer',
  );
});

// ---------------------------------------------------------------------------
// 16. Regression — prior Pack30D suites still pass
// ---------------------------------------------------------------------------

await runTest('regression: Pack30D-7 staging deployment-stage gating suite', () => {
  execSync('npx tsx scripts/test-viona-pack30d-7-staging-deployment-stage-gating.ts', {
    stdio: 'pipe',
    cwd: path.resolve(__dirname, '..'),
  });
});

await runTest('regression: Pack30B execution-plan route wiring suite', () => {
  execSync('npx tsx scripts/test-viona-pack30b-execution-plan-route.ts', {
    stdio: 'pipe',
    cwd: path.resolve(__dirname, '..'),
  });
});

console.log(`\nPack30D-8 internal route wiring: ${passed}/${passed} PASS`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
