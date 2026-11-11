import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const ROOT = path.resolve(__dirname, '..');
const API_CLIENT = path.join(ROOT, 'src/services/apiClient.ts');
const API_CLIENT_SOURCE = fs.readFileSync(API_CLIENT, 'utf8');

type MockResponse = Readonly<{ status: number; ok: boolean; text(): Promise<string> }>;
type MockFetchInit = Readonly<{
  method?: string;
  headers?: Readonly<Record<string, string>>;
  body?: string;
  signal?: AbortSignal;
}>;
type MockFetch = (url: string, init: MockFetchInit) => Promise<MockResponse>;
type ApiRequestInit = Readonly<{
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  skipAuth?: boolean;
  headers?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
  timeoutMs?: number;
}>;
type ApiClientModule = {
  AiAuthRequiredError: new () => Error & Readonly<{ code: string }>;
  restApiFetchJson<T>(path: string, init?: ApiRequestInit): Promise<{
    ok: boolean;
    status: number;
    data?: T;
    error?: string;
    code?: string;
    unreachable?: boolean;
  }>;
};

function jwtWithExpiry(exp: number): string {
  const payload = Buffer.from(JSON.stringify({ sub: 'offline-user-id', exp }), 'utf8').toString('base64url');
  return `eyJhbGciOiJub25lIn0.${payload}.offline-signature`;
}

function response(status: number, body: unknown): MockResponse {
  return { status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(body) };
}

function harness(storedJwt: string | null, initialFetch: MockFetch) {
  const storage = {
    async getItem(key: string): Promise<string | null> {
      assert.equal(key, 'ketnoieu.restApi.jwt.v1');
      return storedJwt;
    },
    async setItem(): Promise<void> {},
    async removeItem(): Promise<void> {},
  };
  const dependencies: Readonly<Record<string, unknown>> = {
    '@react-native-async-storage/async-storage': storage,
    '../storage/storageKeys': { STORAGE_KEYS: { restApiJwt: 'ketnoieu.restApi.jwt.v1' } },
    './ux/DemoSandbox': {
      isDemoSandboxActive: () => false,
      mockRestApiRequestResult: () => ({ ok: true, status: 200, data: {} }),
    },
    '../utils/restApiJsonEnvelope': {
      parseRestApiJsonEnvelope<T>(raw: string) {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (typeof parsed !== 'object' || parsed === null) return null;
          if ((parsed as { success?: unknown }).success === true && 'data' in parsed) {
            return { success: true as const, data: (parsed as { data: T }).data };
          }
          if ((parsed as { success?: unknown }).success === false && typeof (parsed as { error?: unknown }).error === 'string') {
            const code = (parsed as { code?: unknown }).code;
            return typeof code === 'string'
              ? { success: false as const, error: (parsed as { error: string }).error, code }
              : { success: false as const, error: (parsed as { error: string }).error };
          }
          return null;
        } catch {
          return null;
        }
      },
    },
  };
  const logs: unknown[][] = [];
  let fetcher = initialFetch;
  const context = vm.createContext({
    process: { env: { EXPO_PUBLIC_REST_API_BASE: 'https://rest.invalid' } },
    fetch: (url: string, init: MockFetchInit) => fetcher(url, init),
    AbortController,
    setTimeout,
    clearTimeout,
    console: {
      log: (...args: unknown[]) => logs.push(args),
      info: (...args: unknown[]) => logs.push(args),
      warn: (...args: unknown[]) => logs.push(args),
      error: (...args: unknown[]) => logs.push(args),
    },
  });
  const compiled = ts.transpileModule(fs.readFileSync(API_CLIENT, 'utf8'), {
    fileName: API_CLIENT,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} as Record<string, unknown> };
  const closedRequire = (specifier: string): unknown => {
    if (!Object.prototype.hasOwnProperty.call(dependencies, specifier)) {
      throw new Error(`Unexpected runtime dependency blocked: ${specifier}`);
    }
    return dependencies[specifier];
  };
  const execute = new vm.Script(`(function(require, module, exports) { ${compiled}\n})`, {
    filename: API_CLIENT,
  }).runInContext(context, { timeout: 1_000 }) as (
    require: typeof closedRequire,
    module: { exports: unknown },
    exports: unknown
  ) => void;
  execute(closedRequire, module, module.exports);
  return {
    client: module.exports as ApiClientModule,
    logs,
    setFetch(next: MockFetch) { fetcher = next; },
  };
}

