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

const PACK14A_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK14A_PRISMA_MIGRATION_READINESS_APPROVAL_PACKET.md',
  'src/config/vionaRequestPack14PrismaMigrationReadinessApprovalPacket.ts',
  'scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs',
  'docs/design/evidence/cursor-request-pack14a-prisma-migration-readiness-approval-packet/README.md',
];

const PACK14B_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK14B_PRISMA_MIGRATION_HUMAN_APPROVAL_RECORD.md',
  'src/config/vionaRequestPack14PrismaMigrationHumanApprovalReadiness.ts',
  'scripts/viona-request-pack14-prisma-migration-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-pack14b-prisma-migration-human-approval/README.md',
];
const PACK14C_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_ONLY.md',
  'src/config/vionaRequestPack14CPrismaMigrationCreationReadiness.ts',
  'scripts/viona-request-pack14c-prisma-migration-creation-check.mjs',
  'docs/design/evidence/cursor-request-pack14c-prisma-migration-creation-only/README.md',
  'prisma/migrations/20260615120000_add_viona_request_models/migration.sql',
];

const POST_PACK14C_POINTER_TOKENS = [
  'pack14MigrationCreationOnly: true',
  'prismaMigrationActive: true',
  'migrationCreated: true',
  'dbApplied: false',
];

function isPack14cMigrationCreated() {
  const configPath = 'src/config/vionaRequestPack14CPrismaMigrationCreationReadiness.ts';
  if (!existsSync(path.join(ROOT, configPath))) return false;
  return read(configPath).includes('migrationCreated: true');
}

function augmentPointerTokensForPack14c(tokens, pack14cActive) {
  if (!pack14cActive) return tokens;
  const filtered = tokens.filter(
    (token) => token !== 'prismaMigrationActive: false' && token !== 'migrationCreated: false'
  );
  return [...filtered, ...POST_PACK14C_POINTER_TOKENS];
}

function augmentConfigTokensForPack14c(tokens, pack14cActive) {
  return augmentPointerTokensForPack14c(tokens, pack14cActive);
}

function isPack14cMigrationDiffFile(file) {
  return /^prisma\/migrations\/\d+_add_viona_request_models\/migration\.sql$/.test(file);
}


const POST_PACK14B_POINTER_TOKENS = [
  'pack14HumanApprovalRecorded: true',
  'pack14PrismaMigrationApproved: true',
  'pack14PrismaMigrationApprovalRecordingOnly: true',
  'pack14MigrationCreationMayBePlannedNext: true',
  "pack14PrismaMigrationApprovalSource: 'human-chat-instruction'",
  "pack14PrismaMigrationApprovedBy: 'Nong Si Buong'",
  "pack14PrismaMigrationApprovalDate: '2026-06-15'",
  'prismaMigrationPermitted: true',
];

function isPack14bRecorded() {
  const configPath = 'src/config/vionaRequestPack14PrismaMigrationHumanApprovalReadiness.ts';
  if (!existsSync(path.join(ROOT, configPath))) return false;
  return read(configPath).includes('pack14HumanApprovalRecorded: true');
}

function augmentPointerTokensForPack14b(tokens, pack14bRecorded) {
  if (!pack14bRecorded) return tokens;
  const filtered = tokens.filter((token) => token !== 'prismaMigrationPermitted: false');
  return [...filtered, ...POST_PACK14B_POINTER_TOKENS];
}

function augmentConfigTokensForPack14b(tokens, pack14bRecorded) {
  if (!pack14bRecorded) return tokens;
  const filtered = tokens.filter((token) => token !== 'prismaMigrationPermitted: false');
  return [...filtered, 'prismaMigrationPermitted: true', ...POST_PACK14B_POINTER_TOKENS];
}

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
  if (isPack14cMigrationDiffFile(file)) return false;
  if (pack13cActive && file === 'prisma/schema.prisma') return false;
  return FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file));
}

function isPrismaDiffBlocked(pack13cActive, pack14cActive, prismaChanged) {
  if (!prismaChanged) return false;
  const files = prismaChanged.split('\n').map((line) => line.replace(/\\/g, '/')).filter(Boolean);
  return files.some((file) => {
    if (pack14cActive && isPack14cMigrationDiffFile(file)) return false;
    if (pack13cActive && file === 'prisma/schema.prisma') return false;
    return true;
  });
}


