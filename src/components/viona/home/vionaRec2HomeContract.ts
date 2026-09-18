import {
  resolveVionaRec2HomeBottomReservation,
  type VionaBottomShellPlatform,
} from '../../../navigation/vionaBottomShellGeometry';

export const VIONA_REC2_UNIVERSE_ORDER = [
  'local',
  'travel',
  'academy',
  'business',
  'account',
  'sos',
] as const;

export type VionaRec2UniverseId = (typeof VIONA_REC2_UNIVERSE_ORDER)[number];
export type VionaRec2Availability = 'available' | 'gated' | 'unavailable';
export type VionaRec2LayoutMode = 'web' | 'tablet-landscape' | 'tablet-portrait' | 'phone';
export type VionaRec2LayoutClass = 'three-column' | 'two-column' | 'one-column';
export type VionaRec2Orientation = 'landscape' | 'portrait' | 'square';
export type VionaRec2ContentState = 'default' | 'loading' | 'empty' | 'offline' | 'gated';

/** Gated content stays visibly subordinate without dropping body text below AA contrast. */
export const VIONA_REC2_GATED_CARD_CONTENT_OPACITY = 0.72;

/**
 * The app shell owns a native top-end brand decoration. Home moves its controls
 * below that artwork band instead of relying on pointer behavior over an overlap.
 */
export const VIONA_REC2_NATIVE_HEADER_CONTROL_TOP_CLEARANCE_DP = 22;

export type VionaRec2UniverseCallbacks = Readonly<
  Partial<Record<VionaRec2UniverseId, () => void>>
>;

export type VionaRec2UniverseAvailabilityInput = Readonly<{
  localEnabled: boolean;
  travelEnabled: boolean;
  academyEnabled: boolean;
  businessEligible: boolean;
  accountAvailable: boolean;
  sosAvailable: boolean;
}>;

export type VionaRec2UniverseContract = Readonly<{
  id: VionaRec2UniverseId;
  availability: VionaRec2Availability;
}>;

function optionalSurfaceAvailability(enabled: boolean): VionaRec2Availability {
  return enabled ? 'available' : 'unavailable';
}

/**
 * The order is canonical for the RC2 Home candidate. Business is the only
 * permission-gated universe; unavailable callbacks never become implicit routes.
 */
export function createVionaRec2UniverseContract(
  input: VionaRec2UniverseAvailabilityInput
): readonly VionaRec2UniverseContract[] {
  return VIONA_REC2_UNIVERSE_ORDER.map((id) => {
    switch (id) {
      case 'local':
        return { id, availability: optionalSurfaceAvailability(input.localEnabled) };
      case 'travel':
        return { id, availability: optionalSurfaceAvailability(input.travelEnabled) };
      case 'academy':
        return { id, availability: optionalSurfaceAvailability(input.academyEnabled) };
      case 'business':
        return { id, availability: input.businessEligible ? 'available' : 'gated' };
      case 'account':
        return { id, availability: optionalSurfaceAvailability(input.accountAvailable) };
      case 'sos':
        return { id, availability: optionalSurfaceAvailability(input.sosAvailable) };
    }
  });
}

export type VionaRec2NavigationResult = 'opened' | 'blocked' | 'missing-callback';

/** Runs only an explicitly supplied callback for an available universe. */
export function invokeVionaRec2UniverseCallback(
  universe: VionaRec2UniverseContract,
  callbacks: VionaRec2UniverseCallbacks
): VionaRec2NavigationResult {
  if (universe.availability !== 'available') return 'blocked';
  const callback = callbacks[universe.id];
  if (typeof callback !== 'function') return 'missing-callback';
  callback();
  return 'opened';
}

export type VionaRec2TaskSurface = Readonly<{
  state: 'no-trusted-adapter';
  tasks: readonly never[];
}>;

/**
 * V1 has no trusted task adapter. Caller strings such as "verified" are not
 * execution proof and cannot create a runtime task card.
 */
export function resolveVionaRec2TaskSurface(): VionaRec2TaskSurface {
  return { state: 'no-trusted-adapter', tasks: [] };
}

