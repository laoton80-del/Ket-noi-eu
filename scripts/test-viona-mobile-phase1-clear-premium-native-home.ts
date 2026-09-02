/**
 * Phase 1 — Clear Premium native Home.
 * Run: npx tsx scripts/test-viona-mobile-phase1-clear-premium-native-home.ts
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveHomePresentationTarget } from '../src/navigation/homePresentationTarget';
import { resolveFashionHomeShellMode } from '../src/navigation/fashionHomeShellMode';
import { MAIN_TAB } from '../src/navigation/routes';
import type { ActiveRole } from '../src/store/userStore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const ALLOWED = new Set([
  'src/design/vionaNativeClearPremiumTokens.ts',
  'src/components/viona/native-home/VionaNativeHomeClearPremiumComposition.tsx',
  'src/components/viona/native-home/VionaNativeHomeHeader.tsx',
  'src/components/viona/native-home/VionaNativeHomePrimaryEntry.tsx',
  'src/components/viona/native-home/VionaNativeUniverseLauncher.tsx',
  'src/components/viona/native-home/VionaNativeQuickActions.tsx',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
  'src/components/viona/VionaNativeHomeOpeningStage.tsx',
  'src/screens/HomeScreen.tsx',
  'scripts/test-viona-mobile-phase0-native-presentation-isolation.ts',
]);

/** Exact Phase 1 descendant lineage: orientation unlock + landscape residual stabilization. */
const PHASE1_DESCENDANT_ALLOWED = new Set([
  'app.config.js',
  'scripts/expo-readiness-check.mjs',
  'App.tsx',
  'src/navigation/MainTabNavigator.tsx',
  'src/screens/HomeScreen.tsx',
  'src/screens/b2c/LocalScreen.tsx',
  'scripts/test-viona-mobile-phase1-clear-premium-native-home.ts',
]);

const DENY = [
  'src/navigation/fashionHomeShellMode.ts',
  'src/navigation/MainTabNavigator.tsx',
  'src/navigation/routes.ts',
  'src/navigation/homePresentationTarget.ts',
  'src/components/viona/VionaFashionHomeAdaptiveComposition.tsx',
  'src/components/viona/VionaFashionWorldCard.tsx',
  'src/design/vionaTokens.ts',
  'src/design/premiumTileVisualTokens.ts',
  'src/screens/b2c/SOSModal.tsx',
  'src/components/premium/SOSShieldComponent.tsx',
  'package.json',
];

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

function gitLines(command: string): string[] {
  return execSync(command, { cwd: root, encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, '/'))
    .filter(Boolean);
}

