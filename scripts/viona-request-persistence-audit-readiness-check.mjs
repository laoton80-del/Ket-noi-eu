#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const PACK13C_CORE_FILES = [
  'prisma/schema.prisma',
  'docs/product/VIONA_REQUEST_PACK13C_PRISMA_SCHEMA_IMPLEMENTATION_SCHEMA_ONLY.md',
  'src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts',
  'scripts/viona-request-pack13c-prisma-schema-implementation-check.mjs',
  'docs/design/evidence/cursor-request-pack13c-prisma-schema-implementation-schema-only/README.md',
];

const POST_PACK13C_POINTER_TOKENS = [
  'pack13Started: true',
  'pack13SchemaOnlyImplementation: true',
  'prismaSchemaActive: true',
  'vionaRequestPrismaModelsAdded: true',
];

function isPack13cSchemaOnlyActive() {
  const configPath = 'src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts';
  if (!existsSync(path.join(ROOT, configPath))) return false;
  return read(configPath).includes('pack13SchemaOnlyImplementation: true');
}

function augmentPointerTokensForPack13c(tokens, pack13cActive) {
  if (!pack13cActive) return tokens;
  const filtered = tokens.filter(
    (token) => token !== 'prismaSchemaActive: false' && token !== 'pack13Started: false'
  );
  return [...filtered, ...POST_PACK13C_POINTER_TOKENS];
}

function augmentConfigTokensForPack13c(tokens, pack13cActive) {
  if (!pack13cActive) return tokens;
  const filtered = tokens.filter(
    (token) => token !== 'prismaSchemaActive: false' && token !== 'pack13Started: false'
  );
  const additions = [];
  if (tokens.includes('prismaSchemaActive: false')) additions.push('prismaSchemaActive: true');
  if (tokens.includes('pack13Started: false')) additions.push('pack13Started: true');
  if (tokens.includes('pack13SchemaOnlyImplementation: true') || tokens.includes('vionaRequestPrismaModelsAdded: true')) {
    additions.push('pack13SchemaOnlyImplementation: true', 'vionaRequestPrismaModelsAdded: true');
  }
  return [...filtered, ...additions];
}

function matchesForbiddenDiff(file, pack13cActive) {
  if (pack13cActive && file === 'prisma/schema.prisma') return false;
  return FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file));
}

function isPrismaDiffBlocked(pack13cActive, prismaChanged) {
  if (!prismaChanged) return false;
  if (!pack13cActive) return true;
  const files = prismaChanged.split('\n').map((line) => line.replace(/\\/g, '/')).filter(Boolean);
  return files.some((file) => file !== 'prisma/schema.prisma');
}