type OpenAIServiceTestModule = {
  analyzeImage(base64Image: string, options?: { userPrompt?: string }): Promise<string>;
  scanDocumentWithAI(base64Image: string, countryCode?: string): Promise<{
    documentType: string;
    expiryDate: string | null;
    confidence: 'high' | 'medium' | 'low';
  }>;
  analyzeKidsHomeworkWithAI(base64Image: string): Promise<{
    subject: string;
    level: 'easy' | 'medium' | 'advanced';
    plainSummary: string;
    steps: string[];
  }>;
  getChatCompletion(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, persona: never): Promise<string>;
  transcribeAudio(audioUri: string): Promise<string>;
  generateSpeech(text: string, voice: 'nova' | 'alloy' | 'shimmer'): Promise<string>;
};

type OpenAIServiceRestResponder = (url: string, init: MockFetchInit, requestNumber: number) => Promise<MockResponse>;

function uuidForTest(index: number): string {
  return `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

function openAIServiceHarness(restJwt: string, restResponder: OpenAIServiceRestResponder) {
  const restRequests: Array<{ url: string; init: MockFetchInit }> = [];
  const restCalls: Array<{ path: string; init?: ApiRequestInit }> = [];
  const apiHarness = harness(restJwt, async (url, init) => {
    restRequests.push({ url, init });
    return restResponder(url, init, restRequests.length);
  });
  const storage = {
    async getItem(): Promise<string | null> { return null; },
    async setItem(): Promise<void> {},
    async removeItem(): Promise<void> {},
  };
  let demoActive = false;
  let directFetch: MockFetch = async () => { throw new Error('Unexpected native fetch call'); };
  let uuidCount = 0;
  let walletAuthCalls = 0;
  const apiClientForOpenAI: ApiClientModule = {
    AiAuthRequiredError: apiHarness.client.AiAuthRequiredError,
    restApiFetchJson<T>(path: string, init?: ApiRequestInit) {
      restCalls.push({ path, init });
      return apiHarness.client.restApiFetchJson<T>(path, init);
    },
  };
  const dependencies: Readonly<Record<string, unknown>> = {
    '@react-native-async-storage/async-storage': storage,
    'expo-file-system/legacy': {
      EncodingType: { Base64: 'base64' },
      cacheDirectory: 'file:///offline-cache/',
      documentDirectory: 'file:///offline-documents/',
      async readAsStringAsync(): Promise<string> { return 'offline-audio-base64'; },
      async writeAsStringAsync(): Promise<void> {},
      async getInfoAsync(): Promise<{ exists: boolean }> { return { exists: false }; },
    },
    'react-native': { Platform: { OS: 'ios' } },
    './AnalyticsService': { trackEvent: () => {} },
    '../config/aiPrompts': { getPersonaSystemPrompt: () => 'offline persona system prompt' },
    '../config/countryPacks': {
      vaultDataExtractorPrimarySystemPrompt: () => 'offline document extraction prompt',
      vaultDataExtractorSecondarySystemPrompt: () => 'offline expiry recheck prompt',
    },
    './walletFirebaseSession': {
      async ensureWalletFirebaseAuth(): Promise<void> { walletAuthCalls += 1; },
      async getWalletIdToken(): Promise<string> { walletAuthCalls += 1; return 'offline-firebase-id-token'; },
    },
    '../storage/storageKeys': {
      STORAGE_KEYS: { authSession: 'auth-session', ttsClientCache: 'tts-cache' },
    },
    './identity': {
      adaptResponse: (value: string) => value,
      buildAIIdentityPromptContext: () => '',
      getAIIdentity: async () => null,
      getAIIdentityMemory: async () => null,
    },
    './networkEffect': { buildNetworkPromptInjection: async () => null },
    '../utils/devLog': { devWarn: () => {} },
    '../utils/trustBackendHeaders': { mergeTrustBackendHeaders: (headers: Record<string, string>) => headers },
    './ux/DemoSandbox': {
      isDemoSandboxActive: () => demoActive,
      mockOpenAiUserVisibleReply: () => 'offline demo reply',
    },
    './ai/AIQuotaManager': {
      async checkAndConsumeQuota(): Promise<void> {},
      QuotaExceededError: class QuotaExceededError extends Error {},
    },
    './apiClient': apiClientForOpenAI,
  };
  const context = vm.createContext({
    process: { env: {
      EXPO_PUBLIC_BACKEND_API_BASE: 'https://backend.invalid',
      EXPO_PUBLIC_TTS_CACHE_API_BASE: '',
      EXPO_PUBLIC_TTS_CACHE_TTL_DAYS: '90',
      EXPO_PUBLIC_TTS_CACHE_VERSION: 'test',
    } },
    __DEV__: false,
    crypto: { randomUUID: () => uuidForTest(++uuidCount) },
    fetch: (url: string, init: MockFetchInit) => directFetch(url, init),
    setTimeout,
    clearTimeout,
    console: { log: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  });
  const openAiPath = path.join(ROOT, 'src/services/OpenAIService.ts');
  const compiled = ts.transpileModule(fs.readFileSync(openAiPath, 'utf8'), {
    fileName: openAiPath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} as Record<string, unknown> };
  const closedRequire = (specifier: string): unknown => {
    if (!Object.prototype.hasOwnProperty.call(dependencies, specifier)) {
      throw new Error(`Unexpected OpenAIService runtime dependency blocked: ${specifier}`);
    }
    return dependencies[specifier];
  };
  const execute = new vm.Script(`(function(require, module, exports) { ${compiled}\n})`, {
    filename: openAiPath,
  }).runInContext(context, { timeout: 1_000 }) as (
    require: typeof closedRequire,
    module: { exports: unknown },
    exports: unknown
  ) => void;
  execute(closedRequire, module, module.exports);
  return {
    service: module.exports as OpenAIServiceTestModule,
    api: apiHarness.client,
    restRequests,
    restCalls,
    setDemoActive(value: boolean) { demoActive = value; },
    setDirectFetch(next: MockFetch) { directFetch = next; },
    getUuidCount() { return uuidCount; },
    getWalletAuthCalls() { return walletAuthCalls; },
  };
}

type CopilotClientTestModule = {
  draftGlobalDocument(intent: string, country: string, language: string): Promise<string>;
};

function copilotClientHarness(restJwt: string | null, restResponder: OpenAIServiceRestResponder) {
  const restRequests: Array<{ url: string; init: MockFetchInit }> = [];
  const restCalls: Array<{ path: string; init?: ApiRequestInit }> = [];
  const apiHarness = harness(restJwt, async (url, init) => {
    restRequests.push({ url, init });
    return restResponder(url, init, restRequests.length);
  });
  let uuidCount = 0;
  let firebaseTokenReads = 0;
  let trustHeaderMerges = 0;
  let directFetchCalls = 0;
  const apiClientForCopilot: ApiClientModule = {
    AiAuthRequiredError: apiHarness.client.AiAuthRequiredError,
    restApiFetchJson<T>(path: string, init?: ApiRequestInit) {
      restCalls.push({ path, init });
      return apiHarness.client.restApiFetchJson<T>(path, init);
    },
  };
  const dependencies: Readonly<Record<string, unknown>> = {
    '../walletFirebaseSession': {
      async getWalletIdToken() { firebaseTokenReads += 1; return 'offline-firebase-id-token'; },
    },
    '../../utils/trustBackendHeaders': {
      async mergeTrustBackendHeaders(headers: Record<string, string>) {
        trustHeaderMerges += 1;
        return headers;
      },
    },
    '../apiClient': apiClientForCopilot,
  };
  const context = vm.createContext({
    process: { env: { EXPO_PUBLIC_BACKEND_API_BASE: 'https://backend.invalid' } },
    crypto: { randomUUID: () => uuidForTest(++uuidCount) },
    fetch: async () => { directFetchCalls += 1; throw new Error('Unexpected direct Copilot fetch'); },
    console: { log: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  });
  const copilotPath = path.join(ROOT, 'src/services/ai/CopilotClient.ts');
  const compiled = ts.transpileModule(fs.readFileSync(copilotPath, 'utf8'), {
    fileName: copilotPath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} as Record<string, unknown> };
  const closedRequire = (specifier: string): unknown => {
    if (!Object.prototype.hasOwnProperty.call(dependencies, specifier)) {
      throw new Error(`Unexpected CopilotClient runtime dependency blocked: ${specifier}`);
    }
    return dependencies[specifier];
  };
  const execute = new vm.Script(`(function(require, module, exports) { ${compiled}\n})`, {
    filename: copilotPath,
  }).runInContext(context, { timeout: 1_000 }) as (
    require: typeof closedRequire,
    module: { exports: unknown },
    exports: unknown
  ) => void;
  execute(closedRequire, module, module.exports);
  return {
    client: module.exports as CopilotClientTestModule,
    api: apiHarness.client,
    restRequests,
    restCalls,
    getUuidCount() { return uuidCount; },
    getFirebaseTokenReads() { return firebaseTokenReads; },
    getTrustHeaderMerges() { return trustHeaderMerges; },
    getDirectFetchCalls() { return directFetchCalls; },
  };
}

type TaxCopilotClientTestModule = {
  analyzePayslip(base64Image: string, country: string): Promise<{
    gross: string;
    net: string;
    taxDeducted: string;
    advice: string;
  }>;
};

type TaxApiClientModule = ApiClientModule & { isRestApiConfigured(): boolean };

function taxCopilotClientHarness(restJwt: string | null, restResponder: OpenAIServiceRestResponder) {
  const restRequests: Array<{ url: string; init: MockFetchInit }> = [];
  const restCalls: Array<{ path: string; init?: ApiRequestInit }> = [];
  const apiHarness = harness(restJwt, async (url, init) => {
    restRequests.push({ url, init });
    return restResponder(url, init, restRequests.length);
  });
  const api = apiHarness.client as TaxApiClientModule;
  let uuidCount = 0;
  let directFetchCalls = 0;
  const apiClientForTax: TaxApiClientModule = {
    AiAuthRequiredError: api.AiAuthRequiredError,
    isRestApiConfigured: () => api.isRestApiConfigured(),
    restApiFetchJson<T>(path: string, init?: ApiRequestInit) {
      restCalls.push({ path, init });
      return api.restApiFetchJson<T>(path, init);
    },
  };
  const dependencies: Readonly<Record<string, unknown>> = { '../apiClient': apiClientForTax };
  const taxPath = path.join(ROOT, 'src/services/ai/TaxCopilotClient.ts');
  const compiled = ts.transpileModule(fs.readFileSync(taxPath, 'utf8'), {
    fileName: taxPath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const context = vm.createContext({
    crypto: { randomUUID: () => uuidForTest(++uuidCount) },
    fetch: async () => { directFetchCalls += 1; throw new Error('Unexpected direct Tax fetch'); },
    setTimeout: (callback: () => void) => { callback(); return 1; },
    clearTimeout: () => {},
    console: { log: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  });
  const module = { exports: {} as Record<string, unknown> };
  const closedRequire = (specifier: string): unknown => {
    if (!Object.prototype.hasOwnProperty.call(dependencies, specifier)) {
      throw new Error(`Unexpected TaxCopilotClient runtime dependency blocked: ${specifier}`);
    }
    return dependencies[specifier];
  };
  const execute = new vm.Script(`(function(require, module, exports) { ${compiled}\n})`, {
    filename: taxPath,
  }).runInContext(context, { timeout: 1_000 }) as (
    require: typeof closedRequire,
    module: { exports: unknown },
    exports: unknown
  ) => void;
  execute(closedRequire, module, module.exports);
  return {
    client: module.exports as TaxCopilotClientTestModule,
    api,
    restRequests,
    restCalls,
    getUuidCount() { return uuidCount; },
    getDirectFetchCalls() { return directFetchCalls; },
  };
}

async function run(): Promise<void> {
  let passed = 0;
  const test = async (name: string, fn: () => Promise<void>): Promise<void> => {
    await fn();
    passed += 1;
    console.log(`PASS ${name}`);
  };

  assert.doesNotMatch(API_CLIENT_SOURCE, /getWalletIdToken|walletFirebaseSession/);

  const validToken = jwtWithExpiry(Math.floor(Date.now() / 1000) + 300);
  await test('AI REST route uses stored Express JWT and custom idempotency header', async () => {
    const seen: Array<{ url: string; init: MockFetchInit }> = [];
    const h = harness(validToken, async (url, init) => {
      seen.push({ url, init });
      return response(200, { success: true, data: { accepted: true } });
    });
    const result = await h.client.restApiFetchJson<{ accepted: boolean }>('/api/ai/chat-completion', {
      method: 'POST',
      body: { messages: [] },
      skipAuth: true,
      headers: { 'Idempotency-Key': 'offline-request-key' },
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.data, { accepted: true });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, 'https://rest.invalid/api/ai/chat-completion');
    assert.equal(seen[0].init.headers?.Authorization, `Bearer ${validToken}`);
    assert.equal(seen[0].init.headers?.['Idempotency-Key'], 'offline-request-key');
    assert.equal(h.logs.flat().some((value) => String(value).includes(validToken)), false);
  });

  await test('missing Express JWT fails closed without a request or Firebase-token fallback', async () => {
    let requests = 0;
    const h = harness(null, async () => {
      requests += 1;
      return response(200, { success: true, data: {} });
    });
    await assert.rejects(
      h.client.restApiFetchJson('/api/ai/chat-completion', { method: 'POST', body: {} }),
      (error: unknown) => error instanceof h.client.AiAuthRequiredError && error.code === 'ai_auth_required'
    );
    assert.equal(requests, 0);
    assert.equal(h.logs.length, 0);
  });

  await test('expired Express JWT fails closed before fetch', async () => {
    let requests = 0;
    const h = harness(jwtWithExpiry(Math.floor(Date.now() / 1000) - 1), async () => {
      requests += 1;
      return response(200, { success: true, data: {} });
    });
    await assert.rejects(
      h.client.restApiFetchJson('/api/ai/chat-completion', { method: 'POST', body: {} }),
      (error: unknown) => error instanceof h.client.AiAuthRequiredError && error.code === 'ai_auth_required'
    );
    assert.equal(requests, 0);
  });

  await test('401 becomes ai_auth_required without retrying the old token', async () => {
    let requests = 0;
    const h = harness(validToken, async () => {
      requests += 1;
      return response(401, { success: false, error: 'Unauthorized' });
    });
    await assert.rejects(
      h.client.restApiFetchJson('/api/ai/chat-completion', { method: 'POST', body: {} }),
      (error: unknown) => error instanceof h.client.AiAuthRequiredError && error.code === 'ai_auth_required'
    );
    assert.equal(requests, 1);
    assert.equal(h.logs.length, 0);
  });

  await test('caller AbortSignal cancels the in-flight request', async () => {
    const started = { resolve: () => {} };
    const fetchStarted = new Promise<void>((resolve) => { started.resolve = resolve; });
    let requestSignal: AbortSignal | undefined;
    const h = harness(validToken, async (_url, init) => {
      requestSignal = init.signal;
      started.resolve();
      return await new Promise<MockResponse>((_resolve, reject) => {
        if (init.signal?.aborted) reject(new Error('aborted'));
        else init.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      });
    });
    const controller = new AbortController();
    const request = h.client.restApiFetchJson('/api/ai/chat-completion', {
      method: 'POST', body: {}, signal: controller.signal,
    });
    await fetchStarted;
    controller.abort();
    const result = await request;
    assert.equal(requestSignal, controller.signal);
    assert.equal(requestSignal?.aborted, true);
    assert.equal(result.ok, false);
    assert.equal(result.unreachable, true);
  });

  await test('timeout cancels the request and reports request_timeout', async () => {
    let requestSignal: AbortSignal | undefined;
    const h = harness(validToken, async (_url, init) => {
      requestSignal = init.signal;
      return await new Promise<MockResponse>((_resolve, reject) => {
        if (init.signal?.aborted) reject(new Error('aborted'));
        else init.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      });
    });
    const result = await h.client.restApiFetchJson('/api/ai/chat-completion', {
      method: 'POST', body: {}, timeoutMs: 10,
    });
    assert.equal(requestSignal?.aborted, true);
    assert.equal(result.ok, false);
    assert.equal(result.error, 'request_timeout');
  });

  await test('non-AI REST requests preserve optional session-auth behavior', async () => {
    const seen: MockFetchInit[] = [];
    const h = harness(null, async (_url, init) => {
      seen.push(init);
      return response(200, { success: true, data: { ok: true } });
    });
    const result = await h.client.restApiFetchJson('/api/users/me', { method: 'GET' });
    assert.equal(result.ok, true);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].headers?.Authorization, undefined);
  });

  await test('OpenAIService chat and image callers use the REST JWT rail with caller idempotency keys', async () => {
    const completions = [
      { choices: [{ message: { content: 'chat answer' } }] },
      { choices: [{ message: { content: '{"vision":true}' } }] },
      { choices: [{ message: { content: JSON.stringify({ documentType: 'Passport', expiryDate: '01/01/2030' }) } }] },
      { choices: [{ message: { content: JSON.stringify({ subject: 'Math', level: 'easy', plainSummary: 'Short answer', steps: ['Step one'] }) } }] },
    ];
    const h = openAIServiceHarness(validToken, async (_url, _init, requestNumber) =>
      response(200, { success: true, data: completions[requestNumber - 1] })
    );
    const chat = await h.service.getChatCompletion([{ role: 'user', content: 'hello' }], 'friendly' as never);
    const vision = await h.service.analyzeImage('vision-base64', { userPrompt: 'describe the picture' });
    const document = await h.service.scanDocumentWithAI('document-base64', 'CZ');
    const homework = await h.service.analyzeKidsHomeworkWithAI('homework-base64');

    assert.equal(chat, 'chat answer');
    assert.equal(vision, '{"vision":true}');
    assert.equal(document.expiryDate, '01/01/2030');
    assert.equal(homework.subject, 'Math');
    assert.equal(h.restCalls.length, 4);
    assert.equal(h.restRequests.length, 4);
    assert.equal(h.getUuidCount(), 4);
    assert.equal(h.getWalletAuthCalls(), 0);

    const keys: string[] = [];
    for (let index = 0; index < h.restRequests.length; index += 1) {
      const request = h.restRequests[index];
      const call = h.restCalls[index];
      assert.equal(request.url, 'https://rest.invalid/api/ai/chat-completion');
      assert.equal(request.init.method, 'POST');
      assert.equal(request.init.headers?.Authorization, `Bearer ${validToken}`);
      assert.equal(call.path, '/api/ai/chat-completion');
      assert.equal(call.init?.timeoutMs, 30_000);
      const key = request.init.headers?.['Idempotency-Key'];
      assert.match(key ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i);
      keys.push(key ?? '');
      const body = JSON.parse(request.init.body ?? '{}') as Record<string, unknown>;
      assert.deepEqual(Object.keys(body).sort(), ['maxTokens', 'messages', 'temperature']);
      assert.equal(body.maxTokens, [240, 500, 220, 420][index]);
      assert.equal(typeof body.temperature, 'number');
      assert.ok(Array.isArray(body.messages));
    }
    assert.equal(new Set(keys).size, 4);
    const visionBody = JSON.parse(h.restRequests[1].init.body ?? '{}') as {
      messages: Array<{ role?: unknown; content?: unknown }>;
    };
    const visionUserMessage = visionBody.messages.find((message) => message.role === 'user');
    assert.ok(Array.isArray(visionUserMessage?.content));
    assert.deepEqual((visionUserMessage?.content as unknown[])[1], {
      type: 'image_url',
      image_url: { url: 'data:image/jpeg;base64,vision-base64' },
    });
  });

  await test('transient REST failure retries once with the same idempotency key', async () => {
    const h = openAIServiceHarness(validToken, async (_url, _init, requestNumber) => {
      if (requestNumber === 1) {
        return response(503, { success: false, error: 'temporary unavailable', code: 'provider_unavailable' });
      }
      return response(200, { success: true, data: { choices: [{ message: { content: 'retried answer' } }] } });
    });
    const result = await h.service.analyzeImage('retry-image');
    assert.equal(result, 'retried answer');
    assert.equal(h.restRequests.length, 2);
    assert.equal(h.getUuidCount(), 1);
    assert.equal(h.restRequests[0].init.headers?.['Idempotency-Key'], h.restRequests[1].init.headers?.['Idempotency-Key']);
  });

  await test('OpenAIService does not retry ai_auth_required', async () => {
    const h = openAIServiceHarness(validToken, async () =>
      response(401, { success: false, error: 'unauthorized' })
    );
    await assert.rejects(
      h.service.analyzeImage('auth-image'),
      (error: unknown) => error instanceof h.api.AiAuthRequiredError && error.code === 'ai_auth_required'
    );
    assert.equal(h.restRequests.length, 1);
    assert.equal(h.getUuidCount(), 1);
    assert.equal(h.getWalletAuthCalls(), 0);
  });

  await test('document recheck has its own key while each attempt remains idempotent', async () => {
    const contents = [
      JSON.stringify({ documentType: 'Passport', expiryDate: null }),
      JSON.stringify({ documentType: 'Passport', expiryDate: '02/02/2031' }),
    ];
    const h = openAIServiceHarness(validToken, async (_url, _init, requestNumber) =>
      response(200, { success: true, data: { choices: [{ message: { content: contents[requestNumber - 1] } }] } })
    );
    const result = await h.service.scanDocumentWithAI('two-pass-document');
    assert.equal(result.expiryDate, '02/02/2031');
    assert.equal(h.restRequests.length, 2);
    assert.equal(h.getUuidCount(), 2);
    assert.notEqual(
      h.restRequests[0].init.headers?.['Idempotency-Key'],
      h.restRequests[1].init.headers?.['Idempotency-Key']
    );
  });

  await test('Copilot draft uses REST JWT, 900-token payload, 20s timeout and keeps response extraction', async () => {
    const h = copilotClientHarness(validToken, async () => response(200, {
      success: true,
      data: { choices: [{ message: { content: '  Final legal draft.  ' } }] },
    }));
    const draft = await h.client.draftGlobalDocument('  prepare a letter  ', ' CZ ', ' Czech ');
    assert.equal(draft, 'Final legal draft.');
    assert.equal(h.restRequests.length, 1);
    assert.equal(h.restCalls.length, 1);
    assert.equal(h.restRequests[0].url, 'https://rest.invalid/api/ai/chat-completion');
    assert.equal(h.restRequests[0].init.method, 'POST');
    assert.equal(h.restRequests[0].init.headers?.Authorization, `Bearer ${validToken}`);
    assert.match(
      h.restRequests[0].init.headers?.['Idempotency-Key'] ?? '',
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    assert.equal(h.restCalls[0].path, '/api/ai/chat-completion');
    assert.equal(h.restCalls[0].init?.timeoutMs, 20_000);
    const body = JSON.parse(h.restRequests[0].init.body ?? '{}') as {
      messages: Array<{ role: string; content: string }>;
      temperature: number;
      maxTokens: number;
    };
    assert.deepEqual(Object.keys(body).sort(), ['maxTokens', 'messages', 'temperature']);
    assert.equal(body.temperature, 0.35);
    assert.equal(body.maxTokens, 900);
    assert.equal(body.messages[1]?.content, 'prepare a letter');
    assert.match(body.messages[0]?.content ?? '', /Czech/);
    assert.match(body.messages[0]?.content ?? '', /CZ/);
    assert.equal(h.getUuidCount(), 1);
    assert.equal(h.getFirebaseTokenReads(), 0);
    assert.equal(h.getTrustHeaderMerges(), 0);
    assert.equal(h.getDirectFetchCalls(), 0);
  });

  await test('Copilot missing Express JWT fails closed without Firebase fallback', async () => {
    const h = copilotClientHarness(null, async () => {
      throw new Error('Unexpected Copilot request without an Express JWT');
    });
    await assert.rejects(
      h.client.draftGlobalDocument('intent', 'CZ', 'Czech'),
      (error: unknown) => error instanceof h.api.AiAuthRequiredError && error.code === 'ai_auth_required'
    );
    assert.equal(h.restRequests.length, 0);
    assert.equal(h.getFirebaseTokenReads(), 0);
    assert.equal(h.getDirectFetchCalls(), 0);
  });

  await test('Copilot 401 propagates ai_auth_required without retry', async () => {
    const h = copilotClientHarness(validToken, async () => response(401, { success: false, error: 'unauthorized' }));
    await assert.rejects(
      h.client.draftGlobalDocument('intent', 'CZ', 'Czech'),
      (error: unknown) => error instanceof h.api.AiAuthRequiredError && error.code === 'ai_auth_required'
    );
    assert.equal(h.restRequests.length, 1);
    assert.equal(h.getUuidCount(), 1);
    assert.equal(h.getFirebaseTokenReads(), 0);
    assert.equal(h.getDirectFetchCalls(), 0);
  });

  await test('Tax payslip transport uses REST JWT, 320-token body, idempotency and keeps the existing mock on completion parse miss', async () => {
    const h = taxCopilotClientHarness(validToken, async () => response(200, {
      success: true,
      data: {
        choices: [{
          message: {
            content: JSON.stringify({ gross: 'REAL gross', net: 'REAL net', taxDeducted: 'REAL tax', advice: 'REAL advice' }),
          },
        }],
      },
    }));
    const longBase64 = `${'A'.repeat(4_000)}TAIL_MUST_BE_CUT`;
    const result = await h.client.analyzePayslip(longBase64, ' DE ');
    assert.equal(result.gross, '3000 EUR');
    assert.equal(result.net, '2200 EUR');
    assert.equal(result.taxDeducted, '800 EUR');
    assert.equal(result.advice, 'Bạn có thể hoàn lại khoảng 300 EUR thuế vào cuối năm nếu nộp đầy đủ hồ sơ khấu trừ tại DE.');
    assert.equal(h.restCalls.length, 1);
    assert.equal(h.restRequests.length, 1);
    assert.equal(h.restCalls[0].path, '/api/ai/chat-completion');
    assert.equal(h.restRequests[0].url, 'https://rest.invalid/api/ai/chat-completion');
    assert.equal(h.restRequests[0].init.method, 'POST');
    assert.equal(h.restRequests[0].init.headers?.Authorization, `Bearer ${validToken}`);
    assert.match(
      h.restRequests[0].init.headers?.['Idempotency-Key'] ?? '',
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    assert.equal(h.restCalls[0].init?.timeoutMs, 20_000);
    const body = JSON.parse(h.restRequests[0].init.body ?? '{}') as {
      messages: Array<{ role: string; content: string }>;
      temperature: number;
      maxTokens: number;
    };
    assert.deepEqual(Object.keys(body).sort(), ['maxTokens', 'messages', 'temperature']);
    assert.equal(body.temperature, 0.2);
    assert.equal(body.maxTokens, 320);
    assert.match(body.messages[0]?.content ?? '', /DE/);
    assert.equal(body.messages[1]?.content, `Phân tích bảng lương này (base64): ${'A'.repeat(4_000)}`);
    assert.equal(body.messages[1]?.content.includes('TAIL_MUST_BE_CUT'), false);
    assert.equal(h.getUuidCount(), 1);
    assert.equal(h.getDirectFetchCalls(), 0);
    const taxSource = fs.readFileSync(path.join(ROOT, 'src/services/ai/TaxCopilotClient.ts'), 'utf8');
    assert.doesNotMatch(taxSource, /getWalletIdToken|\/aiProxy|op:\s*['"]chat['"]/);
  });

  await test('Tax REST HTTP failure keeps the existing mock fallback', async () => {
    const h = taxCopilotClientHarness(validToken, async () => response(503, {
      success: false,
      error: 'synthetic unavailable',
      code: 'provider_unavailable',
    }));
    const result = await h.client.analyzePayslip('image-base64', 'CZ');
    assert.equal(result.gross, '3000 EUR');
    assert.equal(h.restRequests.length, 1);
    assert.equal(h.getUuidCount(), 1);
  });

  await test('Tax ai_auth_required follows existing mock catch path without retry', async () => {
    const h = taxCopilotClientHarness(validToken, async () => response(401, { success: false, error: 'unauthorized' }));
    const result = await h.client.analyzePayslip('image-base64', 'CZ');
    assert.equal(result.gross, '3000 EUR');
    assert.equal(h.restRequests.length, 1);
    assert.equal(h.getUuidCount(), 1);
    assert.equal(h.getDirectFetchCalls(), 0);
  });

  await test('demo sandbox skips REST auth/network and STT/TTS remain on Firebase /aiProxy', async () => {
    const h = openAIServiceHarness(validToken, async () => {
      throw new Error('Unexpected REST AI fetch in demo or STT/TTS test');
    });
    h.setDemoActive(true);
    assert.equal(
      await h.service.getChatCompletion([{ role: 'user', content: 'demo prompt' }], 'friendly' as never),
      'offline demo reply'
    );
    assert.equal(h.restRequests.length, 0);
    assert.equal(h.getWalletAuthCalls(), 0);

    h.setDemoActive(false);
    const directRequests: Array<{ url: string; init: MockFetchInit }> = [];
    h.setDirectFetch(async (url, init) => {
      directRequests.push({ url, init });
      const body = JSON.parse(init.body ?? '{}') as { op?: string };
      return body.op === 'stt'
        ? response(200, { text: 'recognized speech' })
        : response(200, { audioBase64: 'b2ZmbGluZS1hdWRpbw==' });
    });
    assert.equal(await h.service.transcribeAudio('file:///offline-input.m4a'), 'recognized speech');
    const speechUri = await h.service.generateSpeech('hello', 'nova');
    assert.match(speechUri, /^file:\/\/\/offline-cache\/tts-/);
    assert.equal(directRequests.length, 2);
    assert.equal(h.restRequests.length, 0);
    assert.deepEqual(directRequests.map(({ url }) => url), [
      'https://backend.invalid/aiProxy',
      'https://backend.invalid/aiProxy',
    ]);
    assert.deepEqual(
      directRequests.map(({ init }) => (JSON.parse(init.body ?? '{}') as { op?: string }).op),
      ['stt', 'tts']
    );
    assert.ok(directRequests.every(({ init }) => init.headers?.Authorization === 'Bearer offline-firebase-id-token'));
  });

  console.log(`${passed} REST JWT AI fetch checks passed`);
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
