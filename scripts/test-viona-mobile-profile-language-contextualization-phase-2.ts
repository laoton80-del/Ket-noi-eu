/**
 * Phase 2 — Mobile profile/language contextualization contract tests.
 * Run: npx tsx scripts/test-viona-mobile-profile-language-contextualization-phase-2.ts
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  shouldMountSosInTabBarShell,
} from '../src/navigation/vionaGlobalSosShellVisibility';
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

const mainTab = readFileSync(path.join(root, 'src/navigation/MainTabNavigator.tsx'), 'utf8');
const profileSwitcher = readFileSync(path.join(root, 'src/components/ProfileSwitcher.tsx'), 'utf8');
const shellActions = readFileSync(
  path.join(root, 'src/components/viona/VionaShellAccountLanguageActions.tsx'),
  'utf8'
);
const languageChip = readFileSync(
  path.join(root, 'src/components/smartTrio/SmartTrioLanguageChip.tsx'),
  'utf8'
);
const sosShell = readFileSync(
  path.join(root, 'src/components/viona/VionaGlobalSosShellAction.tsx'),
  'utf8'
);
const sosVisibility = readFileSync(
  path.join(root, 'src/navigation/vionaGlobalSosShellVisibility.ts'),
  'utf8'
);
const sosFloating = readFileSync(path.join(root, 'src/components/SOSFloatingButton.tsx'), 'utf8');

// --- Exact-one host matrix (chrome mount aligns with SOS chrome surfaces) ---
assert(
  'B2C Home mounts shell chrome (account/language host gate)',
  shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.home,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'B2C Local suppresses shell chrome (rail owns account/language)',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.local,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'B2C Travel suppresses shell chrome',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.travel,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'B2C Academy suppresses shell chrome',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.ai,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'Fashion Home suppresses shell chrome (command bar owns)',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.home,
    fashionHomeDesktopShell: true,
  })
);
assert(
  'B2B mounts shell chrome',
  shouldMountSosInTabBarShell({
    role: 'B2B',
    focusedTabRoute: MAIN_TAB.B2B.merchant,
    fashionHomeDesktopShell: false,
  })
);

// --- MainTabNavigator mount contract ---
assert('Mounts VionaShellAccountLanguageActions', mainTab.includes('VionaShellAccountLanguageActions'));
assert('Bottom account/language slot', mainTab.includes('viona-shell-account-language-bottom-slot'));
assert('Left-rail account/language slot', mainTab.includes('viona-shell-account-language-left-rail-slot'));
assert('Always suppresses ProfileSwitcher floating chrome', /suppressFloatingChrome\s*\/>/.test(mainTab) || /suppressFloatingChrome\s*\n/.test(mainTab) || mainTab.includes('suppressFloatingChrome'));
assert('suppressFloatingChrome is unconditional (not fashion-only)', !mainTab.includes('suppressFloatingChrome={fashionHomeDesktopShell}'));
assert('Shell language sheet gate uses mountShellLanguageSheet', mainTab.includes('mountShellLanguageSheet'));
assert('SmartTrioLanguageSheet still mounted for shell', mainTab.includes('SmartTrioLanguageSheet'));
assert('ProfileSwitcher ref retained for PersonalHub/role', mainTab.includes('profileSwitcherRef'));
assert('HomeCommand openAccount preserved', mainTab.includes('openPersonalHub'));
assert('HomeCommand openRolePicker preserved', mainTab.includes('openRolePicker'));

// No absolute floating ProfileSwitcher mount from MainTab (component still mounted for modals/ref).
assert('ProfileSwitcher still mounted once', (mainTab.match(/<ProfileSwitcher\b/g) ?? []).length === 1);

// --- ProfileSwitcher: floating presentation gated ---
assert('ProfileSwitcher still exports handle openPersonalHub', profileSwitcher.includes('openPersonalHub'));
assert('ProfileSwitcher still exports handle openRolePicker', profileSwitcher.includes('openRolePicker'));
assert('ProfileSwitcher still navigates PersonalHub', profileSwitcher.includes("navigate('PersonalHub')"));
assert('ProfileSwitcher keeps role modal + switchRole', profileSwitcher.includes('switchRole'));
assert('ProfileSwitcher sheet language chip retained', profileSwitcher.includes('placement="sheet"'));
assert(
  'Floating language chip only when not suppressed',
  profileSwitcher.includes('hideLegacyFloatingChrome')
);

// --- Shell actions component ---
assert('Shell actions testID', shellActions.includes('viona-shell-account-language-actions'));
assert('Account action testID', shellActions.includes('viona-shell-account-action'));
assert('Language action testID', shellActions.includes('viona-shell-language-action'));
assert('Role action testID', shellActions.includes('viona-shell-role-action'));
assert('Min touch 44', shellActions.includes('MIN_TOUCH = 44'));
assert('No absolute overlay in shell actions', !/position:\s*['"]absolute['"]/.test(shellActions));
assert('No backend/provider in shell actions', !/fetch\(|axios|twilio|Linking\.openURL/.test(shellActions));

// --- Floating language chip still exists but is not the shell host ---
assert('SmartTrioLanguageChip floating placement type retained', languageChip.includes("'floating'"));
assert('SmartTrioLanguageChip can suppress floating', languageChip.includes('suppressFloating'));

// --- SOS Phase-1 freeze ---
assert('SOS visibility helper unchanged import surface', sosVisibility.includes('shouldMountSosInTabBarShell'));
assert('SOS shell action hold constant', sosShell.includes('V7_SOS_HOLD_TO_TRIGGER_MS'));
assert('SOS bottom chip host retained', mainTab.includes('viona-sos-tab-bar-host'));
assert('SOS left-rail host retained', mainTab.includes('viona-sos-left-rail-host'));
assert('SOS left-rail slot retained', mainTab.includes('viona-sos-left-rail-slot'));
assert('Canonical SOSModal mount count = 1', (mainTab.match(/<SOSModal\b/g) ?? []).length === 1);
assert('No SOSFloatingButton absolute mount in MainTab', !mainTab.includes('<SOSFloatingButton'));
assert('SOSFloatingButton remains non-absolute delegate', !/position:\s*['"]absolute['"]/.test(sosFloating));

if (failed > 0) {
  console.error(`\n[test-viona-mobile-profile-language-contextualization-phase-2] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-profile-language-contextualization-phase-2] OK');
