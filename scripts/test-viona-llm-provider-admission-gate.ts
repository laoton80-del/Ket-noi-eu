/**
 * Offline P0-A0 tests. No .env loading, real SDK, real Prisma client or network capability.
 * Runs the actual source in a VM with a synthetic process.env and a closed dependency loader.
 * Run with the repository's installed tsx: tsx scripts/test-viona-llm-provider-admission-gate.ts
 */
import * as assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import * as ts from 'typescript';

import type * as Gate from '../src/services/ai/llmProviderAdmissionGate';
import type * as Router from '../src/services/ai/AIRouterService';
import type * as Controller from '../src/controllers/AIController';
import type * as Translation from '../src/services/ai/TranslationService';
import type * as Formatter from '../src/lib/viona/merchant/vionaMerchantReadOnlyQueryReplyFormatter';

const ALLOW_ENV = {
  VIONA_LLM_PROVIDER_ADMISSION_ENABLED: 'true',
  VIONA_LLM_PROVIDER_ALLOWED_USER_IDS: 'allowed-user',
  VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: 'ROUTING_INQUIRY,SIMPLE_TRANSLATION',
};

const TASK_TYPES = {
  SIMPLE_TRANSLATION: 'SIMPLE_TRANSLATION',
  ROUTING_INQUIRY: 'ROUTING_INQUIRY',
  COMPLEX_MARKETING: 'COMPLEX_MARKETING',
  DEEP_CONTEXT: 'DEEP_CONTEXT',
  VIONA_REAL_EXECUTION_CONTENT: 'VIONA_REAL_EXECUTION_CONTENT',
};

function input(overrides: Partial<Router.RoutedChatCompletionInput> = {}): Router.RoutedChatCompletionInput {
  return {
    taskType: 'ROUTING_INQUIRY',
    userId: 'allowed-user',
    params: { messages: [{ role: 'user', content: 'Synthetic test request.' }], max_tokens: 20 },
    ...overrides,
  };
}

