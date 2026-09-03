/**
 * Phase 2-A — Native Travel presentation isolation (visual parity).
 * Run: npx tsx scripts/test-viona-mobile-phase2-travel-native-presentation-isolation.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveTravelPresentationTarget,
  TRAVEL_WEB_DESKTOP_MIN_WIDTH,
} from '../src/navigation/travelPresentationTarget';
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

function read(rel: string): string {
  return readFileSync(path.join(root, rel), 'utf8');
}

assert(
  'travel presentation target mapper exists',
  existsSync(path.join(root, 'src/navigation/travelPresentationTarget.ts'))
);
assert(
  'native Travel opening stage exists',
  existsSync(path.join(root, 'src/components/viona/VionaNativeTravelOpeningStage.tsx'))
);

{
  const ios = resolveTravelPresentationTarget({ platform: 'ios', windowWidth: 390 });
  const android = resolveTravelPresentationTarget({ platform: 'android', windowWidth: 390 });
  const androidTablet = resolveTravelPresentationTarget({ platform: 'android', windowWidth: 1024 });
  assert('ios phone → native-adaptive', ios === 'native-adaptive');
  assert('android phone → native-adaptive', android === 'native-adaptive');
  assert('android tablet wide → native-adaptive (never web-desktop)', androidTablet === 'native-adaptive');
}

{
  const webPhone = resolveTravelPresentationTarget({ platform: 'web', windowWidth: 390 });
  const webTablet = resolveTravelPresentationTarget({ platform: 'web', windowWidth: 768 });
  const webDesktop = resolveTravelPresentationTarget({
    platform: 'web',
    windowWidth: TRAVEL_WEB_DESKTOP_MIN_WIDTH,
  });
  const webWide = resolveTravelPresentationTarget({ platform: 'web', windowWidth: 1280 });
  assert('web 390 → web-adaptive', webPhone === 'web-adaptive');
  assert('web 768 → web-adaptive (not desktop)', webTablet === 'web-adaptive');
  assert('web 1024 → web-desktop', webDesktop === 'web-desktop');
  assert('web 1280 → web-desktop', webWide === 'web-desktop');
}

assert(
  'native never web-desktop (ios 1280)',
  resolveTravelPresentationTarget({ platform: 'ios', windowWidth: 1280 }) === 'native-adaptive'
);
assert(
  'legacy / unknown platform → legacy',
  resolveTravelPresentationTarget({ platform: 'windows', windowWidth: 1024 }) === 'legacy'
);

const mapper = read('src/navigation/travelPresentationTarget.ts');
const opening = read('src/components/viona/VionaNativeTravelOpeningStage.tsx');
const travel = read('src/screens/b2c/TravelScreen.tsx');
const homeMapper = read('src/navigation/homePresentationTarget.ts');
const mainTab = read('src/navigation/MainTabNavigator.tsx');
const routes = read('src/navigation/routes.ts');
const sosShield = read('src/components/premium/SOSShieldComponent.tsx');
const sosVisibility = read('src/navigation/vionaGlobalSosShellVisibility.ts');

assert('mapper is not native UI (no react-native View)', !mapper.includes("from 'react-native'"));
assert(
  'mapper does not import Home mapper',
  !mapper.includes("from './homePresentationTarget'") && !mapper.includes("from '../navigation/homePresentationTarget'")
);
assert('Home mapper was not overloaded for Travel', !homeMapper.includes('TravelPresentation') && !homeMapper.includes('resolveTravel'));
assert('opening stage has native Travel testID', opening.includes('viona-native-travel-opening-stage'));
assert('opening stage forwards children (parity host)', opening.includes('children') && opening.includes('{children}'));
assert('opening stage does not import SOSModal', !opening.includes('SOSModal') && !opening.includes('triggerSafetyAssist'));
assert('opening stage does not import openMiniApp / Leona', !opening.includes('openMiniApp') && !opening.includes('b2cAiCallAssistant'));
assert(
  'opening stage does not import native-travel composition',
  !opening.includes("from './native-travel") && !opening.includes("from '../native-travel")
);
assert(
  'P2-B native-travel composition is not present',
  !existsSync(path.join(root, 'src/components/viona/native-travel'))
);

assert('TravelScreen imports presentation target', travel.includes('resolveTravelPresentationTarget'));
assert('TravelScreen imports Native Travel OpeningStage', travel.includes('VionaNativeTravelOpeningStage'));
assert('TravelScreen mounts Native Travel OpeningStage', travel.includes('VionaNativeTravelOpeningStage'));
assert(
  'TravelScreen native-adaptive uses opening-stage mount seam',
  travel.includes("target === 'native-adaptive'") && travel.includes('VionaNativeTravelOpeningStage')
);
assert('TravelScreen still owns VionaMiniAppShell', travel.includes('<VionaMiniAppShell'));
assert('TravelScreen still owns destinationQuery', travel.includes('destinationQuery'));
assert('TravelScreen still owns openMiniApp', travel.includes('openMiniApp'));
assert('TravelScreen still owns Leona entry', travel.includes("openMiniApp('b2cAiCallAssistant'") || travel.includes("'b2cAiCallAssistant'"));
assert('TravelScreen still owns Interpreter entry', travel.includes("'minhKhangTranslator'"));
assert('TravelScreen still owns FlightSearch', travel.includes("'TravelFlightSearch'"));
assert('TravelScreen still owns Hospitality', travel.includes("'TravelHospitality'"));
assert('TravelScreen still owns LocalFixer', travel.includes("'LocalFixer'"));
assert('TravelScreen still owns SOS hold-gate', travel.includes('VionaSosHoldGateModal') && travel.includes('triggerSafetyAssist'));
assert('TravelScreen still constructs airport', travel.includes("id: 'airport'"));
assert('TravelScreen still constructs translation', travel.includes("id: 'translation'"));
assert('TravelScreen still constructs taxi', travel.includes("id: 'taxi'"));
assert('TravelScreen still constructs emergency', travel.includes("id: 'emergency'"));
assert('TravelScreen still constructs transit', travel.includes("id: 'transit'"));
assert('TravelScreen still constructs hotel', travel.includes("id: 'hotel'"));
assert('TravelScreen still constructs restaurant', travel.includes("id: 'restaurant'"));
assert('TravelScreen still constructs shopping', travel.includes("id: 'shopping'"));
assert('TravelScreen still constructs hospital', travel.includes("id: 'hospital'"));
assert('Flagship IDs remain', travel.includes("'airport', 'translation', 'taxi', 'emergency'") || travel.includes("['airport', 'translation', 'taxi', 'emergency']"));
assert('TravelScreen still uses TravelGlassCard (web/shared path preserved)', travel.includes('<TravelGlassCard'));
assert('TravelScreen still imports fashionHomeDesktopShell helpers', travel.includes('fashionHomeDesktopShell'));
assert('TravelScreen still has web-only tab hide predicate', travel.includes("Platform.OS === 'web'") && travel.includes('width >= 768'));
assert('P2-A is parity host not Clear Premium restyle', !travel.includes('VionaNativeTravelClearPremium') && !opening.includes('ClearPremium'));

assert('B2C Home tab unchanged', routes.includes('B2C') && mainTab.includes('MAIN_TAB.B2C.home'));
assert('B2C Local tab unchanged', mainTab.includes('MAIN_TAB.B2C.local') && mainTab.includes("'Local'"));
assert('B2C Travel tab unchanged', mainTab.includes('MAIN_TAB.B2C.travel') && mainTab.includes("'Travel'"));
assert('B2C Academy tab unchanged', mainTab.includes('MAIN_TAB.B2C.ai') && mainTab.includes("'Academy'"));
assert('Account chrome still PersonalHub', mainTab.includes('openPersonalHub'));
assert('MainTabNavigator still mounts canonical SOSModal', mainTab.includes("from '../screens/b2c/SOSModal'"));
assert('Travel does not mount tab-bar SOS', sosVisibility.includes('MAIN_TAB.B2C.travel') && sosVisibility.includes('return false'));
assert('SOS hold remains 3000', sosShield.includes('V7_SOS_HOLD_TO_TRIGGER_MS = 3_000'));
assert('Opening stage is not a second SOS host', !opening.includes('SOSModal') && !opening.includes('triggerSafetyAssist'));
assert('No new AI provider import in opening stage', !opening.includes('openai') && !opening.includes('anthropic'));
assert('No new AI provider import in mapper', !mapper.includes('openai') && !mapper.includes('anthropic'));

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase2-travel-native-presentation-isolation] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase2-travel-native-presentation-isolation] OK');
