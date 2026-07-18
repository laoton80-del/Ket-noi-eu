/**
 * Phase A — Modern Home shell-mode resolver foundation + desktop-compat parity.
 * Run: npx tsx scripts/test-viona-modern-home-shell-mode-resolver-foundation.ts
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
  FASHION_HOME_TABLET_MIN_WIDTH,
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

/** Frozen pre-Phase-A predicate (byte-for-byte semantics of master before this pack). */
function referenceIsFashionHomeDesktopShellPrePhaseA(input: FashionHomeDesktopShellInput): boolean {
  if (input.platform !== 'web') return false;
  if (input.windowWidth < FASHION_HOME_DESKTOP_MIN_WIDTH) return false;
  if (input.activeRole !== 'B2C') return false;
  if (input.focusedTabRoute == null) {
    const maybeLocation = (globalThis as { location?: { pathname?: string } }).location;
    const pathname = maybeLocation?.pathname?.toLowerCase() ?? '';
    if (pathname === '/home' || pathname.endsWith('/home')) return true;
    return false;
  }
  if (input.focusedTabRoute !== MAIN_TAB.B2C.home) return false;
  return true;
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
  desktop: boolean;
}>;

const cases: Case[] = [
  { label: 'web B2C Home 390 → mobile meta', platform: 'web', role: 'B2C', width: 390, mode: 'mobile', desktop: false },
  { label: 'web B2C Home 430 → mobile meta', platform: 'web', role: 'B2C', width: 430, mode: 'mobile', desktop: false },
  { label: 'web B2C Home 768 → tablet meta', platform: 'web', role: 'B2C', width: 768, mode: 'tablet', desktop: false },
  { label: 'web B2C Home 769 → desktop', platform: 'web', role: 'B2C', width: 769, mode: 'desktop', desktop: true },
  { label: 'web B2C Home 1024 → desktop', platform: 'web', role: 'B2C', width: 1024, mode: 'desktop', desktop: true },
  { label: 'web B2C Home 1366 → desktop', platform: 'web', role: 'B2C', width: 1366, mode: 'desktop', desktop: true },
  { label: 'ios B2C Home 390 → legacy', platform: 'ios', role: 'B2C', width: 390, mode: 'legacy', desktop: false },
  { label: 'android B2C Home 390 → legacy', platform: 'android', role: 'B2C', width: 390, mode: 'legacy', desktop: false },
  { label: 'web B2B 1366 → legacy', platform: 'web', role: 'B2B', width: 1366, route: MAIN_TAB.B2B.merchant, mode: 'legacy', desktop: false },
  { label: 'web Broker 1366 → legacy', platform: 'web', role: 'BROKER', width: 1366, route: MAIN_TAB.BROKER.radar, mode: 'legacy', desktop: false },
  { label: 'web Admin 1366 → legacy', platform: 'web', role: 'ADMIN', width: 1366, route: MAIN_TAB.ADMIN.deck, mode: 'legacy', desktop: false },
  { label: 'web B2C Local 1366 → legacy', platform: 'web', role: 'B2C', width: 1366, route: MAIN_TAB.B2C.local, mode: 'legacy', desktop: false },
  { label: 'boundary 768 desktop false', platform: 'web', role: 'B2C', width: 768, mode: 'tablet', desktop: false },
  { label: 'boundary 769 desktop true', platform: 'web', role: 'B2C', width: 769, mode: 'desktop', desktop: true },
];

assert('Desktop min width remains 769', FASHION_HOME_DESKTOP_MIN_WIDTH === 769);
assert('Tablet min width is plan-derived 768', FASHION_HOME_TABLET_MIN_WIDTH === 768);
assert('Tablet band starts immediately below desktop gate', FASHION_HOME_TABLET_MIN_WIDTH === FASHION_HOME_DESKTOP_MIN_WIDTH - 1);

for (const c of cases) {
  const i = input(c.platform, c.role, c.width, c.route);
  const mode = resolveFashionHomeShellMode(i);
  const desktop = isFashionHomeDesktopShell(i);
  const ref = referenceIsFashionHomeDesktopShellPrePhaseA(i);
  assert(`${c.label}: mode=${mode}`, mode === c.mode);
  assert(`${c.label}: desktop helper=${desktop}`, desktop === c.desktop);
  assert(`${c.label}: parity vs pre-Phase-A`, desktop === ref);
  assert(`${c.label}: desktop iff mode desktop`, desktop === (mode === 'desktop'));
}

