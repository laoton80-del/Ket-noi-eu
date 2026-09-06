/**
 * Phase 3-D — Native Local final accessibility / regression / Phase 3 closure test-contract.
 * Run: npx tsx scripts/test-viona-mobile-phase3-local-final-closure.ts
 *
 * Structural assertions only. This file does not prove runtime GREEN by itself.
 * Contract marker: P3-D final-closure TEST exists
 * Contract marker: P3-D final closure TEST exists
 * P3D_PRODUCT_SOURCE_MUTATION_NOT_REQUIRED — product/runtime presentation files stay read-only.
 * SOURCE_AND_REUSED_VISUAL_EVIDENCE_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION
 * P3D_P3C_RUNTIME_EVIDENCE_REUSABLE_IF_LAYOUT_UNCHANGED
 * zero unresolved HIGH P3-D-owned blockers is a runtime/closure gate, not a source-string proof.
 *
 * Residual classifications (not unexplained):
 * P3C-V01..V06 CLOSED_GREEN
 * P3C-V07 ACCEPTABLE_INTENTIONAL
 * P3C-V08 ACCEPTABLE_INTENTIONAL
 * P3C-V09 OUT_OF_SCOPE GLOBAL_SHELL / PHASE 4
 * P3C-V10 CLOSED_GREEN
 * tablet portrait 2-column ACCEPTABLE_INTENTIONAL
 * status/title ellipsis with full accessibilityLabel ACCEPTABLE_INTENTIONAL
 * P3D-A05 / P3D-A08 DEFERRED_WITH_OWNER / DOMAIN_OUT_OF_SCOPE
 * P3D-A13 OS_RUNTIME_ONLY
 * P3D-A14 OS_RUNTIME_ONLY
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

/** Exact P4-C Account four-matrix responsive descendant. No glob. */
const P4C_EXACT_PATHS = new Set([
  'src/components/viona/native-account/VionaNativeAccountClearPremiumComposition.tsx',
  'scripts/test-viona-mobile-phase4-account-responsive-refinement.ts',
  'scripts/test-viona-mobile-phase4-account-personalhub-composition.ts',
  'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts',
  'scripts/test-viona-mobile-phase4-account-chrome-isolation.ts',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
  'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts',
  'scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts',
  'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts',
  'scripts/test-viona-mobile-phase3-local-final-closure.ts',
]);

