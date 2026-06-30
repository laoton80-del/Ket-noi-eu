/**
 * Pack26B — Action capability readiness types (read-only registry layer).
 * No execution, no UI wiring, no env/network access.
 */

export const vionaActionReadinessLevels = [
  'disabled',
  'read_only',
  'draft_only',
  'pilot',
  'staging_verified',
  'market_limited',
  'full_active',
] as const;

export type VionaActionReadiness = (typeof vionaActionReadinessLevels)[number];

export const vionaActionUniverses = [
  'local',
  'travel',
  'academy',
  'business',
  'account',
  'sos',
  'cross_universe',
] as const;

export type VionaActionUniverse = (typeof vionaActionUniverses)[number];

export const vionaActionRoles = [
  'owner',
  'operator',
  'merchant',
  'admin',
  'system',
  'emergency_reviewer',
  'payment_provider',
  'external_partner',
] as const;

export type VionaActionRole = (typeof vionaActionRoles)[number];

export const vionaActionEnvironments = ['local', 'staging', 'production'] as const;

export type VionaActionEnvironment = (typeof vionaActionEnvironments)[number];

export const vionaActionGateStates = ['none', 'blocked', 'required'] as const;

export type VionaActionGateState = (typeof vionaActionGateStates)[number];

export const vionaHumanApprovalRequirements = [
  'none',
  'owner',
  'operator',
  'merchant',
  'emergency_reviewer',
] as const;

export type VionaHumanApprovalRequirement = (typeof vionaHumanApprovalRequirements)[number];

export const vionaOwnerFacingCopySafetyLevels = [
  'demo',
  'pilot',
  'staging',
  'production_safe',
] as const;

export type VionaOwnerFacingCopySafetyLevel = (typeof vionaOwnerFacingCopySafetyLevels)[number];

/** Capability dimensions for read-only lookup — no runtime execution in Pack26B. */
export type VionaActionCapabilityDimensions = {
  universe: VionaActionUniverse;
  actionFamily: string;
  role: VionaActionRole;
  market: string;
  environment: VionaActionEnvironment;
  readinessState: VionaActionReadiness;
  humanApprovalRequired: VionaHumanApprovalRequirement;
  legalBlocked: boolean;
  paymentBlocked: boolean;
  opsBlocked: boolean;
  sosBlocked: boolean;
  executionEnabled: false;
  uiAffordanceAllowed: false;
};

export type VionaActionRegistryEntry = {
  actionId: string;
  universe: VionaActionUniverse;
  actionFamily: string;
  displayName: string;
  description: string;
  defaultReadiness: VionaActionReadiness;
  allowedRoles: readonly VionaActionRole[];
  requiredCapabilityFlags: readonly VionaActionReadiness[];
  requiredApprovals: VionaHumanApprovalRequirement;
  auditCategory: string;
  timelineCategory: string;
  idempotencyRequired: boolean;
  marketGate: VionaActionGateState;
  legalGate: VionaActionGateState;
  paymentGate: VionaActionGateState;
  opsGate: VionaActionGateState;
  sosGate: VionaActionGateState;
  disabledReason: string | null;
  ownerFacingCopySafetyLevel: VionaOwnerFacingCopySafetyLevel;
  executionEnabled: false;
  uiAffordanceAllowed: false;
  notes: string;
};

export type VionaActionCapabilitySummary = {
  actionId: string;
  known: boolean;
  universe: VionaActionUniverse | null;
  actionFamily: string | null;
  defaultReadiness: VionaActionReadiness;
  executionEnabled: false;
  uiAffordanceAllowed: false;
  disabledReason: string | null;
  legalBlocked: boolean;
  paymentBlocked: boolean;
  opsBlocked: boolean;
  sosBlocked: boolean;
};

export const VIONA_ACTION_READINESS_DISABLED: VionaActionReadiness = 'disabled';

export const VIONA_PACK26B_UNKNOWN_ACTION_SUMMARY: VionaActionCapabilitySummary = {
  actionId: '',
  known: false,
  universe: null,
  actionFamily: null,
  defaultReadiness: VIONA_ACTION_READINESS_DISABLED,
  executionEnabled: false,
  uiAffordanceAllowed: false,
  disabledReason: 'Unknown action — registry lookup only; not executable in Pack26B.',
  legalBlocked: true,
  paymentBlocked: true,
  opsBlocked: true,
  sosBlocked: true,
};
