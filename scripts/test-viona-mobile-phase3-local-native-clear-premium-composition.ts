/**
 * Phase 3-B — Native Local Clear Premium composition.
 * Run: npx tsx scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LOCAL_WEB_DESKTOP_WIDTH_EXCLUSIVE,
  resolveLocalPresentationTarget,
} from '../src/navigation/localPresentationTarget';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const P3B_EXACT_PATHS = new Set([
  'src/components/viona/native-local/VionaNativeLocalClearPremiumComposition.tsx',
  'src/components/viona/native-local/VionaNativeLocalContextHero.tsx',
  'src/components/viona/native-local/VionaNativeLocalFlagshipActions.tsx',
  'src/components/viona/native-local/VionaNativeLocalUtilityActions.tsx',
  'src/components/viona/native-local/VionaNativeLocalSecondaryStack.tsx',
  'scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts',
  'src/screens/b2c/LocalScreen.tsx',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
  'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts',
]);

const P3C_EXACT_PATHS = new Set([
  'src/components/viona/native-local/VionaNativeLocalClearPremiumComposition.tsx',
  'src/components/viona/native-local/VionaNativeLocalContextHero.tsx',
  'src/components/viona/native-local/VionaNativeLocalFlagshipActions.tsx',
  'src/components/viona/native-local/VionaNativeLocalUtilityActions.tsx',
  'src/components/viona/native-local/VionaNativeLocalSecondaryStack.tsx',
  'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
  'scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts',
  'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts',
]);

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

function gitLines(args: readonly string[]): string[] {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true })
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, '/'))
    .filter(Boolean);
}

function mutationPaths(): string[] {
  const live = [
    ...gitLines(['diff', '--name-only']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ];
  const uniqueLive = [...new Set(live)];
  if (uniqueLive.length > 0) return uniqueLive;
  return gitLines(['diff', '--name-only', 'HEAD^', 'HEAD']);
}

const compositionRel = 'src/components/viona/native-local/VionaNativeLocalClearPremiumComposition.tsx';
const contextRel = 'src/components/viona/native-local/VionaNativeLocalContextHero.tsx';
const flagshipRel = 'src/components/viona/native-local/VionaNativeLocalFlagshipActions.tsx';
const utilityRel = 'src/components/viona/native-local/VionaNativeLocalUtilityActions.tsx';
const secondaryRel = 'src/components/viona/native-local/VionaNativeLocalSecondaryStack.tsx';

assert('native Clear Premium composition exists', existsSync(path.join(root, compositionRel)));
assert('native context hero exists', existsSync(path.join(root, contextRel)));
assert('native flagship actions exist', existsSync(path.join(root, flagshipRel)));
assert('native utility actions exist', existsSync(path.join(root, utilityRel)));
assert('native secondary stack exists', existsSync(path.join(root, secondaryRel)));

const composition = read(compositionRel);
const context = read(contextRel);
const flagship = read(flagshipRel);
const utility = read(utilityRel);
const secondary = read(secondaryRel);
const opening = read('src/components/viona/VionaNativeLocalOpeningStage.tsx');
const layout = read('src/components/viona/local/LocalOpeningStageLayout.tsx');
const local = read('src/screens/b2c/LocalScreen.tsx');
const mapper = read('src/navigation/localPresentationTarget.ts');
const tokens = read('src/design/vionaNativeClearPremiumTokens.ts');
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const sosHold = read('src/components/viona/VionaSosHoldButton.tsx');
const sosVisibility = read('src/navigation/vionaGlobalSosShellVisibility.ts');
const phase1 = read('scripts/test-viona-mobile-phase1-clear-premium-native-home.ts');
const isolation = read('scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts');
const changed = mutationPaths();

assert(
  'composition testID present',
  composition.includes('viona-native-local-clear-premium-composition')
);
assert('context hero is not a search field', !context.includes('TextInput') && !context.includes('searchQuery'));
assert('composition is presentation-only (no navigate)', !composition.includes('navigate('));
assert('context does not fetch', !context.includes('fetch('));
assert('flagship includes myRequests', flagship.includes("'myRequests'"));
assert('flagship includes bookingAssist', flagship.includes("'bookingAssist'"));
assert('flagship includes legalWealth', flagship.includes("'legalWealth'"));
assert('flagship includes browseServices', flagship.includes("'browseServices'"));
assert('utility includes restaurants', utility.includes("'restaurants'"));
assert('utility includes transit', utility.includes("'transit'"));
assert('utility includes rentals', utility.includes("'rentals'"));
assert('utility includes classifieds', utility.includes("'classifieds'"));
assert('utility includes nails', utility.includes("'nails'"));
assert('utility includes community', utility.includes("'community'"));
assert('utility includes aiReceptionist', utility.includes("'aiReceptionist'"));
assert('utility includes language', utility.includes("'language'"));
assert('secondary includes classified preview props', secondary.includes('classifiedPreviews'));
assert('secondary includes merchant items', secondary.includes('merchantItems'));
assert('secondary includes connected items', secondary.includes('connectedItems'));
assert('secondary does not own VIP spend', !secondary.includes('reserveAndCommitCredits'));
assert('composition does not own VIP spend', !composition.includes('reserveAndCommitCredits'));
assert('no fake REAL_SEARCH in native-local', !composition.includes('REAL_SEARCH') && !context.includes('REAL_SEARCH'));

assert(
  'ios stays native-adaptive',
  resolveLocalPresentationTarget({ platform: 'ios', windowWidth: 390 }) === 'native-adaptive'
);
assert(
  'android tablet stays native-adaptive',
  resolveLocalPresentationTarget({ platform: 'android', windowWidth: 1280 }) === 'native-adaptive'
);
assert(
  'web desktop mapping unchanged',
  resolveLocalPresentationTarget({
    platform: 'web',
    windowWidth: LOCAL_WEB_DESKTOP_WIDTH_EXCLUSIVE + 1,
  }) === 'web-desktop'
);

assert(
  'LocalScreen mounts composition only on native-adaptive',
  local.includes("localPresentationTarget === 'native-adaptive'") &&
    local.includes('VionaNativeLocalClearPremiumComposition')
);
assert('LocalScreen still mounts LocalOpeningStageLayout for Web', local.includes('<LocalOpeningStageLayout'));
assert('LocalOpeningStageLayout still owns shared hero/cards/quick-actions', layout.includes('LocalDynamicHero') && layout.includes('LocalHeroCardsRow') && layout.includes('LocalQuickActionsRow'));
assert('opening stage remains thin children host', opening.includes('{children}') && opening.includes('viona-native-local-opening-stage'));
assert(
  'opening stage does not import native-local',
  !opening.includes("from './native-local") && !opening.includes("from '../native-local")
);
assert('P3-A resolver still imported by LocalScreen', local.includes('resolveLocalPresentationTarget'));
assert('LocalScreen still owns requests', local.includes("navigate('LocalUserRequestStatus')"));
assert('LocalScreen still owns classifieds composer', local.includes('setComposerVisible') && local.includes('submitPost'));
assert('LocalScreen still owns VIP 120 VIG', local.includes('VIP_POSTING_COST_VIG = 120') && local.includes('reserveAndCommitCredits'));
assert('LocalScreen still owns legal/demo booking', local.includes('runUltraMasterBookingWithAlerts'));
assert('LocalScreen still owns merchant callbacks', local.includes('openBusinessUniverse'));
assert('LocalScreen still owns connected universes', local.includes('openTravelUniverse') && local.includes('openAcademyUniverse'));
assert('LocalScreen still owns Account PersonalHub', local.includes('PersonalHub') && local.includes('openAccountHub'));
assert('LocalScreen still owns SOS hold-gate', local.includes('VionaSosHoldGateModal') && local.includes('openSafetyAssist'));
assert('LocalScreen still has latent legal scan handlers', local.includes('onLegalScannerPress'));
assert('native composition does not fake legal scan tile', !flagship.includes('legalScan') && !utility.includes('legalScan'));
assert('no LocalFixer claimed as Local capability', !local.includes('LocalFixer') && !composition.includes('LocalFixer'));
assert('NO_FUNCTION_REMOVAL DailyReward', local.includes("navigate('DailyReward')"));
assert('NO_FUNCTION_REMOVAL AI receptionist demo', local.includes("'AiReceptionistDemoSimulator'"));
assert('NO_FUNCTION_REMOVAL browse TabLocal', local.includes("openMiniApp('local'") && local.includes("'TabLocal'"));
assert('native Local still does not hide the four-tab bar', local.includes("if (Platform.OS !== 'web')") && local.includes('LOCAL_HIDDEN_TAB_BAR_STYLE'));

assert('B2C Home tab unchanged', mainTab.includes('MAIN_TAB.B2C.home'));
assert('B2C Local tab unchanged', mainTab.includes('MAIN_TAB.B2C.local') && mainTab.includes("'Local'"));
assert('B2C Travel tab unchanged', mainTab.includes('MAIN_TAB.B2C.travel') && routes.includes('B2C'));
assert('B2C Academy tab unchanged', mainTab.includes('MAIN_TAB.B2C.ai'));
assert('Account chrome still PersonalHub', mainTab.includes('openPersonalHub'));
assert('MainTabNavigator still mounts canonical SOSModal', mainTab.includes("from '../screens/b2c/SOSModal'"));
assert('Local does not mount tab-bar SOS', sosVisibility.includes('MAIN_TAB.B2C.local') && sosVisibility.includes('return false'));
assert('SOS hold remains 3000', sosHold.includes('DEFAULT_HOLD_MS = 3000') || sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000'));
assert('composition is not a second SOS host', !composition.includes('SOSModal') && !composition.includes('triggerSafetyAssist'));
assert('mapper has no AI provider', !mapper.includes('openai') && !mapper.includes('anthropic'));
assert('composition has no AI provider', !composition.includes('openai') && !composition.includes('anthropic'));
assert('existing tokens reused without a Local token file', tokens.includes("local: '#14B8A6'") && tokens.includes('min: 44'));
assert('no new Local token file', !existsSync(path.join(root, 'src/design/vionaNativeClearPremiumLocalTokens.ts')));
assert('hit target token remains 44', composition.includes('vionaNativeClearPremiumTokens') || flagship.includes('vionaNativeClearPremiumTokens'));
assert(
  'Phase 1 descendant guard names exact P3-B set',
  phase1.includes('PHASE3_B_LOCAL_COMPOSITION_DESCENDANT_ALLOWED') &&
    phase1.includes('src/components/viona/native-local/VionaNativeLocalClearPremiumComposition.tsx')
);
assert(
  'P3-A isolation test no longer forbids native-local composition',
  !isolation.includes('P3-B native-local composition is not introduced')
);
assert('isolation test still pins original P3-A five-path range', isolation.includes('b873ad2303045207f0db846652dfaaa07b2d88e2'));

assert(
  'P3-C responsive refinement exists native-only',
  existsSync(path.join(root, 'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts')) &&
    composition.includes('onLayout') &&
    local.includes("localPresentationTarget === 'native-adaptive'")
);
assert(
  'exact P3-B or exact P3-C mutable-path contract',
  changed.length > 0 && changed.every((p) => P3B_EXACT_PATHS.has(p) || P3C_EXACT_PATHS.has(p))
);
assert(
  'no unauthorized path',
  !changed.includes('src/navigation/localPresentationTarget.ts') &&
    !changed.includes('src/components/viona/VionaNativeLocalOpeningStage.tsx') &&
    !changed.includes('src/components/viona/local/LocalOpeningStageLayout.tsx') &&
    !changed.includes('src/design/vionaNativeClearPremiumTokens.ts') &&
    !changed.includes('App.tsx') &&
    !changed.includes('src/navigation/MainTabNavigator.tsx') &&
    !changed.includes('package.json')
);
assert(
  'no token/asset mutation',
  !changed.includes('src/design/vionaNativeClearPremiumTokens.ts') &&
    !changed.some((p) => p.startsWith('assets/') || p.startsWith('src/assets/'))
);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase3-local-native-clear-premium-composition] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase3-local-native-clear-premium-composition] OK');
