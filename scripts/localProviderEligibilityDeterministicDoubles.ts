/**
 * Pack A2 — test-only deterministic Local provider authority store + transaction runner.
 *
 * Lives under scripts/ only. Implements storage mechanics + commit/rollback.
 * Does NOT encode lifecycle, transition, invariant, or authorization policy.
 */
import { randomUUID } from 'node:crypto';

import {
  LocalProviderEligibilityAuditActorType,
  LocalProviderEligibilityStatus,
  Role,
  type LocalServiceType,
} from '@prisma/client';

import type {
  LocalProviderAuditCreateInput,
  LocalProviderAuditEventRow,
  LocalProviderAuthorityDeps,
  LocalProviderAuthorityTx,
  LocalProviderEligibilityCreateInput,
  LocalProviderEligibilityRow,
  LocalProviderEligibilityUpdateInput,
  LocalProviderEligibilityWithBusiness,
} from '../src/services/local/localProviderEligibilityAuthorityTypes';

export type DeterministicFailTarget =
  | 'eligibilityCreate'
  | 'eligibilityUpdate'
  | 'auditCreate'
  | 'listRead';

export type DeterministicAuthorityCounters = {
  eligibilityCreate: number;
  eligibilityUpdate: number;
  auditCreate: number;
  transactionCommit: number;
  transactionRollback: number;
  listRead: number;
};

type BusinessRec = { id: string; name: string };
type UserRec = { id: string; role: Role };

type StoreState = {
  users: Map<string, UserRec>;
  businesses: Map<string, BusinessRec>;
  eligibilityByBusinessId: Map<string, LocalProviderEligibilityRow>;
  audits: LocalProviderAuditEventRow[];
};

function cloneEligibility(row: LocalProviderEligibilityRow): LocalProviderEligibilityRow {
  return {
    ...row,
    supportedServiceTypes: [...row.supportedServiceTypes],
    activatedAt: row.activatedAt ? new Date(row.activatedAt.getTime()) : null,
    suspendedAt: row.suspendedAt ? new Date(row.suspendedAt.getTime()) : null,
    retiredAt: row.retiredAt ? new Date(row.retiredAt.getTime()) : null,
    createdAt: new Date(row.createdAt.getTime()),
    updatedAt: new Date(row.updatedAt.getTime()),
  };
}

function cloneAudit(row: LocalProviderAuditEventRow): LocalProviderAuditEventRow {
  return {
    ...row,
    priorSupportedServiceTypes: [...row.priorSupportedServiceTypes],
    nextSupportedServiceTypes: [...row.nextSupportedServiceTypes],
    createdAt: new Date(row.createdAt.getTime()),
  };
}

function cloneState(state: StoreState): StoreState {
  return {
    users: new Map(state.users),
    businesses: new Map(state.businesses),
    eligibilityByBusinessId: new Map(
      [...state.eligibilityByBusinessId.entries()].map(([k, v]) => [k, cloneEligibility(v)])
    ),
    audits: state.audits.map(cloneAudit),
  };
}

function withBusiness(
  state: StoreState,
  row: LocalProviderEligibilityRow
): LocalProviderEligibilityWithBusiness | null {
  const business = state.businesses.get(row.businessId);
  if (!business) return null;
  return {
    ...cloneEligibility(row),
    business: { id: business.id, name: business.name },
  };
}

export type DeterministicLocalProviderAuthorityHarness = Readonly<{
  deps: LocalProviderAuthorityDeps;
  counters: DeterministicAuthorityCounters;
  clock: {
    now: () => Date;
    setNow: (d: Date) => void;
  };
  failNext: (target: DeterministicFailTarget) => void;
  seedUser: (id: string, role: Role) => void;
  seedBusiness: (id: string, name: string) => void;
  seedEligibility: (row: LocalProviderEligibilityRow) => void;
  getEligibility: (businessId: string) => LocalProviderEligibilityRow | null;
  listAudits: (eligibilityId?: string) => LocalProviderAuditEventRow[];
  resetCounters: () => void;
}>;

/**
 * Isolated in-memory authority store. Call once per test case (no shared mutable singleton).
 */
