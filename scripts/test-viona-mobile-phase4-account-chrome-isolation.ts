/**
 * Phase 4-A — Native Account chrome-first isolation.
 * Run: npx tsx scripts/test-viona-mobile-phase4-account-chrome-isolation.ts
 *
 * Structural assertions only. SOURCE ASSERTIONS DO NOT PROVE FOUR_MATRIX_VISUAL_GREEN
 * P4-A owns native Account chrome presentation and chip residual remediation.
 * P4-B / P4-C / P4-D / Option B fifth tab are not started.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MAIN_TAB } from '../src/navigation/routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const P4A_PRIMARY_PATHS = new Set([
  'scripts/test-viona-mobile-phase4-account-chrome-isolation.ts',
  'src/components/viona/VionaShellAccountLanguageActions.tsx',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
]);

const P4A_CONDITIONAL_DESCENDANT_PATHS = new Set([
  'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts',
  'scripts/test-viona-mobile-phase3-local-native-clear-premium-composition.ts',
  'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts',
  'scripts/test-viona-mobile-phase3-local-final-closure.ts',
]);

/** Exact P4-B1 native PersonalHub presentation-isolation descendant allowlist. */
const P4B1_EXACT_PATHS = new Set([
  'src/navigation/accountPresentationTarget.ts',
  'src/components/viona/VionaNativeAccountOpeningStage.tsx',
  'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts',
  'src/screens/CaNhanScreen.tsx',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
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

const chromeRel = 'src/components/viona/VionaShellAccountLanguageActions.tsx';
const p4aRel = 'scripts/test-viona-mobile-phase4-account-chrome-isolation.ts';
const phase1Rel = 'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts';
const p3dRel = 'scripts/test-viona-mobile-phase3-local-final-closure.ts';
const p3cRel = 'scripts/test-viona-mobile-phase3-local-native-responsive-refinement.ts';

assert('P4-A chrome presentation owner exists', existsSync(path.join(root, chromeRel)));
assert('P4-A targeted test exists', existsSync(path.join(root, p4aRel)));
assert('Phase 1 descendant test exists', existsSync(path.join(root, phase1Rel)));

const chrome = read(chromeRel);
const phase1 = read(phase1Rel);
const p4a = read(p4aRel);
const p3d = read(p3dRel);
const p3c = read(p3cRel);
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const profileSwitcher = read('src/components/ProfileSwitcher.tsx');
const personalHub = read('src/screens/CaNhanScreen.tsx');
const sosHold = read('src/components/viona/VionaSosHoldButton.tsx');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const sosModal = read('src/screens/b2c/SOSModal.tsx');
const sosShell = read('src/components/viona/VionaGlobalSosShellAction.tsx');
const i18nEn = read('src/i18n/locales/en.json');
const i18nVi = read('src/i18n/locales/vi.json');
const changed = mutationPaths();

assert(
  'P4-A native-gates Account chrome with Platform.OS !== web',
  chrome.includes("Platform.OS !== 'web'") &&
    chrome.includes('nativeBottomAccount') &&
    chrome.includes('nativeAccountChip') &&
    chrome.includes('nativeAccountLabel')
);
assert(
  'Web Account chrome default maxWidth 56 remains',
  /chip:\s*\{[\s\S]*maxWidth:\s*56/.test(chrome)
);
assert(
  'Web Account chrome default fontSize 8 remains',
  /label:\s*\{[\s\S]*fontSize:\s*8/.test(chrome)
);
assert(
  'native Account chip widens beyond the web 56 cap',
  chrome.includes('maxWidth: 128') && chrome.includes('nativeAccountChip')
);
assert(
  'native Account chip is not applied on left-rail / web overlay path',
  chrome.includes('isNative && !isLeftRail') && chrome.includes('chipRail')
);
assert('Account control remains a button', chrome.includes('accessibilityRole="button"'));
assert(
  'full Account accessibility name remains',
  chrome.includes("t('home.accountChipA11y')") && chrome.includes("t('home.accountChipShort')")
);
assert('Account hit target contract remains 44', chrome.includes('const MIN_TOUCH = 44') && chrome.includes('minHeight: MIN_TOUCH'));
assert('chrome still delegates Account press to onPressAccount', chrome.includes('onPressAccount()') && !chrome.includes("navigate('PersonalHub')"));
assert('chrome does not import SOS', !chrome.includes('SOSModal') && !chrome.includes('VionaGlobalSosShellAction') && !chrome.includes('triggerSafetyAssist'));
assert('chrome does not import PersonalHub screen', !chrome.includes('CaNhanScreen') && !chrome.includes('PersonalHub'));
assert('chrome has no AI provider', !chrome.includes('openai') && !chrome.includes('anthropic'));
assert('chrome has no payment/checkout', !chrome.includes('checkout') && !chrome.includes('Stripe'));

assert('Account chrome still PersonalHub in tab shell', mainTab.includes('openPersonalHub'));
assert('ProfileSwitcher still navigates PersonalHub', profileSwitcher.includes("navigate('PersonalHub')"));
assert('PersonalHub screen remains CaNhanScreen', personalHub.includes('ACCOUNT_CONTENT_MAX_WIDTH'));
assert('B2C Home tab unchanged', mainTab.includes('MAIN_TAB.B2C.home'));
assert('B2C Local tab unchanged', mainTab.includes('MAIN_TAB.B2C.local') && mainTab.includes("'Local'"));
assert('B2C Travel tab unchanged', mainTab.includes('MAIN_TAB.B2C.travel'));
assert('B2C Academy tab unchanged', mainTab.includes('MAIN_TAB.B2C.ai'));
assert('MAIN_TAB.B2C.home constant still exported', Boolean(MAIN_TAB.B2C.home));
assert('no fifth B2C Account tab constant', !('account' in MAIN_TAB.B2C) && !routes.includes('TabAccount'));
assert('MainTabNavigator still mounts canonical SOSModal', mainTab.includes("from '../screens/b2c/SOSModal'"));
assert(
  'exact-one SOSModal JSX in MainTabNavigator',
  (mainTab.match(/<SOSModal\b/g) ?? []).length === 1
);
assert(
  'SOS hold remains 3000',
  sosHold.includes('DEFAULT_HOLD_MS = 3000') || sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000')
);
assert('canonical SOSModal export remains', sosModal.includes('export function SOSModal'));
assert('SOS shell action file remains hold-gated', sosShell.includes('V7_SOS_HOLD_TO_TRIGGER_MS'));

assert('i18n Account short key remains', i18nEn.includes('"accountChipShort": "Me"') && i18nVi.includes('"accountChipShort": "Tài khoản"'));
assert('i18n Account a11y key remains', i18nEn.includes('"accountChipA11y": "Open account hub"'));

assert('Phase 1 descendant names PHASE4_A_ACCOUNT_CHROME_DESCENDANT_ALLOWED', phase1.includes('PHASE4_A_ACCOUNT_CHROME_DESCENDANT_ALLOWED'));
assert('Phase 1 descendant includes P4-A chrome', phase1.includes(chromeRel));
assert('Phase 1 descendant includes P4-A test', phase1.includes(p4aRel));

assert('P3-D final-closure TEST still exists', existsSync(path.join(root, p3dRel)) && p3d.includes('P3-D final-closure TEST exists'));
assert(
  'P3-D still does not claim formal a11y certification',
  p3d.includes('SOURCE_AND_REUSED_VISUAL_EVIDENCE_DO_NOT_CONSTITUTE_FORMAL_ACCESSIBILITY_CERTIFICATION')
);
assert('P3-C still does not prove visual GREEN', p3c.includes('SOURCE ASSERTIONS DO NOT PROVE VISUAL GREEN'));
assert('P3 Local composition not in P4-A mutation', !changed.includes('src/components/viona/native-local/VionaNativeLocalClearPremiumComposition.tsx'));
assert('LocalScreen not in P4-A mutation', !changed.includes('src/screens/b2c/LocalScreen.tsx'));
assert('MainTabNavigator not in P4-A mutation', !changed.includes('src/navigation/MainTabNavigator.tsx'));
assert(
  'CaNhanScreen may be mutated only as the exact P4-B1 presentation-isolation path',
  !changed.includes('src/screens/CaNhanScreen.tsx') ||
    (P4B1_EXACT_PATHS.has('src/screens/CaNhanScreen.tsx') &&
      changed.includes('src/navigation/accountPresentationTarget.ts') &&
      changed.includes('src/components/viona/VionaNativeAccountOpeningStage.tsx') &&
      changed.includes('scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts'))
);
assert('i18n en not in P4-A mutation', !changed.includes('src/i18n/locales/en.json'));
assert('i18n vi not in P4-A mutation', !changed.includes('src/i18n/locales/vi.json'));
assert('SOSModal not in P4-A mutation', !changed.includes('src/screens/b2c/SOSModal.tsx'));
assert('App.tsx not in P4-A mutation', !changed.includes('App.tsx'));
assert('routes.ts not in P4-A mutation', !changed.includes('src/navigation/routes.ts'));
assert('package.json not in P4-A mutation', !changed.includes('package.json'));

assert(
  'P4-B1 isolation exists',
  existsSync(path.join(root, 'src/navigation/accountPresentationTarget.ts')) &&
    existsSync(path.join(root, 'src/components/viona/VionaNativeAccountOpeningStage.tsx')) &&
    existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-personalhub-presentation-isolation.ts'))
);
assert(
  'P4-B not started',
  !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-personalhub-composition.ts')) &&
    !existsSync(path.join(root, 'src/components/viona/native-account/VionaNativeAccountClearPremiumComposition.tsx'))
);
assert(
  'P4-C not started',
  !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-responsive-refinement.ts'))
);
assert(
  'P4-D not started',
  !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-final-closure.ts'))
);
assert('Option B fifth-tab test not started', !existsSync(path.join(root, 'scripts/test-viona-mobile-phase4-account-fifth-tab.ts')));

assert('exact P4-A primary allowlist size', P4A_PRIMARY_PATHS.size === 3);
assert(
  'exact P4-A or exact P4-B1 mutable-path contract',
  changed.length > 0 &&
    changed.every(
      (p) => P4A_PRIMARY_PATHS.has(p) || P4A_CONDITIONAL_DESCENDANT_PATHS.has(p) || P4B1_EXACT_PATHS.has(p)
    ) &&
    changed.length <= 10
);
assert('P4-A primary chrome path is part of mutation or committed set', P4A_PRIMARY_PATHS.has(chromeRel));
assert('P4-A test does not fake four-matrix visual GREEN', p4a.includes('SOURCE ASSERTIONS DO NOT PROVE FOUR_MATRIX_VISUAL_GREEN'));

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase4-account-chrome-isolation] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase4-account-chrome-isolation] OK');
console.log('[note] SOURCE ASSERTIONS DO NOT PROVE FOUR_MATRIX_VISUAL_GREEN');
