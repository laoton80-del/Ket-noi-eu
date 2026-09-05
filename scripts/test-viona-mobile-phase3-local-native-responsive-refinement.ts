/**
 * Phase 3-C — Native Local four-matrix responsive refinement.
 * Run: npx tsx scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts
 *
 * Structural assertions only. SOURCE ASSERTIONS DO NOT PROVE VISUAL GREEN.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LOCAL_WEB_DESKTOP_WIDTH_EXCLUSIVE,
  resolveLocalPresentationTarget,
} from '../src/navigation/localPresentationTarget';
import { MAIN_TAB } from '../src/navigation/routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

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

const P3D_EXACT_PATHS = new Set([
  'scripts/test-viona-mobile-phase3-local-final-closure.ts',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
  'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts',
  'scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts',
  'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts',
]);

const P4A_EXACT_PATHS = new Set([
  'src/components/viona/VionaShellAccountLanguageActions.tsx',
  'scripts/test-viona-mobile-phase4-account-chrome-isolation.ts',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
]);

const P4B1_EXACT_PATHS = new Set([
  'src/navigation/accountPresentationTarget.ts',
  'src/components/viona/VionaNativeAccountOpeningStage.tsx',
  'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts',
  'src/screens/CaNhanScreen.tsx',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
]);

const P4B2_EXACT_PATHS = new Set([
  'src/components/viona/native-account/VionaNativeAccountClearPremiumComposition.tsx',
  'scripts/test-viona-mobile-phase4-account-personalhub-composition.ts',
  'src/screens/CaNhanScreen.tsx',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
  'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts',
]);

const P3A_IMPLEMENTATION_HEAD = 'b873ad2303045207f0db846652dfaaa07b2d88e2';
const P3A_IMPLEMENTATION_PARENT = 'e2f07013424ece9a714f972805bf78fe99a0cca8';

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

/** Same 148/8 fitting contract as composition. Evaluated here; not a visual GREEN claim. */
function expectedColumns(contentWidth: number): 1 | 2 | 3 | 4 {
  if (contentWidth <= 0) return 2;
  if (contentWidth >= 616) return 4;
  if (contentWidth >= 460) return 3;
  if (contentWidth >= 304) return 2;
  return 1;
}

function expectedCompactLandscape(contentWidth: number, isLandscape: boolean): boolean {
  if (!isLandscape) return false;
  if (contentWidth <= 0) return true;
  return contentWidth < 900;
}

const compositionRel = 'src/components/viona/native-local/VionaNativeLocalClearPremiumComposition.tsx';
const contextRel = 'src/components/viona/native-local/VionaNativeLocalContextHero.tsx';
const flagshipRel = 'src/components/viona/native-local/VionaNativeLocalFlagshipActions.tsx';
const utilityRel = 'src/components/viona/native-local/VionaNativeLocalUtilityActions.tsx';
const secondaryRel = 'src/components/viona/native-local/VionaNativeLocalSecondaryStack.tsx';
const phase1Rel = 'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts';
const p3bRel = 'scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts';
const p3aRel = 'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts';
const p3cRel = 'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts';

assert('P3-C responsive composition exists', existsSync(path.join(root, compositionRel)));
assert('P3-C context hero exists', existsSync(path.join(root, contextRel)));
assert('P3-C flagship actions exist', existsSync(path.join(root, flagshipRel)));
assert('P3-C utility actions exist', existsSync(path.join(root, utilityRel)));
assert('P3-C secondary stack exists', existsSync(path.join(root, secondaryRel)));
assert('P3-C targeted test exists', existsSync(path.join(root, p3cRel)));

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
const appRoot = read('App.tsx');
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const sosHold = read('src/components/viona/VionaSosHoldButton.tsx');
const sosVisibility = read('src/navigation/vionaGlobalSosShellVisibility.ts');
const phase1 = read(phase1Rel);
const p3b = read(p3bRel);
const isolation = read(p3aRel);
const p3c = read(p3cRel);
const changed = mutationPaths();
const frozenP3a = gitLines(['diff', '--name-only', P3A_IMPLEMENTATION_PARENT, P3A_IMPLEMENTATION_HEAD]);

