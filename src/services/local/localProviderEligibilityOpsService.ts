/**
 * Pack A2 — Role.ADMIN Local provider eligibility registration and lifecycle ops.
 * Mutation + LocalProviderEligibilityAuditEvent always share one Prisma transaction.
 */
import {
  LocalProviderEligibilityAuditEventType,
  LocalProviderEligibilityStatus,
  Role,
  type LocalServiceType,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import { createLocalProviderEligibilityAuditEvent } from './localProviderEligibilityAuditWrite';
import {
  isValidLocalProviderBusinessDisplayName,
} from './localProviderEligibilityDomain';
import {
  draftRegistrationTimestamps,
  lifecycleTimestampsForTransition,
  type LocalProviderEligibilityStatusName,
} from './localProviderEligibilityLifecycle';
import { sameServiceTypeLists } from './localProviderEligibilityValidation';

export type LocalProviderOpsDto = Readonly<{
  businessId: string;
  status: LocalProviderEligibilityStatus;
  publicB2cVisible: boolean;
  supportedServiceTypes: LocalServiceType[];
  activatedAt: string | null;
  suspendedAt: string | null;
  retiredAt: string | null;
  updatedAt: string;
}>;

function toIso(d: Date | null | undefined): string | null {
  return d == null ? null : d.toISOString();
}

function toOpsDto(row: {
  businessId: string;
  status: LocalProviderEligibilityStatus;
  publicB2cVisible: boolean;
  supportedServiceTypes: LocalServiceType[];
  activatedAt: Date | null;
  suspendedAt: Date | null;
  retiredAt: Date | null;
  updatedAt: Date;
}): LocalProviderOpsDto {
  return {
    businessId: row.businessId,
    status: row.status,
    publicB2cVisible: row.publicB2cVisible,
    supportedServiceTypes: [...row.supportedServiceTypes],
    activatedAt: toIso(row.activatedAt),
    suspendedAt: toIso(row.suspendedAt),
    retiredAt: toIso(row.retiredAt),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function assertAdminActor(actorUserId: string): Promise<boolean> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { role: true },
  });
  return !!user && user.role === Role.ADMIN;
}

export type RegisterLocalProviderResult =
  | Readonly<{ ok: true; created: boolean; provider: LocalProviderOpsDto }>
  | Readonly<{ ok: false; reason: 'invalid_input' | 'forbidden' | 'business_not_found' }>;

export async function registerLocalProviderEligibility(input: {
  actorUserId: string;
  businessId: string;
  supportedServiceTypes: LocalServiceType[];
  publicB2cVisible: boolean;
}): Promise<RegisterLocalProviderResult> {
  const actorUserId = input.actorUserId.trim();
  const businessId = input.businessId.trim();
  if (!actorUserId || !businessId) return { ok: false, reason: 'invalid_input' };
  if (!(await assertAdminActor(actorUserId))) return { ok: false, reason: 'forbidden' };

  const prisma = getPrisma();
  const existing = await prisma.localProviderEligibility.findUnique({ where: { businessId } });
  if (existing) {
    return { ok: true, created: false, provider: toOpsDto(existing) };
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) return { ok: false, reason: 'business_not_found' };

  const stamps = draftRegistrationTimestamps();
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.localProviderEligibility.create({
      data: {
        businessId,
        status: LocalProviderEligibilityStatus.DRAFT,
        publicB2cVisible: input.publicB2cVisible,
        supportedServiceTypes: input.supportedServiceTypes,
        activatedAt: stamps.activatedAt,
        suspendedAt: stamps.suspendedAt,
        retiredAt: stamps.retiredAt,
      },
    });

    await createLocalProviderEligibilityAuditEvent({
      db: tx,
      eligibilityId: created.id,
      businessId,
      actorUserId,
      eventType: LocalProviderEligibilityAuditEventType.REGISTERED,
      priorStatus: null,
      nextStatus: LocalProviderEligibilityStatus.DRAFT,
      priorPublicB2cVisible: null,
      nextPublicB2cVisible: created.publicB2cVisible,
      priorSupportedServiceTypes: [],
      nextSupportedServiceTypes: created.supportedServiceTypes,
    });

    return created;
  });

  return { ok: true, created: true, provider: toOpsDto(row) };
}