function mutationPaths(): string[] {
  const live = [
    ...gitLines('git diff --name-only'),
    ...gitLines('git diff --cached --name-only'),
    ...gitLines('git ls-files --others --exclude-standard'),
  ];
  const uniqueLive = [...new Set(live)];
  if (uniqueLive.length > 0) return uniqueLive;
  return gitLines('git diff --name-only HEAD^ HEAD');
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

function readNativeHomeDir(): string {
  const dir = path.join(root, 'src/components/viona/native-home');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.tsx') || name.endsWith('.ts'))
    .map((name) => read(`src/components/viona/native-home/${name}`))
    .join('\n');
}

assert(
  'Phase 0 presentation target exists',
  existsSync(path.join(root, 'src/navigation/homePresentationTarget.ts'))
);
assert(
  'Phase 0 OpeningStage exists',
  existsSync(path.join(root, 'src/components/viona/VionaNativeHomeOpeningStage.tsx'))
);

{
  const web767 = composeTarget('web', 'B2C', 767);
  assert('web 767 → web-adaptive', web767.shellMode === 'mobile' && web767.target === 'web-adaptive');
}
{
  const web768 = composeTarget('web', 'B2C', 768);
  assert('web 768 → web-adaptive', web768.shellMode === 'tablet' && web768.target === 'web-adaptive');
}
{
  const web769 = composeTarget('web', 'B2C', 769);
  assert('web 769 → web-desktop', web769.shellMode === 'desktop' && web769.target === 'web-desktop');
}
{
  const ios = composeTarget('ios', 'B2C', 390);
  const webMobile = composeTarget('web', 'B2C', 390);
  assert(
    'native-adaptive ≠ web-adaptive (ios)',
    ios.target === 'native-adaptive' && webMobile.target === 'web-adaptive'
  );
}
assert(
  'native never web-desktop',
  resolveHomePresentationTarget({ platform: 'ios', shellMode: 'desktop' }) === 'native-adaptive'
);

const home = read('src/screens/HomeScreen.tsx');
const opening = read('src/components/viona/VionaNativeHomeOpeningStage.tsx');
const composition = read('src/components/viona/native-home/VionaNativeHomeClearPremiumComposition.tsx');
const header = read('src/components/viona/native-home/VionaNativeHomeHeader.tsx');
const entry = read('src/components/viona/native-home/VionaNativeHomePrimaryEntry.tsx');
const launcher = read('src/components/viona/native-home/VionaNativeUniverseLauncher.tsx');
const quick = read('src/components/viona/native-home/VionaNativeQuickActions.tsx');
const tokens = read('src/design/vionaNativeClearPremiumTokens.ts');
const nativeHome = readNativeHomeDir() + '\n' + tokens;
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const changed = mutationPaths();

assert(
  'Web adaptive still mounts AdaptiveComposition',
  home.includes("homePresentationTarget === 'web-adaptive'") &&
    home.includes('<VionaFashionHomeAdaptiveComposition')
);
assert('Web adaptive WorldCard path remains', home.includes('<VionaFashionWorldCard'));
assert(
  'Clear Premium composition mounted only through OpeningStage',
  opening.includes('<VionaNativeHomeClearPremiumComposition') &&
    !home.includes('VionaNativeHomeClearPremiumComposition')
);
assert('OpeningStage distinct testID', opening.includes('viona-native-home-opening-stage'));
assert(
  'Composition distinct testID',
  composition.includes('viona-native-home-clear-premium-composition')
);

assert('goUniverseLocal defined once', (home.match(/const goUniverseLocal = /g) ?? []).length === 1);
assert('goUniverseTravel defined once', (home.match(/const goUniverseTravel = /g) ?? []).length === 1);
assert('goUniverseAcademy defined once', (home.match(/const goUniverseAcademy = /g) ?? []).length === 1);
assert('goUniverseBusiness defined once', (home.match(/const goUniverseBusiness = /g) ?? []).length === 1);

assert('native-home has no getFeatureFlags', !nativeHome.includes('getFeatureFlags'));
assert(
  'native-home has no direct navigation ownership',
  !nativeHome.includes('useNavigation') && !nativeHome.includes("from '../../../navigation/routes'")
);
assert(
  'native-home has no PersonalHub / openAccount',
  !nativeHome.includes('PersonalHub') && !nativeHome.includes('openAccount')
);
assert('native-home has no SOSModal', !nativeHome.includes('SOSModal'));
assert('native-home has no V7_SOS_HOLD', !nativeHome.includes('V7_SOS_HOLD'));
assert('openSosEntry remains upstream', home.includes('const openSosEntry = useCallback'));
assert('Ask uses askVisible', entry.includes('askVisible') && home.includes('askVisible: featureFlags.leonaAssistantEnabled'));
assert('Ask uses existing Leona callback', home.includes("onAsk: () => openProtected('LeonaCall')"));
assert(
  'Find contains no query/results API',
  !entry.includes('useState') && !entry.includes('fetch(') && !entry.includes('searchQuery')
);
assert(
  'Find does not route to TravelFlightSearch',
  !entry.includes("navigate('TravelFlightSearch')") &&
    !nativeHome.includes("navigate('TravelFlightSearch')") &&
    home.includes('onFind: goUniverseLocal')
);
assert(
  'native-home does not import fashionTech',
  !/from ['"][^'"]*vionaTokens['"]/.test(nativeHome) && !nativeHome.includes('vionaTokens.fashionTech')
);
assert(
  'native-home does not import premiumTileVisualTokens',
  !nativeHome.includes('premiumTileVisualTokens')
);
assert(
  'Native tokens do not import fashionTech',
  !tokens.includes("from './vionaTokens'") &&
    !tokens.includes('premiumTileVisualTokens') &&
    !tokens.includes('vionaTokens.fashionTech')
);
assert('Find onFind is goUniverseLocal', home.includes('onFind: goUniverseLocal'));
assert(
  'Find label is Local entry, not multi-universe search copy',
  home.includes("findLabel: t('home.fashionTech.local.title')") &&
    !home.includes("findLabel: `${t('home.fashionTech.local.title')}, ${t('home.fashionTech.travel.title')}, ${t('home.fashionTech.academy.title')}`")
);
assert(
  'Find a11y is not global Explore VIONA',
  !home.includes("findA11yLabel: t('home.fashionTech.ctaExplore')") &&
    home.includes("t('home.worldStage.local.status')")
);
assert(
  'More does not use Explore VIONA',
  !home.includes("moreLabel: t('home.fashionTech.ctaExplore')") && home.includes('moreLabel: nativeHomeMoreLabel')
);
assert(
  'Native safety uses existing quickActions.safety wording',
  home.includes("id === 'safety' ? t('home.quickActions.safety')")
);
assert('Shared web safety chip label remains sos.chip', home.includes("label: t('sos.chip')"));
assert('Native header omits duplicate clock cue', home.includes("localeCue: '',"));
assert('Ask gating remains leonaAssistantEnabled', home.includes('askVisible: featureFlags.leonaAssistantEnabled'));
assert(
  'Native tablet uses stretch width rather than phone column cap',
  home.includes("homePresentationTarget === 'native-adaptive' && fashionHomeShellMode === 'tablet'") &&
    home.includes("? 'stretch'")
);

for (const id of [
  'bookServices',
  'travelLite',
  'learning',
  'documents',
  'quickTranslate',
  'aiAssistant',
  'nearbySupport',
  'safety',
]) {
  assert(`quick-action id ${id} remains constructed`, home.includes(`id: '${id}'`));
}

assert('More includes overflow items', quick.includes("priority === 'overflow'") && quick.includes('overflow.map'));
assert(
  'No Companion module',
  !existsSync(path.join(root, 'src/components/viona/native-home/VionaNativeCompanionModule.tsx'))
);
assert(
  'No Discovery module',
  !existsSync(path.join(root, 'src/components/viona/native-home/VionaNativeDiscoverySection.tsx'))
);
assert('Charity remains HomeScreen sibling', home.includes('<CharityWidget'));
assert('mode + isLandscape drive layout', composition.includes("layout.mode === 'tablet' || layout.isLandscape"));
assert('Phone portrait structure 2×2', launcher.includes('viona-native-universe-launcher-cols-2'));
assert('Landscape/tablet structure 4-across', launcher.includes('viona-native-universe-launcher-cols-4'));
assert('Reduced-motion semantics', launcher.includes('reduceMotion') && composition.includes('layout.reduceMotion'));
assert('Launcher accessibility labels', launcher.includes('accessibilityLabel={item.accessibilityLabel}'));
assert('Quick-action accessibility labels', quick.includes('accessibilityLabel={item.accessibilityLabel}'));
assert('Header has no Account control', !header.includes('openAccount') && !header.includes('PersonalHub'));
assert('Launcher has exactly four universe ids in type', launcher.includes("'local' | 'travel' | 'academy' | 'business'"));
assert('HomeScreen skips shared WorldCard host on native-adaptive', home.includes("homePresentationTarget !== 'native-adaptive'"));
assert(
  'HomeScreen skips shared quick strip on native-adaptive',
  home.includes('featureFlags.hubEnabled && homePresentationTarget !== \'native-adaptive\'')
);
assert('SOS hold remains 3000', sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000'));
assert('Account chrome still PersonalHub', mainTab.includes('openPersonalHub'));
assert('B2C Academy tab unchanged', mainTab.includes('MAIN_TAB.B2C.ai') && mainTab.includes("'Academy'"));

{
  const appRoot = read('App.tsx');
  const local = read('src/screens/b2c/LocalScreen.tsx');
  const appConfig = read('app.config.js');
  assert(
    'canonical Expo orientation remains default',
    /orientation:\s*'default'/.test(appConfig) && !/orientation:\s*'portrait'/.test(appConfig)
  );
  assert(
    'native landscape root full-bleed is platform-guarded',
    appRoot.includes("Platform.OS !== 'web' && width > height") &&
      appRoot.includes('nativeLandscapeFullBleed')
  );
  assert('web large-screen rule unchanged', appRoot.includes("Platform.OS === 'web' && width > 768"));
  assert(
    'native two-band host reserves layout (not absolute overlay)',
    mainTab.includes('nativeBottomShellHost') &&
      mainTab.includes('nativeTwoBandShellHeight') &&
      /nativeBottomShellHost:\s*\{[^}]*position:\s*'relative'/.test(mainTab)
  );
  assert(
    'native Local does not hide the four-tab bar',
    local.includes("if (Platform.OS !== 'web')") && local.includes('LOCAL_HIDDEN_TAB_BAR_STYLE')
  );
}

assert('mutation path is original Phase 1 allowlist or explicit descendant contract', changed.every((p) => ALLOWED.has(p) || PHASE1_DESCENDANT_ALLOWED.has(p) || p.length === 0));
for (const denied of DENY) {
  if (PHASE1_DESCENDANT_ALLOWED.has(denied)) continue;
  assert(`${denied} absent from mutation`, !changed.includes(denied));
}
assert('no package.json mutation', !changed.includes('package.json') && !changed.includes('package-lock.json'));
assert(
  'no asset modifications',
  !changed.some((p) => p.startsWith('assets/') || p.startsWith('src/assets/'))
);
assert(
  'allowed create files exist',
  ALLOWED.has('src/design/vionaNativeClearPremiumTokens.ts') &&
    existsSync(path.join(root, 'src/design/vionaNativeClearPremiumTokens.ts')) &&
    existsSync(path.join(root, 'src/components/viona/native-home/VionaNativeHomeClearPremiumComposition.tsx'))
);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase1-clear-premium-native-home] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase1-clear-premium-native-home] OK');
