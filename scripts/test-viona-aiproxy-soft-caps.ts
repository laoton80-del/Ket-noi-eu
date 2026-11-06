/**
 * P0-A0C1 offline tests. Executes the real two handlers and their AI/auth/rate helpers in
 * a closed VM with synthetic env, fetch, Auth and App Check. No Firebase initialization,
 * .env, provider network, database, build output or other exported handler is executed.
 * Run: tsx --tsconfig functions/tsconfig.json scripts/test-viona-aiproxy-soft-caps.ts
 */
import * as assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import * as ts from 'typescript';

import type * as Validation from '../functions/src/aiProxyValidation';
import type * as Rate from '../functions/src/aiProxyRateLimit';

const root = resolve(__dirname, '..');
const lf = (bytes: Buffer): Buffer => Buffer.from(bytes.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
const indexText = readFileSync(resolve(root, 'functions/src/index.ts'), 'utf8').replace(/\r\n/g, '\n');
const indexAst = ts.createSourceFile('index.ts', indexText, ts.ScriptTarget.Latest, true);
const targetNames = new Set(['aiProxy', 'analyzeDocumentProxy']);
const parserNames = new Set(['safeJsonParse', 'extractJsonObject', 'parseDocumentResultOrThrow']);
function approvedStatement(statement: ts.Statement): boolean {
  return ts.isVariableStatement(statement) && statement.declarationList.declarations.every((declaration) =>
    ts.isIdentifier(declaration.name) && (targetNames.has(declaration.name.text) || /^(AI_PROXY_|ANALYZE_DOCUMENT_|GEMINI_)/.test(declaration.name.text))
  );
}
const protectedIndex = indexAst.statements.filter((statement) => !approvedStatement(statement))
  .map((statement) => indexText.slice(statement.getFullStart(), statement.end)).join('')
  + indexText.slice(indexAst.endOfFileToken.getFullStart());
const selected = indexAst.statements.filter((statement) =>
  approvedStatement(statement)
  || (ts.isFunctionDeclaration(statement) && statement.name !== undefined && parserNames.has(statement.name.text))
  || (ts.isTypeAliasDeclaration(statement) && statement.name.text === 'DocumentParseResult')
);
assert.equal(selected.filter((statement) => ts.isVariableStatement(statement)
  && statement.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && targetNames.has(d.name.text))).length, 2);
const handlerSource = `
import { logger } from 'firebase-functions/v2';
import { HttpsError, onRequest } from 'firebase-functions/v2/https';
import { verifyAppCheckForRequest } from './appCheckGate';
import { takeAiProxyRateSlot } from './aiProxyRateLimit';
import { AI_PROXY_MAX_BODY_BYTES, parseAndValidateChatPayload, requestBodyByteLength, validateSttPayload, validateTtsPayload } from './aiProxyValidation';
import { proxyChat, proxyStt, proxyTts } from './openaiProxy';
${selected.map((statement) => indexText.slice(statement.getFullStart(), statement.end)).join('\n')}
`;

