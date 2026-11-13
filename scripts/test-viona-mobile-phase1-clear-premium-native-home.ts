/**
 * Phase 1 — Clear Premium native Home.
 * Run: npx tsx scripts/test-viona-mobile-phase1-clear-premium-native-home.ts
 */
import { execSync, execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

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


// R2_SCOPE_ADAPTER_BEGIN
/** AP-02 cumulative scope only; all original behavioral assertions remain below. */
const R2_BASE = 'e9d90923955958ec92d352d59791ae42578f5cc8';
const R2_EXPECTED_PATHS: Record<string, 'A' | 'M'> = {
  "App.tsx": "M",
  "app.config.js": "M",
  "scripts/expo-readiness-check.mjs": "M",
  "scripts/test-viona-mobile-phase0-native-presentation-isolation.ts": "A",
  "scripts/test-viona-mobile-phase1-clear-premium-native-home.ts": "A",
  "scripts/test-viona-mobile-sos-shell-consolidation-phase-1.ts": "M",
  "src/components/viona/VionaNativeHomeOpeningStage.tsx": "A",
  "src/components/viona/native-home/VionaNativeHomeClearPremiumComposition.tsx": "A",
  "src/components/viona/native-home/VionaNativeHomeHeader.tsx": "A",
  "src/components/viona/native-home/VionaNativeHomePrimaryEntry.tsx": "A",
  "src/components/viona/native-home/VionaNativeQuickActions.tsx": "A",
  "src/components/viona/native-home/VionaNativeUniverseLauncher.tsx": "A",
  "src/design/vionaNativeClearPremiumTokens.ts": "A",
  "src/navigation/MainTabNavigator.tsx": "M",
  "src/navigation/homePresentationTarget.ts": "A",
  "src/screens/HomeScreen.tsx": "M",
  "src/screens/b2c/LocalScreen.tsx": "M"
};
type R2ScopeRecord = { path: string; status: string; oldMode: string; newMode: string };

function r2ModeBase(args: string[]): string | null {
  const selected = args.filter((arg) => arg === '--r2-base' || arg.startsWith('--r2-base='));
  if (selected.length === 0) return null;
  if (selected.length !== 1 || selected[0] !== '--r2-base=' + R2_BASE) {
    throw new Error('R2_BASE_MISMATCH_OR_DUPLICATE');
  }
  return R2_BASE;
}

function r2ParseRaw(raw: string): R2ScopeRecord[] {
  if (!raw) return [];
  if (!raw.endsWith('\0')) throw new Error('R2_TRUNCATED_RAW_DIFF');
  const fields = raw.slice(0, -1).split('\0');
  const records: R2ScopeRecord[] = [];
  for (let i = 0; i < fields.length; i += 2) {
    const match = /^:([0-7]{6}) ([0-7]{6}) [0-9a-f]{40} [0-9a-f]{40} ([A-Z][0-9]*)$/.exec(fields[i]);
    if (!match || !['A', 'M'].includes(match[3]) || !fields[i + 1]) {
      throw new Error('R2_UNSUPPORTED_OR_INCOMPLETE_DIFF');
    }
    records.push({ path: fields[i + 1], status: match[3], oldMode: match[1], newMode: match[2] });
  }
  return records;
}

function r2ValidateScope(base: string, records: R2ScopeRecord[]): string[] {
  if (base !== R2_BASE) throw new Error('R2_BASE_MISMATCH');
  const observed = new Set<string>();
  for (const record of records) {
    const expected = R2_EXPECTED_PATHS[record.path];
    if (!Object.prototype.hasOwnProperty.call(R2_EXPECTED_PATHS, record.path) ||
        record.status !== expected || record.newMode !== '100644' ||
        record.oldMode !== (expected === 'A' ? '000000' : '100644')) {
      throw new Error('R2_PATH_ACTION_OR_MODE_MISMATCH');
    }
    observed.add(record.path);
  }
  const paths = [...observed].sort();
  if (paths.length !== 17 || paths.join('\0') !== Object.keys(R2_EXPECTED_PATHS).sort().join('\0')) {
    throw new Error('R2_EXACT_CUMULATIVE_PATH_SET_MISMATCH');
  }
  return paths;
}

function r2MutationPaths(base: string): string[] {
  const query = (args: string[]): string => execFileSync(
    'git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', ...args],
    { cwd: root, encoding: 'utf8' }
  );
  if (query(['rev-parse', '--verify', base + '^{commit}']).trim() !== R2_BASE) {
    throw new Error('R2_BASE_OBJECT_MISMATCH');
  }
  const options = ['--raw', '-z', '--no-abbrev', '--no-ext-diff', '--no-textconv', '--find-renames'];
  const records = [
    ...r2ParseRaw(query(['diff', ...options, base, '--'])),
    ...r2ParseRaw(query(['diff', '--cached', ...options, base, '--'])),
  ];
  const untracked = query(['ls-files', '--others', '--exclude-standard', '-z']);
  if (untracked && !untracked.endsWith('\0')) throw new Error('R2_TRUNCATED_UNTRACKED_INVENTORY');
  for (const file of untracked.split('\0').filter(Boolean)) {
    records.push({ path: file, status: 'A', oldMode: '000000', newMode: '100644' });
  }
  const paths = r2ValidateScope(base, records);
  for (const file of paths) {
    const stat = lstatSync(path.join(root, file));
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('R2_NON_REGULAR_WORKING_FILE');
  }
  return paths;
}
// R2_SCOPE_ADAPTER_END

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
const r2Base = r2ModeBase(process.argv.slice(2));
const changed = r2Base ? r2MutationPaths(r2Base) : mutationPaths();

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

