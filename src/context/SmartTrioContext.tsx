import * as Localization from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { resolveSmartTrioLocale } from '../core/i18n/resolveSmartTrioLocale';
import type {
  MarketCode,
  ResolvedSmartTrioLocale,
  SmartTrioLocale,
  UserLanguageRole,
} from '../core/i18n/smartTrioTypes';
import { resolveMarketCode } from '../core/markets/resolveMarketCode';
import type { ActiveRole } from '../store/userStore';
import { useUserStore } from '../store/userStore';
import { useAuth } from './AuthContext';

export type SmartTrioContextValue = Readonly<{
  resolved: ResolvedSmartTrioLocale;
  currentMarket: MarketCode;
  supportedLocales: readonly SmartTrioLocale[];
  appLocale: SmartTrioLocale;
  customerLocale: SmartTrioLocale;
  merchantLocale: SmartTrioLocale;
  nativeLocale: SmartTrioLocale;
  userSelectedLocale: string | undefined;
  marketCode: MarketCode;
  setUserSelectedLocale: (locale: string | undefined) => void;
  setMarketCode: (code: MarketCode) => void;
}>;

const SmartTrioContext = createContext<SmartTrioContextValue | null>(null);

function readDeviceLocaleTag(): string | undefined {
  const loc = Localization.getLocales()[0];
  return loc?.languageTag ?? loc?.languageCode ?? undefined;
}

function activeRoleToUserLanguageRole(role: ActiveRole): UserLanguageRole {
  switch (role) {
    case 'B2B':
      return 'merchant';
    case 'BROKER':
      return 'broker';
    case 'ADMIN':
      return 'admin';
    case 'B2C':
    default:
      return 'customer';
  }
}

export function SmartTrioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const currentActiveRole = useUserStore((s) => s.currentActiveRole);

  const profileMarket = useMemo(() => resolveMarketCode(user?.country), [user?.country]);

  const [marketOverride, setMarketOverride] = useState<MarketCode | null>(null);
  const [userSelectedLocale, setUserSelectedLocale] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMarketOverride(null);
  }, [user?.country]);

  const currentMarket: MarketCode = marketOverride ?? profileMarket;
  const deviceLocale = useMemo(() => readDeviceLocaleTag(), []);
  const userRole = useMemo(
    () => activeRoleToUserLanguageRole(currentActiveRole),
    [currentActiveRole]
  );

  const resolved = useMemo(
    () =>
      resolveSmartTrioLocale({
        userSelectedLocale,
        deviceLocale,
        marketCode: currentMarket,
        userRole,
      }),
    [userSelectedLocale, deviceLocale, currentMarket, userRole]
  );

  const setMarketCode = useCallback((code: MarketCode) => {
    setMarketOverride(code);
  }, []);

  const value = useMemo<SmartTrioContextValue>(
    () => ({
      resolved,
      currentMarket,
      supportedLocales: resolved.supportedLocales,
      appLocale: resolved.appLocale,
      customerLocale: resolved.customerLocale,
      merchantLocale: resolved.merchantLocale,
      nativeLocale: resolved.nativeLocale,
      userSelectedLocale,
      marketCode: currentMarket,
      setUserSelectedLocale: setUserSelectedLocale,
      setMarketCode,
    }),
    [resolved, currentMarket, userSelectedLocale, setMarketCode]
  );

  return <SmartTrioContext.Provider value={value}>{children}</SmartTrioContext.Provider>;
}

export function useSmartTrio(): SmartTrioContextValue {
  const ctx = useContext(SmartTrioContext);
  if (!ctx) {
    throw new Error('useSmartTrio must be used within SmartTrioProvider');
  }
  return ctx;
}