type RequestFixture = {
  method: string;
  body: Record<string, unknown>;
  rawBody: Buffer;
  header: (name: string) => string | undefined;
};
type ResponseFixture = {
  status: (status: number) => ResponseFixture;
  json: (body: Record<string, unknown>) => ResponseFixture;
  send: (body: unknown) => ResponseFixture;
};
type Endpoint = {
  options: Record<string, unknown>;
  handler: (req: RequestFixture, res: ResponseFixture) => Promise<void>;
};
type EndpointName = 'aiProxy' | 'analyzeDocumentProxy';
type LogRecord = { level: string; message: string; data?: unknown };
const TOKEN_MARKER = 'OFFLINE_FIREBASE_ID_TOKEN_NEVER_LOG';
const APP_CHECK_MARKER = 'OFFLINE_APP_CHECK_TOKEN_NEVER_LOG';
const OPENAI_KEY = 'offline-openai-key-not-real';
const GEMINI_KEY = 'offline-gemini-key-not-real';
const CHAT = { op: 'chat', messages: [{ role: 'user', content: 'Synthetic question' }] };
const DOCUMENT = { base64Image: 'QUFBQQ==', countryContext: 'Czechia' };
const image = () => ({ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,QUFBQQ==' } });
const compiled = new Map<string, string>();

function harness(options: {
  env?: Record<string, string | undefined>;
  fetchError?: Error;
  upstreamStatus?: number;
  geminiText?: string;
} = {}) {
  const env: Record<string, string | undefined> = { OPENAI_API_KEY: OPENAI_KEY, GEMINI_API_KEY: GEMINI_KEY, ...options.env };
  const logs: LogRecord[] = [];
  const requests: Array<{ url: string; init: Record<string, unknown> }> = [];
  const counts = { auth: 0, decoded: 0, appCheck: 0 };
  const identities = new Map<string, { uid: string; provider: string | undefined }>();
  let now = 1_000_000;
  let sequence = 0;
  const logger = Object.fromEntries(['info', 'warn', 'error'].map((level) => [level,
    (message: unknown, data?: unknown) => logs.push({ level, message: String(message), data }),
  ]));
  class FakeHttpsError extends Error {
    constructor(readonly code: string, message: string) { super(message); this.name = 'HttpsError'; }
  }
  class Clock extends Date { static now() { return now; } }
  class FakeFormData {
    fields: Array<[string, unknown]> = [];
    append(name: string, value: unknown) { this.fields.push([name, value]); }
  }
  class FakeFile {
    constructor(readonly parts: unknown[], readonly name: string, readonly options: unknown) {}
  }
  const fetch = async (url: unknown, init: Record<string, unknown>) => {
    requests.push({ url: String(url), init });
    if (options.fetchError) throw options.fetchError;
    const status = options.upstreamStatus ?? 200;
    const modelText = JSON.stringify({ title: 'Dữ liệu thử', summary: 'Tóm tắt thử', urgency: 'Low', actionItems: ['Kiểm tra bản gốc'] });
    return {
      ok: status >= 200 && status < 300, status,
      json: async () => ({ id: 'synthetic-completion', choices: [{ message: { content: 'Synthetic answer' } }], text: 'Synthetic transcription' }),
      text: async () => options.geminiText ?? JSON.stringify({ candidates: [{ content: { parts: [{ text: modelText }] } }] }),
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    };
  };
  const context = createContext({
    process: { env }, Buffer, Date: Clock, Error, TypeError,
    fetch, FormData: FakeFormData, File: FakeFile,
  }, { codeGeneration: { strings: false, wasm: false } });
  function load<T>(file: string, dependencies: Record<string, unknown> = {}, override?: string): T {
    const filename = resolve(root, file);
    const cacheKey = override === undefined ? filename : `${filename}:two-approved-handlers`;
    let output = compiled.get(cacheKey);
    if (output === undefined) {
      output = ts.transpileModule(override ?? readFileSync(filename, 'utf8'), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      }).outputText;
      compiled.set(cacheKey, output);
    }
    const module = { exports: {} };
    const require = (id: string): unknown => {
      if (!Object.prototype.hasOwnProperty.call(dependencies, id)) throw new Error(`Unexpected runtime dependency blocked: ${id}`);
      return dependencies[id];
    };
    const execute = runInContext(`(function(require, module, exports) { ${output}\n})`, context, { filename, timeout: 1000 }) as
      (require: (id: string) => unknown, module: { exports: unknown }, exports: unknown) => void;
    execute(require, module, module.exports);
    return module.exports as T;
  }
  const validation = load<typeof Validation>('functions/src/aiProxyValidation.ts');
  const rate = load<typeof Rate>('functions/src/aiProxyRateLimit.ts');
  const walletAuth = load<{
    requireFirebaseBearerUserDecoded: (req: RequestFixture) => Promise<unknown>;
  }>('functions/src/walletAuth.ts', {
    'firebase-admin/auth': { getAuth: () => ({ verifyIdToken: async (token: string) => {
      counts.auth += 1;
      const identity = identities.get(token);
      if (!identity) throw new Error(`Synthetic invalid token ${token}`);
      return { uid: identity.uid, firebase: { sign_in_provider: identity.provider } };
    } }) },
  });
  const upstream = load('functions/src/openaiProxy.ts');
  const endpoints = load<Record<EndpointName, Endpoint>>('functions/src/index.ts', {
    'firebase-functions/v2': { logger },
    'firebase-functions/v2/https': {
      HttpsError: FakeHttpsError,
      onRequest: (config: Record<string, unknown>, handler: Endpoint['handler']) => ({ options: config, handler }),
    },
    './aiProxyValidation': validation,
    './aiProxyRateLimit': rate,
    './openaiProxy': upstream,
    './walletAuth': {
      requireFirebaseBearerUser: () => { throw new Error('Legacy uid-only auth helper must not be used'); },
      requireFirebaseBearerUserDecoded: (req: RequestFixture) => {
        counts.decoded += 1;
        return walletAuth.requireFirebaseBearerUserDecoded(req);
      },
    },
    './appCheckGate': { verifyAppCheckForRequest: async (req: RequestFixture, surface: string) => {
      counts.appCheck += 1;
      assert.equal(surface, 'aiProxy');
      return req.header('x-firebase-appcheck') === `${APP_CHECK_MARKER}_invalid`
        ? { ok: false, status: 401, error: 'app_check_invalid' } : { ok: true };
    } },
  }, handlerSource);

  function noTokenLogs(): void {
    const text = JSON.stringify(logs);
    for (const marker of [TOKEN_MARKER, APP_CHECK_MARKER, OPENAI_KEY, GEMINI_KEY]) {
      assert.equal(text.includes(marker), false, 'logs must contain no ID/App Check token or provider key');
    }
  }
  async function call(name: EndpointName, body: Record<string, unknown>, requestOptions: {
    uid?: string;
    provider?: string;
    noProviderClaim?: boolean;
    noToken?: boolean;
    invalidToken?: boolean;
    denyAppCheck?: boolean;
    method?: string;
    rawBytes?: number;
  } = {}) {
    const token = `${TOKEN_MARKER}.${++sequence}`;
    if (!requestOptions.invalidToken) identities.set(token, {
      uid: requestOptions.uid ?? 'user-1', provider: requestOptions.noProviderClaim ? undefined : requestOptions.provider ?? 'password',
    });
    const headers: Record<string, string> = {
      'x-firebase-appcheck': requestOptions.denyAppCheck ? `${APP_CHECK_MARKER}_invalid` : APP_CHECK_MARKER,
    };
    if (!requestOptions.noToken) headers.authorization = `Bearer ${token}`;
    const req: RequestFixture = {
      method: requestOptions.method ?? 'POST', body,
      rawBody: requestOptions.rawBytes === undefined ? Buffer.from(JSON.stringify(body)) : Buffer.alloc(requestOptions.rawBytes),
      header: (name) => headers[name.toLowerCase()],
    };
    const result = { status: 0, body: {} as Record<string, unknown> };
    const res: ResponseFixture = {
      status(status) { result.status = status; return res; },
      json(payload) { result.body = payload; return res; },
      send(payload) { result.body = { sent: payload }; return res; },
    };
    const logStart = logs.length;
    await endpoints[name].handler(req, res);
    const requestLogs = logs.slice(logStart).filter((log) => log.message === `[${name}] request`);
    assert.equal(requestLogs.length, 1, 'each request must emit exactly one structured provider observation');
    assert.ok(Object.prototype.hasOwnProperty.call(requestLogs[0].data, 'signInProvider'));
    noTokenLogs();
    return result;
  }
  return { endpoints, validation, rate, logs, requests, counts, call, noTokenLogs, advance: (ms: number) => { now += ms; } };
}

function assertError(response: { status: number; body: Record<string, unknown> }, status: number, error: string): void {
  assert.equal(response.status, status);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.error, error);
}
function providerLog(h: ReturnType<typeof harness>, name: EndpointName): Record<string, unknown> {
  const entry = [...h.logs].reverse().find((log) => log.message === `[${name}] request`);
  assert.ok(entry);
  return entry.data as Record<string, unknown>;
}
let passed = 0;
async function test(name: string, run: () => Promise<void> | void): Promise<void> {
  await run(); passed += 1; console.log(`PASS ${name}`);
}

