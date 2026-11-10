/**
 * Offline P0-A1 core checks. The actual governor source is exercised with a
 * closed fake SQL boundary; the two Express callers run in closed VMs with a
 * fake governor and SDK. No .env, network, real Prisma client, or provider is
 * loaded. Run: npx tsx scripts/test-viona-cost-governor-core.ts
 */
import * as assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import OpenAI from 'openai';
import * as ts from 'typescript';

import {
  assertCostGovernorReservation,
  COST_GOVERNOR_ENV_NAMES,
  CostGovernorDeniedError,
  CostGovernorService,
  estimateInputTokensUpperBound,
  readCostGovernorConfig,
  type CostGovernorReserveInput,
  type CostGovernorReserveResult,
} from '../src/services/ai/CostGovernorService';
import { costMicrousd } from '../src/services/ai/costModel';
import type * as Gate from '../src/services/ai/llmProviderAdmissionGate';
import type * as Router from '../src/services/ai/AIRouterService';
import type * as Viral from '../src/services/marketing/ViralWrapEngine';

const root = resolve(__dirname, '..');
function normalizeCrossRealm(value: unknown): unknown {
  const serialized = JSON.stringify(value, (_key, nestedValue: unknown) =>
    typeof nestedValue === 'bigint' ? `__big__${nestedValue.toString()}` : nestedValue
  );
  if (serialized === undefined) throw new TypeError('cross-realm assertion value is not JSON-serializable');
  return JSON.parse(serialized) as unknown;
}
const GOVERNOR_ENV: Record<string, string> = {
  [COST_GOVERNOR_ENV_NAMES.userDailyCap]: '100000',
  [COST_GOVERNOR_ENV_NAMES.globalDailyCap]: '1000000',
  [COST_GOVERNOR_ENV_NAMES.globalMonthlyCap]: '10000000',
  [COST_GOVERNOR_ENV_NAMES.userInflightLimit]: '2',
  [COST_GOVERNOR_ENV_NAMES.globalInflightLimit]: '5',
  [COST_GOVERNOR_ENV_NAMES.providerTimeoutMs]: '45000',
};
const ADMISSION_ENV = {
  VIONA_LLM_PROVIDER_ADMISSION_ENABLED: 'true',
  VIONA_LLM_PROVIDER_ALLOWED_USER_IDS: 'subject-a',
  VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: 'ROUTING_INQUIRY,COMPLEX_MARKETING',
};
const TASK_TYPES = {
  SIMPLE_TRANSLATION: 'SIMPLE_TRANSLATION',
  ROUTING_INQUIRY: 'ROUTING_INQUIRY',
  COMPLEX_MARKETING: 'COMPLEX_MARKETING',
  DEEP_CONTEXT: 'DEEP_CONTEXT',
  VIONA_REAL_EXECUTION_CONTENT: 'VIONA_REAL_EXECUTION_CONTENT',
};

type PriceRow = Readonly<{
  id: string;
  inputMicrousdPerMillionTokens: bigint | number | string;
  outputMicrousdPerMillionTokens: bigint | number | string;
  audioInputMicrousdPerSecond: bigint | number | string;
  audioOutputMicrousdPerSecond: bigint | number | string;
  imageMicrousdPerUnit: bigint | number | string;
}>;
type OperationRow = Readonly<Record<string, unknown> & { id: string }>;

function operationRow(overrides: Readonly<{ status?: string }> = {}): OperationRow {
  const window = new Date('2026-11-04T00:00:00.000Z');
  return {
    id: 'operation-1',
    subjectId: 'subject-a',
    idempotencyKey: 'key-1',
    rail: 'EXPRESS',
    provider: 'openai',
    model: 'mini-model',
    operationKind: 'ROUTED_CHAT_COMPLETION',
    priceVersionId: 'price-1',
    inputMicrousdPerMillionTokens: 150000n,
    outputMicrousdPerMillionTokens: 600000n,
    audioInputMicrousdPerSecond: 0n,
    audioOutputMicrousdPerSecond: 0n,
    imageMicrousdPerUnit: 0n,
    providerTimeoutMs: 45000n,
    reservedMicrousd: 10n,
    settledMicrousd: 0n,
    status: 'RESERVED',
    windowStartDay: window,
    windowStartMonth: window,
    dispatchedAt: null,
    expiresAt: new Date('2026-11-04T00:05:00.000Z'),
    ...overrides,
  };
}

class FakeSqlDatabase {
  readonly counterScopes: string[] = [];
  private counterAttempts = 0;

  constructor(private readonly options: Readonly<{
    prices?: readonly PriceRow[];
    userInflight?: bigint;
    globalInflight?: bigint;
    counterFailAt?: number;
    existing?: OperationRow | null;
    failLedger?: boolean;
    failDatabase?: boolean;
  }> = {}) {}

  async $transaction<T>(callback: (transaction: FakeSqlDatabase) => Promise<T>): Promise<T> {
    if (this.options.failDatabase) throw new Error('synthetic database unavailable');
    return callback(this);
  }

  async $executeRawUnsafe(query: string, ..._values: unknown[]): Promise<number> {
    if (this.options.failDatabase || (this.options.failLedger && query.includes('AiCostLedgerEntry'))) {
      throw new Error('synthetic ledger unavailable');
    }
    return 1;
  }

  async $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T> {
    if (this.options.failDatabase) throw new Error('synthetic database unavailable');
    if (query.includes('FROM "AiModelPrice"')) {
      return (this.options.prices ?? [
        {
          id: 'price-1',
          inputMicrousdPerMillionTokens: 150000n,
          outputMicrousdPerMillionTokens: 600000n,
          audioInputMicrousdPerSecond: 0n,
          audioOutputMicrousdPerSecond: 0n,
          imageMicrousdPerUnit: 0n,
        },
      ]) as T;
    }
    if (query.includes('WHERE "subjectId" = $1 AND "idempotencyKey" = $2')) {
      return (this.options.existing ? [this.options.existing] : []) as T;
    }
    if (query.includes('pg_advisory_xact_lock')) return [] as T;
    if (query.includes('count(*)::bigint')) {
      const subjectId = values[0];
      const count = subjectId === null ? (this.options.globalInflight ?? 0n) : (this.options.userInflight ?? 0n);
      return [{ count }] as T;
    }
    if (query.includes('INSERT INTO "AiCostBudgetCounter"')) {
      this.counterAttempts += 1;
      this.counterScopes.push(String(values[1]));
      return (this.options.counterFailAt === this.counterAttempts ? [] : [{ id: `counter-${this.counterAttempts}` }]) as T;
    }
    if (query.includes('INSERT INTO "AiCostOperation"')) return [operationRow()] as T;
    throw new Error(`Unexpected fake SQL query: ${query.slice(0, 80)}`);
  }
}

function reserveInput(overrides: Partial<CostGovernorReserveInput> = {}): CostGovernorReserveInput {
  return {
    subjectId: 'subject-a',
    idempotencyKey: 'key-1',
    rail: 'EXPRESS',
    provider: 'openai',
    model: 'mini-model',
    operationKind: 'ROUTED_CHAT_COMPLETION',
    inputTokensUpperBound: 10n,
    outputTokens: 20n,
    ...overrides,
  };
}

