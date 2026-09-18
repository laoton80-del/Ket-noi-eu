/**
 * Reserved height for the web bottom tab-bar host. Matches MainTabNavigator's
 * actual rendered `tabBarStyle.height` on web (non-compact `tabBarBaseHeight`
 * 56 plus the 10px minimum bottom-inset fallback used there) instead of an
 * independently-guessed smaller number. The prior value (49) was smaller than
 * the bar it wraps, so the real bar silently overflowed above this host's
 * boundary and Home's bottom reservation (derived from this same constant)
 * under-reserved space, letting scene content paint behind the bar.
 */
export const VIONA_WEB_BOTTOM_TAB_BAR_HEIGHT_PX = 66;

/**
 * The global SOS shell action rises above the tab bar by this measured
 * amount, plus a safety margin for cross-browser text/measurement variance
 * (this value only participates on Web; native uses a separate non-overlapping
 * chrome row that is not affected by this constant).
 */
export const VIONA_WEB_BOTTOM_SHELL_ACTION_OVERHANG_PX = 20;

/** Highest web shell chrome edge that Home content must remain below. */
export const VIONA_WEB_BOTTOM_SHELL_OBSTRUCTION_PX =
  VIONA_WEB_BOTTOM_TAB_BAR_HEIGHT_PX + VIONA_WEB_BOTTOM_SHELL_ACTION_OVERHANG_PX;

/** Existing Home terminal breathing room, kept separate from shell obstruction. */
export const VIONA_REC2_HOME_CONTENT_BREATHING_CLEARANCE_PX = 28;

export type VionaBottomShellPlatform = 'web' | 'native';

export type VionaHomeBottomReservation = Readonly<{
  shellBottomObstruction: number;
  contentBreathingClearance: number;
  totalBottomReserve: number;
}>;

/**
 * React Navigation merges route options after navigator screenOptions with
 * Object.assign semantics. Omitting this key preserves the adaptive native
 * tab-bar style; emitting `tabBarStyle: undefined` would erase it.
 */
export function resolveVionaHomeRouteTabBarStyleOverride<T>(
  hideTabBar: boolean,
  hiddenStyle: T
): Readonly<{ tabBarStyle?: T }> {
  return hideTabBar ? { tabBarStyle: hiddenStyle } : {};
}

function finiteNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function finitePositive(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

export type VionaNativeBottomShellGeometry = Readonly<{
  fontScale: number;
  compactTabs: boolean;
  tabBarBaseHeight: number;
  labelSize: number;
  iconSize: number;
  labelLineHeight: number;
  labelLineCount: 1 | 2;
  tabsBandHeight: number;
  chromeRowHeight: number;
  bottomPadding: number;
  totalHeight: number;
}>;

/**
 * Native tab labels and chrome controls participate in system font scaling.
 * This single geometry contract grows the non-overlapping two-band shell so
 * scalable labels are measured instead of being painted into font-1 bounds.
 */
export function resolveVionaNativeBottomShellGeometry(input: Readonly<{
  width: unknown;
  fontScale: unknown;
  safeAreaBottom: unknown;
  chromeRowBase: number;
}>): VionaNativeBottomShellGeometry {
  const width = finitePositive(input.width, 360);
  const fontScale = Math.min(3, Math.max(0.75, finitePositive(input.fontScale, 1)));
  const compactTabs = width <= 375;
  const tabBarBaseHeight = compactTabs ? 52 : 56;
  const labelSize = compactTabs ? 10 : 11;
  const iconSize = compactTabs ? 22 : 24;
  const labelLineCount = (fontScale >= 1.3 ? 2 : 1) as 1 | 2;
  const labelLineHeight = Math.ceil(labelSize * 1.3 * fontScale);
  const tabsBandHeight = Math.max(
    tabBarBaseHeight + 8,
    4 + iconSize + 2 + labelLineHeight * labelLineCount + 8
  );
  const chromeLabelLineHeight = Math.ceil(10 * 1.35 * fontScale);
  const chromeRowHeight = Math.max(
    input.chromeRowBase,
    18 + 4 + chromeLabelLineHeight + 5 + 12
  );
  const bottomPadding = Math.max(finiteNonNegative(input.safeAreaBottom), 10);

  return {
    fontScale,
    compactTabs,
    tabBarBaseHeight,
    labelSize,
    iconSize,
    labelLineHeight,
    labelLineCount,
    tabsBandHeight,
    chromeRowHeight,
    bottomPadding,
    totalHeight: tabsBandHeight + chromeRowHeight + bottomPadding,
  };
}

/**
 * Home content needs both the shell obstruction and its own breathing room.
 * Native keeps its existing safe-area behavior because its shell occupies a
 * non-overlapping navigation band; only web has an overlay obstruction here.
 */
export function resolveVionaRec2HomeBottomReservation(input: Readonly<{
  platform: VionaBottomShellPlatform;
  safeAreaBottom: unknown;
}>): VionaHomeBottomReservation {
  const safeAreaBottom = finiteNonNegative(input.safeAreaBottom);
  const shellBottomObstruction =
    input.platform === 'web' ? VIONA_WEB_BOTTOM_SHELL_OBSTRUCTION_PX : 0;
  const contentBreathingClearance = Math.max(
    VIONA_REC2_HOME_CONTENT_BREATHING_CLEARANCE_PX,
    safeAreaBottom + 16
  );

  return {
    shellBottomObstruction,
    contentBreathingClearance,
    totalBottomReserve: shellBottomObstruction + contentBreathingClearance,
  };
}
