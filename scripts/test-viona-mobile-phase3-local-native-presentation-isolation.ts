/**
 * Phase 3-A — Native Local presentation isolation (parity host, not P3-B restyle).
 * Run: npx tsx scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LOCAL_WEB_DESKTOP_WIDTH_EXCLUSIVE,
  resolveLocalPresentationTarget,
} from '../src/navigation/localPresentationTarget';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const P3A_EXACT_PATHS = new Set([
  'src/navigation/localPresentationTarget.ts',
  'src/components/viona/VionaNativeLocalOpeningStage.tsx',
  'scripts/test-viona-mobile-phase3-local-native-presentation-isolation.ts',
  'src/screens/b2c/LocalScreen.tsx',
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

assert(
  'local presentation target mapper exists',
  existsSync(path.join(root, 'src/navigation/localPresentationTarget.ts'))
);
assert(
  'native Local opening stage exists',
  existsSync(path.join(root, 'src/components/viona/VionaNativeLocalOpeningStage.tsx'))
);

{
  const ios = resolveLocalPresentationTarget({ platform: 'ios', windowWidth: 390 });
  const android = resolveLocalPresentationTarget({ platform: 'android', windowWidth: 390 });
  const androidTablet = resolveLocalPresentationTarget({ platform: 'android', windowWidth: 1024 });
  assert('ios phone → native-adaptive', ios === 'native-adaptive');
  assert('android phone → native-adaptive', android === 'native-adaptive');
  assert('android tablet wide → native-adaptive (never web-desktop)', androidTablet === 'native-adaptive');
}

{
  const webPhone = resolveLocalPresentationTarget({ platform: 'web', windowWidth: 390 });
  const webTablet = resolveLocalPresentationTarget({ platform: 'web', windowWidth: 768 });
  const webDesktop = resolveLocalPresentationTarget({
    platform: 'web',
    windowWidth: LOCAL_WEB_DESKTOP_WIDTH_EXCLUSIVE + 1,
  });
  const webWide = resolveLocalPresentationTarget({ platform: 'web', windowWidth: 1280 });
  assert('web 390 → web-adaptive', webPhone === 'web-adaptive');
  assert('web 768 → web-adaptive (Local desktopWeb is width > 768)', webTablet === 'web-adaptive');
  assert('web 769 → web-desktop', webDesktop === 'web-desktop');
  assert('web 1280 → web-desktop', webWide === 'web-desktop');
}

assert(
  'native never web-desktop (ios 1280)',
  resolveLocalPresentationTarget({ platform: 'ios', windowWidth: 1280 }) === 'native-adaptive'
);
assert(
  'legacy / unknown platform → legacy',
  resolveLocalPresentationTarget({ platform: 'windows', windowWidth: 1024 }) === 'legacy'
);
assert(
  'Local web-desktop threshold is exclusive 768, not Travel 1024',
  LOCAL_WEB_DESKTOP_WIDTH_EXCLUSIVE === 768
);

const mapper = read('src/navigation/localPresentationTarget.ts');
const opening = read('src/components/viona/VionaNativeLocalOpeningStage.tsx');
const local = read('src/screens/b2c/LocalScreen.tsx');
const layout = read('src/components/viona/local/LocalOpeningStageLayout.tsx');
const homeMapper = read('src/navigation/homePresentationTarget.ts');
const travelMapper = read('src/navigation/travelPresentationTarget.ts');
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const sosHold = read('src/components/viona/VionaSosHoldButton.tsx');
const sosVisibility = read('src/navigation/vionaGlobalSosShellVisibility.ts');
const phase1 = read('scripts/test-viona-mobile-phase1-clear-premium-native-home.ts');
const changed = mutationPaths();

assert('mapper is not native UI (no react-native View)', !mapper.includes("from 'react-native'"));
assert(
  'mapper does not import Home mapper',
  !mapper.includes("from './homePresentationTarget'") &&
    !mapper.includes("from '../navigation/homePresentationTarget'")
);
assert(
  'mapper does not import Travel mapper',
  !mapper.includes("from './travelPresentationTarget'") &&
    !mapper.includes("from '../navigation/travelPresentationTarget'")
);
assert('Home mapper was not overloaded for Local', !homeMapper.includes('LocalPresentation') && !homeMapper.includes('resolveLocal'));
assert('Travel mapper was not overloaded for Local', !travelMapper.includes('LocalPresentation') && !travelMapper.includes('resolveLocal'));
assert('opening stage has native Local testID', opening.includes('viona-native-local-opening-stage'));
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
assert('opening stage does not import SOSModal', !opening.includes('SOSModal') && !opening.includes('triggerSafetyAssist'));
assert('opening stage does not import openMiniApp / Leona', !opening.includes('openMiniApp') && !opening.includes('b2cAiCallAssistant'));
assert(
  'opening stage does not import native-local composition',
  !opening.includes("from './native-local") && !opening.includes("from '../native-local")
);
assert(
  'P3-B native-local composition is not introduced',
  !existsSync(path.join(root, 'src/components/viona/native-local')) &&
    !local.includes('VionaNativeLocalClearPremiumComposition') &&
    !opening.includes('ClearPremium')
);
assert('opening stage does not own classifieds/credits', !opening.includes('VIP_POSTING_COST_VIG') && !opening.includes('reserveAndCommitCredits'));
assert('opening stage does not own feature flags', !opening.includes('getFeatureFlags'));
assert('opening stage does not own PersonalHub', !opening.includes('PersonalHub'));
assert('mapper has no AI/cost/auth/commercial behavior', !mapper.includes('openai') && !mapper.includes('anthropic') && !mapper.includes('reserveAndCommitCredits'));

assert('LocalScreen imports presentation target', local.includes('resolveLocalPresentationTarget'));
assert('LocalScreen imports Native Local OpeningStage', local.includes('VionaNativeLocalOpeningStage'));
assert(
  'LocalScreen native-adaptive uses opening-stage mount seam',
  local.includes("target === 'native-adaptive'") && local.includes('VionaNativeLocalOpeningStage')
);
assert(
  'LocalScreen still mounts LocalOpeningStageLayout (current presentation remains represented)',
  local.includes('<LocalOpeningStageLayout')
);
assert(
  'Web/shared path still uses LocalOpeningStageLayout without requiring P3-B',
  local.includes('LocalOpeningStageLayout') && layout.includes('LocalDynamicHero')
);
assert('LocalOpeningStageLayout remains shared hero/cards/quick-actions owner', layout.includes('LocalHeroCardsRow') && layout.includes('LocalQuickActionsRow'));
assert(
  'native host wraps current opening-stage children rather than replacing them',
  local.includes('<VionaNativeLocalOpeningStage>{openingStage}</VionaNativeLocalOpeningStage>') ||
    (local.includes('<VionaNativeLocalOpeningStage>') && local.includes('<LocalOpeningStageLayout'))
);
assert('LocalScreen still owns VionaMiniAppShell / PremiumAppShell', local.includes('<PremiumAppShell') || local.includes('VionaMiniAppShell'));
assert('LocalScreen remains domain owner of requests', local.includes("navigate('LocalUserRequestStatus')"));
assert('LocalScreen remains domain owner of classifieds', local.includes('scrollToClassifieds') && local.includes('LocalClassifiedsFeaturedPreview'));
assert('LocalScreen remains domain owner of VIP 120 VIG', local.includes('VIP_POSTING_COST_VIG = 120') && local.includes('reserveAndCommitCredits'));
assert('LocalScreen remains domain owner of legal/demo booking', local.includes('runUltraMasterBookingWithAlerts'));
assert('LocalScreen remains domain owner of merchant tools', local.includes('LocalMerchantToolsSection'));
assert('LocalScreen remains domain owner of connected universes', local.includes('LocalConnectedUniverseLinks'));
assert('LocalScreen remains domain owner of Account', local.includes('PersonalHub') && local.includes('openAccountHub'));
assert('LocalScreen remains domain owner of SOS hold-gate', local.includes('VionaSosHoldGateModal') && local.includes('openSafetyAssist'));
assert('LocalScreen still has latent legal scan handlers', local.includes('onLegalScannerPress'));
assert('LocalScreen still owns language sheet', local.includes('SmartTrioLanguageSheet') || local.includes('openLanguageSheet'));
assert('LocalScreen still owns escape bar', local.includes('VionaBottomEscapeBar'));
assert('desktopWeb threshold remains width > 768', local.includes('width > 768'));
assert('native Local still does not hide the four-tab bar', local.includes("if (Platform.OS !== 'web')") && local.includes('LOCAL_HIDDEN_TAB_BAR_STYLE'));
assert('NO_FUNCTION_REMOVAL: browse still routes to TabLocal via openServiceHub', local.includes("openMiniApp('local'") && local.includes("'TabLocal'"));
assert('NO_FUNCTION_REMOVAL: DailyReward community events remain', local.includes("navigate('DailyReward')"));
assert('NO_FUNCTION_REMOVAL: AI receptionist demo remains', local.includes("'AiReceptionistDemoSimulator'"));
assert('Local is not REAL_SEARCH (no live query component in host)', !opening.includes('searchQuery') && !opening.includes('REAL_SEARCH'));
assert('no LocalFixer claimed as Local capability', !local.includes('LocalFixer'));

assert('B2C Home tab unchanged', routes.includes('B2C') && mainTab.includes('MAIN_TAB.B2C.home'));
assert('B2C Local tab unchanged', mainTab.includes('MAIN_TAB.B2C.local') && mainTab.includes("'Local'"));
assert('B2C Travel tab unchanged', mainTab.includes('MAIN_TAB.B2C.travel') && mainTab.includes("'Travel'"));
assert('B2C Academy tab unchanged', mainTab.includes('MAIN_TAB.B2C.ai') && mainTab.includes("'Academy'"));
assert('Account chrome still PersonalHub', mainTab.includes('openPersonalHub'));
assert('MainTabNavigator still mounts canonical SOSModal', mainTab.includes("from '../screens/b2c/SOSModal'"));
assert('Local does not mount tab-bar SOS', sosVisibility.includes('MAIN_TAB.B2C.local') && sosVisibility.includes('return false'));
assert('SOS hold remains 3000', sosHold.includes('DEFAULT_HOLD_MS = 3000') || sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000'));
assert('Opening stage is not a second SOS host', !opening.includes('SOSModal') && !opening.includes('triggerSafetyAssist'));
assert('No new AI provider import in opening stage', !opening.includes('openai') && !opening.includes('anthropic'));
assert('No new AI provider import in mapper', !mapper.includes('openai') && !mapper.includes('anthropic'));
assert(
  'Phase 1 descendant guard names exact P3-A set',
  phase1.includes('PHASE3_A_LOCAL_ISOLATION_DESCENDANT_ALLOWED') &&
    phase1.includes('src/navigation/localPresentationTarget.ts') &&
    phase1.includes('src/components/viona/VionaNativeLocalOpeningStage.tsx')
);

assert(
  'exact five-path P3-A diff contract',
  changed.length > 0 && changed.every((p) => P3A_EXACT_PATHS.has(p))
);
assert(
  'no sixth mutation path',
  !changed.includes('src/components/viona/local/LocalOpeningStageLayout.tsx') &&
    !changed.some((p) => p.startsWith('src/components/viona/native-local/')) &&
    !changed.includes('package.json') &&
    !changed.includes('App.tsx') &&
    !changed.includes('src/navigation/MainTabNavigator.tsx')
);
assert(
  'no token/asset mutation',
  !changed.includes('src/design/vionaNativeClearPremiumTokens.ts') &&
    !changed.some((p) => p.startsWith('assets/') || p.startsWith('src/assets/'))
);

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase3-local-native-presentation-isolation] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase3-local-native-presentation-isolation] OK');