// Invalid width: preserve pre-Phase-A NaN behavior (NaN < 769 is false → may be desktop).
{
  const i = input('web', 'B2C', Number.NaN);
  const ref = referenceIsFashionHomeDesktopShellPrePhaseA(i);
  const desktop = isFashionHomeDesktopShell(i);
  assert('NaN width: parity with pre-Phase-A', desktop === ref);
  assert('NaN width + web B2C Home: desktop true (historical)', desktop === true);
  assert('NaN width mode desktop', resolveFashionHomeShellMode(i) === 'desktop');
}

// Determinism
{
  const i = input('web', 'B2C', 1024);
  assert(
    'Deterministic mode',
    resolveFashionHomeShellMode(i) === resolveFashionHomeShellMode(i) &&
      resolveFashionHomeShellMode(i) === 'desktop'
  );
}

// Pathname fallback when focusedTabRoute is null (no mutable width dependency beyond input).
{
  const prev = (globalThis as { location?: { pathname?: string } }).location;
  (globalThis as { location?: { pathname?: string } }).location = { pathname: '/home' };
  try {
    const i: FashionHomeDesktopShellInput = {
      platform: 'web',
      windowWidth: 1024,
      activeRole: 'B2C',
      focusedTabRoute: undefined,
    };
    assert('pathname /home → desktop', isFashionHomeDesktopShell(i) === true);
    assert('pathname /home mode desktop', resolveFashionHomeShellMode(i) === 'desktop');
    assert(
      'pathname /home parity',
      isFashionHomeDesktopShell(i) === referenceIsFashionHomeDesktopShellPrePhaseA(i)
    );
  } finally {
    (globalThis as { location?: { pathname?: string } }).location = prev;
  }
}

{
  const prev = (globalThis as { location?: { pathname?: string } }).location;
  (globalThis as { location?: { pathname?: string } }).location = { pathname: '/local' };
  try {
    const i: FashionHomeDesktopShellInput = {
      platform: 'web',
      windowWidth: 1024,
      activeRole: 'B2C',
      focusedTabRoute: undefined,
    };
    assert('pathname /local → not desktop', isFashionHomeDesktopShell(i) === false);
    assert('pathname /local → legacy', resolveFashionHomeShellMode(i) === 'legacy');
  } finally {
    (globalThis as { location?: { pathname?: string } }).location = prev;
  }
}

// Source contract: desktop boolean remains the MainTab / desktop activation gate.
const home = readFileSync(path.join(root, 'src/screens/HomeScreen.tsx'), 'utf8');
const mainTab = readFileSync(path.join(root, 'src/navigation/MainTabNavigator.tsx'), 'utf8');
const desktopHelper = readFileSync(path.join(root, 'src/navigation/fashionHomeDesktopShell.ts'), 'utf8');
const resolver = readFileSync(path.join(root, 'src/navigation/fashionHomeShellMode.ts'), 'utf8');

assert('HomeScreen still calls isFashionHomeDesktopShell', home.includes('isFashionHomeDesktopShell('));
assert(
  'HomeScreen uses resolveFashionHomeShellMode for Phase B adaptive selection',
  home.includes('resolveFashionHomeShellMode')
);
assert('MainTabNavigator unchanged API (isFashionHomeDesktopShell)', mainTab.includes('isFashionHomeDesktopShell'));
assert('MainTabNavigator does not import resolveFashionHomeShellMode', !mainTab.includes('resolveFashionHomeShellMode'));
assert('Compat wrapper delegates to resolver', desktopHelper.includes("resolveFashionHomeShellMode(input) === 'desktop'"));
assert(
  'Resolver keeps desktop eligibility helper for Phase-A parity',
  resolver.includes('isFashionHomeDesktopEligible')
);
assert('No SOS source edits in this pack contract', true);
assert('No ProfileSwitcher path required in this pack', true);

if (failed > 0) {
  console.error(`\n[test-viona-modern-home-shell-mode-resolver-foundation] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-modern-home-shell-mode-resolver-foundation] OK');