assert('content-width measurement participates (onLayout)', composition.includes('onLayout'));
assert('content-width state participates', composition.includes('contentWidth'));
assert(
  'measure host testID present',
  composition.includes('viona-native-local-clear-premium-measure')
);
assert('grid resolver exists', composition.includes('resolveNativeLocalGridColumns'));
assert('compact landscape resolver exists', composition.includes('resolveNativeLocalCompactLandscape'));
assert('tileWidth helper exists', composition.includes('tileWidthForNativeLocalColumns'));
assert('min tile width 148 is canonical', composition.includes('LOCAL_NATIVE_MIN_TILE_WIDTH = 148'));
assert('gap 8 is canonical', composition.includes('LOCAL_NATIVE_TILE_GAP') && composition.includes('tkn.spacing[8]'));
assert('2-col threshold 304', composition.includes('LOCAL_NATIVE_TWO_COL_MIN_WIDTH = 304'));
assert('3-col threshold 460', composition.includes('LOCAL_NATIVE_THREE_COL_MIN_WIDTH = 460'));
assert('4-col threshold 616', composition.includes('LOCAL_NATIVE_FOUR_COL_MIN_WIDTH = 616'));
assert(
  "mode==='tablet' alone is NOT sufficient for columns",
  !composition.includes("columns = layout.mode === 'tablet'") &&
    !composition.includes("layout.mode === 'tablet' || layout.isLandscape") &&
    composition.includes('contentWidth >= LOCAL_NATIVE_FOUR_COL_MIN_WIDTH')
);
assert(
  'landscape compact is not mobile&&landscape only',
  !composition.includes("compact = layout.mode === 'mobile' && layout.isLandscape") &&
    composition.includes('resolveNativeLocalCompactLandscape(contentWidth, layout.isLandscape)')
);
assert('PHONE PORTRAIT matrix named', composition.includes('PHONE PORTRAIT'));
assert('PHONE LANDSCAPE matrix named', composition.includes('PHONE LANDSCAPE'));
assert('TABLET PORTRAIT matrix named', composition.includes('TABLET PORTRAIT'));
assert('TABLET LANDSCAPE matrix named', composition.includes('TABLET LANDSCAPE'));
assert('no inner ScrollView in composition', !composition.includes('ScrollView'));
assert('flagship uses measured tile width', flagship.includes('tileWidth'));
assert('utility uses measured tile width', utility.includes('tileWidth'));
assert('flagship columns testID is branchable', flagship.includes('viona-native-local-flagship-actions-cols-'));
assert('utility columns testID is branchable', utility.includes('viona-native-local-utility-actions-cols-'));
assert('context hero image height is branchable', context.includes('imageHeight'));
assert('context hero compact padding is branchable', context.includes('copyCompact'));
assert('secondary optional wide pair exists', secondary.includes('widePair'));
assert('secondary still has no VIP spend', !secondary.includes('reserveAndCommitCredits'));

assert('1-col below 148', expectedColumns(147) === 1);
assert('1-col between 148 and 303', expectedColumns(148) === 1 && expectedColumns(303) === 1);
assert('2-col at 304', expectedColumns(304) === 2);
assert('2-col below 460', expectedColumns(459) === 2);
assert('3-col at 460', expectedColumns(460) === 3);
assert('3-col below 616', expectedColumns(615) === 3);
assert('4-col at 616', expectedColumns(616) === 4);
assert(
  'PHONE PORTRAIT typical rail 366 → 2 columns',
  expectedColumns(366) === 2 && expectedCompactLandscape(366, false) === false
);
assert(
  'PHONE LANDSCAPE typical rail 820 → 4 columns + compact',
  expectedColumns(820) === 4 && expectedCompactLandscape(820, true) === true
);
assert(
  'TABLET PORTRAIT typical rail 744 → 4 columns, not compact',
  expectedColumns(744) === 4 && expectedCompactLandscape(744, false) === false
);
assert(
  'TABLET LANDSCAPE typical rail 992 → 4 columns, not maximally compact',
  expectedColumns(992) === 4 && expectedCompactLandscape(992, true) === false
);
assert(
  'phone landscape compact does not require mode===mobile',
  expectedCompactLandscape(820, true) === true
);

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
assert('no legalScan tile invented', !flagship.includes('legalScan') && !utility.includes('legalScan'));
assert('flagship title stays two-line limited', flagship.includes('numberOfLines={2}'));
assert('flagship status stays one-line ellipsis', flagship.includes('numberOfLines={1}'));
assert('utility title stays two-line limited', utility.includes('numberOfLines={2}'));
assert('context hero has no numberOfLines (WRAP_REQUIRED)', !context.includes('numberOfLines'));
assert('context is not a search field', !context.includes('TextInput') && !context.includes('searchQuery'));
assert('composition has no TextInput', !composition.includes('TextInput'));
assert('no fake REAL_SEARCH', !composition.includes('REAL_SEARCH') && !context.includes('REAL_SEARCH'));

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

