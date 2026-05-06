/**
 * Multiverse Hub theme — one dark shell, four “Aura” accent identities.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  AcademyAuraSvg,
  CharityAuraSvg,
  ServiceAuraSvg,
  TourismAuraSvg,
} from '../components/hub/hubAuraSvgs';
import {
  type HubId,
  auraHexToRgba,
  getAuraPair,
  getAuraPrimary,
  getAuraSecondary,
  hubCore,
} from '../theme/colors';

export type HubThemeValue = Readonly<{
  currentHub: HubId;
  setCurrentHub: (hub: HubId) => void;
  /** Primary aura (neon / platinum) — icons, active chrome */
  accentPrimary: string;
  accentSecondary: string;
  accentPair: readonly [string, string];
  /** 1px glass border tint */
  auraBorder: string;
  /** Soft shadow / outer glow color */
  auraGlow: string;
  iconTint: string;
  textPrimary: string;
  textImperialGold: string;
  backgroundTop: string;
  backgroundBottom: string;
  /**
   * Faint Hub watermark for screen backgrounds (map, heart, etc.).
   * Renders nothing if size is 0.
   */
  renderAuraWatermark: (size: Readonly<{ width: number; height: number }>) => ReactElement | null;
}>;

const defaultHub: HubId = 'HUB_SERVICE';

function buildHubThemeValue(hub: HubId): Omit<HubThemeValue, 'currentHub' | 'setCurrentHub' | 'renderAuraWatermark'> {
  const primary = getAuraPrimary(hub);
  const secondary = getAuraSecondary(hub);
  const pair = getAuraPair(hub);
  return {
    accentPrimary: primary,
    accentSecondary: secondary,
    accentPair: pair,
    auraBorder: auraHexToRgba(primary, 0.42),
    auraGlow: primary,
    iconTint: primary,
    textPrimary: hubCore.textPrimary,
    textImperialGold: hubCore.imperialGold,
    backgroundTop: hubCore.backgroundTop,
    backgroundBottom: hubCore.backgroundBottom,
  };
}

const defaultValue = buildHubThemeValue(defaultHub);

function selectWatermark(
  hub: HubId,
  width: number,
  height: number,
  stroke: string
): ReactElement | null {
  if (width <= 0 || height <= 0) return null;
  const common = { width, height, stroke, opacity: 0.1 } as const;
  switch (hub) {
    case 'HUB_SERVICE':
      return <ServiceAuraSvg {...common} />;
    case 'HUB_TOURISM':
      return <TourismAuraSvg {...common} />;
    case 'HUB_CHARITY':
      return <CharityAuraSvg {...common} />;
    case 'HUB_ACADEMY':
      return <AcademyAuraSvg {...common} />;
  }
}

const HubThemeContext = createContext<HubThemeValue | null>(null);

export type HubThemeProviderProps = Readonly<{
  children: ReactNode;
  initialHub?: HubId;
}>;

export function HubThemeProvider({ children, initialHub = defaultHub }: HubThemeProviderProps): ReactElement {
  const [currentHub, setCurrentHubState] = useState<HubId>(initialHub);

  const setCurrentHub = useCallback((hub: HubId) => {
    setCurrentHubState(hub);
  }, []);

  const base = useMemo(() => buildHubThemeValue(currentHub), [currentHub]);

  const renderAuraWatermark = useCallback(
    (size: Readonly<{ width: number; height: number }>) =>
      selectWatermark(currentHub, size.width, size.height, base.accentPrimary),
    [currentHub, base.accentPrimary]
  );

  const value = useMemo<HubThemeValue>(
    () => ({
      currentHub,
      setCurrentHub,
      ...base,
      renderAuraWatermark,
    }),
    [currentHub, setCurrentHub, base, renderAuraWatermark]
  );

  return <HubThemeContext.Provider value={value}>{children}</HubThemeContext.Provider>;
}

/**
 * Hub aura tokens + watermark renderer. Safe outside provider (falls back to `HUB_SERVICE`).
 */
export function useHubTheme(): HubThemeValue {
  const ctx = useContext(HubThemeContext);
  if (ctx != null) return ctx;

  return {
    currentHub: defaultHub,
    setCurrentHub: () => {},
    ...defaultValue,
    renderAuraWatermark: (size) => selectWatermark(defaultHub, size.width, size.height, defaultValue.accentPrimary),
  };
}