async function withGovernorEnv<T>(run: () => Promise<T> | T): Promise<T> {
  const before = new Map<string, string | undefined>();
  for (const [name, value] of Object.entries(GOVERNOR_ENV)) {
    before.set(name, process.env[name]);
    process.env[name] = value;
  }
  try {
    return await run();
  } finally {
    for (const [name, value] of before) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

function serviceFor(database: FakeSqlDatabase): CostGovernorService {
  return new CostGovernorService(() => database as never);
}

type GovernorCall = 'reserve' | 'markDispatching' | 'settle' | 'release' | 'markOutcomeUnknown';
type RouterHarnessOptions = Readonly<{
  reserveDecision?: CostGovernorReserveResult;
  providerFailure?: Error & Readonly<{ status?: number }>;
  completion?: Record<string, unknown>;
  awaitAbort?: boolean;
  nativeAbortSignal?: boolean;
  providerTimeoutMs?: number;
  openAiConstructor?: unknown;
  visionImageInputTokensPerImage?: string;
  markDispatchingError?: string;
  settleError?: Error;
  markOutcomeUnknownError?: Error;
  reserveWait?: Promise<void>;
  usageLogFailure?: Error;
}>;

function compileVm<T>(
  context: ReturnType<typeof createContext>,
  relativePath: string,
  dependencies: Record<string, unknown>
): T {
  const filename = resolve(root, relativePath);
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const closedRequire = (id: string): unknown => {
    if (!Object.prototype.hasOwnProperty.call(dependencies, id)) {
      throw new Error(`Unexpected runtime dependency blocked: ${id}`);
    }
    return dependencies[id];
  };
  const execute = runInContext(`(function(require, module, exports) { ${output}\n})`, context, {
    filename,
    timeout: 1000,
  }) as (require: typeof closedRequire, module: { exports: unknown }, exports: unknown) => void;
  execute(closedRequire, module, module.exports);
  return module.exports as T;
}

function providerHarness(options: RouterHarnessOptions = {}) {
  const calls: Record<GovernorCall, number> = {
    reserve: 0, markDispatching: 0, settle: 0, release: 0, markOutcomeUnknown: 0,
  };
  const keyReads = { value: 0 };
  const sdk = { value: 0 };
  const sdkOptions: Array<Readonly<{ apiKey?: string; maxRetries?: number }>> = [];
  const provider = { value: 0 };
  const inflightSlots = { value: 0 };
  const abortEvents = { value: 0 };
  const activeAbortListeners = { value: 0 };
  const settlements: unknown[] = [];
  const releases: unknown[] = [];
  const reserveInputs: unknown[] = [];
  const providerParams: unknown[] = [];
  const dispatchArgumentCounts: number[] = [];
  const environment: Record<string, string | undefined> = {
    ...ADMISSION_ENV,
    OPENAI_API_KEY: 'offline-fake-key-never-sent',
    VISION_IMAGE_INPUT_TOKENS_PER_IMAGE: options.visionImageInputTokensPerImage,
  };
  const env = new Proxy(environment, {
    get(target, property, receiver) {
      if (property === 'OPENAI_API_KEY') keyReads.value += 1;
      return Reflect.get(target, property, receiver);
    },
  });
  const context = createContext({
    process: { env },
    Error,
    TypeError,
    AbortSignal: options.awaitAbort || options.nativeAbortSignal ? AbortSignal : { timeout: () => ({}) },
    console: { info() {}, error() {} },
  }, { codeGeneration: { strings: false, wasm: false } });
  const enums = { LlmRouterTaskType: TASK_TYPES, TourismBookingStatus: { COMPLETED: 'COMPLETED', CONFIRMED: 'CONFIRMED' } };
  const gate = compileVm<typeof Gate>(context, 'src/services/ai/llmProviderAdmissionGate.ts', {});
  class SyntheticCostGovernorDeniedError extends gate.LlmProviderAdmissionDeniedError {
    constructor(reason: string) {
      super('disabled');
      Object.defineProperty(this, 'code', { value: `COST_GOVERNOR_${reason}` });
      Object.defineProperty(this, 'reason', { value: reason });
    }
  }
  const allow = options.reserveDecision ?? {
    decision: 'ALLOW_RESERVED' as const,
    operation: { id: 'vm-operation' },
    providerTimeoutMs: options.providerTimeoutMs ?? 1,
  };
  const freeInflightSlot = () => {
    if (inflightSlots.value > 0) inflightSlots.value -= 1;
  };
  const governor = {
    createServerIdempotencyKey: () => 'vm-idempotency-key',
    reserve: async (input: unknown) => {
      calls.reserve += 1;
      reserveInputs.push(input);
      if (options.reserveWait) await options.reserveWait;
      if (allow.decision === 'ALLOW_RESERVED') inflightSlots.value += 1;
      return allow;
    },
    markDispatching: async (...argumentsForDispatch: unknown[]) => {
      calls.markDispatching += 1;
      dispatchArgumentCounts.push(argumentsForDispatch.length);
      if (options.markDispatchingError) throw new SyntheticCostGovernorDeniedError(options.markDispatchingError);
      return true;
    },
    settle: async (input: unknown) => {
      calls.settle += 1;
      settlements.push(input);
      if (options.settleError) throw options.settleError;
      freeInflightSlot();
      return { applied: true };
    },
    release: async (input: unknown) => {
      calls.release += 1; releases.push(input); freeInflightSlot(); return true;
    },
    markOutcomeUnknown: async () => {
      calls.markOutcomeUnknown += 1;
      if (options.markOutcomeUnknownError) throw options.markOutcomeUnknownError;
      freeInflightSlot();
      return true;
    },
  };
  const costGovernor = {
    CostGovernorDeniedError: SyntheticCostGovernorDeniedError,
    assertCostGovernorReservation: (result: CostGovernorReserveResult) => {
      if (result.decision !== 'ALLOW_RESERVED') throw new SyntheticCostGovernorDeniedError(result.decision);
    },
    estimateInputTokensUpperBound,
    getCostGovernor: () => governor,
  };
  const goodCompletion = options.completion ?? {
    id: 'provider-receipt',
    choices: [{ message: { content: 'Real synthetic answer.' } }],
    usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
  };
  class FakeOpenAI {
    constructor(configuration: Readonly<{ apiKey?: string; maxRetries?: number }> = {}) {
      sdk.value += 1;
      sdkOptions.push({ ...configuration });
    }
    chat = { completions: { create: async (_params: unknown, requestOptions?: Readonly<{ signal?: AbortSignal }>) => {
      provider.value += 1;
      providerParams.push(_params);
      if (options.awaitAbort) {
        const signal = requestOptions?.signal;
        if (!signal) throw new Error('timeout proof expected AIRouterService to pass an AbortSignal');
        return new Promise<never>((_resolve, reject) => {
          let finished = false;
          const onAbort = () => {
            if (finished) return;
            finished = true;
            abortEvents.value += 1;
            activeAbortListeners.value -= 1;
            signal.removeEventListener('abort', onAbort);
            reject(Object.assign(new Error('synthetic provider timeout after abort'), {
              status: 503,
              code: 'ETIMEDOUT',
            }));
          };
          activeAbortListeners.value += 1;
          signal.addEventListener('abort', onAbort, { once: true });
          if (signal.aborted) onAbort();
        });
      }
      if (options.providerFailure) throw options.providerFailure;
      return goodCompletion;
    } } };
  }
  const prisma = {
    llmApiUsageLog: {
      create: async () => {
        if (options.usageLogFailure) throw options.usageLogFailure;
        return {};
      },
    },
  };
  const router = compileVm<typeof Router>(context, 'src/services/ai/AIRouterService.ts', {
    '@prisma/client': enums,
    openai: options.openAiConstructor ?? FakeOpenAI,
    '../../lib/prisma': { getPrisma: () => prisma },
    './CostGovernorService': costGovernor,
    './llmProviderAdmissionGate': gate,
  });
  const viralPrisma = {
    tourismBooking: {
      findUnique: async () => ({
        id: 'trip-1', userId: 'subject-a', status: 'COMPLETED', totalPaidVIG: 100, touristFeeVIG: 10,
        startDate: new Date('2026-11-01T00:00:00.000Z'), endDate: new Date('2026-11-02T00:00:00.000Z'),
        business: { name: 'Synthetic destination' }, service: { title: 'Synthetic service' },
      }),
      count: async () => 1,
    },
    profile: { findUnique: async () => ({ languageCode: 'en' }) },
    aILog: { count: async () => 0 },
  };
  const viral = compileVm<typeof Viral>(context, 'src/services/marketing/ViralWrapEngine.ts', {
    '@prisma/client': enums,
    openai: options.openAiConstructor ?? FakeOpenAI,
    '../../lib/prisma': { getPrisma: () => viralPrisma },
    '../../config/pricingConfig': { CREDIT_EXCHANGE_RATE_USD: 0.01 },
    '../ai/CostGovernorService': costGovernor,
    '../ai/llmProviderAdmissionGate': gate,
  });
  return {
    router, viral, calls, keyReads, sdk, sdkOptions, provider, settlements, releases,
    reserveInputs, providerParams, dispatchArgumentCounts, inflightSlots, abortEvents, activeAbortListeners,
  };
}

function providerErrorResponse(status: number): Response {
  return new Response(JSON.stringify({
    error: {
      message: `synthetic HTTP ${status}`,
      type: status === 429 ? 'rate_limit_error' : 'server_error',
    },
  }), { status, headers: { 'content-type': 'application/json' } });
}

function providerSuccessResponse(): Response {
  return new Response(JSON.stringify({
    id: 'unexpected-retry-success',
    object: 'chat.completion',
    created: 0,
    model: 'synthetic',
    choices: [{ index: 0, message: { role: 'assistant', content: 'unexpected retry' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

function httpStubOpenAi(
  responses: readonly Response[],
  httpCalls: { value: number },
  constructorOptions: Array<Readonly<{ apiKey?: string; maxRetries?: number }>>
): unknown {
  return class HttpStubOpenAI {
    constructor(configuration: Readonly<{ apiKey?: string; maxRetries?: number }>) {
      constructorOptions.push({ ...configuration });
      return new OpenAI({
        apiKey: configuration.apiKey ?? '',
        maxRetries: configuration.maxRetries,
        baseURL: 'https://offline.invalid/v1',
        fetch: async () => {
          const response = responses[httpCalls.value] ?? responses[responses.length - 1];
          httpCalls.value += 1;
          if (!response) throw new Error('synthetic HTTP stub has no response');
          return response.clone();
        },
      });
    }
  };
}

function routedInput(overrides: Partial<Router.RoutedChatCompletionInput> = {}): Router.RoutedChatCompletionInput {
  return {
    taskType: 'ROUTING_INQUIRY',
    userId: 'subject-a',
    params: { messages: [{ role: 'user', content: 'Synthetic input' }], max_tokens: 20 },
    ...overrides,
  };
}

function routedInputWithUncheckedParams(params: Record<string, unknown>): Router.RoutedChatCompletionInput {
  return {
    taskType: 'ROUTING_INQUIRY',
    userId: 'subject-a',
    params: params as Router.RoutedChatCompletionInput['params'],
  };
}

type FakeControllerResponse = Readonly<{
  status(code: number): FakeControllerResponse;
  json(body: unknown): FakeControllerResponse;
}>;

function controllerHarness(options: Readonly<{ routerError?: Error }> = {}) {
  const routedInputs: unknown[] = [];
  const consoleErrors: unknown[][] = [];
  const completion = { id: 'controller-offline-completion', choices: [{ message: { content: 'synthetic response' } }] };
  class FakeAdmissionDeniedError extends Error {
    readonly httpStatus = 503;
    readonly code = 'admission_denied';
  }
  class FakeGatewayError extends Error {
    readonly httpStatus = 402;
  }
  const jsonFail = (response: FakeControllerResponse, message: string, status: number, code?: string): void => {
    response.status(status).json({ success: false, error: message, ...(code === undefined ? {} : { code }) });
  };
  const jsonOk = (response: FakeControllerResponse, data: unknown): void => {
    response.status(200).json({ success: true, data });
  };
  const controller = compileVm<{ postChatCompletion(req: unknown, res: unknown): Promise<void> }>(
    createContext({
      console: { error: (...values: unknown[]) => { consoleErrors.push(values); } },
    }, { codeGeneration: { strings: false, wasm: false } }),
    'src/controllers/AIController.ts',
    {
      '@prisma/client': {
        LlmRouterTaskType: TASK_TYPES,
        Prisma: { TransactionIsolationLevel: { Serializable: 'Serializable' } },
        TxStatus: {},
        TxType: {},
      },
      '../core/feature-flags/featureFlags': { getFeatureFlags: () => ({ legalScanEnabled: false }) },
      '../domain/legalScanPricing': {
        countWordsInDocument: () => 0,
        estimateLegalScanPages: () => 0,
        legalScanPriceVig: () => 0,
      },
      '../lib/prisma': { getPrisma: () => ({}) },
      '../services/ai/AIGateway': {
        AIGatewayInsufficientVigError: FakeGatewayError,
        assertMinimumSpendableVig: async () => {},
      },
      '../services/ai/AIRouterService': {
        createRoutedChatCompletion: async (input: unknown) => {
          routedInputs.push(input);
          if (options.routerError) throw options.routerError;
          return completion;
        },
      },
      '../services/ai/llmProviderAdmissionGate': { LlmProviderAdmissionDeniedError: FakeAdmissionDeniedError },
      '../services/ai/TranslationService': { translateTravelPhraseToVietnamese: async () => ({ translatedText: '' }) },
      '../utils/apiEnvelope': { jsonFail, jsonOk },
    }
  );
  return { controller, routedInputs, completion, consoleErrors };
}

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'] as const;

function listSourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...listSourceFiles(fullPath));
    else if ((SOURCE_EXTENSIONS as readonly string[]).includes(extname(fullPath))) files.push(fullPath);
  }
  return files;
}

function relativeSourceImports(source: string): string[] {
  const imports = new Set<string>();
  const fromPattern = /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;
  const requirePattern = /\brequire\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;
  for (const pattern of [fromPattern, requirePattern]) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) imports.add(match[1]);
  }
  return [...imports];
}

function resolveRelativeSource(fromFile: string, specifier: string): string | null {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => join(base, `index${extension}`)),
  ];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
}

function sosImportPathsToPaidAi(): readonly string[] {
  const sourceRoot = resolve(root, 'src');
  const entries = listSourceFiles(sourceRoot)
    .filter((file) => /(?:sos|emergency)/i.test(file));
  const forbidden = new Set([
    resolve(root, 'src/services/ai/AIRouterService.ts'),
    resolve(root, 'src/services/marketing/ViralWrapEngine.ts'),
    resolve(root, 'src/services/ai/CostGovernorService.ts'),
  ]);
  const hits: string[] = [];
  for (const entry of entries) {
    const pending: Array<Readonly<{ file: string; chain: readonly string[] }>> = [{ file: entry, chain: [entry] }];
    const visited = new Set<string>();
    while (pending.length > 0) {
      const current = pending.pop()!;
      if (visited.has(current.file)) continue;
      visited.add(current.file);
      if (forbidden.has(current.file)) {
        hits.push(current.chain.map((file) => file.slice(root.length + 1).replace(/\\/g, '/')).join(' -> '));
        continue;
      }
      const source = readFileSync(current.file, 'utf8');
      for (const specifier of relativeSourceImports(source)) {
        const dependency = resolveRelativeSource(current.file, specifier);
        if (dependency) pending.push({ file: dependency, chain: [...current.chain, dependency] });
      }
    }
  }
  return hits;
}

let passed = 0;
async function test(name: string, run: () => Promise<void> | void): Promise<void> {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function main(): Promise<void> {
  await test('unit cost model prices token pairs with one total ceil, TTS input tokens, and STT seconds', () => {
    const tokenPrices = {
      inputMicrousdPerMillionTokens: 1n,
      outputMicrousdPerMillionTokens: 1n,
      audioInputMicrousdPerSecond: 0n,
      audioOutputMicrousdPerSecond: 0n,
      imageMicrousdPerUnit: 0n,
    };
    assert.equal(costMicrousd('ROUTED_CHAT_COMPLETION', {
      model: 'gpt-4o-mini', inputTokens: 1n, outputTokens: 1n, prices: tokenPrices,
    }), 1n, 'input/output token cost must round once over their combined numerator');
    assert.equal(costMicrousd('TTS', {
      model: 'gpt-4o-mini-tts',
      inputTokens: 10n,
      outputTokens: 0n,
      prices: { ...tokenPrices, inputMicrousdPerMillionTokens: 600000n, outputMicrousdPerMillionTokens: 0n },
    }), 6n);
    assert.equal(costMicrousd('STT', {
      model: 'gpt-4o-transcribe',
      inputTokens: 0n,
      outputTokens: 0n,
      audioSeconds: 2n,
      prices: { ...tokenPrices, inputMicrousdPerMillionTokens: 0n, outputMicrousdPerMillionTokens: 0n, audioInputMicrousdPerSecond: 100n },
    }), 200n);
  });

  await test('unit cost model denies missing rates, unknown units, mismatched models, and negative quantities', () => {
    const prices = {
      inputMicrousdPerMillionTokens: 150000n,
      outputMicrousdPerMillionTokens: 600000n,
      audioInputMicrousdPerSecond: 0n,
      audioOutputMicrousdPerSecond: 0n,
      imageMicrousdPerUnit: 0n,
    };
    assert.equal(costMicrousd('STT', {
      model: 'gpt-4o-transcribe', inputTokens: 0n, outputTokens: 0n, audioSeconds: 2n, prices,
    }), null);
    assert.equal(costMicrousd('FUTURE_UNMAPPED_OPERATION', {
      model: 'fixture', inputTokens: 1n, outputTokens: 1n, prices,
    }), null);
    assert.equal(costMicrousd('STT', {
      model: 'wrong-model', inputTokens: 0n, outputTokens: 0n, audioSeconds: 1n, prices,
    }), null);
    assert.equal(costMicrousd('TTS', {
      model: 'gpt-4o-mini-tts', inputTokens: -1n, outputTokens: 0n, prices,
    }), null);
    assert.equal(costMicrousd('ROUTED_CHAT_COMPLETION', {
      model: 'gpt-4o-mini', inputTokens: 1n, outputTokens: 1n,
      prices: { ...prices, outputMicrousdPerMillionTokens: 0n },
    }), null);
  });

  await test('zero computed reserve denies before budget counters or operation writes', async () => {
    const database = new FakeSqlDatabase();
    await withGovernorEnv(async () => {
      const result = await serviceFor(database).reserve(reserveInput({
        idempotencyKey: 'zero-cost-denied', inputTokensUpperBound: 0n, outputTokens: 0n,
      }));
      assert.equal(result.decision, 'DENY_POLICY');
    });
    assert.deepEqual(database.counterScopes, []);
  });

  await test('missing STT second rate denies before budget counters', async () => {
    const database = new FakeSqlDatabase({ prices: [{
      id: 'price-no-audio-rate',
      inputMicrousdPerMillionTokens: 0n,
      outputMicrousdPerMillionTokens: 0n,
      audioInputMicrousdPerSecond: 0n,
      audioOutputMicrousdPerSecond: 0n,
      imageMicrousdPerUnit: 0n,
    }] });
    await withGovernorEnv(async () => {
      const result = await serviceFor(database).reserve(reserveInput({
        idempotencyKey: 'missing-stt-rate',
        model: 'gpt-4o-transcribe',
        operationKind: 'STT',
        inputTokensUpperBound: 0n,
        outputTokens: 0n,
        audioSecondsUpperBound: 2n,
      }));
      assert.equal(result.decision, 'DENY_UNCONFIGURED');
    });
    assert.deepEqual(database.counterScopes, []);
  });

  await test('all six configuration settings fail closed for missing, zero, negative, and malformed values', () => {
    for (const name of Object.values(COST_GOVERNOR_ENV_NAMES)) {
      for (const invalid of [undefined, '0', '-1', '1.5', ' 1', '01', 'not-a-number']) {
        const env = { ...GOVERNOR_ENV, [name]: invalid };
        assert.equal(readCostGovernorConfig(env), null, `${name}=${String(invalid)} must deny`);
      }
    }
    assert.equal(readCostGovernorConfig(GOVERNOR_ENV)?.providerTimeoutMs, 45000n);
  });

  await test('PostgreSQL BIGINT cap boundaries are parsed before any SQL boundary is entered', () => {
    const postgresBigintMax = 9_223_372_036_854_775_807n;
    const atBoundary = {
      ...GOVERNOR_ENV,
      [COST_GOVERNOR_ENV_NAMES.userDailyCap]: postgresBigintMax.toString(),
      [COST_GOVERNOR_ENV_NAMES.globalDailyCap]: postgresBigintMax.toString(),
      [COST_GOVERNOR_ENV_NAMES.globalMonthlyCap]: postgresBigintMax.toString(),
    };
    const parsed = readCostGovernorConfig(atBoundary);
    assert.equal(parsed?.userDailyCapMicrousd, postgresBigintMax);
    assert.equal(parsed?.globalDailyCapMicrousd, postgresBigintMax);
    assert.equal(parsed?.globalMonthlyCapMicrousd, postgresBigintMax);
    for (const name of [
      COST_GOVERNOR_ENV_NAMES.userDailyCap,
      COST_GOVERNOR_ENV_NAMES.globalDailyCap,
      COST_GOVERNOR_ENV_NAMES.globalMonthlyCap,
    ]) {
      assert.equal(
        readCostGovernorConfig({ ...atBoundary, [name]: (postgresBigintMax + 1n).toString() }),
        null,
        `${name} above PostgreSQL BIGINT must deny before SQL is bound`
      );
    }
  });

  await test('input estimate covers normalized role and content bytes plus fixed message framing', () => {
    const messages = [
      { role: 'user', content: 'é' },
      { role: 'assistant', content: [{ type: 'text', text: 'x' }] },
    ];
    const expected = messages.reduce(
      (total, message) => total + BigInt(Buffer.byteLength(JSON.stringify(message), 'utf8')) + 16n,
      0n
    );
    assert.equal(estimateInputTokensUpperBound(messages), expected);
  });

  await test('governor implementation has no wallet, VIO, or credit runtime dependency', () => {
    const source = readFileSync(resolve(root, 'src/services/ai/CostGovernorService.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\r\n]*/g, '');
    assert.doesNotMatch(source, /\b(?:Wallet|VIO|credit|balanceVIG|tokensBurned)\b/i);
  });

  await test('every governor transaction applies a five-second local lock guard below the dispatch guard', () => {
    const source = readFileSync(resolve(root, 'src/services/ai/CostGovernorService.ts'), 'utf8');
    assert.match(source, /const LOCK_TIMEOUT_MS = 5_000n;/);
    assert.match(source, /const DISPATCH_GUARD_MS = 30_000n;/);
    assert.match(source, /LOCK_TIMEOUT_MS >= DISPATCH_GUARD_MS/);
    assert.match(source, /SET LOCAL lock_timeout = '\$\{LOCK_TIMEOUT_MS\.toString\(\)\}ms'/);
    assert.match(source, /SET LOCAL statement_timeout = '\$\{STATEMENT_TIMEOUT_MS\.toString\(\)\}ms'/);
    for (const method of ['async reserve', 'async markDispatching', 'async settle', 'async release', 'async markOutcomeUnknown']) {
      const start = source.indexOf(method);
      assert.ok(start >= 0, `missing ${method}`);
      const next = source.indexOf('\n  async ', start + method.length);
      const body = source.slice(start, next < 0 ? source.length : next);
      assert.match(body, /await setReadCommitted\(transaction\);/, `${method} must install transaction guards`);
    }
  });

  await test('all five governor transactions pass explicit production maxWait and timeout options', async () => {
    const source = readFileSync(resolve(root, 'src/services/ai/CostGovernorService.ts'), 'utf8');
    const ast = ts.createSourceFile('CostGovernorService.ts', source, ts.ScriptTarget.Latest, true);
    const transactionCalls: ts.CallExpression[] = [];
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === '$transaction'
      ) {
        transactionCalls.push(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
    assert.equal(transactionCalls.length, 5, 'expected one transaction call for each governor lifecycle method');
    for (const call of transactionCalls) {
      assert.equal(call.arguments.length, 2, 'every transaction call must pass explicit options');
      assert.equal(call.arguments[1].getText(ast), 'TRANSACTION_OPTIONS');
    }

    const numberConstant = (name: string): number => {
      const match = new RegExp(`const ${name} = ([\\d_]+);`).exec(source);
      assert.ok(match, `missing ${name}`);
      return Number(match[1].replaceAll('_', ''));
    };
    const bigintConstant = (name: string): bigint => {
      const match = new RegExp(`const ${name} = ([\\d_]+)n;`).exec(source);
      assert.ok(match, `missing ${name}`);
      return BigInt(match[1].replaceAll('_', ''));
    };
    const maxWait = numberConstant('TX_MAX_WAIT_MS');
    const timeout = numberConstant('TX_TIMEOUT_MS');
    assert.ok(maxWait >= 1_000, `TX_MAX_WAIT_MS=${maxWait} must be at least 1000ms`);
    assert.ok(
      BigInt(timeout) >= bigintConstant('LOCK_TIMEOUT_MS') + bigintConstant('STATEMENT_TIMEOUT_MS') + 5_000n,
      `TX_TIMEOUT_MS=${timeout} must exceed DB lock and statement timeouts by 5000ms`
    );
    assert.match(source, /if \(BigInt\(TX_TIMEOUT_MS\) < LOCK_TIMEOUT_MS \+ STATEMENT_TIMEOUT_MS \+ 5_000n\) \{\s*throw new Error/);
    assert.match(source, /if \(TX_MAX_WAIT_MS < 1_000\) \{\s*throw new Error/);

    const operation = operationRow({ status: 'DISPATCHING' });
    const responses: unknown[] = [
      { decision: 'ALLOW_RESERVED', operation, providerTimeoutMs: 45_000 },
      true,
      { applied: true, operation },
      true,
      true,
    ];
    const receivedOptions: Array<Readonly<{ maxWait: number; timeout: number }>> = [];
    const database = {
      async $transaction<T>(
        _callback: (transaction: FakeSqlDatabase) => Promise<T>,
        options: Readonly<{ maxWait: number; timeout: number }>
      ): Promise<T> {
        receivedOptions.push({ ...options });
        return responses.shift() as T;
      },
    };
    await withGovernorEnv(async () => {
      const service = new CostGovernorService(() => database as never);
      const reservation = await service.reserve(reserveInput({ idempotencyKey: 'transaction-options' }));
      assert.equal(reservation.decision, 'ALLOW_RESERVED');
      assert.equal(await service.markDispatching(operation.id), true);
      await service.settle({ operationId: operation.id });
      assert.equal(await service.release({ operationId: operation.id, reason: 'reserved_not_dispatched' }), true);
      assert.equal(await service.markOutcomeUnknown(operation.id), true);
    });
    assert.deepEqual(receivedOptions, Array.from({ length: 5 }, () => ({ maxWait, timeout })));
    assert.equal(responses.length, 0, 'all five lifecycle transactions must reach the spy adapter');
  });

  await test('any transaction error (P2028) fails closed on all five governor methods', async () => {
    const p2028 = Object.assign(new Error('Transaction already closed: ...'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2028',
    });
    const receivedOptions: Array<Readonly<{ maxWait: number; timeout: number }>> = [];
    const database = {
      async $transaction<T>(
        _callback: (transaction: FakeSqlDatabase) => Promise<T>,
        options: Readonly<{ maxWait: number; timeout: number }>
      ): Promise<T> {
        receivedOptions.push(options);
        throw p2028;
      },
    };
    const operationId = 'p2028-operation';
    const isLedgerUnavailable = (error: unknown): boolean =>
      (error as Readonly<{ code?: string }>).code === 'COST_GOVERNOR_DENY_LEDGER_UNAVAILABLE';

    await withGovernorEnv(async () => {
      const service = new CostGovernorService(() => database as never);
      const reservation = await service.reserve(reserveInput({ idempotencyKey: 'p2028-reserve' }));
      assert.deepEqual(reservation, { decision: 'DENY_LEDGER_UNAVAILABLE' });
      await assert.rejects(service.markDispatching(operationId), isLedgerUnavailable);
      await assert.rejects(service.settle({ operationId }), isLedgerUnavailable);
      await assert.rejects(
        service.release({ operationId, reason: 'reserved_not_dispatched' }),
        isLedgerUnavailable
      );
      await assert.rejects(service.markOutcomeUnknown(operationId), isLedgerUnavailable);
    });

    assert.deepEqual(receivedOptions, Array.from({ length: 5 }, () => ({ maxWait: 5_000, timeout: 20_000 })));
  });

  await test('SOS and emergency source import graph does not reach paid AI router, viral, or governor services', () => {
    const hits = sosImportPathsToPaidAi();
    assert.deepEqual(hits, [], `SOS import graph reached paid AI code:\n${hits.join('\n')}`);
  });

  await withGovernorEnv(async () => {
    await test('missing, overlapping, or zero token prices deny as unconfigured before counters or operations', async () => {
      for (const prices of [[], [
        {
          id: 'p1', inputMicrousdPerMillionTokens: 1n, outputMicrousdPerMillionTokens: 1n,
          audioInputMicrousdPerSecond: 0n, audioOutputMicrousdPerSecond: 0n, imageMicrousdPerUnit: 0n,
        },
        {
          id: 'p2', inputMicrousdPerMillionTokens: 1n, outputMicrousdPerMillionTokens: 1n,
          audioInputMicrousdPerSecond: 0n, audioOutputMicrousdPerSecond: 0n, imageMicrousdPerUnit: 0n,
        },
      ], [
        {
          id: 'zero-input', inputMicrousdPerMillionTokens: 0n, outputMicrousdPerMillionTokens: 1n,
          audioInputMicrousdPerSecond: 0n, audioOutputMicrousdPerSecond: 0n, imageMicrousdPerUnit: 0n,
        },
      ], [
        {
          id: 'zero-output', inputMicrousdPerMillionTokens: 1n, outputMicrousdPerMillionTokens: 0n,
          audioInputMicrousdPerSecond: 0n, audioOutputMicrousdPerSecond: 0n, imageMicrousdPerUnit: 0n,
        },
      ]]) {
        const database = new FakeSqlDatabase({ prices });
        const result = await serviceFor(database).reserve(reserveInput());
        assert.equal(result.decision, 'DENY_UNCONFIGURED');
        assert.deepEqual(database.counterScopes, []);
      }
      const missingVisionPrice = new FakeSqlDatabase({ prices: [] });
      const visionResult = await serviceFor(missingVisionPrice).reserve(reserveInput({
        idempotencyKey: 'missing-gpt-4o-price',
        model: 'gpt-4o',
      }));
      assert.equal(visionResult.decision, 'DENY_UNCONFIGURED');
      assert.deepEqual(missingVisionPrice.counterScopes, []);
    });

    await test('fractional, lossy, and non-integer string prices deny before counters', async () => {
      for (const invalidPrice of [1.5, Number.MAX_SAFE_INTEGER + 1, '1.5', '1e3'] as const) {
        const database = new FakeSqlDatabase({ prices: [{
          id: 'invalid-token-price',
          inputMicrousdPerMillionTokens: invalidPrice,
          outputMicrousdPerMillionTokens: 600000n,
          audioInputMicrousdPerSecond: 0n,
          audioOutputMicrousdPerSecond: 0n,
          imageMicrousdPerUnit: 0n,
        }] });
        const result = await serviceFor(database).reserve(reserveInput({
          idempotencyKey: `invalid-token-price-${String(invalidPrice)}`,
        }));
        assert.equal(result.decision, 'DENY_UNCONFIGURED');
        assert.deepEqual(database.counterScopes, []);
      }
    });

    await test('counter denial at global month, global day, and user day rolls back as DENY_CAP', async () => {
      for (const counterFailAt of [1, 2, 3]) {
        const db = new FakeSqlDatabase({ counterFailAt });
        const result = await serviceFor(db).reserve(reserveInput({ idempotencyKey: `cap-${counterFailAt}` }));
        assert.equal(result.decision, 'DENY_CAP');
      }
    });

    await test('user and global in-flight limits deny before reserving counters', async () => {
      const userDb = new FakeSqlDatabase({ userInflight: 2n });
      const userResult = await serviceFor(userDb).reserve(reserveInput({ idempotencyKey: 'user-inflight' }));
      assert.equal(userResult.decision, 'DENY_INFLIGHT');
      assert.deepEqual(userDb.counterScopes, []);
      const globalDb = new FakeSqlDatabase({ globalInflight: 5n });
      const globalResult = await serviceFor(globalDb).reserve(reserveInput({ idempotencyKey: 'global-inflight' }));
      assert.equal(globalResult.decision, 'DENY_INFLIGHT');
      assert.deepEqual(globalDb.counterScopes, []);
    });

    await test('idempotency returns no second reservation and rejects immutable-field conflict', async () => {
      const existing = operationRow();
      const duplicate = await serviceFor(new FakeSqlDatabase({ existing })).reserve(reserveInput());
      assert.equal(duplicate.decision, 'DUPLICATE_IN_PROGRESS');
      const conflict = await serviceFor(new FakeSqlDatabase({ existing })).reserve(reserveInput({ model: 'other-model' }));
      assert.equal(conflict.decision, 'DENY_POLICY');
      assert.equal(conflict.detail, 'idempotency_conflict');
    });

    await test('idempotency replays existing RESERVED or UNKNOWN operations before replay-bound validation', async () => {
      for (const [status, decision] of [
        ['RESERVED', 'DUPLICATE_IN_PROGRESS'],
        ['OUTCOME_UNKNOWN', 'OUTCOME_UNKNOWN'],
      ] as const) {
        for (const invalidBounds of [
          { inputTokensUpperBound: -1n },
          { outputTokens: -1n },
        ]) {
          const database = new FakeSqlDatabase({ existing: operationRow({ status }) });
          const replay = await serviceFor(database).reserve(reserveInput(invalidBounds));
          assert.equal(replay.decision, decision);
          assert.deepEqual(database.counterScopes, []);
        }
      }
      for (const invalidBounds of [
        { inputTokensUpperBound: -1n },
        { outputTokens: -1n },
      ]) {
        const database = new FakeSqlDatabase();
        const fresh = await serviceFor(database).reserve(reserveInput({
          idempotencyKey: `fresh-invalid-${Object.keys(invalidBounds)[0]}`,
          ...invalidBounds,
        }));
        assert.equal(fresh.decision, 'DENY_POLICY');
        assert.deepEqual(database.counterScopes, []);
      }
    });

    await test('database or ledger failure becomes an explicit fail-closed decision', async () => {
      assert.equal((await serviceFor(new FakeSqlDatabase({ failDatabase: true })).reserve(reserveInput())).decision, 'DENY_LEDGER_UNAVAILABLE');
      assert.equal((await serviceFor(new FakeSqlDatabase({ failLedger: true })).reserve(reserveInput())).decision, 'DENY_LEDGER_UNAVAILABLE');
    });
  });

  await test('cost denials inherit the P0 admission error contract and preserve a structured code', () => {
    const error = new CostGovernorDeniedError('DENY_CAP');
    assert.equal(error.httpStatus, 503);
    assert.equal(error.code, 'COST_GOVERNOR_DENY_CAP');
    assert.equal(error.governorReason, 'DENY_CAP');
    assert.doesNotMatch(error.message, /no new provider call was made/i);
    assert.throws(() => assertCostGovernorReservation({ decision: 'DENY_UNCONFIGURED' }), CostGovernorDeniedError);
  });

  await test('a reserve denial prevents key access and SDK construction in both Express callers', async () => {
    const denial: CostGovernorReserveResult = { decision: 'DENY_LEDGER_UNAVAILABLE' };
    const h = providerHarness({ reserveDecision: denial });
    await assert.rejects(h.router.createRoutedChatCompletion(routedInput()), (error: unknown) => {
      assert.equal((error as Readonly<{ code?: string }>).code, 'COST_GOVERNOR_DENY_LEDGER_UNAVAILABLE');
      return true;
    });
    await assert.rejects(h.viral.generateUserTripSummary('subject-a', 'trip-1'), (error: unknown) => {
      assert.ok(error instanceof h.viral.ViralWrapError);
      assert.equal(error.statusCode, 503);
      return true;
    });
    assert.equal(h.keyReads.value, 0);
    assert.equal(h.sdk.value, 0);
    assert.equal(h.provider.value, 0);
  });

  await test('missing max_tokens denies before reserve, key, SDK, and provider call', async () => {
    const h = providerHarness();
    const noMax = routedInput({ params: { messages: [{ role: 'user', content: 'No maximum' }] } });
    await assert.rejects(h.router.createRoutedChatCompletion(noMax), (error: unknown) => {
      assert.equal((error as Readonly<{ code?: string }>).code, 'COST_GOVERNOR_DENY_POLICY');
      return true;
    });
    assert.equal(h.calls.reserve, 0);
    assert.equal(h.keyReads.value, 0);
    assert.equal(h.sdk.value, 0);
    assert.equal(h.provider.value, 0);
  });

  await test('unmetered routed-chat parameters deny before reserve, key, SDK, and provider call', async () => {
    const base: Record<string, unknown> = {
      messages: [{ role: 'user', content: 'Synthetic input' }],
      max_tokens: 20,
    };
    const forbidden: Array<readonly [string, Record<string, unknown>]> = [
      ['n=2', { ...base, n: 2 }],
      ['tools', { ...base, tools: [] }],
      ['functions', { ...base, functions: [] }],
      ['tool_choice', { ...base, tool_choice: 'auto' }],
      ['function_call', { ...base, function_call: 'auto' }],
      ['max_completion_tokens', { ...base, max_completion_tokens: 20 }],
      ['logprobs', { ...base, logprobs: true }],
      ['top_logprobs', { ...base, top_logprobs: 1 }],
      ['stream', { ...base, stream: false }],
      ['malformed max_tokens', { ...base, max_tokens: 1.5 }],
      ['non-finite temperature', { ...base, temperature: Number.POSITIVE_INFINITY }],
      ['non-integer seed', { ...base, seed: 1.5 }],
      ['non-string user', { ...base, user: 7 }],
      ['malformed stop list', { ...base, stop: ['ok', 7] }],
      ['non-text content part', {
        max_tokens: 20,
        messages: [{ role: 'user', content: [{ type: 'input_audio', input_audio: { data: 'offline', format: 'wav' } }] }],
      }],
      ['unsupported JSON schema format', {
        ...base,
        response_format: { type: 'json_schema', json_schema: { name: 'unused', schema: { type: 'object' } } },
      }],
      ['message tool_calls', {
        ...base,
        messages: [{ role: 'user', content: 'Synthetic input', tool_calls: [] }],
      }],
      ['message function_call', {
        ...base,
        messages: [{ role: 'assistant', content: 'Synthetic input', function_call: { name: 'unsafe' } }],
      }],
      ['message name', {
        ...base,
        messages: [{ role: 'user', content: 'Synthetic input', name: 'unmetered-name' }],
      }],
      ['message unknown key', {
        ...base,
        messages: [{ role: 'user', content: 'Synthetic input', unexpected: true }],
      }],
    ];
    for (const [name, params] of forbidden) {
      const h = providerHarness();
      await assert.rejects(h.router.createRoutedChatCompletion(routedInputWithUncheckedParams(params)), (error: unknown) => {
        assert.equal((error as Readonly<{ code?: string }>).code, 'COST_GOVERNOR_DENY_POLICY', name);
        return true;
      });
      assert.equal(h.calls.reserve, 0, `${name}: reserve`);
      assert.equal(h.keyReads.value, 0, `${name}: key read`);
      assert.equal(h.sdk.value, 0, `${name}: SDK`);
      assert.equal(h.provider.value, 0, `${name}: provider`);
    }
  });

  await test('text-only content parts and supported response formats preserve a normal routed completion', async () => {
    for (const response_format of [{ type: 'text' }, { type: 'json_object' }]) {
      const h = providerHarness();
      const completion = await h.router.createRoutedChatCompletion(routedInputWithUncheckedParams({
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Synthetic input' }] }],
        max_tokens: 20,
        n: 1,
        response_format,
      }));
      assert.equal(completion.id, 'provider-receipt');
      assert.equal(h.calls.reserve, 1);
      assert.equal(h.keyReads.value, 1);
      assert.equal(h.sdk.value, 1);
      assert.equal(h.provider.value, 1);
    }
  });

  await test('controller preserves mixed vision content and forwards a valid Idempotency-Key header', async () => {
    const h = controllerHarness();
    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this picture.' },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,ZmFrZQ==' } },
      ],
    }];
    const response = {
      statusCode: 0,
      body: undefined as unknown,
      status(code: number) { this.statusCode = code; return this; },
      json(body: unknown) { this.body = body; return this; },
    };
    await h.controller.postChatCompletion({
      authUserId: 'subject-a',
      body: { messages, maxTokens: 20 },
      get: (name: string) => name.toLowerCase() === 'idempotency-key' ? '  client-operation-1  ' : undefined,
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(h.routedInputs.length, 1);
    const routed = h.routedInputs[0] as Readonly<{
      idempotencyKey?: string;
      params: Readonly<{ messages: readonly unknown[] }>;
    }>;
    assert.equal(routed.idempotencyKey, 'client-operation-1');
    assert.deepStrictEqual(normalizeCrossRealm(routed.params.messages), normalizeCrossRealm(messages));
  });

  await test('controller leaves absent client idempotency keys to the router and rejects invalid messages or keys with 400', async () => {
    const h = controllerHarness();
    const invoke = async (body: unknown, key?: string) => {
      const response = {
        statusCode: 0,
        body: undefined as unknown,
        status(code: number) { this.statusCode = code; return this; },
        json(value: unknown) { this.body = value; return this; },
      };
      await h.controller.postChatCompletion({
        authUserId: 'subject-a',
        body,
        get: (name: string) => name.toLowerCase() === 'idempotency-key' ? key : undefined,
      }, response);
      return response;
    };

    const noKey = await invoke({ messages: [{ role: 'user', content: 'text-only' }], maxTokens: 20 });
    assert.equal(noKey.statusCode, 200);
    assert.equal(Object.prototype.hasOwnProperty.call(h.routedInputs[0], 'idempotencyKey'), false);
    assert.equal((await invoke({ messages: [{ role: 'user', content: [] }] })).statusCode, 400);
    assert.equal((await invoke({ messages: [{ role: 'tool', content: 'invalid role' }] })).statusCode, 400);
    assert.equal((await invoke({ messages: [{ role: 'user', content: 'text' }] }, '  ')).statusCode, 400);
    assert.equal((await invoke({ messages: [{ role: 'user', content: 'text' }] }, 'k'.repeat(201))).statusCode, 400);
    assert.equal(h.routedInputs.length, 1, 'invalid input or key must not dispatch to the router');
  });

  await test('controller logs only fixed metadata for provider errors and returns 500', async () => {
    const providerError = Object.assign(new Error(
      "provider rejected https://example.invalid/O'Neil.jpg?alt=media&token=SECRET_MARKER Bearer BEARER_SECRET PROMPT_SECRET"
    ), { status: 502 });
    const h = controllerHarness({ routerError: providerError });
    const response = {
      statusCode: 0,
      body: undefined as unknown,
      status(code: number) { this.statusCode = code; return this; },
      json(value: unknown) { this.body = value; return this; },
    };
    await h.controller.postChatCompletion({
      authUserId: 'subject-a',
      body: { messages: [{ role: 'user', content: 'synthetic request' }], maxTokens: 20 },
    }, response);

    assert.equal(response.statusCode, 500);
    const logged = JSON.stringify(h.consoleErrors);
    for (const secret of ['SECRET_MARKER', "O'Neil", 'BEARER_SECRET', 'PROMPT_SECRET', 'token=', 'Bearer']) {
      assert.equal(logged.includes(secret), false, `log leaked ${secret}`);
    }
    assert.match(logged, /AI_CHAT_UNEXPECTED/);
    assert.match(logged, /"errName":"Error"/);
    assert.match(logged, /"status":502/);
    const metadata = h.consoleErrors[0]?.[1] as Readonly<Record<string, unknown>>;
    assert.deepEqual(Object.keys(metadata).sort(), ['code', 'errName', 'status']);
    assert.equal(metadata.code, 'AI_CHAT_UNEXPECTED');
    assert.equal(Object.prototype.hasOwnProperty.call(metadata, 'message'), false);
  });

  await test('vision reserve adds the default image-token bound and settlement forwards provider usage', async () => {
    const h = providerHarness();
    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: 'Read this image.' },
        { type: 'image_url', image_url: { url: 'https://example.invalid/image.jpg' } },
      ],
    }];
    await h.router.createRoutedChatCompletion(routedInputWithUncheckedParams({ messages, max_tokens: 20 }));

    const reserve = h.reserveInputs[0] as Readonly<{ model: string; inputTokensUpperBound: bigint }>;
    assert.equal(reserve.model, 'gpt-4o');
    assert.equal((h.providerParams[0] as Readonly<{ model: string }>).model, 'gpt-4o');
    assert.equal(
      reserve.inputTokensUpperBound,
      estimateInputTokensUpperBound([{ role: 'user', content: [{ type: 'text', text: 'Read this image.' }] }]) + 1700n
    );
    assert.deepStrictEqual(normalizeCrossRealm(h.settlements), normalizeCrossRealm([{
      operationId: 'vm-operation',
      providerRequestId: 'provider-receipt',
      usage: { inputTokens: 3, outputTokens: 2 },
    }]));
    assert.deepStrictEqual(
      normalizeCrossRealm((h.providerParams[0] as Readonly<{ messages: readonly unknown[] }>).messages),
      normalizeCrossRealm(messages)
    );
  });

  await test('vision image token upper bound scales with image count and uses valid runtime configuration', async () => {
    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: 'Two images.' },
        { type: 'image_url', image_url: { url: 'https://example.invalid/one.jpg' } },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,b25l' } },
      ],
    }];
    const expectedTextBound = estimateInputTokensUpperBound([{ role: 'user', content: [{ type: 'text', text: 'Two images.' }] }]);
    const twoImageHarness = providerHarness();
    await twoImageHarness.router.createRoutedChatCompletion(routedInputWithUncheckedParams({ messages, max_tokens: 20 }));
    assert.equal((twoImageHarness.reserveInputs[0] as Readonly<{ model: string }>).model, 'gpt-4o');
    assert.equal(
      (twoImageHarness.reserveInputs[0] as Readonly<{ inputTokensUpperBound: bigint }>).inputTokensUpperBound,
      expectedTextBound + 3400n
    );

    for (const [configured, expected] of [
      ['1', 1700n],
      ['5000', 5000n],
      ['abc', 1700n],
      ['0', 1700n],
      ['-1', 1700n],
    ] as const) {
      const configuredHarness = providerHarness({ visionImageInputTokensPerImage: configured });
      const oneImageMessages = [{ role: 'user', content: [messages[0].content[0], messages[0].content[1]] }];
      await configuredHarness.router.createRoutedChatCompletion(
        routedInputWithUncheckedParams({ messages: oneImageMessages, max_tokens: 20 })
      );
      assert.equal(
        (configuredHarness.reserveInputs[0] as Readonly<{ inputTokensUpperBound: bigint }>).inputTokensUpperBound,
        estimateInputTokensUpperBound([{ role: 'user', content: [{ type: 'text', text: 'Two images.' }] }]) + expected,
        `VISION_IMAGE_INPUT_TOKENS_PER_IMAGE=${configured}`
      );
    }
  });

  await test('malformed multimodal parts fail closed before reserve, key access, SDK construction, or provider call', async () => {
    const badContents: readonly unknown[][] = [
      [],
      [{ type: 'audio', audio: 'not-allowed' }],
      [{ type: 'image_url', image_url: {} }],
      [{ type: 'image_url', image_url: { url: '' } }],
      [{ type: 'image_url', image_url: { url: 'data:image/png;base64,x', detail: 'high' } }],
      [{ type: 'text', text: '' }],
      [{ type: 'text' }],
      [{ type: 'text', text: 'ok', extra: true }],
    ];
    for (const content of badContents) {
      const h = providerHarness();
      await assert.rejects(h.router.createRoutedChatCompletion(routedInputWithUncheckedParams({
        messages: [{ role: 'user', content }],
        max_tokens: 20,
      })), (error: unknown) => {
        assert.equal((error as Readonly<{ code?: string }>).code, 'COST_GOVERNOR_DENY_POLICY');
        return true;
      });
      assert.equal(h.calls.reserve, 0);
      assert.equal(h.keyReads.value, 0);
      assert.equal(h.sdk.value, 0);
      assert.equal(h.provider.value, 0);
    }
  });

  await test('text-only reserve has no vision surcharge and caller idempotency reaches reserve unchanged', async () => {
    const h = providerHarness({ visionImageInputTokensPerImage: '5000' });
    await h.router.createRoutedChatCompletion({
      ...routedInput(),
      idempotencyKey: 'stable-client-key',
    });
    const reserve = h.reserveInputs[0] as Readonly<{ model: string; inputTokensUpperBound: bigint; idempotencyKey: string }>;
    assert.equal(reserve.model, 'gpt-4o-mini');
    assert.equal((h.providerParams[0] as Readonly<{ model: string }>).model, 'gpt-4o-mini');
    assert.equal(reserve.inputTokensUpperBound, estimateInputTokensUpperBound([{ role: 'user', content: 'Synthetic input' }]));
    assert.equal(reserve.idempotencyKey, 'stable-client-key');
  });

  await test('routed-chat normalizers snapshot getter values once and reject hostile shapes or negative zero before reserve', async () => {
    const roleReads = { value: 0 };
    const contentReads = { value: 0 };
    const formatReads = { value: 0 };
    const message = Object.defineProperties({}, {
      role: {
        enumerable: true,
        get: () => {
          roleReads.value += 1;
          return roleReads.value === 1 ? 'user' : 'assistant';
        },
      },
      content: {
        enumerable: true,
        get: () => {
          contentReads.value += 1;
          return contentReads.value === 1 ? 'getter-backed text' : 'changed text';
        },
      },
    });
    const responseFormat = Object.defineProperty({}, 'type', {
      enumerable: true,
      get: () => {
        formatReads.value += 1;
        return formatReads.value === 1 ? 'text' : 'json_object';
      },
    });
    const success = providerHarness();
    await success.router.createRoutedChatCompletion(routedInputWithUncheckedParams({
      messages: [new Proxy(message, {})],
      max_tokens: 20,
      response_format: new Proxy(responseFormat, {}),
    }));
    assert.equal(roleReads.value, 1);
    assert.equal(contentReads.value, 1);
    assert.equal(formatReads.value, 1);
    assert.equal(JSON.stringify(success.providerParams), JSON.stringify([{
      messages: [{ role: 'user', content: 'getter-backed text' }],
      max_tokens: 20,
      response_format: { type: 'text' },
      model: 'gpt-4o-mini',
    }]));
    assert.equal(
      (success.reserveInputs[0] as Readonly<{ inputTokensUpperBound: bigint }>).inputTokensUpperBound,
      estimateInputTokensUpperBound([{ role: 'user', content: 'getter-backed text' }])
    );

    const deniedShapes: readonly Record<string | symbol, unknown>[] = [
      { messages: [{ role: 'user', content: 'x' }], max_tokens: 20, [Symbol('untrusted')]: true },
      { messages: new Array(1), max_tokens: 20 },
      { messages: [{ role: 'user', content: { toJSON: () => 'changed serialization' } }], max_tokens: 20 },
    ];
    for (const params of deniedShapes) {
      const h = providerHarness();
      await assert.rejects(h.router.createRoutedChatCompletion(routedInputWithUncheckedParams(params as Record<string, unknown>)), (error: unknown) => {
        assert.equal((error as Readonly<{ code?: string }>).code, 'COST_GOVERNOR_DENY_POLICY');
        return true;
      });
      assert.equal(h.calls.reserve, 0);
      assert.equal(h.keyReads.value, 0);
      assert.equal(h.sdk.value, 0);
      assert.equal(h.provider.value, 0);
    }
    for (const key of ['temperature', 'top_p', 'presence_penalty', 'frequency_penalty', 'seed'] as const) {
      const h = providerHarness();
      await assert.rejects(h.router.createRoutedChatCompletion(routedInputWithUncheckedParams({
        messages: [{ role: 'user', content: 'negative zero' }], max_tokens: 20, [key]: -0,
      })), (error: unknown) => {
        assert.equal((error as Readonly<{ code?: string }>).code, 'COST_GOVERNOR_DENY_POLICY');
        return true;
      });
      assert.equal(h.calls.reserve, 0, `${key} must be rejected before reserve`);
    }
  });

  await test('the paid SDK receives the deeply frozen pre-reserve snapshot, not caller mutations', async () => {
    let resumeReserve: (() => void) | undefined;
    const reserveWait = new Promise<void>((resolveWait) => { resumeReserve = resolveWait; });
    const h = providerHarness({ reserveWait });
    const params: Record<string, unknown> = {
      messages: [{ role: 'user', content: 'before-reserve' }],
      max_tokens: 20,
      n: 1,
    };
    const completionPromise = h.router.createRoutedChatCompletion(routedInputWithUncheckedParams(params));
    for (let attempt = 0; attempt < 20 && h.calls.reserve === 0; attempt += 1) {
      await new Promise<void>((resolveImmediate) => setImmediate(resolveImmediate));
    }
    assert.equal(h.calls.reserve, 1, 'reserve must be reached before mutating the source object');
    params.max_tokens = 99;
    params.n = 2;
    (params.messages as Array<Record<string, unknown>>)[0].content = 'after-reserve';
    resumeReserve?.();
    const completion = await completionPromise;
    assert.equal(completion.id, 'provider-receipt');
    assert.equal(JSON.stringify(h.providerParams), JSON.stringify([{
      messages: [{ role: 'user', content: 'before-reserve' }],
      max_tokens: 20,
      n: 1,
      model: 'gpt-4o-mini',
    }]));
    assert.equal((h.reserveInputs[0] as Readonly<{ outputTokens: bigint }>).outputTokens, 20n);
    assert.deepEqual(h.dispatchArgumentCounts, [1]);
  });

  for (const denialReason of ['DENY_UNCONFIGURED', 'DENY_LEDGER_UNAVAILABLE'] as const) {
    await test(`a pre-dispatch ${denialReason} denial releases both Express reservations before any provider call`, async () => {
      const h = providerHarness({ markDispatchingError: denialReason });
      await assert.rejects(h.router.createRoutedChatCompletion(routedInput()), (error: unknown) => {
        assert.equal((error as Readonly<{ code?: string }>).code, `COST_GOVERNOR_${denialReason}`);
        return true;
      });
      await assert.rejects(h.viral.generateUserTripSummary('subject-a', 'trip-1'), (error: unknown) => {
        assert.ok(error instanceof h.viral.ViralWrapError);
        assert.equal(error.statusCode, 503);
        return true;
      });
      assert.equal(h.calls.reserve, 2);
      assert.equal(h.calls.markDispatching, 2);
      assert.equal(h.calls.release, 2);
      assert.equal(h.provider.value, 0);
      assert.equal(h.inflightSlots.value, 0);
      assert.equal(JSON.stringify(h.releases), JSON.stringify([
        { operationId: 'vm-operation', reason: 'reserved_not_dispatched' },
        { operationId: 'vm-operation', reason: 'reserved_not_dispatched' },
      ]));
    });
  }

  await test('clear provider 4xx releases the reservation exactly once', async () => {
    const failure = Object.assign(new Error('synthetic 429'), { status: 429 });
    const h = providerHarness({ providerFailure: failure });
    await assert.rejects(h.router.createRoutedChatCompletion(routedInput()), (error) => error === failure);
    assert.equal(h.calls.markDispatching, 1);
    assert.equal(h.calls.release, 1);
    assert.equal(h.calls.markOutcomeUnknown, 0);
    assert.equal(h.provider.value, 1);
    assert.equal(
      JSON.stringify(h.releases),
      JSON.stringify([{ operationId: 'vm-operation', reason: 'provider_http_4xx' }])
    );
  });

  await test('provider HTTP 408 and 409 remain ambiguous on both Express rails', async () => {
    for (const status of [408, 409]) {
      const failure = Object.assign(new Error(`synthetic ${status}`), { status });
      const routerHarness = providerHarness({ providerFailure: failure });
      await assert.rejects(routerHarness.router.createRoutedChatCompletion(routedInput()), (error) => error === failure);
      assert.equal(routerHarness.calls.release, 0);
      assert.equal(routerHarness.calls.markOutcomeUnknown, 1);

      const viralHarness = providerHarness({ providerFailure: failure });
      await assert.rejects(viralHarness.viral.generateUserTripSummary('subject-a', 'trip-1'), (error) => error === failure);
      assert.equal(viralHarness.calls.release, 0);
      assert.equal(viralHarness.calls.markOutcomeUnknown, 1);
    }
  });

  await test('both paid OpenAI SDK clients explicitly disable automatic retries', async () => {
    const h = providerHarness();
    await h.router.createRoutedChatCompletion(routedInput());
    const payload = await h.viral.generateUserTripSummary('subject-a', 'trip-1');
    assert.equal(payload.viralTagline, 'Real synthetic answer.');
    assert.equal(h.sdkOptions.length, 2);
    assert.deepEqual(h.sdkOptions.map((options) => options.maxRetries), [0, 0]);
  });

  for (const [status, expectedLifecycle] of [
    [500, 'unknown'],
    [429, 'release'],
    [408, 'unknown'],
    [409, 'unknown'],
  ] as const) {
    await test(`OpenAI HTTP ${status} does not retry a paid dispatch`, async () => {
      const httpCalls = { value: 0 };
      const constructorOptions: Array<Readonly<{ apiKey?: string; maxRetries?: number }>> = [];
      const h = providerHarness({
        nativeAbortSignal: true,
        providerTimeoutMs: 10_000,
        openAiConstructor: httpStubOpenAi(
          [providerErrorResponse(status), providerSuccessResponse()],
          httpCalls,
          constructorOptions
        ),
      });
      await assert.rejects(h.router.createRoutedChatCompletion(routedInput()), (error: unknown) => {
        assert.equal((error as Readonly<{ status?: number }>).status, status);
        return true;
      });
      assert.equal(httpCalls.value, 1, `HTTP ${status} must not reach the synthetic second success response`);
      assert.deepEqual(constructorOptions.map((options) => options.maxRetries), [0]);
      assert.equal(h.calls.markDispatching, 1);
      assert.equal(h.calls.settle, 0);
      assert.equal(h.calls.markOutcomeUnknown, expectedLifecycle === 'unknown' ? 1 : 0);
      assert.equal(h.calls.release, expectedLifecycle === 'release' ? 1 : 0);
      assert.equal(h.inflightSlots.value, 0);
    });
  }

  for (const [name, failure] of [
    ['timeout', new Error('synthetic timeout')],
    ['provider 5xx', Object.assign(new Error('synthetic 503'), { status: 503 })],
    ['unknown transport error', new Error('synthetic socket reset')],
  ] as const) {
    await test(`${name} keeps money reserved as OUTCOME_UNKNOWN and does not retry`, async () => {
      const h = providerHarness({ providerFailure: failure });
      await assert.rejects(h.router.createRoutedChatCompletion(routedInput()), (error) => error === failure);
      assert.equal(h.calls.release, 0);
      assert.equal(h.calls.markOutcomeUnknown, 1);
      assert.equal(h.provider.value, 1);
    });
  }

  await test('a real provider AbortSignal timeout marks OUTCOME_UNKNOWN once without retry or fallback', async () => {
    const timeoutMs = 50;
    const h = providerHarness({ awaitAbort: true, providerTimeoutMs: timeoutMs });
    const startedAt = Date.now();
    let guard: NodeJS.Timeout | undefined;
    try {
      const abortProof = h.router.createRoutedChatCompletion(routedInput());
      const guardFailure = new Promise<never>((_resolve, reject) => {
        guard = setTimeout(() => reject(new Error('provider AbortSignal did not fire within the proof window')), 1_500);
      });
      await assert.rejects(Promise.race([abortProof, guardFailure]), (error: unknown) => {
        assert.equal((error as Readonly<{ status?: number }>).status, 503);
        assert.equal((error as Readonly<{ code?: string }>).code, 'ETIMEDOUT');
        return true;
      });
    } finally {
      if (guard) clearTimeout(guard);
    }
    const elapsedMs = Date.now() - startedAt;
    assert.ok(elapsedMs >= 20 && elapsedMs < 1_500, `timeout completed outside the expected window: ${elapsedMs}ms`);
    await new Promise<void>((resolveImmediate) => setImmediate(resolveImmediate));
    assert.equal(h.calls.reserve, 1);
    assert.equal(h.calls.markDispatching, 1);
    assert.equal(h.calls.markOutcomeUnknown, 1);
    assert.equal(h.calls.settle, 0);
    assert.equal(h.calls.release, 0);
    assert.equal(h.sdk.value, 1);
    assert.equal(h.provider.value, 1);
    assert.equal(h.abortEvents.value, 1);
    assert.equal(h.inflightSlots.value, 0);
    assert.equal(h.activeAbortListeners.value, 0);
  });

  await test('settlement receives actual usage and conservative settlement receives null usage', async () => {
    const withUsage = providerHarness();
    await withUsage.router.createRoutedChatCompletion(routedInput());
    assert.equal(JSON.stringify(withUsage.settlements), JSON.stringify([{
      operationId: 'vm-operation', providerRequestId: 'provider-receipt', usage: { inputTokens: 3, outputTokens: 2 },
    }]));
    const withoutUsage = providerHarness({ completion: { id: 'no-usage', choices: [{ message: { content: 'Answer' } }] } });
    await withoutUsage.router.createRoutedChatCompletion(routedInput());
    assert.equal(
      JSON.stringify(withoutUsage.settlements),
      JSON.stringify([{ operationId: 'vm-operation', providerRequestId: 'no-usage', usage: null }])
    );
  });

  await test('a settlement failure marks the provider outcome unknown and rethrows the original error', async () => {
    const settlementError = new Error('synthetic settlement failure');
    const h = providerHarness({ settleError: settlementError });
    await assert.rejects(h.router.createRoutedChatCompletion(routedInput()), (error) => error === settlementError);
    assert.equal(h.calls.settle, 1);
    assert.equal(h.calls.markOutcomeUnknown, 1);
    assert.equal(h.calls.release, 0);
    assert.equal(h.provider.value, 1);
    assert.equal(h.inflightSlots.value, 0);
  });

  await test('a settlement and outcome-unknown failure still rethrows the original settlement error', async () => {
    const settlementError = new Error('synthetic settlement failure');
    const unknownError = new Error('synthetic unknown-accounting failure');
    const h = providerHarness({ settleError: settlementError, markOutcomeUnknownError: unknownError });
    await assert.rejects(h.router.createRoutedChatCompletion(routedInput()), (error) => error === settlementError);
    assert.equal(h.calls.settle, 1);
    assert.equal(h.calls.markOutcomeUnknown, 1);
    assert.equal(h.calls.release, 0);
    assert.equal(h.provider.value, 1);
  });

  await test('accepted but empty completion is settled and returned as an honest failure', async () => {
    const h = providerHarness({ completion: {
      id: 'empty-receipt', choices: [{ message: { content: '   ' } }], usage: { prompt_tokens: 3, completion_tokens: 1, total_tokens: 4 },
    } });
    await assert.rejects(h.router.createRoutedChatCompletion(routedInput()), /unusable completion/);
    assert.equal(h.calls.settle, 1);
    assert.equal(h.provider.value, 1);
  });

  console.log(`\n${passed} passed; all provider/SDK/DB boundaries were synthetic and closed.`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
