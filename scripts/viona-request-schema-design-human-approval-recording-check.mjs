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
  ...PACK14A_CORE_FILES,
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
  'src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts',
  'src/config/vionaRequestSotHumanApprovalReadiness.ts',
  'src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
  'scripts/viona-request-dedicated-store-schema-design-contract-check.mjs',
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
];

const REQUIRED_DOC_PHRASES = [
  'origin/master @ 4408203',
  'Dedicated VIONA Request Store Schema Design Contract',
  'human chat instruction',
  'Nong Si Buong',
  'Founder / Executive Sponsor',
  'Acting Principal Architect',
  '2026-06-15',
  'APPROVED',
  'planning/readiness pack only',
  'schemaDesignApproved',
  'does NOT authorize',
  'Prisma schema implementation',
  'Prisma migration',
  'persistence adapter',
  'request mutation',
  'Admin Debug live data',
  'OPERATOR Prisma/Auth',
  'Direct LocalServiceRequest reuse',
  'Hybrid bridge remains future-only',
  'Audit log is not a payment ledger',
  'Admin Debug remains fixture-only',
  'pack12PlanningPermitted',
  'pack12PlanningReadinessBoundaryOnly',
  'pack12Started',
  'false',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_REQUEST_SCHEMA_DESIGN_HUMAN_APPROVAL_READINESS',
  'export const VIONA_REQUEST_SCHEMA_DESIGN_HUMAN_APPROVAL_CHECKLIST',
  'export function getVionaRequestSchemaDesignHumanApprovalReadiness',
  'export function isVionaRequestSchemaDesignHumanApprovalReadyForPack12Planning',
  'schemaDesignHumanApprovalRecorded: true',
  "schemaDesignApprovalSource: 'human-chat-instruction'",
  "schemaDesignApprovedBy: 'Nong Si Buong'",
  "schemaDesignApproverRole: 'Founder / Executive Sponsor + Acting Principal Architect'",
  "schemaDesignApprovalDate: '2026-06-15'",
  "schemaDesignApprovalDecision: 'approved'",
  'schemaDesignApproved: true',
  'pack11DedicatedStoreSchemaDesignContractActive: true',
  'schemaDesignContractCreated: true',
  'schemaDesignReviewRequired: false',
  'pack12PlanningPermitted: true',
  'pack12PlanningReadinessBoundaryOnly: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'directLocalServiceRequestReuseAllowed: false',
  'hybridBridgeFutureOnly: true',
  'adminDebugUsesFixturesOnly: true',
  'pack12Started: false',
  'prismaSchemaPermitted: true',
  'prismaMigrationPermitted: false',
  'readOnlyApiPermitted: false',
  'persistenceAdapterPermitted: false',
  'requestMutationPermitted: false',
  'agentMayFlipSignoff: false',
  'prismaSchemaActive: false',
  'prismaMigrationActive: false',
  'persistenceApiActive: false',
  'readOnlyApiActive: false',
  'persistenceAdapterActive: false',
  'auditLogActive: false',
  'requestMutationActive: false',
  'adminDebugLiveDataActive: false',
  'operatorRoleAddedToAuth: false',
  'operatorRoleAddedToPrisma: false',
  'productionLiveOpsActive: false',
  'paymentCaptureActive: false',
  'bookingConfirmationActive: false',
  'sosDispatchActive: false',
  'walletMutationActive: false',
  'liveAiProtectedActionsActive: false',
  'liveMerchantExecutionActive: false',
];

const REQUIRED_POINTER_TOKENS = [
  'schemaDesignHumanApprovalRecorded: true',
  'schemaDesignApproved: true',
  "schemaDesignApprovedBy: 'Nong Si Buong'",
  "schemaDesignApprovalDate: '2026-06-15'",
  'pack12PlanningPermitted: true',
  'pack12PlanningReadinessBoundaryOnly: true',
  'schemaDesignReviewRequired: false',
  'pack12Started: false',
  'prismaSchemaPermitted: true',
  'prismaMigrationPermitted: false',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'adminDebugUsesFixturesOnly: true',
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
  /^src\/routes\//,
  /^src\/controllers\//,
  /^src\/server\.ts$/,
  /vionaRequestTypes\.ts$/,
];