const ALLOWED_FILES = [
  ...PACK13C_CORE_FILES,
  'docs/product/VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS.md',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/domain/requests/vionaRequestAuditEventTypes.ts',
  'src/domain/requests/vionaRequestPersistenceContract.ts',
  'scripts/viona-request-persistence-audit-readiness-check.mjs',
  'docs/design/evidence/cursor-request-persistence-audit-readiness-pack7/README.md',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
  'scripts/viona-operator-inbox-admin-debug-preview-check.mjs',
  'scripts/viona-operator-inbox-admin-route-readiness-check.mjs',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
  'docs/product/VIONA_REQUEST_SOURCE_OF_TRUTH_AUTH_TENANT_MAPPING.md',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/domain/requests/vionaRequestSourceOfTruthMappingContract.ts',
  'src/domain/requests/vionaRequestRoleTenantAccessMatrix.ts',
  'scripts/viona-request-source-of-truth-auth-tenant-mapping-check.mjs',
  'docs/design/evidence/cursor-request-source-of-truth-auth-tenant-pack8/README.md',
  'docs/product/VIONA_REQUEST_SOT_SIGNOFF_PHASE_PROMOTION_READINESS.md',
  'src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts',
  'src/domain/requests/vionaRequestPhasePromotionContract.ts',
  'src/domain/requests/vionaRequestDedicatedStoreFieldManifest.ts',
  'scripts/viona-request-sot-signoff-phase-promotion-readiness-check.mjs',
  'docs/design/evidence/cursor-request-sot-signoff-phase-promotion-pack9/README.md',
  'docs/product/VIONA_REQUEST_SOT_FOUNDER_ARCHITECT_SIGNOFF_PACKET.md',
  'src/config/vionaRequestSotFounderArchitectSignoffPacketReadiness.ts',
  'scripts/viona-request-sot-founder-architect-signoff-packet-check.mjs',
  'docs/design/evidence/cursor-request-sot-signoff-packet-pack10/README.md',
  'docs/product/VIONA_REQUEST_SOT_HUMAN_SIGNOFF_TEMPLATE.md',
  'docs/design/evidence/cursor-request-sot-signoff-template-pack10b/README.md',
  'docs/product/VIONA_REQUEST_SOT_HUMAN_APPROVAL_RECORD.md',
  'src/config/vionaRequestSotHumanApprovalReadiness.ts',
  'scripts/viona-request-sot-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-sot-human-approval-pack10c/README.md',
  'docs/product/VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT.md',
  'src/domain/requests/vionaRequestDedicatedStoreSchemaDesignContract.ts',
  'src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts',
  'scripts/viona-request-dedicated-store-schema-design-contract-check.mjs',
  'docs/design/evidence/cursor-request-dedicated-store-schema-design-pack11/README.md',
  'docs/product/VIONA_REQUEST_SCHEMA_DESIGN_HUMAN_APPROVAL_RECORD.md',
  'src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts',
  'scripts/viona-request-schema-design-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-schema-design-human-approval-pack11b/README.md',
  'docs/product/VIONA_REQUEST_PACK12_PRISMA_SCHEMA_READINESS_BOUNDARY.md',
  'src/domain/requests/vionaRequestPrismaSchemaReadinessBoundary.ts',
  'src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts',
  'scripts/viona-request-pack12-prisma-schema-readiness-boundary-check.mjs',
  'docs/design/evidence/cursor-request-pack12-prisma-schema-readiness-boundary/README.md',
  'docs/product/VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_APPROVAL_PACKET.md',
  'src/config/vionaRequestPack13PrismaSchemaImplementationApprovalPacketReadiness.ts',
  'scripts/viona-request-pack13-prisma-schema-implementation-approval-packet-check.mjs',
  'docs/design/evidence/cursor-request-pack13a-prisma-schema-implementation-approval-packet/README.md',
  'docs/product/VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_HUMAN_APPROVAL_RECORD.md',
  'src/config/vionaRequestPack13PrismaSchemaImplementationHumanApprovalReadiness.ts',
  'scripts/viona-request-pack13-prisma-schema-implementation-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-pack13b-prisma-schema-implementation-human-approval/README.md',
];

const REQUIRED_FILES = [
  'docs/product/VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS.md',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/domain/requests/vionaRequestAuditEventTypes.ts',
  'src/domain/requests/vionaRequestPersistenceContract.ts',
  'scripts/viona-request-persistence-audit-readiness-check.mjs',
  'docs/design/evidence/cursor-request-persistence-audit-readiness-pack7/README.md',
];

const REQUIRED_SAFE_COPY = [
  'Persistence and audit readiness contract',
  'Fixture-only Admin Debug preview remains unchanged',
  'API and persistence are future gates',
  'No database schema or migration in this pack',
  'No payment captured',
  'Not booking confirmed',
  'No SOS dispatch',
  'No live merchant execution',
  'Human confirmation required before any future protected action',
  'Audit log is not a ledger',
];

const REQUIRED_DOC_PHRASES = [
  'Why Pack7 exists',
  '8f47574',
  'PR #61',
  'fixture-only',
  'LocalServiceRequest',
  'LocalServiceRequestAuditEvent',
  'reference-only',
  'source-of-truth is not chosen',
  'No API',
  'No DB',
  'No Prisma migration',
  'No request writes',
  'No Admin Debug preview data-source change',
  'Append-only audit log',
  'Human confirmation records',
  'LocalOpsAudit',
  'mapping contract',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS',
  'export const VIONA_REQUEST_PERSISTENCE_AUDIT_PHASES',
  'export function getVionaRequestPersistenceAuditReadiness',
  'fixtureOnlyAdminDebugPreview',
  'persistenceAuditReadinessContract',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'auditLogActive: false',
  'requestMutationActive: false',
  'productionLiveOpsActive: false',
  'sourceOfTruthMappingContractActive: true',
  'sotSignoffPhasePromotionReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'autonomousProtectedAiActionProhibited',
  'LocalServiceRequest',
  'LocalOpsAudit',
];

