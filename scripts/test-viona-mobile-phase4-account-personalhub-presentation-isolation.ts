/**
 * Phase 4-B1 — Native PersonalHub presentation isolation (parity host, not P4-B2 restyle).
 * Run: npx tsx scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts
 *
 * P4B1_SOURCE_ASSERTIONS_PROVE_ISOLATION_CONTRACT_NOT_VISUAL_RESTYLE
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MAIN_TAB } from '../src/navigation/routes';
import {
  ACCOUNT_WEB_DESKTOP_WIDTH_EXCLUSIVE,
  resolveAccountPresentationTarget,
} from '../src/navigation/accountPresentationTarget';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const P4B1_PRIMARY_PATHS = new Set([
  'src/navigation/accountPresentationTarget.ts',
  'src/components/viona/VionaNativeAccountOpeningStage.tsx',
  'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts',
  'src/screens/CaNhanScreen.tsx',
]);

const P4B1_CONDITIONAL_PHASE1 = 'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts';

/** Exact descendant lineage witnesses authorized for the reconciled P4-B1 ten-path envelope. */
const P4B1_LINEAGE_WITNESS_PATHS = new Set([
  'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts',
  'scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts',
  'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts',
  'scripts/test-viona-mobile-phase3-local-final-closure.ts',
  'scripts/test-viona-mobile-phase4-account-chrome-isolation.ts',
]);

/** Exact P4-B2 composition descendant allowlist. Isolation remains valid after this lane. */
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
const p4b1Rel = 'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts';
const compositionRel = 'src/components/viona/native-account/VionaNativeAccountClearPremiumComposition.tsx';
const compositionTestRel = 'scripts/test-viona-mobile-phase4-account-personalhub-composition.ts';

assert('accountPresentationTarget exists', existsSync(path.join(root, mapperRel)));
assert('VionaNativeAccountOpeningStage exists', existsSync(path.join(root, openingRel)));
assert('P4-B1 targeted test exists', existsSync(path.join(root, p4b1Rel)));
assert('CaNhanScreen exists', existsSync(path.join(root, hubRel)));

const mapper = read(mapperRel);
const opening = read(openingRel);
const hub = read(hubRel);
const p4b1 = read(p4b1Rel);
const chrome = read('src/components/viona/VionaShellAccountLanguageActions.tsx');
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const profileSwitcher = read('src/components/ProfileSwitcher.tsx');
const sosHold = read('src/components/viona/VionaSosHoldButton.tsx');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const homeMapper = read('src/navigation/homePresentationTarget.ts');
const travelMapper = read('src/navigation/travelPresentationTarget.ts');
const localMapper = read('src/navigation/localPresentationTarget.ts');
const gdpr = read('src/components/compliance/GDPRDashboard.tsx');
const neon = read('src/components/account/AccountNeonGlassPanel.tsx');
const changed = mutationPaths();

{
  const ios = resolveAccountPresentationTarget({ platform: 'ios', windowWidth: 390 });
  const android = resolveAccountPresentationTarget({ platform: 'android', windowWidth: 390 });
  const androidTablet = resolveAccountPresentationTarget({ platform: 'android', windowWidth: 1024 });
  assert('ios phone → native-adaptive', ios === 'native-adaptive');
  assert('android phone → native-adaptive', android === 'native-adaptive');
  assert('android tablet wide → native-adaptive (never web-desktop)', androidTablet === 'native-adaptive');
}