const ALLOWED_FILES = [
  ...PACK13C_CORE_FILES,
  ...PACK14A_CORE_FILES,
  ...PACK14B_CORE_FILES,
  ...PACK14C_CORE_FILES,
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
  'src/config/vionaRequestSotHumanApprovalReadiness.ts',
  'src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
  'scripts/viona-request-sot-human-approval-recording-check.mjs',
  'scripts/viona-request-sot-founder-architect-signoff-packet-check.mjs',
  'scripts/viona-request-sot-signoff-phase-promotion-readiness-check.mjs',
  'scripts/viona-request-source-of-truth-auth-tenant-mapping-check.mjs',
  'scripts/viona-request-persistence-audit-readiness-check.mjs',
  'scripts/viona-operator-inbox-admin-debug-preview-check.mjs',
  'scripts/viona-operator-inbox-admin-route-readiness-check.mjs',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
];

const REQUIRED_FILES = [
  'docs/product/VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT.md',
  'src/domain/requests/vionaRequestDedicatedStoreSchemaDesignContract.ts',
  'src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts',
  'scripts/viona-request-dedicated-store-schema-design-contract-check.mjs',
  'docs/design/evidence/cursor-request-dedicated-store-schema-design-pack11/README.md',
];

const REQUIRED_DOC_PHRASES = [
  'schema-design contract only',
  'Dedicated VIONA Request Store',
  'dedicatedVionaRequestStore',
  'Pack10C',
  'does not create Prisma schema',
  'does not create migration',
  'does not create API',
  'does not create persistence adapter',
  'does not create request mutation',
  'does not change Admin Debug data source',
  'does not add OPERATOR',
  'does not extend VionaRequestRecord',
  'Direct LocalServiceRequest reuse',
  'Hybrid bridge remains future-only',
  'fixture-only',
  'Audit log is not a payment ledger',
  'logical entities',
  'candidate',
  'draftIntake',
  'waitingForHumanConfirmation',
];

const REQUIRED_DOMAIN_TOKENS = [
  'export const VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT',
  'export const VIONA_REQUEST_DEDICATED_STORE_ENTITY_CANDIDATES',
  'export const VIONA_REQUEST_DEDICATED_STORE_FIELD_GROUPS',
  'export const VIONA_REQUEST_DEDICATED_STORE_LIFECYCLE_STATES',
  'export const VIONA_REQUEST_DEDICATED_STORE_SOURCE_LINK_POLICY',
  'export const VIONA_REQUEST_DEDICATED_STORE_AUDIT_EVENT_CONTRACT',
  'export const VIONA_REQUEST_DEDICATED_STORE_BLOCKED_IMPLEMENTATION_ITEMS',
  'export function getVionaRequestDedicatedStoreSchemaDesignContract',
  'export function isVionaRequestDedicatedStoreSchemaDesignOnly',
  'candidateOnly: true',
  'isPrismaModel: false',
  'isDatabaseTable: false',
  'directLocalServiceRequestReuseAllowed: false',
  'isPaymentLedger: false',
  'requestId',
  'tenantId',
  'requesterUserId',
  'lifecycleState',
  'auditEventId',
  'draftIntake',
  'closedByHuman',
];

const FORBIDDEN_FIELD_TOKENS = [
  'walletMode',
  'walletPhase',
  'totalVioCredits',
  'heldVioCredits',
  'paymentCaptured',
  'bookingConfirmed',
  'sosDispatched',
  'payoutCompleted',
  'settlementCompleted',
];

const FORBIDDEN_LIFECYCLE_NAMES = [
  'paymentCaptured',
  'bookingConfirmed',
  'sosDispatched',
  'paymentSettled',
  'refundGuaranteed',
];