const REQUIRED_AUDIT_TYPE_TOKENS = [
  'VionaRequestAuditActorType',
  'VionaRequestAuditEventType',
  'VionaRequestAuditEventRecord',
  'VionaRequestAuditTransitionPreview',
  'VionaRequestAuditWriteReadiness',
  'requester',
  'operator',
  'admin',
  'merchant',
  'aiDraftOnly',
  'requestRead',
  'statusTransitionProposed',
  'humanConfirmationRecorded',
  'safetyGateBlocked',
  'idempotencyKey',
  'containsProtectedAction',
];

const REQUIRED_PERSISTENCE_CONTRACT_TOKENS = [
  'VionaRequestPersistenceReadScope',
  'VionaRequestPersistenceSourceOfTruth',
  'VionaRequestPersistenceReadiness',
  'VionaRequestRepositoryContract',
  'VionaRequestAuditRepositoryContract',
  'listRequestsForOperatorPreview',
  'getRequestById',
  'listAuditEventsForRequest',
  'appendAuditEvent',
  'sourceOfTruth: \'undecided\'',
  'adminDebugUsesFixturesOnly: true',
];

const REQUIRED_OPERATOR_READINESS_TOKENS = [
  'persistenceAuditReadinessContractActive: true',
  'sourceOfTruthMappingContractActive: true',
  'sotSignoffPhasePromotionReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'persistenceApiActive: false',
  'productionLiveOpsActive: false',
  'mutationsBlocked: true',
  'prohibitsAutonomousAiAction',
];

const FORBIDDEN_DIFF_PATTERNS = [
  /^App\.tsx$/,
  /MainTabNavigator/,
  /referenceLabStackScreens\.tsx$/,
  /referenceLabLinking\.ts$/,
  /^src\/navigation\/routes\.ts$/,
  /HomeScreen\.tsx$/,
  /LocalScreen\.tsx$/,
  /TravelScreen\.tsx$/,
  /VionaAdminDebugOperatorInboxPreviewScreen/,
  /LocalMerchantRequestInbox/,
  /TourismMerchantInbox/,
  /LocalOpsAudit/,
  /localOpsAuditApi/,
  /^assets\//,
  /^prisma\//,
  /^migrations?\//,
  /^src\/routes\//,
  /^src\/controllers\//,
  /^src\/server\.ts$/,
  /^src\/(?:api|server|services\/(?:payment|payments|booking|bookings|auth|sos|wallet|ai)|screens\/academy)\//i,
];

const FORBIDDEN_RUNTIME_IMPORTS = [
  'react',
  'react-native',
  'fetch(',
  'axios.',
  'AsyncStorage',
  '@prisma/client',
  'getPrisma',
  'supabase',
  'useNavigation',
];

const UNSAFE_STANDALONE_CLAIMS = [
  'payment captured',
  'booking confirmed',
  'sos dispatched',
  'live ai action',
  'live merchant execution',
  'payout completed',
  'settlement completed',
];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function missingValues(content, values) {
  return values.filter((value) => !content.includes(value));
}

function fail(label, values) {
  console.log(`FAIL ${label}`);
  for (const value of values) console.log(`  - ${value}`);
  process.exitCode = 1;
}

function getChangedFiles() {
  const output = run('git diff --name-only origin/master..HEAD');
  if (!output) return [];
  return output.split('\n').map((line) => line.replace(/\\/g, '/')).filter(Boolean);
}

function findUnsafeStandaloneClaims(paths) {
  const hits = [];
  for (const relPath of paths) {
    const content = read(relPath);
    for (const claim of UNSAFE_STANDALONE_CLAIMS) {
      if (!content.toLowerCase().includes(claim)) continue;
      for (const line of content.split('\n')) {
        if (!line.toLowerCase().includes(claim)) continue;
        const normalized = line.toLowerCase();
        if (normalized.includes(`no ${claim}`)) continue;
        if (normalized.includes(`not ${claim}`)) continue;
        if (claim === 'payment captured' && normalized.includes('no payment captured')) continue;
        if (claim === 'booking confirmed' && normalized.includes('not booking confirmed')) continue;
        hits.push(`${relPath}: ${claim} (${line.trim()})`);
      }
    }
  }
  return [...new Set(hits)];
}