function harness(options: {
  env?: Record<string, string | undefined>;
  cachedText?: string;
  providerFailure?: Error;
} = {}) {
  const counts = { keyReads: 0, clients: 0, providerCalls: 0, prismaReads: 0, usageWrites: 0, cacheReads: 0, cacheWrites: 0 };
  const environment: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    OPENAI_API_KEY: 'fake-offline-test-key-never-sent',
    ...options.env,
  };
  const env = new Proxy(environment, {
    get(target, property, receiver) {
      if (property === 'OPENAI_API_KEY') counts.keyReads += 1;
      return Reflect.get(target, property, receiver);
    },
  });
  const context = createContext({
    process: { env },
    Error,
    TypeError,
    AbortSignal: { timeout: () => ({}) },
    console: { info() {}, error() {} },
  }, { codeGeneration: { strings: false, wasm: false } });

  function load<T>(relativePath: string, dependencies: Record<string, unknown> = {}): T {
    const filename = resolve(__dirname, '..', relativePath);
    const source = readFileSync(filename, 'utf8');
    const compiled = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    const module = { exports: {} };
    const closedRequire = (id: string): unknown => {
      if (!Object.prototype.hasOwnProperty.call(dependencies, id)) {
        throw new Error(`Unexpected runtime dependency blocked: ${id}`);
      }
      return dependencies[id];
    };
    const execute = runInContext(
      `(function(require, module, exports) { ${compiled.outputText}\n})`,
      context,
      { filename, timeout: 1000 }
    ) as (require: typeof closedRequire, module: { exports: unknown }, exports: unknown) => void;
    execute(closedRequire, module, module.exports);
    return module.exports as T;
  }

  const completion = {
    id: 'synthetic-completion', object: 'chat.completion', created: 0, model: 'synthetic-model',
    choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'Synthetic provider result.' } }],
    usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
  };
  const requests: Array<Record<string, unknown>> = [];
  class FakeOpenAI {
    constructor() { counts.clients += 1; }
    chat = {
      completions: {
        create: async (params: Record<string, unknown>) => {
          counts.providerCalls += 1;
          requests.push(params);
          if (options.providerFailure) throw options.providerFailure;
          return completion;
        },
      },
    };
  }
  const prisma = {
    llmApiUsageLog: { create: async () => { counts.usageWrites += 1; return {}; } },
    translationCache: {
      findUnique: async () => {
        counts.cacheReads += 1;
        return options.cachedText === undefined ? null : { translatedText: options.cachedText };
      },
      upsert: async () => { counts.cacheWrites += 1; return {}; },
    },
  };
  const prismaModule = { getPrisma: () => { counts.prismaReads += 1; return prisma; } };
  const prismaEnums = { LlmRouterTaskType: TASK_TYPES, Prisma: {}, TxStatus: {}, TxType: {} };
  const gate = load<typeof Gate>('src/services/ai/llmProviderAdmissionGate.ts');
  const governor = {
    createServerIdempotencyKey: () => 'synthetic-governor-key',
    reserve: async () => ({ decision: 'ALLOW_RESERVED' as const, operation: { id: 'synthetic-operation' }, providerTimeoutMs: 1 }),
    markDispatching: async () => true,
    settle: async () => ({ applied: true }),
    release: async () => true,
    markOutcomeUnknown: async () => true,
  };
  const costGovernor = {
    CostGovernorDeniedError: gate.LlmProviderAdmissionDeniedError,
    assertCostGovernorReservation: (result: { decision: string }) => {
      if (result.decision !== 'ALLOW_RESERVED') throw new gate.LlmProviderAdmissionDeniedError('disabled');
    },
    estimateInputTokensUpperBound: () => 1n,
    getCostGovernor: () => governor,
  };
  const safeLogger = { logSafeError: () => {}, safeErrorMeta: () => ({ errName: 'UnknownError' }) };
  const router = load<typeof Router>('src/services/ai/AIRouterService.ts', {
    openai: FakeOpenAI,
    '@prisma/client': prismaEnums,
    '../../lib/prisma': prismaModule,
    './CostGovernorService': costGovernor,
    './llmProviderAdmissionGate': gate,
    '../../utils/safeLogError': safeLogger,
  });
  const translation = load<typeof Translation>('src/services/ai/TranslationService.ts', {
    'node:crypto': { createHash },
    '@prisma/client': prismaEnums,
    '../../lib/prisma': prismaModule,
    './AIRouterService': router,
    '../../utils/safeLogError': safeLogger,
  });
  const envelope = load('src/utils/apiEnvelope.ts');
  const outOfScope = () => { throw new Error('Unexpected legal-scan/wallet execution blocked'); };
  const controller = load<typeof Controller>('src/controllers/AIController.ts', {
    '@prisma/client': prismaEnums,
    '../core/feature-flags/featureFlags': { getFeatureFlags: () => ({ legalScanEnabled: false }) },
    '../domain/legalScanPricing': {
      countWordsInDocument: outOfScope, estimateLegalScanPages: outOfScope, legalScanPriceVig: outOfScope,
    },
    '../lib/prisma': prismaModule,
    '../services/ai/AIGateway': { AIGatewayInsufficientVigError: Error, assertMinimumSpendableVig: outOfScope },
    '../services/ai/AIRouterService': router,
    '../services/ai/llmProviderAdmissionGate': gate,
    '../services/ai/TranslationService': translation,
    '../utils/apiEnvelope': envelope,
    '../utils/safeLogError': safeLogger,
  });
  const formatter = load<typeof Formatter>('src/lib/viona/merchant/vionaMerchantReadOnlyQueryReplyFormatter.ts', {
    '@prisma/client': prismaEnums,
    '../../../services/ai/AIRouterService': router,
  });
  return { gate, router, controller, formatter, counts, env: environment, completion, requests };
}

