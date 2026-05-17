import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { normalizeCountryCodeOrSentinel, resolveCountryPack, type PricingTierId } from '../config/countryPacks';
import type { DocumentVaultItem } from '../services/DocumentAlarmService';
import { identifyUser, resetUser } from '../services/AnalyticsService';
import { clearRestApiJwt } from '../services/apiClient';
import { ensureWalletFirebaseAuth } from '../services/walletFirebaseSession';
import { getWalletState, syncWalletFromServer } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import type {
  AuthUser,
  ResidencyStatus,
  ServerUserRole,
  SubscriptionPlan,
  UserPersona,
  UserSegment,
} from './authTypes';
import { normalizeServerUserRole } from './authTypes';

export type { AuthUser, ResidencyStatus, ServerUserRole, SubscriptionPlan, UserPersona, UserSegment } from './authTypes';

export type RedirectTarget =
  | 'HocTap'
  | 'Academy'
  | 'LeTan'
  | 'Wallet'
  | 'AiEye'
  | 'LeonaCall'
  | 'Vault'
  | 'LiveInterpreter'
  | 'RadarDiscovery'
  | 'B2BPaywall';

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
    persona?: UserPersona;
    needsPersonaOnboarding?: boolean;
    serverUserId?: string;
    serverRole?: ServerUserRole;
    kycVerified?: boolean;
    businessCategory?: string | null;
    workspaceUiOverride?: 'consumer' | null;
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
            const rawPersona = (parsed as { persona?: unknown }).persona;
            const persona: UserPersona = rawPersona === 'TOURIST' ? 'TOURIST' : 'EXPAT';
            const needsPersonaOnboarding = (parsed as { needsPersonaOnboarding?: unknown }).needsPersonaOnboarding === true;
            const serverRole = normalizeServerUserRole((parsed as { serverRole?: unknown }).serverRole);
            const kycVerified = (parsed as { kycVerified?: unknown }).kycVerified === true;
            const businessCategoryRaw = (parsed as { businessCategory?: unknown }).businessCategory;
            const businessCategory =
              typeof businessCategoryRaw === 'string' && businessCategoryRaw.trim().length > 0
                ? businessCategoryRaw.trim()
                : null;
            const serverUserIdRaw = (parsed as { serverUserId?: unknown }).serverUserId;
            const serverUserId = typeof serverUserIdRaw === 'string' && serverUserIdRaw.length > 0 ? serverUserIdRaw : undefined;
            const workspaceUiRaw = (parsed as { workspaceUiOverride?: unknown }).workspaceUiOverride;
            const workspaceUiOverride = workspaceUiRaw === 'consumer' ? ('consumer' as const) : undefined;
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
              persona,
              needsPersonaOnboarding,
              serverUserId,
              serverRole,
              kycVerified,
              businessCategory,
              ...(workspaceUiOverride ? { workspaceUiOverride } : {}),
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

  useEffect(() => {
    const u = user;
    if (!u) return;
    const id = u.serverUserId?.trim();
    if (!id) return;
    identifyUser(id, {
      persona: u.persona,
      tier: u.subscriptionPlan ?? 'free',
      role: String(u.serverRole ?? 'B2C'),
    });
  }, [user?.serverUserId, user?.persona, user?.subscriptionPlan, user?.serverRole]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isHydrating,
      pendingLogin,
      pendingRedirect,
      setPendingRedirect,
      beginLogin: (phone: string) => setPendingLogin({ phone }),
      completeProfile: ({
        name,
        country,
        countryTier,
        residencyStatus,
        visaType,
        visaExpiryDate,
        subscriptionPlan,
        segment,
      }) => {
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
          segment: segment ?? 'adult',
          aiCallCredits: getWalletState().credits,
          isLearningFullUnlocked: false,
          isLearningUnlocked: false,
          identityDocuments: [],
          persona: 'EXPAT' as UserPersona,
          needsPersonaOnboarding: true,
          serverRole: 'B2C',
          kycVerified: false,
          businessCategory: null,
        } satisfies AuthUser;
        setUser(nextUser);
        void AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
        setPendingLogin(null);
      },
      updateProfile: (input) => {
        if (!user) return;
        const { workspaceUiOverride: workspaceUiPatch, ...profileRest } = input;
        const normalizedCountry =
          typeof profileRest.country === 'string'
            ? normalizeCountryCodeOrSentinel(profileRest.country)
            : user.country;
        const nextPersona: UserPersona =
          profileRest.persona === 'TOURIST'
            ? 'TOURIST'
            : profileRest.persona === 'EXPAT'
              ? 'EXPAT'
              : user.persona;
        const nextServerRole =
          profileRest.serverRole !== undefined
            ? normalizeServerUserRole(profileRest.serverRole)
            : user.serverRole;
        const nextKycVerified =
          typeof profileRest.kycVerified === 'boolean' ? profileRest.kycVerified : user.kycVerified;
        const nextBusinessCategory =
          profileRest.businessCategory !== undefined ? profileRest.businessCategory : user.businessCategory;
        const nextServerUserId =
          profileRest.serverUserId !== undefined ? profileRest.serverUserId : user.serverUserId;
        const nextUser: AuthUser = {
          ...user,
          ...profileRest,
          country: normalizedCountry,
          persona: nextPersona,
          needsPersonaOnboarding:
            typeof profileRest.needsPersonaOnboarding === 'boolean'
              ? profileRest.needsPersonaOnboarding
              : user.needsPersonaOnboarding,
          serverRole: nextServerRole,
          kycVerified: nextKycVerified,
          businessCategory: nextBusinessCategory,
          serverUserId: nextServerUserId,
          aiCallCredits: getWalletState().credits,
        };
        if (workspaceUiPatch === null) {
          delete nextUser.workspaceUiOverride;
        } else if (workspaceUiPatch !== undefined) {
          nextUser.workspaceUiOverride = workspaceUiPatch;
        }
        setUser(nextUser);
        void AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      },
      logout: () => {
        setUser(null);
        setPendingLogin(null);
        setPendingRedirect(null);
        void AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        void clearRestApiJwt();
        resetUser();
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
