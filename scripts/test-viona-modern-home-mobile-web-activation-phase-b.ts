/**
 * Phase B — Modern Home mobile-web adaptive activation contracts.
 * Run: npx tsx scripts/test-viona-modern-home-mobile-web-activation-phase-b.ts
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FASHION_HOME_DESKTOP_MIN_WIDTH,
  isFashionHomeDesktopShell,
  type FashionHomeDesktopShellInput,
} from '../src/navigation/fashionHomeDesktopShell';
import {
  isFashionHomeAdaptiveWebComposition,
  resolveFashionHomeShellMode,
  type FashionHomeShellMode,
} from '../src/navigation/fashionHomeShellMode';
import { MAIN_TAB } from '../src/navigation/routes';
import type { ActiveRole } from '../src/store/userStore';

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

function input(
  platform: FashionHomeDesktopShellInput['platform'],
  role: ActiveRole,
  width: number,
  route: FashionHomeDesktopShellInput['focusedTabRoute'] = MAIN_TAB.B2C.home
): FashionHomeDesktopShellInput {
  return {
    platform,
    windowWidth: width,
    activeRole: role,
    focusedTabRoute: route,
  };
}

type Case = Readonly<{
  label: string;
  platform: FashionHomeDesktopShellInput['platform'];
  role: ActiveRole;
  width: number;
  route?: FashionHomeDesktopShellInput['focusedTabRoute'];
  mode: FashionHomeShellMode;
  adaptive: boolean;
  desktop: boolean;
}>;

const cases: Case[] = [
  { label: 'web B2C Home 390 → mobile adaptive', platform: 'web', role: 'B2C', width: 390, mode: 'mobile', adaptive: true, desktop: false },
  { label: 'web B2C Home 430 → mobile adaptive', platform: 'web', role: 'B2C', width: 430, mode: 'mobile', adaptive: true, desktop: false },
  { label: 'web B2C Home 768 → tablet adaptive', platform: 'web', role: 'B2C', width: 768, mode: 'tablet', adaptive: true, desktop: false },
  { label: 'web B2C Home 769 → desktop', platform: 'web', role: 'B2C', width: 769, mode: 'desktop', adaptive: false, desktop: true },
  { label: 'web B2C Home 1024 → desktop', platform: 'web', role: 'B2C', width: 1024, mode: 'desktop', adaptive: false, desktop: true },
  { label: 'web B2C Home 1366 → desktop', platform: 'web', role: 'B2C', width: 1366, mode: 'desktop', adaptive: false, desktop: true },
  { label: 'ios B2C Home 390 → legacy', platform: 'ios', role: 'B2C', width: 390, mode: 'legacy', adaptive: false, desktop: false },
  { label: 'android B2C Home 390 → legacy', platform: 'android', role: 'B2C', width: 390, mode: 'legacy', adaptive: false, desktop: false },
  { label: 'web B2B 1366 → legacy', platform: 'web', role: 'B2B', width: 1366, route: MAIN_TAB.B2B.merchant, mode: 'legacy', adaptive: false, desktop: false },
  { label: 'web Broker 1366 → legacy', platform: 'web', role: 'BROKER', width: 1366, route: MAIN_TAB.BROKER.radar, mode: 'legacy', adaptive: false, desktop: false },
  { label: 'web Admin 1366 → legacy', platform: 'web', role: 'ADMIN', width: 1366, route: MAIN_TAB.ADMIN.deck, mode: 'legacy', adaptive: false, desktop: false },
  {
    label: 'web B2C Local 1366 → legacy',
    platform: 'web',
    role: 'B2C',
    width: 1366,
    route: MAIN_TAB.B2C.local,
    mode: 'legacy',
    adaptive: false,
    desktop: false,
  },
];

assert('Desktop min width remains 769', FASHION_HOME_DESKTOP_MIN_WIDTH === 769);

for (const c of cases) {
  const i = input(c.platform, c.role, c.width, c.route);
  const mode = resolveFashionHomeShellMode(i);
  const adaptive = isFashionHomeAdaptiveWebComposition(mode);
  const desktop = isFashionHomeDesktopShell(i);
  assert(`${c.label}: mode=${c.mode}`, mode === c.mode);
  assert(`${c.label}: adaptive=${c.adaptive}`, adaptive === c.adaptive);
  assert(`${c.label}: desktop=${c.desktop}`, desktop === c.desktop);
  assert(`${c.label}: adaptive XOR desktop or both false`, !(adaptive && desktop));
}

const home = readFileSync(path.join(root, 'src/screens/HomeScreen.tsx'), 'utf8');
const adaptiveComp = readFileSync(
  path.join(root, 'src/components/viona/VionaFashionHomeAdaptiveComposition.tsx'),
  'utf8'
);
const mainTab = readFileSync(path.join(root, 'src/navigation/MainTabNavigator.tsx'), 'utf8');
const sosAction = readFileSync(path.join(root, 'src/components/viona/VionaGlobalSosShellAction.tsx'), 'utf8');
const profile = readFileSync(path.join(root, 'src/components/ProfileSwitcher.tsx'), 'utf8');
const shellAccount = readFileSync(
  path.join(root, 'src/components/viona/VionaShellAccountLanguageActions.tsx'),
  'utf8'
);

assert('Adaptive composition component exists', adaptiveComp.includes('viona-fashion-home-adaptive-composition'));
assert('HomeScreen mounts adaptive composition', home.includes('VionaFashionHomeAdaptiveComposition'));
assert('HomeScreen adaptive root testID', home.includes('viona-fashion-home-adaptive-root'));
assert('HomeScreen legacy hybrid root testID', home.includes('viona-home-legacy-hybrid-root'));
assert('Command bar still desktop-gated', home.includes('fashionHomeDesktopShellActive && homeCommand'));
assert('Adaptive does not hide via desktop predicate alone', home.includes('fashionHomeAdaptiveWebActive'));
assert('MainTabNavigator untouched by Phase B import of adaptive composition', !mainTab.includes('VionaFashionHomeAdaptiveComposition'));
assert('MainTabNavigator still uses isFashionHomeDesktopShell only for fashion hide', mainTab.includes('isFashionHomeDesktopShell'));
assert('SOS shell action file present (freeze)', sosAction.includes('VionaGlobalSosShellAction'));
assert('ProfileSwitcher present (freeze)', profile.includes('ProfileSwitcher') || profile.includes('function ProfileSwitcher') || profile.length > 100);
assert('Shell account/language actions present (freeze)', shellAccount.includes('VionaShellAccountLanguageActions') || shellAccount.includes('Open account'));
assert('Legacy dashboard accordion retained', home.includes('DashboardB2CScreen'));
assert('ProactiveSuggestions retained', home.includes('ProactiveSuggestions'));
assert('No simultaneous require of dual Home screens', !home.includes('DashboardB2CScreen') || home.includes('legacyDashboardExpanded'));

if (failed > 0) {
  console.error(`\n[test-viona-modern-home-mobile-web-activation-phase-b] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-modern-home-mobile-web-activation-phase-b] OK');