assert('mutation path matches selected Phase 1 or exact cumulative R2 contract', changed.every((p) => r2Base ? Object.prototype.hasOwnProperty.call(R2_EXPECTED_PATHS, p) : ALLOWED.has(p) || PHASE1_DESCENDANT_ALLOWED.has(p) || p.length === 0));
for (const denied of DENY) {
  if (r2Base ? Object.prototype.hasOwnProperty.call(R2_EXPECTED_PATHS, denied) : PHASE1_DESCENDANT_ALLOWED.has(denied)) continue;
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


// R2_NATIVE_FINDINGS_FOLLOWUP_BEGIN

type FindingBindings = Record<string, unknown>;

function findingNodes<T extends ts.Node>(
  node: ts.Node,
  predicate: (value: ts.Node) => value is T
): T[] {
  const result: T[] = [];
  const visit = (value: ts.Node): void => {
    if (predicate(value)) result.push(value);
    ts.forEachChild(value, visit);
  };
  visit(node);
  return result;
}

function findingOne<T>(values: T[], label: string): T {
  if (values.length !== 1) throw new Error('FINDING_SOURCE_SHAPE_' + label);
  return values[0];
}

function findingSource(source: string): ts.SourceFile {
  return ts.createSourceFile('finding.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function findingProperty(object: ts.ObjectLiteralExpression, name: string): ts.Expression {
  const property = findingOne(
    object.properties.filter(
      (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText() === name
    ),
    name
  );
  return property.initializer;
}

function findingInitializer(node: ts.Node, name: string): ts.Expression {
  const declaration = findingOne(
    findingNodes(node, ts.isVariableDeclaration).filter(
      (v) => ts.isIdentifier(v.name) && v.name.text === name
    ),
    name
  );
  if (!declaration.initializer) throw new Error('FINDING_INITIALIZER_MISSING');
  return declaration.initializer;
}

/** Evaluate only data expressions; never execute App, imports, hooks or arbitrary calls. */
function findingValue(node: ts.Expression, values: FindingBindings): unknown {
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) {
    return findingValue(node.expression, values);
  }
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isIdentifier(node)) {
    if (node.text === 'undefined') return undefined;
    if (!Object.prototype.hasOwnProperty.call(values, node.text)) {
      throw new Error('FINDING_UNBOUND_' + node.text);
    }
    return values[node.text];
  }
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    const target = findingValue(node.expression, values) as FindingBindings;
    const key = ts.isPropertyAccessExpression(node)
      ? node.name.text
      : String(findingValue(node.argumentExpression, values));
    if (!target || !Object.prototype.hasOwnProperty.call(target, key)) {
      throw new Error('FINDING_PROPERTY_MISSING_' + key);
    }
    return target[key];
  }
  if (ts.isConditionalExpression(node)) {
    return findingValue(
      findingValue(node.condition, values) ? node.whenTrue : node.whenFalse,
      values
    );
  }
  if (ts.isPrefixUnaryExpression(node)) {
    const operand = findingValue(node.operand, values);
    if (node.operator === ts.SyntaxKind.ExclamationToken) return !operand;
    if (node.operator === ts.SyntaxKind.MinusToken) return -Number(operand);
    throw new Error('FINDING_UNSUPPORTED_UNARY');
  }
  if (ts.isBinaryExpression(node)) {
    const left = findingValue(node.left, values);
    const op = node.operatorToken.kind;
    if (op === ts.SyntaxKind.AmpersandAmpersandToken) return left && findingValue(node.right, values);
    if (op === ts.SyntaxKind.BarBarToken) return left || findingValue(node.right, values);
    const right = findingValue(node.right, values);
    switch (op) {
      case ts.SyntaxKind.EqualsEqualsEqualsToken: return left === right;
      case ts.SyntaxKind.ExclamationEqualsEqualsToken: return left !== right;
      case ts.SyntaxKind.GreaterThanToken: return Number(left) > Number(right);
      case ts.SyntaxKind.GreaterThanEqualsToken: return Number(left) >= Number(right);
      case ts.SyntaxKind.LessThanToken: return Number(left) < Number(right);
      case ts.SyntaxKind.LessThanEqualsToken: return Number(left) <= Number(right);
      case ts.SyntaxKind.PlusToken: return Number(left) + Number(right);
      case ts.SyntaxKind.MinusToken: return Number(left) - Number(right);
      case ts.SyntaxKind.AsteriskToken: return Number(left) * Number(right);
      default: throw new Error('FINDING_UNSUPPORTED_BINARY');
    }
  }
  if (ts.isCallExpression(node)) {
    const name = node.expression.getText();
    const args = node.arguments.map((arg) => findingValue(arg, values));
    if (name === 'Number.isFinite') return Number.isFinite(args[0]);
    if (name === 'Math.max') return Math.max(...args.map(Number));
    if (name === 'Math.min') return Math.min(...args.map(Number));
    if (name === 'Math.floor') return Math.floor(Number(args[0]));
    throw new Error('FINDING_UNSUPPORTED_CALL');
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((e) => findingValue(e, values));
  if (ts.isObjectLiteralExpression(node)) {
    const result: FindingBindings = {};
    for (const p of node.properties) {
      if (!ts.isPropertyAssignment(p)) throw new Error('FINDING_UNSUPPORTED_OBJECT');
      const key = ts.isStringLiteralLike(p.name) ? p.name.text : p.name.getText();
      result[key] = findingValue(p.initializer, values);
    }
    return result;
  }
  throw new Error('FINDING_UNSUPPORTED_EXPRESSION');
}

function findingStyle(value: unknown): FindingBindings {
  if (Array.isArray(value)) return Object.assign({}, ...value.map(findingStyle));
  if (value === false || value == null) return {};
  if (typeof value !== 'object') throw new Error('FINDING_STYLE_INVALID');
  return value as FindingBindings;
}

function findingStyleObject(source: ts.SourceFile): ts.ObjectLiteralExpression {
  const initializer = findingInitializer(source, 'styles');
  if (!ts.isCallExpression(initializer) ||
      initializer.expression.getText() !== 'StyleSheet.create' ||
      !ts.isObjectLiteralExpression(initializer.arguments[0])) {
    throw new Error('FINDING_STYLES_WIRING');
  }
  return initializer.arguments[0];
}

function findingAttribute(
  element: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  name: string
): ts.Expression {
  const attribute = findingOne(
    element.attributes.properties.filter(
      (p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText() === name
    ),
    'attribute_' + name
  );
  if (!attribute.initializer || !ts.isJsxExpression(attribute.initializer) ||
      !attribute.initializer.expression) throw new Error('FINDING_JSX_EXPRESSION');
  return attribute.initializer.expression;
}

function findingWidth(sourceText: string, platform: string, width: number, height: number) {
  const source = findingSource(sourceText);
  const fn = (name: string) => findingOne(
    findingNodes(source, ts.isFunctionDeclaration).filter((n) => n.name?.text === name), name
  );
  const rootNode = fn('AppRoot');
  const shellNode = fn('AppNavigationShell');
  const dimensions = findingOne(
    findingNodes(rootNode, ts.isVariableDeclaration).filter(
      (d) => d.initializer && ts.isCallExpression(d.initializer) &&
        d.initializer.expression.getText() === 'useWindowDimensions'
    ), 'dimensions'
  );
  if (!ts.isObjectBindingPattern(dimensions.name) ||
      !['width', 'height'].every((key) => ts.isObjectBindingPattern(dimensions.name) && dimensions.name.elements.some((element) => ts.isIdentifier(element.name) && element.name.text === key && (!element.propertyName || element.propertyName.getText() === key)))) {
    throw new Error('FINDING_DIMENSION_WIRING');
  }
  const context: FindingBindings = { width, height, Platform: { OS: platform } };
  for (const name of ['isLargeScreen', 'nativeLandscapeFullBleed', 'nativeTabletPortraitFullBleed']) {
    const declarations = findingNodes(rootNode, ts.isVariableDeclaration).filter(
      (d) => ts.isIdentifier(d.name) && d.name.text === name
    );
    if (declarations.length) context[name] = findingValue(findingInitializer(rootNode, name), context);
  }
  const mount = findingOne(
    findingNodes(rootNode, ts.isJsxSelfClosingElement).filter(
      (n) => n.tagName.getText() === 'AppNavigationShell'
    ), 'shell_mount'
  );
  const props: FindingBindings = {};
  for (const name of ['isLargeScreen', 'nativeLandscapeFullBleed', 'nativeTabletPortraitFullBleed']) {
    if (!Object.hasOwn(context, name)) continue;
    const param = shellNode.parameters[0].name;
    if (!ts.isObjectBindingPattern(param) || !param.elements.some((p) => p.name.getText() === name)) {
      throw new Error('FINDING_SHELL_PROP_MISSING');
    }
    props[name] = findingValue(findingAttribute(mount, name), context);
  }
  const ancestor = findingOne(
    findingNodes(shellNode, ts.isJsxElement).filter((n) =>
      n.openingElement.tagName.getText() === 'View' &&
      n.openingElement.attributes.properties.some((p) =>
        ts.isJsxAttribute(p) && p.name.getText() === 'style' &&
        p.initializer?.getText().includes('maxWidth')) &&
      findingNodes(n, ts.isJsxOpeningElement).some((e) => e.tagName.getText() === 'NavigationContainer')
    ), 'navigation_ancestor'
  );
  const style = findingStyle(findingValue(findingAttribute(ancestor.openingElement, 'style'), props));
  if (style.width !== '100%') throw new Error('FINDING_ANCESTOR_WIDTH');
  return { maxWidth: style.maxWidth, tabletPredicate: context.nativeTabletPortraitFullBleed ?? false };
}

function findingBadge(sourceText: string, tokenText: string, compositionText: string) {
  const source = findingSource(sourceText);
  const tkn = findingValue(
    findingInitializer(findingSource(tokenText), 'vionaNativeClearPremiumTokens'), {}
  ) as FindingBindings;
  const styles = findingValue(findingStyleObject(source), { tkn, FontFamily: { medium: 'medium', semibold: 'semibold' } }) as FindingBindings;
  const text = findingOne(
    findingNodes(source, ts.isJsxElement).filter((n) =>
      n.openingElement.tagName.getText() === 'Text' &&
      n.children.some((c) => ts.isJsxExpression(c) && c.expression?.getText() === 'item.readinessLabel')
    ), 'readiness_text'
  );
  if (!ts.isJsxElement(text.parent)) throw new Error('FINDING_CHIP_PARENT');
  const chipStyle = findingStyle(findingValue(findingAttribute(text.parent.openingElement, 'style'), {
    styles, accent: '#000000',
  }));
  const pressable = findingOne(
    findingNodes(source, ts.isJsxOpeningElement).filter((n) => n.tagName.getText() === 'Pressable'),
    'tile'
  );
  const callback = findingAttribute(pressable, 'style');
  if (!ts.isArrowFunction(callback) || ts.isBlock(callback.body)) throw new Error('FINDING_TILE_STYLE');
  const compositionSource = findingSource(compositionText);
  const compositionStyles = findingStyleObject(compositionSource);
  const rootStyle = findingValue(findingProperty(compositionStyles, 'root'), { tkn }) as FindingBindings;
  const backdrop = String(rootStyle.backgroundColor);
  const results = [];
  for (const id of ['local', 'travel', 'academy', 'business']) {
    const accent = (tkn.accent as FindingBindings)[id];
    const fgStyle = findingStyle(findingValue(findingAttribute(text.openingElement, 'style'), { styles, accent, tkn }));
    for (const pressed of [false, true]) for (const reduceMotion of [false, true]) {
      const tile = findingStyle(findingValue(callback.body, { styles, pressed, reduceMotion, fourAcross: false, tileMinHeight: 108 }));
      const opacity = Number(tile.opacity ?? 1) * Number(chipStyle.opacity ?? 1) * Number(fgStyle.opacity ?? 1);
      const foreground = String(fgStyle.color), background = String(chipStyle.backgroundColor);
      results.push({ id, pressed, reduceMotion, foreground, background, backdrop, opacity,
        ratio: findingContrast(foreground, background, backdrop, opacity) });
    }
  }
  return results;
}

function findingContrast(foreground: string, background: string, backdrop: string, opacity: number) {
  const rgb = (hex: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error('FINDING_UNSUPPORTED_COLOR');
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  };
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new Error('FINDING_OPACITY');
  const behind = rgb(backdrop);
  const luminance = (hex: string) => rgb(hex).map((v, i) => opacity * v + (1 - opacity) * behind[i])
    .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  const fg = luminance(foreground), bg = luminance(background);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

function findingGeometry(sourceText: string, baseHeight: number, bottomInset: number, platform = 'ios', mounted = true) {
  const source = findingSource(sourceText);
  const context: FindingBindings = {
    Platform: { OS: platform }, mountSosInTabBarShell: mounted, tabBarPosition: 'bottom',
    tabSizing: { tabBarBaseHeight: baseHeight }, insets: { bottom: bottomInset },
  };
  for (const key of ['NATIVE_BOTTOM_SHELL_CHROME_ROW', 'nativeChromePad', 'nativeTabsBandHeight', 'nativeTwoBandShellHeight']) {
    context[key] = findingValue(findingInitializer(source, key), context);
  }
  const object = findingOne(findingNodes(source, ts.isObjectLiteralExpression).filter((n) =>
    ['height', 'paddingBottom', 'paddingTop', 'paddingLeft'].every((key) =>
      n.properties.some((p) => ts.isPropertyAssignment(p) && p.name.getText() === key)
    )
  ), 'bottom_bar_style');
  const height = Number(findingValue(findingProperty(object, 'height'), context));
  const paddingBottom = Number(findingValue(findingProperty(object, 'paddingBottom'), context));
  const paddingTop = Number(findingValue(findingProperty(object, 'paddingTop'), context));
  const borderTop = Number(findingValue(findingProperty(object, 'borderTopWidth'), context));
  const clip = Number(context.nativeTabsBandHeight), host = Number(context.nativeTwoBandShellHeight);
  const styles = findingStyleObject(source);
  const item = findingValue(findingProperty(styles, 'nativeBottomTabItem'), context) as FindingBindings;
  return { height, host, clip, paddingBottom, paddingTop, borderTop,
    contentHeight: height - paddingBottom - paddingTop - borderTop,
    itemPaddingTop: Number(item.paddingTop ?? 0),
    buttonHeight: height - paddingBottom - paddingTop - borderTop - Number(item.paddingTop ?? 0) };
}

const FOLLOWUP_START = '6420fe0fb386e571ab95c4c9a5a7d7d92afd3714';
const findingOld = (file: string) => execFileSync(
  'git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', 'cat-file', 'blob', FOLLOWUP_START + ':' + file],
  { cwd: root, encoding: 'utf8' }
);
const oldApp = findingOld('App.tsx');
const currentApp = read('App.tsx');
const oldLauncher = findingOld('src/components/viona/native-home/VionaNativeUniverseLauncher.tsx');
const oldMainTab = findingOld('src/navigation/MainTabNavigator.tsx');

for (const os of ['ios', 'android']) {
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    assert('F01 phone policy preserved ' + os + ' ' + width,
      findingWidth(currentApp, os, width, height).maxWidth ===
      findingWidth(oldApp, os, width, height).maxWidth);
    assert('F01 phone remains native-adaptive ' + os + ' ' + width,
      composeTarget(os, 'B2C', width).target === 'native-adaptive');
  }
  for (const [width, height] of [[768, 1024], [800, 1280], [1024, 1366]]) {
    assert('EXPECTED_BASELINE_REPRODUCTION F01 cap600 ' + os + ' ' + width,
      findingWidth(oldApp, os, width, height).maxWidth === 600);
    assert('F01 real ancestor tablet full width ' + os + ' ' + width,
      findingWidth(currentApp, os, width, height).maxWidth === '100%');
    assert('F01 tablet remains native-adaptive ' + os + ' ' + width,
      composeTarget(os, 'B2C', width).target === 'native-adaptive');
  }
  for (const [width, height] of [[844, 390], [1024, 768], [1280, 800]]) {
    assert('F01 landscape unchanged ' + os + ' ' + width,
      findingWidth(currentApp, os, width, height).maxWidth === '100%' &&
      findingWidth(oldApp, os, width, height).maxWidth === '100%');
  }
  for (const [width, height] of [[NaN, 1024], [Infinity, Infinity], [768, Infinity],
    [768, NaN], [-768, 1024], [0, 1024], [768, 0], [768, -1]]) {
    assert('F01 invalid input does not enable new predicate ' + os + ' ' + width + '/' + height,
      findingWidth(currentApp, os, width, height).tabletPredicate === false);
  }
}
for (const width of [767, 768, 769, 1366]) {
  for (const height of [600, 1024]) {
    assert('F01 web ancestor unchanged ' + width + '/' + height,
      findingWidth(currentApp, 'web', width, height).maxWidth ===
      findingWidth(oldApp, 'web', width, height).maxWidth);
  }
}
assert('F01 negative fixture catches broken prop wiring',
  findingWidth(currentApp.replace(
    'nativeTabletPortraitFullBleed={nativeTabletPortraitFullBleed}',
    'nativeTabletPortraitFullBleed={false}'
  ), 'ios', 768, 1024).maxWidth === 600);
assert('F01 negative fixture catches ancestor hard-cap',
  findingWidth(currentApp.replace(
    "isLargeScreen || nativeLandscapeFullBleed || nativeTabletPortraitFullBleed ? '100%' : 600",
    '600'
  ), 'ios', 768, 1024).maxWidth === 600);

const oldBadgeResults = findingBadge(oldLauncher, tokens, composition);
const badgeResults = findingBadge(launcher, tokens, composition);
assert('EXPECTED_BASELINE_REPRODUCTION F02 Local contrast below 4.5',
  oldBadgeResults.filter((r) => r.id === 'local').every((r) => r.ratio < 4.5));
for (const result of badgeResults) {
  assert('F02 rendered badge contrast ' + result.id + ' pressed=' + result.pressed +
    ' reduceMotion=' + result.reduceMotion + ' ratio=' + result.ratio.toFixed(6),
    result.ratio >= 4.5);
}
assert('F02 only rendered badge ink changed; labels/callbacks/decorative accents retained',
  launcher === oldLauncher.replace(
    '<Text style={[styles.chipText, { color: accent }]}',
    '<Text style={[styles.chipText, { color: tkn.ink.primary }]}'
  ));
assert('F02 source-to-render negative fixture still detects accent text',
  findingBadge(launcher.replace('{ color: tkn.ink.primary }', '{ color: accent }'), tokens, composition)
    .filter((r) => r.id === 'local').every((r) => r.ratio < 4.5));
assert('F02 sRGB reference black/white is 21',
  findingContrast('#000000', '#FFFFFF', '#FFFFFF', 1) === 21);

const tabPackageRoot = path.join(root, 'node_modules/@react-navigation/bottom-tabs');
const tabBarSource = findingSource(readFileSync(path.join(tabPackageRoot, 'src/views/BottomTabBar.tsx'), 'utf8'));
const tabItemSource = findingSource(readFileSync(path.join(tabPackageRoot, 'src/views/BottomTabItem.tsx'), 'utf8'));
const tabViewText = readFileSync(path.join(tabPackageRoot, 'src/views/BottomTabView.tsx'), 'utf8');
const tabBarText = tabBarSource.text;
const barStyles = findingStyleObject(tabBarSource);
const itemStyles = findingStyleObject(tabItemSource);
assert('V01 installed bar bottomContent expands in available height',
  (findingValue(findingProperty(barStyles, 'bottomContent'), {}) as FindingBindings).flex === 1);
assert('V01 installed bottomItem passes flex to the pressable',
  (findingValue(findingProperty(barStyles, 'bottomItem'), {}) as FindingBindings).flex === 1 &&
  tabItemSource.text.includes('const { flex } = StyleSheet.flatten(style || {})') &&
  tabItemSource.text.includes('{ flex, backgroundColor, borderRadius }'));
assert('V01 installed horizontal tab centers icon/label',
  (findingValue(findingProperty(itemStyles, 'tabHorizontalUiKit'), {}) as FindingBindings).justifyContent === 'center');
assert('V01 actual tabBarStyle is applied after built-in height and inset padding',
  tabBarText.indexOf('height: tabBarHeight') < tabBarText.indexOf('        tabBarStyle,'));
assert('V01 bar layout reports total height to navigation context',
  tabBarText.includes('onHeightChange?.(height)') &&
  tabViewText.includes('value={setTabBarHeight}') &&
  tabViewText.includes("value={tabBarPosition === 'bottom' ? tabBarHeight : 0}"));
const sizingCall = findingInitializer(findingSource(mainTab), 'tabSizing');
if (!ts.isCallExpression(sizingCall) || !ts.isArrowFunction(sizingCall.arguments[0]) ||
    ts.isBlock(sizingCall.arguments[0].body)) throw new Error('FINDING_TAB_SIZING_WIRING');
const sizingExpression = sizingCall.arguments[0].body;
const actualBases = [true, false].map((compactTabs) =>
  Number((findingValue(sizingExpression, { compactTabs }) as FindingBindings).tabBarBaseHeight)
);
for (const os of ['ios', 'android']) for (const baseHeight of actualBases) {
  for (const inset of [0, 10, 34, 48]) {
    const oldGeometry = findingGeometry(oldMainTab, baseHeight, inset, os);
    const next = findingGeometry(mainTab, baseHeight, inset, os);
    assert('EXPECTED_BASELINE_REPRODUCTION V01 interactive overflow ' + os + '/' + baseHeight + '/' + inset,
      oldGeometry.contentHeight > oldGeometry.clip && oldGeometry.buttonHeight > oldGeometry.clip);
    assert('V01 tabs fit clip while total navigation reserve stays intact ' + os + '/' + baseHeight + '/' + inset,
      next.height === next.host && next.host === oldGeometry.host &&
      next.clip === oldGeometry.clip && next.contentHeight === next.clip &&
      next.buttonHeight >= 44 && next.buttonHeight <= next.clip);
  }
}
for (const os of ['web', 'ios', 'android']) for (const mounted of [false, true]) {
  if (os !== 'web' && mounted) continue;
  assert('V01 stock and web bottom bar unchanged ' + os + '/' + mounted,
    JSON.stringify(findingGeometry(mainTab, 56, 34, os, mounted)) ===
    JSON.stringify(findingGeometry(oldMainTab, 56, 34, os, mounted)));
}
assert('V01 only native bar reserved padding changed; shell/left-rail/ownership retained',
  mainTab === oldMainTab.replace(
    "paddingBottom:\n                      mountSosInTabBarShell && Platform.OS !== 'web'\n                        ? 0",
    "paddingBottom:\n                      mountSosInTabBarShell && Platform.OS !== 'web'\n                        // Keep the reported shell height; expose only tab content above the clip.\n                        ? NATIVE_BOTTOM_SHELL_CHROME_ROW + nativeChromePad"
  ));
console.log('[EVIDENCE] ' + JSON.stringify({
  kind: 'native_findings_source_results',
  F01: 'SOURCE_POLICY_FIXED_AND_DETERMINISTICALLY_TESTED',
  F02: badgeResults,
  V01: 'SOURCE_SIZING_FIXED_AND_MODELED; NATIVE_MEASUREMENT_PENDING',
  native_measurement: 'NOT_RUN',
}));

// R2_NATIVE_FINDINGS_FOLLOWUP_END

if (failed > 0) {
  console.error(`\n[test-viona-mobile-phase1-clear-premium-native-home] ${failed} failure(s)`);
  process.exit(1);
}

console.log('\n[test-viona-mobile-phase1-clear-premium-native-home] OK');
