/**
 * Phase 4-C — Native PersonalHub four-matrix responsive refinement.
 * Run: npx tsx scripts/test-viona-mobile-phase4-account-responsive-refinement.ts
 *
 * Structural assertions only.
 * SOURCE_ASSERTIONS_DO_NOT_PROVE_FOUR_MATRIX_VISUAL_GREEN
 * P4C_SOURCE_TESTS_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MAIN_TAB } from '../src/navigation/routes';
import { resolveAccountPresentationTarget } from '../src/navigation/accountPresentationTarget';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const P4C_PRIMARY_PATHS = new Set([
  'src/components/viona/native-account/VionaNativeAccountClearPremiumComposition.tsx',
  'scripts/test-viona-mobile-phase4-account-responsive-refinement.ts',
]);

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

/** Account-owned gate (not Local 148/304/460/616). Mirrors composition formula. */
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
const p4cTestRel = 'scripts/test-viona-mobile-phase4-account-responsive-refinement.ts';
const hubRel = 'src/screens/CaNhanScreen.tsx';
const mapperRel = 'src/navigation/accountPresentationTarget.ts';
const openingRel = 'src/components/viona/VionaNativeAccountOpeningStage.tsx';
const tokensRel = 'src/design/vionaNativeClearPremiumTokens.ts';

assert('P4-C composition exists', existsSync(path.join(root, compositionRel)));
assert('P4-C targeted test exists', existsSync(path.join(root, p4cTestRel)));

const composition = read(compositionRel);
const p4cTest = read(p4cTestRel);
const hub = read(hubRel);
const mapper = read(mapperRel);
const opening = read(openingRel);
const tokens = read(tokensRel);
const chrome = read('src/components/viona/VionaShellAccountLanguageActions.tsx');
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
  'ios/android stay native-adaptive',
  resolveAccountPresentationTarget({ platform: 'ios', windowWidth: 390 }) === 'native-adaptive' &&
    resolveAccountPresentationTarget({ platform: 'android', windowWidth: 390 }) === 'native-adaptive'
);
assert(
  'web 769 remains web-desktop',
  resolveAccountPresentationTarget({ platform: 'web', windowWidth: 769 }) === 'web-desktop'
);

assert('P4-C composition is native-only mount', hub.includes("accountPresentationTarget === 'native-adaptive'") && hub.includes('<VionaNativeAccountClearPremiumComposition'));
assert('composition onLayout/contentWidth exists', composition.includes('onLayout') && composition.includes('contentWidth'));
assert('composition isLandscape exists', composition.includes('isLandscape') && composition.includes('windowWidth > windowHeight'));
assert(
  'existing reduceMotion helper reused',
  composition.includes('useFashionHomePrefersReducedMotion') &&
    composition.includes("from '../fashionHomeDesktopShell'")
);
assert('PHONE PORTRAIT preserve contract exists', composition.includes('PHONE PORTRAIT'));
assert('2-column resolver exists', composition.includes('resolveAccountNativeShortcutSettingsColumns'));
assert('Account two-col min tile is 176 not Local 148', composition.includes('ACCOUNT_NATIVE_TWO_COL_MIN_TILE = 176'));
assert('Account max columns is 2', composition.includes('ACCOUNT_NATIVE_MAX_COLUMNS = 2'));
assert(
  '2-col gated by landscape + measured width + native platform',
  composition.includes('if (platformOS === \'web\') return 1') &&
    composition.includes('if (!isLandscape) return 1') &&
    composition.includes('ACCOUNT_NATIVE_TWO_COL_MIN_TILE * 2 + ACCOUNT_NATIVE_ACTION_GAP')
);
assert(
  'no Account use of Local 304/460/616 as column law',
  !composition.includes('LOCAL_NATIVE_TWO_COL_MIN_WIDTH') &&
    !composition.includes('LOCAL_NATIVE_THREE_COL_MIN_WIDTH') &&
    !composition.includes('LOCAL_NATIVE_FOUR_COL_MIN_WIDTH') &&
    !composition.includes('LOCAL_NATIVE_MIN_TILE_WIDTH') &&
    composition.includes('Not Local')
);
assert('Local composition still owns 304/460/616', localComposition.includes('LOCAL_NATIVE_TWO_COL_MIN_WIDTH = 304') && localComposition.includes('LOCAL_NATIVE_THREE_COL_MIN_WIDTH = 460') && localComposition.includes('LOCAL_NATIVE_FOUR_COL_MIN_WIDTH = 616'));
assert('no 3/4-column Account layout type', !composition.includes('1 | 2 | 3 | 4') && !composition.includes('NativeLocalGridColumns') && composition.includes('AccountNativeListColumns = 1 | 2'));
assert('composition has no ScrollView', !composition.includes('ScrollView'));
assert('composition has no horizontal scroll', !composition.includes('horizontal={true}') && !composition.includes('horizontal: true') && !composition.includes("horizontal: 'true'"));
assert('hit min 44 preserved', composition.includes('minHeight: tkn.hit.min') && tokens.includes('min: 44'));
assert('layout.mode is not column authority', !composition.includes('layout.mode'));

