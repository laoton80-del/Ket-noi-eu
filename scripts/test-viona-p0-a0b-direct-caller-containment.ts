/**
 * Offline P0-A0B tests: actual source, closed VM dependency loader, synthetic environment,
 * fake SDK/Prisma/cron/Facebook only. Never loads .env or a real provider/DB client.
 * Run: tsx scripts/test-viona-p0-a0b-direct-caller-containment.ts
 */
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import * as ts from 'typescript';

import type * as Gate from '../src/services/ai/llmProviderAdmissionGate';
import type * as Router from '../src/services/ai/AIRouterService';
import type * as Viral from '../src/services/marketing/ViralWrapEngine';
import type * as Generator from '../src/services/marketing/AIPostGenerator';
import type * as Worker from '../src/workers/marketingWorker';
import type * as AutoPoster from '../src/services/marketing/AutoPoster';
import type * as Intent from '../src/lib/viona/dispatcher/vionaIntentRouter';
import type * as Dispatch from '../src/services/viona/vionaMarketingContentDispatchService';
import type * as Controller from '../src/controllers/AdminMarketingController';

const laneRoot = resolve(__dirname, '..');

const ALLOW_ENV = {
  VIONA_LLM_PROVIDER_ADMISSION_ENABLED: 'true',
  VIONA_LLM_PROVIDER_ALLOWED_USER_IDS: 'owner-user',
  VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: 'COMPLEX_MARKETING,ROUTING_INQUIRY',
};
const CLASSIFIED_DRAFT = JSON.stringify({
  toolName: 'marketing_content_generator',
  toolInputRaw: { topic: 'Synthetic topic', tone: 'friendly', targetLanguageCode: 'vi' },
  confidence: 0.9,
  rationale: 'Synthetic classification for an offline test.',
});
const compiledSources = new Map<string, string>();

