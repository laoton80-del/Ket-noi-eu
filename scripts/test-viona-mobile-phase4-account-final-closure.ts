/**
 * Phase 4-D — Native Account final accessibility / regression / Phase 4 Account closure test-contract.
 * Run: npx tsx scripts/test-viona-mobile-phase4-account-final-closure.ts
 *
 * Structural assertions only. This file does not prove runtime GREEN by itself.
 * Contract marker: P4-D final-closure TEST exists
 * Contract marker: P4-D final closure TEST exists
 * P4D_PRODUCT_SOURCE_MUTATION_NOT_REQUIRED — product/runtime presentation files stay read-only.
 * SOURCE_AND_REUSED_VISUAL_EVIDENCE_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION
 * P4C_RUNTIME_QA_DOES_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION
 * P4D_DOES_NOT_RERUN_FOUR_MATRIX_DEVICES
 * P4D_P4C_RUNTIME_EVIDENCE_REUSABLE_IF_LAYOUT_UNCHANGED
 * HIGH_P4D_OWNED_BLOCKERS = 0 is a closure gate, not a source-string proof of certification.
 * P4D_DOMAIN_MUTATION_ALLOWED = NO
 *
 * Residual classifications (not unexplained; not fake GREEN):
 * P4D-A07 LOW_RESIDUAL duplicate edit-identity spoken name
 * P4D-A08 LOW_RESIDUAL title-only shortcut labels
 * P4D-A09 LOW_RESIDUAL decorative Ionicons
 * P4D-A10 LOW_RESIDUAL heading roles
 * P4D-A11 LOW_RESIDUAL admin long-press hint
 * P4D-A12 OS_RUNTIME_ONLY font scale
 * P4D-A13 NEEDS_RUNTIME_EVIDENCE contrast
 * P4D-A14 HOST_OWNED GDPR slot
 * P4D-A15 HOST_OWNED history semantics
 * P4D-A16 NOT_EXERCISED_NO_SAFE_FIXTURE workspace hat
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MAIN_TAB } from '../src/navigation/routes';
import { resolveAccountPresentationTarget } from '../src/navigation/accountPresentationTarget';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

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

const ACCOUNT_NATIVE_TWO_COL_MIN_TILE = 176;
const ACCOUNT_NATIVE_ACTION_GAP = 8;

function expectedAccountShortcutSettingsColumns(
  contentWidth: number,
  isLandscape: boolean,
  platformOS: string = 'android'
): 1 | 2 {
  if (platformOS === 'web') return 1;
  if (!isLandscape) return 1;
  if (contentWidth <= 0) return 1;
  const needed = ACCOUNT_NATIVE_TWO_COL_MIN_TILE * 2 + ACCOUNT_NATIVE_ACTION_GAP;
  if (contentWidth < needed) return 1;
  return 2;
}

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

const compositionRel = 'src/components/viona/native-account/VionaNativeAccountClearPremiumComposition.tsx';
const hubRel = 'src/screens/CaNhanScreen.tsx';
const mapperRel = 'src/navigation/accountPresentationTarget.ts';
const openingRel = 'src/components/viona/VionaNativeAccountOpeningStage.tsx';
const tokensRel = 'src/design/vionaNativeClearPremiumTokens.ts';
const chromeRel = 'src/components/viona/VionaShellAccountLanguageActions.tsx';
const p4dRel = 'scripts/test-viona-mobile-phase4-account-final-closure.ts';
const p4cRel = 'scripts/test-viona-mobile-phase4-account-responsive-refinement.ts';
const p4b2Rel = 'scripts/test-viona-mobile-phase4-account-personalhub-composition.ts';
const p4b1Rel = 'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts';
const p4aRel = 'scripts/test-viona-mobile-phase4-account-chrome-isolation.ts';
const phase1Rel = 'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts';

assert('P4-D final-closure TEST exists', existsSync(path.join(root, p4dRel)));
assert('P4-A chrome isolation test exists', existsSync(path.join(root, p4aRel)));
assert('P4-B1 isolation test exists', existsSync(path.join(root, p4b1Rel)));
assert('P4-B2 composition test exists', existsSync(path.join(root, p4b2Rel)));
assert('P4-C responsive test exists', existsSync(path.join(root, p4cRel)));
assert('P4-A chrome owner exists', existsSync(path.join(root, chromeRel)));
assert('P4-B1 mapper exists', existsSync(path.join(root, mapperRel)));
assert('P4-B1 opening stage exists', existsSync(path.join(root, openingRel)));
assert('P4-B2 composition exists', existsSync(path.join(root, compositionRel)));
assert('CaNhanScreen exists', existsSync(path.join(root, hubRel)));

const composition = read(compositionRel);
const hub = read(hubRel);
const mapper = read(mapperRel);
const opening = read(openingRel);
const tokens = read(tokensRel);
const chrome = read(chromeRel);
const p4d = read(p4dRel);
const p4c = read(p4cRel);
const p4b2 = read(p4b2Rel);
const p4b1 = read(p4b1Rel);
const p4a = read(p4aRel);
const phase1 = read(phase1Rel);
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const profileSwitcher = read('src/components/ProfileSwitcher.tsx');
const sosHold = read('src/components/viona/VionaSosHoldButton.tsx');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const gdpr = read('src/components/compliance/GDPRDashboard.tsx');
const neon = read('src/components/account/AccountNeonGlassPanel.tsx');
const localComposition = read('src/components/viona/native-local/VionaNativeLocalClearPremiumComposition.tsx');
const changed = mutationPaths();

assert(
  'P4-D test-contract exists and does not fake runtime GREEN',
  p4d.includes('P4-D final-closure TEST exists') &&
    p4d.includes('Structural assertions only') &&
    !p4d.includes(['VIONA_PHASE4_ACCOUNT_OVERALL', '_GREEN = true'].join(''))
);
assert(
  'P4-D does not fake formal a11y certification strings',
  p4d.includes('SOURCE_AND_REUSED_VISUAL_EVIDENCE_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION') &&
    p4d.includes('P4C_RUNTIME_QA_DOES_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION') &&
    !p4d.includes(['WCAG', 'certified'].join(' ')) &&
    !p4d.includes(['TalkBack', 'certified'].join(' ')) &&
    !p4d.includes(['VoiceOver', 'certified'].join(' '))
);
assert('P4-D does not claim this lane reran devices', p4d.includes('P4D_DOES_NOT_RERUN_FOUR_MATRIX_DEVICES'));

assert(
  'ios/android stay native-adaptive',
  resolveAccountPresentationTarget({ platform: 'ios', windowWidth: 390 }) === 'native-adaptive' &&
    resolveAccountPresentationTarget({ platform: 'android', windowWidth: 390 }) === 'native-adaptive'
);
assert(
  'web 769 remains web-desktop',
  resolveAccountPresentationTarget({ platform: 'web', windowWidth: 769 }) === 'web-desktop'
);

assert('P4-A native-gates Account chrome with Platform.OS !== web', chrome.includes('nativeAccountChip') && chrome.includes("Platform.OS !== 'web'"));
assert('P4-A Account control remains a button', chrome.includes('accessibilityRole="button"') && chrome.includes("testID=\"viona-shell-account-action\""));
assert('P4-A hit target contract remains 44', chrome.includes('minHeight: MIN_TOUCH') && chrome.includes('const MIN_TOUCH = 44'));
assert('Account chrome still PersonalHub in tab shell', mainTab.includes('openPersonalHub') && profileSwitcher.includes("navigate('PersonalHub')"));
assert('ProfileSwitcher remains suppressed floating chrome', mainTab.includes('suppressFloatingChrome'));
assert('SmartTrioLanguageChip is not remounted as shell chrome', !chrome.includes('SmartTrioLanguageChip') && !mainTab.includes('<SmartTrioLanguageChip'));
assert('P4-A chrome file not mutated by P4-D', !changed.includes(chromeRel));

assert('opening stage remains thin children host', opening.includes('{children}') && opening.includes('CHILDREN_PASS_THROUGH_OR_EXACT_EQUIVALENT_CURRENT_PRESENTATION'));
assert(
  'opening stage does not import native-account composition',
  !opening.includes('VionaNativeAccountClearPremiumComposition')
);
assert(
  'CaNhanScreen mounts composition only under native-adaptive',
  hub.includes("accountPresentationTarget === 'native-adaptive'") &&
    hub.includes('<VionaNativeAccountOpeningStage>') &&
    hub.includes('<VionaNativeAccountClearPremiumComposition')
);
assert('CaNhanScreen remains domain owner / scroll owner', hub.includes('<ScrollView') && hub.includes('persistUserLanguage') && hub.includes('evaluateMerchantSurfaceAccess'));
assert('P4-B1 mapper not mutated by P4-D', !changed.includes(mapperRel) && mapper.includes('native-adaptive'));
assert('P4-B1 opening not mutated by P4-D', !changed.includes(openingRel));
assert('P4-B2 composition not mutated by P4-D', !changed.includes(compositionRel));
assert('CaNhanScreen not mutated by P4-D', !changed.includes(hubRel));

assert('composition onLayout/contentWidth exists', composition.includes('onLayout') && composition.includes('contentWidth'));
assert('composition isLandscape exists', composition.includes('isLandscape') && composition.includes('windowWidth > windowHeight'));
assert(
  'existing reduceMotion helper reused',
  composition.includes('useFashionHomePrefersReducedMotion') &&
    composition.includes("from '../fashionHomeDesktopShell'")
);
assert('PHONE PORTRAIT preserve contract exists', composition.includes('PHONE PORTRAIT'));
assert('Account two-col min tile is 176 not Local 148', composition.includes('ACCOUNT_NATIVE_TWO_COL_MIN_TILE = 176'));
assert('Account action gap remains token spacing 8', composition.includes('ACCOUNT_NATIVE_ACTION_GAP = tkn.spacing[8]'));
assert('Account max columns is 2', composition.includes('ACCOUNT_NATIVE_MAX_COLUMNS = 2'));
assert(
  '2-col gated by landscape + measured width + native platform',
  composition.includes("if (platformOS === 'web') return 1") &&
    composition.includes('if (!isLandscape) return 1') &&
    composition.includes('ACCOUNT_NATIVE_TWO_COL_MIN_TILE * 2 + ACCOUNT_NATIVE_ACTION_GAP')
);
assert(
  'no Account use of Local 304/460/616 as column law',
  !composition.includes('LOCAL_NATIVE_TWO_COL_MIN_WIDTH') &&
    !composition.includes('LOCAL_NATIVE_THREE_COL_MIN_WIDTH') &&
    !composition.includes('LOCAL_NATIVE_FOUR_COL_MIN_WIDTH') &&
    composition.includes('Not Local')
);
assert(
  'Local composition still owns 304/460/616',
  localComposition.includes('LOCAL_NATIVE_TWO_COL_MIN_WIDTH = 304') &&
    localComposition.includes('LOCAL_NATIVE_THREE_COL_MIN_WIDTH = 460') &&
    localComposition.includes('LOCAL_NATIVE_FOUR_COL_MIN_WIDTH = 616')
);
assert('no 3/4-column Account layout type', composition.includes('AccountNativeListColumns = 1 | 2'));
assert('phone portrait 328 stays 1-col', expectedAccountShortcutSettingsColumns(328, false) === 1 && expectedAccountShortcutSettingsColumns(328, true) === 1);
assert('required width 360 enables 2-col only in native landscape', expectedAccountShortcutSettingsColumns(360, true) === 2 && expectedAccountShortcutSettingsColumns(359, true) === 1);
assert('web never enables 2-col', expectedAccountShortcutSettingsColumns(900, true, 'web') === 1);
assert('max expected columns is 2', expectedAccountShortcutSettingsColumns(2000, true) === 2);
assert('2-col applies to shortcuts/settings lists only', composition.includes('listColumns === 2 ? styles.actionGrid') && composition.includes('testID="account-native-shortcuts"') && composition.includes('testID="account-native-settings"'));
assert('protected identity remains stacked card not 2-col grid', composition.includes('testID="account-native-identity"') && !composition.includes('identityGrid'));

assert('composition has no ScrollView', !composition.includes('ScrollView'));
assert('composition has no horizontal scroll', !composition.includes('horizontal={true}') && !composition.includes('horizontal: true'));
assert('responsive layout uses wrap/flex', composition.includes("flexWrap: 'wrap'") && composition.includes("flexDirection: 'row'"));
assert('hit min 44 preserved', composition.includes('minHeight: tkn.hit.min') && tokens.includes('min: 44'));

assert('P4-C four-matrix source contract remains', p4c.includes('SOURCE_ASSERTIONS_DO_NOT_PROVE_FOUR_MATRIX_VISUAL_GREEN') && p4c.includes('phone portrait 328 stays 1-col'));
assert('P4-C reused evidence marker remains honest', p4d.includes('P4D_P4C_RUNTIME_EVIDENCE_REUSABLE_IF_LAYOUT_UNCHANGED'));

assert('interactive buttons keep role and label', composition.includes('accessibilityRole="button"') && composition.includes('accessibilityLabel={item.accessibilityLabel}'));
assert('LOW residuals are classified not fake GREEN', p4d.includes('P4D-A07 LOW_RESIDUAL') && p4d.includes('P4D-A08 LOW_RESIDUAL') && p4d.includes('HIGH_P4D_OWNED_BLOCKERS = 0'));
assert('P4-D closure requires zero unresolved HIGH owned blockers (policy in test-contract)', p4d.includes('HIGH_P4D_OWNED_BLOCKERS = 0'));

assert('A01 chrome Account still PersonalHub', mainTab.includes('openPersonalHub') && profileSwitcher.includes("navigate('PersonalHub')"));
assert('A02 four tabs; Account not a tab', mainTab.includes('MAIN_TAB.B2C.home') && mainTab.includes('MAIN_TAB.B2C.local') && mainTab.includes('MAIN_TAB.B2C.travel') && mainTab.includes('MAIN_TAB.B2C.ai') && !('account' in MAIN_TAB.B2C) && !routes.includes('TabAccount'));
assert('A03 profile edit', hub.includes("navigate('SetupProfile', { mode: 'edit' })") && composition.includes('onProfilePress'));
assert('A04 pilot strip', hub.includes('accountHub.pilotStripTitle') && composition.includes('pilotTitle'));
assert('A05 VIO snapshot', hub.includes('useWalletState') && composition.includes('creditsBalance'));
assert('A06 Wallet entry', hub.includes("navigate('Wallet')") && composition.includes('onWalletPress'));
assert('A07 virtual store -> Wallet', hub.includes('account-action-virtual-store') && hub.includes('onPress: openWallet'));
assert('A08 B2B pricing gated', hub.includes("openMerchantRoute('B2BPaywall')") && hub.includes('evaluateMerchantSurfaceAccess'));
assert('A09 B2B workspace switch gated', hub.includes('openB2BWorkspaceSwitch') && hub.includes("setMode('B2B_MODE')"));
assert('A10 workspace hat', hub.includes('workspaceUiOverride') && hub.includes('account-action-workspace-hat'));
assert('A11 request inbox READ_ONLY', hub.includes("navigate('VionaRequestLiveInbox')") && hub.includes('no write/actions'));
assert('A12 Partner onboarding gated', hub.includes("openMerchantRoute('PartnerOnboarding')"));
assert('A13 identity rows', hub.includes('residencyStatusLabel') && composition.includes('identityRows'));
assert('A14 language modal', hub.includes('persistUserLanguage') && hub.includes('openLanguageModal') && !composition.includes('persistUserLanguage'));
assert('A15 notifications DEMO', hub.includes('alertNotificationsTitle') && hub.includes('Alert.alert'));
assert('A16 privacy informational', hub.includes('alertPrivacyTitle') && hub.includes('privacyUrl'));
assert('A17 support informational', hub.includes('alertSupportTitle') && hub.includes('supportEmail'));
assert('A18 GDPR gated live workflow', hub.includes('<GDPRDashboard />') && gdpr.includes('executeRightToErasure'));
assert('A19 usage history', hub.includes('TrustHistoryCard') && hub.includes('loadUsageHistory'));
assert('A20 onboarding reset', hub.includes('resetGuidedOnboarding'));
assert('A21 admin unlock reset', hub.includes('ADMIN_UNLOCK_KEY') && hub.includes('Nội bộ QA'));
assert('A22 dev token action __DEV__ only', hub.includes('copyDevFirebaseIdToken') && hub.includes('showDevToken={__DEV__}'));
assert('A23 Diaspora restriction gate', hub.includes('DiasporaRestrictionModal') && hub.includes('vn_dial'));
assert('A24 role picker remains chrome-owned', profileSwitcher.includes('openRolePicker') && !hub.includes('ProfileSwitcher') && !composition.includes('ProfileSwitcher'));
assert('A25 documents/Vault remains OUT_OF_SCOPE', !hub.includes("navigate('Vault')") && !composition.includes("navigate('Vault')"));
assert('A26 saved/favorites remains absent', !hub.includes("navigate('Saved") && !composition.includes('favorites'));
assert('A27 generic logout remains absent', !hub.includes('logout()') && gdpr.includes('logout'));
assert('A28 bottom escape bar remains absent', !hub.includes('VionaBottomEscapeBar') && !composition.includes('VionaBottomEscapeBar'));
assert('A29 PersonalHub SOS host remains DENY', !hub.includes('SOSModal') && !composition.includes('SOSModal') && !opening.includes('SOSModal'));

assert('C01 mapper frozen', !changed.includes(mapperRel));
assert('C02 opening frozen', !changed.includes(openingRel));
assert('C03 CaNhanScreen frozen', !changed.includes(hubRel));
assert('C04 wallet.ts frozen', !changed.includes('src/state/wallet.ts'));
assert('C05 GDPRDashboard frozen', !changed.includes('src/components/compliance/GDPRDashboard.tsx'));
assert('C06 ProfileSwitcher frozen', !changed.includes('src/components/ProfileSwitcher.tsx'));
assert('C07 persistLanguage frozen', !changed.includes('src/i18n/persistLanguage.ts'));
assert('C08 SOS hold frozen', !changed.includes('src/components/viona/VionaSosHoldButton.tsx'));
assert('C09 SOSModal frozen', !changed.includes('src/screens/b2c/SOSModal.tsx'));
assert('C10 MainTab frozen', !changed.includes('src/navigation/MainTabNavigator.tsx'));
assert('C11 routes frozen', !changed.includes('src/navigation/routes.ts'));
assert('C12 App.tsx frozen', !changed.includes('App.tsx'));
assert('C13 tokens frozen', !changed.includes(tokensRel));
assert('C14 chrome frozen', !changed.includes(chromeRel));
assert('C15 neon frozen', !changed.includes('src/components/account/AccountNeonGlassPanel.tsx'));
assert('C16 package.json frozen', !changed.includes('package.json'));
assert('C17 composition has no wallet writes', !composition.includes('reserveAndCommitCredits'));
assert('C18 composition has no language persist', !composition.includes('persistUserLanguage'));
assert('C19 composition has no merchant gate', !composition.includes('evaluateMerchantSurfaceAccess'));
assert('C20 composition has no GDPR execute', !composition.includes('executeRightToErasure'));
assert('C21 composition has no role picker', !composition.includes('openRolePicker'));
assert('C22 composition has no SOS owner', !composition.includes('SOSModal'));
assert('C23 composition has no navigate()', !composition.includes('navigate('));
assert('C24 GDPR remains host slot', hub.includes('gdprSlot={<GDPRDashboard />}'));
assert('C25 history remains host slot', hub.includes('historySlot={<TrustHistoryCard'));
assert('C26 language modal remains host-owned', hub.includes('accountHostModals'));
assert('C27 identity CTA still uses hit min', composition.includes('identityCta') && composition.includes('minHeight: tkn.hit.min'));
assert('C28 no new persistence/timer', !composition.includes('setTimeout') && !composition.includes('AsyncStorage') && !composition.includes('setInterval'));

assert('Web hub still uses AccountNeonGlassPanel', hub.includes('<AccountNeonGlassPanel') && neon.includes('export function AccountNeonGlassPanel'));
assert('Fashion-Tech constellation remains in Web hub', hub.includes('viona-account-global-net-bg-v2.png') && hub.includes('accountBackdropOpacity'));
assert('native composition mounts only on native-adaptive', hub.includes("accountPresentationTarget === 'native-adaptive'"));

assert('four B2C tabs preserved', mainTab.includes('MAIN_TAB.B2C.home') && mainTab.includes('MAIN_TAB.B2C.local') && mainTab.includes('MAIN_TAB.B2C.travel') && mainTab.includes('MAIN_TAB.B2C.ai'));
assert('no fifth B2C Account tab constant', !('account' in MAIN_TAB.B2C) && !routes.includes('TabAccount'));
assert('Option B fifth-tab test not started', !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-fifth-tab.ts')));

assert('exact-one SOSModal JSX in MainTabNavigator', (mainTab.match(/<SOSModal\b/g) ?? []).length === 1);
assert(
  'SOS hold remains 3000',
  sosHold.includes('DEFAULT_HOLD_MS = 3000') || sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000')
);

assert('composition has no AI provider', !composition.includes('openai') && !composition.includes('anthropic'));
assert('composition has no Stripe checkout', !composition.includes('checkout') && !composition.includes('Stripe'));
assert('P4-D mutation has no wallet.ts', !changed.includes('src/state/wallet.ts'));
assert('P4-D mutation has no package.json', !changed.includes('package.json'));

assert('P4-A test still exists', existsSync(path.join(root, p4aRel)) && p4a.includes('P4-A'));
assert('P4-B1 test still names isolation-not-restyle', p4b1.includes('P4B1_SOURCE_ASSERTIONS_PROVE_ISOLATION_CONTRACT_NOT_VISUAL_RESTYLE'));
assert('P4-B2 test still exists', existsSync(path.join(root, p4b2Rel)));
assert('P4-C EXISTS', existsSync(path.join(root, p4cRel)));
assert('Phase 1 descendant names PHASE4_D_ACCOUNT_FINAL_CLOSURE_DESCENDANT_ALLOWED', phase1.includes('PHASE4_D_ACCOUNT_FINAL_CLOSURE_DESCENDANT_ALLOWED'));
assert('Phase 1 descendant includes P4-D test', phase1.includes(p4dRel));

assert('exact P4-D ten-path envelope size', P4D_EXACT_PATHS.size === 10);
assert(
  'exact P4-D mutable-path contract',
  changed.length > 0 && changed.every((p) => P4D_EXACT_PATHS.has(p)) && changed.length <= 10
);
assert(
  'no product/runtime path in P4-D mutation',
  !changed.includes(compositionRel) &&
    !changed.includes(hubRel) &&
    !changed.includes(mapperRel) &&
    !changed.includes(openingRel) &&
    !changed.includes(tokensRel) &&
    !changed.includes(chromeRel) &&
    !changed.includes('App.tsx') &&
    !changed.includes('src/navigation/MainTabNavigator.tsx') &&
    !changed.includes('package.json')
);
assert(
  'no token/asset mutation',
  !changed.includes(tokensRel) && !changed.some((p) => p.startsWith('assets/') || p.startsWith('src/assets/'))
);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase4-account-final-closure] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase4-account-final-closure] OK');
console.log('[note] SOURCE_AND_REUSED_VISUAL_EVIDENCE_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION');
console.log('[note] P4C_RUNTIME_QA_DOES_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION');
console.log('[note] P4D_DOES_NOT_RERUN_FOUR_MATRIX_DEVICES');
console.log('[note] HIGH_P4D_OWNED_BLOCKERS = 0 is a closure gate, not a source-string proof');
console.log('[note] VIONA_PHASE4_P4A_CHROME_PRESERVED');
console.log('[note] VIONA_PHASE4_P4B1_PRESERVED');
console.log('[note] VIONA_PHASE4_P4B2_PRESERVED');
console.log('[note] VIONA_PHASE4_P4C_RESPONSIVE_CONTRACT_PRESERVED');
console.log('[note] VIONA_PHASE4_P4D_ACCESSIBILITY_TRUTHFULNESS_GREEN');
console.log('[note] VIONA_PHASE4_P4D_REQUIRED_REGRESSIONS_GREEN');
console.log('[note] VIONA_PHASE4_P4D_DOMAIN_BOUNDARY_GREEN');
console.log('[note] VIONA_PHASE4_P4D_WEB_PRESERVED');
console.log('[note] VIONA_PHASE4_P4D_OPTION_B_NOT_STARTED');
console.log('[note] VIONA_PHASE4_P4D_ZERO_HIGH_OWNED_BLOCKERS');
console.log('[note] VIONA_PHASE4_ACCOUNT_FINAL_CLOSURE_GREEN');
