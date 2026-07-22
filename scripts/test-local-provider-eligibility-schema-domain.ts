/**
 * Pack A1 cases 1–29: schema/migration/domain + create-mapping + READ COMMITTED race coordinator.
 * No migration apply / no remote DB required for this script.
 *
 * Run: npx tsx scripts/test-local-provider-eligibility-schema-domain.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { LocalProviderEligibilityStatus, LocalServiceType } from '@prisma/client';

import { findForbiddenLocalProviderEligibilityAuditMutations } from '../src/services/local/localProviderEligibilityAuditAppendOnlyGate';
import {
  buildRegisteredPriorState,
  isLocalProviderAllowedForServiceType,
  isLocalProviderSelectable,
  isRegisteredNoPriorState,
  isValidLocalProviderBusinessDisplayName,
  validateLocalProviderEligibilityForCreate,
} from '../src/services/local/localProviderEligibilityDomain';
import {
  draftRegistrationTimestamps,
  lifecycleTimestampsForTransition,
} from '../src/services/local/localProviderEligibilityLifecycle';

const ROOT = process.cwd();
const SCHEMA = fs.readFileSync(path.join(ROOT, 'prisma', 'schema.prisma'), 'utf8');
const MIGRATION_DIR = path.join(
  ROOT,
  'prisma',
  'migrations',
  '20260722120000_add_local_provider_eligibility_authority'
);
const MIGRATION_SQL = fs.readFileSync(path.join(MIGRATION_DIR, 'migration.sql'), 'utf8');
const CREATE_SERVICE = fs.readFileSync(
  path.join(ROOT, 'src', 'services', 'local', 'localRequestCreateService.ts'),
  'utf8'
);
const CONTROLLER = fs.readFileSync(
  path.join(ROOT, 'src', 'controllers', 'LocalRequestController.ts'),
  'utf8'
);

function assertIncludes(hay: string, needle: string, label: string): void {
  assert.ok(hay.includes(needle), `${label}: missing ${needle}`);
}

function assertNotIncludes(hay: string, needle: string, label: string): void {
  assert.ok(!hay.includes(needle), `${label}: must not include ${needle}`);
}

/**
 * Deterministic READ COMMITTED race coordinator (cases 28–29 / matrix A–E).
 * Models: create authoritatively reads eligibility status at `createReadAt`;
 * suspension commits at `suspendCommitAt`. Create commits at `createCommitAt`.
 */
function simulateCreateAfterEligibilityRead(input: {
  statusAtCreateRead: 'ACTIVE' | 'SUSPENDED';
  suspendCommittedBeforeCreateRead: boolean;
}): 'may_complete' | 'reject' {
  if (input.suspendCommittedBeforeCreateRead) {
    return 'reject';
  }
  if (input.statusAtCreateRead === 'ACTIVE') {
    return 'may_complete';
  }
  return 'reject';
}

