/**
 * Pack A2 cases 30–43 — deterministic behavioral evidence remediation.
 *
 * Cases 30–43 PASS via real production orchestration + deterministic injected
 * store/transaction/clock (scripts-only doubles). Optional real-DB integration
 * remains separately skippable under NO_MIGRATION_APPLY and does not gate PASS.
 *
 * Run: npx tsx scripts/test-local-provider-eligibility-read-ops-control.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';

import {
  LocalProviderEligibilityAuditActorType,
  LocalProviderEligibilityAuditEventType,
  LocalProviderEligibilityStatus,
  LocalServiceType,
  Role,
} from '@prisma/client';

import {
  getLocalProviders,
  patchLocalProvider,
  postActivateLocalProvider,
  postRegisterLocalProvider,
  postRetireLocalProvider,
  postSuspendLocalProvider,
} from '../src/controllers/LocalProviderController';
import { authMiddleware } from '../src/middleware/authMiddleware';
import { superAdminMiddleware } from '../src/middleware/superAdminMiddleware';
import { findForbiddenLocalProviderEligibilityAuditMutations } from '../src/services/local/localProviderEligibilityAuditAppendOnlyGate';
import {
  activateLocalProviderEligibility,
  patchLocalProviderEligibility,
  registerLocalProviderEligibility,
  retireLocalProviderEligibility,
  suspendLocalProviderEligibility,
} from '../src/services/local/localProviderEligibilityOpsService';
import { listSelectableLocalProviders } from '../src/services/local/localProviderEligibilityListService';
import {
  LOCAL_PROVIDER_LIST_DEFAULT_LIMIT,
  LOCAL_PROVIDER_LIST_MAX_LIMIT,
  sameServiceTypeLists,
  validateLocalProviderListQuery,
  validatePatchLocalProviderBody,
  validateRegisterLocalProviderBody,
  validateTransitionReasonBody,
} from '../src/services/local/localProviderEligibilityValidation';
import {
  buildSeedEligibility,
  createDeterministicLocalProviderAuthorityHarness,
  type DeterministicLocalProviderAuthorityHarness,
} from './localProviderEligibilityDeterministicDoubles';
import { localProviderEligibilityTableExists } from './localProviderEligibilityTestSupport';
import { getPrisma, disconnectPrisma } from '../src/lib/prisma';

const ROOT = process.cwd();

const T1 = new Date('2026-07-22T11:00:00.000Z');
const T2 = new Date('2026-07-22T12:00:00.000Z');
const T3 = new Date('2026-07-22T13:00:00.000Z');
const T4 = new Date('2026-07-22T14:00:00.000Z');

type PassLog = string[];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function pass(log: PassLog, caseId: string, detail: string): void {
  const line = `PASS A2 case ${caseId} — ${detail}`;
  log.push(line);
  console.log(line);
}

function mockRes(): {
  res: Response;
  statusCode: number;
  body: unknown;
} {
  let statusCode = 200;
  let body: unknown = null;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  } as unknown as Response;
  return {
    res,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
  };
}

async function runMiddleware(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  middleware: (req: Request, res: Response, next: NextFunction, ...rest: any[]) => void | Promise<void>,
  req: Partial<Request>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraArgs: any[] = []
): Promise<{ statusCode: number; body: unknown; nextCalled: boolean }> {
  const boxed = mockRes();
  let nextCalled = false;
  await new Promise<void>((resolve) => {
    void Promise.resolve(
      middleware(
        req as Request,
        boxed.res,
        (() => {
          nextCalled = true;
          resolve();
        }) as NextFunction,
        ...extraArgs
      )
    ).then(() => {
      if (!nextCalled) resolve();
    });
  });
  return { statusCode: boxed.statusCode, body: boxed.body, nextCalled };
}

function freshHarness(adminId = 'admin-1', b2cId = 'b2c-1'): {
  h: DeterministicLocalProviderAuthorityHarness;
  adminId: string;
  b2cId: string;
} {
  const h = createDeterministicLocalProviderAuthorityHarness();
  h.seedUser(adminId, Role.ADMIN);
  h.seedUser(b2cId, Role.B2C);
  return { h, adminId, b2cId };
}

function assertPublicDtoPrivacy(item: Record<string, unknown>): void {
  assert.deepEqual(Object.keys(item).sort(), [
    'businessId',
    'displayName',
    'supportedServiceTypes',
  ]);
  for (const forbidden of [
    'status',
    'publicB2cVisible',
    'activatedAt',
    'suspendedAt',
    'retiredAt',
    'eligibilityId',
    'id',
    'reason',
    'actorUserId',
    'ownerId',
    'payment',
    'audit',
  ]) {
    assert.equal(forbidden in item, false, `public dto must omit ${forbidden}`);
  }
}

async function runSourceGates(log: PassLog): Promise<void> {
  const routes = read('src/routes/localRoutes.ts');
  const controller = read('src/controllers/LocalProviderController.ts');
  const ops = read('src/services/local/localProviderEligibilityOpsService.ts');
  const list = read('src/services/local/localProviderEligibilityListService.ts');
  const auditWrite = read('src/services/local/localProviderEligibilityAuditWrite.ts');
  const prismaDeps = read('src/services/local/localProviderEligibilityAuthorityPrisma.ts');
  const composer = read('src/components/local/LocalUserRequestCreateComposer.tsx');
  const source = read('src/services/local/localCreateBusinessSource.ts');
  const doubles = read('scripts/localProviderEligibilityDeterministicDoubles.ts');

  assert.ok(routes.includes("localRouter.get('/providers'"), 'routes GET providers');
  assert.ok(routes.includes('localRouter.use(authMiddleware)'), 'auth on router');
  assert.ok(routes.includes('superAdminMiddleware'), 'superAdmin on ops');
  assert.ok(!controller.includes('req.body.actorUserId'), 'no body actorUserId');
  assert.ok(controller.includes('readAuthUserId'), 'actor from auth');

  assert.ok(ops.includes('runInTransaction'), 'ops uses txn runner');
  assert.ok(ops.includes('createLocalProviderEligibilityAuditEvent'), 'ops writes audit');
  assert.ok(prismaDeps.includes('$transaction'), 'production Prisma txn');
  assert.ok(prismaDeps.includes('createPrismaLocalProviderAuthorityDeps'), 'prisma factory');
  assert.ok(
    list.includes('createPrismaLocalProviderAuthorityDeps') ||
      list.includes('resolveDeps'),
    'list defaults to prisma'
  );
  assert.ok(auditWrite.includes('createAuditEvent'), 'audit via tx seam');
  assert.ok(!/\.(update|updateMany|delete|deleteMany)\s*\(/.test(auditWrite), 'audit append-only');

  assert.ok(!doubles.includes('lifecycleTimestampsForTransition'), 'fake has no lifecycle policy');
  assert.ok(!doubles.includes('isLocalProviderSelectable'), 'fake has no selectable policy');
  assert.ok(!doubles.includes('isAdminRole'), 'fake has no admin policy');

  // Fake must not be imported from src/
  for (const rel of [
    'src/services/local/localProviderEligibilityOpsService.ts',
    'src/services/local/localProviderEligibilityListService.ts',
    'src/services/local/localProviderEligibilityAuthorityPrisma.ts',
    'src/controllers/LocalProviderController.ts',
    'src/routes/localRoutes.ts',
  ]) {
    const text = read(rel);
    assert.ok(
      !text.includes('localProviderEligibilityDeterministicDoubles'),
      `${rel} must not import test doubles`
    );
    assert.ok(!/process\.env\.[A-Z0-9_]*FAKE/.test(text), `${rel} no env fake`);
    assert.ok(!text.includes('42P01'), `${rel} no missing-table fake fallback`);
  }

  assert.ok(composer.includes('loadLocalCreateBusinessOptions'), 'composer uses Pack B loader');
  assert.ok(composer.includes('PROVIDER_IDLE') || composer.includes('PROVIDER_LOADING'), 'Pack B provider states');
  assert.ok(source.includes('listLocalProviders'), 'source calls provider list client');
  assert.ok(!composer.includes('viGlobalTourismApi'), 'no Tourism in composer');
  assert.ok(!source.includes('PROVIDER_SELECTION_UNAVAILABLE'), 'Pack B replaces unavailable freeze');
  const listClient = read('src/services/local/localProviderListClient.ts');
  assert.ok(listClient.includes('/api/local/providers'), 'Pack B GET providers adapter');
  assert.ok(!listClient.includes('42P01'), 'no missing-table fake');

  const forbidden = findForbiddenLocalProviderEligibilityAuditMutations(ROOT);
  assert.deepEqual(forbidden, [], `append-only: ${forbidden.join(', ')}`);

  pass(log, 'gates', 'source DI / fake isolation / append-only / Pack B freeze');
}

async function runValidationCases(log: PassLog): Promise<void> {
  const qOk = validateLocalProviderListQuery({});
  assert.equal(qOk.ok, true);
  if (qOk.ok) {
    assert.equal(qOk.limit, LOCAL_PROVIDER_LIST_DEFAULT_LIMIT);
    assert.equal(qOk.skip, 0);
  }
  assert.equal(validateLocalProviderListQuery({ limit: '1' }).ok, true);
  assert.equal(validateLocalProviderListQuery({ limit: '100' }).ok, true);
  assert.equal(validateLocalProviderListQuery({ limit: '0' }).ok, false);
  assert.equal(validateLocalProviderListQuery({ limit: '101' }).ok, false);
  assert.equal(validateLocalProviderListQuery({ limit: '1.5' }).ok, false);
  assert.equal(validateLocalProviderListQuery({ limit: '-1' }).ok, false);
  assert.equal(validateLocalProviderListQuery({ limit: ['1'] }).ok, false);
  assert.equal(validateLocalProviderListQuery({ skip: '0' }).ok, true);
  assert.equal(validateLocalProviderListQuery({ skip: '-1' }).ok, false);
  assert.equal(
    validateLocalProviderListQuery({ serviceType: LocalServiceType.GENERIC_REQUEST }).ok,
    true
  );
  assert.equal(validateLocalProviderListQuery({ serviceType: 'NOT_A_TYPE' }).ok, false);

  assert.equal(validateRegisterLocalProviderBody({ businessId: 'b1' }).ok, true);
  assert.equal(
    validateRegisterLocalProviderBody({ businessId: 'b1', actorUserId: 'x' }).ok,
    false
  );
  assert.equal(validateRegisterLocalProviderBody({ businessId: 'b1', status: 'ACTIVE' }).ok, false);
  assert.equal(
    validateRegisterLocalProviderBody({
      businessId: 'b1',
      activatedAt: '2026-01-01T00:00:00.000Z',
    }).ok,
    false
  );

  assert.equal(validatePatchLocalProviderBody({}).ok, false);
  assert.equal(
    validatePatchLocalProviderBody({ publicB2cVisible: true, status: 'ACTIVE' }).ok,
    false
  );
  assert.equal(validatePatchLocalProviderBody({ reason: 'x' }).ok, false);
  assert.equal(validatePatchLocalProviderBody({ actorUserId: 'x' }).ok, false);

  assert.equal(validateTransitionReasonBody({ reason: 'x'.repeat(281) }).ok, false);
  assert.equal(validateTransitionReasonBody({ reason: 'ok', extra: 1 }).ok, false);
  assert.equal(validateTransitionReasonBody({ reason: 'temp hold' }).ok, true);
  assert.equal(sameServiceTypeLists([LocalServiceType.GENERIC_REQUEST], [LocalServiceType.GENERIC_REQUEST]), true);
  assert.equal(LOCAL_PROVIDER_LIST_MAX_LIMIT, 100);

  pass(log, 'validation', 'query/body validators executed');
}

async function runCase30(log: PassLog): Promise<void> {
  const { h, adminId, b2cId } = freshHarness();
  const findUserRole = (userId: string) => h.deps.findUserRole(userId);

  // authMiddleware unauthenticated
  const unauth = await runMiddleware(authMiddleware, { headers: {} });
  assert.equal(unauth.statusCode, 401);
  assert.equal(unauth.nextCalled, false);

  // GET unauthenticated at controller
  const getUnauth = mockRes();
  await getLocalProviders({ query: {} } as Request, getUnauth.res, h.deps);
  assert.equal(getUnauth.statusCode, 401);

  // GET authenticated reaches handler (200 empty list)
  const getAuth = mockRes();
  await getLocalProviders(
    { authUserId: b2cId, query: {} } as unknown as Request,
    getAuth.res,
    h.deps
  );
  assert.equal(getAuth.statusCode, 200);

  // ops unauthenticated via superAdmin
  const opsUnauth = await runMiddleware(superAdminMiddleware, {});
  assert.equal(opsUnauth.statusCode, 401);
  assert.equal(opsUnauth.nextCalled, false);

  // ops authenticated non-admin → 403 (executed middleware)
  const opsNonAdmin = await runMiddleware(
    superAdminMiddleware,
    { authUserId: b2cId } as Partial<Request>,
    [{ findUserRole }]
  );
  assert.equal(opsNonAdmin.statusCode, 403);
  assert.equal(opsNonAdmin.nextCalled, false);

  // ops Role.ADMIN → next()
  const opsAdmin = await runMiddleware(
    superAdminMiddleware,
    { authUserId: adminId } as Partial<Request>,
    [{ findUserRole }]
  );
  assert.equal(opsAdmin.nextCalled, true);

  // body actorUserId rejected; trusted auth identity used for audit
  const bizId = 'biz-actor';
  h.seedBusiness(bizId, 'Actor Biz');
  const reg = mockRes();
  await postRegisterLocalProvider(
    {
      authUserId: adminId,
      body: { businessId: bizId, actorUserId: 'spoofed-actor' },
    } as unknown as Request,
    reg.res,
    h.deps
  );
  assert.equal(reg.statusCode, 400, 'unknown actorUserId body field rejected');

  const regOk = mockRes();
  await postRegisterLocalProvider(
    {
      authUserId: adminId,
      body: { businessId: bizId },
    } as unknown as Request,
    regOk.res,
    h.deps
  );
  assert.equal(regOk.statusCode, 201);
  const audits = h.listAudits();
  assert.equal(audits.length, 1);
  assert.equal(audits[0]?.actorUserId, adminId);
  assert.equal(audits[0]?.actorType, LocalProviderEligibilityAuditActorType.ROLE_ADMIN);

  pass(log, '30', 'executed middleware harness');
}

async function runCase31(log: PassLog): Promise<void> {
  const { h, adminId } = freshHarness();
  const bizId = 'biz-reg-1';
  h.seedBusiness(bizId, 'Register Biz');
  h.clock.setNow(T1);
  h.resetCounters();

  const ctrl = mockRes();
  await postRegisterLocalProvider(
    {
      authUserId: adminId,
      body: { businessId: bizId },
    } as unknown as Request,
    ctrl.res,
    h.deps
  );
  assert.equal(ctrl.statusCode, 201);
  const body = ctrl.body as {
    success: boolean;
    data: { provider: { status: string; publicB2cVisible: boolean; supportedServiceTypes: unknown[] } };
  };
  assert.equal(body.success, true);
  assert.equal(body.data.provider.status, LocalProviderEligibilityStatus.DRAFT);
  assert.equal(body.data.provider.publicB2cVisible, false);
  assert.deepEqual(body.data.provider.supportedServiceTypes, []);

  const elig = h.getEligibility(bizId);
  assert.ok(elig);
  assert.equal(elig!.status, LocalProviderEligibilityStatus.DRAFT);
  assert.equal(elig!.activatedAt, null);
  assert.equal(elig!.suspendedAt, null);
  assert.equal(elig!.retiredAt, null);
  assert.equal(h.counters.eligibilityCreate, 1);
  assert.equal(h.counters.auditCreate, 1);
  assert.equal(h.counters.transactionCommit, 1);
  assert.equal(h.counters.transactionRollback, 0);

  const audits = h.listAudits(elig!.id);
  assert.equal(audits.length, 1);
  assert.equal(audits[0]?.eventType, LocalProviderEligibilityAuditEventType.REGISTERED);
  assert.equal(audits[0]?.priorStatus, null);
  assert.equal(audits[0]?.priorPublicB2cVisible, null);
  assert.deepEqual(audits[0]?.priorSupportedServiceTypes, []);
  assert.equal(audits[0]?.nextStatus, LocalProviderEligibilityStatus.DRAFT);
  assert.equal(audits[0]?.nextPublicB2cVisible, false);
  assert.deepEqual(audits[0]?.nextSupportedServiceTypes, []);
  assert.equal(audits[0]?.actorUserId, adminId);

  // provided initial visibility/types
  const { h: h2, adminId: admin2 } = freshHarness('admin-2', 'b2c-2');
  const biz2 = 'biz-reg-2';
  h2.seedBusiness(biz2, 'Register Biz 2');
  const withCfg = await registerLocalProviderEligibility(
    {
      actorUserId: admin2,
      businessId: biz2,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      publicB2cVisible: true,
    },
    h2.deps
  );
  assert.equal(withCfg.ok, true);
  if (withCfg.ok) {
    assert.equal(withCfg.created, true);
    assert.equal(withCfg.provider.publicB2cVisible, true);
    assert.deepEqual(withCfg.provider.supportedServiceTypes, [LocalServiceType.GENERIC_REQUEST]);
  }

  pass(log, '31', 'deterministic transaction store');
}

async function runCase32(log: PassLog): Promise<void> {
  const { h, adminId } = freshHarness();
  const bizId = 'biz-rep';
  h.seedBusiness(bizId, 'Repeat Biz');
  h.clock.setNow(T1);
  const first = await registerLocalProviderEligibility(
    {
      actorUserId: adminId,
      businessId: bizId,
      supportedServiceTypes: [],
      publicB2cVisible: false,
    },
    h.deps
  );
  assert.equal(first.ok, true);
  const prior = h.getEligibility(bizId)!;
  const priorUpdatedAt = prior.updatedAt.toISOString();
  h.resetCounters();

  const ctrl = mockRes();
  await postRegisterLocalProvider(
    {
      authUserId: adminId,
      body: {
        businessId: bizId,
        supportedServiceTypes: [LocalServiceType.FIXER_HIRE],
        publicB2cVisible: true,
      },
    } as unknown as Request,
    ctrl.res,
    h.deps
  );
  assert.equal(ctrl.statusCode, 200);
  assert.equal(h.counters.eligibilityCreate, 0);
  assert.equal(h.counters.eligibilityUpdate, 0);
  assert.equal(h.counters.auditCreate, 0);
  const after = h.getEligibility(bizId)!;
  assert.equal(after.publicB2cVisible, false);
  assert.deepEqual(after.supportedServiceTypes, []);
  assert.equal(after.updatedAt.toISOString(), priorUpdatedAt);
  assert.equal(after.activatedAt, null);
  assert.equal(h.listAudits().length, 1);
  assert.equal(h.listAudits()[0]?.eventType, LocalProviderEligibilityAuditEventType.REGISTERED);

  pass(log, '32', 'deterministic transaction store');
}

async function runCase33(log: PassLog): Promise<void> {
  for (const status of [
    LocalProviderEligibilityStatus.DRAFT,
    LocalProviderEligibilityStatus.ACTIVE,
    LocalProviderEligibilityStatus.SUSPENDED,
  ] as const) {
    const { h, adminId } = freshHarness(`admin-${status}`, `b2c-${status}`);
    const bizId = `biz-patch-${status}`;
    h.seedBusiness(bizId, `Patch ${status}`);
    const seedUpdated = new Date('2026-07-22T09:30:00.000Z');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status,
        publicB2cVisible: true,
        supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
        activatedAt: status === LocalProviderEligibilityStatus.DRAFT ? null : T1,
        suspendedAt: status === LocalProviderEligibilityStatus.SUSPENDED ? T2 : null,
        updatedAt: seedUpdated,
      })
    );
    h.clock.setNow(T3);
    h.resetCounters();

    const result = await patchLocalProviderEligibility(
      {
        actorUserId: adminId,
        businessId: bizId,
        supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST, LocalServiceType.FIXER_HIRE],
      },
      h.deps
    );
    assert.equal(result.ok, true, `case33 ${status}`);
    assert.equal(h.counters.eligibilityUpdate, 1);
    assert.equal(h.counters.auditCreate, 1);
    assert.equal(h.counters.transactionCommit, 1);
    const elig = h.getEligibility(bizId)!;
    assert.equal(elig.status, status);
    assert.equal(elig.updatedAt.toISOString(), T3.toISOString());
    if (status === LocalProviderEligibilityStatus.DRAFT) {
      assert.equal(elig.activatedAt, null);
    } else {
      assert.equal(elig.activatedAt?.toISOString(), T1.toISOString());
    }
    if (status === LocalProviderEligibilityStatus.SUSPENDED) {
      assert.equal(elig.suspendedAt?.toISOString(), T2.toISOString());
    } else {
      assert.equal(elig.suspendedAt, null);
    }
    const audit = h.listAudits(elig.id)[0]!;
    assert.equal(audit.eventType, LocalProviderEligibilityAuditEventType.CONFIG_UPDATED);
    assert.equal(audit.priorStatus, status);
    assert.equal(audit.nextStatus, status);
    assert.equal(audit.priorPublicB2cVisible, true);
    assert.equal(audit.nextPublicB2cVisible, true);
    assert.deepEqual(audit.priorSupportedServiceTypes, [LocalServiceType.GENERIC_REQUEST]);
    assert.ok(audit.nextSupportedServiceTypes.includes(LocalServiceType.FIXER_HIRE));
  }

  pass(log, '33', 'deterministic transaction store');
}

async function runCase34(log: PassLog): Promise<void> {
  for (const status of [
    LocalProviderEligibilityStatus.DRAFT,
    LocalProviderEligibilityStatus.ACTIVE,
    LocalProviderEligibilityStatus.SUSPENDED,
  ] as const) {
    const { h, adminId } = freshHarness(`admin-nc-${status}`, `b2c-nc-${status}`);
    const bizId = `biz-nc-${status}`;
    h.seedBusiness(bizId, `NoChange ${status}`);
    const seedUpdated = new Date('2026-07-22T09:45:00.000Z');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status,
        publicB2cVisible: true,
        supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
        activatedAt: status === LocalProviderEligibilityStatus.DRAFT ? null : T1,
        suspendedAt: status === LocalProviderEligibilityStatus.SUSPENDED ? T2 : null,
        updatedAt: seedUpdated,
      })
    );
    h.clock.setNow(T3);
    h.resetCounters();

    const ctrl = mockRes();
    await patchLocalProvider(
      {
        authUserId: adminId,
        params: { businessId: bizId },
        body: {
          publicB2cVisible: true,
          supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
        },
      } as unknown as Request,
      ctrl.res,
      h.deps
    );
    assert.equal(ctrl.statusCode, 200);
    assert.equal(h.counters.eligibilityUpdate, 0);
    assert.equal(h.counters.auditCreate, 0);
    assert.equal(h.counters.transactionCommit, 0);
    const elig = h.getEligibility(bizId)!;
    assert.equal(elig.updatedAt.toISOString(), seedUpdated.toISOString());
  }

  pass(log, '34', 'deterministic transaction store');
}

async function runCases35_36(log: PassLog): Promise<void> {
  const { h, adminId } = freshHarness();
  const bizId = 'biz-active-inv';
  h.seedBusiness(bizId, 'Active Invariant Biz');
  const seedUpdated = new Date('2026-07-22T09:50:00.000Z');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: bizId,
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      activatedAt: T1,
      updatedAt: seedUpdated,
    })
  );
  h.resetCounters();

  const priv = await patchLocalProviderEligibility(
    { actorUserId: adminId, businessId: bizId, publicB2cVisible: false },
    h.deps
  );
  assert.equal(priv.ok, false);
  if (!priv.ok) assert.equal(priv.reason, 'conflict');
  assert.equal(h.counters.eligibilityUpdate, 0);
  assert.equal(h.counters.auditCreate, 0);
  assert.equal(h.getEligibility(bizId)!.updatedAt.toISOString(), seedUpdated.toISOString());

  const empty = await patchLocalProviderEligibility(
    { actorUserId: adminId, businessId: bizId, supportedServiceTypes: [] },
    h.deps
  );
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.reason, 'conflict');

  const ctrlPriv = mockRes();
  await patchLocalProvider(
    {
      authUserId: adminId,
      params: { businessId: bizId },
      body: { publicB2cVisible: false },
    } as unknown as Request,
    ctrlPriv.res,
    h.deps
  );
  assert.equal(ctrlPriv.statusCode, 409);

  // invalid Business display name blocks activation
  const { h: h2, adminId: a2 } = freshHarness('admin-blank', 'b2c-blank');
  const bizBlank = 'biz-blank-name';
  h2.seedBusiness(bizBlank, '   ');
  h2.seedEligibility(
    buildSeedEligibility({
      businessId: bizBlank,
      status: LocalProviderEligibilityStatus.DRAFT,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
    })
  );
  h2.resetCounters();
  const act = await activateLocalProviderEligibility(
    { actorUserId: a2, businessId: bizBlank },
    h2.deps
  );
  assert.equal(act.ok, false);
  if (!act.ok) assert.equal(act.reason, 'conflict');
  assert.equal(h2.counters.eligibilityUpdate, 0);
  assert.equal(h2.counters.auditCreate, 0);
  assert.equal(h2.getEligibility(bizBlank)!.status, LocalProviderEligibilityStatus.DRAFT);

  pass(log, '35–36', 'deterministic transaction store');
}

async function runCase37(log: PassLog): Promise<void> {
  const { h, adminId } = freshHarness();
  const bizId = 'biz-d2a';
  h.seedBusiness(bizId, 'Draft To Active');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: bizId,
      status: LocalProviderEligibilityStatus.DRAFT,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      updatedAt: new Date('2026-07-22T09:00:00.000Z'),
    })
  );
  h.clock.setNow(T1);
  h.resetCounters();

  const result = await activateLocalProviderEligibility(
    { actorUserId: adminId, businessId: bizId },
    h.deps
  );
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('activate failed');
  assert.equal(result.provider.status, LocalProviderEligibilityStatus.ACTIVE);
  assert.equal(result.provider.activatedAt, T1.toISOString());
  assert.equal(result.provider.suspendedAt, null);
  assert.equal(result.provider.retiredAt, null);
  assert.equal(h.counters.eligibilityUpdate, 1);
  assert.equal(h.counters.auditCreate, 1);
  assert.equal(h.counters.transactionCommit, 1);
  const audit = h.listAudits()[0]!;
  assert.equal(audit.eventType, LocalProviderEligibilityAuditEventType.ACTIVATED);
  assert.equal(audit.priorStatus, LocalProviderEligibilityStatus.DRAFT);
  assert.equal(audit.nextStatus, LocalProviderEligibilityStatus.ACTIVE);

  // failed ACTIVE invariant (visibility false)
  const { h: h2, adminId: a2 } = freshHarness('admin-d2a-fail', 'b2c-d2a-fail');
  const biz2 = 'biz-d2a-fail';
  h2.seedBusiness(biz2, 'Fail Active');
  h2.seedEligibility(
    buildSeedEligibility({
      businessId: biz2,
      status: LocalProviderEligibilityStatus.DRAFT,
      publicB2cVisible: false,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
    })
  );
  h2.resetCounters();
  const fail = await activateLocalProviderEligibility(
    { actorUserId: a2, businessId: biz2 },
    h2.deps
  );
  assert.equal(fail.ok, false);
  if (!fail.ok) assert.equal(fail.reason, 'conflict');
  assert.equal(h2.counters.eligibilityUpdate, 0);
  assert.equal(h2.counters.auditCreate, 0);
  const ctrl = mockRes();
  await postActivateLocalProvider(
    { authUserId: a2, params: { businessId: biz2 }, body: {} } as unknown as Request,
    ctrl.res,
    h2.deps
  );
  assert.equal(ctrl.statusCode, 409);

  pass(log, '37', 'deterministic transaction store');
}

async function runCase38(log: PassLog): Promise<void> {
  const { h, adminId } = freshHarness();
  const bizId = 'biz-d2r';
  h.seedBusiness(bizId, 'Draft Retire');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: bizId,
      status: LocalProviderEligibilityStatus.DRAFT,
      publicB2cVisible: false,
      supportedServiceTypes: [],
    })
  );
  h.clock.setNow(T1);
  h.resetCounters();

  const result = await retireLocalProviderEligibility(
    { actorUserId: adminId, businessId: bizId, reason: 'ops cleanup' },
    h.deps
  );
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('retire failed');
  assert.equal(result.provider.status, LocalProviderEligibilityStatus.RETIRED);
  assert.equal(result.provider.activatedAt, null);
  assert.equal(result.provider.suspendedAt, null);
  assert.equal(result.provider.retiredAt, T1.toISOString());
  assert.equal('reason' in (h.getEligibility(bizId) as object), false);
  const audit = h.listAudits()[0]!;
  assert.equal(audit.eventType, LocalProviderEligibilityAuditEventType.RETIRED);
  assert.equal(audit.reason, 'ops cleanup');

  pass(log, '38', 'deterministic transaction store');
}

async function runCase39(log: PassLog): Promise<void> {
  const { h, adminId } = freshHarness();
  const bizId = 'biz-a2s';
  h.seedBusiness(bizId, 'Active Suspend');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: bizId,
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      activatedAt: T1,
    })
  );
  h.clock.setNow(T2);
  const result = await suspendLocalProviderEligibility(
    { actorUserId: adminId, businessId: bizId, reason: 'ops hold' },
    h.deps
  );
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('suspend failed');
  assert.equal(result.provider.status, LocalProviderEligibilityStatus.SUSPENDED);
  assert.equal(result.provider.activatedAt, T1.toISOString());
  assert.equal(result.provider.suspendedAt, T2.toISOString());
  assert.equal(result.provider.retiredAt, null);
  const audit = h.listAudits()[0]!;
  assert.equal(audit.eventType, LocalProviderEligibilityAuditEventType.SUSPENDED);
  assert.equal(audit.reason, 'ops hold');
  assert.equal(audit.priorStatus, LocalProviderEligibilityStatus.ACTIVE);
  assert.equal(audit.nextStatus, LocalProviderEligibilityStatus.SUSPENDED);

  pass(log, '39', 'deterministic transaction store');
}

async function runCase40(log: PassLog): Promise<void> {
  const { h, adminId } = freshHarness();
  const bizId = 'biz-a2r';
  h.seedBusiness(bizId, 'Active Retire');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: bizId,
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      activatedAt: T1,
    })
  );
  h.clock.setNow(T2);
  const result = await retireLocalProviderEligibility(
    { actorUserId: adminId, businessId: bizId, reason: null },
    h.deps
  );
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('retire failed');
  assert.equal(result.provider.status, LocalProviderEligibilityStatus.RETIRED);
  assert.equal(result.provider.activatedAt, T1.toISOString());
  assert.equal(result.provider.suspendedAt, null);
  assert.equal(result.provider.retiredAt, T2.toISOString());
  assert.equal(h.listAudits()[0]?.eventType, LocalProviderEligibilityAuditEventType.RETIRED);

  pass(log, '40', 'deterministic transaction store');
}

async function runCase41(log: PassLog): Promise<void> {
  // SUSPENDED → ACTIVE
  {
    const { h, adminId } = freshHarness();
    const bizId = 'biz-s2a';
    h.seedBusiness(bizId, 'Suspended Reactivate');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status: LocalProviderEligibilityStatus.SUSPENDED,
        publicB2cVisible: true,
        supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
        activatedAt: T1,
        suspendedAt: T2,
      })
    );
    h.clock.setNow(T3);
    const result = await activateLocalProviderEligibility(
      { actorUserId: adminId, businessId: bizId },
      h.deps
    );
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error('reactivate failed');
    assert.equal(result.provider.status, LocalProviderEligibilityStatus.ACTIVE);
    assert.equal(result.provider.activatedAt, T3.toISOString());
    assert.equal(result.provider.suspendedAt, null);
    assert.equal(result.provider.retiredAt, null);
    assert.equal(h.listAudits()[0]?.eventType, LocalProviderEligibilityAuditEventType.ACTIVATED);
  }

  // SUSPENDED → RETIRED
  {
    const { h, adminId } = freshHarness('admin-s2r', 'b2c-s2r');
    const bizId = 'biz-s2r';
    h.seedBusiness(bizId, 'Suspended Retire');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status: LocalProviderEligibilityStatus.SUSPENDED,
        publicB2cVisible: true,
        supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
        activatedAt: T1,
        suspendedAt: T2,
      })
    );
    h.clock.setNow(T3);
    const result = await retireLocalProviderEligibility(
      { actorUserId: adminId, businessId: bizId, reason: null },
      h.deps
    );
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error('retire suspended failed');
    assert.equal(result.provider.status, LocalProviderEligibilityStatus.RETIRED);
    assert.equal(result.provider.activatedAt, T1.toISOString());
    assert.equal(result.provider.suspendedAt, T2.toISOString());
    assert.equal(result.provider.retiredAt, T3.toISOString());
  }

  pass(log, '41', 'deterministic transaction store');
}

async function runCase42(log: PassLog): Promise<void> {
  // same-state no-ops
  {
    const { h, adminId } = freshHarness();
    const bizId = 'biz-same-active';
    h.seedBusiness(bizId, 'Same Active');
    const seedUpdated = new Date('2026-07-22T09:10:00.000Z');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status: LocalProviderEligibilityStatus.ACTIVE,
        publicB2cVisible: true,
        supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
        activatedAt: T1,
        updatedAt: seedUpdated,
      })
    );
    h.resetCounters();
    const act = await activateLocalProviderEligibility(
      { actorUserId: adminId, businessId: bizId },
      h.deps
    );
    assert.equal(act.ok, true);
    assert.equal(h.counters.eligibilityUpdate, 0);
    assert.equal(h.counters.auditCreate, 0);
    assert.equal(h.getEligibility(bizId)!.updatedAt.toISOString(), seedUpdated.toISOString());
  }
  {
    const { h, adminId } = freshHarness('admin-ss', 'b2c-ss');
    const bizId = 'biz-same-sus';
    h.seedBusiness(bizId, 'Same Suspended');
    const seedUpdated = new Date('2026-07-22T09:11:00.000Z');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status: LocalProviderEligibilityStatus.SUSPENDED,
        publicB2cVisible: true,
        supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
        activatedAt: T1,
        suspendedAt: T2,
        updatedAt: seedUpdated,
      })
    );
    h.resetCounters();
    const sus = await suspendLocalProviderEligibility(
      { actorUserId: adminId, businessId: bizId, reason: null },
      h.deps
    );
    assert.equal(sus.ok, true);
    assert.equal(h.counters.eligibilityUpdate, 0);
    assert.equal(h.counters.auditCreate, 0);
  }
  {
    const { h, adminId } = freshHarness('admin-sr', 'b2c-sr');
    const bizId = 'biz-same-ret';
    h.seedBusiness(bizId, 'Same Retired');
    const seedUpdated = new Date('2026-07-22T09:12:00.000Z');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status: LocalProviderEligibilityStatus.RETIRED,
        publicB2cVisible: false,
        supportedServiceTypes: [],
        retiredAt: T1,
        updatedAt: seedUpdated,
      })
    );
    h.resetCounters();
    const ret = await retireLocalProviderEligibility(
      { actorUserId: adminId, businessId: bizId, reason: null },
      h.deps
    );
    assert.equal(ret.ok, true);
    assert.equal(h.counters.eligibilityUpdate, 0);
    assert.equal(h.counters.auditCreate, 0);
  }

  // forbidden transitions
  {
    const { h, adminId } = freshHarness('admin-forb', 'b2c-forb');
    const bizId = 'biz-draft-sus';
    h.seedBusiness(bizId, 'Draft Cannot Suspend');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status: LocalProviderEligibilityStatus.DRAFT,
        publicB2cVisible: false,
        supportedServiceTypes: [],
      })
    );
    h.resetCounters();
    const sus = await suspendLocalProviderEligibility(
      { actorUserId: adminId, businessId: bizId, reason: null },
      h.deps
    );
    assert.equal(sus.ok, false);
    if (!sus.ok) assert.equal(sus.reason, 'conflict');
    assert.equal(h.counters.eligibilityUpdate, 0);
    assert.equal(h.counters.auditCreate, 0);
  }
  {
    const { h, adminId } = freshHarness('admin-ret-act', 'b2c-ret-act');
    const bizId = 'biz-ret-act';
    h.seedBusiness(bizId, 'Retired Cannot Activate');
    const seedUpdated = new Date('2026-07-22T09:13:00.000Z');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status: LocalProviderEligibilityStatus.RETIRED,
        publicB2cVisible: true,
        supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
        retiredAt: T1,
        updatedAt: seedUpdated,
      })
    );
    h.resetCounters();
    const act = await activateLocalProviderEligibility(
      { actorUserId: adminId, businessId: bizId },
      h.deps
    );
    assert.equal(act.ok, false);
    const sus = await suspendLocalProviderEligibility(
      { actorUserId: adminId, businessId: bizId, reason: null },
      h.deps
    );
    assert.equal(sus.ok, false);
    const patch = await patchLocalProviderEligibility(
      { actorUserId: adminId, businessId: bizId, publicB2cVisible: true },
      h.deps
    );
    assert.equal(patch.ok, false);
    if (!patch.ok) assert.equal(patch.reason, 'conflict');
    const patchSame = await patchLocalProviderEligibility(
      {
        actorUserId: adminId,
        businessId: bizId,
        publicB2cVisible: true,
        supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      },
      h.deps
    );
    assert.equal(patchSame.ok, false);
    assert.equal(h.counters.eligibilityUpdate, 0);
    assert.equal(h.counters.auditCreate, 0);
    assert.equal(h.getEligibility(bizId)!.updatedAt.toISOString(), seedUpdated.toISOString());
    assert.equal(h.getEligibility(bizId)!.retiredAt?.toISOString(), T1.toISOString());

    const ctrl = mockRes();
    await patchLocalProvider(
      {
        authUserId: adminId,
        params: { businessId: bizId },
        body: { publicB2cVisible: false },
      } as unknown as Request,
      ctrl.res,
      h.deps
    );
    assert.equal(ctrl.statusCode, 409);
  }

  pass(log, '42', 'deterministic transaction store');
}

async function runCase43(log: PassLog): Promise<void> {
  const { h, adminId, b2cId } = freshHarness();
  // 1 selectable
  h.seedBusiness('b-sel-a', 'Alpha Cafe');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: 'b-sel-a',
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
    })
  );
  // 2 private
  h.seedBusiness('b-priv', 'Private Place');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: 'b-priv',
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: false,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
    })
  );
  // 3 empty types
  h.seedBusiness('b-empty', 'Empty Types');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: 'b-empty',
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: [],
    })
  );
  // 4 DRAFT
  h.seedBusiness('b-draft', 'Draft Place');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: 'b-draft',
      status: LocalProviderEligibilityStatus.DRAFT,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
    })
  );
  // 5 SUSPENDED
  h.seedBusiness('b-sus', 'Suspended Place');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: 'b-sus',
      status: LocalProviderEligibilityStatus.SUSPENDED,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      activatedAt: T1,
      suspendedAt: T2,
    })
  );
  // 6 RETIRED
  h.seedBusiness('b-ret', 'Retired Place');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: 'b-ret',
      status: LocalProviderEligibilityStatus.RETIRED,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      retiredAt: T1,
    })
  );
  // 7 invalid name
  h.seedBusiness('b-blank', '  ');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: 'b-blank',
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
    })
  );
  // 8 equal names — businessId order
  h.seedBusiness('b-dup-2', 'Dup Name');
  h.seedBusiness('b-dup-1', 'Dup Name');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: 'b-dup-2',
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
    })
  );
  h.seedEligibility(
    buildSeedEligibility({
      businessId: 'b-dup-1',
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
    })
  );
  // 9 different service types
  h.seedBusiness('b-fixer', 'Zeta Fixer');
  h.seedEligibility(
    buildSeedEligibility({
      businessId: 'b-fixer',
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      supportedServiceTypes: [LocalServiceType.FIXER_HIRE],
    })
  );

  const all = await listSelectableLocalProviders({}, h.deps);
  assert.deepEqual(
    all.items.map((i) => i.businessId),
    ['b-sel-a', 'b-dup-1', 'b-dup-2', 'b-fixer']
  );
  for (const item of all.items) {
    assertPublicDtoPrivacy(item as unknown as Record<string, unknown>);
  }
  assert.equal(all.pagination.limit, 50);
  assert.equal(all.pagination.skip, 0);
  assert.equal(all.pagination.returned, 4);

  const filtered = await listSelectableLocalProviders(
    { serviceType: LocalServiceType.FIXER_HIRE },
    h.deps
  );
  assert.deepEqual(
    filtered.items.map((i) => i.businessId),
    ['b-fixer']
  );

  const page = await listSelectableLocalProviders({ limit: 2, skip: 1 }, h.deps);
  assert.equal(page.pagination.limit, 2);
  assert.equal(page.pagination.skip, 1);
  assert.equal(page.pagination.returned, 2);
  assert.deepEqual(
    page.items.map((i) => i.businessId),
    ['b-dup-1', 'b-dup-2']
  );

  const emptyH = createDeterministicLocalProviderAuthorityHarness();
  emptyH.seedUser(b2cId, Role.B2C);
  const empty = await listSelectableLocalProviders({}, emptyH.deps);
  assert.deepEqual(empty.items, []);
  assert.equal(empty.pagination.returned, 0);

  const ctrl = mockRes();
  await getLocalProviders(
    { authUserId: b2cId, query: { limit: '2', skip: '0' } } as unknown as Request,
    ctrl.res,
    h.deps
  );
  assert.equal(ctrl.statusCode, 200);
  const envelope = ctrl.body as {
    success: boolean;
    data: { items: unknown[]; pagination: { limit: number; skip: number; returned: number } };
  };
  assert.equal(envelope.success, true);
  assert.equal(envelope.data.pagination.limit, 2);
  assert.ok(!('hasMore' in (envelope.data.pagination as object)));

  // invalid query 400
  const badQ = mockRes();
  await getLocalProviders(
    { authUserId: b2cId, query: { limit: '0' } } as unknown as Request,
    badQ.res,
    h.deps
  );
  assert.equal(badQ.statusCode, 400);

  // 404 unknown business register
  const miss = mockRes();
  await postRegisterLocalProvider(
    {
      authUserId: adminId,
      body: { businessId: 'missing-business' },
    } as unknown as Request,
    miss.res,
    h.deps
  );
  assert.equal(miss.statusCode, 404);

  // activate body rejected
  const actBody = mockRes();
  await postActivateLocalProvider(
    {
      authUserId: adminId,
      params: { businessId: 'b-sel-a' },
      body: { reason: 'nope' },
    } as unknown as Request,
    actBody.res,
    h.deps
  );
  assert.equal(actBody.statusCode, 400);

  void adminId;
  pass(log, '43', 'deterministic selectable-list store');
}

async function runRollbackProofs(log: PassLog): Promise<void> {
  // A — register + REGISTERED audit rollback
  {
    const { h, adminId } = freshHarness();
    const bizId = 'biz-roll-reg';
    h.seedBusiness(bizId, 'Rollback Reg');
    h.failNext('auditCreate');
    h.resetCounters();
    const result = await registerLocalProviderEligibility(
      {
        actorUserId: adminId,
        businessId: bizId,
        supportedServiceTypes: [],
        publicB2cVisible: false,
      },
      h.deps
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, 'invalid_input');
    assert.equal(h.getEligibility(bizId), null);
    assert.equal(h.listAudits().length, 0);
    assert.equal(h.counters.transactionRollback, 1);
    assert.equal(h.counters.transactionCommit, 0);
  }

  // B — config update + CONFIG_UPDATED audit rollback
  {
    const { h, adminId } = freshHarness('admin-roll-cfg', 'b2c-roll-cfg');
    const bizId = 'biz-roll-cfg';
    h.seedBusiness(bizId, 'Rollback Cfg');
    const seedUpdated = new Date('2026-07-22T09:20:00.000Z');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status: LocalProviderEligibilityStatus.DRAFT,
        publicB2cVisible: false,
        supportedServiceTypes: [],
        updatedAt: seedUpdated,
      })
    );
    h.clock.setNow(T4);
    h.failNext('auditCreate');
    h.resetCounters();
    const result = await patchLocalProviderEligibility(
      {
        actorUserId: adminId,
        businessId: bizId,
        publicB2cVisible: true,
      },
      h.deps
    );
    assert.equal(result.ok, false);
    const elig = h.getEligibility(bizId)!;
    assert.equal(elig.publicB2cVisible, false);
    assert.equal(elig.updatedAt.toISOString(), seedUpdated.toISOString());
    assert.equal(h.listAudits().length, 0);
    assert.equal(h.counters.transactionRollback, 1);
  }

  // C — lifecycle (activate) + audit rollback
  {
    const { h, adminId } = freshHarness('admin-roll-life', 'b2c-roll-life');
    const bizId = 'biz-roll-life';
    h.seedBusiness(bizId, 'Rollback Life');
    const seedUpdated = new Date('2026-07-22T09:21:00.000Z');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status: LocalProviderEligibilityStatus.DRAFT,
        publicB2cVisible: true,
        supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
        updatedAt: seedUpdated,
      })
    );
    h.clock.setNow(T1);
    h.failNext('auditCreate');
    h.resetCounters();
    const result = await activateLocalProviderEligibility(
      { actorUserId: adminId, businessId: bizId },
      h.deps
    );
    assert.equal(result.ok, false);
    const elig = h.getEligibility(bizId)!;
    assert.equal(elig.status, LocalProviderEligibilityStatus.DRAFT);
    assert.equal(elig.activatedAt, null);
    assert.equal(elig.updatedAt.toISOString(), seedUpdated.toISOString());
    assert.equal(h.listAudits().length, 0);
    assert.equal(h.counters.transactionRollback, 1);
  }

  // D — eligibility mutation failure → no audit
  {
    const { h, adminId } = freshHarness('admin-roll-el', 'b2c-roll-el');
    const bizId = 'biz-roll-el';
    h.seedBusiness(bizId, 'Rollback Elig');
    const seedUpdated = new Date('2026-07-22T09:22:00.000Z');
    h.seedEligibility(
      buildSeedEligibility({
        businessId: bizId,
        status: LocalProviderEligibilityStatus.DRAFT,
        publicB2cVisible: false,
        supportedServiceTypes: [],
        updatedAt: seedUpdated,
      })
    );
    h.failNext('eligibilityUpdate');
    h.resetCounters();
    const result = await patchLocalProviderEligibility(
      {
        actorUserId: adminId,
        businessId: bizId,
        publicB2cVisible: true,
      },
      h.deps
    );
    assert.equal(result.ok, false);
    const elig = h.getEligibility(bizId)!;
    assert.equal(elig.publicB2cVisible, false);
    assert.equal(elig.updatedAt.toISOString(), seedUpdated.toISOString());
    assert.equal(h.listAudits().length, 0);
    assert.equal(h.counters.auditCreate, 0);
    assert.equal(h.counters.transactionRollback, 1);
  }

  pass(log, 'rollback', 'audit-failure + eligibility-failure atomicity');
}

async function reportOptionalDbSkip(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.log(
      'OPTIONAL_DB_INTEGRATION_SKIPPED_EXPECTED_NO_MIGRATION_APPLY — DATABASE_URL unset'
    );
    return;
  }
  const prisma = getPrisma();
  try {
    if (!(await localProviderEligibilityTableExists(prisma))) {
      console.log(
        'OPTIONAL_DB_INTEGRATION_SKIPPED_EXPECTED_NO_MIGRATION_APPLY — LocalProviderEligibility unapplied'
      );
      return;
    }
    console.log(
      'OPTIONAL_DB_INTEGRATION_AVAILABLE — not required for cases 30–43 PASS (deterministic path owns PASS)'
    );
  } finally {
    await disconnectPrisma().catch(() => undefined);
  }
}

async function run(): Promise<void> {
  const log: PassLog = [];
  await runSourceGates(log);
  await runValidationCases(log);
  await runCase30(log);
  await runCase31(log);
  await runCase32(log);
  await runCase33(log);
  await runCase34(log);
  await runCases35_36(log);
  await runCase37(log);
  await runCase38(log);
  await runCase39(log);
  await runCase40(log);
  await runCase41(log);
  await runCase42(log);
  await runCase43(log);
  await runRollbackProofs(log);
  await reportOptionalDbSkip();

  console.log(
    `[test-local-provider-eligibility-read-ops-control] OK cases 30–43 executed=${log.filter((l) => l.startsWith('PASS A2 case') && /case (30|31|32|33|34|35|37|38|39|40|41|42|43)/.test(l) || l.includes('35–36')).length} deterministic; optional_db=separate`
  );
  console.log(
    `[test-local-provider-eligibility-read-ops-control] PASS lines=${log.length}`
  );
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
