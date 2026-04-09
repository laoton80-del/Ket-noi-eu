import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { normalizeCountryCodeOrSentinel, resolveCountryPack, type PricingTierId } from '../config/countryPacks';
import type { DocumentVaultItem } from '../services/DocumentAlarmService';
import { ensureWalletFirebaseAuth } from '../services/walletFirebaseSession';
import { getWalletState, syncWalletFromServer } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import type { AuthUser, ResidencyStatus, SubscriptionPlan, UserSegment } from './authTypes';

export type { AuthUser, ResidencyStatus, SubscriptionPlan, UserSegment } from './authTypes';

export type RedirectTarget =
  | 'HocTap'
  | 'LeTan'
  | 'Wallet'
  | 'AiEye'
  | 'LeonaCall'
  | 'Vault'
  | 'LiveInterpreter'
  | 'RadarDiscovery';

type PendingLogin = {
  phone: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isHydrating: boolean;
  pendingLogin: PendingLogin | null;
  pendingRedirect: RedirectTarget | null;
  setPendingRedirect: (target: RedirectTarget | null) => void;
  beginLogin: (phone: string) => void;
  completeProfile: (input: {
    name: string;
    country: string;
    countryTier: PricingTierId;
    residencyStatus: ResidencyStatus;
    visaType: string;
    visaExpiryDate: string;
    subscriptionPlan?: SubscriptionPlan;
    segment?: UserSegment;
  }) => void;
  updateProfile: (input: {
    name?: string;
    country?: string;
    countryTier?: PricingTierId;
    residencyStatus?: ResidencyStatus;
    visaType?: string;
    visaExpiryDate?: string;
    subscriptionPlan?: SubscriptionPlan;
    segment?: UserSegment;
    isLearningFullUnlocked?: boolean;
    isLearningUnlocked?: boolean;
    identityDocuments?: Pick<DocumentVaultItem, 'id' | 'documentType' | 'expiryDate' | 'holderName'>[];
  }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
/** Local auth profile snapshot; authoritative for pilot UI. See `storage/sourceOfTruth.ts`. */
const AUTH_STORAGE_KEY = STORAGE_KEYS.authSession;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<RedirectTarget | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AuthUser>;
          if (parsed?.phone && parsed?.name) {
            const country = normalizeCountryCodeOrSentinel(parsed.country);
            const legacyTier = (parsed.countryTier as unknown as string) ?? '';
            const normalizedTier: PricingTierId =
              legacyTier === 'tier1'
                ? 'T1'
                : legacyTier === 'tier2'
                  ? 'T2'
                  : legacyTier === 'T1' || legacyTier === 'T2' || legacyTier === 'T3' || legacyTier === 'T4'
                    ? (legacyTier as PricingTierId)
                    : resolveCountryPack(country).pricingTier;
            const nextUser: AuthUser = {
              phone: parsed.phone,
              name: parsed.name,
              country,
              countryTier: normalizedTier,
              residencyStatus: parsed.residencyStatus ?? 'lao_dong',
              visaType: parsed.visaType ?? '',
              visaExpiryDate: parsed.visaExpiryDate ?? '',
              subscriptionPlan: parsed.subscriptionPlan ?? 'free',
              segment: parsed.segment ?? 'adult',
              aiCallCredits: getWalletState().credits,
              isLearningFullUnlocked: parsed.isLearningFullUnlocked === true || parsed.isLearningUnlocked === true,
              isLearningUnlocked: parsed.isLearningUnlocked === true,
              identityDocuments: Array.isArray(parsed.identityDocuments) ? parsed.identityDocuments : [],
            };
            setUser(nextUser);
            void AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
          }
        }
      } finally {
        setIsHydrating(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    void ensureWalletFirebaseAuth();
  }, [user]);

  useEffect(() => {
    if (!user?.phone) return;
    void syncWalletFromServer();
  }, [user?.phone]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isHydrating,
      pendingLogin,
      pendingRedirect,
      setPendingRedirect,
      beginLogin: (phone: string) => setPendingLogin({ phone }),
      completeProfile: ({ name, country, countryTier, residencyStatus, visaType, visaExpiryDate, subscriptionPlan }) => {
        if (!pendingLogin) return;
        const normalizedCountry = normalizeCountryCodeOrSentinel(country);
        const tier = countryTier ?? resolveCountryPack(normalizedCountry).pricingTier;
        const nextUser = {
          phone: pendingLogin.phone,
          name,
          country: normalizedCountry,
          countryTier: tier,
          residencyStatus,
          visaType,
          visaExpiryDate,
          subscriptionPlan: subscriptionPlan ?? 'free',
          segment: 'adult',
          aiCallCredits: getWalletState().credits,
          isLearningFullUnlocked: false,
          isLearningUnlocked: false,
          identityDocuments: [],
        } satisfies AuthUser;
        setUser(nextUser);
        void AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
        setPendingLogin(null);
      },
      updateProfile: (input) => {
        if (!user) return;
        const normalizedCountry =
          typeof input.country === 'string'
            ? normalizeCountryCodeOrSentinel(input.country)
            : user.country;
        const nextUser: AuthUser = {
          ...user,
          ...input,
          country: normalizedCountry,
          aiCallCredits: getWalletState().credits,
        };
        setUser(nextUser);
        void AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      },
      logout: () => {
        setUser(null);
        setPendingLogin(null);
        setPendingRedirect(null);
        void AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    [isHydrating, pendingLogin, pendingRedirect, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
