/**
 * Phase 2-B — Native Travel Clear Premium composition (initial IA).
 * Run: npx tsx scripts/test-viona-mobile-phase2-travel-native-clear-premium-composition.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveTravelPresentationTarget } from '../src/navigation/travelPresentationTarget';
import { MAIN_TAB } from '../src/navigation/routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let failed = 0;

function assert(label: string, condition: boolean): void {
  if (!condition) {
    console.error(`[FAIL] ${label}`);
    failed += 1;
    return;
  }
  console.log(`[PASS] ${label}`);
}

function read(rel: string): string {
  return readFileSync(path.join(root, rel), 'utf8');
}

const compositionRel = 'src/components/viona/native-travel/VionaNativeTravelClearPremiumComposition.tsx';
const contextRel = 'src/components/viona/native-travel/VionaNativeTravelContextStrip.tsx';
const flagshipRel = 'src/components/viona/native-travel/VionaNativeTravelFlagshipActions.tsx';
const utilityRel = 'src/components/viona/native-travel/VionaNativeTravelUtilityActions.tsx';
const secondaryRel = 'src/components/viona/native-travel/VionaNativeTravelSecondaryStack.tsx';

assert('native Clear Premium composition exists', existsSync(path.join(root, compositionRel)));
assert('native context strip exists', existsSync(path.join(root, contextRel)));
assert('native flagship actions exist', existsSync(path.join(root, flagshipRel)));
assert('native utility actions exist', existsSync(path.join(root, utilityRel)));
assert('native secondary stack exists', existsSync(path.join(root, secondaryRel)));

const composition = read(compositionRel);
const context = read(contextRel);
const flagship = read(flagshipRel);
const utility = read(utilityRel);
const secondary = read(secondaryRel);
const opening = read('src/components/viona/VionaNativeTravelOpeningStage.tsx');
const travel = read('src/screens/b2c/TravelScreen.tsx');
const mapper = read('src/navigation/travelPresentationTarget.ts');
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const sosVisibility = read('src/navigation/vionaGlobalSosShellVisibility.ts');

assert(
  'composition testID present',
  composition.includes('viona-native-travel-clear-premium-composition')
);
assert('composition is presentation-only (no navigate)', !composition.includes('navigate('));
assert('context strip does not fetch', !context.includes('getTravelContext') && !context.includes('fetch('));
assert('flagship includes airport', flagship.includes("'airport'"));
assert('flagship includes translation', flagship.includes("'translation'"));
assert('flagship includes taxi', flagship.includes("'taxi'"));
assert('flagship includes emergency', flagship.includes("'emergency'"));
assert('utility includes transit', utility.includes("'transit'"));
assert('utility includes hotel', utility.includes("'hotel'"));
assert('utility includes restaurant', utility.includes("'restaurant'"));
assert('utility includes shopping', utility.includes("'shopping'"));
assert('utility includes hospital', utility.includes("'hospital'"));
assert('secondary includes LocalFixer callback prop', secondary.includes('onOpenLocalFixer'));
assert('secondary includes embassy-capable discovery previews', secondary.includes('discoveryPreviews'));
assert('secondary includes connected items', secondary.includes('connectedItems'));
assert('secondary includes gated items', secondary.includes('gatedItems'));

assert(
  'android stays native-adaptive',
  resolveTravelPresentationTarget({ platform: 'android', windowWidth: 1280 }) === 'native-adaptive'
);
assert(
  'web desktop mapping unchanged',
  resolveTravelPresentationTarget({ platform: 'web', windowWidth: 1280 }) === 'web-desktop'
);

assert(
  'TravelScreen mounts composition only on native-adaptive',
  travel.includes("travelPresentationTarget === 'native-adaptive'") &&
    travel.includes('VionaNativeTravelClearPremiumComposition')
);
assert('TravelScreen still owns TravelGlassCard for Web', travel.includes('<TravelGlassCard'));
assert('TravelScreen still imports fashionHomeDesktopShell helpers', travel.includes('fashionHomeDesktopShell'));
assert('native MiniAppShell uses existing light surface', travel.includes('surfaceMode="light"'));
assert('opening stage remains thin children host', opening.includes('{children}') && opening.includes('viona-native-travel-opening-stage'));
assert(
  'opening stage does not import native-travel',
  !opening.includes("from './native-travel") && !opening.includes("from '../native-travel")
);

assert('TravelScreen still constructs airport', travel.includes("id: 'airport'"));
assert('TravelScreen still constructs translation', travel.includes("id: 'translation'"));
assert('TravelScreen still constructs taxi', travel.includes("id: 'taxi'"));
assert('TravelScreen still constructs emergency', travel.includes("id: 'emergency'"));
assert('TravelScreen still constructs transit', travel.includes("id: 'transit'"));
assert('TravelScreen still constructs hotel', travel.includes("id: 'hotel'"));
assert('TravelScreen still constructs restaurant', travel.includes("id: 'restaurant'"));
assert('TravelScreen still constructs shopping', travel.includes("id: 'shopping'"));
assert('TravelScreen still constructs hospital', travel.includes("id: 'hospital'"));
assert('TravelScreen still owns openMiniApp', travel.includes('openMiniApp'));
assert('TravelScreen still owns Leona entry', travel.includes("'b2cAiCallAssistant'"));
assert('TravelScreen still owns Interpreter entry', travel.includes("'minhKhangTranslator'"));
assert('TravelScreen still owns LocalFixer', travel.includes("'LocalFixer'"));
assert('TravelScreen still owns SOS hold-gate', travel.includes('VionaSosHoldGateModal'));
assert('TravelScreen still owns destinationQuery', travel.includes('destinationQuery'));

assert('B2C Home tab unchanged', mainTab.includes('MAIN_TAB.B2C.home'));
assert('B2C Local tab unchanged', mainTab.includes('MAIN_TAB.B2C.local'));
assert('B2C Travel tab unchanged', mainTab.includes('MAIN_TAB.B2C.travel') && routes.includes('B2C'));
assert('B2C Academy tab unchanged', mainTab.includes('MAIN_TAB.B2C.ai'));
assert('Account chrome still PersonalHub', mainTab.includes('openPersonalHub'));
assert('MainTabNavigator still mounts canonical SOSModal', mainTab.includes("from '../screens/b2c/SOSModal'"));
assert('Travel does not mount tab-bar SOS', sosVisibility.includes('MAIN_TAB.B2C.travel') && sosVisibility.includes('return false'));
assert('SOS hold remains 3000', sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000'));
assert('mapper has no AI provider', !mapper.includes('openai') && !mapper.includes('anthropic'));
assert('composition has no AI provider', !composition.includes('openai') && !composition.includes('anthropic'));
assert(
  'P2-C responsive refinement exists and remains native-only',
  composition.includes('P2-C') &&
    composition.includes('onLayout') &&
    travel.includes("travelPresentationTarget === 'native-adaptive'") &&
    travel.includes('VionaNativeTravelClearPremiumComposition')
);
assert('P2-D not claimed GREEN in composition', !composition.includes('P2-D'));
assert('P2-D not claimed GREEN in TravelScreen', !travel.includes('P2-D'));
assert(
  'P2-D final-closure TEST exists',
  existsSync(path.join(root, 'scripts/test-viona-mobile-phase2-travel-final-closure.ts')) &&
    read('scripts/test-viona-mobile-phase2-travel-final-closure.ts').includes('P2-D final-closure TEST exists')
);
assert('no new token file', !existsSync(path.join(root, 'src/design/vionaNativeClearPremiumTravelTokens.ts')));

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase2-travel-native-clear-premium-composition] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase2-travel-native-clear-premium-composition] OK');
