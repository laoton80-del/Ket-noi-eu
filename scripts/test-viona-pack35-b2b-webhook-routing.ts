/**
 * Pack35 — B2B Omni-Channel Webhook & Agent Routing: implementation test suite.
 *
 * Operator phrase: APPROVE_PACK35_B2B_WEBHOOK_ROUTING_IMPLEMENTATION.
 * Covers the exact 8 required test-plan items from
 * docs/product/VIONA_PACK35_B2B_WEBHOOK_ROUTING_PLAN.md §10. Uses stable content/structural
 * scans only — no brittle `git diff origin/master` assertions (Pack34.5 lesson).
 *
 * Run (pure tests, no DB/network):
 *   npx tsx scripts/test-viona-pack35-b2b-webhook-routing.ts
 * Run including live-DB channel-resolution smoke test:
 *   npx tsx scripts/test-viona-pack35-b2b-webhook-routing.ts --with-db
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  postVionaWebhookMerchantAgent,
  type VionaWebhookMerchantAgentControllerDeps,
} from '../src/controllers/VionaWebhookMerchantAgentController';
import { deriveVionaWebhookStandingApprovalFlags } from '../src/lib/viona/merchant/vionaMerchantWebhookApprovalGate';
import { assertVionaRequestTenantMatchesMerchant } from '../src/lib/viona/merchant/vionaMerchantTenantScope';
import { VIONA_TOOL_REGISTRY } from '../src/lib/viona/dispatcher/vionaToolRegistry';
import {
  readVionaWebhookChannelKey,
  vionaWebhookChannelRateLimiter,
  VIONA_WEBHOOK_CHANNEL_RATE_LIMIT,
} from '../src/middleware/vionaWebhookRateLimitMiddleware';
import {
  assertVionaWebhookChannelGate,
  type ResolvedVionaWebhookChannel,
} from '../src/services/viona/vionaWebhookChannelResolutionService';
import {
  buildVionaWebhookSignatureHeader,
  verifyVionaWebhookSignature,
  VIONA_WEBHOOK_SIGNATURE_MAX_AGE_MS,
} from '../src/services/viona/vionaWebhookSignatureVerificationService';
import {
  createVionaRequestFromWebhookMessage,
  VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE,
} from '../src/services/viona/vionaRequestCreateFromWebhookService';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

let passed = 0;

function runTest(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

async function runAsyncTest(name: string, fn: () => Promise<void>): Promise<void> {
  await fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

function makeResolvedChannel(overrides: Partial<ResolvedVionaWebhookChannel> = {}): ResolvedVionaWebhookChannel {
  return {
    channelId: 'ch-1',
    channelType: 'custom_client',
    channelExternalId: 'ext-1',
    channelIsActive: true,
    signingSecretHash: 'test-signing-secret',
    standingApprovalForReadOnlyToolsOnly: false,
    merchantProfileId: 'mp-1',
    tenantId: 'tenant-a',
    merchantOwnerUserId: 'user-merchant-a',
    merchantIsActive: true,
    merchantToolScope: ['merchant_schedule_availability_check'],
    ...overrides,
  };
}

function makeFakeResponse(): { res: any; getStatusCode: () => number | null; getBody: () => unknown } {
  const state = { statusCode: null as number | null, body: null as unknown };
  const res: any = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    type() {
      return res;
    },
    send(payload: unknown) {
      state.body = payload;
      return res;
    },
    json(payload: unknown) {
      state.body = payload;
      return res;
    },
  };
  return { res, getStatusCode: () => state.statusCode, getBody: () => state.body };
}

function buildSignedRequest(body: Record<string, unknown>, secret: string, timestampMs = Date.now()): { raw: Buffer; header: string; req: any } {
  const raw = Buffer.from(JSON.stringify(body), 'utf8');
  const header = buildVionaWebhookSignatureHeader(raw, secret, timestampMs);
  return {
    raw,
    header,
    req: {
      body: raw,
      headers: { 'x-viona-webhook-signature': header },
    },
  };
}

// ---------------------------------------------------------------------------
// Test plan item 1 — Signature verification (pure).
// ---------------------------------------------------------------------------

runTest('signature: valid signature + fresh timestamp -> ok:true', () => {
  const secret = 'whsec-test-1';
  const raw = Buffer.from(JSON.stringify({ hello: 'world' }), 'utf8');
  const header = buildVionaWebhookSignatureHeader(raw, secret);
  const result = verifyVionaWebhookSignature(raw, header, secret);
  assert(result.ok === true, 'expected ok:true');
});

runTest('signature: missing header -> missing_header', () => {
  const result = verifyVionaWebhookSignature(Buffer.from('{}'), undefined, 'secret');
  assert(!result.ok && result.reason === 'missing_header', 'expected missing_header');
});

runTest('signature: malformed header -> bad_format', () => {
  const result = verifyVionaWebhookSignature(Buffer.from('{}'), 'not-a-valid-header', 'secret');
  assert(!result.ok && result.reason === 'bad_format', 'expected bad_format');
});

runTest('signature: wrong secret -> signature_mismatch', () => {
  const raw = Buffer.from('{}', 'utf8');
  const header = buildVionaWebhookSignatureHeader(raw, 'correct-secret');
  const result = verifyVionaWebhookSignature(raw, header, 'wrong-secret');
  assert(!result.ok && result.reason === 'signature_mismatch', 'expected signature_mismatch');
});

runTest('signature: stale timestamp -> stale_timestamp', () => {
  const secret = 'whsec-stale';
  const raw = Buffer.from('{}', 'utf8');
  const staleMs = Date.now() - VIONA_WEBHOOK_SIGNATURE_MAX_AGE_MS - 1_000;
  const header = buildVionaWebhookSignatureHeader(raw, secret, staleMs);
  const result = verifyVionaWebhookSignature(raw, header, secret, () => Date.now());
  assert(!result.ok && result.reason === 'stale_timestamp', 'expected stale_timestamp');
});

// ---------------------------------------------------------------------------
// Test plan item 2 — Channel gate (pure; DB resolution covered by --with-db).
// ---------------------------------------------------------------------------

runTest('channel gate: active channel + active merchant -> ok:true', () => {
  const channel = makeResolvedChannel();
  assert(assertVionaWebhookChannelGate(channel).ok === true, 'expected ok');
});

runTest('channel gate: inactive channel -> channel_inactive', () => {
  const result = assertVionaWebhookChannelGate(makeResolvedChannel({ channelIsActive: false }));
  assert(!result.ok && result.reason === 'channel_inactive', 'expected channel_inactive');
});

runTest('channel gate: inactive merchant -> merchant_inactive', () => {
  const result = assertVionaWebhookChannelGate(makeResolvedChannel({ merchantIsActive: false }));
  assert(!result.ok && result.reason === 'merchant_inactive', 'expected merchant_inactive');
});

// ---------------------------------------------------------------------------
// Test plan item 4 — Standing-approval guard (CRITICAL, pure).
// ---------------------------------------------------------------------------

runTest('standing approval: read-only tool in toolScope + standing flag -> true/true', () => {
  const flags = deriveVionaWebhookStandingApprovalFlags({
    standingApprovalForReadOnlyToolsOnly: true,
    resolvedToolName: 'merchant_schedule_availability_check',
    merchantToolScope: ['merchant_schedule_availability_check'],
  });
  assert(flags.operatorApprovalGranted === true && flags.userConsentGranted === true, 'expected true/true');
});

runTest('standing approval: standing flag false -> false/false even for read-only tool', () => {
  const flags = deriveVionaWebhookStandingApprovalFlags({
    standingApprovalForReadOnlyToolsOnly: false,
    resolvedToolName: 'merchant_schedule_availability_check',
    merchantToolScope: ['merchant_schedule_availability_check'],
  });
  assert(flags.operatorApprovalGranted === false && flags.userConsentGranted === false, 'expected false/false');
});

runTest('standing approval: twilio_test_sms_poc -> false/false regardless of standing flag', () => {
  const flags = deriveVionaWebhookStandingApprovalFlags({
    standingApprovalForReadOnlyToolsOnly: true,
    resolvedToolName: 'twilio_test_sms_poc',
    merchantToolScope: ['twilio_test_sms_poc', 'merchant_schedule_availability_check'],
  });
  assert(flags.operatorApprovalGranted === false && flags.userConsentGranted === false, 'twilio must never auto-approve');
});

runTest('standing approval: marketing_content_generator -> false/false regardless of standing flag', () => {
  const flags = deriveVionaWebhookStandingApprovalFlags({
    standingApprovalForReadOnlyToolsOnly: true,
    resolvedToolName: 'marketing_content_generator',
    merchantToolScope: ['marketing_content_generator', 'merchant_schedule_availability_check'],
  });
  assert(flags.operatorApprovalGranted === false && flags.userConsentGranted === false, 'marketing must never auto-approve');
});

runTest('standing approval: read-only tool not in merchant toolScope -> false/false', () => {
  const flags = deriveVionaWebhookStandingApprovalFlags({
    standingApprovalForReadOnlyToolsOnly: true,
    resolvedToolName: 'merchant_inventory_stock_check',
    merchantToolScope: ['merchant_schedule_availability_check'],
  });
  assert(flags.operatorApprovalGranted === false && flags.userConsentGranted === false, 'out-of-scope tool must deny');
});

for (const entry of VIONA_TOOL_REGISTRY) {
  runTest(`standing approval: registry entry "${entry.name}" never auto-approves unless all three gates pass`, () => {
    const isEligible =
      entry.category === 'merchant_read_only_query' &&
      entry.merchantScopedOnly === true;
    const flags = deriveVionaWebhookStandingApprovalFlags({
      standingApprovalForReadOnlyToolsOnly: true,
      resolvedToolName: entry.name,
      merchantToolScope: isEligible ? [entry.name] : [],
    });
    if (isEligible) {
      assert(flags.operatorApprovalGranted === true, `${entry.name} should approve when in toolScope`);
    } else {
      assert(flags.operatorApprovalGranted === false, `${entry.name} must never auto-approve`);
    }
  });
}

// ---------------------------------------------------------------------------
// Test plan item 5 — Tenant isolation (pure defensive).
// ---------------------------------------------------------------------------

runTest('tenant isolation: assertVionaRequestTenantMatchesMerchant rejects cross-tenant', () => {
  const channelA = makeResolvedChannel({ tenantId: 'tenant-a' });
  const channelB = makeResolvedChannel({ tenantId: 'tenant-b' });
  assert(
    assertVionaRequestTenantMatchesMerchant(channelA.tenantId, {
      tenantId: channelB.tenantId,
      isActive: channelB.merchantIsActive,
    }).ok === false,
    'cross-tenant must fail',
  );
});

// ---------------------------------------------------------------------------
// Test plan item 3 — Idempotency via controller deps (spy, no real DB).
// ---------------------------------------------------------------------------

async function runIdempotencyControllerTest(): Promise<void> {
  await runAsyncTest('idempotency: duplicate externalMessageId skips second dispatch call', async () => {
  let dispatchCalls = 0;
  const secret = 'whsec-idem';
  const channel = makeResolvedChannel({ signingSecretHash: secret, standingApprovalForReadOnlyToolsOnly: false });
  const body = {
    channelType: 'custom_client',
    channelExternalId: 'ext-1',
    externalMessageId: 'msg-idem-001',
    fromExternalContactId: 'contact-1',
    messageText: 'Hello from webhook',
  };

  const deps: VionaWebhookMerchantAgentControllerDeps = {
    resolveChannel: async () => ({ ok: true, channel }),
    createFromWebhook: async (input) => {
      if (input.externalMessageId === 'msg-idem-001-replay') {
        return {
          ok: true,
          requestId: 'req-existing',
          requestStatus: 'submitted',
          idempotentReplay: true,
        };
      }
      return {
        ok: true,
        requestId: 'req-new',
        requestStatus: 'submitted',
        idempotentReplay: false,
      };
    },
    routeIntent: async () => ({ ok: false, reason: 'low_confidence' }),
    dispatch: async () => {
      dispatchCalls += 1;
      return {
        ok: true,
        requestId: 'req-new',
        dispatch: { accepted: false, reason: 'low_confidence' },
        route: null,
      };
    },
  };

  const first = buildSignedRequest(body, secret);
  const { res: res1, getStatusCode: getCode1 } = makeFakeResponse();
  await postVionaWebhookMerchantAgent(first.req, res1, deps);
  assert(getCode1() === 200, 'first call must 200');

  const replayBody = { ...body, externalMessageId: 'msg-idem-001-replay' };
  const second = buildSignedRequest(replayBody, secret);
  const replayDeps: VionaWebhookMerchantAgentControllerDeps = {
    ...deps,
    createFromWebhook: async () => ({
      ok: true,
      requestId: 'req-existing',
      requestStatus: 'submitted',
      idempotentReplay: true,
    }),
  };
  const { res: res2, getStatusCode: getCode2, getBody: getBody2 } = makeFakeResponse();
  await postVionaWebhookMerchantAgent(second.req, res2, replayDeps);
  assert(getCode2() === 200, 'replay must 200');
  const body2 = getBody2();
  assert(
    typeof body2 === 'object' && body2 !== null && (body2 as { idempotentReplay?: boolean }).idempotentReplay === true,
    'replay response must flag idempotentReplay',
  );
  assert(dispatchCalls === 1, 'dispatch must be called exactly once across both requests');
  });
}

// ---------------------------------------------------------------------------
// Test plan item 6 — Rate limiting (middleware, unique channel key).
// ---------------------------------------------------------------------------

runTest('rate limit: per-channel bucket returns 429 after threshold', () => {
  const uniqueChannelId = `rate-test-${Date.now()}`;
  const payload = JSON.stringify({
    channelType: 'custom_client',
    channelExternalId: uniqueChannelId,
    externalMessageId: 'x',
    messageText: 'hi',
  });
  const req = { body: Buffer.from(payload, 'utf8'), headers: {} };

  let lastStatus: number | null = null;
  const res: any = {
    status(code: number) {
      lastStatus = code;
      return res;
    },
    json() {
      return res;
    },
  };
  const next = () => {
    lastStatus = 200;
  };

  const attempts = VIONA_WEBHOOK_CHANNEL_RATE_LIMIT.max + 1;
  for (let i = 0; i < attempts; i += 1) {
    lastStatus = null;
    vionaWebhookChannelRateLimiter(req as any, res, next);
  }
  assert(lastStatus === 429, `expected 429 on attempt ${attempts}, got ${lastStatus}`);
});

runTest('rate limit: readVionaWebhookChannelKey extracts channelType:channelExternalId', () => {
  const req = {
    body: Buffer.from(
      JSON.stringify({ channelType: 'whatsapp', channelExternalId: 'phone-123', messageText: 'x' }),
      'utf8',
    ),
  };
  assert(readVionaWebhookChannelKey(req as any) === 'whatsapp:phone-123', 'expected composite channel key');
});

// ---------------------------------------------------------------------------
// Test plan item 7 — Contract regression (content-scan, NOT git diff).
// ---------------------------------------------------------------------------

runTest('contract scan: dispatchVionaAutonomousRequest export unchanged', () => {
  const source = readSource('../src/services/viona/vionaAutonomousDispatchService.ts');
  assert(source.includes('export async function dispatchVionaAutonomousRequest'), 'dispatch export must exist');
  assert(source.includes('operatorApprovalGranted: boolean'), 'operatorApprovalGranted must remain in input type');
  assert(source.includes('userConsentGranted: boolean'), 'userConsentGranted must remain in input type');
});

runTest('contract scan: createVionaRequest export unchanged', () => {
  const source = readSource('../src/services/viona/vionaRequestCreateService.ts');
  assert(source.includes('export async function createVionaRequest'), 'createVionaRequest export must exist');
});

runTest('contract scan: assertVionaRequestTenantMatchesMerchant export unchanged', () => {
  const source = readSource('../src/lib/viona/merchant/vionaMerchantTenantScope.ts');
  assert(source.includes('export function assertVionaRequestTenantMatchesMerchant'), 'tenant gate export must exist');
});

runTest('contract scan: app.ts mounts webhook route before express.json()', () => {
  const source = readSource('../src/app.ts');
  const webhookIdx = source.indexOf("'/api/viona/webhooks'");
  const jsonIdx = source.indexOf('app.use(express.json');
  assert(webhookIdx >= 0 && jsonIdx >= 0 && webhookIdx < jsonIdx, 'webhook must mount before express.json()');
});

runTest('contract scan: RateLimitMiddleware bypasses merchant-agent path', () => {
  const source = readSource('../src/middleware/RateLimitMiddleware.ts');
  assert(source.includes("path === '/api/viona/webhooks/merchant-agent'"), 'webhook bypass must exist');
});

runTest('contract scan: webhook create uses dedicated audit event type', () => {
  const source = readSource('../src/services/viona/vionaRequestCreateFromWebhookService.ts');
  assert(source.includes("export const VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE = 'webhookMessageAccepted'"), 'audit event type must exist');
  assert(source.includes('export async function createVionaRequestFromWebhookMessage'), 'webhook create export must exist');
});

runTest('contract scan: vionaRequestAuditEventTypes includes webhookMessageAccepted', () => {
  const source = readSource('../src/domain/requests/vionaRequestAuditEventTypes.ts');
  assert(source.includes("'webhookMessageAccepted'"), 'domain audit types must list webhookMessageAccepted');
});

// ---------------------------------------------------------------------------
// Controller integration (spy deps): signature + gate ordering.
// ---------------------------------------------------------------------------

async function runControllerIntegrationTests(): Promise<void> {
  await runAsyncTest('controller: invalid signature -> 401 before create', async () => {
    const channel = makeResolvedChannel({ signingSecretHash: 'real-secret' });
    const body = {
      channelType: 'custom_client',
      channelExternalId: 'ext-1',
      externalMessageId: 'msg-401',
      messageText: 'hello',
    };
    let createCalled = false;
    const { raw, req } = buildSignedRequest(body, 'wrong-secret');
    req.body = raw;
    const { res, getStatusCode } = makeFakeResponse();
    await postVionaWebhookMerchantAgent(req, res, {
      resolveChannel: async () => ({ ok: true, channel }),
      createFromWebhook: async () => {
        createCalled = true;
        return { ok: true, requestId: 'x', requestStatus: 'submitted', idempotentReplay: false };
      },
    });
    assert(getStatusCode() === 401, 'expected 401');
    assert(!createCalled, 'create must not run on bad signature');
  });

  await runAsyncTest('controller: unknown channel -> 404', async () => {
    const body = {
      channelType: 'custom_client',
      channelExternalId: 'missing',
      externalMessageId: 'msg-404',
      messageText: 'hello',
    };
    const signed = buildSignedRequest(body, 'secret');
    const { res, getStatusCode } = makeFakeResponse();
    await postVionaWebhookMerchantAgent(signed.req, res, {
      resolveChannel: async () => ({ ok: false, reason: 'channel_not_found' }),
    });
    assert(getStatusCode() === 404, 'expected 404');
  });
}

async function runOptionalLiveDbTests(): Promise<void> {
  if (!process.argv.includes('--with-db')) return;

  await runAsyncTest('live DB: createVionaRequestFromWebhookMessage idempotent replay', async () => {
    const externalMessageId = `pack35-live-${Date.now()}`;
    const input = {
      tenantId: `tenant-pack35-live-${Date.now()}`,
      merchantOwnerUserId: `user-pack35-live-${Date.now()}`,
      channelType: 'custom_client',
      channelExternalId: `ext-live-${Date.now()}`,
      externalMessageId,
      fromExternalContactId: 'contact-live',
      messageText: 'Pack35 live webhook create smoke test',
    };

    const first = await createVionaRequestFromWebhookMessage(input);
    assert(first.ok === true && first.idempotentReplay === false, 'first create must succeed');
    if (!first.ok) return;

    const second = await createVionaRequestFromWebhookMessage(input);
    assert(
      second.ok === true && second.idempotentReplay === true && second.requestId === first.requestId,
      'second create must idempotent-replay same requestId',
    );
  });
}

async function main(): Promise<void> {
  await runIdempotencyControllerTest();
  await runControllerIntegrationTests();
  await runOptionalLiveDbTests();
  console.log(`\nPASS Pack35 B2B webhook routing tests (${passed}/${passed})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
