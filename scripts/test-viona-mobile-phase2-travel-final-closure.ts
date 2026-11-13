/**
 * Phase 2-D — Native Travel final accessibility / regression / Phase 2 closure test-contract.
 * Run: npx tsx scripts/test-viona-mobile-phase2-travel-final-closure.ts
 *
 * Structural assertions only. This file does not prove runtime GREEN by itself.
 * Contract marker: P2-D final-closure TEST exists
 * Contract marker: P2-D final closure TEST exists
 * P2D_ZERO_CODE_MUTATION_FINAL_QA_ONLY — product/runtime presentation files stay read-only.
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
const openingRel = 'src/components/viona/VionaNativeTravelOpeningStage.tsx';
const mapperRel = 'src/navigation/travelPresentationTarget.ts';
const travelRel = 'src/screens/b2c/TravelScreen.tsx';
const tokensRel = 'src/design/vionaNativeClearPremiumTokens.ts';
const miniShellRel = 'src/components/viona/VionaMiniAppShell.tsx';
const topRailRel = 'src/components/viona/VionaGlobalTopRail.tsx';
const glassRel = 'src/components/travel/TravelGlassCard.tsx';
const tileRel = 'src/components/travel/TravelAppTile.tsx';
const fashionRel = 'src/components/viona/fashionHomeDesktopShell.ts';
const phase1Rel = 'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts';
const p2aRel = 'scripts/test-viona-mobile-phase2-travel-native-presentation-isolation.ts';
const p2bRel = 'scripts/test-viona-mobile-phase2-travel-native-clear-premium-composition.ts';
const p2cRel = 'scripts/test-viona-mobile-phase2-travel-native-responsive-refinement.ts';
const p2dRel = 'scripts/test-viona-mobile-phase2-travel-final-closure.ts';

assert('P2-A isolation test exists', existsSync(path.join(root, p2aRel)));
assert('P2-B composition test exists', existsSync(path.join(root, p2bRel)));
assert('P2-C responsive test exists', existsSync(path.join(root, p2cRel)));
assert('P2-D final-closure TEST exists', existsSync(path.join(root, p2dRel)));
assert('P2-A mapper exists', existsSync(path.join(root, mapperRel)));
assert('P2-A opening stage exists', existsSync(path.join(root, openingRel)));
assert('P2-B composition exists', existsSync(path.join(root, compositionRel)));
assert('P2-B context strip exists', existsSync(path.join(root, contextRel)));
assert('P2-B flagship exists', existsSync(path.join(root, flagshipRel)));
assert('P2-B utility exists', existsSync(path.join(root, utilityRel)));
assert('P2-B secondary exists', existsSync(path.join(root, secondaryRel)));

const composition = read(compositionRel);
const context = read(contextRel);
const flagship = read(flagshipRel);
const utility = read(utilityRel);
const secondary = read(secondaryRel);
const opening = read(openingRel);
const mapper = read(mapperRel);
const travel = read(travelRel);
const tokens = read(tokensRel);
const miniShell = read(miniShellRel);
const topRail = read(topRailRel);
const glass = read(glassRel);
const tile = read(tileRel);
const fashion = read(fashionRel);
const phase1 = read(phase1Rel);
const p2b = read(p2bRel);
const p2c = read(p2cRel);
const p2d = read(p2dRel);
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const sosVisibility = read('src/navigation/vionaGlobalSosShellVisibility.ts');
const appRoot = read('App.tsx');

assert(
  'P2-A isolation still exists (mapper + opening stage)',
  mapper.includes('resolveTravelPresentationTarget') &&
    opening.includes('viona-native-travel-opening-stage') &&
    opening.includes('{children}')
);
assert(
  'P2-B composition still exists',
  composition.includes('viona-native-travel-clear-premium-composition') &&
    travel.includes('VionaNativeTravelClearPremiumComposition')
);
assert(
  'P2-C responsive architecture still exists',
  composition.includes('onLayout') &&
    composition.includes('resolveNativeTravelFlagshipFourAcross') &&
    composition.includes('contentWidth < required')
);
assert(
  'P2-D test-contract exists and does not fake runtime GREEN',
  p2d.includes('P2-D final-closure TEST exists') &&
    p2d.includes('Structural assertions only') &&
    !p2d.includes(['VIONA_PHASE2_TRAVEL_OVERALL', '_GREEN = true'].join(''))
);

assert('TravelScreen remains domain owner of airport', travel.includes("id: 'airport'"));
assert('TravelScreen remains domain owner of translation', travel.includes("id: 'translation'"));
assert('TravelScreen remains domain owner of taxi', travel.includes("id: 'taxi'"));
assert('TravelScreen remains domain owner of emergency', travel.includes("id: 'emergency'"));
assert('TravelScreen remains domain owner of transit', travel.includes("id: 'transit'"));
assert('TravelScreen remains domain owner of hotel', travel.includes("id: 'hotel'"));
assert('TravelScreen remains domain owner of restaurant', travel.includes("id: 'restaurant'"));
assert('TravelScreen remains domain owner of shopping', travel.includes("id: 'shopping'"));
assert('TravelScreen remains domain owner of hospital', travel.includes("id: 'hospital'"));
assert('TravelScreen still owns LocalFixer', travel.includes("'LocalFixer'"));
assert('TravelScreen still owns destinationQuery', travel.includes('destinationQuery'));
assert('TravelScreen still owns openMiniApp', travel.includes('openMiniApp'));
assert('TravelScreen still owns Leona entry', travel.includes("'b2cAiCallAssistant'"));
assert('TravelScreen still owns Interpreter / Minh Khang entry', travel.includes("'minhKhangTranslator'"));
assert('TravelScreen still owns SOS hold-gate', travel.includes('VionaSosHoldGateModal'));
assert('TravelScreen still owns consent / location gate', travel.includes('setTravelLocationConsent'));
assert('composition is presentation-only (no navigate)', !composition.includes('navigate('));
assert('context strip does not fetch', !context.includes('getTravelContext') && !context.includes('fetch('));

assert('OpeningStage remains thin children host', opening.includes('{children}') && !opening.includes('ClearPremium'));
assert(
  'OpeningStage still does not import native-travel',
  !opening.includes("from './native-travel") && !opening.includes("from '../native-travel")
);
assert('mapper has no react-native View', !mapper.includes("from 'react-native'"));
assert(
  'android stays native-adaptive',
  resolveTravelPresentationTarget({ platform: 'android', windowWidth: 1280 }) === 'native-adaptive'
);
assert(
  'web-adaptive mapping unchanged',
  resolveTravelPresentationTarget({ platform: 'web', windowWidth: 768 }) === 'web-adaptive'
);
assert(
  'web-desktop mapping unchanged',
  resolveTravelPresentationTarget({ platform: 'web', windowWidth: 1280 }) === 'web-desktop'
);
assert(
  'native composition mounts only on native-adaptive',
  travel.includes("travelPresentationTarget === 'native-adaptive'") &&
    travel.includes('VionaNativeTravelClearPremiumComposition')
);
assert('Web Travel still uses TravelGlassCard', travel.includes('<TravelGlassCard'));
assert('Web Travel still imports fashionHomeDesktopShell helpers', travel.includes('fashionHomeDesktopShell'));
assert('TravelGlassCard source still present', glass.includes('TravelGlassCard'));
assert('TravelAppTile source still present', tile.includes('export function TravelAppTile'));
assert('Fashion desktop shell source still present', fashion.includes('FASHION_HOME_DESKTOP_HERO_ASPECT'));
assert(
  'no native-travel import leaked into TravelGlassCard',
  !glass.includes('native-travel') && !tile.includes('native-travel')
);

assert('flagship includes airport', flagship.includes("'airport'"));
assert('flagship includes translation', flagship.includes("'translation'"));
assert('flagship includes taxi', flagship.includes("'taxi'"));
assert('flagship includes emergency', flagship.includes("'emergency'"));
assert('utility includes transit', utility.includes("'transit'"));
assert('utility includes hotel', utility.includes("'hotel'"));
assert('utility includes restaurant', utility.includes("'restaurant'"));
assert('utility includes shopping', utility.includes("'shopping'"));
assert('utility includes hospital', utility.includes("'hospital'"));
assert('utility Move grouping preserved', utility.includes("'airport'") && utility.includes("'taxi'") && utility.includes("'transit'"));
assert('secondary includes LocalFixer callback prop', secondary.includes('onOpenLocalFixer'));
assert('secondary includes embassy-capable discovery previews', secondary.includes('discoveryPreviews'));
assert('secondary includes connected items', secondary.includes('connectedItems'));
assert('secondary includes gated items', secondary.includes('gatedItems'));
assert('secondary includes Travel Lens', secondary.includes('lensItems'));

assert('B2C Home tab unchanged', mainTab.includes('MAIN_TAB.B2C.home'));
assert('B2C Local tab unchanged', mainTab.includes('MAIN_TAB.B2C.local'));
assert('B2C Travel tab unchanged', mainTab.includes('MAIN_TAB.B2C.travel') && routes.includes('B2C'));
assert('B2C Academy tab unchanged', mainTab.includes('MAIN_TAB.B2C.ai'));
assert('MAIN_TAB.B2C.home constant still exported', Boolean(MAIN_TAB.B2C.home));
assert('Account chrome still PersonalHub', mainTab.includes('openPersonalHub'));
assert('MiniAppShell still forwards Account chrome', miniShell.includes('onPressAccount') && miniShell.includes('chrome.openAccount'));
assert('MainTabNavigator still mounts canonical SOSModal', mainTab.includes("from '../screens/b2c/SOSModal'"));
assert('Travel does not mount tab-bar SOS', sosVisibility.includes('MAIN_TAB.B2C.travel') && sosVisibility.includes('return false'));
assert('SOS hold remains 3000', sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000'));
assert('Travel emergency remains existing safety callback', travel.includes('openTravelSosEntry'));
assert('mapper has no AI provider', !mapper.includes('openai') && !mapper.includes('anthropic'));
assert('composition has no AI provider', !composition.includes('openai') && !composition.includes('anthropic'));
assert('no new token file', !existsSync(path.join(root, 'src/design/vionaNativeClearPremiumTravelTokens.ts')));
assert('existing native tokens remain the token source', tokens.includes('accent') && tokens.includes('travel'));
assert('App.tsx native portrait cap remains 600', appRoot.includes('maxWidth: isLargeScreen || nativeLandscapeFullBleed ?') && appRoot.includes('600'));

assert(
  'R01 policy: compact/shortTile uses intentional single-line truncation',
  flagship.includes('numberOfLines={compact || shortTile ? 1 : 2}')
);
assert(
  'R01 policy: flagship still requires accessibilityLabel on pressable',
  flagship.includes('accessibilityRole="button"') && flagship.includes('accessibilityLabel={item.accessibilityLabel}')
);
assert(
  'R01 policy: TravelScreen supplies full scenario title as accessibilityLabel',
  travel.includes('accessibilityLabel: t(`travelHub.scenario.${id}.title`)')
);
assert(
  'R02 policy: Account remain shell-owned (MiniAppShell + GlobalTopRail)',
  miniShell.includes('VionaGlobalTopRail') && topRail.includes('onPressAccount')
);
assert(
  'R02 policy: GlobalTopRail Account chip remains tappable Pressable',
  topRail.includes('onPress={onPressAccount}')
);
assert(
  'Phase 2 closure requires zero unresolved HIGH Travel-owned blockers (policy in test-contract)',
  p2d.includes('zero unresolved HIGH Travel-owned blockers')
);

assert('composition/runtime do not claim P2-D GREEN', !composition.includes('P2-D') && !travel.includes('P2-D'));
assert(
  'composition does not claim Phase 2 overall GREEN',
  !composition.includes('VIONA_PHASE2_TRAVEL_OVERALL_GREEN') && !composition.includes('VIONA_PHASE2_COMPLETE')
);
assert(
  'P2-C test does not claim Phase 2 overall completion',
  !p2c.includes('VIONA_PHASE2_TRAVEL_OVERALL_GREEN') && p2c.includes('P2-D final closure TEST exists')
);
assert(
  'P2-B test records P2-D final-closure TEST exists',
  p2b.includes('P2-D final-closure TEST exists') && p2b.includes('P2-D not claimed GREEN')
);
assert(
  'Phase 1 descendant names PHASE2_D_TRAVEL_FINAL_CLOSURE_DESCENDANT_ALLOWED',
  phase1.includes('PHASE2_D_TRAVEL_FINAL_CLOSURE_DESCENDANT_ALLOWED')
);
assert('Phase 1 descendant includes P2-D test', phase1.includes(p2dRel));
assert('hit-target token remains 44', tokens.includes('min: 44'));
assert('reduceMotion still participates in composition', composition.includes('reduceMotion={layout.reduceMotion}'));
assert('TravelScreen still wires reduceMotion into native layout', travel.includes('reduceMotion: nativeTravelReduceMotion'));

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase2-travel-final-closure] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase2-travel-final-closure] OK');
console.log('[note] source assertions do not prove TalkBack / four-matrix / Phase 2 runtime GREEN');
console.log('[note] zero unresolved HIGH Travel-owned blockers is a runtime closure gate, not a source-string proof');