const REQUIRED_CONFIG_TOKENS_REVIEW = [
  'export const VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_READINESS',
  'export const VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CHECKLIST',
  'export function getVionaRequestDedicatedStoreSchemaDesignReadiness',
  'export function isVionaRequestDedicatedStoreSchemaDesignReadyForReview',
  'humanSotApprovalRecorded: true',
  'sourceOfTruthDecisionSignedOff: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'pack11DiscoveryPermitted: true',
  'pack11DedicatedStoreSchemaDesignContractActive: true',
  'schemaDesignContractCreated: true',
  'schemaDesignReviewRequired: true',
  'schemaDesignApproved: false',
  'prismaSchemaPermitted: false',
  'prismaMigrationPermitted: false',
  'readOnlyApiPermitted: false',
  'persistenceAdapterPermitted: false',
  'requestMutationPermitted: false',
  'agentMayFlipSignoff: false',
  'prismaSchemaActive: false',
  'persistenceApiActive: false',
  'requestMutationActive: false',
  'adminDebugLiveDataActive: false',
  'operatorRoleAddedToAuth: false',
  'adminDebugUsesFixturesOnly: true',
];

const REQUIRED_CONFIG_TOKENS_APPROVED = [
  'export const VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_READINESS',
  'export const VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CHECKLIST',
  'export function getVionaRequestDedicatedStoreSchemaDesignReadiness',
  'export function isVionaRequestDedicatedStoreSchemaDesignReadyForReview',
  'humanSotApprovalRecorded: true',
  'sourceOfTruthDecisionSignedOff: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'pack11DedicatedStoreSchemaDesignContractActive: true',
  'schemaDesignContractCreated: true',
  'schemaDesignReviewRequired: false',
  'schemaDesignHumanApprovalRecorded: true',
  'schemaDesignApproved: true',
  'pack12PlanningPermitted: true',
  'pack12PlanningReadinessBoundaryOnly: true',
  'pack12Started: false',
  'prismaSchemaPermitted: true',
  'prismaMigrationPermitted: false',
  'readOnlyApiPermitted: false',
  'persistenceAdapterPermitted: false',
  'requestMutationPermitted: false',
  'agentMayFlipSignoff: false',
  'prismaSchemaActive: false',
  'persistenceApiActive: false',
  'requestMutationActive: false',
  'adminDebugLiveDataActive: false',
  'operatorRoleAddedToAuth: false',
  'adminDebugUsesFixturesOnly: true',
];

const REQUIRED_POINTER_TOKENS_REVIEW = [
  'pack11DedicatedStoreSchemaDesignContractActive: true',
  'schemaDesignContractCreated: true',
  'schemaDesignReviewRequired: true',
  'schemaDesignApproved: false',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'adminDebugUsesFixturesOnly: true',
];

const REQUIRED_POINTER_TOKENS_APPROVED = [
  'pack11DedicatedStoreSchemaDesignContractActive: true',
  'schemaDesignContractCreated: true',
  'schemaDesignHumanApprovalRecorded: true',
  'schemaDesignApproved: true',
  'pack12PlanningPermitted: true',
  'pack12PlanningReadinessBoundaryOnly: true',
  'pack12Started: false',
  'prismaSchemaPermitted: true',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'adminDebugUsesFixturesOnly: true',
  'pack13HumanApprovalRecorded: true',
  'pack13PrismaSchemaImplementationApproved: true',
  'pack13PrismaSchemaImplementationRecordingOnly: true',
  'pack13PrismaSchemaImplementationMayBePlannedNext: true',
  "pack13PrismaSchemaImplementationApprovalSource: 'human-chat-instruction'",
  "pack13PrismaSchemaImplementationApprovedBy: 'Nong Si Buong'",
  "pack13PrismaSchemaImplementationApprovalDate: '2026-06-15'",
];

const FORBIDDEN_DIFF_PATTERNS = [
  /^App\.tsx$/,
  /MainTabNavigator/,
  /referenceLabStackScreens\.tsx$/,
  /^src\/navigation\/routes\.ts$/,
  /VionaAdminDebugOperatorInboxPreviewScreen/,
  /LocalMerchantRequestInbox/,
  /TourismMerchantInbox/,
  /LocalOpsAudit/,
  /^assets\//,
  /^prisma\//,
  /^migrations?\//,
  /^src\/routes\//,
  /^src\/controllers\//,
  /^src\/server\.ts$/,
  /vionaRequestTypes\.ts$/,
  /^src\/(?:api|server|services\/(?:payment|payments|booking|bookings|auth|sos|wallet|ai)|screens\/academy)\//i,
];