function finitePositive(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

export type VionaRec2TypographyMetrics = Readonly<{
  fontScale: number;
  brandLineHeight: number;
  microLineHeight: number;
  greetingLineHeight: number;
  headlineLineHeight: number;
  bodyLineHeight: number;
  sectionTitleLineHeight: number;
  cardTitleLineHeight: number;
  availabilityLineHeight: number;
  truthLineHeight: number;
}>;

/**
 * Android can update scaled glyphs before previously measured text boxes are
 * invalidated. Supplying font-aware line boxes forces a truthful remeasure at
 * every supported scale without shrinking or capping the user's text.
 */
export function resolveVionaRec2TypographyMetrics(fontScaleInput: unknown): VionaRec2TypographyMetrics {
  const fontScale = Math.min(3, Math.max(0.75, finitePositive(fontScaleInput, 1)));
  const scaled = (base: number) => Math.ceil(base * fontScale);
  return {
    fontScale,
    brandLineHeight: scaled(31),
    microLineHeight: scaled(14),
    greetingLineHeight: scaled(18),
    headlineLineHeight: scaled(34),
    bodyLineHeight: scaled(17),
    sectionTitleLineHeight: scaled(24),
    cardTitleLineHeight: scaled(24),
    availabilityLineHeight: scaled(14),
    truthLineHeight: scaled(15),
  };
}

export type VionaRec2SafeAreaInsetsInput = Readonly<{
  top: unknown;
  right: unknown;
  bottom: unknown;
  left: unknown;
}>;

export type VionaRec2LayoutInput = Readonly<{
  width: unknown;
  height: unknown;
  fontScale: unknown;
  safeAreaInsets?: VionaRec2SafeAreaInsetsInput;
  shellPlatform?: VionaBottomShellPlatform;
}>;

export type VionaRec2Layout = Readonly<{
  width: number;
  height: number;
  effectiveWidth: number;
  fontScale: number;
  platform: VionaBottomShellPlatform;
  orientation: VionaRec2Orientation;
  mode: VionaRec2LayoutMode;
  layoutClass: VionaRec2LayoutClass;
  columns: 1 | 2 | 3;
  rows: 2 | 3 | 6;
  horizontalPadding: number;
  headerControlTopClearance: number;
  shellBottomObstruction: number;
  contentBreathingClearance: number;
  bottomPadding: number;
  gap: number;
  cardWidth: number;
}>;

/**
 * Width, height, font scale and real shell insets jointly select the layout.
 * Invalid metrics use finite phone-safe values; this pure calculation is not
 * native orientation proof.
 */
export function resolveVionaRec2HomeLayout(input: VionaRec2LayoutInput): VionaRec2Layout {
  const width = finitePositive(input.width, 360);
  const height = finitePositive(input.height, 800);
  const rawFontScale = finitePositive(input.fontScale, 1);
  const fontScale = Math.min(3, Math.max(0.75, rawFontScale));
  const leftInset = finiteNonNegative(input.safeAreaInsets?.left);
  const rightInset = finiteNonNegative(input.safeAreaInsets?.right);
  const bottomInset = finiteNonNegative(input.safeAreaInsets?.bottom);
  const effectiveWidth = Math.max(1, width - leftInset - rightInset);
  const platform = input.shellPlatform ?? 'native';
  const orientation: VionaRec2Orientation =
    effectiveWidth > height ? 'landscape' : effectiveWidth < height ? 'portrait' : 'square';
  const horizontalPadding = effectiveWidth >= 1280 ? 32 : effectiveWidth >= 720 ? 24 : 16;
  const bottomReservation = resolveVionaRec2HomeBottomReservation({
    platform,
    safeAreaBottom: bottomInset,
  });
  const gap = effectiveWidth >= 720 ? 16 : 12;

  let columns: 1 | 2 | 3;
  if (effectiveWidth >= 1280) {
    columns = 3;
  } else if (effectiveWidth >= 720) {
    columns = orientation === 'landscape' ? 3 : 2;
  } else {
    const contentWidth = Math.max(1, effectiveWidth - horizontalPadding * 2);
    const twoColumnReadableWidth = (contentWidth - gap) / 2 / fontScale;
    columns = twoColumnReadableWidth >= 142 ? 2 : 1;
  }

  const mode: VionaRec2LayoutMode =
    platform === 'web'
      ? 'web'
      : effectiveWidth >= 720
        ? orientation === 'landscape'
          ? 'tablet-landscape'
          : 'tablet-portrait'
        : 'phone';
  const contentWidth = Math.max(1, effectiveWidth - horizontalPadding * 2);
  const cardWidth = Math.max(1, (contentWidth - gap * (columns - 1)) / columns);
  const rows = (columns === 3 ? 2 : columns === 2 ? 3 : 6) as 2 | 3 | 6;
  const layoutClass: VionaRec2LayoutClass =
    columns === 3 ? 'three-column' : columns === 2 ? 'two-column' : 'one-column';
  return {
    width,
    height,
    effectiveWidth,
    fontScale,
    platform,
    orientation,
    mode,
    layoutClass,
    columns,
    rows,
    horizontalPadding,
    headerControlTopClearance:
      platform === 'native' ? VIONA_REC2_NATIVE_HEADER_CONTROL_TOP_CLEARANCE_DP : 0,
    shellBottomObstruction: bottomReservation.shellBottomObstruction,
    contentBreathingClearance: bottomReservation.contentBreathingClearance,
    bottomPadding: bottomReservation.totalBottomReserve,
    gap,
    cardWidth,
  };
}

export type VionaRec2ImageInput = Readonly<{
  provenance: 'licensed' | 'unknown' | 'unverified';
  loadState: 'ready' | 'loading' | 'error' | 'missing';
}>;

export type VionaRec2ImagePresentation = Readonly<{
  mode: 'image' | 'gradient-fallback';
  reason: 'licensed-ready' | 'license-unproven' | 'image-unavailable';
}>;

export function resolveVionaRec2ImagePresentation(
  input: VionaRec2ImageInput
): VionaRec2ImagePresentation {
  if (input.provenance !== 'licensed') {
    return { mode: 'gradient-fallback', reason: 'license-unproven' };
  }
  if (input.loadState !== 'ready') {
    return { mode: 'gradient-fallback', reason: 'image-unavailable' };
  }
  return { mode: 'image', reason: 'licensed-ready' };
}

export const VIONA_REC2_ALFRED_STATES = [
  'idle',
  'permission-required',
  'listening',
  'processing',
  'response',
  'interrupted',
  'offline',
  'unavailable',
  'error',
] as const;

export type VionaRec2AlfredState = (typeof VIONA_REC2_ALFRED_STATES)[number];

export type VionaRec2AlfredPresentation = Readonly<{
  state: 'unavailable';
  voiceActionEnabled: false;
}>;

/** Runtime V1 is always unavailable and voice-disabled; fixtures stay in tests. */
export function resolveVionaRec2AlfredPresentation(): VionaRec2AlfredPresentation {
  return { state: 'unavailable', voiceActionEnabled: false };
}

/** Opens local panel UI only. This contract has no provider, voice, wallet, or submit action. */
export function openVionaRec2AlfredUi(openUi: () => void): 'ui-opened' {
  openUi();
  return 'ui-opened';
}

export const VIONA_REC2_NOTIFICATION_PRESENTATION = Object.freeze({
  availability: 'unavailable' as const,
  badgeCount: null,
});