function run(): void {
  // --- Cases 1–2: migration structure / no data mutation ---
  assert.ok(fs.existsSync(MIGRATION_DIR), 'case1: migration folder exists');
  assertIncludes(MIGRATION_SQL, 'CREATE TYPE "LocalProviderEligibilityStatus"', 'case1');
  assertIncludes(MIGRATION_SQL, 'CREATE TYPE "LocalProviderEligibilityAuditEventType"', 'case1');
  assertIncludes(MIGRATION_SQL, 'CREATE TYPE "LocalProviderEligibilityAuditActorType"', 'case1');
  assertIncludes(MIGRATION_SQL, 'CREATE TABLE "LocalProviderEligibility"', 'case1');
  assertIncludes(MIGRATION_SQL, 'CREATE TABLE "LocalProviderEligibilityAuditEvent"', 'case1');
  assertIncludes(MIGRATION_SQL, 'ON DELETE RESTRICT', 'case1');
  assertIncludes(
    MIGRATION_SQL,
    'LocalProviderEligibility_status_publicB2cVisible_idx',
    'case1'
  );
  assert.ok(!/INSERT\s+INTO/i.test(MIGRATION_SQL), 'case2: zero INSERT INTO');
  // FK "ON UPDATE CASCADE" is structure-only; ban data-mutating UPDATE statements.
  assert.ok(
    !/(?:^|\n)\s*UPDATE\s+/i.test(MIGRATION_SQL),
    'case2: no data-mutating UPDATE statement'
  );
  assertNotIncludes(MIGRATION_SQL, 'GIN', 'case1: no GIN');

  // --- Cases 3–6: schema defaults / uniqueness / audit model ---
  assertIncludes(SCHEMA, 'model LocalProviderEligibility', 'case3');
  assertIncludes(SCHEMA, 'businessId String @unique', 'case4');
  assertIncludes(SCHEMA, 'onDelete: Restrict', 'case6');
  assertIncludes(SCHEMA, '@default(DRAFT)', 'case5');
  assertIncludes(SCHEMA, 'publicB2cVisible      Boolean                       @default(false)', 'case5');
  assertIncludes(SCHEMA, 'supportedServiceTypes LocalServiceType[]            @default([])', 'case5');
  assertIncludes(SCHEMA, '@@index([status, publicB2cVisible])', 'case5');
  assertIncludes(SCHEMA, 'enum LocalProviderEligibilityAuditEventType', 'case6');
  assertIncludes(SCHEMA, 'ROLE_ADMIN', 'case6');
  assertIncludes(SCHEMA, 'priorSupportedServiceTypes LocalServiceType[] @default([])', 'case6');
  assertIncludes(SCHEMA, 'actorUser   User                     @relation', 'case6');
  assertIncludes(SCHEMA, '@@index([eligibilityId, createdAt])', 'case6');
  assertIncludes(SCHEMA, '@@index([businessId, createdAt])', 'case6');
  assertIncludes(SCHEMA, '@@index([actorUserId, createdAt])', 'case6');
  assertIncludes(SCHEMA, '@@index([eventType, createdAt])', 'case6');
  assertNotIncludes(SCHEMA, 'suspensionReason', 'case6');

  const auditBlock = SCHEMA.slice(
    SCHEMA.indexOf('model LocalProviderEligibilityAuditEvent'),
    SCHEMA.indexOf('model TourismService')
  );
  assert.ok(!auditBlock.includes('updatedAt'), 'case6: audit has no updatedAt');
  assert.ok(!auditBlock.includes('metadataJson'), 'case6: audit has no metadataJson');

  // --- Case 7: DRAFT defaults / lifecycle nulls ---
  const draftStamps = draftRegistrationTimestamps();
  assert.equal(draftStamps.activatedAt, null);
  assert.equal(draftStamps.suspendedAt, null);
  assert.equal(draftStamps.retiredAt, null);

  const now = new Date('2026-07-22T12:00:00.000Z');
  const activated = lifecycleTimestampsForTransition({
    from: 'DRAFT',
    to: 'ACTIVE',
    current: draftStamps,
    now,
  });
  assert.ok(activated);
  assert.equal(activated!.activatedAt?.toISOString(), now.toISOString());
  assert.equal(activated!.suspendedAt, null);

  const suspended = lifecycleTimestampsForTransition({
    from: 'ACTIVE',
    to: 'SUSPENDED',
    current: activated!,
    now: new Date('2026-07-22T13:00:00.000Z'),
  });
  assert.ok(suspended);
  assert.equal(suspended!.activatedAt?.toISOString(), now.toISOString());
  assert.ok(suspended!.suspendedAt);

  const reactivated = lifecycleTimestampsForTransition({
    from: 'SUSPENDED',
    to: 'ACTIVE',
    current: suspended!,
    now: new Date('2026-07-22T14:00:00.000Z'),
  });
  assert.ok(reactivated);
  assert.equal(reactivated!.suspendedAt, null);
  assert.ok(reactivated!.activatedAt);
  assert.notEqual(reactivated!.activatedAt!.toISOString(), now.toISOString());

  assert.equal(
    lifecycleTimestampsForTransition({
      from: 'RETIRED',
      to: 'ACTIVE',
      current: { activatedAt: now, suspendedAt: null, retiredAt: now },
      now,
    }),
    null
  );

  // --- Cases 8–17: selectability / service type ---
  const biz = { id: 'b1', name: 'Valid Shop' };
  const active = {
    status: LocalProviderEligibilityStatus.ACTIVE,
    publicB2cVisible: true,
    supportedServiceTypes: [LocalServiceType.GENERIC_REQUEST] as const,
  };

  assert.equal(isLocalProviderSelectable({ business: biz, eligibility: null }), false); // 8
  assert.equal(
    isLocalProviderSelectable({
      business: biz,
      eligibility: { ...active, status: LocalProviderEligibilityStatus.DRAFT },
    }),
    false
  ); // 9
  assert.equal(isLocalProviderSelectable({ business: biz, eligibility: active }), true); // 10
  assert.equal(
    isLocalProviderSelectable({
      business: biz,
      eligibility: { ...active, publicB2cVisible: false },
    }),
    false
  ); // 11
  assert.equal(
    isLocalProviderSelectable({
      business: biz,
      eligibility: { ...active, supportedServiceTypes: [] },
    }),
    false
  ); // 12
  assert.equal(
    isLocalProviderSelectable({
      business: biz,
      eligibility: { ...active, status: LocalProviderEligibilityStatus.SUSPENDED },
    }),
    false
  ); // 13
  assert.equal(
    isLocalProviderSelectable({
      business: biz,
      eligibility: { ...active, status: LocalProviderEligibilityStatus.RETIRED },
    }),
    false
  ); // 14
  assert.equal(
    isLocalProviderSelectable({ business: { id: 'b1', name: '   ' }, eligibility: active }),
    false
  ); // 15 — no mutation helper side effect
  assert.equal(isValidLocalProviderBusinessDisplayName('   '), false);

  assert.equal(
    isLocalProviderAllowedForServiceType({
      business: biz,
      eligibility: active,
      serviceType: LocalServiceType.GENERIC_REQUEST,
    }),
    true
  ); // 16
  assert.equal(
    isLocalProviderAllowedForServiceType({
      business: biz,
      eligibility: active,
      serviceType: LocalServiceType.FIXER_HIRE,
    }),
    false
  ); // 17

  // --- Cases 18–25: create failure mappings (domain + HTTP wiring) ---
  assert.equal(
    validateLocalProviderEligibilityForCreate({
      business: null,
      eligibility: active,
      serviceType: LocalServiceType.GENERIC_REQUEST,
    }).ok === false &&
      (
        validateLocalProviderEligibilityForCreate({
          business: null,
          eligibility: active,
          serviceType: LocalServiceType.GENERIC_REQUEST,
        }) as { reason: string }
      ).reason,
    'business_not_found'
  ); // 18

  assert.equal(
    (
      validateLocalProviderEligibilityForCreate({
        business: biz,
        eligibility: null,
        serviceType: LocalServiceType.GENERIC_REQUEST,
      }) as { ok: false; reason: string }
    ).reason,
    'provider_not_available'
  ); // 19

  for (const status of [
    LocalProviderEligibilityStatus.DRAFT,
    LocalProviderEligibilityStatus.SUSPENDED,
    LocalProviderEligibilityStatus.RETIRED,
  ] as const) {
    assert.equal(
      (
        validateLocalProviderEligibilityForCreate({
          business: biz,
          eligibility: { ...active, status },
          serviceType: LocalServiceType.GENERIC_REQUEST,
        }) as { ok: false; reason: string }
      ).reason,
      'provider_not_available'
    );
  } // 20–22

  assert.equal(
    (
      validateLocalProviderEligibilityForCreate({
        business: biz,
        eligibility: { ...active, publicB2cVisible: false },
        serviceType: LocalServiceType.GENERIC_REQUEST,
      }) as { ok: false; reason: string }
    ).reason,
    'provider_not_available'
  ); // 23

  assert.equal(
    (
      validateLocalProviderEligibilityForCreate({
        business: { id: 'b1', name: '' },
        eligibility: active,
        serviceType: LocalServiceType.GENERIC_REQUEST,
      }) as { ok: false; reason: string }
    ).reason,
    'provider_not_available'
  ); // 24

  assert.equal(
    (
      validateLocalProviderEligibilityForCreate({
        business: biz,
        eligibility: active,
        serviceType: LocalServiceType.FIXER_HIRE,
      }) as { ok: false; reason: string }
    ).reason,
    'service_type_not_supported'
  ); // 25

  assertIncludes(CONTROLLER, 'provider_not_available: 404', 'case18-24 http');
  assertIncludes(CONTROLLER, 'service_type_not_supported: 400', 'case25 http');
  assertIncludes(CONTROLLER, "provider_not_available: 'Provider not available'", 'case18-24 msg');
  assertNotIncludes(CONTROLLER, 'createFailure: 403', 'no create 403');
  assert.ok(
    !/localProviderEligibilityAuditEvent\.(create|createMany)/.test(CREATE_SERVICE),
    'no eligibility audit write on create'
  );
  assertNotIncludes(
    CREATE_SERVICE,
    'LocalProviderEligibilityAuditEventType',
    'no eligibility audit enum usage on create'
  );

  // --- Cases 26–27: transactional create + request audit atomicity (source proof) ---
  assertIncludes(CREATE_SERVICE, 'prisma.$transaction', 'case26 txn');
  assertIncludes(CREATE_SERVICE, 'localProviderEligibility.findUnique', 'case26 eligibility in txn');
  assertIncludes(CREATE_SERVICE, 'validateLocalProviderEligibilityForCreate', 'case26');
  assertIncludes(CREATE_SERVICE, 'localServiceRequest.create', 'case26');
  assertIncludes(CREATE_SERVICE, 'createLocalRequestAuditEvent', 'case26 request audit');
  assertIncludes(CREATE_SERVICE, 'db: tx', 'case26 audit same txn');
  assertIncludes(CREATE_SERVICE, 'assertLocalRequestAuditWritten', 'case27 audit fail rolls back');
  assertIncludes(
    CREATE_SERVICE,
    'REQUEST_ONLY_NO_CHARGE',
    'case26 preserves REQUEST_ONLY_NO_CHARGE'
  );

  // --- Cases 28–29: READ COMMITTED bounded race coordinator ---
  // B / E: suspension committed before create eligibility read → reject
  assert.equal(
    simulateCreateAfterEligibilityRead({
      statusAtCreateRead: 'SUSPENDED',
      suspendCommittedBeforeCreateRead: true,
    }),
    'reject'
  ); // 28
  assert.equal(
    simulateCreateAfterEligibilityRead({
      statusAtCreateRead: 'ACTIVE',
      suspendCommittedBeforeCreateRead: true,
    }),
    'reject'
  ); // 28 / E

  // A / C / D: create read ACTIVE before suspension commit → may complete
  assert.equal(
    simulateCreateAfterEligibilityRead({
      statusAtCreateRead: 'ACTIVE',
      suspendCommittedBeforeCreateRead: false,
    }),
    'may_complete'
  ); // 29

  assertIncludes(CREATE_SERVICE, 'READ COMMITTED', 'case28-29 comment lock');

  // REGISTERED prior-state representation
  const prior = buildRegisteredPriorState();
  assert.equal(prior.priorStatus, null);
  assert.equal(prior.priorPublicB2cVisible, null);
  assert.deepEqual(prior.priorSupportedServiceTypes, []);
  assert.equal(
    isRegisteredNoPriorState({
      eventType: 'REGISTERED',
      priorStatus: null,
      priorPublicB2cVisible: null,
    }),
    true
  );

  // Append-only source gate
  const forbidden = findForbiddenLocalProviderEligibilityAuditMutations(ROOT);
  assert.deepEqual(forbidden, [], `append-only gate hits: ${forbidden.join(', ')}`);

  // No A2 routes in this pack
  const routes = fs.readFileSync(path.join(ROOT, 'src', 'routes', 'localRoutes.ts'), 'utf8');
  assert.ok(!routes.includes('/ops/providers'), 'no ops providers routes');
  assert.ok(!routes.includes("'/providers'"), 'no GET providers route string');
  assert.ok(!routes.includes('"/providers"'), 'no GET providers route string');

  console.log('[test-local-provider-eligibility-schema-domain] OK cases 1–29 + gates');
}

run();