assert(
  'native never web-desktop (ios 1280)',
  resolveAccountPresentationTarget({ platform: 'ios', windowWidth: 1280 }) === 'native-adaptive'
);
assert(
  'native never web-adaptive (android 390)',
  resolveAccountPresentationTarget({ platform: 'android', windowWidth: 390 }) === 'native-adaptive'
);
assert(
  'web 390 → web-adaptive',
  resolveAccountPresentationTarget({ platform: 'web', windowWidth: 390 }) === 'web-adaptive'
);
assert(
  'web 768 → web-adaptive (Account desktopWeb is width > 768)',
  resolveAccountPresentationTarget({ platform: 'web', windowWidth: 768 }) === 'web-adaptive'
);
assert(
  'web 769 → web-desktop',
  resolveAccountPresentationTarget({ platform: 'web', windowWidth: 769 }) === 'web-desktop'
);
assert(
  'web 1280 → web-desktop',
  resolveAccountPresentationTarget({ platform: 'web', windowWidth: 1280 }) === 'web-desktop'
);
assert(
  'legacy / unknown platform → legacy',
  resolveAccountPresentationTarget({ platform: 'windows', windowWidth: 1024 }) === 'legacy'
);
assert(
  'Account 768 exclusive desktop cue matches CaNhanScreen',
  ACCOUNT_WEB_DESKTOP_WIDTH_EXCLUSIVE === 768 && hub.includes('Platform.OS === \'web\' && width > 768')
);
assert('mapper is not native UI (no react-native View)', !mapper.includes("from 'react-native'") && !mapper.includes('<View'));
assert('mapper does not import Home mapper', !mapper.includes('homePresentationTarget') && !mapper.includes('resolveHome'));
assert('mapper does not import Travel mapper', !mapper.includes('travelPresentationTarget') && !mapper.includes('resolveTravel'));
assert('mapper does not import Local mapper', !mapper.includes('localPresentationTarget') && !mapper.includes('resolveLocal'));
assert('Home mapper was not overloaded for Account', !homeMapper.includes('AccountPresentation') && !homeMapper.includes('resolveAccount'));
assert('Travel mapper was not overloaded for Account', !travelMapper.includes('AccountPresentation') && !travelMapper.includes('resolveAccount'));
assert('Local mapper was not overloaded for Account', !localMapper.includes('AccountPresentation') && !localMapper.includes('resolveAccount'));
assert('mapper does not use Travel 1024 cue', !mapper.includes('1024'));
assert('mapper has no AI/cost/auth/commercial behavior', !mapper.includes('openai') && !mapper.includes('anthropic') && !mapper.includes('reserveAndCommitCredits'));
assert('mapper has no SOS', !mapper.includes('SOSModal') && !mapper.includes('triggerSafetyAssist'));
assert(
  'mapper has no navigation side effects',
  !mapper.includes('navigate(') && !mapper.includes('from \'@react-navigation') && !mapper.includes('from "@react-navigation')
);

assert('opening stage has native Account testID', opening.includes('viona-native-account-opening-stage'));
assert(
  'opening stage forwards children (parity host)',
  opening.includes('children') && opening.includes('{children}')
);
assert(
  'opening stage is not an empty placeholder',
  opening.includes('children: ReactNode') &&
    opening.includes('{children}') &&
    /<View[\s\S]*\{children\}[\s\S]*<\/View>/.test(opening)
);
assert('opening stage names CHILDREN_PASS_THROUGH contract', opening.includes('CHILDREN_PASS_THROUGH_OR_EXACT_EQUIVALENT_CURRENT_PRESENTATION'));
assert('opening stage names P4B1_PRESENTATION_PARITY_REQUIRED', opening.includes('P4B1_PRESENTATION_PARITY_REQUIRED'));
assert('opening stage does not import SOSModal', !opening.includes('SOSModal') && !opening.includes('triggerSafetyAssist'));
assert('opening stage does not own wallet', !opening.includes('useWalletState') && !opening.includes('navigate(\'Wallet\')'));
assert('opening stage does not own language', !opening.includes('persistUserLanguage') && !opening.includes('SmartTrio'));
assert('opening stage does not own role', !opening.includes('ProfileSwitcher') && !opening.includes('setMode'));
assert('opening stage does not own GDPR', !opening.includes('GDPRDashboard') && !opening.includes('executeRightToErasure'));
assert('opening stage does not own Business gating', !opening.includes('evaluateMerchantSurfaceAccess') && !opening.includes('B2BPaywall'));
assert(
  'opening stage does not import native-account composition',
  !opening.includes("from './native-account") &&
    !opening.includes("from '../native-account") &&
    !opening.includes('VionaNativeAccountClearPremiumComposition')
);
assert('opening stage has no AI provider', !opening.includes('openai') && !opening.includes('anthropic'));
assert('opening stage has no payment/checkout', !opening.includes('checkout') && !opening.includes('Stripe'));