function harness(options: {
  env?: Record<string, string | undefined>;
  bookingExists?: boolean;
  bookingOwner?: string;
  bookingStatus?: string;
  postExists?: boolean;
  postStatus?: string;
  providerError?: Error;
  tagline?: string;
} = {}) {
  const counts = {
    keyReads: 0, modelReads: 0, sdk: 0, provider: 0, reads: 0, writes: 0,
    approvalUpdates: 0, transactions: 0, usageWrites: 0, facebook: 0,
  };
  const events: string[] = [];
  const env: Record<string, string | undefined> = {
    NODE_ENV: 'test', OPENAI_API_KEY: 'fake-offline-key-never-sent', ...options.env,
  };
  const context = createContext({
    process: { env: new Proxy(env, {
      get(target, key, receiver) {
        if (key === 'OPENAI_API_KEY') counts.keyReads += 1;
        if (key === 'OPENAI_MODEL') counts.modelReads += 1;
        return Reflect.get(target, key, receiver);
      },
    }) },
    Error, TypeError, AbortSignal: { timeout: () => ({}) }, console: { info() {}, warn() {}, error() {} },
  }, { codeGeneration: { strings: false, wasm: false } });

  function load<T>(relativePath: string, dependencies: Record<string, unknown> = {}): T {
    const filename = resolve(laneRoot, relativePath);
    let compiled = compiledSources.get(filename);
    if (compiled === undefined) {
      compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      }).outputText;
      compiledSources.set(filename, compiled);
    }
    const module = { exports: {} };
    const closedRequire = (id: string): unknown => {
      if (!Object.prototype.hasOwnProperty.call(dependencies, id)) {
        throw new Error(`Unexpected dependency blocked: ${id}`);
      }
      return dependencies[id];
    };
    const execute = runInContext(`(function(require, module, exports) { ${compiled}\n})`, context, {
      filename, timeout: 1000,
    }) as (require: typeof closedRequire, module: { exports: unknown }, exports: unknown) => void;
    execute(closedRequire, module, module.exports);
    return module.exports as T;
  }

  const state = {
    post: {
      id: 'post-1', content: 'Original draft content', approvedBaseContent: 'Prior approved content',
      status: options.postStatus ?? 'DRAFT', createdAt: new Date('2026-01-01T00:00:00.000Z'), publishedAt: null,
    },
    translations: [{ id: 'translation-old', postId: 'post-1', languageCode: 'en', translatedContent: 'Existing translation', targetAudience: 'Test audience' }],
    drafts: [] as Array<Record<string, unknown>>,
    usage: [] as unknown[],
  };
  const snapshot = () => JSON.stringify(state);
  const read = <T>(value: T): T => { counts.reads += 1; return value; };
  const write = (event: string) => { counts.writes += 1; events.push(event); };
  const prisma = {
    marketingPost: {
      findUnique: async () => read(options.postExists === false ? null : { ...state.post }),
      findUniqueOrThrow: async () => read({ ...state.post, translations: state.translations.map((row) => ({ ...row })) }),
      update: async (args: { data: Partial<typeof state.post> }) => {
        write('approval-update'); counts.approvalUpdates += 1;
        Object.assign(state.post, args.data);
        return { ...state.post };
      },
      updateMany: async (args: { where: { id: string; status: string }; data: Partial<typeof state.post> }) => {
        if (options.postExists === false || state.post.id !== args.where.id || state.post.status !== args.where.status) {
          return { count: 0 };
        }
        write('approval-update'); counts.approvalUpdates += 1;
        Object.assign(state.post, args.data);
        return { count: 1 };
      },
      create: async (args: { data: Record<string, unknown> }) => {
        write('draft-create');
        const row = { id: 'new-draft', createdAt: new Date(), ...args.data };
        state.drafts.push(row);
        return row;
      },
    },
    marketingTranslation: {
      deleteMany: async () => { write('translation-delete'); state.translations = []; return { count: 1 }; },
      createMany: async (args: { data: Array<Omit<(typeof state.translations)[number], 'id'>> }) => {
        write('translation-create');
        state.translations = args.data.map((row, index) => ({ id: `translation-${index}`, ...row }));
        return { count: args.data.length };
      },
      findMany: async () => read(state.translations.map((row) => ({ ...row }))),
    },
    $transaction: async (operations: Promise<unknown>[]) => {
      counts.transactions += 1;
      return Promise.all(operations);
    },
    llmApiUsageLog: { create: async (row: unknown) => {
      write('usage-create'); counts.usageWrites += 1; state.usage.push(row); return {};
    } },
    business: { count: async () => read(1) },
    user: { count: async () => read(2) },
    tourismService: { count: async () => read(3) },
    tourismBooking: {
      count: async () => read(2),
      findUnique: async () => read(options.bookingExists === false ? null : {
        id: 'trip-1', userId: options.bookingOwner ?? 'owner-user', status: options.bookingStatus ?? 'COMPLETED',
        totalPaidVIG: 100, touristFeeVIG: 10,
        startDate: new Date('2026-01-01T00:00:00.000Z'), endDate: new Date('2026-01-02T00:00:00.000Z'),
        business: { name: 'Synthetic destination' }, service: { title: 'Synthetic trip' },
      }),
    },
    profile: { findUnique: async () => read({ languageCode: 'vi' }) },
    aILog: { count: async () => read(1) },
  };
  const prismaModule = { getPrisma: () => prisma };
  const enums = {
    LlmRouterTaskType: Object.fromEntries(['SIMPLE_TRANSLATION', 'ROUTING_INQUIRY', 'COMPLEX_MARKETING', 'DEEP_CONTEXT', 'VIONA_REAL_EXECUTION_CONTENT'].map((task) => [task, task])),
    MarketingPostStatus: { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED', REJECTED: 'REJECTED' },
    TourismBookingStatus: { COMPLETED: 'COMPLETED', CONFIRMED: 'CONFIRMED', PENDING: 'PENDING' },
    BizType: { HOTEL: 'HOTEL' },
  };
  const requests: Array<Record<string, unknown>> = [];
  class FakeOpenAI {
    constructor() { counts.sdk += 1; events.push('sdk-created'); }
    chat = { completions: { create: async (params: Record<string, unknown>) => {
      counts.provider += 1; requests.push(params);
      if (options.providerError) throw options.providerError;
      return { choices: [{ message: { content: options.tagline ?? 'Synthetic trip tagline.' } }] };
    } } };
  }
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
  const router = load<typeof Router>('src/services/ai/AIRouterService.ts', {
    '@prisma/client': enums, openai: FakeOpenAI, '../../lib/prisma': prismaModule,
    './CostGovernorService': costGovernor, './llmProviderAdmissionGate': gate,
  });
  const viral = load<typeof Viral>('src/services/marketing/ViralWrapEngine.ts', {
    '@prisma/client': enums, openai: FakeOpenAI, '../../lib/prisma': prismaModule,
    '../../config/pricingConfig': { CREDIT_EXCHANGE_RATE_USD: 0.01 }, '../ai/CostGovernorService': costGovernor,
    '../ai/llmProviderAdmissionGate': gate,
  });
  const generator = load<typeof Generator>('src/services/marketing/AIPostGenerator.ts', {
    '@prisma/client': enums, '../../constants/globalPerformance': { GLOBAL_MAX_LIST_ITEMS: 100 },
    '../../lib/prisma': prismaModule, '../ai/AIRouterService': router,
  });
  const logger = { logger: { info() {}, warn() {}, error() {} } };
  const worker = load<typeof Worker>('src/workers/marketingWorker.ts', {
    '../services/marketing/AIPostGenerator': generator, '../utils/Logger': logger,
  });
  const autoPoster = load<typeof AutoPoster>('src/services/marketing/AutoPoster.ts', {
    'node-cron': { schedule() { throw new Error('Scheduling is blocked in this test'); } },
    '../../workers/marketingWorker': worker, '../../utils/Logger': logger,
  });
  const entry = {
    name: 'marketing_content_generator', description: 'Synthetic draft tool', category: 'content_generation_draft',
    inputSchema: { topic: 'string', tone: 'string', targetLanguageCode: 'string' },
  };
  const registry = {
    VIONA_TOOL_REGISTRY: [entry],
    findVionaToolRegistryEntry: (name: string) => name === entry.name ? entry : null,
    validateVionaToolInputAgainstSchema: () => ({ ok: true }),
  };
  const intent = load<typeof Intent>('src/lib/viona/dispatcher/vionaIntentRouter.ts', {
    '@prisma/client': enums, '../../../services/ai/AIRouterService': router, './vionaToolRegistry': registry,
  });
  const dispatch = load<typeof Dispatch>('src/services/viona/vionaMarketingContentDispatchService.ts', {
    '../marketing/AIPostGenerator': generator, '../../lib/viona/dispatcher/vionaToolRegistry': registry,
    '../../lib/viona/dispatcher/vionaIntentRouter': intent,
  });
  const hooks = {
    generateTranslations: generator.generateTranslations,
    generateDraft: generator.generateVionaMarketingContentDraft,
    callLlm: intent.defaultVionaDispatchCallLlm,
    runCron: autoPoster.runMarketingDraftCronJob,
  };
  const envelope = load('src/utils/apiEnvelope.ts');
  const targets = load('src/services/marketing/marketingPolyglotTargets.ts');
  const controller = load<typeof Controller>('src/controllers/AdminMarketingController.ts', {
    '@prisma/client': enums, '../constants/globalPerformance': { GLOBAL_MAX_LIST_ITEMS: 100 },
    '../lib/prisma': prismaModule, '../services/ai/llmProviderAdmissionGate': gate,
    '../lib/viona/dispatcher/vionaIntentRouter': { defaultVionaDispatchCallLlm: (prompt: string) => hooks.callLlm(prompt) },
    '../services/marketing/AutoPoster': { runMarketingDraftCronJob: () => hooks.runCron() },
    '../services/marketing/AIPostGenerator': {
      generateTranslations: (...args: Parameters<typeof hooks.generateTranslations>) => hooks.generateTranslations(...args),
      generateVionaMarketingContentDraft: (...args: Parameters<typeof hooks.generateDraft>) => hooks.generateDraft(...args),
    },
    '../services/marketing/marketingPolyglotTargets': targets,
    '../services/marketing/FacebookGraphAPI': { publishToFacebookPage: async () => {
      counts.facebook += 1; throw new Error('Facebook calls are blocked in this test');
    } },
    '../utils/apiEnvelope': envelope, '../services/viona/vionaMarketingContentDispatchService': dispatch,
  });
  return { gate, viral, controller, hooks, counts, events, state, snapshot, requests, env };
}