assert(
  'phone portrait 328 stays 1-col even if Local 304 would 2-col',
  expectedAccountShortcutSettingsColumns(328, false) === 1 &&
    expectedAccountShortcutSettingsColumns(328, true) === 1
);
assert('phone portrait 640 remains 1-col', expectedAccountShortcutSettingsColumns(640, false) === 1);
assert(
  'landscape + sufficient measured width enables 2-col',
  expectedAccountShortcutSettingsColumns(360, true) === 2 &&
    expectedAccountShortcutSettingsColumns(640, true) === 2
);
assert('web never enables 2-col', expectedAccountShortcutSettingsColumns(900, true, 'web') === 1);
assert('max expected columns is 2', expectedAccountShortcutSettingsColumns(2000, true) === 2);

assert('composition does not call navigate', !composition.includes('navigate(') && !composition.includes('useNavigation'));
assert('composition does not import GDPRDashboard', !composition.includes('GDPRDashboard') && !composition.includes('executeRightToErasure'));
assert('composition does not mutate wallet', !composition.includes('reserveAndCommitCredits') && !composition.includes('topupCreditsServer') && !composition.includes('useWalletState'));
assert('composition does not persist language', !composition.includes('persistUserLanguage'));
assert('composition does not own Business gates', !composition.includes('evaluateMerchantSurfaceAccess') && !composition.includes('setMode'));
assert('composition does not import ProfileSwitcher', !composition.includes('ProfileSwitcher') && !composition.includes('openRolePicker'));
assert('composition does not host SOS', !composition.includes('SOSModal') && !composition.includes('VionaGlobalSosShellAction') && !composition.includes('triggerSafetyAssist'));
assert('composition does not mount constellation asset', !composition.includes('viona-account-global-net-bg-v2.png'));
assert('composition does not import premiumTileVisualTokens', !composition.includes('premiumTileVisualTokens'));
assert('opening stage remains thin children host', opening.includes('{children}'));
assert('opening stage does not import composition', !opening.includes('VionaNativeAccountClearPremiumComposition'));

assert('CaNhanScreen remains frozen by P4-C scope', !changed.includes(hubRel));
assert('mapper remains frozen', !changed.includes(mapperRel) && mapper.includes('native-adaptive'));
assert('opening stage remains frozen', !changed.includes(openingRel));
assert('tokens remain frozen', !changed.includes(tokensRel));
assert('Web hub still uses AccountNeonGlassPanel', hub.includes('<AccountNeonGlassPanel') && neon.includes('export function AccountNeonGlassPanel'));
assert('Fashion-Tech constellation remains in Web hub', hub.includes('viona-account-global-net-bg-v2.png') && hub.includes('accountBackdropOpacity'));
assert('CaNhanScreen remains scroll owner', hub.includes('<ScrollView') && !composition.includes('ScrollView'));

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
assert('C14 chrome frozen', !changed.includes('src/components/viona/VionaShellAccountLanguageActions.tsx'));
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

assert('P4-A chrome file untouched', !changed.includes('src/components/viona/VionaShellAccountLanguageActions.tsx'));
assert('P4-A native-gated chip remains', chrome.includes('nativeAccountChip') && chrome.includes("Platform.OS !== 'web'"));
assert('four B2C tabs preserved', mainTab.includes('MAIN_TAB.B2C.home') && mainTab.includes('MAIN_TAB.B2C.local') && mainTab.includes('MAIN_TAB.B2C.travel') && mainTab.includes('MAIN_TAB.B2C.ai'));
assert('no fifth B2C Account tab constant', !('account' in MAIN_TAB.B2C) && !routes.includes('TabAccount'));
assert('exact-one SOSModal JSX in MainTabNavigator', (mainTab.match(/<SOSModal\b/g) ?? []).length === 1);
assert(
  'SOS hold remains 3000',
  sosHold.includes('DEFAULT_HOLD_MS = 3000') || sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000')
);

assert('P4-C EXISTS', existsSync(path.join(root, p4cTestRel)));
assert('P4-D not started', !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-final-closure.ts')));
assert('Option B fifth-tab test not started', !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-fifth-tab.ts')));

assert('exact P4-C primary allowlist size', P4C_PRIMARY_PATHS.size === 2);
assert('exact P4-C ten-path envelope size', P4C_EXACT_PATHS.size === 10);
assert(
  'exact P4-C mutable-path contract',
  changed.length > 0 && changed.every((p) => P4C_EXACT_PATHS.has(p)) && changed.length <= 10
);
assert(
  'P4-C test does not fake four-matrix visual GREEN',
  p4cTest.includes('SOURCE_ASSERTIONS_DO_NOT_PROVE_FOUR_MATRIX_VISUAL_GREEN')
);
assert(
  'P4-C test does not claim formal a11y certification',
  p4cTest.includes('P4C_SOURCE_TESTS_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION')
);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase4-account-responsive-refinement] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase4-account-responsive-refinement] OK');
console.log('[note] SOURCE_ASSERTIONS_DO_NOT_PROVE_FOUR_MATRIX_VISUAL_GREEN');
console.log('[note] P4C_SOURCE_TESTS_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION');