function noProvider(h: ReturnType<typeof harness>): void {
  assert.equal(h.counts.clients, 0, 'DENY must precede SDK construction');
  assert.equal(h.counts.providerCalls, 0, 'DENY must have zero provider attempts');
  assert.equal(h.counts.usageWrites, 0, 'DENY must not fabricate a completed usage row');
  assert.equal(h.counts.cacheWrites, 0, 'DENY must not cache a fabricated translation');
}

async function denied(
  h: ReturnType<typeof harness>,
  request: Router.RoutedChatCompletionInput,
  reason: Gate.LlmProviderAdmissionDenialReason
): Promise<void> {
  await assert.rejects(h.router.createRoutedChatCompletion(request), (error: unknown) => {
    assert.ok(error instanceof h.gate.LlmProviderAdmissionDeniedError);
    assert.equal(error.code, 'LLM_PROVIDER_ADMISSION_DENIED');
    assert.equal(error.reason, reason);
    return true;
  });
  noProvider(h);
  assert.equal(h.counts.keyReads, 0, 'DENY must precede provider-key access');
  assert.equal(h.counts.prismaReads, 0, 'router DENY must not touch the database');
}

async function http(
  handler: typeof Controller.postChatCompletion,
  body: unknown,
  authUserId?: string
): Promise<{ status: number; body: Record<string, unknown> }> {
  const result = { status: 0, body: {} as Record<string, unknown> };
  const response = {
    status(status: number) { result.status = status; return response; },
    json(payload: Record<string, unknown>) { result.body = payload; return response; },
  };
  await handler(
    { body, authUserId } as Parameters<typeof handler>[0],
    response as unknown as Parameters<typeof handler>[1]
  );
  return result;
}