type Harness = ReturnType<typeof harness>;
type Handler = typeof Controller.postMarketingApproveAndTranslate;
async function http(handler: Handler, body: unknown = {}, id: string = 'post-1') {
  const result = { status: 0, body: {} as Record<string, unknown> };
  const response = {
    status(status: number) { result.status = status; return response; },
    json(payload: Record<string, unknown>) { result.body = payload; return response; },
  };
  await handler(
    { body, params: { id }, query: {}, authUserId: 'owner-user' } as unknown as Parameters<Handler>[0],
    response as unknown as Parameters<Handler>[1]
  );
  return result;
}
function noEffects(h: Harness, before: string): void {
  assert.equal(h.counts.sdk, 0, 'DENY must not construct an SDK client');
  assert.equal(h.counts.provider, 0, 'DENY must not call a provider');
  assert.equal(h.counts.keyReads, 0, 'DENY must precede provider-key access');
  assert.equal(h.counts.writes, 0, 'DENY must not attempt any record mutation');
  assert.equal(h.counts.transactions, 0, 'DENY must not start a write transaction');
  assert.equal(h.counts.facebook, 0);
  assert.equal(h.snapshot(), before, 'all draft/approval/translation/usage records must remain byte-identical');
}
function httpDenied(response: Awaited<ReturnType<typeof http>>): void {
  assert.equal(response.status, 503);
  assert.equal(response.body.success, false);
  assert.equal(response.body.code, 'LLM_PROVIDER_ADMISSION_DENIED');
  assert.equal('data' in response.body, false);
  assert.match(String(response.body.error), /No provider call was made/);
}
const draftBody = { topic: 'Synthetic topic', tone: 'friendly', targetLanguageCode: 'vi' };
let passed = 0;
async function test(name: string, run: () => Promise<void> | void): Promise<void> {
  await run(); passed += 1; console.log(`PASS ${name}`);
}

