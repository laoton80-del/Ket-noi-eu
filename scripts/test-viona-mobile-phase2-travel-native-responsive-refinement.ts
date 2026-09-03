/**
 * Phase 2-C — Native Travel four-matrix responsive refinement.
 * Run: npx tsx scripts/test-viona-mobile-phase2-travel-native-responsive-refinement.ts
 *
 * Structural assertions only. This file does not prove visual GREEN by itself.
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
const phase1Rel = 'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts';
const p2bRel = 'scripts/test-viona-mobile-phase2-travel-native-clear-premium-composition.ts';
const p2cRel = 'scripts/test-viona-mobile-phase2-travel-native-responsive-refinement.ts';

assert('P2-C responsive composition exists', existsSync(path.join(root, compositionRel)));
assert('P2-C context strip exists', existsSync(path.join(root, contextRel)));
assert('P2-C flagship actions exist', existsSync(path.join(root, flagshipRel)));
assert('P2-C utility actions exist', existsSync(path.join(root, utilityRel)));
assert('P2-C secondary stack exists', existsSync(path.join(root, secondaryRel)));
assert('P2-C targeted test exists', existsSync(path.join(root, p2cRel)));

const composition = read(compositionRel);
const context = read(contextRel);
const flagship = read(flagshipRel);
const utility = read(utilityRel);
const secondary = read(secondaryRel);
const opening = read('src/components/viona/VionaNativeTravelOpeningStage.tsx');
const travel = read('src/screens/b2c/TravelScreen.tsx');
const mapper = read('src/navigation/travelPresentationTarget.ts');
const tokens = read('src/design/vionaNativeClearPremiumTokens.ts');
const miniShell = read('src/components/viona/VionaMiniAppShell.tsx');
const appRoot = read('App.tsx');
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const sosVisibility = read('src/navigation/vionaGlobalSosShellVisibility.ts');
const phase1 = read(phase1Rel);
const p2b = read(p2bRel);

assert('content-width measurement participates (onLayout)', composition.includes('onLayout'));
assert('content-width state participates', composition.includes('contentWidth'));
assert(
  'measure host testID present',
  composition.includes('viona-native-travel-clear-premium-measure')
);
assert(
  'flagship four-across resolver exists',
  composition.includes('resolveNativeTravelFlagshipFourAcross')
);
assert(
  'utility column resolver exists',
  composition.includes('resolveNativeTravelUtilityColumns')
);
assert(
  "mode==='tablet' alone is NOT sufficient for four-across",
  !composition.includes("fourAcross = layout.isLandscape || layout.mode === 'tablet'") &&
    !composition.includes("layout.mode === 'tablet' || layout.isLandscape") &&
    composition.includes('contentWidth < required')
);
assert('phone/tablet branches exist', composition.includes("layout.mode === 'mobile'") && composition.includes('tabletLandscape'));
assert('landscape handling exists', composition.includes('layout.isLandscape') && composition.includes('compactLandscape'));
assert('deferred weather/FX demo line exists for compact portrait', composition.includes('viona-native-travel-context-demo-deferred'));
assert('context density branches exist', context.includes('compactRow') && context.includes("density === 'wide'"));
assert('flagship compact crop height is branchable', flagship.includes('imageHeight') && flagship.includes('resizeMode="cover"'));
assert('flagship uses measured tile width', flagship.includes('tileWidth'));
assert('utility Move grouping', utility.includes("'airport'") && utility.includes("'taxi'") && utility.includes("'transit'"));
assert('utility Stay grouping', utility.includes("'hotel'"));
assert('utility Help grouping', utility.includes("'restaurant'") && utility.includes("'shopping'") && utility.includes("'hospital'") && utility.includes("'translation'"));
assert('utility group testIDs exist', utility.includes('viona-native-travel-utility-group-move'));
assert('secondary lens crop is branchable', secondary.includes('lensImageHeight') && secondary.includes('resizeMode="cover"'));
assert('secondary uses measured content width', secondary.includes('contentWidth'));

assert('opening stage remains thin children host', opening.includes('{children}') && opening.includes('viona-native-travel-opening-stage'));
assert(
  'opening stage still does not import native-travel',
  !opening.includes("from './native-travel") && !opening.includes("from '../native-travel")
);
assert('opening stage is not Clear Premium composition owner', !opening.includes('ClearPremium'));

assert(
  'android stays native-adaptive',
  resolveTravelPresentationTarget({ platform: 'android', windowWidth: 1280 }) === 'native-adaptive'
);
assert(
  'web desktop mapping unchanged',
  resolveTravelPresentationTarget({ platform: 'web', windowWidth: 1280 }) === 'web-desktop'
);
assert('mapper has no react-native View', !mapper.includes("from 'react-native'"));
assert(
  'TravelScreen mounts composition only on native-adaptive',
  travel.includes("travelPresentationTarget === 'native-adaptive'") &&
    travel.includes('VionaNativeTravelClearPremiumComposition')
);
assert('TravelScreen still owns TravelGlassCard for Web', travel.includes('<TravelGlassCard'));
assert('TravelScreen still imports fashionHomeDesktopShell helpers', travel.includes('fashionHomeDesktopShell'));
assert(
  'Web Travel still uses existing glass/hero presentation path',
  travel.includes('<TravelGlassCard') && travel.includes('travel-dynamic-hero-stage')
);
assert('native MiniAppShell uses existing light surface', travel.includes('surfaceMode="light"'));

assert('TravelScreen still constructs airport', travel.includes("id: 'airport'"));
assert('TravelScreen still constructs translation', travel.includes("id: 'translation'"));
assert('TravelScreen still constructs taxi', travel.includes("id: 'taxi'"));
assert('TravelScreen still constructs emergency', travel.includes("id: 'emergency'"));
assert('TravelScreen still constructs transit', travel.includes("id: 'transit'"));
assert('TravelScreen still constructs hotel', travel.includes("id: 'hotel'"));
assert('TravelScreen still constructs restaurant', travel.includes("id: 'restaurant'"));
assert('TravelScreen still constructs shopping', travel.includes("id: 'shopping'"));
assert('TravelScreen still constructs hospital', travel.includes("id: 'hospital'"));
assert('TravelScreen still owns LocalFixer', travel.includes("'LocalFixer'"));
assert('TravelScreen still owns destinationQuery', travel.includes('destinationQuery'));
assert('TravelScreen still owns openMiniApp', travel.includes('openMiniApp'));
assert('TravelScreen still owns Leona entry', travel.includes("'b2cAiCallAssistant'"));
assert('TravelScreen still owns Interpreter entry', travel.includes("'minhKhangTranslator'"));
assert('flagship includes emergency', flagship.includes("'emergency'"));
assert('secondary includes LocalFixer callback prop', secondary.includes('onOpenLocalFixer'));
assert('secondary includes gated items', secondary.includes('gatedItems'));
assert('secondary includes connected items', secondary.includes('connectedItems'));
assert('secondary includes embassy-capable discovery previews', secondary.includes('discoveryPreviews'));

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
assert('context strip does not fetch', !context.includes('getTravelContext') && !context.includes('fetch('));
assert('no new token file', !existsSync(path.join(root, 'src/design/vionaNativeClearPremiumTravelTokens.ts')));
assert('existing native tokens remain the token source', tokens.includes('accent') && tokens.includes('travel'));
assert('MiniAppShell source untouched by P2-C assertions', miniShell.includes('VionaMiniAppShell'));
assert('App.tsx native portrait cap remains 600', appRoot.includes('maxWidth: isLargeScreen || nativeLandscapeFullBleed ?') && appRoot.includes('600'));
assert('P2-D not claimed in composition', !composition.includes('P2-D'));
assert(
  'P2-C does not claim visual GREEN from source strings',
  !composition.includes('VIONA_PHASE2_TRAVEL_NATIVE_RESPONSIVE_VISUAL_CONFIDENCE_GREEN') &&
    composition.includes('Source assertions do not prove visual GREEN')
);
assert('MAIN_TAB.B2C.home constant still exported', Boolean(MAIN_TAB.B2C.home));

assert(
  'Phase 1 descendant contract names PHASE2_C_TRAVEL_RESPONSIVE_DESCENDANT_ALLOWED',
  phase1.includes('PHASE2_C_TRAVEL_RESPONSIVE_DESCENDANT_ALLOWED')
);
assert('Phase 1 descendant includes composition', phase1.includes(compositionRel));
assert('Phase 1 descendant includes P2-C test', phase1.includes(p2cRel));
assert(
  'P2-B test now asserts P2-C exists native-only',
  p2b.includes('P2-C responsive refinement exists') && p2b.includes('native-only')
);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase2-travel-native-responsive-refinement] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase2-travel-native-responsive-refinement] OK');
console.log('[note] source assertions do not prove four-matrix visual GREEN');
