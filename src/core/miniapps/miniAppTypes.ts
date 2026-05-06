import type { FeatureFlagKey, FeatureFlags } from '../feature-flags/featureFlags';

/** Logical universe for registry / analytics (not always 1:1 with a single screen). */
export type MiniAppUniverse =
  | 'hub'
  | 'local'
  | 'travel'
  | 'academy'
  | 'merchant'
  | 'income'
  | 'admin';

/**
 * Product lifecycle / trust label for a mini-app.
 * Aligns with V2 blueprint (Active / Lite / Demo / Pilot / …).
 */
export type MiniAppStatus =
  | 'active'
  | 'lite'
  | 'demo'
  | 'pilot'
  | 'beta'
  | 'comingSoon'
  | 'gated'
  | 'frozen';

/**
 * Shell role used for resolver gates (lowercase, product vocabulary).
 * Map from `ActiveRole` via `activeRoleToMiniAppRole` in `resolveMiniAppEntry.ts`.
 */
export type MiniAppRole = 'guest' | 'b2c' | 'merchant' | 'broker' | 'admin';

export type MiniAppRiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'financial'
  | 'ai'
  | 'legal'
  | 'medical';

export type MiniAppReadiness = 'ready' | 'partial' | 'notReady';

export type MiniAppMonetizationModel =
  | 'free'
  | 'credits'
  | 'subscription'
  | 'transaction_fee'
  | 'saas'
  | 'none';

export type MiniAppId =
  | 'hub'
  | 'local'
  | 'booking'
  | 'merchantDashboard'
  | 'b2bAiReceptionist'
  | 'b2cAiCallAssistant'
  | 'travel'
  | 'travelOutbound'
  | 'travelInboundVietnam'
  | 'travelReturnToVietnam'
  | 'academy'
  | 'leonaAssistant'
  | 'minhKhangTranslator'
  | 'brokerQr'
  | 'admin';

/**
 * Navigation target string.
 * - `Tabs/<TabName>` — name inside `RootTabParamList` after switching to `Tabs` stack.
 * - Otherwise — a `keyof RootStackParamList` stack route (single screen).
 */
export type MiniAppRouteRef = string;

export interface MiniAppDefinition {
  readonly id: MiniAppId;
  readonly universe: MiniAppUniverse;
  /** i18n key for display name (add under `miniapps.*` when wiring UI). */
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly route: MiniAppRouteRef;
  readonly status: MiniAppStatus;
  /** When set, `enabledFeatureFlags[key]` must be true to pass the flag gate. */
  readonly featureFlag?: FeatureFlagKey;
  /** User must have at least one of these roles (empty = no role gate). */
  readonly requiredRoles: readonly MiniAppRole[];
  readonly permissions: readonly string[];
  readonly dataDependencies: readonly string[];
  readonly monetizationModel: MiniAppMonetizationModel;
  readonly riskLevel: MiniAppRiskLevel;
  readonly readiness: MiniAppReadiness;
  readonly primaryCtaKey: string;
}

export type ResolveMiniAppEntryInput = Readonly<{
  miniAppId: string;
  userRole: MiniAppRole;
  enabledFeatureFlags: FeatureFlags;
  /** Reserved for destination/market gates (Travel); not enforced in foundation v1. */
  currentMarket?: string;
}>;

export type ResolveMiniAppEntryResult =
  | Readonly<{ type: 'navigate'; route: MiniAppRouteRef; miniAppId: MiniAppId }>
  | Readonly<{ type: 'showDemoNotice'; route: MiniAppRouteRef; miniAppId: MiniAppId }>
  | Readonly<{ type: 'showComingSoon'; miniAppId: MiniAppId }>
  | Readonly<{
      type: 'showGate';
      miniAppId: MiniAppId;
      reason: 'role' | 'featureFlag' | 'market' | 'readiness';
    }>
  | Readonly<{ type: 'showFrozen'; miniAppId: MiniAppId; reason: string }>
  | Readonly<{ type: 'showError'; messageKey: string }>;
