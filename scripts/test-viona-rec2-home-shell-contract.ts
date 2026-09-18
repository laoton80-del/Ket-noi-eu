/**
 * RC2 Home shell pure contract and bounded source-wiring checks.
 * Run: node_modules/.bin/tsx scripts/test-viona-rec2-home-shell-contract.ts
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import i18next from 'i18next';
import ts from 'typescript';

import {
  VIONA_REC2_NOTIFICATION_PRESENTATION,
  VIONA_REC2_GATED_CARD_CONTENT_OPACITY,
  VIONA_REC2_NATIVE_HEADER_CONTROL_TOP_CLEARANCE_DP,
  VIONA_REC2_UNIVERSE_ORDER,
  createVionaRec2UniverseContract,
  invokeVionaRec2UniverseCallback,
  openVionaRec2AlfredUi,
  resolveVionaRec2AlfredPresentation,
  resolveVionaRec2HomeLayout,
  resolveVionaRec2ImagePresentation,
  resolveVionaRec2TaskSurface,
  resolveVionaRec2TypographyMetrics,
} from '../src/components/viona/home/vionaRec2HomeContract';
import {
  VIONA_REC2_HOME_CONTENT_BREATHING_CLEARANCE_PX,
  VIONA_WEB_BOTTOM_SHELL_ACTION_OVERHANG_PX,
  VIONA_WEB_BOTTOM_SHELL_OBSTRUCTION_PX,
  VIONA_WEB_BOTTOM_TAB_BAR_HEIGHT_PX,
  resolveVionaHomeRouteTabBarStyleOverride,
  resolveVionaNativeBottomShellGeometry,
  resolveVionaRec2HomeBottomReservation,
} from '../src/navigation/vionaBottomShellGeometry';
import {
  parseTruthyEnvString,
  resolveRec2HomeShellEnabled,
} from '../src/core/feature-flags/featureFlags';
import { resolveHomeRendererSelection } from '../src/navigation/homePresentationTarget';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');
let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean): void {
  if (condition) {
    passed += 1;
    console.log(`[PASS] ${label}`);
    return;
  }
  failed += 1;
  console.error(`[FAIL] ${label}`);
}

function read(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(read(relativePath)) as Record<string, unknown>;
}

function objectAt(rootObject: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  let current: unknown = rootObject;
  for (const key of keys) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      throw new Error(`Expected object at ${keys.join('.')}`);
    }
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current !== 'object' || current === null || Array.isArray(current)) {
    throw new Error(`Expected object at ${keys.join('.')}`);
  }
  return current as Record<string, unknown>;
}

function flattenLeafPaths(value: unknown, prefix = ''): readonly string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix];
  return Object.keys(value)
    .sort((a, b) => a.localeCompare(b, 'en'))
    .flatMap((key) =>
      flattenLeafPaths((value as Record<string, unknown>)[key], prefix ? `${prefix}.${key}` : key)
    );
}

function sourceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) return '';
  return source.slice(startIndex, endIndex);
}

function topLevelHighRiskCalls(source: string): readonly string[] {
  const sourceFile = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const highRisk = /(?:^|\.)(?:fetch|fetchBalance|patchUserPersonaOnServer|requestPermissions|requestPermissionsAsync|requestForegroundPermissionsAsync|getCurrentPositionAsync|watchPositionAsync|charge|confirmPayment|createPaymentIntent|post|put|patch|delete|dispatch)$/i;
  const found: string[] = [];

  const unwrapCallable = (expression: ts.Expression): ts.Expression => {
    let current = expression;
    while (
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isNonNullExpression(current)
    ) {
      current = current.expression;
    }
    return current;
  };

  const visitExecutedInitializer = (node: ts.Node): void => {
    if (ts.isFunctionLike(node)) return;
    if (ts.isCallExpression(node)) {
      const callable = unwrapCallable(node.expression);
      if (ts.isArrowFunction(callable) || ts.isFunctionExpression(callable)) {
        visitExecutedInitializer(callable.body);
      } else {
        const callee = callable.getText(sourceFile);
        if (highRisk.test(callee)) found.push(callee);
      }
    }
    node.forEachChild(visitExecutedInitializer);
  };

  for (const statement of sourceFile.statements) {
    if (ts.isExpressionStatement(statement)) {
      visitExecutedInitializer(statement.expression);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.initializer) visitExecutedInitializer(declaration.initializer);
      }
    }
  }
  return found;
}

function resolveLocalModule(importerPath: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(importerPath), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.mjs`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
  ];
  for (const candidate of candidates) {
    if (
      existsSync(candidate) &&
      statSync(candidate).isFile() &&
      /\.(?:[cm]?js|jsx|tsx?)$/i.test(candidate)
    ) {
      return candidate;
    }
  }
  return null;
}

function auditLocalImportGraph(entryRelativePath: string): Readonly<{
  fileCount: number;
  highRiskTopLevelCalls: readonly string[];
}> {
  const queue = [path.join(root, entryRelativePath)];
  const seen = new Set<string>();
  const highRiskTopLevelCalls: string[] = [];
  while (queue.length > 0) {
    const filePath = queue.shift()!;
    const normalizedPath = path.normalize(filePath);
    if (seen.has(normalizedPath)) continue;
    seen.add(normalizedPath);
    const source = readFileSync(normalizedPath, 'utf8');
    for (const callee of topLevelHighRiskCalls(source)) {
      highRiskTopLevelCalls.push(`${path.relative(root, normalizedPath).replace(/\\/g, '/')}:${callee}`);
    }
    const sourceFile = ts.createSourceFile(
      normalizedPath,
      source,
      ts.ScriptTarget.Latest,
      true,
      normalizedPath.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    for (const statement of sourceFile.statements) {
      if (
        (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        const resolved = resolveLocalModule(normalizedPath, statement.moduleSpecifier.text);
        if (resolved && !seen.has(resolved)) queue.push(resolved);
      }
    }
  }
  return { fileCount: seen.size, highRiskTopLevelCalls };
}

async function main(): Promise<void> {
const allAvailableInput = {
  localEnabled: true,
  travelEnabled: true,
  academyEnabled: true,
  businessEligible: true,
  accountAvailable: true,
  sosAvailable: true,
} as const;

assert(
  'six universes have canonical completeness and order',
  JSON.stringify(VIONA_REC2_UNIVERSE_ORDER) ===
    JSON.stringify(['local', 'travel', 'academy', 'business', 'account', 'sos'])
);

const allUniverses = createVionaRec2UniverseContract(allAvailableInput);
assert('six universe contracts are emitted', allUniverses.length === 6);
assert('available universe order matches canonical order', allUniverses.every((item, i) => item.id === VIONA_REC2_UNIVERSE_ORDER[i]));
assert('all explicitly available universes are available', allUniverses.every((item) => item.availability === 'available'));

const gatedUniverses = createVionaRec2UniverseContract({
  ...allAvailableInput,
  businessEligible: false,
  travelEnabled: false,
});
assert('Business is gated without B2B workspace access', gatedUniverses[3]?.availability === 'gated');
assert('disabled optional universe is unavailable', gatedUniverses[1]?.availability === 'unavailable');

let businessOpenCount = 0;
assert(
  'gated Business callback cannot run',
  invokeVionaRec2UniverseCallback(gatedUniverses[3]!, {
    business: () => {
      businessOpenCount += 1;
    },
  }) === 'blocked' && businessOpenCount === 0
);

let sosGuidanceOpenCount = 0;
assert(
  'SOS available contract invokes exactly its supplied open-only callback',
  invokeVionaRec2UniverseCallback(allUniverses[5]!, {
    sos: () => {
      sosGuidanceOpenCount += 1;
    },
  }) === 'opened' && sosGuidanceOpenCount === 1
);
assert(
  'available universe without callback fails closed',
  invokeVionaRec2UniverseCallback(allUniverses[0]!, {}) === 'missing-callback'
);

const webLayout = resolveVionaRec2HomeLayout({ width: 1440, height: 900, fontScale: 1, shellPlatform: 'web' });
assert(
  'wide web presentation is distinct from its 3 by 2 layout class',
  webLayout.platform === 'web' &&
    webLayout.mode === 'web' &&
    webLayout.orientation === 'landscape' &&
    webLayout.layoutClass === 'three-column' &&
    webLayout.columns === 3 &&
    webLayout.rows === 2
);
const tabletLandscape = resolveVionaRec2HomeLayout({ width: 1024, height: 768, fontScale: 1 });
assert('tablet landscape layout is 3 by 2', tabletLandscape.mode === 'tablet-landscape' && tabletLandscape.columns === 3 && tabletLandscape.rows === 2);
const tabletPortrait = resolveVionaRec2HomeLayout({ width: 768, height: 1024, fontScale: 1 });
assert('tablet portrait layout is 2 by 3', tabletPortrait.mode === 'tablet-portrait' && tabletPortrait.columns === 2 && tabletPortrait.rows === 3);
const veryWideNativeLandscape = resolveVionaRec2HomeLayout({
  width: 1707,
  height: 1067,
  fontScale: 1,
  shellPlatform: 'native',
});
assert(
  'very wide native landscape remains native tablet presentation',
  veryWideNativeLandscape.platform === 'native' &&
    veryWideNativeLandscape.mode === 'tablet-landscape' &&
    veryWideNativeLandscape.orientation === 'landscape' &&
    veryWideNativeLandscape.columns === 3
);
const veryWideNativePortrait = resolveVionaRec2HomeLayout({
  width: 1067,
  height: 1707,
  fontScale: 1,
  shellPlatform: 'native',
});
assert(
  'wide native portrait remains native tablet presentation',
  veryWideNativePortrait.platform === 'native' &&
    veryWideNativePortrait.mode === 'tablet-portrait' &&
    veryWideNativePortrait.orientation === 'portrait' &&
    veryWideNativePortrait.columns === 2
);
const phoneTwoColumn = resolveVionaRec2HomeLayout({ width: 390, height: 844, fontScale: 1 });
assert('readable phone layout uses two columns', phoneTwoColumn.mode === 'phone' && phoneTwoColumn.columns === 2);
const phoneFontScale13 = resolveVionaRec2HomeLayout({ width: 390, height: 844, fontScale: 1.3 });
assert('phone font scale 1.3 uses the readable one-column fallback', phoneFontScale13.columns === 1 && phoneFontScale13.rows === 6);
const phoneFontFallback = resolveVionaRec2HomeLayout({ width: 390, height: 844, fontScale: 2 });
assert('large phone font scale falls back to one column', phoneFontFallback.columns === 1 && phoneFontFallback.rows === 6);
const compactWeb = resolveVionaRec2HomeLayout({ width: 390, height: 844, fontScale: 1, shellPlatform: 'web' });
assert(
  'compact web remains web presentation while using a two-column layout',
  compactWeb.platform === 'web' &&
    compactWeb.mode === 'web' &&
    compactWeb.layoutClass === 'two-column' &&
    compactWeb.columns === 2
);
const narrowWeb = resolveVionaRec2HomeLayout({ width: 320, height: 568, fontScale: 1, shellPlatform: 'web' });
assert(
  'narrow web remains web presentation while falling back to one column',
  narrowWeb.platform === 'web' && narrowWeb.mode === 'web' && narrowWeb.columns === 1
);
assert(
  'native header controls reserve the artwork boundary and web adds no native clearance',
  phoneTwoColumn.headerControlTopClearance ===
    VIONA_REC2_NATIVE_HEADER_CONTROL_TOP_CLEARANCE_DP &&
    phoneTwoColumn.headerControlTopClearance >= 22 &&
    webLayout.headerControlTopClearance === 0
);

const typography10 = resolveVionaRec2TypographyMetrics(1);
const typography13 = resolveVionaRec2TypographyMetrics(1.3);
const typography20 = resolveVionaRec2TypographyMetrics(2);
assert(
  'Home text boxes grow monotonically with system font scale',
  typography10.headlineLineHeight === 34 &&
    typography13.headlineLineHeight === 45 &&
    typography20.headlineLineHeight === 68 &&
    typography10.bodyLineHeight === 17 &&
    typography20.bodyLineHeight === 34
);
assert(
  'font-2 Viona panel line boxes clear their scaled public text sizes',
  typography20.microLineHeight >= 11 * 2 &&
    typography20.cardTitleLineHeight >= 21 * 2 &&
    typography20.bodyLineHeight >= 13 * 2 &&
    typography20.availabilityLineHeight >= 12 * 2
);
assert(
  'malformed font scale uses finite baseline typography',
  resolveVionaRec2TypographyMetrics(Number.NaN).fontScale === 1 &&
    resolveVionaRec2TypographyMetrics(-2).headlineLineHeight === 34
);

const nativeShell10 = resolveVionaNativeBottomShellGeometry({
  width: 360,
  fontScale: 1,
  safeAreaBottom: 24,
  chromeRowBase: 72,
});
const nativeShell13 = resolveVionaNativeBottomShellGeometry({
  width: 360,
  fontScale: 1.3,
  safeAreaBottom: 24,
  chromeRowBase: 72,
});
const nativeShell20 = resolveVionaNativeBottomShellGeometry({
  width: 360,
  fontScale: 2,
  safeAreaBottom: 24,
  chromeRowBase: 72,
});
assert(
  'native shell keeps one-line labels at baseline and permits two lines at large text',
  nativeShell10.labelLineCount === 1 &&
    nativeShell13.labelLineCount === 2 &&
    nativeShell20.labelLineCount === 2
);
assert(
  'native shell reservation grows with accessible label geometry',
  nativeShell13.tabsBandHeight > nativeShell10.tabsBandHeight &&
    nativeShell20.tabsBandHeight > nativeShell13.tabsBandHeight &&
    nativeShell20.labelLineHeight > nativeShell13.labelLineHeight &&
    nativeShell20.chromeRowHeight >= 72
);
assert(
  'native shell total reservation has one source of truth',
  [nativeShell10, nativeShell13, nativeShell20].every(
    (geometry) =>
      geometry.totalHeight ===
      geometry.tabsBandHeight + geometry.chromeRowHeight + geometry.bottomPadding
  )
);
assert(
  'native tabs band independently contains icon and accessible label geometry',
  [nativeShell10, nativeShell13, nativeShell20].every(
    (geometry) =>
      geometry.tabsBandHeight >=
        4 +
          geometry.iconSize +
          2 +
          geometry.labelLineHeight * geometry.labelLineCount +
          8 &&
      geometry.totalHeight > geometry.tabsBandHeight
  )
);
const inheritedAdaptiveTabBarStyle = { height: nativeShell13.tabsBandHeight, paddingBottom: 0 };
const visibleHomeRouteOverride = resolveVionaHomeRouteTabBarStyleOverride(false, {
  display: 'none',
});
const hiddenHomeRouteOverride = resolveVionaHomeRouteTabBarStyleOverride(true, {
  display: 'none',
});
assert(
  'visible Home route preserves the navigator adaptive tab-bar style during React Navigation option merge',
  !Object.prototype.hasOwnProperty.call(visibleHomeRouteOverride, 'tabBarStyle') &&
    Object.assign({}, { tabBarStyle: inheritedAdaptiveTabBarStyle }, visibleHomeRouteOverride)
      .tabBarStyle === inheritedAdaptiveTabBarStyle
);
assert(
  'desktop Home route still overrides the tab bar with the intentional hidden style',
  Object.prototype.hasOwnProperty.call(hiddenHomeRouteOverride, 'tabBarStyle') &&
    Object.assign({}, { tabBarStyle: inheritedAdaptiveTabBarStyle }, hiddenHomeRouteOverride)
      .tabBarStyle === hiddenHomeRouteOverride.tabBarStyle
);
const insetLayout = resolveVionaRec2HomeLayout({
  width: 430,
  height: 932,
  fontScale: 1,
  safeAreaInsets: { top: 47, right: 20, bottom: 34, left: 20 },
});
assert('real shell side insets reduce effective layout width', insetLayout.effectiveWidth === 390);
assert('real shell bottom inset contributes to finite bottom padding', insetLayout.bottomPadding === 50);

const measuredWebViewports = [
  { width: 1440, height: 900, columns: 3 },
  { width: 1280, height: 800, columns: 3 },
  { width: 834, height: 1194, columns: 2 },
  { width: 390, height: 844, columns: 2 },
  { width: 320, height: 568, columns: 1 },
] as const;
for (const viewport of measuredWebViewports) {
  const measuredLayout = resolveVionaRec2HomeLayout({
    ...viewport,
    fontScale: 1,
    shellPlatform: 'web',
  });
  assert(
    `web ${viewport.width}x${viewport.height} uses the shared shell obstruction plus breathing clearance`,
    measuredLayout.columns === viewport.columns &&
      measuredLayout.shellBottomObstruction === VIONA_WEB_BOTTOM_SHELL_OBSTRUCTION_PX &&
      measuredLayout.contentBreathingClearance === VIONA_REC2_HOME_CONTENT_BREATHING_CLEARANCE_PX &&
      measuredLayout.bottomPadding ===
        VIONA_WEB_BOTTOM_SHELL_OBSTRUCTION_PX + VIONA_REC2_HOME_CONTENT_BREATHING_CLEARANCE_PX
  );
}
const explicitWebReservation = resolveVionaRec2HomeBottomReservation({
  platform: 'web',
  safeAreaBottom: 0,
});
assert(
  'web reservation formula is shell obstruction plus content breathing clearance',
  explicitWebReservation.totalBottomReserve ===
    explicitWebReservation.shellBottomObstruction + explicitWebReservation.contentBreathingClearance
);
assert(
  'web shell obstruction includes tab bar and the highest shell-action overhang',
  VIONA_WEB_BOTTOM_SHELL_OBSTRUCTION_PX ===
    VIONA_WEB_BOTTOM_TAB_BAR_HEIGHT_PX + VIONA_WEB_BOTTOM_SHELL_ACTION_OVERHANG_PX
);

function srgbLuminance(rgb: readonly number[]): number {
  const channels = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(foreground: readonly number[], background: readonly number[]): number {
  const first = srgbLuminance(foreground);
  const second = srgbLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const gatedSubtitleSource = [167, 186, 203] as const;
const measuredBackdrop = [5, 13, 34] as const;
const measuredGatedBackground = [7, 26, 41] as const;
const gatedSubtitleComposite = gatedSubtitleSource.map((channel, index) =>
  Math.round(
    channel * VIONA_REC2_GATED_CARD_CONTENT_OPACITY +
      measuredBackdrop[index]! * (1 - VIONA_REC2_GATED_CARD_CONTENT_OPACITY)
  )
);
assert(
  'gated Business secondary text semantic opacity has measured-background contrast margin above 4.5 to 1',
  VIONA_REC2_GATED_CARD_CONTENT_OPACITY === 0.72 &&
    contrastRatio(gatedSubtitleComposite, measuredGatedBackground) >= 4.75
);
const malformedLayout = resolveVionaRec2HomeLayout({
  width: Number.NaN,
  height: Number.POSITIVE_INFINITY,
  fontScale: -4,
  safeAreaInsets: { top: null, right: -2, bottom: Number.NaN, left: 'bad' },
});
assert(
  'malformed layout metrics use finite bounded fallback',
  malformedLayout.width === 360 &&
    malformedLayout.height === 800 &&
    malformedLayout.fontScale === 1 &&
    Number.isFinite(malformedLayout.cardWidth) &&
    malformedLayout.cardWidth > 0
);

assert('RC2 feature flag default is OFF', resolveRec2HomeShellEnabled(undefined) === false);
assert('RC2 feature flag rejects arbitrary truthy text', resolveRec2HomeShellEnabled('yes') === false);
assert('RC2 feature flag accepts canonical true', resolveRec2HomeShellEnabled('true') === true);
assert('shared truthy parser remains exact', parseTruthyEnvString('false') === false && parseTruthyEnvString(' true ') === true);
assert('flag OFF selects complete reconstruction renderer', resolveHomeRendererSelection(false) === 'reconstruction');
assert('flag ON selects only RC2 renderer', resolveHomeRendererSelection(true) === 'rec2');
assert(
  'non-boolean truthy value cannot activate renderer',
  resolveHomeRendererSelection('true' as unknown as boolean) === 'reconstruction'
);

assert(
  'unlicensed visual uses gradient fallback',
  resolveVionaRec2ImagePresentation({ provenance: 'unknown', loadState: 'ready' }).mode === 'gradient-fallback'
);
assert(
  'licensed missing visual uses gradient fallback',
  resolveVionaRec2ImagePresentation({ provenance: 'licensed', loadState: 'missing' }).reason === 'image-unavailable'
);
assert(
  'licensed ready visual is the only image path',
  resolveVionaRec2ImagePresentation({ provenance: 'licensed', loadState: 'ready' }).mode === 'image'
);

const resolveTasksWithSpoofedInput = resolveVionaRec2TaskSurface as unknown as (
  spoofedCallerInput: unknown
) => ReturnType<typeof resolveVionaRec2TaskSurface>;
const taskSurface = resolveTasksWithSpoofedInput({
  title: 'Caller says verified',
  provenance: { kind: 'verified', reference: 'verified' },
});
assert('runtime task surface is explicitly adapterless', taskSurface.state === 'no-trusted-adapter');
assert('caller-supplied verified strings cannot create task truth', taskSurface.tasks.length === 0);

const resolveAlfredWithFixtureAttempt = resolveVionaRec2AlfredPresentation as unknown as (
  fixtureAttempt: unknown
) => ReturnType<typeof resolveVionaRec2AlfredPresentation>;
const alfred = resolveAlfredWithFixtureAttempt({ state: 'response', simulated: true });
assert('Alfred runtime remains unavailable despite fixture-like caller data', alfred.state === 'unavailable');
assert('Alfred voice action is always disabled', alfred.voiceActionEnabled === false);
let alfredUiOpenCount = 0;
assert(
  'Alfred open contract changes local UI exactly once',
  openVionaRec2AlfredUi(() => {
    alfredUiOpenCount += 1;
  }) === 'ui-opened' && alfredUiOpenCount === 1
);
assert(
  'notification surface is unavailable and has no fabricated badge',
  VIONA_REC2_NOTIFICATION_PRESENTATION.availability === 'unavailable' &&
    VIONA_REC2_NOTIFICATION_PRESENTATION.badgeCount === null
);

const en = readJson('src/i18n/locales/en.json');
const vi = readJson('src/i18n/locales/vi.json');
const enRec2 = objectAt(en, ['home', 'rec2']);
const viRec2 = objectAt(vi, ['home', 'rec2']);
const enLeafPaths = flattenLeafPaths(enRec2);
const viLeafPaths = flattenLeafPaths(viRec2);
assert('English and Vietnamese RC2 locale namespaces have identical leaf keys', JSON.stringify(enLeafPaths) === JSON.stringify(viLeafPaths));
assert(
  'English RC2 locale values are non-empty strings',
  enLeafPaths.every((leafPath) => {
    const value = leafPath.split('.').reduce<unknown>(
      (current, key) => (current as Record<string, unknown>)[key],
      enRec2
    );
    return typeof value === 'string' && value.trim().length > 0;
  })
);
assert(
  'Vietnamese RC2 locale values are non-empty strings',
  viLeafPaths.every((leafPath) => {
    const value = leafPath.split('.').reduce<unknown>(
      (current, key) => (current as Record<string, unknown>)[key],
      viRec2
    );
    return typeof value === 'string' && value.trim().length > 0;
  })
);
const publicLocaleCopy = [enRec2, viRec2]
  .flatMap((namespace) =>
    enLeafPaths.map((leafPath) =>
      leafPath.split('.').reduce<unknown>(
        (current, key) => (current as Record<string, unknown>)[key],
        namespace
      )
    )
  )
  .join('\n');
assert(
  'public RC2 assistant copy uses Viona and exposes no Alfred branding',
  objectAt(enRec2, ['alfred']).title === 'Viona' &&
    objectAt(viRec2, ['alfred']).title === 'Viona' &&
    !/Alfred/i.test(publicLocaleCopy)
);

const fallbackI18n = i18next.createInstance();
await fallbackI18n.init({
  lng: 'cs',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  interpolation: { escapeValue: false },
});
const fallbackHeadline = fallbackI18n.t('home.rec2.headline');
assert('locale without RC2 namespace falls back to English text', fallbackHeadline === (enRec2.headline as string));
assert('locale fallback never exposes raw translation key', fallbackHeadline !== 'home.rec2.headline');
await fallbackI18n.changeLanguage('vi');
assert(
  'Vietnamese interpolation resolves user-facing text',
  fallbackI18n.t('home.rec2.greetingNamed', { name: 'Minh' }).includes('Minh')
);

const homeSource = read('src/screens/HomeScreen.tsx');
const shellSource = read('src/components/viona/home/VionaRec2HomeShell.tsx');
const alfredSource = read('src/components/viona/home/VionaRec2AlfredPanel.tsx');
const contractSource = read('src/components/viona/home/vionaRec2HomeContract.ts');
const flagsSource = read('src/core/feature-flags/featureFlags.ts');
const presentationSource = read('src/navigation/homePresentationTarget.ts');
const mainTabSource = read('src/navigation/MainTabNavigator.tsx');
const rec2EntrySource = sourceBetween(
  homeSource,
  'function VionaRec2HomeEntry()',
  'function ReconstructionHomeScreen()'
);

assert(
  'technical Alfred identifiers may remain internal while public copy is Viona',
  contractSource.includes('VIONA_REC2_ALFRED_STATES') &&
    alfredSource.includes('VionaRec2AlfredPanel')
);

assert('HomeScreen has a single explicit renderer boundary', homeSource.includes("return renderer === 'rec2' ? <VionaRec2HomeEntry /> : <ReconstructionHomeScreen />;"));
assert('reconstruction Home implementation remains present', homeSource.includes('function ReconstructionHomeScreen()'));
assert('RC2 entry is isolated before reconstruction hooks mount', rec2EntrySource.length > 0);
assert(
  'RC2 entry contains no legacy wallet, provider, payment, or auto-submit action',
  !/(fetchBalance|patchUserPersonaOnServer|LeonaCall|autoSubmit|wallet|payment|requestPermissions?|setInterval|setTimeout)/i.test(rec2EntrySource)
);
assert('Local, Travel and Academy preserve the existing mini-app entry gates', [
  "openMiniApp('local'",
  "openMiniApp('travel'",
  "openMiniApp('academy'",
].every((token) => rec2EntrySource.includes(token)));
assert('Business route is guarded by live B2B access helper', rec2EntrySource.includes('if (!hasB2BWorkspaceAccess(user)) return;'));
assert('SOS entry reuses the existing shell guidance callback', rec2EntrySource.includes('sos: homeCommand.triggerSafetyAssist'));
assert(
  'Account and language reuse existing shell commands behind the offline action policy',
  rec2EntrySource.includes('account: homeCommand.openAccount') &&
    rec2EntrySource.includes('? homeCommand.openLanguageSheet')
);
assert('runtime Home shell does not accept task records', !shellSource.includes('tasks?:') && !shellSource.includes('tasks ='));
assert('runtime Home shell does not accept Alfred fixture state', !shellSource.includes('simulatedAlfredFixture') && !alfredSource.includes('simulatedFixture'));
assert('task fixture labels are absent from runtime contract', !contractSource.includes("kind: 'verified-local'"));
assert('shell uses measured container dimensions and real safe-area insets', [
  'onLayout={onRootLayout}',
  'measuredSize?.width ?? dimensions.width',
  'measuredSize?.height ?? dimensions.height',
  'useSafeAreaInsets',
  'safeAreaInsets: insets',
].every((token) => shellSource.includes(token)));
assert(
  'actual web shell and Home reserve consume one obstruction source',
  mainTabSource.includes("from './vionaBottomShellGeometry'") &&
    mainTabSource.includes('height: VIONA_WEB_BOTTOM_TAB_BAR_HEIGHT_PX') &&
    mainTabSource.includes('minHeight: VIONA_WEB_BOTTOM_SHELL_OBSTRUCTION_PX') &&
    shellSource.includes('paddingBottom: layout.shellBottomObstruction') &&
    shellSource.includes('paddingBottom: layout.contentBreathingClearance')
);
assert(
  'gated universe styling consumes the semantic opacity contract',
  shellSource.includes('opacity: VIONA_REC2_GATED_CARD_CONTENT_OPACITY')
);
assert('shell includes reduced-motion press alternatives', shellSource.includes('cardPressedReducedMotion') && alfredSource.includes('controlPressedReducedMotion'));
assert('guest, loading, empty, offline, gated, image fallback, focus and pressed representations exist', [
  'greetingGuest',
  "state === 'loading'",
  "state === 'offline'",
  "state === 'gated'",
  'imagePresentation.mode',
  'onFocus',
  'pressed',
].every((token) => shellSource.includes(token)));
assert('build-time flag remains exact and defaults off through undefined', flagsSource.includes('EXPO_PUBLIC_FEATURE_REC2_HOME_SHELL') && flagsSource.includes('resolveRec2HomeShellEnabled'));
assert('renderer choice lives beside the existing presentation target', presentationSource.includes('resolveHomeRendererSelection'));
assert('Home module has no high-risk call executed during module initialization', topLevelHighRiskCalls(homeSource).length === 0);
const importGraphAudit = auditLocalImportGraph('src/screens/HomeScreen.tsx');
console.log('[EVIDENCE] RC2 Home local import graph files audited=' + importGraphAudit.fileCount);
if (importGraphAudit.highRiskTopLevelCalls.length > 0) {
  console.error('[EVIDENCE] high-risk top-level calls=' + JSON.stringify(importGraphAudit.highRiskTopLevelCalls));
}
assert('local Home import graph has no provider/payment/mic/location action at module initialization', importGraphAudit.highRiskTopLevelCalls.length === 0);
const walletModuleSource = read('src/state/wallet.ts');
assert(
  'observed wallet module initializer is a local snapshot read, not a payment/provider action',
  walletModuleSource.includes('AsyncStorage.getItem(WALLET_STORAGE_KEY)') &&
    !/(fetch\s*\(|axios\.|confirmPayment|createPaymentIntent|requestPermissionsAsync)/.test(
      sourceBetween(walletModuleSource, 'void (async () => {', 'function persistWalletState()')
    )
);

const runtimeSources = [rec2EntrySource, shellSource, alfredSource, contractSource].join('\n');
const universeCardSource = sourceBetween(shellSource, 'function UniverseCard(', 'function ContentStateBanner(');
assert(
  'universe descriptions have no finite line cap or tail ellipsis',
  universeCardSource.includes('styles.cardSubtitle') &&
    !/cardSubtitle[^>]*(?:numberOfLines|ellipsizeMode)/.test(universeCardSource)
);
assert(
  'universe cards can grow with content instead of using a fixed or maximum height',
  shellSource.replace(/\r\n/g, '\n').includes('cardHost: {\n    minHeight: 180,') &&
    !/cardHost:\s*\{[^}]*(?:maxHeight|(?<!min)height)\s*:/s.test(shellSource)
);
assert(
  'Home applies the pure native artwork clearance to the header control region',
  shellSource.includes('{ paddingTop: layout.headerControlTopClearance }')
);
assert(
  'Home consumes font-aware line boxes and restacks constrained rows',
  shellSource.includes('resolveVionaRec2TypographyMetrics(layout.fontScale)') &&
    shellSource.includes('layout.columns === 1 && styles.commandRowStacked') &&
    shellSource.includes('layout.columns === 1 && styles.sectionHeadingColumn')
);
assert(
  'native tab shell consumes scalable shared geometry and remounts its measured subtree per scale',
  mainTabSource.includes('resolveVionaNativeBottomShellGeometry') &&
    mainTabSource.includes('nativeShellGeometry.labelLineCount') &&
    mainTabSource.includes('viona-native-bottom-shell-${nativeShellGeometry.fontScale}')
);
assert(
  'nested native BottomTabBar owns only the adaptive tabs band while the outer host owns total shell height',
  mainTabSource.includes('height: nativeTwoBandShellHeight') &&
    mainTabSource.includes('? nativeTabsBandHeight') &&
    mainTabSource.includes('Safe-area and utility chrome belong to the sibling chrome row.')
);
assert(
  'Viona panel consumes shared font-aware line boxes without capping accessibility scaling',
  alfredSource.includes('useWindowDimensions()') &&
    alfredSource.includes('resolveVionaRec2TypographyMetrics(fontScale)') &&
    alfredSource.includes('lineHeight: typography.microLineHeight') &&
    alfredSource.includes('lineHeight: typography.cardTitleLineHeight') &&
    alfredSource.includes('lineHeight: typography.bodyLineHeight') &&
    !/allowFontScaling\s*=\s*\{false\}|maxFontSizeMultiplier/.test(alfredSource)
);
assert(
  'presentation name and responsive grid geometry render as separate values',
  shellSource.includes("t(`home.rec2.layouts.${layout.mode}`)") &&
    shellSource.includes('{layout.columns} × {layout.rows}')
);
assert('RC2 runtime source contains no AI provider invocation', !/(openai|anthropic|LeonaCall|autoSubmit\s*:)/i.test(runtimeSources));
assert('RC2 runtime source contains no microphone request', !/(requestMicrophone|requestPermissionsAsync|Audio\.requestPermissions)/i.test(runtimeSources));
assert('RC2 runtime source contains no timer-based fake AI response', !/(setTimeout|setInterval)/.test(runtimeSources));

console.log(`\n[test-viona-rec2-home-shell-contract] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
}

void main().catch((error: unknown) => {
  console.error('[test-viona-rec2-home-shell-contract] unexpected error', error);
  process.exit(1);
});