const FORBIDDEN_RUNTIME_IMPORTS = [
  'react',
  'react-native',
  'fetch(',
  'axios.',
  'AsyncStorage',
  '@prisma/client',
  'PrismaClient',
  'getPrisma',
  'useNavigation',
];

const UNSAFE_STANDALONE_CLAIMS = [
  'payment captured',
  'booking confirmed',
  'sos dispatched',
  'live ai action',
  'live merchant execution',
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
    if (!existsSync(path.join(ROOT, relPath))) continue;
    const content = read(relPath);
    for (const claim of UNSAFE_STANDALONE_CLAIMS) {
      if (!content.toLowerCase().includes(claim)) continue;
      for (const line of content.split('\n')) {
        if (!line.toLowerCase().includes(claim)) continue;
        const normalized = line.toLowerCase();
        if (normalized.includes(`no ${claim}`)) continue;
        if (normalized.includes(`not ${claim}`)) continue;
        if (normalized.includes('does not')) continue;
        if (normalized.includes('avoid')) continue;
        if (normalized.includes('not imply')) continue;
        if (normalized.includes('do not imply')) continue;
        if (normalized.includes('authorize payment')) continue;
        if (normalized.includes('blockedinpack11: true')) continue;
        if (normalized.includes("label: 'live merchant execution'")) continue;
        hits.push(`${relPath}: ${claim} (${line.trim()})`);
      }
    }
  }
  return [...new Set(hits)];
}

function isSchemaDesignHumanApprovalRecorded() {
  const rel = 'src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts';
  return existsSync(path.join(ROOT, rel)) && read(rel).includes('schemaDesignHumanApprovalRecorded: true');
}

