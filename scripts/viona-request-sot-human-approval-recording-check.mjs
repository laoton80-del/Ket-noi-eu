#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  isPack14cMigrationCreated,
  isPack14cMigrationSqlPath,
  isPrismaDiffBlocked,
  PACK14D_BRANCH_ALLOWED_FILES,
} from './lib/vionaPackDiffAllowlist.mjs';


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
  if (isPack14cMigrationSqlPath(file)) return false;
  if (pack13cActive && file === 'prisma/schema.prisma') return false;
  return FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file));
}

const ALLOWED_FILES = [
  ...PACK14D_BRANCH_ALLOWED_FILES,
  ...PACK13C_CORE_FILES,
  ...PACK14A_CORE_FILES,
  ...PACK14B_CORE_FILES,
  ...PACK14C_CORE_FILES,
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
  'src/config/vionaRequestSotFounderArchitectSignoffPacketReadiness.ts',
  'src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
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
  'docs/product/VIONA_REQUEST_SOT_HUMAN_APPROVAL_RECORD.md',
  'src/config/vionaRequestSotHumanApprovalReadiness.ts',
  'scripts/viona-request-sot-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-sot-human-approval-pack10c/README.md',
  'docs/product/VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT.md',
  'src/domain/requests/vionaRequestDedicatedStoreSchemaDesignContract.ts',
  'src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts',
  'scripts/viona-request-dedicated-store-schema-design-contract-check.mjs',
  'docs/design/evidence/cursor-request-dedicated-store-schema-design-pack11/README.md',
];

const REQUIRED_DOC_PHRASES = [
  'outside Cursor/agent authority',
  'Nong Si Buong',
  'Founder / Executive Sponsor',
  'Acting Principal Architect',
  'Single Accountable Architecture Owner',
  'Product Owner',
  'Safety Owner',
  'Ops Runbook Owner',
  '2026-06-15',
  'Dedicated VIONA Request Store',
  'dedicatedVionaRequestStore',
  'Pack11 discovery / schema-design contract only',
  'does NOT authorize',
  'Prisma schema',
  'Prisma migration',
  'persistence adapter',
  'request mutation',
  'Admin Debug live data',
  'OPERATOR Prisma/Auth',
  'Direct LocalServiceRequest reuse',
  'Hybrid bridge remains future-only',
  'Admin Debug remains fixture-only',
  'agentMayFlipSignoff',
  'pack11Started',
  'false',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_REQUEST_SOT_HUMAN_APPROVAL_READINESS',
  'export const VIONA_REQUEST_SOT_HUMAN_APPROVAL_CHECKLIST',
  'export function getVionaRequestSotHumanApprovalReadiness',
  'export function isVionaRequestSotHumanApprovalReadyForPack11Discovery',
  'humanApprovalRecorded: true',
  "humanApprovalSource: 'offline-human-record'",
  "approvalRecordOwnerName: 'Nong Si Buong'",
  "approvalDate: '2026-06-15'",
  'founderExecutiveSponsorApproved: true',
  'principalArchitectApproved: true',
  'actingPrincipalArchitectApproved: true',
  'singleAccountableOwnerApproved: true',
  'productOwnerAcknowledged: true',
  'safetyOwnerAcknowledged: true',
  'opsRunbookOwnerAcknowledged: true',
  "signOffStatus: 'approved'",
  'sourceOfTruthDecisionSignedOff: true',
  'founderSignoffRecorded: true',
  'architectSignoffRecorded: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  "recommendedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'pack11DiscoveryPermitted: true',
  'pack11SchemaDesignContractOnly: true',
  'agentMayFlipSignoff: false',
  'pack11Started: false',
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
  'adminDebugUsesFixturesOnly: true',
];

const REQUIRED_CONFIG_TOKENS_SCHEMA_DESIGN_APPROVED = [
  ...REQUIRED_CONFIG_TOKENS,
  'schemaDesignHumanApprovalRecorded: true',
  'schemaDesignApproved: true',
  'pack12PlanningPermitted: true',
  'pack12PlanningReadinessBoundaryOnly: true',
  'pack12Started: false',
  'schemaDesignReviewRequired: false',
];

const REQUIRED_POINTER_TOKENS = [
  'humanApprovalRecordActive: true',
  'pack11DiscoveryPermitted: true',
  'pack11SchemaDesignContractOnly: true',
  'sourceOfTruthDecisionSignedOff: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'agentMayFlipSignoff: false',
  'pack11Started: false',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'adminDebugUsesFixturesOnly: true',
];

