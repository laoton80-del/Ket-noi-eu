/**
 * P0-A0D offline regression tests. Real MinhKhangService source runs in a closed VM;
 * REST, chat, vision and analytics are synthetic. No .env, Firebase, provider or network.
 * Run: tsx scripts/test-viona-minhkhang-no-paid-fallback.ts
 */
import * as assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import * as ts from 'typescript';

import type { ApiRequestResult } from '../src/services/apiClient';
import type * as MinhKhang from '../src/services/ai/MinhKhangService';

const root = resolve(__dirname, '..');
const servicePath = resolve(root, 'src/services/ai/MinhKhangService.ts');
const source = readFileSync(servicePath, 'utf8');
const ast = ts.createSourceFile(servicePath, source, ts.ScriptTarget.Latest, true);
const travel = ast.statements.find((node): node is ts.FunctionDeclaration =>
  ts.isFunctionDeclaration(node) && node.name?.text === 'translateTravelPhrase');
const vision = ast.statements.find((node): node is ts.FunctionDeclaration =>
  ts.isFunctionDeclaration(node) && node.name?.text === 'translateForeignMenuOrDocument');
assert.ok(travel); assert.ok(vision);
const output = ts.transpileModule(source, {
  fileName: servicePath,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
type TranslationData = { translatedText: string; fromCache: boolean };
type RestResult = ApiRequestResult<TranslationData>;

function harness(options: {
  configured: boolean;
  restResult?: RestResult;
  restFailure?: Error;
  chatFailure?: Error;
}) {
  const calls = {
    configured: 0,
    rest: [] as Array<{ path: string; init: { method: string; body: { text: string; sourceLangHint: string } } }>,
    chat: [] as unknown[][],
    vision: 0,
    analytics: [] as Array<{ name: string; payload: Record<string, unknown> }>,
  };
  const dependencies: Record<string, unknown> = {
    '../AnalyticsService': { trackEvent: (name: string, payload: Record<string, unknown>) => { calls.analytics.push({ name, payload }); } },
    '../../config/pricingConfig': { PRICING_AUTHORITY: {} },
    '../../config/aiPersonaCapabilities': { getPersonaCapability: () => { throw new Error('Unrelated persona execution blocked'); } },
    '../apiClient': {
      isRestApiConfigured: () => { calls.configured += 1; return options.configured; },
      restApiFetchJson: async (path: string, init: (typeof calls.rest)[number]['init']): Promise<RestResult> => {
        calls.rest.push({ path, init });
        if (options.restFailure) throw options.restFailure;
        return options.restResult ?? { ok: true, status: 200, data: { translatedText: 'Bản dịch REST giả.', fromCache: false } };
      },
    },
    '../OpenAIService': {
      getChatCompletion: async (...args: unknown[]) => {
        calls.chat.push(args);
        if (options.chatFailure) throw options.chatFailure;
        return '  Bản dịch proxy giả.  ';
      },
      analyzeImage: async () => { calls.vision += 1; throw new Error('Unexpected vision execution blocked'); },
    },
  };
  const require = (id: string): unknown => {
    if (!Object.prototype.hasOwnProperty.call(dependencies, id)) throw new Error(`Unexpected dependency blocked: ${id}`);
    return dependencies[id];
  };
  const module = { exports: {} };
  const context = createContext({ process: { env: { NODE_ENV: 'test' } }, Error, TypeError }, {
    codeGeneration: { strings: false, wasm: false },
  });
  const execute = runInContext(`(function(require, module, exports) { ${output}\n})`, context, {
    filename: servicePath, timeout: 1000,
  }) as (require: (id: string) => unknown, module: { exports: unknown }, exports: unknown) => void;
  execute(require, module, module.exports);
  return { service: module.exports as typeof MinhKhang, calls };
}

function assertOffline(result: MinhKhang.MinhKhangTextTranslationResult): void {
  assert.equal(result.provider, 'mock_offline');
  assert.equal(result.translatedVi, '[Offline/mock] Synthetic phrase');
  assert.equal(result.sourceLangGuess, 'cs');
}
function assertNoPaidFallback(h: ReturnType<typeof harness>): void {
  assert.equal(h.calls.chat.length, 0);
  assert.equal(h.calls.vision, 0);
  assert.equal(h.calls.analytics.length, 0);
  assert.equal(h.calls.rest.length, 1);
  assert.equal(h.calls.configured, 1);
}
let passed = 0;
async function test(name: string, run: () => Promise<void> | void): Promise<void> {
  await run(); passed += 1; console.log(`PASS ${name}`);
}

async function main(): Promise<void> {
  await test('apiClient and everything outside translateTravelPhrase remain unchanged', () => {
    const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex').toUpperCase();
    const outside = (source.slice(0, travel!.getStart(ast)) + source.slice(travel!.end)).replace(/\r\n/g, '\n');
    assert.equal(hash(outside), '322D960E5CDC182F9B96554E7E194E21627876C5F0B9182315820FDDA65FC82B');
    assert.equal(hash(source.slice(vision!.getStart(ast), vision!.end)), '781155EFDF7DD1A9640925D75610DF2904926DC7AA78CD44A92B360C7157A36B');
    assert.equal(hash(readFileSync(resolve(root, 'src/services/apiClient.ts'))), '53D4BBD13DF5668AF57DC18E393D010F103E38D0181F6C5B644E6F3E64931D7B');
  });
  for (const status of [200, 400, 401, 403, 404, 429, 500, 502, 503]) {
    await test(`configured REST ok:false/status ${status} returns offline without chat fallback`, async () => {
      const h = harness({ configured: true, restResult: {
        ok: false, status, error: 'Synthetic REST failure', code: 'LLM_PROVIDER_ADMISSION_DENIED',
      } });
      assertOffline(await h.service.translateTravelPhrase('  Synthetic phrase  ', 'cs'));
      assertNoPaidFallback(h);
    });
  }
  await test('configured REST unreachable network result returns offline without chat', async () => {
    const h = harness({ configured: true, restResult: { ok: false, status: 0, error: 'Synthetic network failure', unreachable: true } });
    assertOffline(await h.service.translateTravelPhrase('Synthetic phrase', 'cs')); assertNoPaidFallback(h);
  });
  for (const failure of [new TypeError('Synthetic fetch failure'), new Error('Synthetic REST exception')]) {
    await test(`configured REST thrown ${failure.name} returns offline without chat`, async () => {
      const h = harness({ configured: true, restFailure: failure });
      assertOffline(await h.service.translateTravelPhrase('Synthetic phrase', 'cs')); assertNoPaidFallback(h);
    });
  }
  for (const fromCache of [false, true]) {
    await test(`configured REST success/fromCache=${fromCache} returns its translation with zero chat calls`, async () => {
      const h = harness({ configured: true, restResult: { ok: true, status: 200, data: { translatedText: 'Bản dịch REST đã xác minh.', fromCache } } });
      const result = await h.service.translateTravelPhrase('  Synthetic phrase  ', 'cs');
      assert.equal(result.translatedVi, 'Bản dịch REST đã xác minh.');
      assert.equal(result.sourceLangGuess, 'cs');
      assert.equal(result.provider, fromCache ? 'cached_server' : 'openai_proxy');
      assertNoPaidFallback(h);
      assert.equal(h.calls.rest[0].path, '/api/ai/translate/travel-phrase');
      assert.equal(h.calls.rest[0].init.method, 'POST');
      assert.equal(h.calls.rest[0].init.body.text, 'Synthetic phrase');
      assert.equal(h.calls.rest[0].init.body.sourceLangHint, 'cs');
    });
  }
  await test('unconfigured REST keeps exactly one existing chat call and its telemetry', async () => {
    const h = harness({ configured: false });
    const result = await h.service.translateTravelPhrase('  Synthetic phrase  ', 'cs');
    assert.equal(result.provider, 'openai_proxy'); assert.equal(result.translatedVi, 'Bản dịch proxy giả.');
    assert.equal(result.sourceLangGuess, 'cs'); assert.equal(h.calls.rest.length, 0);
    assert.equal(h.calls.chat.length, 1); assert.equal(h.calls.vision, 0);
    assert.equal(h.calls.chat[0][1], 'loan');
    assert.equal((h.calls.chat[0][2] as Record<string, unknown>).serviceContext, 'interpreter');
    assert.equal(h.calls.analytics.length, 1);
    assert.equal(h.calls.analytics[0].name, 'travel_phrase_translation_used');
    assert.equal(h.calls.analytics[0].payload.surface, 'client_llm_fallback');
  });
  await test('unconfigured REST chat failure keeps the existing offline result after one call', async () => {
    const h = harness({ configured: false, chatFailure: new Error('Synthetic proxy failure') });
    assertOffline(await h.service.translateTravelPhrase('Synthetic phrase', 'cs'));
    assert.equal(h.calls.rest.length, 0); assert.equal(h.calls.chat.length, 1); assert.equal(h.calls.vision, 0);
  });
  for (const configured of [false, true]) {
    await test(`empty phrase/configured=${configured} remains offline without API or chat`, async () => {
      const h = harness({ configured });
      const result = await h.service.translateTravelPhrase('   ', 'cs');
      assert.equal(result.provider, 'mock_offline'); assert.equal(result.translatedVi, '');
      assert.equal(result.sourceLangGuess, 'cs');
      assert.equal(h.calls.rest.length, 0); assert.equal(h.calls.chat.length, 0); assert.equal(h.calls.vision, 0);
    });
  }
  console.log(`\n${passed} passed; all REST/chat/vision dependencies synthetic; no .env, Firebase or provider network loaded.`);
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