assert('opening stage remains thin children host', opening.includes('{children}') && opening.includes('viona-native-local-opening-stage'));
assert(
  'opening stage still does not import native-local',
  !opening.includes("from './native-local") && !opening.includes("from '../native-local")
);
assert(
  'LocalScreen mounts composition only on native-adaptive',
  local.includes("localPresentationTarget === 'native-adaptive'") &&
    local.includes('VionaNativeLocalClearPremiumComposition')
);
assert('LocalScreen still mounts LocalOpeningStageLayout for Web', local.includes('<LocalOpeningStageLayout'));
assert(
  'LocalOpeningStageLayout still owns shared hero/cards/quick-actions',
  layout.includes('LocalDynamicHero') && layout.includes('LocalHeroCardsRow') && layout.includes('LocalQuickActionsRow')
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
assert('composition is not an Account host', !composition.includes('PersonalHub') && !composition.includes('openAccountHub'));
assert('mapper has no AI provider', !mapper.includes('openai') && !mapper.includes('anthropic'));
assert('composition has no AI provider', !composition.includes('openai') && !composition.includes('anthropic'));
assert('existing tokens reused without mutation in this lane', tokens.includes("local: '#14B8A6'") && tokens.includes('min: 44'));
assert('no new Local token file', !existsSync(path.join(root, 'src/design/vionaNativeClearPremiumLocalTokens.ts')));
assert(
  'App.tsx native portrait cap remains 600',
  appRoot.includes("maxWidth: isLargeScreen || nativeLandscapeFullBleed ?") && appRoot.includes('600')
);
assert('MAIN_TAB.B2C.home constant still exported', Boolean(MAIN_TAB.B2C.home));
assert(
  'frozen original P3-A five-path range remains',
  frozenP3a.length === 5 && frozenP3a.includes('src/navigation/localPresentationTarget.ts')
);
assert('isolation test still pins original P3-A five-path range', isolation.includes(P3A_IMPLEMENTATION_HEAD));
assert(
  'Phase 1 descendant contract names PHASE3_C_LOCAL_RESPONSIVE_DESCENDANT_ALLOWED',
  phase1.includes('PHASE3_C_LOCAL_RESPONSIVE_DESCENDANT_ALLOWED')
);
assert('Phase 1 descendant includes composition', phase1.includes(compositionRel));
assert('Phase 1 descendant includes P3-C test', phase1.includes(p3cRel));
assert(
  'P3-B test now allows P3-C exact union',
  p3b.includes('P3C_EXACT_PATHS') && p3b.includes(p3cRel)
);
assert(
  'P3-A isolation test now allows P3-C exact union',
  isolation.includes('P3C_EXACT_PATHS') && isolation.includes(p3cRel)
);
assert(
  'P3-D final-closure TEST exists',
  existsSync(path.join(root, 'scripts/test-viona-mobile-phase3-local-final-closure.ts')) &&
    read('scripts/test-viona-mobile-phase3-local-final-closure.ts').includes('P3-D final-closure TEST exists') &&
    !composition.includes('P3-D') &&
    p3c.includes('SOURCE ASSERTIONS DO NOT PROVE VISUAL GREEN')
);
assert(
  'P3-C does not claim visual GREEN from source strings',
  !composition.includes('VIONA_PHASE3_LOCAL_NATIVE_RESPONSIVE_VISUAL_CONFIDENCE_GREEN') &&
    composition.includes('Source assertions do not prove visual GREEN')
);
assert(
  'exact P3-C or exact P3-D or exact P4-A or exact P4-B1 or exact P4-B2 mutable-path contract',
  changed.length > 0 &&
    changed.every(
      (p) =>
        P3C_EXACT_PATHS.has(p) ||
        P3D_EXACT_PATHS.has(p) ||
        P4A_EXACT_PATHS.has(p) ||
        P4B1_EXACT_PATHS.has(p) ||
        P4B2_EXACT_PATHS.has(p)
    )
);
assert('exact nine-path allowlist size', P3C_EXACT_PATHS.size === 9);
assert(
  'no unauthorized path',
  !changed.includes('src/screens/b2c/LocalScreen.tsx') &&
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
  console.error(`\n[test-viona-mobile-phase3-local-native-responsive-refinement] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase3-local-native-responsive-refinement] OK');
console.log('[note] SOURCE ASSERTIONS DO NOT PROVE VISUAL GREEN');