/** Exact P4-D Account final-closure descendant. Tests only. No glob. No product/runtime mutation. */
const P4D_EXACT_PATHS = new Set([
  'scripts/test-viona-mobile-phase4-account-final-closure.ts',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
  'scripts/test-viona-mobile-phase4-account-chrome-isolation.ts',
  'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts',
  'scripts/test-viona-mobile-phase4-account-personalhub-composition.ts',
  'scripts/test-viona-mobile-phase4-account-responsive-refinement.ts',
  'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts',
  'scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts',
  'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts',
  'scripts/test-viona-mobile-phase3-local-final-closure.ts',
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

const compositionRel = 'src/components/viona/native-local/VionaNativeLocalClearPremiumComposition.tsx';
const contextRel = 'src/components/viona/native-local/VionaNativeLocalContextHero.tsx';
const flagshipRel = 'src/components/viona/native-local/VionaNativeLocalFlagshipActions.tsx';
const utilityRel = 'src/components/viona/native-local/VionaNativeLocalUtilityActions.tsx';
const secondaryRel = 'src/components/viona/native-local/VionaNativeLocalSecondaryStack.tsx';
const openingRel = 'src/components/viona/VionaNativeLocalOpeningStage.tsx';
const mapperRel = 'src/navigation/localPresentationTarget.ts';
const localRel = 'src/screens/b2c/LocalScreen.tsx';
const layoutRel = 'src/components/viona/local/LocalOpeningStageLayout.tsx';
const tokensRel = 'src/design/vionaNativeClearPremiumTokens.ts';
const phase1Rel = 'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts';
const p3aRel = 'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts';
const p3bRel = 'scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts';
const p3cRel = 'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts';
const p3dRel = 'scripts/test-viona-mobile-phase3-local-final-closure.ts';

assert('P3-A isolation test exists', existsSync(path.join(root, p3aRel)));
assert('P3-B composition test exists', existsSync(path.join(root, p3bRel)));
assert('P3-C responsive test exists', existsSync(path.join(root, p3cRel)));
assert('P3-D final-closure TEST exists', existsSync(path.join(root, p3dRel)));
assert('P3-A mapper exists', existsSync(path.join(root, mapperRel)));
assert('P3-A opening stage exists', existsSync(path.join(root, openingRel)));
assert('P3-B composition exists', existsSync(path.join(root, compositionRel)));
assert('P3-B context hero exists', existsSync(path.join(root, contextRel)));
assert('P3-B flagship exists', existsSync(path.join(root, flagshipRel)));
assert('P3-B utility exists', existsSync(path.join(root, utilityRel)));
assert('P3-B secondary exists', existsSync(path.join(root, secondaryRel)));

const composition = read(compositionRel);
const context = read(contextRel);
const flagship = read(flagshipRel);
const utility = read(utilityRel);
const secondary = read(secondaryRel);
const opening = read(openingRel);
const mapper = read(mapperRel);
const local = read(localRel);
const layout = read(layoutRel);
const tokens = read(tokensRel);
const phase1 = read(phase1Rel);
const p3a = read(p3aRel);
const p3b = read(p3bRel);
const p3c = read(p3cRel);
const p3d = read(p3dRel);
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const sosHold = read('src/components/viona/VionaSosHoldButton.tsx');
const sosVisibility = read('src/navigation/vionaGlobalSosShellVisibility.ts');
const appRoot = read('App.tsx');
const changed = mutationPaths();
const frozenP3a = gitLines(['diff', '--name-only', P3A_IMPLEMENTATION_PARENT, P3A_IMPLEMENTATION_HEAD]);

assert(
  'P3-A isolation still exists (mapper + opening stage)',
  mapper.includes('resolveLocalPresentationTarget') &&
    opening.includes('viona-native-local-opening-stage') &&
    opening.includes('{children}')
);
assert(
  'P3-B composition still exists',
  composition.includes('viona-native-local-clear-premium-composition') &&
    local.includes('VionaNativeLocalClearPremiumComposition')
);
assert(
  'P3-C responsive architecture still exists',
  composition.includes('onLayout') &&
    composition.includes('resolveNativeLocalGridColumns') &&
    composition.includes('LOCAL_NATIVE_MIN_TILE_WIDTH = 148') &&
    composition.includes('LOCAL_NATIVE_TWO_COL_MIN_WIDTH = 304') &&
    composition.includes('LOCAL_NATIVE_THREE_COL_MIN_WIDTH = 460') &&
    composition.includes('LOCAL_NATIVE_FOUR_COL_MIN_WIDTH = 616')
);
assert(
  'P3-D test-contract exists and does not fake runtime GREEN',
  p3d.includes('P3-D final-closure TEST exists') &&
    p3d.includes('Structural assertions only') &&
    !p3d.includes(['VIONA_PHASE3_LOCAL_OVERALL', '_GREEN = true'].join(''))
);
assert(
  'P3-D does not fake formal a11y certification strings',
  p3d.includes('SOURCE_AND_REUSED_VISUAL_EVIDENCE_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION') &&
    !p3d.includes(['WCAG', 'certified'].join(' ')) &&
    !p3d.includes(['TalkBack', 'certified'].join(' '))
);

assert('L01 myRequests present', flagship.includes("'myRequests'") && local.includes("id: 'myRequests'"));
assert('L02 bookingAssist present', flagship.includes("'bookingAssist'") && local.includes("id: 'bookingAssist'"));
assert('L03 legalWealth present', flagship.includes("'legalWealth'") && local.includes("id: 'legalWealth'"));
assert('L04 browseServices present', flagship.includes("'browseServices'") && local.includes("id: 'browseServices'"));
assert('L05 restaurants present', utility.includes("'restaurants'"));
assert('L06 transit present', utility.includes("'transit'"));
assert('L07 rentals present', utility.includes("'rentals'"));
assert('L08 classifieds utility present', utility.includes("'classifieds'"));
assert('L09 nails present', utility.includes("'nails'"));
assert('L10 community present', utility.includes("'community'"));
assert('L11 aiReceptionist present', utility.includes("'aiReceptionist'"));
assert('L12 language present', utility.includes("'language'"));
assert('L13 merchant hub present', secondary.includes("id: 'hub'") && local.includes('openBusinessUniverse'));
assert('L14 merchant bookingAssist present', local.includes('merchantToolsBookingSub'));
assert('L15 merchant aiReceptionist present', local.includes('aiPilotCardSub'));
assert('L16 classified preview present', secondary.includes('classifiedPreviews'));
assert('L17 composer ownership remains LocalScreen', local.includes('setComposerVisible') && local.includes('submitPost'));
assert('L18 VIP 120 VIG remains LocalScreen', local.includes('VIP_POSTING_COST_VIG = 120') && local.includes('reserveAndCommitCredits'));
assert('L19 status strip present', secondary.includes('viona-native-local-status-strip') && secondary.includes('statusSteps'));
assert('L20 connected travel present', secondary.includes("id: 'travel'") && local.includes('openTravelUniverse'));
assert('L21 connected academy present', local.includes("id: 'academy' as const") && local.includes('openAcademyUniverse'));
assert('L22 connected business present', local.includes('connectedBusinessSub'));
assert('L23 language sheet remains LocalScreen', local.includes('openLanguageSheet') && local.includes('SmartTrioLanguageSheet'));
assert('L24/L25 Account chrome remains PersonalHub', local.includes('PersonalHub') && local.includes('openAccountHub'));
assert('L26 SOS hold-gate remains LocalScreen', local.includes('VionaSosHoldGateModal') && local.includes('openSafetyAssist'));
assert('L27 role picker remains LocalScreen-owned', local.includes('openRolePicker') || local.includes('showRolePicker'));
assert('L28 web fullscreen remains web-owned', local.includes('desktopWeb') && local.includes('toggleFullscreen'));
assert('L29/L30 escape bar remains', local.includes('VionaBottomEscapeBar') && local.includes('onBackPress') && local.includes('goHome'));
assert('L31 B2C Local tab remains', mainTab.includes('MAIN_TAB.B2C.local') && local.includes("'TabLocal'"));
assert('L32 legal scan remains defined/unwired', local.includes('onLegalScannerPress') && local.includes('previewLegalScanCostVig'));
assert('no invented legalScan tile', !flagship.includes('legalScan') && !utility.includes('legalScan'));
assert('NO_FUNCTION_REMOVAL DailyReward', local.includes("navigate('DailyReward')"));
assert('NO_FUNCTION_REMOVAL AI receptionist demo', local.includes("'AiReceptionistDemoSimulator'"));
assert('NO_FUNCTION_REMOVAL browse TabLocal', local.includes("openMiniApp('local'"));
assert('demo booking remains LocalScreen', local.includes('runUltraMasterBookingWithAlerts'));
assert('secondary does not own VIP spend', !secondary.includes('reserveAndCommitCredits'));

assert('LOCAL_NOT_REAL_SEARCH: composition has no TextInput', !composition.includes('TextInput'));
assert('LOCAL_NOT_REAL_SEARCH: context has no TextInput', !context.includes('TextInput') && !context.includes('searchQuery'));
assert('LOCAL_NOT_REAL_SEARCH: no REAL_SEARCH', !composition.includes('REAL_SEARCH') && !context.includes('REAL_SEARCH'));
assert('readiness labels remain requestOnly/demo/lite', local.includes('bookingStatus.requestOnly') && local.includes('bookingStatus.demo') && local.includes('bookingStatus.lite'));

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
assert(
  'LocalOpeningStageLayout still owns shared hero/cards/quick-actions',
  layout.includes('LocalDynamicHero') && layout.includes('LocalHeroCardsRow') && layout.includes('LocalQuickActionsRow')
);
assert('opening stage remains thin children host', opening.includes('{children}') && !opening.includes('ClearPremium'));
assert(
  'opening stage still does not import native-local',
  !opening.includes("from './native-local") && !opening.includes("from '../native-local")
);

assert('B2C Home tab unchanged', mainTab.includes('MAIN_TAB.B2C.home'));
assert('B2C Local tab unchanged', mainTab.includes('MAIN_TAB.B2C.local') && mainTab.includes("'Local'"));
assert('B2C Travel tab unchanged', mainTab.includes('MAIN_TAB.B2C.travel') && routes.includes('B2C'));
assert('B2C Academy tab unchanged', mainTab.includes('MAIN_TAB.B2C.ai'));
assert('MAIN_TAB.B2C.home constant still exported', Boolean(MAIN_TAB.B2C.home));
assert('Account chrome still PersonalHub', mainTab.includes('openPersonalHub'));
assert('MainTabNavigator still mounts canonical SOSModal', mainTab.includes("from '../screens/b2c/SOSModal'"));
assert('Local does not mount tab-bar SOS', sosVisibility.includes('MAIN_TAB.B2C.local') && sosVisibility.includes('return false'));
assert('SOS hold remains 3000', sosHold.includes('DEFAULT_HOLD_MS = 3000') || sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000'));
assert('composition is not a second SOS host', !composition.includes('SOSModal') && !composition.includes('triggerSafetyAssist'));
assert('composition is not an Account host', !composition.includes('PersonalHub') && !composition.includes('openAccountHub'));
assert('mapper has no AI provider', !mapper.includes('openai') && !mapper.includes('anthropic'));
assert('composition has no AI provider', !composition.includes('openai') && !composition.includes('anthropic'));
assert('no new Local token file', !existsSync(path.join(root, 'src/design/vionaNativeClearPremiumLocalTokens.ts')));
assert('hit-target token remains 44', tokens.includes('min: 44'));
assert('App.tsx native portrait cap remains 600', appRoot.includes('maxWidth: isLargeScreen || nativeLandscapeFullBleed ?') && appRoot.includes('600'));
assert('native Local still does not hide the four-tab bar', local.includes("if (Platform.OS !== 'web')") && local.includes('LOCAL_HIDDEN_TAB_BAR_STYLE'));

assert('context hero grouped accessibilityLabel', context.includes('accessibilityLabel={accessibilityLabel}'));
assert('context hero is wrap-required', !context.includes('numberOfLines'));
assert('context hero is not a search field', !context.includes('TextInput'));
assert('flagship buttons have role and label', flagship.includes('accessibilityRole="button"') && flagship.includes('accessibilityLabel={item.accessibilityLabel}'));
assert('flagship hit target exceeds 44', flagship.includes('minHeight: 118') && flagship.includes('minHeight: 88'));
assert('utility buttons have role and label', utility.includes('accessibilityRole="button"') && utility.includes('accessibilityLabel={item.accessibilityLabel}'));
assert('utility hit target uses token 44', utility.includes('minHeight: tkn.hit.min'));
assert('status strip is textual not color-only', secondary.includes('statusNote') && secondary.includes('statusSteps') && secondary.includes('statusLabel'));
assert(
  'classified cards have semantic labels and 44 hit',
  secondary.includes('accessibilityLabel={`${post.title}. ${post.city}. ${post.priceLabel}`}') &&
    secondary.includes('minHeight: tkn.hit.min')
);
assert('merchant/connected are named buttons', secondary.includes('accessibilityRole="button"') && secondary.includes('local-native-merchant-') && secondary.includes('local-native-connected-'));
assert('P3-D does not reorder secondary IA', secondary.includes('viona-native-local-merchant-section') && secondary.includes('viona-native-local-connected-section'));
assert('reduceMotion still participates in composition', composition.includes('reduceMotion={layout.reduceMotion}'));
assert('P3-C compact landscape is not mobile&&landscape only', composition.includes('resolveNativeLocalCompactLandscape(contentWidth, layout.isLandscape)'));
assert('tablet mode is not column authority', !composition.includes("columns = layout.mode === 'tablet'"));

assert(
  'frozen original P3-A five-path range remains',
  frozenP3a.length === 5 && frozenP3a.includes('src/navigation/localPresentationTarget.ts')
);
assert('isolation test still pins original P3-A five-path range', p3a.includes(P3A_IMPLEMENTATION_HEAD) && p3a.includes(P3A_IMPLEMENTATION_PARENT));
assert('P3-A isolation uses execFileSync argv Git', p3a.includes("execFileSync('git', args"));
assert('Phase 1 descendant names PHASE3_D_LOCAL_FINAL_CLOSURE_DESCENDANT_ALLOWED', phase1.includes('PHASE3_D_LOCAL_FINAL_CLOSURE_DESCENDANT_ALLOWED'));
assert('Phase 1 descendant includes P3-D test', phase1.includes(p3dRel));
assert('P3-A isolation test now allows P3-D exact union', p3a.includes('P3D_EXACT_PATHS') && p3a.includes(p3dRel));
assert('P3-B test now allows P3-D exact union', p3b.includes('P3D_EXACT_PATHS') && p3b.includes(p3dRel));
assert('P3-C test records P3-D final-closure TEST exists', p3c.includes('P3-D final-closure TEST exists'));
assert('P3-C still does not prove visual GREEN', p3c.includes('SOURCE ASSERTIONS DO NOT PROVE VISUAL GREEN'));
assert('composition still does not claim P3-D', !composition.includes('P3-D'));
assert('composition still does not claim visual GREEN', composition.includes('Source assertions do not prove visual GREEN'));

assert('P3C-V07 residual classified ACCEPTABLE_INTENTIONAL', p3d.includes('P3C-V07 ACCEPTABLE_INTENTIONAL'));
assert('P3C-V08 residual classified ACCEPTABLE_INTENTIONAL', p3d.includes('P3C-V08 ACCEPTABLE_INTENTIONAL'));
assert('P3C-V09 residual classified OUT_OF_SCOPE', p3d.includes('P3C-V09 OUT_OF_SCOPE'));
assert('tablet portrait 2-column classified ACCEPTABLE_INTENTIONAL', p3d.includes('tablet portrait 2-column ACCEPTABLE_INTENTIONAL'));
assert('Account-chip residual remains Phase 4 out of scope', p3d.includes('GLOBAL_SHELL / PHASE 4'));
assert('P3-D closure requires zero unresolved HIGH owned blockers (policy in test-contract)', p3d.includes('zero unresolved HIGH P3-D-owned blockers'));
assert(
  'Phase 4 not started',
  !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-chip-shell.ts')) &&
    !p3d.includes(['PHASE4_IMPLEMENTATION', '_STARTED'].join(''))
);
assert('exact P3-D five-path allowlist size', P3D_EXACT_PATHS.size === 5);
assert(
  'exact P3-D or exact P4-A or exact P4-B1 or exact P4-B2 mutable-path contract',
  changed.length > 0 &&
    changed.every(
      (p) => P3D_EXACT_PATHS.has(p) || P4A_EXACT_PATHS.has(p) || P4B1_EXACT_PATHS.has(p) || P4B2_EXACT_PATHS.has(p) || P4C_EXACT_PATHS.has(p) || P4D_EXACT_PATHS.has(p)
    ) &&
    changed.length <= 10
);
assert(
  'no product/runtime path in P3-D mutation',
  !changed.includes(compositionRel) &&
    !changed.includes(localRel) &&
    !changed.includes(mapperRel) &&
    !changed.includes(openingRel) &&
    !changed.includes(layoutRel) &&
    !changed.includes(tokensRel) &&
    !changed.includes('App.tsx') &&
    !changed.includes('src/navigation/MainTabNavigator.tsx') &&
    !changed.includes('package.json')
);
assert(
  'no token/asset mutation',
  !changed.includes(tokensRel) && !changed.some((p) => p.startsWith('assets/') || p.startsWith('src/assets/'))
);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase3-local-final-closure] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase3-local-final-closure] OK');
console.log('[note] source assertions do not prove TalkBack / four-matrix / Phase 3 runtime GREEN');
console.log('[note] SOURCE_AND_REUSED_VISUAL_EVIDENCE_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION');
console.log('[note] zero unresolved HIGH P3-D-owned blockers is a closure gate, not a source-string proof');
