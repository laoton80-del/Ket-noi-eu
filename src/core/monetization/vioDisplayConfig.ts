/**
 * Public loyalty / usage naming: VIO (customer-facing).
 * Legacy code may remain internal until full migration.
 */

export const vioDisplayConfig = {
  publicCode: 'VIO',
  publicName: 'VIO Points',
  publicCreditName: 'VIO Credits',
  legacyCode: 'VIG',
  isCrypto: false,
  isWithdrawableCash: false,
  /** Max % of an order or redemption basket payable with points (policy target). */
  redeemCapPercent: 20,
  /** Default inactivity / issuance expiry horizon (days). */
  expiresAfterDays: 365,
  requiresLiabilityTracking: true,
} as const;

export type VioDisplayConfig = typeof vioDisplayConfig;