let passed = 0;
async function test(name: string, run: () => Promise<void> | void): Promise<void> {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function main(): Promise<void> {
  await test('default DENY with a configured fake key', () => denied(harness(), input(), 'disabled'));
  await test('default DENY without a key', () => denied(harness({ env: { OPENAI_API_KEY: undefined } }), input(), 'disabled'));

  for (const flag of ['false', 'TRUE', '1', 'allow', ' true ', '']) {
    await test(`non-exact enable flag ${JSON.stringify(flag)} denies`, () =>
      denied(harness({ env: { ...ALLOW_ENV, VIONA_LLM_PROVIDER_ADMISSION_ENABLED: flag } }), input(), 'disabled'));
  }

  for (const [name, settings] of Object.entries({
    'missing user policy': { VIONA_LLM_PROVIDER_ALLOWED_USER_IDS: undefined },
    'missing task policy': { VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: undefined },
    'empty user policy': { VIONA_LLM_PROVIDER_ALLOWED_USER_IDS: '' },
    'empty task policy': { VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: '' },
    'wildcard users': { VIONA_LLM_PROVIDER_ALLOWED_USER_IDS: '*' },
    'wildcard tasks': { VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: '*' },
    'empty CSV entry': { VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: 'ROUTING_INQUIRY,' },
    'duplicate entry': { VIONA_LLM_PROVIDER_ALLOWED_USER_IDS: 'allowed-user,allowed-user' },
    'unknown task policy': { VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: 'ROUTING_INQUIRY,FUTURE_TASK' },
  })) {
    await test(`${name} fails closed`, () => denied(harness({ env: { ...ALLOW_ENV, ...settings } }), input(), 'invalid_policy'));
  }

  for (const userId of [undefined, null, '', ' ', ' allowed-user ']) {
    await test(`missing or malformed identity ${JSON.stringify(userId)} denies`, () =>
      denied(harness({ env: ALLOW_ENV }), input({ userId }), 'identity_required'));
  }
  await test('unlisted user denies', () => denied(harness({ env: ALLOW_ENV }), input({ userId: 'other-user' }), 'user_not_allowed'));
  await test('user substring cannot match allowlist', () => denied(harness({ env: ALLOW_ENV }), input({ userId: 'allowed' }), 'user_not_allowed'));
  await test('unlisted task denies', () => denied(harness({ env: ALLOW_ENV }), input({ taskType: 'DEEP_CONTEXT' }), 'task_not_allowed'));
  await test('unknown task cannot use cheap-model routing default', () =>
    denied(harness({ env: ALLOW_ENV }), input({ taskType: 'FUTURE_TASK' as Router.RoutedChatCompletionInput['taskType'] }), 'unknown_task'));
  await test('legacy provider flags cannot bypass admission', () => denied(harness({ env: {
    NODE_ENV: 'production', VIONA_OPENAI_REAL_EXECUTION_ENABLED: 'true',
  } }), input(), 'disabled'));

  await test('explicit server grant allows one fake attempt and preserves routed model', async () => {
    const h = harness({ env: ALLOW_ENV });
    assert.equal(await h.router.createRoutedChatCompletion(input()), h.completion);
    assert.equal(h.counts.clients, 1);
    assert.equal(h.counts.providerCalls, 1);
    assert.equal(h.counts.usageWrites, 1);
    assert.equal(h.requests[0]?.model, 'gpt-4o-mini');
  });
  await test('explicit full-tier grant preserves full model', async () => {
    const h = harness({ env: { ...ALLOW_ENV, VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: 'DEEP_CONTEXT' } });
    await h.router.createRoutedChatCompletion(input({ taskType: 'DEEP_CONTEXT' }));
    assert.equal(h.requests[0]?.model, 'gpt-4o');
    assert.equal(h.counts.providerCalls, 1);
  });
  await test('revocation is rechecked on the next attempt', async () => {
    const h = harness({ env: ALLOW_ENV });
    await h.router.createRoutedChatCompletion(input());
    h.env.VIONA_LLM_PROVIDER_ADMISSION_ENABLED = 'false';
    const before = { ...h.counts };
    await assert.rejects(h.router.createRoutedChatCompletion(input()), h.gate.LlmProviderAdmissionDeniedError);
    assert.deepEqual(h.counts, before);
  });
  await test('allowlist changes take effect without restarting', async () => {
    const h = harness({ env: ALLOW_ENV });
    h.env.VIONA_LLM_PROVIDER_ALLOWED_USER_IDS = 'replacement-user';
    await denied(h, input(), 'user_not_allowed');
  });
  await test('admission does not fabricate success without a configured key', async () => {
    const h = harness({ env: { ...ALLOW_ENV, OPENAI_API_KEY: undefined } });
    await assert.rejects(h.router.createRoutedChatCompletion(input()), /OPENAI_API_KEY is not configured/);
    noProvider(h);
  });
  await test('provider failure propagates without a fake completion or usage receipt', async () => {
    const failure = new Error('Synthetic provider failure');
    const h = harness({ env: ALLOW_ENV, providerFailure: failure });
    await assert.rejects(h.router.createRoutedChatCompletion(input()), (error) => error === failure);
    assert.equal(h.counts.providerCalls, 1);
    assert.equal(h.counts.usageWrites, 0);
    assert.equal(h.counts.cacheWrites, 0);
  });

  const chatBody = { messages: [{ role: 'user', content: 'Synthetic question' }] };
  await test('unauthenticated HTTP chat remains 401', async () => {
    const h = harness({ env: ALLOW_ENV });
    const response = await http(h.controller.postChatCompletion, chatBody);
    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    noProvider(h);
    assert.equal(h.counts.prismaReads, 0);
  });
  await test('HTTP chat DENY is an honest 503 failure envelope', async () => {
    const h = harness();
    const response = await http(h.controller.postChatCompletion, chatBody, 'allowed-user');
    assert.equal(response.status, 503);
    assert.equal(response.body.success, false);
    assert.equal(response.body.code, 'LLM_PROVIDER_ADMISSION_DENIED');
    assert.equal('data' in response.body, false);
    assert.match(String(response.body.error), /No provider call was made/);
    noProvider(h);
  });
  await test('client admission flags and forged body identity cannot grant access', async () => {
    const h = harness({ env: ALLOW_ENV });
    const response = await http(h.controller.postChatCompletion, {
      ...chatBody, userId: 'allowed-user', admission: 'ALLOW', paidAiEnabled: true,
      VIONA_LLM_PROVIDER_ADMISSION_ENABLED: 'true',
    }, 'other-user');
    assert.equal(response.status, 403);
    assert.equal(response.body.success, false);
    assert.equal(response.body.code, 'LLM_PROVIDER_ADMISSION_DENIED');
    noProvider(h);
  });
  await test('allowed HTTP chat returns the actual fake-provider completion', async () => {
    const h = harness({ env: ALLOW_ENV });
    const response = await http(h.controller.postChatCompletion, chatBody, 'allowed-user');
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data, h.completion);
    assert.equal(h.counts.providerCalls, 1);
  });
  await test('HTTP chat accepts maxTokens 1024 and clamps higher requests to 1024', async () => {
    for (const requestedMaxTokens of [1024, 2048]) {
      const h = harness({ env: ALLOW_ENV });
      const response = await http(h.controller.postChatCompletion, {
        ...chatBody,
        maxTokens: requestedMaxTokens,
      }, 'allowed-user');
      assert.equal(response.status, 200);
      assert.equal(h.requests.length, 1);
      assert.equal(h.requests[0]?.max_tokens, 1024);
      assert.equal(h.counts.providerCalls, 1);
    }
  });
  await test('HTTP provider failure never becomes success', async () => {
    const h = harness({ env: ALLOW_ENV, providerFailure: new Error('Synthetic timeout') });
    const response = await http(h.controller.postChatCompletion, chatBody, 'allowed-user');
    assert.equal(response.status, 500);
    assert.equal(response.body.success, false);
    assert.equal('data' in response.body, false);
    assert.equal(h.counts.usageWrites, 0);
  });
  await test('unauthenticated translation never reaches cache or provider', async () => {
    const h = harness();
    const response = await http(h.controller.postTranslateTravelPhrase, { text: 'Synthetic phrase' });
    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(h.counts.prismaReads, 0);
    noProvider(h);
  });
  await test('translation cache miss DENY cannot return or cache fake translation', async () => {
    const h = harness();
    const response = await http(h.controller.postTranslateTravelPhrase, { text: 'Synthetic phrase' }, 'allowed-user');
    assert.equal(response.status, 503);
    assert.equal(response.body.success, false);
    assert.equal(response.body.code, 'LLM_PROVIDER_ADMISSION_DENIED');
    assert.equal(h.counts.cacheReads, 1);
    assert.equal('data' in response.body, false);
    noProvider(h);
  });
  await test('existing cache hit remains honest and available while paid AI is denied', async () => {
    const h = harness({ cachedText: 'Bản dịch đã lưu (dữ liệu thử).' });
    const response = await http(h.controller.postTranslateTravelPhrase, { text: 'Synthetic phrase' }, 'allowed-user');
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    const data = response.body.data as Record<string, unknown>;
    assert.equal(data.fromCache, true);
    assert.equal(data.translatedText, 'Bản dịch đã lưu (dữ liệu thử).');
    assert.equal(h.counts.keyReads, 0);
    noProvider(h);
  });
  await test('merchant fallback reports unavailable live inventory without calling a provider', async () => {
    const h = harness();
    const reply = await h.formatter.formatVionaMerchantReadOnlyQueryReply({
      toolName: 'merchant_inventory_stock_check', dataAvailable: false, summary: 'No live inventory data available.',
    }, {
      tone: 'friendly', preferredLocale: 'en', systemPromptAddendum: '',
    } as Parameters<typeof h.formatter.formatVionaMerchantReadOnlyQueryReply>[1]);
    assert.match(reply, /cannot check stock levels/);
    assert.match(reply, /contact the merchant directly/);
    noProvider(h);
  });

  console.log(`\n${passed} passed; real provider/DB/network modules never loaded; all environments synthetic.`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