export type PatchLocalProviderResult =
  | Readonly<{ ok: true; provider: LocalProviderOpsDto }>
  | Readonly<{
      ok: false;
      reason: 'invalid_input' | 'forbidden' | 'not_found' | 'conflict';
    }>;

export async function patchLocalProviderEligibility(input: {
  actorUserId: string;
  businessId: string;
  supportedServiceTypes?: LocalServiceType[];
  publicB2cVisible?: boolean;
}): Promise<PatchLocalProviderResult> {
  const actorUserId = input.actorUserId.trim();
  const businessId = input.businessId.trim();
  if (!actorUserId || !businessId) return { ok: false, reason: 'invalid_input' };
  if (
    input.supportedServiceTypes === undefined &&
    input.publicB2cVisible === undefined
  ) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (!(await assertAdminActor(actorUserId))) return { ok: false, reason: 'forbidden' };

  const prisma = getPrisma();
  const current = await prisma.localProviderEligibility.findUnique({
    where: { businessId },
    include: { business: { select: { name: true } } },
  });
  if (!current) return { ok: false, reason: 'not_found' };

  if (current.status === LocalProviderEligibilityStatus.RETIRED) {
    return { ok: false, reason: 'conflict' };
  }

  const nextTypes =
    input.supportedServiceTypes !== undefined
      ? input.supportedServiceTypes
      : current.supportedServiceTypes;
  const nextVisible =
    input.publicB2cVisible !== undefined
      ? input.publicB2cVisible
      : current.publicB2cVisible;

  const typesUnchanged = sameServiceTypeLists(nextTypes, current.supportedServiceTypes);
  const visibleUnchanged = nextVisible === current.publicB2cVisible;
  if (typesUnchanged && visibleUnchanged) {
    return { ok: true, provider: toOpsDto(current) };
  }

  if (current.status === LocalProviderEligibilityStatus.ACTIVE) {
    if (nextVisible !== true || nextTypes.length === 0) {
      return { ok: false, reason: 'conflict' };
    }
    if (!isValidLocalProviderBusinessDisplayName(current.business.name)) {
      return { ok: false, reason: 'conflict' };
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.localProviderEligibility.update({
      where: { businessId },
      data: {
        supportedServiceTypes: nextTypes,
        publicB2cVisible: nextVisible,
      },
    });

    await createLocalProviderEligibilityAuditEvent({
      db: tx,
      eligibilityId: row.id,
      businessId,
      actorUserId,
      eventType: LocalProviderEligibilityAuditEventType.CONFIG_UPDATED,
      priorStatus: current.status,
      nextStatus: current.status,
      priorPublicB2cVisible: current.publicB2cVisible,
      nextPublicB2cVisible: nextVisible,
      priorSupportedServiceTypes: current.supportedServiceTypes,
      nextSupportedServiceTypes: nextTypes,
    });

    return row;
  });

  return { ok: true, provider: toOpsDto(updated) };
}

type TransitionFailure = 'invalid_input' | 'forbidden' | 'not_found' | 'conflict';

export type TransitionLocalProviderResult =
  | Readonly<{ ok: true; provider: LocalProviderOpsDto }>
  | Readonly<{ ok: false; reason: TransitionFailure }>;

function statusName(s: LocalProviderEligibilityStatus): LocalProviderEligibilityStatusName {
  return s as LocalProviderEligibilityStatusName;
}