function main() {
  const pack13cActive = isPack13cSchemaOnlyActive();
  console.log('VIONA request persistence audit readiness check (Pack7)');
  console.log(
    'Docs/config/domain contracts only. No API, DB, Prisma migration, mutation, or Admin Debug data-source change.\n'
  );

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) => matchesForbiddenDiff(file, pack13cActive));

  const config = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const auditTypes = read('src/domain/requests/vionaRequestAuditEventTypes.ts');
  const persistenceContract = read('src/domain/requests/vionaRequestPersistenceContract.ts');
  const operatorReadiness = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const docs = read('docs/product/VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS.md');
  const evidence = read('docs/design/evidence/cursor-request-persistence-audit-readiness-pack7/README.md');
  const combined = `${config}\n${auditTypes}\n${persistenceContract}\n${operatorReadiness}\n${docs}\n${evidence}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const routesChanged = run('git diff --name-only origin/master -- src/navigation/routes.ts');
  const prismaChanged = run('git diff --name-only origin/master -- prisma/');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');
  const controllersChanged = run('git diff --name-only origin/master -- src/controllers/');

  const missingSafeCopy = missingValues(combined, REQUIRED_SAFE_COPY);
  const missingDocPhrases = missingValues(docs, REQUIRED_DOC_PHRASES);
  const configTokens = augmentConfigTokensForPack13c(REQUIRED_CONFIG_TOKENS, pack13cActive);
  const missingConfigTokens = missingValues(config, configTokens);
  const missingAuditTokens = missingValues(auditTypes, REQUIRED_AUDIT_TYPE_TOKENS);
  const missingContractTokens = missingValues(persistenceContract, REQUIRED_PERSISTENCE_CONTRACT_TOKENS);
  const missingOperatorTokens = missingValues(operatorReadiness, REQUIRED_OPERATOR_READINESS_TOKENS);
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS.md',
    'src/config/vionaRequestPersistenceAuditReadiness.ts',
    'src/domain/requests/vionaRequestAuditEventTypes.ts',
    'src/domain/requests/vionaRequestPersistenceContract.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) =>
    [config, auditTypes, persistenceContract].some((file) => file.includes(token))
  );

  const hasImplementation =
    /\bclass\s+\w+/.test(persistenceContract) ||
    /\bclass\s+\w+/.test(auditTypes) ||
    /\bfunction\s+\w+/.test(persistenceContract) ||
    /\bfunction\s+\w+/.test(auditTypes) ||
    combined.includes('fetch(') ||
    combined.includes('getPrisma(');

  if (missingFiles.length) fail('missing required files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (routesChanged) fail('routes.ts changed vs origin/master', [routesChanged]);
  if (isPrismaDiffBlocked(pack13cActive, prismaChanged)) {
    fail('prisma changed vs origin/master', [prismaChanged.split('\n')[0] || 'prisma/']);
  }
  if (serverChanged) fail('src/server.ts changed vs origin/master', [serverChanged]);
  if (controllersChanged) fail('src/controllers changed vs origin/master', [controllersChanged.split('\n')[0] || 'src/controllers/']);
  if (missingSafeCopy.length) fail('missing required safe copy', missingSafeCopy);
  if (missingDocPhrases.length) fail('missing doc requirements', missingDocPhrases);
  if (missingConfigTokens.length) fail('missing config tokens', missingConfigTokens);
  if (missingAuditTokens.length) fail('missing audit event type tokens', missingAuditTokens);
  if (missingContractTokens.length) fail('missing persistence contract tokens', missingContractTokens);
  if (missingOperatorTokens.length) fail('operator readiness Pack7 pointer missing', missingOperatorTokens);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports in new files', forbiddenImports);
  if (hasImplementation) fail('implementation detected in contract pack', ['types/contracts only']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack7 persistence audit readiness before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Config readiness flags: PASS');
  console.log('Audit event types: PASS');
  console.log('Persistence contracts: PASS');
  console.log('Operator readiness pointer: PASS');
  console.log('Required safe copy: PASS');
  console.log('No App.tsx/navigation/screen changes: PASS');
  console.log('No Prisma/API/server changes: PASS');
  console.log('No implementation added: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - request persistence audit readiness contract is import-ready.');
}

main();
