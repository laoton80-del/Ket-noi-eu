/**
 * Pack A2 — production Prisma-backed authority store (default dependency).
 */
import {
  LocalProviderEligibilityAuditActorType,
  LocalProviderEligibilityStatus,
  Role,
  type LocalServiceType,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import type { Prisma } from '@prisma/client';
import type {
  LocalProviderAuthorityDeps,
  LocalProviderAuthorityTx,
  LocalProviderEligibilityCreateInput,
  LocalProviderEligibilityUpdateInput,
  LocalProviderAuditCreateInput,
} from './localProviderEligibilityAuthorityTypes';

function mapEligibilityRow(row: {
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
}) {
  return {
    id: row.id,
    businessId: row.businessId,
    status: row.status,
    publicB2cVisible: row.publicB2cVisible,
    supportedServiceTypes: [...row.supportedServiceTypes],
    activatedAt: row.activatedAt,
    suspendedAt: row.suspendedAt,
    retiredAt: row.retiredAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createPrismaTx(tx: Prisma.TransactionClient): LocalProviderAuthorityTx {
  return {
    async createEligibility(data: LocalProviderEligibilityCreateInput) {
      const created = await tx.localProviderEligibility.create({
        data: {
          businessId: data.businessId,
          status: data.status,
          publicB2cVisible: data.publicB2cVisible,
          supportedServiceTypes: [...data.supportedServiceTypes],
          activatedAt: data.activatedAt,
          suspendedAt: data.suspendedAt,
          retiredAt: data.retiredAt,
        },
      });
      return mapEligibilityRow(created);
    },
    async updateEligibility(businessId: string, data: LocalProviderEligibilityUpdateInput) {
      const updated = await tx.localProviderEligibility.update({
        where: { businessId },
        data: {
          ...(data.supportedServiceTypes !== undefined
            ? { supportedServiceTypes: [...data.supportedServiceTypes] }
            : {}),
          ...(data.publicB2cVisible !== undefined
            ? { publicB2cVisible: data.publicB2cVisible }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.activatedAt !== undefined ? { activatedAt: data.activatedAt } : {}),
          ...(data.suspendedAt !== undefined ? { suspendedAt: data.suspendedAt } : {}),
          ...(data.retiredAt !== undefined ? { retiredAt: data.retiredAt } : {}),
        },
      });
      return mapEligibilityRow(updated);
    },
    async createAuditEvent(data: LocalProviderAuditCreateInput) {
      return tx.localProviderEligibilityAuditEvent.create({
        data: {
          eligibilityId: data.eligibilityId,
          businessId: data.businessId,
          actorUserId: data.actorUserId,
          actorType: LocalProviderEligibilityAuditActorType.ROLE_ADMIN,
          eventType: data.eventType,
          priorStatus: data.priorStatus,
          nextStatus: data.nextStatus,
          priorPublicB2cVisible: data.priorPublicB2cVisible,
          nextPublicB2cVisible: data.nextPublicB2cVisible,
          priorSupportedServiceTypes: [...data.priorSupportedServiceTypes],
          nextSupportedServiceTypes: [...data.nextSupportedServiceTypes],
          ...(data.reason != null && data.reason.length > 0 ? { reason: data.reason } : {}),
        },
        select: { id: true },
      });
    },
  };
}

/** Default production dependency set — always Prisma; never a test fake. */
export function createPrismaLocalProviderAuthorityDeps(
  now: () => Date = () => new Date()
): LocalProviderAuthorityDeps {
  return {
    now,
    async findUserRole(userId: string) {
      const user = await getPrisma().user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      return user?.role ?? null;
    },
    async findBusiness(businessId: string) {
      const business = await getPrisma().business.findUnique({
        where: { id: businessId },
        select: { id: true },
      });
      return business;
    },
    async findEligibilityByBusinessId(businessId: string) {
      const row = await getPrisma().localProviderEligibility.findUnique({
        where: { businessId },
        include: { business: { select: { id: true, name: true } } },
      });
      if (!row) return null;
      return {
        ...mapEligibilityRow(row),
        business: { id: row.business.id, name: row.business.name },
      };
    },
    async listEligibilityCandidates(input) {
      const serviceType = input.serviceType;
      const rows = await getPrisma().localProviderEligibility.findMany({
        where: {
          status: LocalProviderEligibilityStatus.ACTIVE,
          publicB2cVisible: true,
          ...(serviceType
            ? { supportedServiceTypes: { has: serviceType } }
            : { supportedServiceTypes: { isEmpty: false } }),
        },
        include: { business: { select: { id: true, name: true } } },
        orderBy: [{ business: { name: 'asc' } }, { businessId: 'asc' }],
      });
      return rows.map((row) => ({
        ...mapEligibilityRow(row),
        business: { id: row.business.id, name: row.business.name },
      }));
    },
    async runInTransaction(fn) {
      return getPrisma().$transaction(async (tx) => fn(createPrismaTx(tx)));
    },
  };
}

export function isAdminRole(role: Role | null): boolean {
  return role === Role.ADMIN;
}