assert('CaNhanScreen imports presentation target', hub.includes('resolveAccountPresentationTarget'));
assert('CaNhanScreen imports Native Account OpeningStage', hub.includes('VionaNativeAccountOpeningStage'));
assert(
  'CaNhanScreen native-adaptive uses opening-stage mount seam',
  hub.includes("accountPresentationTarget === 'native-adaptive'") &&
    hub.includes('<VionaNativeAccountOpeningStage>') &&
    hub.includes('</VionaNativeAccountOpeningStage>')
);
assert(
  'Web hub remains current PersonalHub presentation',
  hub.includes('const hub = (') &&
    hub.includes('<SafeAreaView style={styles.container}>') &&
    hub.includes('AccountNeonGlassPanel') &&
    hub.includes('IMG_ACCOUNT_CONSTELLATION') &&
    hub.includes('return hub')
);
assert('Web PersonalHub still uses AccountNeonGlassPanel', hub.includes('<AccountNeonGlassPanel') && neon.includes('export function AccountNeonGlassPanel'));
assert('Fashion-Tech constellation remains in CaNhanScreen', hub.includes('viona-account-global-net-bg-v2.png') && hub.includes('accountBackdropOpacity'));
assert('P4-B2 composition exists under isolation host', existsSync(path.join(root, compositionRel)));
assert('P4-B2 composition test exists', existsSync(path.join(root, compositionTestRel)));
assert(
  'opening stage is not Clear Premium composition owner',
  !opening.includes('VionaNativeAccountClearPremiumComposition') &&
    hub.includes('VionaNativeAccountClearPremiumComposition')
);
assert(
  'native composition is mounted by CaNhanScreen under native-adaptive',
  hub.includes('<VionaNativeAccountClearPremiumComposition') &&
    hub.includes("accountPresentationTarget === 'native-adaptive'")
);

assert('A01 chrome Account still PersonalHub', mainTab.includes('openPersonalHub') && profileSwitcher.includes("navigate('PersonalHub')"));
assert('A02 four tabs; Account not a tab', mainTab.includes('MAIN_TAB.B2C.home') && mainTab.includes('MAIN_TAB.B2C.local') && mainTab.includes('MAIN_TAB.B2C.travel') && mainTab.includes('MAIN_TAB.B2C.ai') && !('account' in MAIN_TAB.B2C) && !routes.includes('TabAccount'));
assert('A03 profile edit', hub.includes("navigate('SetupProfile', { mode: 'edit' })"));
assert('A04 pilot strip', hub.includes('accountHub.pilotStripTitle') && hub.includes('ACCOUNT_PILOT_PILLS'));
assert('A05 VIO snapshot', hub.includes('useWalletState') && hub.includes('creditsBalanceCurrent') && hub.includes('accountHub.creditsBadge'));
assert('A06 Wallet entry', hub.includes("navigate('Wallet')"));
assert('A07 virtual store -> Wallet', hub.includes('account-action-virtual-store') && hub.includes("navigate('Wallet')"));
assert('A08 B2B pricing gated', hub.includes("openMerchantRoute('B2BPaywall')") && hub.includes('evaluateMerchantSurfaceAccess'));
assert('A09 B2B workspace switch gated', hub.includes('openB2BWorkspaceSwitch') && hub.includes("setMode('B2B_MODE')"));
assert('A10 workspace hat', hub.includes('workspaceUiOverride') && hub.includes('account-action-workspace-hat'));
assert('A11 request inbox READ_ONLY', hub.includes("navigate('VionaRequestLiveInbox')") && hub.includes('no write/actions'));
assert('A12 Partner onboarding gated', hub.includes("openMerchantRoute('PartnerOnboarding')"));
assert('A13 identity rows', hub.includes('residencyStatusLabel') && hub.includes('visaTypeLabel') && hub.includes('subscriptionPlanLabel'));
assert('A14 language modal', hub.includes('persistUserLanguage') && hub.includes('setLanguageModalOpen'));
assert('A15 notifications DEMO', hub.includes('alertNotificationsTitle') && hub.includes('Alert.alert'));
assert('A16 privacy informational', hub.includes('alertPrivacyTitle') && hub.includes('privacyUrl'));
assert('A17 support informational', hub.includes('alertSupportTitle') && hub.includes('supportEmail'));
assert('A18 GDPR gated live workflow', hub.includes('<GDPRDashboard />') && gdpr.includes('executeRightToErasure'));
assert('A19 usage history', hub.includes('TrustHistoryCard') && hub.includes('loadUsageHistory'));
assert('A20 onboarding reset', hub.includes('resetGuidedOnboarding'));
assert('A21 admin unlock reset', hub.includes('ADMIN_UNLOCK_KEY') && hub.includes('Nội bộ QA'));
assert('A22 dev token action __DEV__ only', hub.includes('copyDevFirebaseIdToken') && (hub.includes('{__DEV__ ?') || hub.includes('showDevToken={__DEV__}')));
assert('A23 Diaspora restriction gate', hub.includes('DiasporaRestrictionModal') && hub.includes('vn_dial'));
assert('A24 role picker remains chrome-owned', profileSwitcher.includes('openRolePicker') && !hub.includes('ProfileSwitcher') && !hub.includes('openRolePicker'));
assert('A25 documents/Vault remains OUT_OF_SCOPE for PersonalHub', !hub.includes("navigate('Vault')"));
assert('A26 saved/favorites remains absent', !hub.includes('navigate(\'Saved') && !hub.includes('favorites'));
assert('A27 generic logout remains absent', !hub.includes('logout()') && gdpr.includes('logout'));
assert('A28 bottom escape bar remains absent', !hub.includes('VionaBottomEscapeBar'));
assert('A29 PersonalHub SOS host remains DENY', !hub.includes('SOSModal') && !hub.includes('VionaGlobalSosShellAction') && !opening.includes('SOSModal'));

