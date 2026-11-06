/**
 * Offline A0E V2 checks. Real voice resolvers/catalog run in closed VMs with synthetic
 * environments. Baseline sources come from the exact approved Git commit, read-only.
 * No .env, TTS/provider/DB client or network is loaded.
 * Run: tsx scripts/test-viona-voice-scenario-retail-taphoa.ts
 */
import * as assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import * as ts from 'typescript';

import type * as Profile from '../src/services/voicePersona/resolveVoiceProfile';
import type * as Persona from '../src/services/voice/resolveVoicePersona';
import type { VoiceScenario } from '../src/services/voicePersona/voicePersonaTypes';

const root = resolve(__dirname, '..');
const lf = (bytes: Buffer): Buffer => Buffer.from(bytes.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
const BASE = '3a6798d7752caf61000060f7f0401297d3f6f92a';
const TYPES = 'src/services/voicePersona/voicePersonaTypes.ts';
const PROFILE = 'src/services/voicePersona/resolveVoiceProfile.ts';
const REGISTRY = 'src/services/voice/voicePersonaRegistry.ts';
function git(args: string[]): string {
  return execFileSync('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', ...args], {
    cwd: root, windowsHide: true, encoding: 'utf8',
  });
}
git(['merge-base', '--is-ancestor', BASE, 'HEAD']);
const REVIEWED_A0E_V2_SHA256: Readonly<Record<string, string>> = {
  [TYPES]: 'EBAF74ACFA4A78A56AA709902E6DA265502BA6D4D4DC9876EAE933B2D0B77CC4',
  [PROFILE]: '53009E54B13CC05CFEA6A6782D28E48F1C9325183BFEA2771F90DFD11996883C',
  [REGISTRY]: 'C7F6A4258964CCB40756E8302CA024E8AD599BB4638CFC5B65B45209C4123B02',
};
for (const [file, expected] of Object.entries(REVIEWED_A0E_V2_SHA256)) {
  assert.equal(createHash('sha256').update(lf(readFileSync(resolve(root, file)))).digest('hex').toUpperCase(), expected);
}
const baseline = new Map([TYPES, PROFILE, REGISTRY].map((file) => [file, git(['show', `${BASE}:${file}`])]));
const candidate = new Map([TYPES, PROFILE, REGISTRY].map((file) => [file, readFileSync(resolve(root, file), 'utf8')]));
function scenarios(source: string): string[] {
  const ast = ts.createSourceFile(TYPES, source, ts.ScriptTarget.Latest, true);
  const declaration = ast.statements.find((node): node is ts.TypeAliasDeclaration =>
    ts.isTypeAliasDeclaration(node) && node.name.text === 'VoiceScenario');
  assert.ok(declaration); assert.ok(ts.isUnionTypeNode(declaration.type));
  return declaration.type.types.map((node) => {
    assert.ok(ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal));
    return node.literal.text;
  });
}
const oldScenarios = scenarios(baseline.get(TYPES)!);
function explicitFriendlyCase(source: string, functionName: string): void {
  const ast = ts.createSourceFile(functionName + '.ts', source, ts.ScriptTarget.Latest, true);
  const declaration = ast.statements.find((node): node is ts.FunctionDeclaration =>
    ts.isFunctionDeclaration(node) && node.name?.text === functionName);
  assert.ok(declaration?.body);
  const statement = declaration.body.statements.find(ts.isSwitchStatement);
  assert.ok(statement);
  const clauses = statement.caseBlock.clauses;
  const index = clauses.findIndex((clause) => ts.isCaseClause(clause)
    && ts.isStringLiteral(clause.expression) && clause.expression.text === 'retail_taphoa');
  assert.ok(index >= 0, `${functionName} must explicitly recognize retail_taphoa`);
  for (let i = index; i < clauses.length; i += 1) {
    assert.ok(ts.isCaseClause(clauses[i]), 'retail_taphoa must not depend on default');
    if (clauses[i].statements.length === 0) continue;
    const first = clauses[i].statements[0];
    assert.ok(ts.isReturnStatement(first) && first.expression && ts.isStringLiteral(first.expression));
    assert.equal(first.expression.text, 'friendly');
    return;
  }
  assert.fail('Explicit friendly return missing');
}