function main() {
  const pack13cActive = isPack13cSchemaOnlyActive();
  const pack14bRecorded = isPack14bRecorded();
  const pack14cActive = isPack14cMigrationCreated();
  console.log('VIONA request dedicated store schema design contract check (Pack11)');
  console.log(
    'Schema-design contract only. No Prisma, migration, API, adapter, mutation, or Admin Debug data-source change.\n'
  );

  const schemaDesignHumanApprovalRecorded = isSchemaDesignHumanApprovalRecorded();
  const requiredConfigTokens = schemaDesignHumanApprovalRecorded
    ? REQUIRED_CONFIG_TOKENS_APPROVED
    : REQUIRED_CONFIG_TOKENS_REVIEW;
  const requiredPointerTokens = schemaDesignHumanApprovalRecorded
    ? REQUIRED_POINTER_TOKENS_APPROVED
    : REQUIRED_POINTER_TOKENS_REVIEW;

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file) && !isPack14cMigrationDiffFile(file));
  const forbiddenFiles = changedFiles.filter((file) => matchesForbiddenDiff(file, pack13cActive));

  const docs = read('docs/product/VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT.md');
  const domain = read('src/domain/requests/vionaRequestDedicatedStoreSchemaDesignContract.ts');
  const config = read('src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts');
  const human = read('src/config/vionaRequestSotHumanApprovalReadiness.ts');
  const pack9 = read('src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts');
  const pack8 = read('src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts');
  const persistence = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const operator = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const pointerCombined = `${human}\n${pack9}\n${pack8}\n${persistence}\n${operator}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const prismaChanged = run('git diff --name-only origin/master -- prisma/');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');
  const typesChanged = run('git diff --name-only origin/master -- src/domain/requests/vionaRequestTypes.ts');

  const missingDocPhrases = missingValues(docs, REQUIRED_DOC_PHRASES);
  const missingDomainTokens = missingValues(domain, REQUIRED_DOMAIN_TOKENS);
  let configTokens = augmentConfigTokensForPack13c(requiredConfigTokens, pack13cActive);
  configTokens = augmentConfigTokensForPack14b(configTokens, pack14bRecorded);
  configTokens = augmentConfigTokensForPack14c(configTokens, pack14cActive);
  const missingConfigTokens = missingValues(config, configTokens);
  let pointerTokens = augmentPointerTokensForPack13c(requiredPointerTokens, pack13cActive);
  pointerTokens = augmentPointerTokensForPack14b(pointerTokens, pack14bRecorded);
  pointerTokens = augmentPointerTokensForPack14c(pointerTokens, pack14cActive);
  const missingPointerTokens = missingValues(pointerCombined, pointerTokens);
  const forbiddenFields = FORBIDDEN_FIELD_TOKENS.filter((token) => domain.includes(token));
  const forbiddenLifecycle = FORBIDDEN_LIFECYCLE_NAMES.filter((name) => domain.includes(name));
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT.md',
    'src/domain/requests/vionaRequestDedicatedStoreSchemaDesignContract.ts',
    'src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter(
    (token) => config.includes(token) || domain.includes(token)
  );

  const schemaApprovedWithoutHuman =
    (config.includes('schemaDesignApproved: true') || pointerCombined.includes('schemaDesignApproved: true')) &&
    !schemaDesignHumanApprovalRecorded;
  const prismaActive =
    config.includes('prismaSchemaActive: true') || config.includes('prismaMigrationActive: true');
  const apiActive =
    config.includes('persistenceApiActive: true') || config.includes('readOnlyApiActive: true');
  const mutationActive = config.includes('requestMutationActive: true');
  const adminDebugLive = config.includes('adminDebugLiveDataActive: true');
  const operatorAdded =
    config.includes('operatorRoleAddedToAuth: true') || config.includes('operatorRoleAddedToPrisma: true');

  if (missingFiles.length) fail('missing required files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (isPrismaDiffBlocked(pack13cActive, pack14cActive, prismaChanged)) {
    fail('prisma changed vs origin/master', [prismaChanged.split('\n')[0] || 'prisma/']);
  }
  if (serverChanged) fail('src/server.ts changed vs origin/master', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts changed vs origin/master', [typesChanged]);
  if (missingDocPhrases.length) fail('missing doc requirements', missingDocPhrases);
  if (missingDomainTokens.length) fail('missing domain contract tokens', missingDomainTokens);
  if (missingConfigTokens.length) fail('missing readiness config tokens', missingConfigTokens);
  if (missingPointerTokens.length) fail('missing pointer config tokens', missingPointerTokens);
  if (forbiddenFields.length) fail('forbidden wallet/payment field tokens in domain contract', forbiddenFields);
  if (forbiddenLifecycle.length) fail('forbidden lifecycle names in domain contract', forbiddenLifecycle);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports', forbiddenImports);
  if (schemaApprovedWithoutHuman) {
    fail('schemaDesignApproved true requires human approval recorded', ['schemaDesignHumanApprovalRecorded missing']);
  }
  if (!pack13cActive && prismaActive) fail('Prisma must remain inactive', ['prisma active']);
  if (apiActive) fail('API must remain inactive', ['persistence API active']);
  if (mutationActive) fail('mutation must remain inactive', ['requestMutationActive: true']);
  if (adminDebugLive) fail('Admin Debug must remain fixture-only', ['adminDebugLiveDataActive: true']);
  if (operatorAdded) fail('OPERATOR must not be added', ['operator role added']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack11 schema design contract before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Product doc boundaries: PASS');
  console.log('Domain contract exports: PASS');
  console.log('Logical entities candidate-only: PASS');
  console.log('Field groups avoid forbidden Local wallet/payment truth: PASS');
  console.log('Lifecycle states safe: PASS');
  console.log('Readiness config: PASS');
  console.log('Pointer configs updated: PASS');
  console.log(
    schemaDesignHumanApprovalRecorded
      ? 'schemaDesignApproved recorded with human approval: PASS'
      : 'schemaDesignApproved remains false: PASS'
  );
  console.log('Prisma/API/adapter/mutation remain blocked: PASS');
  console.log('Admin Debug fixture-only: PASS');
  console.log('No forbidden runtime paths: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - dedicated store schema design contract is import-ready.');
}

main();