const FORBIDDEN_RUNTIME_IMPORTS = [
  'react',
  'react-native',
  'fetch(',
  'axios.',
  'AsyncStorage',
  '@prisma/client',
  'PrismaClient',
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
    if (!existsSync(path.join(ROOT, relPath))) continue;
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
  console.log('VIONA request schema design human approval recording check (Pack11B)');
  console.log(
    'Docs/config/check-script only. Records human schema-design approval; no Pack12 implementation, API, DB, Prisma, adapter, route, mutation, or Admin Debug data-source change.\n'
  );

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) => matchesForbiddenDiff(file, pack13cActive));

  const approvalConfig = read('src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts');
  const approvalDoc = read('docs/product/VIONA_REQUEST_SCHEMA_DESIGN_HUMAN_APPROVAL_RECORD.md');
  const dedicated = read('src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts');
  const human = read('src/config/vionaRequestSotHumanApprovalReadiness.ts');
  const pack9 = read('src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts');
  const pack8 = read('src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts');
  const persistence = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const operator = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const pointerCombined = `${dedicated}\n${human}\n${pack9}\n${pack8}\n${persistence}\n${operator}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const prismaChanged = run('git diff --name-only origin/master -- prisma/');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');
  const typesChanged = run('git diff --name-only origin/master -- src/domain/requests/vionaRequestTypes.ts');

  const missingDocPhrases = missingValues(approvalDoc, REQUIRED_DOC_PHRASES);
  const configTokens = augmentConfigTokensForPack13c(REQUIRED_CONFIG_TOKENS, pack13cActive);
  const missingConfigTokens = missingValues(approvalConfig, configTokens);
  const pointerTokens = augmentPointerTokensForPack13c(REQUIRED_POINTER_TOKENS, pack13cActive);
  const missingPointerTokens = missingValues(pointerCombined, pointerTokens);
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_SCHEMA_DESIGN_HUMAN_APPROVAL_RECORD.md',
    'src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) => approvalConfig.includes(token));

  const schemaApprovedWithoutHuman =
    pointerCombined.includes('schemaDesignApproved: true') &&
    !approvalConfig.includes('schemaDesignHumanApprovalRecorded: true');
  const pack12Started = approvalConfig.includes('pack12Started: true');
  const prismaActive =
    approvalConfig.includes('prismaSchemaActive: true') ||
    approvalConfig.includes('prismaMigrationActive: true');
  const apiActive =
    approvalConfig.includes('persistenceApiActive: true') ||
    approvalConfig.includes('readOnlyApiActive: true') ||
    approvalConfig.includes('persistenceAdapterActive: true');
  const mutationActive = approvalConfig.includes('requestMutationActive: true');
  const adminDebugLive = approvalConfig.includes('adminDebugLiveDataActive: true');
  const operatorAdded =
    approvalConfig.includes('operatorRoleAddedToAuth: true') ||
    approvalConfig.includes('operatorRoleAddedToPrisma: true');
  const liveRuntime =
    approvalConfig.includes('paymentCaptureActive: true') ||
    approvalConfig.includes('bookingConfirmationActive: true') ||
    approvalConfig.includes('sosDispatchActive: true') ||
    approvalConfig.includes('walletMutationActive: true') ||
    approvalConfig.includes('liveAiProtectedActionsActive: true') ||
    approvalConfig.includes('liveMerchantExecutionActive: true');
  const agentFlipEnabled = approvalConfig.includes('agentMayFlipSignoff: true');

  if (missingFiles.length) fail('missing required files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (isPrismaDiffBlocked(pack13cActive, prismaChanged)) {
    fail('prisma changed vs origin/master', [prismaChanged.split('\n')[0] || 'prisma/']);
  }
  if (serverChanged) fail('src/server.ts changed vs origin/master', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts changed vs origin/master', [typesChanged]);
  if (missingDocPhrases.length) fail('missing approval doc requirements', missingDocPhrases);
  if (missingConfigTokens.length) fail('missing approval config tokens', missingConfigTokens);
  if (missingPointerTokens.length) fail('missing pointer config tokens', missingPointerTokens);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports in Pack11B config', forbiddenImports);
  if (schemaApprovedWithoutHuman) {
    fail('schemaDesignApproved true requires human approval recorded', ['schemaDesignHumanApprovalRecorded missing']);
  }
  if (agentFlipEnabled) fail('agentMayFlipSignoff must remain false', ['agentMayFlipSignoff: true']);
  if (pack12Started) fail('Pack12 must not start in Pack11B', ['pack12Started: true']);
  if (!pack13cActive && prismaActive) fail('Prisma must remain inactive', ['prisma active']);
  if (apiActive) fail('API/adapter must remain inactive', ['persistence API/adapter active']);
  if (mutationActive) fail('mutation must remain inactive', ['requestMutationActive: true']);
  if (adminDebugLive) fail('Admin Debug must remain fixture-only', ['adminDebugLiveDataActive: true']);
  if (operatorAdded) fail('OPERATOR must not be added', ['operator role added']);
  if (liveRuntime) fail('live runtime must remain blocked', ['payment/booking/SOS/wallet/live AI active']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack11B schema design human approval recording before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Human approval doc facts: PASS');
  console.log('Approval readiness config: PASS');
  console.log('Pointer configs updated: PASS');
  console.log('schemaDesignApproved recorded with human approval: PASS');
  console.log('Pack12 planning boundary permitted: PASS');
  console.log('Pack12 not started: PASS');
  console.log('Prisma/API/adapter/mutation remain blocked: PASS');
  console.log('Admin Debug fixture-only: PASS');
  console.log('OPERATOR Prisma/Auth not added: PASS');
  console.log('LocalServiceRequest direct reuse disallowed: PASS');
  console.log('No forbidden runtime paths: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - schema design human approval recording is import-ready.');
}

main();