assert('wallet snapshot remains display-only in hub', hub.includes('wallet.credits') && !hub.includes('reserveAndCommitCredits') && !hub.includes('topupCreditsServer'));
assert('wallet.ts not in P4-B1 mutation', !changed.includes('src/state/wallet.ts'));
assert('GDPRDashboard file not restyled in this lane', !changed.includes('src/components/compliance/GDPRDashboard.tsx'));
assert('AccountNeonGlassPanel not restyled in this lane', !changed.includes('src/components/account/AccountNeonGlassPanel.tsx'));
assert('language persist helper remains hub-owned', hub.includes("from '../i18n/persistLanguage'"));
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
assert('hub has no AI provider', !hub.includes('openai') && !hub.includes('anthropic'));
assert('hub has no Stripe checkout', !hub.includes('checkout') && !hub.includes('Stripe'));

assert('P4-C EXISTS', existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-responsive-refinement.ts')));
assert('P4-D EXISTS', existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-final-closure.ts')));
assert('Option B fifth-tab test not started', !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-fifth-tab.ts')));

assert('exact P4-B1 primary allowlist size', P4B1_PRIMARY_PATHS.size === 4);
assert(
  'exact P4-B1 mutable-path contract',
  changed.length > 0 &&
    changed.every(
      (p) =>
        P4B1_PRIMARY_PATHS.has(p) ||
        p === P4B1_CONDITIONAL_PHASE1 ||
        P4B1_LINEAGE_WITNESS_PATHS.has(p) ||
        P4B2_EXACT_PATHS.has(p) ||
        P4C_EXACT_PATHS.has(p) ||
        P4D_EXACT_PATHS.has(p)
    ) &&
    changed.length <= 10
);
assert('P4-B1 test does not fake visual restyle GREEN', p4b1.includes('P4B1_SOURCE_ASSERTIONS_PROVE_ISOLATION_CONTRACT_NOT_VISUAL_RESTYLE'));

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase4-account-personalhub-presentation-isolation] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase4-account-personalhub-presentation-isolation] OK');
console.log('[note] P4B1_SOURCE_ASSERTIONS_PROVE_ISOLATION_CONTRACT_NOT_VISUAL_RESTYLE');
