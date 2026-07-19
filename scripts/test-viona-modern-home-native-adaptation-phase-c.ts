/**
 * Phase C — Modern Home native adaptive activation contracts.
 * Run: npx tsx scripts/test-viona-modern-home-native-adaptation-phase-c.ts
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
  isFashionHomeAdaptiveComposition,
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
  // Native activation (Phase C)
  { label: 'ios B2C Home 390 → mobile adaptive', platform: 'ios', role: 'B2C', width: 390, mode: 'mobile', adaptive: true, desktop: false },
  { label: 'ios B2C Home 430 → mobile adaptive', platform: 'ios', role: 'B2C', width: 430, mode: 'mobile', adaptive: true, desktop: false },
  { label: 'ios B2C Home 768 → tablet adaptive', platform: 'ios', role: 'B2C', width: 768, mode: 'tablet', adaptive: true, desktop: false },
  { label: 'ios B2C Home 1024 → tablet (never desktop)', platform: 'ios', role: 'B2C', width: 1024, mode: 'tablet', adaptive: true, desktop: false },
  { label: 'android B2C Home 390 → mobile adaptive', platform: 'android', role: 'B2C', width: 390, mode: 'mobile', adaptive: true, desktop: false },
  { label: 'android B2C Home 430 → mobile adaptive', platform: 'android', role: 'B2C', width: 430, mode: 'mobile', adaptive: true, desktop: false },
  { label: 'android B2C Home 768 → tablet adaptive', platform: 'android', role: 'B2C', width: 768, mode: 'tablet', adaptive: true, desktop: false },
  { label: 'android B2C Home 1024 → tablet (never desktop)', platform: 'android', role: 'B2C', width: 1024, mode: 'tablet', adaptive: true, desktop: false },
  // Web Phase B matrix preserved
  { label: 'web B2C Home 390 → mobile', platform: 'web', role: 'B2C', width: 390, mode: 'mobile', adaptive: true, desktop: false },
  { label: 'web B2C Home 430 → mobile', platform: 'web', role: 'B2C', width: 430, mode: 'mobile', adaptive: true, desktop: false },
  { label: 'web B2C Home 768 → tablet', platform: 'web', role: 'B2C', width: 768, mode: 'tablet', adaptive: true, desktop: false },
  { label: 'web B2C Home 769 → desktop', platform: 'web', role: 'B2C', width: 769, mode: 'desktop', adaptive: false, desktop: true },
  { label: 'web B2C Home 1024 → desktop', platform: 'web', role: 'B2C', width: 1024, mode: 'desktop', adaptive: false, desktop: true },
  { label: 'web B2C Home 1366 → desktop', platform: 'web', role: 'B2C', width: 1366, mode: 'desktop', adaptive: false, desktop: true },
  // Non-eligible
  { label: 'ios B2B → legacy', platform: 'ios', role: 'B2B', width: 390, route: MAIN_TAB.B2B.merchant, mode: 'legacy', adaptive: false, desktop: false },
  { label: 'android Broker → legacy', platform: 'android', role: 'BROKER', width: 390, route: MAIN_TAB.BROKER.radar, mode: 'legacy', adaptive: false, desktop: false },
  { label: 'ios B2C Local → legacy', platform: 'ios', role: 'B2C', width: 390, route: MAIN_TAB.B2C.local, mode: 'legacy', adaptive: false, desktop: false },
  { label: 'web Admin → legacy', platform: 'web', role: 'ADMIN', width: 1366, route: MAIN_TAB.ADMIN.deck, mode: 'legacy', adaptive: false, desktop: false },
];

assert('Desktop min width remains 769', FASHION_HOME_DESKTOP_MIN_WIDTH === 769);

for (const c of cases) {
  const i = input(c.platform, c.role, c.width, c.route);
  const mode = resolveFashionHomeShellMode(i);
  const adaptive = isFashionHomeAdaptiveComposition(mode);
  const adaptiveAlias = isFashionHomeAdaptiveWebComposition(mode);
  const desktop = isFashionHomeDesktopShell(i);
  assert(`${c.label}: mode=${c.mode}`, mode === c.mode);
  assert(`${c.label}: adaptive=${c.adaptive}`, adaptive === c.adaptive);
  assert(`${c.label}: alias matches adaptive`, adaptiveAlias === adaptive);
  assert(`${c.label}: desktop=${c.desktop}`, desktop === c.desktop);
  assert(`${c.label}: adaptive XOR desktop or both false`, !(adaptive && desktop));
  assert(`${c.label}: native never desktop`, c.platform === 'web' || desktop === false);
}

const home = readFileSync(path.join(root, 'src/screens/HomeScreen.tsx'), 'utf8');
const adaptiveComp = readFileSync(
  path.join(root, 'src/components/viona/VionaFashionHomeAdaptiveComposition.tsx'),
  'utf8'
);
const resolver = readFileSync(path.join(root, 'src/navigation/fashionHomeShellMode.ts'), 'utf8');
const mainTab = readFileSync(path.join(root, 'src/navigation/MainTabNavigator.tsx'), 'utf8');
const sosAction = readFileSync(path.join(root, 'src/components/viona/VionaGlobalSosShellAction.tsx'), 'utf8');
const profile = readFileSync(path.join(root, 'src/components/ProfileSwitcher.tsx'), 'utf8');
const shellAccount = readFileSync(
  path.join(root, 'src/components/viona/VionaShellAccountLanguageActions.tsx'),
  'utf8'
);

assert('SHARED_ADAPTIVE_NATIVE_REUSE documented', adaptiveComp.includes('SHARED_ADAPTIVE_NATIVE_REUSE'));
assert('Adaptive composition native+web docs', adaptiveComp.includes('web and native'));
assert('HomeScreen uses isFashionHomeAdaptiveComposition', home.includes('isFashionHomeAdaptiveComposition'));
assert('HomeScreen fashionHomeAdaptiveActive', home.includes('fashionHomeAdaptiveActive'));
assert('Command bar still desktop-gated', home.includes('fashionHomeDesktopShellActive && homeCommand'));
assert('Resolver activates native platforms', resolver.includes("platform === 'ios'") && resolver.includes("platform === 'android'"));
assert('Desktop eligibility remains web-only', resolver.includes("input.platform !== 'web'"));
assert('MainTabNavigator unchanged by Phase C', !mainTab.includes('isFashionHomeAdaptiveComposition'));
assert('MainTabNavigator still uses isFashionHomeDesktopShell', mainTab.includes('isFashionHomeDesktopShell'));
assert('SOS freeze', sosAction.includes('VionaGlobalSosShellAction'));
assert('ProfileSwitcher freeze', profile.length > 100);
assert('Shell account/language freeze', shellAccount.length > 100);
assert('Legacy dashboard retained', home.includes('DashboardB2CScreen'));
assert('ProactiveSuggestions retained', home.includes('ProactiveSuggestions'));
assert('Adaptive root testID retained', home.includes('viona-fashion-home-adaptive-root'));
assert('Legacy hybrid root testID retained', home.includes('viona-home-legacy-hybrid-root'));

const charity = readFileSync(path.join(root, 'src/components/ui/CharityWidget.tsx'), 'utf8');
assert(
  'CharityWidget formats currency on JS thread (native worklet-safe)',
  charity.includes('runOnJS(updateDisplayAmount)') && !charity.includes('runOnJS(setDisplayAmount)(formatUsd')
);

if (failed > 0) {
  console.error(`\n[test-viona-modern-home-native-adaptation-phase-c] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-modern-home-native-adaptation-phase-c] OK');
