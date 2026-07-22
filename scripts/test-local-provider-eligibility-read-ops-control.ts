/**
 * Pack A2 cases 30–43 — Local provider eligibility read + ops control.
 *
 * Under NO_MIGRATION_APPLY (eligibility table unapplied): runs validation,
 * lifecycle, source/route/controller, and append-only gates without writing
 * staging authority rows.
 *
 * When the table is applied in an isolated DB, also runs disposable
 * register/patch/transition integration with cleanup.
 *
 * Run: npx tsx scripts/test-local-provider-eligibility-read-ops-control.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';

import {
  BizType,
  LocalProviderEligibilityAuditEventType,
  LocalProviderEligibilityStatus,
  LocalServiceType,
  Role,
} from '@prisma/client';

import {
  getLocalProviders,
  postRegisterLocalProvider,
} from '../src/controllers/LocalProviderController';
import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { findForbiddenLocalProviderEligibilityAuditMutations } from '../src/services/local/localProviderEligibilityAuditAppendOnlyGate';
import {
  draftRegistrationTimestamps,
  lifecycleTimestampsForTransition,
} from '../src/services/local/localProviderEligibilityLifecycle';
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
  activateLocalProviderEligibility,
  patchLocalProviderEligibility,
  registerLocalProviderEligibility,
  retireLocalProviderEligibility,
  suspendLocalProviderEligibility,
} from '../src/services/local/localProviderEligibilityOpsService';
import {
  deleteLocalProviderEligibilityIfPresent,
  localProviderEligibilityTableExists,
} from './localProviderEligibilityTestSupport';

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function uniquePhone(): string {
  return `+4209${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
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

async function runSourceAndValidationCases(): Promise<void> {
  const routes = read('src/routes/localRoutes.ts');
  const controller = read('src/controllers/LocalProviderController.ts');
  const ops = read('src/services/local/localProviderEligibilityOpsService.ts');
  const list = read('src/services/local/localProviderEligibilityListService.ts');
  const auditWrite = read('src/services/local/localProviderEligibilityAuditWrite.ts');
  const composer = read('src/components/local/LocalUserRequestCreateComposer.tsx');
  const source = read('src/services/local/localCreateBusinessSource.ts');

  // --- Case 30: authorization wiring ---
  assert.ok(routes.includes("localRouter.get('/providers'"), 'case30 GET providers');
  assert.ok(routes.includes("localRouter.use(authMiddleware)"), 'case30 auth on router');
  assert.ok(routes.includes("'/ops/providers'"), 'case30 ops register');
  assert.ok(routes.includes('superAdminMiddleware'), 'case30 superAdmin');
  assert.ok(routes.includes('/activate'), 'case30 activate');
  assert.ok(routes.includes('/suspend'), 'case30 suspend');
  assert.ok(routes.includes('/retire'), 'case30 retire');
  assert.ok(!controller.includes('req.body.actorUserId'), 'case30 no body actorUserId');
  assert.ok(controller.includes('readAuthUserId'), 'case30 actor from auth');

  const unauth = mockRes();
  await getLocalProviders({ query: {} } as Request, unauth.res);
  assert.equal(unauth.statusCode, 401, 'case30 GET unauthenticated');

  const unauthReg = mockRes();
  await postRegisterLocalProvider(
    { body: { businessId: randomUUID() } } as Request,
    unauthReg.res
  );
  assert.equal(unauthReg.statusCode, 401, 'case30 register unauthenticated');

  // --- Case 43 (partial): public DTO / envelope / privacy / client freeze ---
  assert.ok(list.includes('type LocalProviderPublicDto'), 'case43 public dto');
  assert.ok(list.includes('displayName: string'), 'case43 displayName');
  assert.ok(
    !/type LocalProviderPublicDto = Readonly<\{[^}]*status/s.test(list),
    'case43 public dto omits status'
  );
  assert.ok(list.includes('pagination'), 'case43 pagination');
  assert.ok(!list.includes('hasMore'), 'case43 no hasMore');
  assert.equal(LOCAL_PROVIDER_LIST_DEFAULT_LIMIT, 50, 'case43 default limit');
  assert.equal(LOCAL_PROVIDER_LIST_MAX_LIMIT, 100, 'case43 max limit');
  assert.ok(composer.includes('PROVIDER_SELECTION_UNAVAILABLE'), 'case43 client freeze');
  assert.ok(source.includes('PROVIDER_SELECTION_UNAVAILABLE'), 'case43 source freeze');
  assert.ok(!composer.includes('/api/local/providers'), 'case43 no client GET wiring');

  const qOk = validateLocalProviderListQuery({ limit: '50', skip: '0' });
  assert.equal(qOk.ok, true);
  const qBadType = validateLocalProviderListQuery({ serviceType: 'NOT_A_TYPE' });
  assert.equal(qBadType.ok, false, 'case43 invalid serviceType');
  const qBadLimit = validateLocalProviderListQuery({ limit: '0' });
  assert.equal(qBadLimit.ok, false, 'case43 limit min');
  const qBadMax = validateLocalProviderListQuery({ limit: '101' });
  assert.equal(qBadMax.ok, false, 'case43 limit max');
  const qBadSkip = validateLocalProviderListQuery({ skip: '-1' });
  assert.equal(qBadSkip.ok, false, 'case43 skip');

  // --- Cases 31–42 validation / lifecycle / PATCH matrix (pure) ---
  const reg = validateRegisterLocalProviderBody({ businessId: 'b1' });
  assert.equal(reg.ok, true);
  if (reg.ok) {
    assert.deepEqual(reg.supportedServiceTypes, []);
    assert.equal(reg.publicB2cVisible, false);
  }
  assert.equal(
    validateRegisterLocalProviderBody({ businessId: 'b1', status: 'ACTIVE' }).ok,
    false,
    'case31 reject status'
  );
  assert.equal(
    validateRegisterLocalProviderBody({ businessId: 'b1', actorUserId: 'x' }).ok,
    false,
    'case30/31 reject actorUserId'
  );

  const stamps = draftRegistrationTimestamps();
  assert.equal(stamps.activatedAt, null);
  assert.equal(stamps.suspendedAt, null);
  assert.equal(stamps.retiredAt, null);

  const now = new Date('2026-07-22T12:00:00.000Z');
  const d2a = lifecycleTimestampsForTransition({
    from: 'DRAFT',
    to: 'ACTIVE',
    current: stamps,
    now,
  });
  assert.deepEqual(d2a, { activatedAt: now, suspendedAt: null, retiredAt: null });

  const a2s = lifecycleTimestampsForTransition({
    from: 'ACTIVE',
    to: 'SUSPENDED',
    current: { activatedAt: now, suspendedAt: null, retiredAt: null },
    now: new Date('2026-07-22T13:00:00.000Z'),
  });
  assert.equal(a2s?.activatedAt?.toISOString(), now.toISOString());
  assert.ok(a2s?.suspendedAt);
  assert.equal(a2s?.retiredAt, null);

  const s2a = lifecycleTimestampsForTransition({
    from: 'SUSPENDED',
    to: 'ACTIVE',
    current: {
      activatedAt: now,
      suspendedAt: new Date('2026-07-22T13:00:00.000Z'),
      retiredAt: null,
    },
    now: new Date('2026-07-22T14:00:00.000Z'),
  });
  assert.equal(s2a?.suspendedAt, null);
  assert.ok(s2a?.activatedAt);

  assert.equal(
    lifecycleTimestampsForTransition({
      from: 'RETIRED',
      to: 'ACTIVE',
      current: { activatedAt: now, suspendedAt: null, retiredAt: now },
      now,
    }),
    null,
    'case42 RETIRED→ACTIVE forbidden'
  );
  assert.equal(
    lifecycleTimestampsForTransition({
      from: 'DRAFT',
      to: 'SUSPENDED',
      current: stamps,
      now,
    }),
    null,
    'case42 DRAFT→SUSPENDED forbidden'
  );
  assert.equal(
    lifecycleTimestampsForTransition({
      from: 'ACTIVE',
      to: 'DRAFT',
      current: { activatedAt: now, suspendedAt: null, retiredAt: null },
      now,
    }),
    null,
    'case42 ACTIVE→DRAFT forbidden'
  );

  assert.equal(
    validatePatchLocalProviderBody({ publicB2cVisible: false }).ok,
    true,
    'case33 patch allows visibility field'
  );
  assert.equal(
    validatePatchLocalProviderBody({ status: 'ACTIVE' }).ok,
    false,
    'case33 reject status'
  );
  assert.equal(validatePatchLocalProviderBody({}).ok, false, 'case33 require field');
  assert.equal(sameServiceTypeLists([LocalServiceType.GENERIC_REQUEST], [LocalServiceType.GENERIC_REQUEST]), true);
  assert.equal(
    sameServiceTypeLists(
      [LocalServiceType.GENERIC_REQUEST, LocalServiceType.FIXER_HIRE],
      [LocalServiceType.FIXER_HIRE, LocalServiceType.GENERIC_REQUEST]
    ),
    true,
    'case34 order-insensitive equality'
  );

  assert.equal(validateTransitionReasonBody({ reason: 'x'.repeat(281) }).ok, false, 'case39 reason bound');
  assert.equal(validateTransitionReasonBody({ reason: 'temp hold' }).ok, true);

  // Audit write is create-only; append-only gate
  assert.ok(auditWrite.includes('.create('), 'case43 audit create');
  assert.ok(!/\.(update|updateMany|delete|deleteMany)\s*\(/.test(auditWrite), 'case43 audit no mutate');
  assert.ok(ops.includes('$transaction'), 'case43 mutation txn');
  assert.ok(ops.includes('createLocalProviderEligibilityAuditEvent'), 'case43 audit in ops');
  assert.ok(!ops.includes('localProviderEligibility.delete'), 'case43 no physical delete');
  assert.ok(!ops.includes('localProviderEligibilityAuditEvent.update'), 'case43 no audit update');

  const forbidden = findForbiddenLocalProviderEligibilityAuditMutations(ROOT);
  assert.deepEqual(forbidden, [], `case43 append-only: ${forbidden.join(', ')}`);

  // Restrict graph preserved in schema
  const schema = read('prisma/schema.prisma');
  assert.ok(schema.includes('onDelete: Restrict'), 'case43 Restrict present');
  assert.ok(schema.includes('model LocalProviderEligibilityAuditEvent'), 'case43 audit model');
}

async function runDbCasesIfApplied(): Promise<'applied' | 'skipped'> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.log('[a2] SKIP DB cases: DATABASE_URL unset');
    return 'skipped';
  }

  const prisma = getPrisma();
  if (!(await localProviderEligibilityTableExists(prisma))) {
    console.log(
      '[a2] SKIP DB mutation cases: LocalProviderEligibility unapplied (NO_MIGRATION_APPLY / no staging rows)'
    );
    return 'skipped';
  }

  const adminId = randomUUID();
  const b2cId = randomUUID();
  const ownerId = randomUUID();
  const businessIds: string[] = [];
  const eligibilityIds: string[] = [];

  try {
    await prisma.user.createMany({
      data: [
        { id: adminId, phoneNumber: uniquePhone(), role: Role.ADMIN, pinCode: 'x' },
        { id: b2cId, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
        { id: ownerId, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      ],
    });

    const biz = await prisma.business.create({
      data: {
        ownerId,
        name: `A2 Ops Biz ${randomUUID().slice(0, 8)}`,
        category: BizType.LOCAL_EXPERIENCE,
        locationLat: 1,
        locationLng: 1,
      },
    });
    businessIds.push(biz.id);

    // Case 30: non-admin forbidden at service layer
    const forbidden = await registerLocalProviderEligibility({
      actorUserId: b2cId,
      businessId: biz.id,
      supportedServiceTypes: [],
      publicB2cVisible: false,
    });
    assert.equal(forbidden.ok, false);
    if (!forbidden.ok) assert.equal(forbidden.reason, 'forbidden');

    // Case 31: first registration
    const first = await registerLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
      supportedServiceTypes: [],
      publicB2cVisible: false,
    });
    assert.equal(first.ok, true);
    if (!first.ok) throw new Error('register failed');
    assert.equal(first.created, true);
    assert.equal(first.provider.status, LocalProviderEligibilityStatus.DRAFT);
    assert.equal(first.provider.publicB2cVisible, false);
    assert.deepEqual(first.provider.supportedServiceTypes, []);
    assert.equal(first.provider.activatedAt, null);
    assert.equal(first.provider.suspendedAt, null);
    assert.equal(first.provider.retiredAt, null);

    const elig = await prisma.localProviderEligibility.findUniqueOrThrow({
      where: { businessId: biz.id },
    });
    eligibilityIds.push(elig.id);
    const auditsAfterReg = await prisma.localProviderEligibilityAuditEvent.findMany({
      where: { eligibilityId: elig.id },
    });
    assert.equal(auditsAfterReg.length, 1);
    assert.equal(auditsAfterReg[0]?.eventType, LocalProviderEligibilityAuditEventType.REGISTERED);
    assert.equal(auditsAfterReg[0]?.priorStatus, null);
    assert.equal(auditsAfterReg[0]?.priorPublicB2cVisible, null);
    assert.deepEqual(auditsAfterReg[0]?.priorSupportedServiceTypes, []);
    assert.equal(auditsAfterReg[0]?.actorUserId, adminId);

    const updatedAt1 = elig.updatedAt;

    // Case 32: repeated registration
    const second = await registerLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      publicB2cVisible: true,
    });
    assert.equal(second.ok, true);
    if (!second.ok) throw new Error('repeat register failed');
    assert.equal(second.created, false);
    assert.equal(second.provider.publicB2cVisible, false);
    assert.deepEqual(second.provider.supportedServiceTypes, []);
    const elig2 = await prisma.localProviderEligibility.findUniqueOrThrow({
      where: { businessId: biz.id },
    });
    assert.equal(elig2.updatedAt.getTime(), updatedAt1.getTime());
    assert.equal(
      await prisma.localProviderEligibilityAuditEvent.count({ where: { eligibilityId: elig.id } }),
      1
    );

    // Case 33/34 DRAFT patch change + no-change
    const patch1 = await patchLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      publicB2cVisible: true,
    });
    assert.equal(patch1.ok, true);
    if (!patch1.ok) throw new Error('patch1 failed');
    const elig3 = await prisma.localProviderEligibility.findUniqueOrThrow({
      where: { businessId: biz.id },
    });
    assert.ok(elig3.updatedAt.getTime() > updatedAt1.getTime());
    assert.equal(elig3.activatedAt, null);
    assert.equal(
      await prisma.localProviderEligibilityAuditEvent.count({
        where: {
          eligibilityId: elig.id,
          eventType: LocalProviderEligibilityAuditEventType.CONFIG_UPDATED,
        },
      }),
      1
    );
    const updatedAtAfterPatch = elig3.updatedAt;

    const patchNoChange = await patchLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      publicB2cVisible: true,
    });
    assert.equal(patchNoChange.ok, true);
    const elig4 = await prisma.localProviderEligibility.findUniqueOrThrow({
      where: { businessId: biz.id },
    });
    assert.equal(elig4.updatedAt.getTime(), updatedAtAfterPatch.getTime());
    assert.equal(
      await prisma.localProviderEligibilityAuditEvent.count({
        where: {
          eligibilityId: elig.id,
          eventType: LocalProviderEligibilityAuditEventType.CONFIG_UPDATED,
        },
      }),
      1
    );

    // Case 37 DRAFT → ACTIVE
    const act = await activateLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
    });
    assert.equal(act.ok, true);
    if (!act.ok) throw new Error('activate failed');
    assert.equal(act.provider.status, LocalProviderEligibilityStatus.ACTIVE);
    assert.ok(act.provider.activatedAt);
    assert.equal(act.provider.suspendedAt, null);
    assert.equal(act.provider.retiredAt, null);

    // Case 35/36 ACTIVE invariant PATCH
    const priv = await patchLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
      publicB2cVisible: false,
    });
    assert.equal(priv.ok, false);
    if (!priv.ok) assert.equal(priv.reason, 'conflict');

    const emptyTypes = await patchLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
      supportedServiceTypes: [],
    });
    assert.equal(emptyTypes.ok, false);
    if (!emptyTypes.ok) assert.equal(emptyTypes.reason, 'conflict');

    // Case 39 ACTIVE → SUSPENDED
    const sus = await suspendLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
      reason: 'ops hold',
    });
    assert.equal(sus.ok, true);
    if (!sus.ok) throw new Error('suspend failed');
    assert.equal(sus.provider.status, LocalProviderEligibilityStatus.SUSPENDED);
    assert.ok(sus.provider.suspendedAt);
    const activatedAtAfterSuspend = sus.provider.activatedAt;
    const suspendedAtValue = sus.provider.suspendedAt;

    // Case 41 SUSPENDED → RETIRED (retain suspendedAt)
    const retFromSuspended = await retireLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
      reason: null,
    });
    assert.equal(retFromSuspended.ok, true);
    if (!retFromSuspended.ok) throw new Error('retire from suspended failed');
    assert.equal(retFromSuspended.provider.status, LocalProviderEligibilityStatus.RETIRED);
    assert.equal(retFromSuspended.provider.activatedAt, activatedAtAfterSuspend);
    assert.equal(retFromSuspended.provider.suspendedAt, suspendedAtValue);
    assert.ok(retFromSuspended.provider.retiredAt);

    // Case 42 RETIRED PATCH + reactivate
    const retiredPatch = await patchLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
      publicB2cVisible: true,
    });
    assert.equal(retiredPatch.ok, false);
    if (!retiredPatch.ok) assert.equal(retiredPatch.reason, 'conflict');

    const retiredAct = await activateLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz.id,
    });
    assert.equal(retiredAct.ok, false);
    if (!retiredAct.ok) assert.equal(retiredAct.reason, 'conflict');

    // Case 41 SUSPENDED → ACTIVE on a dedicated business
    const bizRe = await prisma.business.create({
      data: {
        ownerId,
        name: `A2 Reactivate ${randomUUID().slice(0, 8)}`,
        category: BizType.LOCAL_EXPERIENCE,
        locationLat: 1,
        locationLng: 1,
      },
    });
    businessIds.push(bizRe.id);
    await registerLocalProviderEligibility({
      actorUserId: adminId,
      businessId: bizRe.id,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      publicB2cVisible: true,
    });
    await activateLocalProviderEligibility({ actorUserId: adminId, businessId: bizRe.id });
    const beforeSus = await suspendLocalProviderEligibility({
      actorUserId: adminId,
      businessId: bizRe.id,
      reason: null,
    });
    assert.equal(beforeSus.ok, true);
    if (!beforeSus.ok) throw new Error('suspend for reactivate failed');
    const priorActivation = beforeSus.provider.activatedAt;
    const react = await activateLocalProviderEligibility({
      actorUserId: adminId,
      businessId: bizRe.id,
    });
    assert.equal(react.ok, true);
    if (!react.ok) throw new Error('reactivate failed');
    assert.equal(react.provider.suspendedAt, null);
    assert.ok(react.provider.activatedAt);
    assert.notEqual(react.provider.activatedAt, priorActivation);
    const eligRe = await prisma.localProviderEligibility.findUniqueOrThrow({
      where: { businessId: bizRe.id },
    });
    eligibilityIds.push(eligRe.id);

    // Case 40 ACTIVE → RETIRED
    const ret = await retireLocalProviderEligibility({
      actorUserId: adminId,
      businessId: bizRe.id,
      reason: null,
    });
    assert.equal(ret.ok, true);
    if (!ret.ok) throw new Error('retire active failed');
    assert.equal(ret.provider.status, LocalProviderEligibilityStatus.RETIRED);
    assert.ok(ret.provider.retiredAt);
    assert.equal(ret.provider.suspendedAt, null);

    // Case 38 on a second business: DRAFT → RETIRED
    const biz2 = await prisma.business.create({
      data: {
        ownerId,
        name: `A2 Retire Draft ${randomUUID().slice(0, 8)}`,
        category: BizType.LOCAL_EXPERIENCE,
        locationLat: 1,
        locationLng: 1,
      },
    });
    businessIds.push(biz2.id);
    const reg2 = await registerLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz2.id,
      supportedServiceTypes: [],
      publicB2cVisible: false,
    });
    assert.equal(reg2.ok, true);
    const eligB2 = await prisma.localProviderEligibility.findUniqueOrThrow({
      where: { businessId: biz2.id },
    });
    eligibilityIds.push(eligB2.id);
    const draftRetire = await retireLocalProviderEligibility({
      actorUserId: adminId,
      businessId: biz2.id,
      reason: null,
    });
    assert.equal(draftRetire.ok, true);
    if (!draftRetire.ok) throw new Error('draft retire failed');
    assert.equal(draftRetire.provider.activatedAt, null);
    assert.equal(draftRetire.provider.suspendedAt, null);
    assert.ok(draftRetire.provider.retiredAt);

    // Case 43: GET list only selectable — retired not returned
    const selectableBiz = await prisma.business.create({
      data: {
        ownerId,
        name: `A2 Selectable ${randomUUID().slice(0, 8)}`,
        category: BizType.LOCAL_EXPERIENCE,
        locationLat: 1,
        locationLng: 1,
      },
    });
    businessIds.push(selectableBiz.id);
    await registerLocalProviderEligibility({
      actorUserId: adminId,
      businessId: selectableBiz.id,
      supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST],
      publicB2cVisible: true,
    });
    await activateLocalProviderEligibility({
      actorUserId: adminId,
      businessId: selectableBiz.id,
    });
    const eligSel = await prisma.localProviderEligibility.findUniqueOrThrow({
      where: { businessId: selectableBiz.id },
    });
    eligibilityIds.push(eligSel.id);

    const listRes = mockRes();
    await getLocalProviders(
      { authUserId: b2cId, query: { limit: '50', skip: '0' } } as unknown as Request,
      listRes.res
    );
    assert.equal(listRes.statusCode, 200);
    const listBody = listRes.body as {
      success: boolean;
      data: { items: Array<{ businessId: string }>; pagination: { returned: number } };
    };
    assert.equal(listBody.success, true);
    assert.ok(listBody.data.items.some((i) => i.businessId === selectableBiz.id));
    assert.ok(!listBody.data.items.some((i) => i.businessId === biz.id));

    // Controller register 201 path
    const biz3 = await prisma.business.create({
      data: {
        ownerId,
        name: `A2 Ctrl ${randomUUID().slice(0, 8)}`,
        category: BizType.LOCAL_EXPERIENCE,
        locationLat: 1,
        locationLng: 1,
      },
    });
    businessIds.push(biz3.id);
    const ctrlReg = mockRes();
    await postRegisterLocalProvider(
      {
        authUserId: adminId,
        body: { businessId: biz3.id },
      } as unknown as Request,
      ctrlReg.res
    );
    assert.equal(ctrlReg.statusCode, 201);
    const elig3c = await prisma.localProviderEligibility.findUniqueOrThrow({
      where: { businessId: biz3.id },
    });
    eligibilityIds.push(elig3c.id);

    console.log('[a2] DB integration cases 30–43 executed');
    return 'applied';
  } finally {
    if (eligibilityIds.length > 0) {
      await prisma.localProviderEligibilityAuditEvent.deleteMany({
        where: { eligibilityId: { in: eligibilityIds } },
      });
      // Audit Restrict blocks eligibility delete while events exist — deleted above.
      await prisma.localProviderEligibility.deleteMany({
        where: { id: { in: eligibilityIds } },
      });
    }
    for (const id of businessIds) {
      await deleteLocalProviderEligibilityIfPresent(prisma, id);
      await prisma.business.delete({ where: { id } }).catch(() => undefined);
    }
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, b2cId, ownerId] } },
    });
    await disconnectPrisma();
  }
}

async function run(): Promise<void> {
  await runSourceAndValidationCases();
  const db = await runDbCasesIfApplied();
  console.log(
    `[test-local-provider-eligibility-read-ops-control] OK cases 30–43 (db=${db})`
  );
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