const compiled = new Map<string, string>();
function harness(version: 'baseline' | 'candidate', env: Record<string, string>) {
  const context = createContext({ process: { env: { NODE_ENV: 'test', ...env } }, Error, TypeError }, {
    codeGeneration: { strings: false, wasm: false },
  });
  function load<T>(file: string, dependencies: Record<string, unknown> = {}): T {
    const key = version + ':' + file;
    let output = compiled.get(key);
    if (output === undefined) {
      const source = version === 'baseline' && baseline.has(file)
        ? baseline.get(file)! : readFileSync(resolve(root, file), 'utf8');
      output = ts.transpileModule(source, {
        fileName: file,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      }).outputText;
      compiled.set(key, output);
    }
    const require = (id: string): unknown => {
      if (!Object.prototype.hasOwnProperty.call(dependencies, id)) throw new Error(`Unexpected dependency blocked: ${id}`);
      return dependencies[id];
    };
    const module = { exports: {} };
    const execute = runInContext(`(function(require, module, exports) { ${output}\n})`, context, {
      filename: file, timeout: 1000,
    }) as (require: (id: string) => unknown, module: { exports: unknown }, exports: unknown) => void;
    execute(require, module, module.exports);
    return module.exports as T;
  }
  const catalog = load('src/services/voicePersona/voiceCatalog.ts');
  const profile = load<typeof Profile>(PROFILE, { './voiceCatalog': catalog });
  const registry = load(REGISTRY);
  const persona = load<typeof Persona>('src/services/voice/resolveVoicePersona.ts', {
    '../voicePersona/voiceCatalog': catalog,
    '../voicePersona/resolveVoiceProfile': profile,
    './voicePersonaRegistry': registry,
  });
  return { profile, persona };
}

type Input = Parameters<typeof Persona.resolveVoicePersona>[0];
const modes: Input['mode'][] = ['leona_outbound', 'b2b_inbound', 'live_interpreter', 'call_assist', 'chau_loan'];
const genders: Input['userGender'][] = ['male', 'female', 'unknown'];
const languages = ['vi', 'en-GB', 'cs-CZ', 'de-DE', 'fr', ''];
const businesses: Input['businessType'][] = [undefined, 'nails', 'restaurant', 'grocery_retail', 'grocery_wholesale', 'hospitality_stay'];
const tenantCases: NonNullable<Input['tenantConfig']>[] = [
  { preferredTone: 'formal' },
  { preferredTone: 'neutral' },
  { defaultLanguage: 'cs', personaKeyOverride: 'synthetic-persona', voiceIdOverride: 'nova', speakingRateOverride: 0.93, pitchStyleOverride: 'bright', fillerStyleOverride: 'expressive', hesitationStyleOverride: 'none' },
];
const environments = [
  { name: 'synthetic defaults', env: {} as Record<string, string>, friendlyVoice: 'shimmer', neutralVoice: 'shimmer' },
  { name: 'synthetic catalog overrides', env: {
    EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_VI: 'nova',
    EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_VI: 'alloy',
    EXPO_PUBLIC_VOICE_MALE_FORMAL_EN: 'shimmer',
  }, friendlyVoice: 'nova', neutralVoice: 'alloy' },
];
const beforeDigest = createHash('sha256');
const afterDigest = createHash('sha256');
let comparisons = 0;
function same(input: unknown, before: unknown, after: unknown): void {
  const oldRecord = JSON.stringify({ input, result: before });
  const newRecord = JSON.stringify({ input, result: after });
  assert.equal(newRecord, oldRecord, 'Old scenario behavior changed: ' + JSON.stringify(input));
  beforeDigest.update(oldRecord + '\n'); afterDigest.update(newRecord + '\n'); comparisons += 1;
}
let passed = 0;
async function test(name: string, run: () => Promise<void> | void): Promise<void> {
  await run(); passed += 1; console.log(`PASS ${name}`);
}

