/**
 * Wave 1 public-copy contract: Viona umbrella, Leona specialist, SOS Core.
 * Run: npx tsx scripts/test-viona-runtime-canon-wave1-public-copy.ts
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  VIONA_REC2_UNIVERSE_ORDER,
  openVionaRec2AlfredUi,
} from '../src/components/viona/home/vionaRec2HomeContract';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');
let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean): void {
  if (condition) {
    passed += 1;
    console.log(`[PASS] ${label}`);
    return;
  }
  failed += 1;
  console.error(`[FAIL] ${label}`);
}

function read(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(read(relativePath)) as Record<string, unknown>;
}

function objectAt(rootObject: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  let current: unknown = rootObject;
  for (const key of keys) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      throw new Error(`Expected object at ${keys.join('.')}`);
    }
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current !== 'object' || current === null || Array.isArray(current)) {
    throw new Error(`Expected object at ${keys.join('.')}`);
  }
  return current as Record<string, unknown>;
}

function stringAt(rootObject: Record<string, unknown>, keys: readonly string[]): string {
  let current: unknown = rootObject;
  for (const key of keys) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      throw new Error(`Expected object at ${keys.join('.')}`);
    }
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current !== 'string') {
    throw new Error(`Expected string at ${keys.join('.')}`);
  }
  return current;
}

function flattenPublicValues(value: unknown): readonly string[] {
  if (typeof value === 'string') return [value];
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [];
  return Object.values(value).flatMap((child) => flattenPublicValues(child));
}

function sourceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) return '';
  return source.slice(startIndex, endIndex);
}

function exportedSingleQuotedConst(source: string, name: string): string | null {
  const match = source.match(new RegExp(`export const ${name}\\s*=\\s*'((?:\\\\'|[^'])*)'`, 'm'));
  return match?.[1] ?? null;
}

const SOS_TARGET_KEYS = [
  'learnBasicVsPlus',
  'learnBasicVsPlusA11y',
  'plusInfoTitle',
  'basicTierTitle',
  'preLoginTitle',
  'preLoginGateSub',
] as const;
const SOS_FULL_LOCALES = ['en', 'vi', 'ja', 'fr', 'ko'] as const;
const ALL_LOCALES = ['en', 'vi', 'ja', 'fr', 'ko', 'de', 'cs'] as const;

const en = readJson('src/i18n/locales/en.json');
const vi = readJson('src/i18n/locales/vi.json');
const enAlfred = objectAt(en, ['home', 'rec2', 'alfred']);
const viAlfred = objectAt(vi, ['home', 'rec2', 'alfred']);

assert('English Rec2 public assistant title is Viona', enAlfred.title === 'Viona');
assert('Vietnamese Rec2 public assistant title is Viona', viAlfred.title === 'Viona');
assert(
  'English Rec2 Alfred/Viona public values expose no Alfred label',
  flattenPublicValues(enAlfred).every((value) => !/Alfred/i.test(value))
);
assert(
  'Vietnamese Rec2 Alfred/Viona public values expose no Alfred label',
  flattenPublicValues(viAlfred).every((value) => !/Alfred/i.test(value))
);

assert(
  'Rec2 universe order remains exactly six canonical IDs',
  JSON.stringify([...VIONA_REC2_UNIVERSE_ORDER]) ===
    JSON.stringify(['local', 'travel', 'academy', 'business', 'account', 'sos'])
);
assert('Home is not a Rec2 universe ID', !(VIONA_REC2_UNIVERSE_ORDER as readonly string[]).includes('home'));

const panelSource = read('src/components/viona/home/VionaRec2AlfredPanel.tsx');
const contractSource = read('src/components/viona/home/vionaRec2HomeContract.ts');
const homeSource = read('src/screens/HomeScreen.tsx');
const rec2EntrySource = sourceBetween(
  homeSource,
  'function VionaRec2HomeEntry()',
  'function ReconstructionHomeScreen()'
);
const reconstructionHomeSource = sourceBetween(
  homeSource,
  'function ReconstructionHomeScreen()',
  'const styles = StyleSheet.create('
);

assert('Rec2 panel still opens through openVionaRec2AlfredUi', panelSource.includes('openVionaRec2AlfredUi'));
assert('Rec2 contract still exports openVionaRec2AlfredUi', contractSource.includes('export function openVionaRec2AlfredUi'));
assert('openVionaRec2AlfredUi still returns ui-opened', openVionaRec2AlfredUi(() => undefined) === 'ui-opened');
assert(
  'Rec2 Home entry does not wire generic open to LeonaCall, payment, wallet, or provider',
  !/(LeonaCall|payment|wallet|provider|booking|Stripe)/i.test(rec2EntrySource)
);

const appSource = read('App.tsx');
const leonaGateBlock = sourceBetween(
  appSource,
  'const LeonaCallScreenGated = mvpGateByFlag(',
  'const LiveInterpreterScreenGated = mvpGateByFlag('
);
assert(
  'App.tsx gated LeonaCall title is specialist Leona',
  /mvpGateByFlag\(\s*'leonaAssistantEnabled',\s*'Leona',\s*MVP_LEONA_LITE_OFF_MSG,\s*LeonaCallScreen/.test(
    leonaGateBlock
  )
);
assert('App.tsx gated public title no longer uses Leona Assistant Lite', !leonaGateBlock.includes('Leona Assistant Lite'));

const gateSource = read('src/navigation/mvpSurfaceGate.tsx');
const leonaOffMsg = exportedSingleQuotedConst(gateSource, 'MVP_LEONA_LITE_OFF_MSG');
const b2bOffMsg = exportedSingleQuotedConst(gateSource, 'MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG');
assert('Leona off-message value is present', typeof leonaOffMsg === 'string' && leonaOffMsg.length > 0);
assert(
  'Leona off-message public value does not say Leona Assistant Lite',
  !leonaOffMsg!.includes('Leona Assistant Lite')
);
assert('Leona off-message public value identifies Leona', /\bLeona\b/.test(leonaOffMsg!));
assert(
  'B2B off-message public value does not say Leona Assistant Lite',
  !b2bOffMsg!.includes('Leona Assistant Lite')
);

for (const locale of SOS_FULL_LOCALES) {
  const json = readJson(`src/i18n/locales/${locale}.json`);
  for (const key of SOS_TARGET_KEYS) {
    const value = stringAt(json, ['sos', key]);
    assert(
      `${locale} sos.${key} has no user-visible SOS Basic`,
      !value.includes('SOS Basic')
    );
    assert(
      `${locale} sos.${key} has no user-visible Basic vs Plus`,
      !value.includes('Basic vs Plus')
    );
    assert(
      `${locale} sos.${key} uses Core terminology`,
      value.includes('SOS Core') || /\bCore\b/.test(value)
    );
  }
  assert(
    `${locale} SOS Plus public name remains SOS Plus`,
    stringAt(json, ['sos', 'plusName']).includes('SOS Plus') &&
      stringAt(json, ['sos', 'plusTierTitle']).includes('SOS Plus')
  );
}

for (const locale of ALL_LOCALES) {
  const planFree = stringAt(readJson(`src/i18n/locales/${locale}.json`), ['sosPlus', 'planFree']);
  assert(`${locale} sosPlus.planFree has no SOS Basic`, !planFree.includes('SOS Basic'));
  assert(`${locale} sosPlus.planFree contains SOS Core`, planFree.includes('SOS Core'));
}

assert('Reconstruction Home was not relabeled Ask Viona', !reconstructionHomeSource.includes('Ask Viona'));
assert(
  'Reconstruction Home still opens specialist LeonaCall',
  reconstructionHomeSource.includes("openProtected('LeonaCall')")
);
assert('Wave 1 did not introduce Ask Viona in App.tsx', !appSource.includes('Ask Viona'));

if (failed > 0) {
  console.error(`\n${failed} failed / ${passed} passed`);
  process.exit(1);
}
console.log(`\n${passed} passed`);