export function createDeterministicLocalProviderAuthorityHarness(): DeterministicLocalProviderAuthorityHarness {
  let state: StoreState = {
    users: new Map(),
    businesses: new Map(),
    eligibilityByBusinessId: new Map(),
    audits: [],
  };

  let nowMs = Date.parse('2026-07-22T10:00:00.000Z');
  const pendingFails = new Set<DeterministicFailTarget>();

  const counters: DeterministicAuthorityCounters = {
    eligibilityCreate: 0,
    eligibilityUpdate: 0,
    auditCreate: 0,
    transactionCommit: 0,
    transactionRollback: 0,
    listRead: 0,
  };

  function now(): Date {
    return new Date(nowMs);
  }

  function maybeFail(target: DeterministicFailTarget): void {
    if (pendingFails.has(target)) {
      pendingFails.delete(target);
      throw new Error(`deterministic_fail:${target}`);
    }
  }

  function createTx(working: StoreState): LocalProviderAuthorityTx {
    return {
      async createEligibility(data: LocalProviderEligibilityCreateInput) {
        maybeFail('eligibilityCreate');
        if (working.eligibilityByBusinessId.has(data.businessId)) {
          throw new Error('eligibility_already_exists');
        }
        if (!working.businesses.has(data.businessId)) {
          throw new Error('business_not_found');
        }
        const stamp = now();
        const row: LocalProviderEligibilityRow = {
          id: randomUUID(),
          businessId: data.businessId,
          status: data.status,
          publicB2cVisible: data.publicB2cVisible,
          supportedServiceTypes: [...data.supportedServiceTypes],
          activatedAt: data.activatedAt,
          suspendedAt: data.suspendedAt,
          retiredAt: data.retiredAt,
          createdAt: stamp,
          updatedAt: stamp,
        };
        working.eligibilityByBusinessId.set(data.businessId, row);
        counters.eligibilityCreate += 1;
        return cloneEligibility(row);
      },
      async updateEligibility(businessId: string, data: LocalProviderEligibilityUpdateInput) {
        maybeFail('eligibilityUpdate');
        const current = working.eligibilityByBusinessId.get(businessId);
        if (!current) throw new Error('eligibility_not_found');
        const stamp = now();
        const next: LocalProviderEligibilityRow = {
          ...cloneEligibility(current),
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
          updatedAt: stamp,
        };
        working.eligibilityByBusinessId.set(businessId, next);
        counters.eligibilityUpdate += 1;
        return cloneEligibility(next);
      },
      async createAuditEvent(data: LocalProviderAuditCreateInput) {
        maybeFail('auditCreate');
        const row: LocalProviderAuditEventRow = {
          id: randomUUID(),
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
          reason: data.reason != null && data.reason.length > 0 ? data.reason : null,
          createdAt: now(),
        };
        working.audits.push(row);
        counters.auditCreate += 1;
        return { id: row.id };
      },
    };
  }

  const deps: LocalProviderAuthorityDeps = {
    now,
    async findUserRole(userId: string) {
      return state.users.get(userId)?.role ?? null;
    },
    async findBusiness(businessId: string) {
      const b = state.businesses.get(businessId);
      return b ? { id: b.id } : null;
    },
    async findEligibilityByBusinessId(businessId: string) {
      const row = state.eligibilityByBusinessId.get(businessId);
      if (!row) return null;
      return withBusiness(state, row);
    },
    async listEligibilityCandidates(input) {
      maybeFail('listRead');
      counters.listRead += 1;
      const serviceType = input.serviceType;
      const rows: LocalProviderEligibilityWithBusiness[] = [];
      for (const row of state.eligibilityByBusinessId.values()) {
        if (row.status !== LocalProviderEligibilityStatus.ACTIVE) continue;
        if (row.publicB2cVisible !== true) continue;
        if (row.supportedServiceTypes.length === 0) continue;
        if (serviceType && !row.supportedServiceTypes.includes(serviceType)) continue;
        const withBiz = withBusiness(state, row);
        if (withBiz) rows.push(withBiz);
      }
      rows.sort((a, b) => {
        const na = a.business.name;
        const nb = b.business.name;
        if (na < nb) return -1;
        if (na > nb) return 1;
        return a.businessId < b.businessId ? -1 : a.businessId > b.businessId ? 1 : 0;
      });
      return rows;
    },
    async runInTransaction(fn) {
      const snapshot = cloneState(state);
      const working = cloneState(state);
      try {
        const result = await fn(createTx(working));
        state = working;
        counters.transactionCommit += 1;
        return result;
      } catch (err) {
        state = snapshot;
        counters.transactionRollback += 1;
        throw err;
      }
    },
  };

  return {
    deps,
    counters,
    clock: {
      now,
      setNow(d: Date) {
        nowMs = d.getTime();
      },
    },
    failNext(target) {
      pendingFails.add(target);
    },
    seedUser(id, role) {
      state.users.set(id, { id, role });
    },
    seedBusiness(id, name) {
      state.businesses.set(id, { id, name });
    },
    seedEligibility(row) {
      state.eligibilityByBusinessId.set(row.businessId, cloneEligibility(row));
    },
    getEligibility(businessId) {
      const row = state.eligibilityByBusinessId.get(businessId);
      return row ? cloneEligibility(row) : null;
    },
    listAudits(eligibilityId) {
      return state.audits
        .filter((a) => (eligibilityId ? a.eligibilityId === eligibilityId : true))
        .map(cloneAudit);
    },
    resetCounters() {
      counters.eligibilityCreate = 0;
      counters.eligibilityUpdate = 0;
      counters.auditCreate = 0;
      counters.transactionCommit = 0;
      counters.transactionRollback = 0;
      counters.listRead = 0;
    },
  };
}

/** Helper for seeding an eligibility row with defaults. */
export function buildSeedEligibility(input: {
  businessId: string;
  status: LocalProviderEligibilityStatus;
  publicB2cVisible: boolean;
  supportedServiceTypes: readonly LocalServiceType[];
  activatedAt?: Date | null;
  suspendedAt?: Date | null;
  retiredAt?: Date | null;
  updatedAt?: Date;
  createdAt?: Date;
  id?: string;
}): LocalProviderEligibilityRow {
  const stamp = input.updatedAt ?? new Date('2026-07-22T09:00:00.000Z');
  return {
    id: input.id ?? randomUUID(),
    businessId: input.businessId,
    status: input.status,
    publicB2cVisible: input.publicB2cVisible,
    supportedServiceTypes: [...input.supportedServiceTypes],
    activatedAt: input.activatedAt ?? null,
    suspendedAt: input.suspendedAt ?? null,
    retiredAt: input.retiredAt ?? null,
    createdAt: input.createdAt ?? stamp,
    updatedAt: stamp,
  };
}