async function main(): Promise<void> {
  await test('VoiceScenario keeps all 12 old values and adds only retail_taphoa', () => {
    const current = scenarios(candidate.get(TYPES)!);
    assert.equal(oldScenarios.length, 12); assert.ok(oldScenarios.includes('potraviny'));
    assert.equal(oldScenarios.includes('retail_taphoa'), false);
    assert.deepEqual([...current].sort(), [...oldScenarios, 'retail_taphoa'].sort());
  });
  await test('scenarioToTone explicitly puts retail_taphoa in friendly group', () => explicitFriendlyCase(candidate.get(PROFILE)!, 'scenarioToTone'));
  await test('scenarioBaseTone explicitly puts retail_taphoa in friendly group', () => explicitFriendlyCase(candidate.get(REGISTRY)!, 'scenarioBaseTone'));
  for (const environment of environments) {
    const before = harness('baseline', environment.env);
    const after = harness('candidate', environment.env);
    const retail: Input = { mode: 'b2b_inbound', scenario: 'retail_taphoa', businessType: 'grocery_retail', userGender: 'unknown', language: 'vi' };
    await test(`${environment.name}: canonical retail_taphoa stays friendly with exact persona key`, () => {
      const profile = after.persona.resolveVoicePersona(retail);
      assert.equal(profile.tone, 'friendly');
      assert.equal(profile.personaKey, 'b2b_inbound.grocery_retail.retail_taphoa.friendly');
      assert.equal(profile.voiceId, environment.friendlyVoice);
      assert.equal(profile.speakingRate, 1.02); assert.equal(profile.pitchStyle, 'warm');
      assert.equal(profile.fillerStyle, 'natural'); assert.equal(profile.hesitationStyle, 'moderate');
      assert.equal(JSON.stringify(profile), JSON.stringify(before.persona.resolveVoicePersona(retail)));
      assert.equal(after.profile.resolveVoiceProfile({ scenario: 'retail_taphoa', userGender: 'unknown', language: 'vi' }).tone, 'friendly');
    });
    await test(`${environment.name}: potraviny remains neutral`, () => {
      const input: Input = { ...retail, scenario: 'potraviny' };
      const result = after.persona.resolveVoicePersona(input);
      assert.equal(result.tone, 'neutral'); assert.equal(result.voiceId, environment.neutralVoice);
      assert.equal(result.personaKey, 'b2b_inbound.grocery_retail.potraviny.neutral');
      assert.equal(after.profile.resolveVoiceProfile({ scenario: 'potraviny', userGender: 'unknown', language: 'vi' }).tone, 'neutral');
    });
    for (const oldScenario of oldScenarios) {
      const scenario = oldScenario as VoiceScenario;
      await test(`${environment.name}: old scenario ${scenario} matches exact HEAD behavior`, () => {
        for (const mode of modes) for (const userGender of genders) for (const language of languages) for (const businessType of businesses) {
          const input: Input = { mode, scenario, userGender, language, businessType };
          same(input, before.persona.resolveVoicePersona(input), after.persona.resolveVoicePersona(input));
        }
        for (const userGender of genders) for (const language of languages) {
          const input = { scenario, userGender, language };
          same(input, before.profile.resolveVoiceProfile(input), after.profile.resolveVoiceProfile(input));
        }
        for (const mode of modes) for (const tenantConfig of tenantCases) {
          const input: Input = { mode, scenario, userGender: 'unknown', language: '', businessType: 'grocery_retail', tenantConfig };
          same(input, before.persona.resolveVoicePersona(input), after.persona.resolveVoicePersona(input));
        }
      });
    }
  }
  await test('functions caller, persona resolver and generated lib remain untouched', () => {
    const expected = {
      'functions/src/b2b/voice/processVoiceOrchestrationRequest.ts': 'D3003D9637B3F7DD149D0AA4B480B63E2685482AA4ACFB6872F980519F6582A1',
      'src/services/voice/resolveVoicePersona.ts': '85985C17CF90F9CA7C9C4F0C0B50E661E0BFEB4CD880F749E5731A3DB7B162CA',
      // updated after functions/lib rebuild d2223d8
      'functions/lib/index.js': 'E0AD5F20C5BCC0398137943C89B84C4077A91BA1306F9580A0A08644AD135B5D',
    };
    for (const [file, digest] of Object.entries(expected)) {
      const bytes = readFileSync(resolve(root, file));
      assert.equal(createHash('sha256').update(file === 'functions/lib/index.js' ? bytes : lf(bytes)).digest('hex').toUpperCase(), digest);
    }
  });
  const before = beforeDigest.digest('hex').toUpperCase();
  const after = afterDigest.digest('hex').toUpperCase();
  assert.equal(before, after);
  console.log(`\n${passed} passed; ${oldScenarios.length} old scenarios; ${comparisons} before/after comparisons identical.`);
  console.log(`Old-scenario output SHA256 before=${before} after=${after}`);
  console.log('All catalog environments synthetic; no TTS/provider/DB/network loaded.');
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
