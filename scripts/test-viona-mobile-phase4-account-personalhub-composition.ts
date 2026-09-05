/**
 * Phase 4-B2 — Native PersonalHub Clear Premium composition.
 * Run: npx tsx scripts/test-viona-mobile-phase4-account-personalhub-composition.ts
 *
 * SOURCE_ASSERTIONS_DO_NOT_PROVE_P4C_FOUR_MATRIX_VISUAL_GREEN
 * P4B2_SOURCE_AND_RUNTIME_BASELINE_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MAIN_TAB } from '../src/navigation/routes';
import { resolveAccountPresentationTarget } from '../src/navigation/accountPresentationTarget';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const P4B2_PRIMARY_PATHS = new Set([
  'src/components/viona/native-account/VionaNativeAccountClearPremiumComposition.tsx',
  'scripts/test-viona-mobile-phase4-account-personalhub-composition.ts',
  'src/screens/CaNhanScreen.tsx',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
  'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts',
]);

const P4B2_CONDITIONAL_LINEAGE_PATHS = new Set([
  'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts',
  'scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts',
  'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts',
  'scripts/test-viona-mobile-phase3-local-final-closure.ts',
  'scripts/test-viona-mobile-phase4-account-chrome-isolation.ts',
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

const mapperRel = 'src/navigation/accountPresentationTarget.ts';
const openingRel = 'src/components/viona/VionaNativeAccountOpeningStage.tsx';
const hubRel = 'src/screens/CaNhanScreen.tsx';
const compositionRel = 'src/components/viona/native-account/VionaNativeAccountClearPremiumComposition.tsx';
const compositionTestRel = 'scripts/test-viona-mobile-phase4-account-personalhub-composition.ts';
const p4b1Rel = 'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts';
const tokensRel = 'src/design/vionaNativeClearPremiumTokens.ts';

assert('P4-B1 resolver still exists', existsSync(path.join(root, mapperRel)));
assert('P4-B1 opening stage still exists', existsSync(path.join(root, openingRel)));
assert('P4-B2 composition exists', existsSync(path.join(root, compositionRel)));
assert('P4-B2 composition test exists', existsSync(path.join(root, compositionTestRel)));
assert('P4-B1 isolation test still exists', existsSync(path.join(root, p4b1Rel)));

const mapper = read(mapperRel);
const opening = read(openingRel);
const hub = read(hubRel);
const composition = read(compositionRel);
const compositionTest = read(compositionTestRel);
const p4b1 = read(p4b1Rel);
const tokens = read(tokensRel);
const chrome = read('src/components/viona/VionaShellAccountLanguageActions.tsx');
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const profileSwitcher = read('src/components/ProfileSwitcher.tsx');
const sosHold = read('src/components/viona/VionaSosHoldButton.tsx');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const gdpr = read('src/components/compliance/GDPRDashboard.tsx');
const neon = read('src/components/account/AccountNeonGlassPanel.tsx');
const changed = mutationPaths();

assert(
  'ios/android stay native-adaptive',
  resolveAccountPresentationTarget({ platform: 'ios', windowWidth: 390 }) === 'native-adaptive' &&
    resolveAccountPresentationTarget({ platform: 'android', windowWidth: 390 }) === 'native-adaptive'
);
assert(
  'native never web-desktop',
  resolveAccountPresentationTarget({ platform: 'ios', windowWidth: 1280 }) === 'native-adaptive'
);
assert(
  'web 769 remains web-desktop',
  resolveAccountPresentationTarget({ platform: 'web', windowWidth: 769 }) === 'web-desktop'
);

assert('opening stage remains thin children host', opening.includes('{children}') && opening.includes('CHILDREN_PASS_THROUGH_OR_EXACT_EQUIVALENT_CURRENT_PRESENTATION'));
assert(
  'opening stage does not import native-account composition',
  !opening.includes('VionaNativeAccountClearPremiumComposition') &&
    !opening.includes("from './native-account") &&
    !opening.includes("from '../native-account")
);
assert('composition has native Account composition testID', composition.includes('viona-native-account-clear-premium-composition'));
assert('composition has no ScrollView', !composition.includes('ScrollView'));
assert('composition does not call navigate', !composition.includes('navigate(') && !composition.includes('useNavigation'));
assert('composition does not import GDPRDashboard', !composition.includes('GDPRDashboard') && !composition.includes('executeRightToErasure'));
assert('composition does not mutate wallet', !composition.includes('reserveAndCommitCredits') && !composition.includes('topupCreditsServer') && !composition.includes('useWalletState'));
assert('composition does not persist language', !composition.includes('persistUserLanguage'));
assert('composition does not own Business gates', !composition.includes('evaluateMerchantSurfaceAccess') && !composition.includes('setMode'));
assert('composition does not import ProfileSwitcher', !composition.includes('ProfileSwitcher') && !composition.includes('openRolePicker'));
assert('composition does not host SOS', !composition.includes('SOSModal') && !composition.includes('VionaGlobalSosShellAction') && !composition.includes('triggerSafetyAssist'));
assert('composition does not mount constellation asset', !composition.includes('viona-account-global-net-bg-v2.png'));
assert('composition does not import premiumTileVisualTokens', !composition.includes('premiumTileVisualTokens'));
assert('composition reuses Clear Premium tokens', composition.includes("from '../../../design/vionaNativeClearPremiumTokens'"));
assert('composition identity CTA uses hit min 44', composition.includes('minHeight: tkn.hit.min') && tokens.includes('min: 44'));
assert('composition has no AI provider', !composition.includes('openai') && !composition.includes('anthropic'));
assert('composition has no Stripe checkout', !composition.includes('checkout') && !composition.includes('Stripe'));

assert('CaNhanScreen imports composition', hub.includes('VionaNativeAccountClearPremiumComposition'));
assert(
  'CaNhanScreen mounts composition only under native-adaptive',
  hub.includes("accountPresentationTarget === 'native-adaptive'") &&
    hub.includes('<VionaNativeAccountOpeningStage>') &&
    hub.includes('<VionaNativeAccountClearPremiumComposition') &&
    hub.includes('return hub')
);
assert('Web hub still uses AccountNeonGlassPanel', hub.includes('const hub = (') && hub.includes('<AccountNeonGlassPanel') && neon.includes('export function AccountNeonGlassPanel'));
assert('Fashion-Tech constellation remains in Web hub', hub.includes('viona-account-global-net-bg-v2.png') && hub.includes('accountBackdropOpacity'));
assert('CaNhanScreen remains scroll owner', hub.includes('<ScrollView') && !composition.includes('ScrollView'));
assert('language modal remains host-owned', hub.includes('persistUserLanguage') && hub.includes('accountHostModals') && !composition.includes('persistUserLanguage'));
assert('diaspora modal remains host-owned', hub.includes('DiasporaRestrictionModal') && !composition.includes('DiasporaRestrictionModal'));
assert('GDPR remains host slot', hub.includes('gdprSlot={<GDPRDashboard />}') && gdpr.includes('executeRightToErasure'));
assert('history remains host slot', hub.includes('historySlot={<TrustHistoryCard'));

assert('A01 chrome Account still PersonalHub', mainTab.includes('openPersonalHub') && profileSwitcher.includes("navigate('PersonalHub')"));
assert('A02 four tabs; Account not a tab', mainTab.includes('MAIN_TAB.B2C.home') && mainTab.includes('MAIN_TAB.B2C.local') && mainTab.includes('MAIN_TAB.B2C.travel') && mainTab.includes('MAIN_TAB.B2C.ai') && !('account' in MAIN_TAB.B2C) && !routes.includes('TabAccount'));
assert('A03 profile edit', hub.includes("navigate('SetupProfile', { mode: 'edit' })") && composition.includes('onProfilePress'));
assert('A04 pilot strip', hub.includes('accountHub.pilotStripTitle') && composition.includes('pilotTitle'));
assert('A05 VIO snapshot', hub.includes('useWalletState') && hub.includes('creditsBalanceCurrent') && composition.includes('creditsBalance'));
assert('A06 Wallet entry', hub.includes("navigate('Wallet')") && composition.includes('onWalletPress'));
assert('A07 virtual store -> Wallet', hub.includes('account-action-virtual-store') && hub.includes('onPress: openWallet'));
assert('A08 B2B pricing gated', hub.includes("openMerchantRoute('B2BPaywall')") && hub.includes('evaluateMerchantSurfaceAccess'));
assert('A09 B2B workspace switch gated', hub.includes('openB2BWorkspaceSwitch') && hub.includes("setMode('B2B_MODE')"));
assert('A10 workspace hat', hub.includes('workspaceUiOverride') && hub.includes('account-action-workspace-hat'));
assert('A11 request inbox READ_ONLY', hub.includes("navigate('VionaRequestLiveInbox')") && hub.includes('no write/actions'));
assert('A12 Partner onboarding gated', hub.includes("openMerchantRoute('PartnerOnboarding')"));
assert('A13 identity rows', hub.includes('residencyStatusLabel') && composition.includes('identityRows'));
assert('A14 language modal', hub.includes('persistUserLanguage') && hub.includes('setLanguageModalOpen') && composition.includes('onPress: openLanguageModal') === false && hub.includes('openLanguageModal'));
assert('A15 notifications DEMO', hub.includes('alertNotificationsTitle') && hub.includes('Alert.alert'));
assert('A16 privacy informational', hub.includes('alertPrivacyTitle') && hub.includes('privacyUrl'));
assert('A17 support informational', hub.includes('alertSupportTitle') && hub.includes('supportEmail'));
assert('A18 GDPR gated live workflow', hub.includes('<GDPRDashboard />') && gdpr.includes('executeRightToErasure'));
assert('A19 usage history', hub.includes('TrustHistoryCard') && hub.includes('loadUsageHistory'));
assert('A20 onboarding reset', hub.includes('resetGuidedOnboarding'));
assert('A21 admin unlock reset', hub.includes('ADMIN_UNLOCK_KEY') && hub.includes('Nội bộ QA'));
assert('A22 dev token action __DEV__ only', hub.includes('copyDevFirebaseIdToken') && hub.includes('showDevToken={__DEV__}'));
assert('A23 Diaspora restriction gate', hub.includes('DiasporaRestrictionModal') && hub.includes('vn_dial'));
assert('A24 role picker remains chrome-owned', profileSwitcher.includes('openRolePicker') && !hub.includes('ProfileSwitcher') && !hub.includes('openRolePicker') && !composition.includes('ProfileSwitcher'));
assert('A25 documents/Vault remains OUT_OF_SCOPE', !hub.includes("navigate('Vault')") && !composition.includes("navigate('Vault')"));
assert('A26 saved/favorites remains absent', !hub.includes("navigate('Saved") && !composition.includes('favorites'));
assert('A27 generic logout remains absent', !hub.includes('logout()') && gdpr.includes('logout'));
assert('A28 bottom escape bar remains absent', !hub.includes('VionaBottomEscapeBar') && !composition.includes('VionaBottomEscapeBar'));
assert('A29 PersonalHub SOS host remains DENY', !hub.includes('SOSModal') && !composition.includes('SOSModal') && !opening.includes('SOSModal'));

assert('wallet snapshot remains display-only', hub.includes('wallet.credits') && !hub.includes('reserveAndCommitCredits') && !composition.includes('reserveAndCommitCredits'));
assert('wallet.ts not in P4-B2 mutation', !changed.includes('src/state/wallet.ts'));
assert('GDPRDashboard file not restyled', !changed.includes('src/components/compliance/GDPRDashboard.tsx'));
assert('AccountNeonGlassPanel not restyled', !changed.includes('src/components/account/AccountNeonGlassPanel.tsx'));
assert('token file not mutated', !changed.includes(tokensRel));
assert('mapper not mutated', !changed.includes(mapperRel));
assert('opening stage not mutated', !changed.includes(openingRel));
assert('P4-A chrome file untouched', !changed.includes('src/components/viona/VionaShellAccountLanguageActions.tsx'));
assert('P4-A native-gated chip remains', chrome.includes('nativeAccountChip') && chrome.includes("Platform.OS !== 'web'"));
assert('MainTabNavigator untouched', !changed.includes('src/navigation/MainTabNavigator.tsx'));
assert('routes.ts untouched', !changed.includes('src/navigation/routes.ts'));
assert('App.tsx untouched', !changed.includes('App.tsx'));
assert('package.json untouched', !changed.includes('package.json'));
assert('exact-one SOSModal JSX in MainTabNavigator', (mainTab.match(/<SOSModal\b/g) ?? []).length === 1);
assert(
  'SOS hold remains 3000',
  sosHold.includes('DEFAULT_HOLD_MS = 3000') || sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000')
);
assert('no fifth B2C Account tab constant', !('account' in MAIN_TAB.B2C));
assert('P4-B1 isolation test still names isolation-not-restyle', p4b1.includes('P4B1_SOURCE_ASSERTIONS_PROVE_ISOLATION_CONTRACT_NOT_VISUAL_RESTYLE'));

assert('P4-C EXISTS', existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-responsive-refinement.ts')));
assert('P4-D not started', !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-final-closure.ts')));
assert('Option B fifth-tab test not started', !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-fifth-tab.ts')));

assert('exact P4-B2 primary allowlist size', P4B2_PRIMARY_PATHS.size === 5);
assert(
  'exact P4-B2 mutable-path contract',
  changed.length > 0 &&
    changed.every((p) => P4B2_PRIMARY_PATHS.has(p) || P4B2_CONDITIONAL_LINEAGE_PATHS.has(p) || P4C_EXACT_PATHS.has(p)) &&
    changed.length <= 10
);
assert(
  'P4-B2 test does not fake four-matrix visual GREEN',
  compositionTest.includes('SOURCE_ASSERTIONS_DO_NOT_PROVE_P4C_FOUR_MATRIX_VISUAL_GREEN')
);
assert(
  'P4-B2 test does not claim formal a11y certification',
  compositionTest.includes('P4B2_SOURCE_AND_RUNTIME_BASELINE_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION')
);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase4-account-personalhub-composition] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase4-account-personalhub-composition] OK');
console.log('[note] SOURCE_ASSERTIONS_DO_NOT_PROVE_P4C_FOUR_MATRIX_VISUAL_GREEN');
console.log('[note] P4B2_SOURCE_AND_RUNTIME_BASELINE_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION');
