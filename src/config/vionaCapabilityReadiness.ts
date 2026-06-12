export const vionaCapabilityUniverses = [
  'home',
  'local',
  'travel',
  'academy',
  'business',
  'account',
  'sos',
] as const;

export const vionaCapabilityStatuses = ['active', 'requestOnly', 'preview', 'disabled'] as const;

export const vionaCapabilitySafetyFlags = [
  'requiresHumanConfirmation',
  'requiresOpsReadiness',
  'requiresPaymentReadiness',
  'requiresLegalReadiness',
  'requiresMarketReadiness',
  'prohibitsAutonomousAction',
] as const;

export type VionaCapabilityUniverse = (typeof vionaCapabilityUniverses)[number];
export type VionaCapabilityStatus = (typeof vionaCapabilityStatuses)[number];
export type VionaCapabilitySafetyFlag = (typeof vionaCapabilitySafetyFlags)[number];

export type VionaCapabilityReadinessEntry = Readonly<{
  universe: VionaCapabilityUniverse;
  status: VionaCapabilityStatus;
  safetyFlags: readonly VionaCapabilitySafetyFlag[];
  notes: string;
  allowedNow: readonly string[];
  nextPromotionRequirements: readonly string[];
  disallowedClaims: readonly string[];
}>;

export const vionaCapabilityReadiness = {
  home: {
    universe: 'home',
    status: 'active',
    safetyFlags: ['requiresHumanConfirmation', 'prohibitsAutonomousAction'],
    notes:
      'Home is the global command center and universe launcher. It may route, explain, and show safe status, but it must not imply protected-domain completion.',
    allowedNow: [
      'Universe navigation',
      'Read-only readiness explanation',
      'Safe education and onboarding',
      'Human-directed launch of gated surfaces',
    ],
    nextPromotionRequirements: [
      'Clear status labels for every mini-app',
      'Feature flag review before new active CTAs',
      'Audit trail for any future assistant-guided action',
    ],
    disallowedClaims: [
      'No claim that money movement is complete',
      'No claim that provider or merchant outcome is final',
      'No hidden autonomous action',
    ],
  },
  local: {
    universe: 'local',
    status: 'requestOnly',
    safetyFlags: [
      'requiresHumanConfirmation',
      'requiresOpsReadiness',
      'requiresMarketReadiness',
      'prohibitsAutonomousAction',
    ],
    notes:
      'Local can collect user intent and prepare service requests. Partner execution and provider matching stay gated until ops and market readiness are verified.',
    allowedNow: [
      'Service discovery',
      'Request draft and intake guidance',
      'Translation support for user intent',
      'Manual triage handoff',
    ],
    nextPromotionRequirements: [
      'Partner ownership and tenant boundaries',
      'Manual ops runbook',
      'Request state source of truth',
      'Market-specific service availability',
    ],
    disallowedClaims: [
      'No guaranteed provider outcome',
      'No autonomous partner message',
      'No final service completion claim',
    ],
  },
  travel: {
    universe: 'travel',
    status: 'preview',
    safetyFlags: [
      'requiresHumanConfirmation',
      'requiresOpsReadiness',
      'requiresPaymentReadiness',
      'requiresMarketReadiness',
      'prohibitsAutonomousAction',
    ],
    notes:
      'Travel can explain destinations, prepare comparison views, and draft assisted requests. Commerce and itinerary execution need explicit gates.',
    allowedNow: [
      'Travel education and comparison',
      'Interpreter and phrase guidance',
      'Request draft support',
      'Human-directed handoff to safe surfaces',
    ],
    nextPromotionRequirements: [
      'Supplier and service data source of truth',
      'Manual confirmation before travel-related action',
      'Payment readiness before any money movement',
      'Country and locale review',
    ],
    disallowedClaims: [
      'No final itinerary claim',
      'No autonomous reservation change',
      'No commerce success claim',
    ],
  },
  academy: {
    universe: 'academy',
    status: 'preview',
    safetyFlags: ['requiresHumanConfirmation', 'requiresLegalReadiness', 'prohibitsAutonomousAction'],
    notes:
      'Academy can provide learning guidance, practice, and safe coaching. Credentials, assessment authority, and child-safety expansion require review.',
    allowedNow: [
      'Learning guidance',
      'Practice prompts',
      'Translation and lesson drafts',
      'Age-appropriate education support',
    ],
    nextPromotionRequirements: [
      'Learning content owner review',
      'Child-safety and privacy review',
      'Clear distinction between practice and credentialed assessment',
    ],
    disallowedClaims: [
      'No official assessment claim',
      'No credential authority claim',
      'No hidden learner profiling',
    ],
  },
  business: {
    universe: 'business',
    status: 'preview',
    safetyFlags: [
      'requiresHumanConfirmation',
      'requiresOpsReadiness',
      'requiresPaymentReadiness',
      'requiresLegalReadiness',
      'requiresMarketReadiness',
      'prohibitsAutonomousAction',
    ],
    notes:
      'Business covers merchant, broker, ads, B2B wholesale, and catalog import planning. Merchant operations require tenant, ledger, and ops gates before live execution.',
    allowedNow: [
      'Merchant dashboard preview',
      'Catalog and order-ticket planning',
      'Draft merchant response',
      'Read-only analytics explanation',
    ],
    nextPromotionRequirements: [
      'Tenant isolation proof',
      'Merchant role and workspace ownership',
      'Audit logging',
      'Human approval before business action',
      'Supplier data source of truth for wholesale',
    ],
    disallowedClaims: [
      'No autonomous merchant operation',
      'No guaranteed supplier availability',
      'No final ledger outcome claim',
    ],
  },
  account: {
    universe: 'account',
    status: 'preview',
    safetyFlags: [
      'requiresHumanConfirmation',
      'requiresPaymentReadiness',
      'requiresLegalReadiness',
      'prohibitsAutonomousAction',
    ],
    notes:
      'Account can guide profile, language, rewards, and personal settings. Identity, wallet-like, and legal-adjacent surfaces remain guarded by explicit review.',
    allowedNow: [
      'Profile education',
      'Language preference guidance',
      'Draft profile update suggestions',
      'Rewards explanation without money movement',
    ],
    nextPromotionRequirements: [
      'Auth and session review',
      'Consent and audit trail',
      'Wallet source of truth before balance-affecting flows',
      'Legal copy review for sensitive profile data',
    ],
    disallowedClaims: [
      'No balance-affecting action without verified source of truth',
      'No autonomous profile mutation',
      'No legal outcome claim',
    ],
  },
  sos: {
    universe: 'sos',
    status: 'requestOnly',
    safetyFlags: [
      'requiresHumanConfirmation',
      'requiresOpsReadiness',
      'requiresLegalReadiness',
      'requiresMarketReadiness',
      'prohibitsAutonomousAction',
    ],
    notes:
      'SOS is Global Lifeline guidance and consent preparation until country routing, legal review, and operations are ready. It must never pretend to replace local emergency services.',
    allowedNow: [
      'Safety guidance',
      'Consent profile draft',
      'Trusted contact preparation',
      'Local emergency education',
    ],
    nextPromotionRequirements: [
      'Country-by-country routing matrix',
      'Explicit consent logs',
      'Emergency ops owner',
      'Legal and privacy signoff',
      'Fallback instructions when automation is unavailable',
    ],
    disallowedClaims: [
      'No emergency authority action claim',
      'No background location sharing claim',
      'No recording or live response claim',
    ],
  },
} as const satisfies Readonly<Record<VionaCapabilityUniverse, VionaCapabilityReadinessEntry>>;

export function getVionaCapabilityReadiness(
  universe: VionaCapabilityUniverse
): VionaCapabilityReadinessEntry {
  return vionaCapabilityReadiness[universe];
}

export function hasVionaSafetyFlag(
  universe: VionaCapabilityUniverse,
  flag: VionaCapabilitySafetyFlag
): boolean {
  const safetyFlags: readonly VionaCapabilitySafetyFlag[] = vionaCapabilityReadiness[universe].safetyFlags;
  return safetyFlags.includes(flag);
}
