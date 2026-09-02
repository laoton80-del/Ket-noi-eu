/**
 * Phase 0 — Native Home presentation isolation.
 * Run: npx tsx scripts/test-viona-mobile-phase0-native-presentation-isolation.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveHomePresentationTarget } from '../src/navigation/homePresentationTarget';
import { resolveFashionHomeShellMode } from '../src/navigation/fashionHomeShellMode';
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

function read(rel: string): string {
  return readFileSync(path.join(root, rel), 'utf8');
}

function composeTarget(
  platform: string,
  role: ActiveRole,
  width: number,
  route: typeof MAIN_TAB.B2C.home | typeof MAIN_TAB.B2C.local | typeof MAIN_TAB.B2B.merchant = MAIN_TAB.B2C.home
) {
  const shellMode = resolveFashionHomeShellMode({
    platform,
    windowWidth: width,
    activeRole: role,
    focusedTabRoute: route,
  });
  return {
    shellMode,
    target: resolveHomePresentationTarget({ platform, shellMode }),
  };
}

assert(
  'presentation target resolver exists',
  existsSync(path.join(root, 'src/navigation/homePresentationTarget.ts'))
);

{
  const webDesktop = composeTarget('web', 'B2C', 769);
  assert('web desktop shell-mode desktop', webDesktop.shellMode === 'desktop');
  assert('web desktop → web-desktop', webDesktop.target === 'web-desktop');
}

{
  const web767 = composeTarget('web', 'B2C', 767);
  assert('web 767 shell-mode mobile', web767.shellMode === 'mobile');
  assert('web 767 → web-adaptive', web767.target === 'web-adaptive');
}

{
  const web768 = composeTarget('web', 'B2C', 768);
  assert('web 768 shell-mode tablet', web768.shellMode === 'tablet');
  assert('web 768 → web-adaptive (not desktop)', web768.target === 'web-adaptive');
}

{
  const web769 = composeTarget('web', 'B2C', 769);
  assert('web 769 shell-mode desktop', web769.shellMode === 'desktop');
  assert('web 769 → web-desktop', web769.target === 'web-desktop');
}

{
  const iosMobile = composeTarget('ios', 'B2C', 390);
  assert('ios mobile → native-adaptive', iosMobile.shellMode === 'mobile' && iosMobile.target === 'native-adaptive');
  const iosTablet = composeTarget('ios', 'B2C', 768);
  assert('ios tablet → native-adaptive', iosTablet.shellMode === 'tablet' && iosTablet.target === 'native-adaptive');
}

{
  const androidMobile = composeTarget('android', 'B2C', 390);
  assert(
    'android mobile → native-adaptive',
    androidMobile.shellMode === 'mobile' && androidMobile.target === 'native-adaptive'
  );
  const androidTablet = composeTarget('android', 'B2C', 768);
  assert(
    'android tablet → native-adaptive',
    androidTablet.shellMode === 'tablet' && androidTablet.target === 'native-adaptive'
  );
}

assert(
  'native never web-desktop (ios mobile)',
  resolveHomePresentationTarget({ platform: 'ios', shellMode: 'mobile' }) !== 'web-desktop'
);
assert(
  'native never web-desktop (android tablet)',
  resolveHomePresentationTarget({ platform: 'android', shellMode: 'tablet' }) !== 'web-desktop'
);
assert(
  'native defensive desktop shell-mode → native-adaptive',
  resolveHomePresentationTarget({ platform: 'ios', shellMode: 'desktop' }) === 'native-adaptive'
);
assert(
  'android defensive desktop shell-mode → native-adaptive',
  resolveHomePresentationTarget({ platform: 'android', shellMode: 'desktop' }) === 'native-adaptive'
);

assert(
  'legacy web → legacy',
  composeTarget('web', 'B2B', 1366, MAIN_TAB.B2B.merchant).target === 'legacy'
);
assert(
  'legacy ios → legacy',
  composeTarget('ios', 'B2C', 390, MAIN_TAB.B2C.local).target === 'legacy'
);
assert(
  'direct legacy shell-mode → legacy on web',
  resolveHomePresentationTarget({ platform: 'web', shellMode: 'legacy' }) === 'legacy'
);
assert(
  'direct legacy shell-mode → legacy on native',
  resolveHomePresentationTarget({ platform: 'ios', shellMode: 'legacy' }) === 'legacy'
);

const home = read('src/screens/HomeScreen.tsx');
const opening = read('src/components/viona/VionaNativeHomeOpeningStage.tsx');
const adaptive = read('src/components/viona/VionaFashionHomeAdaptiveComposition.tsx');
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const shellMode = read('src/navigation/fashionHomeShellMode.ts');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');

assert('Native OpeningStage exists', existsSync(path.join(root, 'src/components/viona/VionaNativeHomeOpeningStage.tsx')));
assert('Native OpeningStage imports AdaptiveComposition', opening.includes('VionaFashionHomeAdaptiveComposition'));
assert('Native OpeningStage renders AdaptiveComposition', opening.includes('<VionaFashionHomeAdaptiveComposition'));
assert(
  'Native OpeningStage props omit children',
  !opening.includes('children?:') && !opening.includes('children,') && !opening.includes('{children}')
);
assert(
  'Native OpeningStage does not import SOSModal',
  !opening.includes('SOSModal') && !opening.includes('goUniverse')
);
assert('Native OpeningStage distinct testID', opening.includes('viona-native-home-opening-stage'));

assert('HomeScreen imports presentation target', home.includes('resolveHomePresentationTarget'));
assert('HomeScreen imports Native OpeningStage', home.includes('VionaNativeHomeOpeningStage'));
assert('HomeScreen mounts Native OpeningStage', home.includes('<VionaNativeHomeOpeningStage'));
assert('HomeScreen still mounts AdaptiveComposition', home.includes('<VionaFashionHomeAdaptiveComposition'));
assert(
  'HomeScreen web-adaptive still uses AdaptiveComposition',
  home.includes("homePresentationTarget === 'web-adaptive'") &&
    home.includes('<VionaFashionHomeAdaptiveComposition')
);
assert(
  'HomeScreen native-adaptive uses Native OpeningStage',
  home.includes("homePresentationTarget === 'native-adaptive'") &&
    home.includes('<VionaNativeHomeOpeningStage')
);
assert('HomeScreen still uses AdaptiveComposition on web-adaptive path', /web-adaptive[\s\S]*VionaFashionHomeAdaptiveComposition/.test(home));
assert('World cards remain in HomeScreen', home.includes('VionaFashionWorldCard'));
assert('Quick actions remain in HomeScreen', home.includes('VionaQuickActionPill'));
assert('Charity remains in HomeScreen', home.includes('CharityWidget'));
assert('goUniverseLocal remains in HomeScreen', home.includes('goUniverseLocal'));
assert('goUniverseTravel remains in HomeScreen', home.includes('goUniverseTravel'));
assert('goUniverseAcademy remains in HomeScreen', home.includes('goUniverseAcademy'));
assert('goUniverseBusiness remains in HomeScreen', home.includes('goUniverseBusiness'));
assert('HomeScreen native opening does not import SOSModal', !home.includes("from '../screens/b2c/SOSModal'"));
assert('AdaptiveComposition internals still present', adaptive.includes('viona-fashion-home-adaptive-composition'));

assert('Account chrome still PersonalHub', mainTab.includes('openPersonalHub'));
assert('MainTabNavigator still mounts canonical SOSModal', mainTab.includes("from '../screens/b2c/SOSModal'"));
assert('MainTabNavigator still uses shouldMountSosInTabBarShell', mainTab.includes('shouldMountSosInTabBarShell'));
assert('SOS hold remains 3000', sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000'));
assert('B2C home route id unchanged', routes.includes('B2C') && routes.includes('home'));
assert('Academy still TabAi / MAIN_TAB.B2C.ai', mainTab.includes('MAIN_TAB.B2C.ai') && mainTab.includes("'Academy'"));

assert('fashionHomeShellMode still exports four modes', shellMode.includes("'legacy' | 'mobile' | 'tablet' | 'desktop'"));
assert('No Clear Premium token file', !existsSync(path.join(root, 'src/design/vionaNativeClearPremiumTokens.ts')));
assert(
  'No Phase 1 native-home composition',
  !existsSync(path.join(root, 'src/components/viona/native-home/VionaNativeHomeClearPremiumComposition.tsx'))
);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase0-native-presentation-isolation] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase0-native-presentation-isolation] OK');