const REQUIRED_POINTER_TOKENS_SCHEMA_DESIGN_APPROVED = [
  ...REQUIRED_POINTER_TOKENS,
  'schemaDesignHumanApprovalRecorded: true',
  'schemaDesignApproved: true',
  'pack12PlanningPermitted: true',
  'pack12PlanningReadinessBoundaryOnly: true',
  'pack12Started: false',
  'schemaDesignReviewRequired: false',
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

function isSchemaDesignHumanApprovalRecorded() {
  const rel = 'src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts';
  return existsSync(path.join(ROOT, rel)) && read(rel).includes('schemaDesignHumanApprovalRecorded: true');
}

function main() {
  const pack13cActive = isPack13cSchemaOnlyActive();
  const pack14cActive = isPack14cMigrationCreated();
  console.log('VIONA request SoT human approval recording check (Pack10C)');
  console.log(
    'Docs/config/check-script only. Records human approval; no Pack11 start, API, DB, Prisma, adapter, route, mutation, or Admin Debug data-source change.\n'
  );

  const schemaDesignHumanApprovalRecorded = isSchemaDesignHumanApprovalRecorded();
  const requiredConfigTokens = schemaDesignHumanApprovalRecorded
    ? REQUIRED_CONFIG_TOKENS_SCHEMA_DESIGN_APPROVED
    : REQUIRED_CONFIG_TOKENS;
  const requiredPointerTokens = schemaDesignHumanApprovalRecorded
    ? REQUIRED_POINTER_TOKENS_SCHEMA_DESIGN_APPROVED
    : REQUIRED_POINTER_TOKENS;

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file) && !isPack14cMigrationSqlPath(file));
  const forbiddenFiles = changedFiles.filter((file) => matchesForbiddenDiff(file, pack13cActive));

  const approvalConfig = read('src/config/vionaRequestSotHumanApprovalReadiness.ts');
  const approvalDoc = read('docs/product/VIONA_REQUEST_SOT_HUMAN_APPROVAL_RECORD.md');
  const pack10 = read('src/config/vionaRequestSotFounderArchitectSignoffPacketReadiness.ts');
  const pack9 = read('src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts');
  const pack8 = read('src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts');
  const persistence = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const operator = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const pointerCombined = `${pack10}\n${pack9}\n${pack8}\n${persistence}\n${operator}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const routesChanged = run('git diff --name-only origin/master -- src/navigation/routes.ts');
  const prismaChanged = run('git diff --name-only origin/master -- prisma/');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');
  const typesChanged = run('git diff --name-only origin/master -- src/domain/requests/vionaRequestTypes.ts');

  const missingDocPhrases = missingValues(approvalDoc, REQUIRED_DOC_PHRASES);
  let configTokens = augmentConfigTokensForPack13c(requiredConfigTokens, pack13cActive);
  configTokens = augmentConfigTokensForPack14c(configTokens, pack14cActive);
  const missingConfigTokens = missingValues(approvalConfig, configTokens);
  let pointerTokens = augmentPointerTokensForPack13c(requiredPointerTokens, pack13cActive);
  pointerTokens = augmentPointerTokensForPack14c(pointerTokens, pack14cActive);
  const missingPointerTokens = missingValues(pointerCombined, pointerTokens);
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_SOT_HUMAN_APPROVAL_RECORD.md',
    'src/config/vionaRequestSotHumanApprovalReadiness.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) => approvalConfig.includes(token));

  const agentFlipEnabled = approvalConfig.includes('agentMayFlipSignoff: true');
  const pack11Started = approvalConfig.includes('pack11Started: true');
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

  const missingApprovalFlags =
    !approvalConfig.includes('sourceOfTruthDecisionSignedOff: true') ||
    !approvalConfig.includes('founderSignoffRecorded: true') ||
    !approvalConfig.includes('architectSignoffRecorded: true') ||
    !approvalConfig.includes("selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'") ||
    !approvalConfig.includes("signOffStatus: 'approved'");

  if (missingFiles.length) fail('missing required files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (routesChanged) fail('routes.ts changed vs origin/master', [routesChanged]);
  if (isPrismaDiffBlocked(pack13cActive, pack14cActive, prismaChanged)) {
    fail('prisma changed vs origin/master', [prismaChanged.split('\n')[0] || 'prisma/']);
  }
  if (serverChanged) fail('src/server.ts changed vs origin/master', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts changed vs origin/master', [typesChanged]);
  if (missingDocPhrases.length) fail('missing approval doc requirements', missingDocPhrases);
  if (missingConfigTokens.length) fail('missing approval config tokens', missingConfigTokens);
  if (missingPointerTokens.length) fail('missing pointer config tokens', missingPointerTokens);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports in Pack10C config', forbiddenImports);
  if (missingApprovalFlags) fail('human approval flags incomplete', ['required approval flags missing']);
  if (agentFlipEnabled) fail('agentMayFlipSignoff must remain false', ['agentMayFlipSignoff: true']);
  if (pack11Started) fail('Pack11 must not start in Pack10C', ['pack11Started: true']);
  if (!pack13cActive && prismaActive) fail('Prisma must remain inactive', ['prisma active']);
  if (apiActive) fail('API/adapter must remain inactive', ['persistence API/adapter active']);
  if (mutationActive) fail('mutation must remain inactive', ['requestMutationActive: true']);
  if (adminDebugLive) fail('Admin Debug must remain fixture-only', ['adminDebugLiveDataActive: true']);
  if (operatorAdded) fail('OPERATOR must not be added', ['operator role added']);
  if (liveRuntime) fail('live runtime must remain blocked', ['payment/booking/SOS/wallet/live AI active']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack10C human approval recording before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Human approval doc facts: PASS');
  console.log('Approval readiness config: PASS');
  console.log('Pointer configs updated: PASS');
  console.log('Human decision flags recorded: PASS');
  console.log('agentMayFlipSignoff remains false: PASS');
  console.log('Pack11 not started: PASS');
  console.log('Prisma/API/adapter/mutation remain blocked: PASS');
  console.log('Admin Debug fixture-only: PASS');
  console.log('OPERATOR Prisma/Auth not added: PASS');
  console.log('No App.tsx/navigation/screen changes: PASS');
  console.log('No Prisma/API/server/types changes: PASS');
  console.log('Pack11 unlock limited to discovery/schema-design contract: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - human SoT approval recording is import-ready.');
}

main();