async function main(): Promise<void> {
  for (const [name, env] of Object.entries({
    'default policy with fake key': {},
    'default policy without key': { OPENAI_API_KEY: undefined },
    'disabled policy': { ...ALLOW_ENV, VIONA_LLM_PROVIDER_ADMISSION_ENABLED: 'false' },
    'unlisted user': { ...ALLOW_ENV, VIONA_LLM_PROVIDER_ALLOWED_USER_IDS: 'different-user' },
    'unlisted task': { ...ALLOW_ENV, VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: 'ROUTING_INQUIRY' },
    'malformed policy': { ...ALLOW_ENV, VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: '*' },
  })) {
    await test(`ViralWrap ${name}: 503 before key/model/SDK`, async () => {
      const h = harness({ env }); const before = h.snapshot();
      await assert.rejects(h.viral.generateUserTripSummary('owner-user', 'trip-1'), (error: unknown) => {
        assert.ok(error instanceof h.viral.ViralWrapError);
        assert.equal(error.statusCode, 503);
        assert.match(error.message, /No provider call was made/);
        return true;
      });
      noEffects(h, before);
      assert.equal(h.counts.modelReads, 0);
    });
  }
  await test('ViralWrap explicit owner/task grant reaches only the fake SDK', async () => {
    const h = harness({ env: { ...ALLOW_ENV, OPENAI_MODEL: 'synthetic-model' } });
    const result = await h.viral.generateUserTripSummary('owner-user', 'trip-1');
    assert.equal(result.viralTagline, 'Synthetic trip tagline.');
    assert.equal(result.bookingId, 'trip-1');
    assert.equal(h.counts.sdk, 1); assert.equal(h.counts.provider, 1);
    assert.equal(h.requests[0]?.model, 'synthetic-model');
    assert.equal(h.counts.writes, 0);
  });
  for (const [name, options, expected] of [
    ['unknown booking', { bookingExists: false }, 404],
    ['different booking owner', { bookingOwner: 'different-user' }, 403],
    ['unconfirmed booking', { bookingStatus: 'PENDING' }, 409],
  ] as const) {
    await test(`ViralWrap preserves ${name} rejection`, async () => {
      const h = harness({ ...options, env: ALLOW_ENV }); const before = h.snapshot();
      await assert.rejects(h.viral.generateUserTripSummary('owner-user', 'trip-1'), (error: unknown) => {
        assert.ok(error instanceof h.viral.ViralWrapError); assert.equal(error.statusCode, expected); return true;
      });
      noEffects(h, before);
    });
  }
  await test('ViralWrap grant without key remains unavailable', async () => {
    const h = harness({ env: { ...ALLOW_ENV, OPENAI_API_KEY: undefined } });
    await assert.rejects(h.viral.generateUserTripSummary('owner-user', 'trip-1'), (error: unknown) => {
      assert.ok(error instanceof h.viral.ViralWrapError); assert.equal(error.statusCode, 503); return true;
    });
    assert.equal(h.counts.sdk, 0); assert.equal(h.counts.provider, 0); assert.equal(h.counts.writes, 0);
  });
  await test('ViralWrap provider failure does not fabricate a tagline', async () => {
    const failure = new Error('Synthetic timeout'); const h = harness({ env: ALLOW_ENV, providerError: failure });
    await assert.rejects(h.viral.generateUserTripSummary('owner-user', 'trip-1'), (error) => error === failure);
    assert.equal(h.counts.provider, 1); assert.equal(h.counts.writes, 0);
  });
  await test('ViralWrap empty provider response remains 502', async () => {
    const h = harness({ env: ALLOW_ENV, tagline: '' });
    await assert.rejects(h.viral.generateUserTripSummary('owner-user', 'trip-1'), (error: unknown) => {
      assert.ok(error instanceof h.viral.ViralWrapError); assert.equal(error.statusCode, 502); return true;
    });
    assert.equal(h.counts.provider, 1); assert.equal(h.counts.writes, 0);
  });

  await test('approve-and-translate actual DENY preserves all existing records', async () => {
    const h = harness(); const before = h.snapshot();
    httpDenied(await http(h.controller.postMarketingApproveAndTranslate, { content: 'Replacement content' }));
    noEffects(h, before);
  });
  await test('approve-and-translate preserves records on generic generation failure', async () => {
    const h = harness(); const before = h.snapshot();
    h.hooks.generateTranslations = async () => { throw new Error('Synthetic upstream failure'); };
    const response = await http(h.controller.postMarketingApproveAndTranslate, { content: 'Replacement content' });
    assert.equal(response.status, 500); assert.equal(response.body.success, false);
    assert.equal(response.body.code, undefined); noEffects(h, before);
  });
  await test('approval waits for translation completion before changing content', async () => {
    const h = harness(); const before = h.snapshot();
    let started!: () => void; let finish!: () => void;
    const entered = new Promise<void>((resolve) => { started = resolve; });
    const release = new Promise<void>((resolve) => { finish = resolve; });
    h.hooks.generateTranslations = async (id, base) => {
      assert.equal(id, 'post-1'); assert.equal(base, 'Replacement content');
      h.events.push('translation-start'); started(); await release;
      h.events.push('translation-ready'); return [];
    };
    const pending = http(h.controller.postMarketingApproveAndTranslate, { content: 'Replacement content' });
    await entered;
    assert.equal(h.snapshot(), before); assert.equal(h.counts.writes, 0);
    finish(); const response = await pending;
    assert.equal(response.status, 200); assert.equal(response.body.success, true);
    assert.equal(h.state.post.content, 'Replacement content');
    assert.equal(h.state.post.approvedBaseContent, 'Replacement content');
    assert.equal(h.counts.approvalUpdates, 1);
    assert.deepEqual(h.events, ['translation-start', 'translation-ready', 'approval-update']);
  });
  await test('post published during translation rejects approval without overwriting content', async () => {
    const h = harness();
    const originalContent = h.state.post.content;
    const originalApprovedBaseContent = h.state.post.approvedBaseContent;
    h.hooks.generateTranslations = async () => {
      h.state.post.status = 'PUBLISHED';
      return [];
    };
    const response = await http(h.controller.postMarketingApproveAndTranslate, { content: 'Replacement content' });
    assert.equal(response.status, 409);
    assert.equal(response.body.success, false);
    assert.equal('data' in response.body, false);
    assert.match(String(response.body.error), /trạng thái bài đã đổi trong lúc dịch; phê duyệt không được áp dụng/i);
    assert.equal(h.state.post.status, 'PUBLISHED');
    assert.equal(h.state.post.content, originalContent);
    assert.equal(h.state.post.approvedBaseContent, originalApprovedBaseContent);
    assert.equal(h.counts.approvalUpdates, 0);
    assert.equal(h.counts.provider, 0);
    assert.equal(h.counts.sdk, 0);
  });
  for (const [name, options, body, id, expected] of [
    ['missing id', {}, {}, '', 400],
    ['missing post', { postExists: false }, {}, 'post-1', 404],
    ['published post', { postStatus: 'PUBLISHED' }, {}, 'post-1', 409],
  ] as const) {
    await test(`approve-and-translate preserves ${name} validation`, async () => {
      const h = harness(options); const before = h.snapshot();
      const response = await http(h.controller.postMarketingApproveAndTranslate, body, id);
      assert.equal(response.status, expected); assert.equal(response.body.success, false); noEffects(h, before);
    });
  }

  await test('trigger-auto-post actual pipeline DENY is 503 with no draft write', async () => {
    const h = harness(); const before = h.snapshot();
    httpDenied(await http(h.controller.postTriggerAutoPost)); noEffects(h, before);
  });
  await test('generate-draft actual swallowed classification DENY is recovered as 503', async () => {
    const h = harness(); const before = h.snapshot();
    httpDenied(await http(h.controller.postAdminMarketingGenerateDraft, draftBody)); noEffects(h, before);
  });
  await test('generate-draft actual swallowed generation DENY is recovered as 503', async () => {
    const h = harness(); const before = h.snapshot();
    h.hooks.callLlm = async () => CLASSIFIED_DRAFT;
    httpDenied(await http(h.controller.postAdminMarketingGenerateDraft, draftBody)); noEffects(h, before);
  });
  for (const endpoint of ['approve', 'trigger', 'draft'] as const) {
    await test(`${endpoint}: enabling server policy does not invent a missing service identity`, async () => {
      const h = harness({ env: ALLOW_ENV }); const before = h.snapshot();
      const handler = endpoint === 'approve' ? h.controller.postMarketingApproveAndTranslate
        : endpoint === 'trigger' ? h.controller.postTriggerAutoPost : h.controller.postAdminMarketingGenerateDraft;
      httpDenied(await http(handler, endpoint === 'draft' ? draftBody : { content: 'Replacement content' }));
      noEffects(h, before);
    });
  }
  for (const reason of ['disabled', 'identity_required', 'user_not_allowed'] as const) {
    for (const endpoint of ['approve', 'trigger', 'draft'] as const) {
      await test(`${endpoint}: typed ${reason} always maps to 503 + code`, async () => {
        const h = harness(); const before = h.snapshot();
        const reject = async (): Promise<never> => { throw new h.gate.LlmProviderAdmissionDeniedError(reason); };
        if (endpoint === 'approve') h.hooks.generateTranslations = reject;
        if (endpoint === 'trigger') h.hooks.runCron = reject;
        if (endpoint === 'draft') h.hooks.callLlm = reject;
        const handler = endpoint === 'approve' ? h.controller.postMarketingApproveAndTranslate
          : endpoint === 'trigger' ? h.controller.postTriggerAutoPost : h.controller.postAdminMarketingGenerateDraft;
        httpDenied(await http(handler, endpoint === 'draft' ? draftBody : {})); noEffects(h, before);
      });
    }
  }
  await test('generate-draft direct dispatcher denial also maps to 503', async () => {
    const h = harness(); const before = h.snapshot();
    const handler: Handler = (req, res) => h.controller.postAdminMarketingGenerateDraft(req, res, {
      dispatch: async () => { throw new h.gate.LlmProviderAdmissionDeniedError('disabled'); },
    });
    httpDenied(await http(handler, draftBody)); noEffects(h, before);
  });
  for (const callback of ['callLlm', 'generateDraft'] as const) {
    await test(`swallowed ${callback} DENY takes precedence over an erroneous success result`, async () => {
      const h = harness(); const before = h.snapshot();
      const handler: Handler = (req, res) => h.controller.postAdminMarketingGenerateDraft(req, res, {
        dispatch: async (_input, deps) => {
          try {
            if (callback === 'callLlm') await deps?.callLlm?.('Synthetic prompt');
            else await deps?.generateDraft?.(draftBody);
          } catch { /* Simulate a collaborator swallowing the denial. */ }
          return { ok: true, toolName: 'marketing_content_generator', marketingPostId: 'must-not-return', content: 'must-not-return', confidence: 1 };
        },
      });
      httpDenied(await http(handler, draftBody)); noEffects(h, before);
    });
  }
  await test('unrelated classifier failure stays 502 without an admission code', async () => {
    const h = harness(); const before = h.snapshot();
    h.hooks.callLlm = async () => { throw new Error('Synthetic upstream failure'); };
    const response = await http(h.controller.postAdminMarketingGenerateDraft, draftBody);
    assert.equal(response.status, 502); assert.equal(response.body.success, false);
    assert.equal(response.body.code, undefined); noEffects(h, before);
  });
  await test('unrelated draft-generation failure stays 502 without an admission code', async () => {
    const h = harness(); const before = h.snapshot(); h.hooks.callLlm = async () => CLASSIFIED_DRAFT;
    h.hooks.generateDraft = async () => { throw new Error('Synthetic generation failure'); };
    const response = await http(h.controller.postAdminMarketingGenerateDraft, draftBody);
    assert.equal(response.status, 502); assert.equal(response.body.success, false);
    assert.equal(response.body.code, undefined); noEffects(h, before);
  });
  await test('trigger unrelated error stays 500 without an admission code', async () => {
    const h = harness(); const before = h.snapshot();
    h.hooks.runCron = async () => { throw new Error('Synthetic job failure'); };
    const response = await http(h.controller.postTriggerAutoPost);
    assert.equal(response.status, 500); assert.equal(response.body.success, false);
    assert.equal(response.body.code, undefined); noEffects(h, before);
  });
  await test('generate-draft success from explicit synthetic collaborators remains available', async () => {
    const h = harness(); h.hooks.callLlm = async () => CLASSIFIED_DRAFT;
    h.hooks.generateDraft = async () => ({ marketingPostId: 'synthetic-draft', content: 'Synthetic draft for review.' });
    const response = await http(h.controller.postAdminMarketingGenerateDraft, draftBody);
    assert.equal(response.status, 200); assert.equal(response.body.success, true);
    assert.equal((response.body.data as Record<string, unknown>).marketingPostId, 'synthetic-draft');
    assert.equal(h.counts.provider, 0); assert.equal(h.counts.facebook, 0);
  });
  await test('denial capture is scoped to one request', async () => {
    const h = harness(); const before = h.snapshot();
    httpDenied(await http(h.controller.postAdminMarketingGenerateDraft, draftBody));
    h.hooks.callLlm = async () => { throw new Error('Unrelated later failure'); };
    const response = await http(h.controller.postAdminMarketingGenerateDraft, draftBody);
    assert.equal(response.status, 502); assert.equal(response.body.code, undefined); noEffects(h, before);
  });
  console.log(`\n${passed} passed; real SDK/DB/cron/Facebook never loaded; all environments synthetic.`);
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