async function transitionLocalProvider(input: {
  actorUserId: string;
  businessId: string;
  to: LocalProviderEligibilityStatus;
  eventType: LocalProviderEligibilityAuditEventType;
  reason: string | null;
  allowedFrom: readonly LocalProviderEligibilityStatus[];
  sameState: LocalProviderEligibilityStatus;
}): Promise<TransitionLocalProviderResult> {
  const actorUserId = input.actorUserId.trim();
  const businessId = input.businessId.trim();
  if (!actorUserId || !businessId) return { ok: false, reason: 'invalid_input' };
  if (!(await assertAdminActor(actorUserId))) return { ok: false, reason: 'forbidden' };

  const prisma = getPrisma();
  const current = await prisma.localProviderEligibility.findUnique({
    where: { businessId },
    include: { business: { select: { id: true, name: true } } },
  });
  if (!current) return { ok: false, reason: 'not_found' };

  if (current.status === input.sameState) {
    return { ok: true, provider: toOpsDto(current) };
  }

  if (!input.allowedFrom.includes(current.status)) {
    return { ok: false, reason: 'conflict' };
  }

  if (input.to === LocalProviderEligibilityStatus.ACTIVE) {
    if (current.publicB2cVisible !== true || current.supportedServiceTypes.length === 0) {
      return { ok: false, reason: 'conflict' };
    }
    if (!isValidLocalProviderBusinessDisplayName(current.business.name)) {
      return { ok: false, reason: 'conflict' };
    }
  }

  const now = new Date();
  const stamps = lifecycleTimestampsForTransition({
    from: statusName(current.status),
    to: statusName(input.to),
    current: {
      activatedAt: current.activatedAt,
      suspendedAt: current.suspendedAt,
      retiredAt: current.retiredAt,
    },
    now,
  });
  if (!stamps) return { ok: false, reason: 'conflict' };

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.localProviderEligibility.update({
      where: { businessId },
      data: {
        status: input.to,
        activatedAt: stamps.activatedAt,
        suspendedAt: stamps.suspendedAt,
        retiredAt: stamps.retiredAt,
      },
    });

    await createLocalProviderEligibilityAuditEvent({
      db: tx,
      eligibilityId: row.id,
      businessId,
      actorUserId,
      eventType: input.eventType,
      priorStatus: current.status,
      nextStatus: input.to,
      priorPublicB2cVisible: current.publicB2cVisible,
      nextPublicB2cVisible: current.publicB2cVisible,
      priorSupportedServiceTypes: current.supportedServiceTypes,
      nextSupportedServiceTypes: current.supportedServiceTypes,
      reason: input.reason,
    });

    return row;
  });

  return { ok: true, provider: toOpsDto(updated) };
}

export async function activateLocalProviderEligibility(input: {
  actorUserId: string;
  businessId: string;
}): Promise<TransitionLocalProviderResult> {
  return transitionLocalProvider({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    to: LocalProviderEligibilityStatus.ACTIVE,
    eventType: LocalProviderEligibilityAuditEventType.ACTIVATED,
    reason: null,
    allowedFrom: [
      LocalProviderEligibilityStatus.DRAFT,
      LocalProviderEligibilityStatus.SUSPENDED,
    ],
    sameState: LocalProviderEligibilityStatus.ACTIVE,
  });
}

export async function suspendLocalProviderEligibility(input: {
  actorUserId: string;
  businessId: string;
  reason: string | null;
}): Promise<TransitionLocalProviderResult> {
  return transitionLocalProvider({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    to: LocalProviderEligibilityStatus.SUSPENDED,
    eventType: LocalProviderEligibilityAuditEventType.SUSPENDED,
    reason: input.reason,
    allowedFrom: [LocalProviderEligibilityStatus.ACTIVE],
    sameState: LocalProviderEligibilityStatus.SUSPENDED,
  });
}

export async function retireLocalProviderEligibility(input: {
  actorUserId: string;
  businessId: string;
  reason: string | null;
}): Promise<TransitionLocalProviderResult> {
  return transitionLocalProvider({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    to: LocalProviderEligibilityStatus.RETIRED,
    eventType: LocalProviderEligibilityAuditEventType.RETIRED,
    reason: input.reason,
    allowedFrom: [
      LocalProviderEligibilityStatus.DRAFT,
      LocalProviderEligibilityStatus.ACTIVE,
      LocalProviderEligibilityStatus.SUSPENDED,
    ],
    sameState: LocalProviderEligibilityStatus.RETIRED,
  });
}
