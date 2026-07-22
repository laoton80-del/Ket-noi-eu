/**
 * Pack A2 — Local provider authority persistence surface (Prisma or deterministic test store).
 * Lifecycle / invariant / authorization decisions stay in production service/domain code.
 */
import {
  LocalProviderEligibilityAuditActorType,
  LocalProviderEligibilityAuditEventType,
  LocalProviderEligibilityStatus,
  Role,
  type LocalServiceType,
} from '@prisma/client';

export type LocalProviderEligibilityRow = Readonly<{
  id: string;
  businessId: string;
  status: LocalProviderEligibilityStatus;
  publicB2cVisible: boolean;
  supportedServiceTypes: LocalServiceType[];
  activatedAt: Date | null;
  suspendedAt: Date | null;
  retiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type LocalProviderEligibilityWithBusiness = LocalProviderEligibilityRow &
  Readonly<{
    business: Readonly<{ id: string; name: string }>;
  }>;

export type LocalProviderAuditEventRow = Readonly<{
  id: string;
  eligibilityId: string;
  businessId: string;
  actorUserId: string;
  actorType: LocalProviderEligibilityAuditActorType;
  eventType: LocalProviderEligibilityAuditEventType;
  priorStatus: LocalProviderEligibilityStatus | null;
  nextStatus: LocalProviderEligibilityStatus;
  priorPublicB2cVisible: boolean | null;
  nextPublicB2cVisible: boolean;
  priorSupportedServiceTypes: LocalServiceType[];
  nextSupportedServiceTypes: LocalServiceType[];
  reason: string | null;
  createdAt: Date;
}>;

export type LocalProviderAuditCreateInput = Readonly<{
  eligibilityId: string;
  businessId: string;
  actorUserId: string;
  eventType: LocalProviderEligibilityAuditEventType;
  priorStatus: LocalProviderEligibilityStatus | null;
  nextStatus: LocalProviderEligibilityStatus;
  priorPublicB2cVisible: boolean | null;
  nextPublicB2cVisible: boolean;
  priorSupportedServiceTypes: readonly LocalServiceType[];
  nextSupportedServiceTypes: readonly LocalServiceType[];
  reason?: string | null;
}>;

export type LocalProviderEligibilityCreateInput = Readonly<{
  businessId: string;
  status: LocalProviderEligibilityStatus;
  publicB2cVisible: boolean;
  supportedServiceTypes: readonly LocalServiceType[];
  activatedAt: Date | null;
  suspendedAt: Date | null;
  retiredAt: Date | null;
}>;

export type LocalProviderEligibilityUpdateInput = Readonly<{
  supportedServiceTypes?: readonly LocalServiceType[];
  publicB2cVisible?: boolean;
  status?: LocalProviderEligibilityStatus;
  activatedAt?: Date | null;
  suspendedAt?: Date | null;
  retiredAt?: Date | null;
}>;

/** Transaction-scoped persistence API used inside Pack A2 mutations. */
export type LocalProviderAuthorityTx = Readonly<{
  createEligibility: (
    data: LocalProviderEligibilityCreateInput
  ) => Promise<LocalProviderEligibilityRow>;
  updateEligibility: (
    businessId: string,
    data: LocalProviderEligibilityUpdateInput
  ) => Promise<LocalProviderEligibilityRow>;
  createAuditEvent: (data: LocalProviderAuditCreateInput) => Promise<{ id: string }>;
}>;

export type LocalProviderAuthorityDeps = Readonly<{
  findUserRole: (userId: string) => Promise<Role | null>;
  findBusiness: (businessId: string) => Promise<{ id: string } | null>;
  findEligibilityByBusinessId: (
    businessId: string
  ) => Promise<LocalProviderEligibilityWithBusiness | null>;
  listEligibilityCandidates: (input: {
    serviceType?: LocalServiceType;
  }) => Promise<readonly LocalProviderEligibilityWithBusiness[]>;
  runInTransaction: <T>(fn: (tx: LocalProviderAuthorityTx) => Promise<T>) => Promise<T>;
  now: () => Date;
}>;
