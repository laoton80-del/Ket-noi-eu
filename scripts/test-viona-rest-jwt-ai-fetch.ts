import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const ROOT = path.resolve(__dirname, '..');
const API_CLIENT = path.join(ROOT, 'src/services/apiClient.ts');
const API_CLIENT_SOURCE = fs.readFileSync(API_CLIENT, 'utf8');

type MockResponse = Readonly<{ status: number; text(): Promise<string> }>;
type MockFetchInit = Readonly<{
  method?: string;
  headers?: Readonly<Record<string, string>>;
  body?: string;
  signal?: AbortSignal;
}>;
type MockFetch = (url: string, init: MockFetchInit) => Promise<MockResponse>;
type ApiClientModule = {
  AiAuthRequiredError: new () => Error & Readonly<{ code: string }>;
  restApiFetchJson<T>(path: string, init?: Readonly<Record<string, unknown>>): Promise<{
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
  return { status, text: async () => JSON.stringify(body) };
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

  console.log(`${passed} REST JWT AI fetch checks passed`);
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
