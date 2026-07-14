/**
 * Pack40P2 — create-path provenance wiring test suite.
 *
 * Operator phrase: APPROVE_PACK40P2_CREATE_PATH_PROVENANCE_WIRING.
 * Pure/fake-Prisma tests only — no database, network, or git-diff-vs-master assertions.
 *
 * Run:
 *   npx tsx scripts/test-viona-pack40p2-create-path-provenance.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { VionaRequestScopeKind } from '@prisma/client';

import { postVionaWebhookMerchantAgent } from '../src/controllers/VionaWebhookMerchantAgentController';
import {
  VIONA_REQUEST_CREATE_FORBIDDEN_SIDE_EFFECT_KEYS,
  VIONA_REQUEST_CREATE_REQUIRED_SAFETY_LABELS,
} from '../src/services/viona/vionaRequestCreateDto';
import {
  createVionaRequest,
  screenCreateVionaRequestRawBody,
} from '../src/services/viona/vionaRequestCreateService';
import {
  createVionaRequestFromWebhookMessage,
  VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE,
} from '../src/services/viona/vionaRequestCreateFromWebhookService';
import { disconnectPrisma } from '../src/lib/prisma';

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

const PACK19_SAFE_LABELS = [...VIONA_REQUEST_CREATE_REQUIRED_SAFETY_LABELS];

const PACK19_BASE_INPUT = {
  authUserId: 'user-pack40p2-consumer',
  tenantId: 'tenant-arbitrary-client-metadata',
  sourceUniverse: 'home',
  requestType: 'generic',
  title: 'Pack40P2 consumer provenance test',
  safetyLabels: PACK19_SAFE_LABELS,
} as const;

function makePack19DetailRow(requestId: string, authUserId: string) {
  const now = new Date('2026-07-14T12:00:00.000Z');
  return {
    id: requestId,
    tenantId: PACK19_BASE_INPUT.tenantId,
    requesterUserId: authUserId,
    ownerUserId: authUserId,
    sourceUniverse: PACK19_BASE_INPUT.sourceUniverse,
    sourceFeature: null,
    requestType: PACK19_BASE_INPUT.requestType,
    status: 'submitted',
    title: PACK19_BASE_INPUT.title,
    summary: '',
    locale: null,
    countryCode: null,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    participants: [],
    sourceLinks: [],
    statusEvents: [],
    auditEvents: [],
    attachmentReferences: [],
  };
}

function installFakePrisma(fake: Record<string, unknown>): void {
  (globalThis as unknown as { prisma?: unknown }).prisma = fake;
}

function clearFakePrisma(): void {
  (globalThis as unknown as { prisma?: unknown }).prisma = undefined;
}

async function main(): Promise<void> {
  // Pack19 — forbidden client provenance keys
  runTest('Pack19: client scopeKind is rejected by raw-body screen', () => {
    const reason = screenCreateVionaRequestRawBody({
      tenantId: 'tenant-a',
      sourceUniverse: 'home',
      requestType: 'generic',
      title: 't',
      safetyLabels: PACK19_SAFE_LABELS,
      scopeKind: 'merchant',
    });
    assert(reason === 'forbidden_side_effect', `expected forbidden_side_effect, got ${reason}`);
  });

  runTest('Pack19: client merchantProfileId is rejected by raw-body screen', () => {
    const reason = screenCreateVionaRequestRawBody({
      tenantId: 'tenant-a',
      sourceUniverse: 'home',
      requestType: 'generic',
      title: 't',
      safetyLabels: PACK19_SAFE_LABELS,
      merchantProfileId: 'mp-evil',
    });
    assert(reason === 'forbidden_side_effect', `expected forbidden_side_effect, got ${reason}`);
  });

  runTest('Pack19: forbidden-key list includes provenance fields', () => {
    assert(VIONA_REQUEST_CREATE_FORBIDDEN_SIDE_EFFECT_KEYS.includes('scopekind'), 'scopekind forbidden');
    assert(
      VIONA_REQUEST_CREATE_FORBIDDEN_SIDE_EFFECT_KEYS.includes('merchantprofileid'),
      'merchantprofileid forbidden',
    );
  });

  await runAsyncTest('Pack19: create writes scopeKind=consumer and merchantProfileId=null', async () => {
    clearFakePrisma();

    let capturedCreate: Record<string, unknown> | null = null;
    const requestId = 'req-pack40p2-pack19';

    installFakePrisma({
      vionaRequestAuditEvent: {
        findFirst: async () => null,
      },
      $transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          vionaRequest: {
            create: async ({ data }: { data: Record<string, unknown> }) => {
              capturedCreate = data;
              return { id: requestId };
            },
          },
          vionaRequestAuditEvent: {
            create: async () => ({ id: 'audit-1' }),
          },
        };
        return cb(tx);
      },
      vionaRequest: {
        findFirst: async () => makePack19DetailRow(requestId, PACK19_BASE_INPUT.authUserId),
      },
    });

    const result = await createVionaRequest({
      ...PACK19_BASE_INPUT,
      tenantId: 'merchant-registry-tenant-lookalike',
    });

    assert(result.ok === true, 'Pack19 create must succeed');
    assert(capturedCreate != null, 'create payload must be captured');
    assert(capturedCreate!.scopeKind === VionaRequestScopeKind.consumer, 'scopeKind must be consumer');
    assert(capturedCreate!.merchantProfileId === null, 'merchantProfileId must be null');
    assert(
      capturedCreate!.tenantId === 'merchant-registry-tenant-lookalike',
      'client tenantId remains compatibility metadata only',
    );
  });

  runTest('Pack19: service does not lookup MerchantProfile (dual-role safe by path)', () => {
    const source = readSource('../src/services/viona/vionaRequestCreateService.ts');
    assert(!source.includes('merchantProfile.find'), 'Pack19 create must not resolve MerchantProfile');
    assert(source.includes('VionaRequestScopeKind.consumer'), 'Pack19 must assign consumer enum');
  });

  await runAsyncTest('Pack19: idempotent replay does not re-create (unchanged behavior)', async () => {
    clearFakePrisma();

    let createCalls = 0;
    const requestId = 'req-pack40p2-replay';

    installFakePrisma({
      vionaRequestAuditEvent: {
        findFirst: async () => ({ id: 'audit-existing', requestId }),
      },
      $transaction: async () => {
        createCalls += 1;
        throw new Error('transaction must not run on replay');
      },
      vionaRequest: {
        findFirst: async () => makePack19DetailRow(requestId, PACK19_BASE_INPUT.authUserId),
      },
    });

    const result = await createVionaRequest({
      ...PACK19_BASE_INPUT,
      idempotencyKey: 'idem-pack40p2',
    });

    assert(result.ok === true, 'replay must succeed');
    assert(result.ok && result.action.idempotentReplay === true, 'must flag idempotent replay');
    assert(createCalls === 0, 'create transaction must not run on replay');
  });

  await runAsyncTest('Pack35: trusted webhook create writes merchant scope + profile FK', async () => {
    clearFakePrisma();

    let capturedCreate: Record<string, unknown> | null = null;

    installFakePrisma({
      vionaRequestAuditEvent: {
        findFirst: async () => null,
      },
      $transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          vionaRequest: {
            create: async ({ data }: { data: Record<string, unknown> }) => {
              capturedCreate = data;
              return { id: 'req-webhook-1' };
            },
          },
          vionaRequestAuditEvent: {
            create: async () => ({ id: 'audit-w1' }),
          },
        };
        return cb(tx);
      },
    });

    const result = await createVionaRequestFromWebhookMessage({
      tenantId: 'trusted-tenant-a',
      merchantProfileId: 'mp-trusted-1',
      merchantOwnerUserId: 'merchant-owner-1',
      channelType: 'custom_client',
      channelExternalId: 'ext-1',
      externalMessageId: 'msg-pack40p2-1',
      fromExternalContactId: 'contact-1',
      messageText: 'What are your opening hours?',
    });

    assert(result.ok === true, 'webhook create must succeed');
    assert(capturedCreate != null, 'webhook create payload must be captured');
    assert(capturedCreate!.scopeKind === VionaRequestScopeKind.merchant, 'scopeKind must be merchant');
    assert(capturedCreate!.merchantProfileId === 'mp-trusted-1', 'merchantProfileId must match trusted input');
    assert(capturedCreate!.tenantId === 'trusted-tenant-a', 'tenantId must come from trusted channel context');
  });

  await runAsyncTest('Pack35: missing merchantProfileId fails closed before create', async () => {
    clearFakePrisma();

    let createCalled = false;
    installFakePrisma({
      vionaRequestAuditEvent: { findFirst: async () => null },
      $transaction: async () => {
        createCalled = true;
        throw new Error('must not create without merchantProfileId');
      },
    });

    const result = await createVionaRequestFromWebhookMessage({
      tenantId: 'trusted-tenant-a',
      merchantProfileId: '   ',
      merchantOwnerUserId: 'merchant-owner-1',
      channelType: 'custom_client',
      channelExternalId: 'ext-1',
      externalMessageId: 'msg-pack40p2-missing-mp',
      fromExternalContactId: 'contact-1',
      messageText: 'hello',
    });

    assert(result.ok === false && result.reason === 'invalid_input', 'missing profile id must fail closed');
    assert(!createCalled, 'create must not run when merchantProfileId missing');
  });

  await runAsyncTest('Pack35: webhook idempotent replay unchanged', async () => {
    clearFakePrisma();

    installFakePrisma({
      vionaRequestAuditEvent: {
        findFirst: async () => ({ requestId: 'req-existing-webhook' }),
      },
      $transaction: async () => {
        throw new Error('transaction must not run on webhook replay');
      },
    });

    const result = await createVionaRequestFromWebhookMessage({
      tenantId: 'trusted-tenant-a',
      merchantProfileId: 'mp-trusted-1',
      merchantOwnerUserId: 'merchant-owner-1',
      channelType: 'custom_client',
      channelExternalId: 'ext-1',
      externalMessageId: 'msg-existing',
      fromExternalContactId: 'contact-1',
      messageText: 'hello',
    });

    assert(result.ok === true && result.idempotentReplay === true, 'webhook replay must remain idempotent');
  });

  await runAsyncTest('Pack35 controller passes resolved merchantProfileId into create path', async () => {
    let capturedInput: Record<string, unknown> | null = null;
    const channel = {
      channelId: 'ch-1',
      channelType: 'custom_client',
      channelExternalId: 'ext-1',
      channelIsActive: true,
      signingSecretHash: 'secret',
      standingApprovalForReadOnlyToolsOnly: false,
      merchantProfileId: 'mp-controller-1',
      tenantId: 'tenant-controller-1',
      merchantOwnerUserId: 'owner-1',
      merchantIsActive: true,
      merchantToolScope: ['merchant_schedule_availability_check'],
    };

    const req: any = {
      body: Buffer.from(
        JSON.stringify({
          channelType: 'custom_client',
          channelExternalId: 'ext-1',
          externalMessageId: 'msg-controller-1',
          messageText: 'hours?',
        }),
      ),
      headers: {},
    };
    const res: any = {
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      type() {
        return this;
      },
      json(payload: unknown) {
        this.body = payload;
        return this;
      },
      send(payload: unknown) {
        this.body = payload;
        return this;
      },
    };

    await postVionaWebhookMerchantAgent(req, res, {
      resolveChannel: async () => ({ ok: true, channel }),
      verifySignature: () => ({ ok: true as const }),
      assertChannelGate: () => ({ ok: true as const }),
      createFromWebhook: async (input) => {
        capturedInput = input as Record<string, unknown>;
        return { ok: true, requestId: 'req-c1', requestStatus: 'submitted', idempotentReplay: true };
      },
    });

    assert(capturedInput != null, 'createFromWebhook must be called');
    assert(capturedInput!.merchantProfileId === 'mp-controller-1', 'controller must pass merchantProfileId');
    assert(capturedInput!.tenantId === 'tenant-controller-1', 'controller must pass trusted tenantId');
  });

  runTest('Pack35: webhook create service does not read LLM/intent for provenance', () => {
    const source = readSource('../src/services/viona/vionaRequestCreateFromWebhookService.ts');
    assert(!source.includes('routeVionaDispatchIntent'), 'webhook create must not call intent router');
    assert(!source.includes('callLlm'), 'webhook create must not call LLM');
  });

  runTest('shared: schema default legacyUnresolved remains in prisma schema', () => {
    const schema = readSource('../prisma/schema.prisma');
    assert(
      /scopeKind\s+VionaRequestScopeKind\s+@default\(legacyUnresolved\)/.test(schema),
      'DB default must remain legacyUnresolved',
    );
  });

  runTest('shared: no access-policy file changes in P2 allowlist', () => {
    const source = readSource('../src/services/viona/vionaRequestAccessScope.ts');
    assert(!source.includes('scopeKind'), 'access scope must remain unchanged in P2');
  });

  runTest('shared: webhook audit event type unchanged', () => {
    assert(VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE === 'webhookMessageAccepted', 'audit type unchanged');
  });

  clearFakePrisma();
  try {
    await disconnectPrisma();
  } catch {
    clearFakePrisma();
  }

  console.log(`\nPack40P2 create-path provenance tests: ${passed}/${passed} PASS`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
