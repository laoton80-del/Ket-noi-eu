/**
 * Client-safe feature flags (Expo inlines `EXPO_PUBLIC_*` at build time).
 * Super App Lite: Academy / Travel / Leona / VIO display / B2B AI Receptionist demo default ON.
 * High-risk surfaces stay OFF unless `EXPO_PUBLIC_FEATURE_*` is the literal string `"true"`.
 */

/**
 * Only `"true"` (after trim) counts as enabled — avoids accidental truthy strings.
 * Pass the **value** from a literal `process.env.EXPO_PUBLIC_*` read (Expo forbids dynamic `process.env[key]`).
 */
export function parseTruthyEnvString(raw: string | undefined): boolean {
  return typeof raw === 'string' && raw.trim() === 'true';
}

export interface FeatureFlags {
  hubEnabled: boolean;
  localEnabled: boolean;
  bookingEnabled: boolean;
  merchantDashboardEnabled: boolean;

  /** Academy Lite surfaces — default ON (Super App Lite). */
  academyLiteEnabled: boolean;
  /** Leona Assistant Lite — default ON. */
  leonaAssistantEnabled: boolean;
  /** Travel Lite — default ON. */
  travelLiteEnabled: boolean;
  /** Wallet / Hub copy for VIO Points & Credits — default ON (display only; not full token economy). */
  vioPointsDisplayEnabled: boolean;
  /** B2B AI Receptionist demo / non-production intake — default ON. */
  b2bAiReceptionistDemoEnabled: boolean;

  /**
   * B2B pilot gates — env-only (`EXPO_PUBLIC_FEATURE_B2B_AI_RECEPTIONIST_PILOT` === `"true"`).
   * Does not enable production call automation by itself.
   */
  b2bAiReceptionistPilotEnabled: boolean;
  /** `EXPO_PUBLIC_FEATURE_B2B_AI_RECEPTIONIST_PRODUCTION` === `"true"` */
  b2bAiReceptionistProductionEnabled: boolean;
  /** `EXPO_PUBLIC_FEATURE_B2B_AUTO_BOOKING` === `"true"` */
  b2bAutoBookingEnabled: boolean;
  /** `EXPO_PUBLIC_FEATURE_B2B_AUTO_INVENTORY` === `"true"` */
  b2bAutoInventoryEnabled: boolean;
  /** `EXPO_PUBLIC_FEATURE_B2B_AUTO_BILL_PRINT` === `"true"` */
  b2bAutoBillPrintEnabled: boolean;
  /** `EXPO_PUBLIC_FEATURE_B2B_AUTO_PAYMENT` === `"true"` */
  b2bAutoPaymentEnabled: boolean;

  /**
   * Legacy alignment: same boolean as `travelLiteEnabled` for existing navigation/UI gates.
   */
  travelEnabled: boolean;
  /**
   * Legacy alignment: same boolean as `academyLiteEnabled`.
   */
  academyEnabled: boolean;
  /**
   * Legacy gate used for Leona + B2B receptionist entrypoints: true when either lite assistant is on.
   */
  aiReceptionistEnabled: boolean;

  brokerQrEnabled: boolean;
  legalScanEnabled: boolean;
  payrollEnabled: boolean;
  vigTokenEconomyEnabled: boolean;
  liveStripePaymentEnabled: boolean;
  adminDemoMetricsEnabled: boolean;
  kolDemoEnabled: boolean;
  omniDemoEnabled: boolean;
}

const MVP_DEFAULT_TRUE = true as const;

/**
 * Resolves all flags. Core Hub/Local/Booking/Merchant stay on by default.
 * Super App Lite pack (academy/travel/leona/VIO display/B2B demo) defaults ON.
 * Risk surfaces require explicit `EXPO_PUBLIC_FEATURE_*=true` where noted.
 */
export function getFeatureFlags(): FeatureFlags {
  const academyLiteEnabled = MVP_DEFAULT_TRUE;
  const leonaAssistantEnabled = MVP_DEFAULT_TRUE;
  const travelLiteEnabled = MVP_DEFAULT_TRUE;
  const vioPointsDisplayEnabled = MVP_DEFAULT_TRUE;
  const b2bAiReceptionistDemoEnabled = MVP_DEFAULT_TRUE;

  const b2bAiReceptionistPilotEnabled = parseTruthyEnvString(
    process.env.EXPO_PUBLIC_FEATURE_B2B_AI_RECEPTIONIST_PILOT
  );
  const b2bAiReceptionistProductionEnabled = parseTruthyEnvString(
    process.env.EXPO_PUBLIC_FEATURE_B2B_AI_RECEPTIONIST_PRODUCTION
  );
  const b2bAutoBookingEnabled = parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_B2B_AUTO_BOOKING);
  const b2bAutoInventoryEnabled = parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_B2B_AUTO_INVENTORY);
  const b2bAutoBillPrintEnabled = parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_B2B_AUTO_BILL_PRINT);
  const b2bAutoPaymentEnabled = parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_B2B_AUTO_PAYMENT);

  return {
    hubEnabled: MVP_DEFAULT_TRUE,
    localEnabled: MVP_DEFAULT_TRUE,
    bookingEnabled: MVP_DEFAULT_TRUE,
    merchantDashboardEnabled: MVP_DEFAULT_TRUE,

    academyLiteEnabled,
    leonaAssistantEnabled,
    travelLiteEnabled,
    vioPointsDisplayEnabled,
    b2bAiReceptionistDemoEnabled,

    b2bAiReceptionistPilotEnabled,
    b2bAiReceptionistProductionEnabled,
    b2bAutoBookingEnabled,
    b2bAutoInventoryEnabled,
    b2bAutoBillPrintEnabled,
    b2bAutoPaymentEnabled,

    travelEnabled: travelLiteEnabled,
    academyEnabled: academyLiteEnabled,
    aiReceptionistEnabled: leonaAssistantEnabled || b2bAiReceptionistDemoEnabled,

    brokerQrEnabled: parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_BROKER_QR),
    legalScanEnabled: parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_LEGAL_SCAN),
    payrollEnabled: parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_PAYROLL),
    vigTokenEconomyEnabled: parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_VIG_TOKEN_ECONOMY),
    liveStripePaymentEnabled: parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_LIVE_STRIPE_PAYMENT),
    adminDemoMetricsEnabled: parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_ADMIN_DEMO_METRICS),
    kolDemoEnabled: parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_KOL_DEMO),
    omniDemoEnabled: parseTruthyEnvString(process.env.EXPO_PUBLIC_FEATURE_OMNI_DEMO),
  };
}

export type FeatureFlagKey = keyof FeatureFlags;
