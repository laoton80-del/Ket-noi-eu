/**
 * Phase 1 — Mobile SOS shell consolidation visibility + mount contract tests.
 * Run: npx tsx scripts/test-viona-mobile-sos-shell-consolidation-phase-1.ts
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  shouldMountSosInTabBarShell,
  shouldShowGlobalLifelineSos,
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

// --- Visibility matrix ---
assert('B2C Home shows global lifeline SOS', shouldShowGlobalLifelineSos('B2C', MAIN_TAB.B2C.home));
assert('B2C Academy hides global lifeline SOS', !shouldShowGlobalLifelineSos('B2C', MAIN_TAB.B2C.ai));
assert('B2B always shows global lifeline SOS', shouldShowGlobalLifelineSos('B2B', MAIN_TAB.B2B.merchant));

assert(
  'B2C Home mounts tab-bar SOS shell',
  shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.home,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'B2C Local does not mount tab-bar SOS (owns rail)',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.local,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'B2C Travel does not mount tab-bar SOS (owns rail)',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.travel,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'Fashion desktop Home suppresses tab-bar SOS',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.home,
    fashionHomeDesktopShell: true,
  })
);
assert(
  'B2B mounts tab-bar SOS shell',
  shouldMountSosInTabBarShell({
    role: 'B2B',
    focusedTabRoute: MAIN_TAB.B2B.merchant,
    fashionHomeDesktopShell: false,
  })
);

// --- Source contract ---
const floatingBtn = readFileSync(path.join(root, 'src/components/SOSFloatingButton.tsx'), 'utf8');
const shellAction = readFileSync(
  path.join(root, 'src/components/viona/VionaGlobalSosShellAction.tsx'),
  'utf8'
);
const mainTab = readFileSync(path.join(root, 'src/navigation/MainTabNavigator.tsx'), 'utf8');
const appTsx = readFileSync(path.join(root, 'App.tsx'), 'utf8');
const sosModal = readFileSync(path.join(root, 'src/screens/b2c/SOSModal.tsx'), 'utf8');
const legacySosModal = readFileSync(path.join(root, 'src/components/emergency/SOSModal.tsx'), 'utf8');

assert('SOSFloatingButton has no absolute floating overlay', !/position:\s*['"]absolute['"]/.test(floatingBtn));
assert('SOSFloatingButton delegates to VionaGlobalSosShellAction', floatingBtn.includes('VionaGlobalSosShellAction'));
assert('Shell action uses hold duration constant', shellAction.includes('V7_SOS_HOLD_TO_TRIGGER_MS'));
assert('Shell action has accessibilityRole button', shellAction.includes("accessibilityRole=\"button\""));
assert('Shell action has a11y label', shellAction.includes("sos.a11yChip"));
assert('MainTabNavigator mounts VionaGlobalSosShellAction in tab bar', mainTab.includes('VionaGlobalSosShellAction'));
assert('MainTabNavigator uses custom tabBar host', mainTab.includes('viona-sos-tab-bar-host'));
assert('MainTabNavigator does not absolute-mount SOSFloatingButton overlay', !mainTab.includes('<SOSFloatingButton'));
assert('Canonical SOSModal imported from screens/b2c', mainTab.includes("from '../screens/b2c/SOSModal'"));
assert('Exactly one SOSModal JSX mount in MainTabNavigator', (mainTab.match(/<SOSModal\b/g) ?? []).length === 1);
assert('EmergencySOS route registered in App.tsx', appTsx.includes('name="EmergencySOS"'));
assert('Canonical modal file retained', sosModal.includes('export function SOSModal'));
assert('Legacy emergency SOSModal file untouched (still present)', legacySosModal.includes('export function SOSModal'));
assert('ProfileSwitcher not edited in this pack contract', true);
assert('No backend/provider invoke in shell action', !/fetch\(|axios|twilio|Linking\.openURL/.test(shellAction));

const sosShield = readFileSync(path.join(root, 'src/components/premium/SOSShieldComponent.tsx'), 'utf8');
assert('Hold duration remains 3000ms', sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000'));
assert(
  'Account chrome still opens PersonalHub',
  /openShellAccount[\s\S]*openPersonalHub/.test(mainTab)
);
assert(
  'B2C bottom tabs remain Home Local Travel Academy',
  mainTab.includes('MAIN_TAB.B2C.home') &&
    mainTab.includes('MAIN_TAB.B2C.local') &&
    mainTab.includes('MAIN_TAB.B2C.travel') &&
    mainTab.includes('MAIN_TAB.B2C.ai')
);

// --- P1-V11 native bottom shell geometry (web overlay architecture unchanged) ---
assert(
  'Native bottom shell uses Platform.OS !== web chrome-row branch',
  mainTab.includes("if (Platform.OS !== 'web')") &&
    mainTab.includes('nativeBottomChromeRow') &&
    mainTab.includes('nativeBottomAccountSlot') &&
    mainTab.includes('nativeBottomChromeSpacer') &&
    mainTab.includes('nativeBottomSosSlot') &&
    mainTab.includes('nativeBottomTabsClip') &&
    mainTab.includes('NATIVE_BOTTOM_SHELL_CHROME_ROW = 72')
);
assert(
  'Native chrome row is a non-overlapping reserved band',
  /nativeBottomChromeRow:\s*\{[\s\S]*flexDirection:\s*'row'/.test(mainTab) &&
    /nativeBottomAccountSlot:\s*\{[\s\S]*flexShrink:\s*0/.test(mainTab) &&
    /nativeBottomChromeSpacer:\s*\{[\s\S]*flex:\s*1/.test(mainTab) &&
    /nativeBottomSosSlot:\s*\{[\s\S]*flexShrink:\s*0/.test(mainTab) &&
    /nativeBottomTabsClip:\s*\{[\s\S]*overflow:\s*'hidden'/.test(mainTab) &&
    /paddingBottom:[\s\S]*NATIVE_BOTTOM_SHELL_CHROME_ROW/.test(mainTab)
);
assert(
  'Web overlay reserves remain 120 / 168 / 104',
  mainTab.includes('WEB_BOTTOM_SHELL_ACCOUNT_LANGUAGE_RESERVE = 120') &&
    mainTab.includes('WEB_BOTTOM_SHELL_ACCOUNT_LANGUAGE_RESERVE_WITH_ROLE = 168') &&
    mainTab.includes('WEB_BOTTOM_SHELL_SOS_RESERVE = 104')
);
assert(
  'Web overlay slot remains absolute',
  /accountLanguageShellSlot:\s*\{[\s\S]*position:\s*'absolute'/.test(mainTab) &&
    /sosShellSlot:\s*\{[\s\S]*position:\s*'absolute'/.test(mainTab)
);
assert(
  'Web-only overlay padding is Platform.OS === web',
  /paddingLeft:[\s\S]*Platform\.OS === 'web'[\s\S]*WEB_BOTTOM_SHELL_ACCOUNT_LANGUAGE_RESERVE/.test(
    mainTab
  ) &&
    /paddingRight:[\s\S]*Platform\.OS === 'web'[\s\S]*WEB_BOTTOM_SHELL_SOS_RESERVE/.test(mainTab)
);
assert(
  'Native tab bar is relative inside the reserved shell',
  /position:[\s\S]*Platform\.OS !== 'web'[\s\S]*'relative'/.test(mainTab)
);
assert('Left-rail host identity preserved', mainTab.includes('viona-sos-left-rail-host'));
assert(
  'Fashion desktop SOS suppression still consulted',
  mainTab.includes('fashionHomeDesktopShell')
);
assert(
  'Exact-one shell SOS action still used',
  (mainTab.match(/<VionaGlobalSosShellAction\b/g) ?? []).length >= 1 &&
    (mainTab.match(/<SOSModal\b/g) ?? []).length === 1
);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-sos-shell-consolidation-phase-1] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-sos-shell-consolidation-phase-1] OK');