async function main(): Promise<void> {
  await test('only approved index blocks/config changed; walletAuth and functions/lib remain untouched', () => {
    const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex').toUpperCase();
    assert.equal(hash(protectedIndex), '7D76BA04105498556A5B3C3879D3DD332FCDEC2FBDBFA2B4E058FAE544ECFC71');
    assert.equal(hash(lf(readFileSync(resolve(root, 'functions/src/walletAuth.ts')))), '71C10E0935D1EE954C4A38E6750CBA9F4BDA8BB4C74D017F23B09D9873F25512');
    // updated after functions/lib rebuild d2223d8
    assert.equal(hash(readFileSync(resolve(root, 'functions/lib/index.js'))), 'E0AD5F20C5BCC0398137943C89B84C4077A91BA1306F9580A0A08644AD135B5D');
  });
  for (const [requested, expected] of [[undefined, 240], [512, 512], [513, 512], [8192, 512], [3.8, 3], [-1, 1], [NaN, 240], [Infinity, 240]] as const) {
    await test(`chat maxTokens ${String(requested)} is bounded at ${expected}`, () => {
      const h = harness(); const result = h.validation.parseAndValidateChatPayload({ ...CHAT, maxTokens: requested });
      assert.ok(result.ok); assert.equal(result.maxTokens, expected);
    });
  }
  await test('actual OpenAI request carries max_tokens=512 and two images still work', async () => {
    const h = harness();
    const response = await h.call('aiProxy', { ...CHAT, maxTokens: 9999, messages: [{ role: 'user', content: [image(), image()] }] });
    assert.equal(response.status, 200); assert.equal(h.requests.length, 1);
    assert.equal(JSON.parse(String(h.requests[0].init.body)).max_tokens, 512);
    assert.equal(h.counts.decoded, 1);
  });
  await test('two images split across messages remain allowed', async () => {
    const h = harness();
    const response = await h.call('aiProxy', { ...CHAT, messages: [{ role: 'user', content: [image()] }, { role: 'user', content: [image()] }] });
    assert.equal(response.status, 200); assert.equal(h.requests.length, 1);
  });
  for (const split of [false, true]) {
    await test(`three images ${split ? 'split across messages' : 'in one message'} reject before fetch`, async () => {
      const h = harness();
      const messages = split ? [{ role: 'user', content: [image(), image()] }, { role: 'user', content: [image()] }]
        : [{ role: 'user', content: [image(), image(), image()] }];
      assertError(await h.call('aiProxy', { ...CHAT, messages }), 400, 'chat_too_many_images');
      assert.equal(h.requests.length, 0);
    });
  }
  await test('other chat, STT and TTS limits/defaults are preserved', () => {
    const v = harness().validation;
    assert.equal(v.AI_PROXY_MAX_BODY_BYTES, 6 * 1024 * 1024);
    assert.equal(v.parseAndValidateChatPayload({ messages: Array.from({ length: 49 }, () => ({ role: 'user', content: 'x' })) }).ok, false);
    const single = v.parseAndValidateChatPayload({ messages: [{ role: 'user', content: 'x'.repeat(100_001) }] });
    assert.equal(single.ok, false); if (!single.ok) assert.equal(single.error, 'chat_content_too_long');
    const total = v.parseAndValidateChatPayload({ messages: [{ role: 'user', content: 'x'.repeat(100_000) }, { role: 'user', content: 'y'.repeat(100_000) }, { role: 'user', content: 'z' }] });
    assert.equal(total.ok, false); if (!total.ok) assert.equal(total.error, 'chat_total_text_too_large');
    assert.equal(v.validateTtsPayload({ text: 'x'.repeat(4096), voice: 'nova' }).ok, true);
    assert.equal(v.validateTtsPayload({ text: 'x'.repeat(4097), voice: 'nova' }).ok, false);
    assert.equal(v.validateSttPayload({ base64Audio: 'QUFBQQ==', mime: 'audio/mp4' }).ok, true);
    assert.equal(v.validateSttPayload({ base64Audio: 'QUFBQQ==', mime: 'image/png' }).ok, false);
  });
  await test('STT and TTS routes still reach only mock fetch', async () => {
    const h = harness();
    assert.equal((await h.call('aiProxy', { op: 'stt', base64Audio: 'QUFBQQ==', mime: 'audio/mp4' })).status, 200);
    assert.equal((await h.call('aiProxy', { op: 'tts', text: 'Synthetic speech', voice: 'nova' })).status, 200);
    assert.equal(h.requests.length, 2);
  });

  for (const [name, emulator, dev] of [
    ['outside emulator', undefined, undefined], ['outside emulator with dev flag', undefined, '1'],
    ['false emulator marker', 'false', '1'], ['non-exact emulator marker', 'TRUE', '1'],
    ['emulator without dev flag', 'true', undefined], ['emulator with dev off', 'true', '0'],
  ] as const) {
    await test(`REQUIRE_AUTH=0 ${name} still requires login and logs error`, async () => {
      const h = harness({ env: { AI_PROXY_REQUIRE_AUTH: '0', FUNCTIONS_EMULATOR: emulator, AI_PROXY_EMULATOR_ALLOW_UNAUTHENTICATED: dev } });
      assertError(await h.call('aiProxy', CHAT, { noToken: true }), 401, 'missing_bearer_token');
      assert.equal(h.requests.length, 0);
      assert.ok(h.logs.some((log) => log.level === 'error' && log.message === '[aiProxy] require_auth_override_ignored'));
    });
  }
  await test('only exact emulator plus explicit dev flag permits missing-token chat', async () => {
    const h = harness({ env: { AI_PROXY_REQUIRE_AUTH: '0', FUNCTIONS_EMULATOR: 'true', AI_PROXY_EMULATOR_ALLOW_UNAUTHENTICATED: '1' } });
    assert.equal((await h.call('aiProxy', CHAT, { noToken: true })).status, 200);
    assert.equal(h.requests.length, 1);
    assert.equal(providerLog(h, 'aiProxy').signInProvider, 'emulator_unauthenticated');
  });
  await test('dev flags alone cannot disable required auth', async () => {
    const h = harness({ env: { FUNCTIONS_EMULATOR: 'true', AI_PROXY_EMULATOR_ALLOW_UNAUTHENTICATED: '1' } });
    assertError(await h.call('aiProxy', CHAT, { noToken: true }), 401, 'missing_bearer_token');
    assert.equal(h.requests.length, 0);
  });
  await test('document proxy keeps mandatory login even with emulator chat bypass', async () => {
    const h = harness({ env: { AI_PROXY_REQUIRE_AUTH: '0', FUNCTIONS_EMULATOR: 'true', AI_PROXY_EMULATOR_ALLOW_UNAUTHENTICATED: '1' } });
    assertError(await h.call('analyzeDocumentProxy', DOCUMENT, { noToken: true }), 401, 'missing_bearer_token');
    assert.equal(h.requests.length, 0);
  });
  for (const name of ['aiProxy', 'analyzeDocumentProxy'] as const) {
    const body = name === 'aiProxy' ? CHAT : DOCUMENT;
    for (const flag of [undefined, '0']) {
      await test(`${name}: anonymous token stays allowed with block flag ${String(flag)}`, async () => {
        const h = harness({ env: { AI_PROXY_BLOCK_ANONYMOUS: flag } });
        assert.equal((await h.call(name, body, { provider: 'anonymous' })).status, 200);
        assert.equal(providerLog(h, name).signInProvider, 'anonymous'); assert.equal(h.requests.length, 1);
      });
    }
    await test(`${name}: block flag rejects anonymous token with 403 and zero fetch`, async () => {
      const h = harness({ env: { AI_PROXY_BLOCK_ANONYMOUS: '1' } });
      assertError(await h.call(name, body, { provider: 'anonymous' }), 403, 'anonymous_not_allowed');
      assert.equal(providerLog(h, name).signInProvider, 'anonymous'); assert.equal(h.requests.length, 0);
    });
    await test(`${name}: block flag keeps non-anonymous AI available`, async () => {
      const h = harness({ env: { AI_PROXY_BLOCK_ANONYMOUS: '1' } });
      assert.equal((await h.call(name, body, { provider: 'google.com' })).status, 200);
      assert.equal(providerLog(h, name).signInProvider, 'google.com'); assert.equal(h.requests.length, 1);
    });
    await test(`${name}: invalid auth is rejected and raw token never logged`, async () => {
      const h = harness();
      assertError(await h.call(name, body, { invalidToken: true }), 401, 'invalid_id_token');
      assert.equal(h.counts.auth, 1); assert.equal(h.requests.length, 0);
    });
    await test(`${name}: App Check rejection remains before Auth and fetch`, async () => {
      const h = harness();
      assertError(await h.call(name, body, { denyAppCheck: true }), 401, 'app_check_invalid');
      assert.equal(h.counts.decoded, 0); assert.equal(h.requests.length, 0);
      assert.equal(providerLog(h, name).signInProvider, 'not_evaluated');
    });
    await test(`${name}: non-POST request still logs a provider field`, async () => {
      const h = harness(); assert.equal((await h.call(name, body, { method: 'GET' })).status, 405);
      assert.equal(h.requests.length, 0); assert.equal(h.counts.decoded, 0);
    });
  }
  await test('anonymous block also applies to a token supplied in emulator bypass mode', async () => {
    const h = harness({ env: { AI_PROXY_REQUIRE_AUTH: '0', FUNCTIONS_EMULATOR: 'true', AI_PROXY_EMULATOR_ALLOW_UNAUTHENTICATED: '1', AI_PROXY_BLOCK_ANONYMOUS: '1' } });
    assertError(await h.call('aiProxy', CHAT, { provider: 'anonymous' }), 403, 'anonymous_not_allowed');
    assert.equal(h.requests.length, 0);
  });
  await test('chat raw body limit is unchanged and rejects before fetch', async () => {
    const h = harness();
    assertError(await h.call('aiProxy', CHAT, { rawBytes: 6 * 1024 * 1024 + 1 }), 413, 'payload_too_large');
    assert.equal(h.counts.decoded, 0); assert.equal(h.requests.length, 0);
  });

  await test('document rate limit is 20 per uid per minute, including refreshed tokens', async () => {
    const h = harness();
    for (let i = 0; i < 20; i += 1) assert.equal((await h.call('analyzeDocumentProxy', DOCUMENT)).status, 200);
    assertError(await h.call('analyzeDocumentProxy', DOCUMENT), 429, 'rate_limited');
    assert.equal(h.requests.length, 20);
    assert.equal((await h.call('analyzeDocumentProxy', DOCUMENT, { uid: 'another-user' })).status, 200);
    h.advance(59_999);
    assertError(await h.call('analyzeDocumentProxy', DOCUMENT), 429, 'rate_limited');
    h.advance(1); assert.equal((await h.call('analyzeDocumentProxy', DOCUMENT)).status, 200);
  });
  await test('chat and document rate keys and windows are separate', async () => {
    const h = harness({ env: { AI_PROXY_MAX_RPM: '2', AI_PROXY_RATE_WINDOW_MS: '10000' } });
    for (let i = 0; i < 2; i += 1) assert.equal((await h.call('aiProxy', CHAT)).status, 200);
    assertError(await h.call('aiProxy', CHAT), 429, 'rate_limited');
    for (let i = 0; i < 20; i += 1) assert.equal((await h.call('analyzeDocumentProxy', DOCUMENT)).status, 200);
    assertError(await h.call('analyzeDocumentProxy', DOCUMENT), 429, 'rate_limited');
    h.advance(10_000); assert.equal((await h.call('aiProxy', CHAT)).status, 200);
    assertError(await h.call('analyzeDocumentProxy', DOCUMENT), 429, 'rate_limited');
  });
  await test('uid literally named anonymous cannot bypass authenticated chat rate limits', async () => {
    const h = harness({ env: { AI_PROXY_MAX_RPM: '1' } });
    assert.equal((await h.call('aiProxy', CHAT, { uid: 'anonymous' })).status, 200);
    assertError(await h.call('aiProxy', CHAT, { uid: 'anonymous' }), 429, 'rate_limited');
  });
  await test('rate pruning preserves the other scope longer active window', () => {
    const h = harness();
    for (let i = 0; i < 20; i += 1) assert.equal(h.rate.takeAiProxyRateSlot('user-1', 20, 60_000, 'analyzeDocumentProxy'), true);
    h.advance(45_000);
    for (let i = 0; i < 499; i += 1) assert.equal(h.rate.takeAiProxyRateSlot(`chat-${i}`, 1, 10_000), true);
    assert.equal(h.rate.takeAiProxyRateSlot('user-1', 20, 60_000, 'analyzeDocumentProxy'), false);
  });
  await test('both captured Cloud Function configurations set maxInstances=10', () => {
    const h = harness();
    for (const name of ['aiProxy', 'analyzeDocumentProxy'] as const) {
      assert.equal(h.endpoints[name].options.maxInstances, 10);
      assert.equal(h.endpoints[name].options.region, 'europe-west1');
      assert.equal(h.endpoints[name].options.timeoutSeconds, 120);
      assert.equal(h.endpoints[name].options.memory, '1GiB');
    }
  });
  for (const countryContext of ['x'.repeat(101), ` ${'x'.repeat(100)}`]) {
    await test('countryContext over 100 raw characters rejects before Gemini fetch', async () => {
      const h = harness();
      assertError(await h.call('analyzeDocumentProxy', { ...DOCUMENT, countryContext }), 400, 'country_context_too_long');
      assert.equal(h.requests.length, 0);
    });
  }
  await test('100-character country context is accepted with Gemini maxOutputTokens=1024', async () => {
    const h = harness(); const countryContext = 'x'.repeat(100);
    const response = await h.call('analyzeDocumentProxy', { ...DOCUMENT, countryContext });
    assert.equal(response.status, 200); assert.equal(response.body.ok, true); assert.equal(h.requests.length, 1);
    const payload = JSON.parse(String(h.requests[0].init.body));
    assert.equal(payload.generationConfig.maxOutputTokens, 1024);
    assert.equal(payload.generationConfig.temperature, 0.2);
    assert.equal(payload.generationConfig.responseMimeType, 'application/json');
    assert.ok(payload.contents[0].parts[0].text.includes(countryContext));
  });
  await test('document missing-input and image-size limits remain in force', async () => {
    const h = harness();
    assertError(await h.call('analyzeDocumentProxy', { ...DOCUMENT, countryContext: '' }), 400, 'country_context_required');
    assertError(await h.call('analyzeDocumentProxy', { ...DOCUMENT, base64Image: '' }), 400, 'base64_image_required');
    assertError(await h.call('analyzeDocumentProxy', { ...DOCUMENT, base64Image: 'A'.repeat(7_000_001) }), 413, 'image_too_large');
    assert.equal(h.requests.length, 0);
  });
  for (const name of ['aiProxy', 'analyzeDocumentProxy'] as const) {
    await test(`${name}: thrown upstream error cannot echo tokens into logs`, async () => {
      const h = harness({ fetchError: new Error(`Synthetic failure ${TOKEN_MARKER} ${APP_CHECK_MARKER}`) });
      assert.equal((await h.call(name, name === 'aiProxy' ? CHAT : DOCUMENT)).status, 500);
      h.noTokenLogs();
    });
  }
  await test('Gemini HTTP failure does not log upstream body containing a token', async () => {
    const h = harness({ upstreamStatus: 400, geminiText: `Synthetic echoed token ${TOKEN_MARKER}` });
    assertError(await h.call('analyzeDocumentProxy', DOCUMENT), 502, 'gemini_upstream_http'); h.noTokenLogs();
  });
  console.log(`\n${passed} passed; real Firebase/Auth/App Check/provider/DB modules never loaded; no .env or build output written.`);
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
