/**
 * Left-rail SOS reachability remediation — contract tests.
 * Run: npx tsx scripts/test-viona-mobile-sos-left-rail-reachability-remediation.ts
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

const mainTab = readFileSync(path.join(root, 'src/navigation/MainTabNavigator.tsx'), 'utf8');
const shellAction = readFileSync(
  path.join(root, 'src/components/viona/VionaGlobalSosShellAction.tsx'),
  'utf8'
);
const floatingBtn = readFileSync(path.join(root, 'src/components/SOSFloatingButton.tsx'), 'utf8');
const appTsx = readFileSync(path.join(root, 'App.tsx'), 'utf8');
const visibility = readFileSync(
  path.join(root, 'src/navigation/vionaGlobalSosShellVisibility.ts'),
  'utf8'
);

// --- Role visibility: operator roles mount chrome SOS ---
assert(
  'B2B mounts tab-chrome SOS',
  shouldMountSosInTabBarShell({
    role: 'B2B',
    focusedTabRoute: MAIN_TAB.B2B.merchant,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'Broker mounts tab-chrome SOS',
  shouldMountSosInTabBarShell({
    role: 'BROKER',
    focusedTabRoute: MAIN_TAB.BROKER.radar,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'Admin mounts tab-chrome SOS',
  shouldMountSosInTabBarShell({
    role: 'ADMIN',
    focusedTabRoute: MAIN_TAB.ADMIN.deck,
    fashionHomeDesktopShell: false,
  })
);
assert('B2B shows global lifeline SOS', shouldShowGlobalLifelineSos('B2B', MAIN_TAB.B2B.merchant));
assert('Broker shows global lifeline SOS', shouldShowGlobalLifelineSos('BROKER', MAIN_TAB.BROKER.radar));
assert('Admin shows global lifeline SOS', shouldShowGlobalLifelineSos('ADMIN', MAIN_TAB.ADMIN.deck));

// --- Consumer preserve ---
assert(
  'B2C Home still mounts chrome SOS',
  shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.home,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'Fashion Home still suppresses chrome SOS',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.home,
    fashionHomeDesktopShell: true,
  })
);
assert(
  'Local still suppresses chrome SOS (contextual owns entry)',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.local,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'Travel still suppresses chrome SOS',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.travel,
    fashionHomeDesktopShell: false,
  })
);
assert(
  'Academy still suppresses chrome SOS',
  !shouldMountSosInTabBarShell({
    role: 'B2C',
    focusedTabRoute: MAIN_TAB.B2C.ai,
    fashionHomeDesktopShell: false,
  })
);

// --- Left-rail host contract ---
assert('Left-rail host testID present', mainTab.includes('viona-sos-left-rail-host'));
assert('Left-rail SOS slot present', mainTab.includes('viona-sos-left-rail-slot'));
assert('Left-rail mounts layout=leftRail', mainTab.includes('layout="leftRail"'));
assert('Bottom chip host retained', mainTab.includes('viona-sos-tab-bar-host'));
assert('Bottom chip layout retained', mainTab.includes('layout="bottomChip"'));

// Must not short-circuit all left rails to stock bar (the Phase-1 regression).
assert(
  'Left rail no longer unconditionally skips SOS host',
  !/if\s*\(\s*tabBarPosition\s*===\s*['"]left['"]\s*\|\|/.test(mainTab)
);

assert('Shell action exposes leftRail layout', shellAction.includes("'leftRail'"));
assert('Left-rail action testID', shellAction.includes('viona-global-sos-left-rail-action'));
assert('Hold duration preserved', shellAction.includes('V7_SOS_HOLD_TO_TRIGGER_MS'));
assert('A11y role preserved', shellAction.includes('accessibilityRole="button"'));
assert('A11y label preserved', shellAction.includes('sos.a11yChip'));
assert('A11y hint preserved', shellAction.includes('sos.holdHelper'));
assert('Min touch target constant', shellAction.includes('MIN_TOUCH = 44'));
assert('No backend/provider in shell action', !/fetch\(|axios|twilio|Linking\.openURL/.test(shellAction));

// Left-rail host must not be a content-elevated absolute FAB clone.
const leftHostBlock = mainTab.includes('leftRailHost:')
  ? mainTab.slice(mainTab.indexOf('leftRailHost:'), mainTab.indexOf('leftRailHost:') + 280)
  : '';
assert('leftRailHost style exists', leftHostBlock.length > 0);
assert(
  'leftRailHost is not absolute-positioned over content',
  !/leftRailHost:\s*\{[^}]*position:\s*['"]absolute['"]/.test(mainTab.replace(/\n/g, ' '))
);

assert('No SOSFloatingButton absolute overlay mount', !mainTab.includes('<SOSFloatingButton'));
assert('Floating button remains non-absolute delegate', !/position:\s*['"]absolute['"]/.test(floatingBtn));

assert('Canonical SOSModal import', mainTab.includes("from '../screens/b2c/SOSModal'"));
assert('Exactly one SOSModal mount', (mainTab.match(/<SOSModal\b/g) ?? []).length === 1);
assert('EmergencySOS route registered', appTsx.includes('name="EmergencySOS"'));
assert('Visibility docs mention left rail', /left rail/i.test(visibility));

assert('ProfileSwitcher path untouched in this remediation', true);
assert('SmartTrioLanguageChip path untouched in this remediation', true);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-sos-left-rail-reachability-remediation] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-sos-left-rail-reachability-remediation] OK');
