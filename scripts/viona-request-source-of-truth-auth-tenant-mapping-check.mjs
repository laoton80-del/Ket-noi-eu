#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const ALLOWED_FILES = [
  'docs/product/VIONA_REQUEST_SOURCE_OF_TRUTH_AUTH_TENANT_MAPPING.md',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/domain/requests/vionaRequestSourceOfTruthMappingContract.ts',
  'src/domain/requests/vionaRequestRoleTenantAccessMatrix.ts',
  'scripts/viona-request-source-of-truth-auth-tenant-mapping-check.mjs',
  'docs/design/evidence/cursor-request-source-of-truth-auth-tenant-pack8/README.md',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
  'scripts/viona-request-persistence-audit-readiness-check.mjs',
  'scripts/viona-operator-inbox-admin-debug-preview-check.mjs',
  'scripts/viona-operator-inbox-admin-route-readiness-check.mjs',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
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
];

const REQUIRED_FILES = [
  'docs/product/VIONA_REQUEST_SOURCE_OF_TRUTH_AUTH_TENANT_MAPPING.md',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/domain/requests/vionaRequestSourceOfTruthMappingContract.ts',
  'src/domain/requests/vionaRequestRoleTenantAccessMatrix.ts',
  'scripts/viona-request-source-of-truth-auth-tenant-mapping-check.mjs',
  'docs/design/evidence/cursor-request-source-of-truth-auth-tenant-pack8/README.md',
];

const REQUIRED_SAFE_COPY = [
  'Source-of-truth mapping contract',
  'Fixture-only Admin Debug preview remains unchanged',
  'API and persistence are future gates',
  'No database schema or migration in this pack',
  'No payment captured',
  'Not booking confirmed',
  'No SOS dispatch',
  'No live merchant execution',
  'Human confirmation required before any future protected action',
  'Audit log is not a ledger',
  'LocalServiceRequest is reference-only',
  'Source-of-truth decision requires founder/architect sign-off',
];

const REQUIRED_DOC_PHRASES = [
  'Why Pack8 exists',
  '3f28073',
  'PR #62',
  'fixture-only',
  'LocalServiceRequest',
  'reference-only',
  'dedicatedVionaRequestStore',
  'mappedFromLocalServiceRequest',
  'hybridWithMappingContract',
  'founder/architect sign-off',
  'OPERATOR',
  'No API',
  'No DB',
  'No Prisma migration',
  'No request writes',
  'No Admin Debug preview data-source change',
  'LocalOpsAudit',
  'LocalMerchantRequestInbox',
  'TourismMerchantInbox',
  'auditRead',
  'mapping contract',
];

const REQUIRED_CONFIG_TOKENS_PENDING = [
  'export const VIONA_REQUEST_SOURCE_OF_TRUTH_AUTH_TENANT_READINESS',
  'export const VIONA_REQUEST_SOURCE_OF_TRUTH_OPTIONS',
  'export const VIONA_REQUEST_AUTH_TENANT_PHASES',
  'export function getVionaRequestSourceOfTruthAuthTenantReadiness',
  'sourceOfTruthMappingContractActive: true',
  'sotSignoffPhasePromotionReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'sourceOfTruthDecisionSignedOff: false',
  'authSessionSourceOfTruthApproved: false',
  'tenantAccessMatrixApproved: false',
  'operatorRoleResolved: false',
  'localStatusMappingApproved: false',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'auditLogActive: false',
  'requestMutationActive: false',
  'productionLiveOpsActive: false',
  'adminDebugUsesFixturesOnly: true',
  'dedicatedVionaRequestStore',
  'mappedFromLocalServiceRequest',
  'hybridWithMappingContract',
  'noLocalOpsAuditApiReuse',
  'noLocalServiceRequestDirectReuse',
];

const REQUIRED_CONFIG_TOKENS_APPROVED = [
  'export const VIONA_REQUEST_SOURCE_OF_TRUTH_AUTH_TENANT_READINESS',
  'export const VIONA_REQUEST_SOURCE_OF_TRUTH_OPTIONS',
  'export const VIONA_REQUEST_AUTH_TENANT_PHASES',
  'export function getVionaRequestSourceOfTruthAuthTenantReadiness',
  'sourceOfTruthMappingContractActive: true',
  'sotSignoffPhasePromotionReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'humanApprovalRecordActive: true',
  'pack11DiscoveryPermitted: true',
  'pack11SchemaDesignContractOnly: true',
  'pack11Started: false',
  'sourceOfTruthDecisionSignedOff: true',
  'authSessionSourceOfTruthApproved: false',
  'tenantAccessMatrixApproved: false',
  'operatorRoleResolved: false',
  'localStatusMappingApproved: false',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'auditLogActive: false',
  'requestMutationActive: false',
  'productionLiveOpsActive: false',
  'adminDebugUsesFixturesOnly: true',
  'dedicatedVionaRequestStore',
  'mappedFromLocalServiceRequest',
  'hybridWithMappingContract',
  'noLocalOpsAuditApiReuse',
  'noLocalServiceRequestDirectReuse',
];

const REQUIRED_CONFIG_TOKENS = REQUIRED_CONFIG_TOKENS_PENDING;

const REQUIRED_MAPPING_TOKENS = [
  'VionaRequestSourceOfTruthOption',
  'VionaRequestSourceOfTruthRecommendation',
  'VionaRequestExternalSourceKind',
  'VionaRequestExternalSourceLink',
  'VionaRequestLocalStatusReference',
  'VionaRequestLocalToVionaStatusMapping',
  'VionaRequestHybridMappingContract',
  'VionaRequestSourceOfTruthSignoffRequirement',
  'VIONA_REQUEST_LOCAL_STATUS_REFERENCE_VALUES',
  'VIONA_REQUEST_SOURCE_OF_TRUTH_RECOMMENDATION',
  'VIONA_REQUEST_LOCAL_TO_VIONA_STATUS_MAPPINGS',
  'directReuseSafe: false',
  'DRAFT',
  'MERCHANT_REVIEW',
  'needsHumanConfirmation',
  'partnerResponded',
];

const REQUIRED_ACCESS_MATRIX_TOKENS = [
  'VionaRequestRoleTenantAccessRule',
  'VIONA_REQUEST_ROLE_TENANT_ACCESS_MATRIX',
  'VIONA_REQUEST_OPERATOR_ROLE_POLICY',
  'VionaRequestCrossUniverseLeakRisk',
  'globalOps',
  'merchantBusinessOwned',
  'requesterOwned',
  'partnerAssigned',
  'operatorRoleResolved: false',
  'universeFilter',
  'auditRead',
  'LocalMerchantRequestInbox',
  'TourismMerchantInbox',
];

const REQUIRED_PERSISTENCE_POINTER_TOKENS = [
  'sourceOfTruthMappingContractActive: true',
  'sotSignoffPhasePromotionReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
];

const REQUIRED_OPERATOR_POINTER_TOKENS = [
  'sourceOfTruthMappingContractActive: true',
  'sotSignoffPhasePromotionReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'persistenceApiActive: false',
  'mutationsBlocked: true',
  'adminDebugUsesFixturesOnly',
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

function isHumanApprovalRecorded() {
  const rel = 'src/config/vionaRequestSotHumanApprovalReadiness.ts';
  return existsSync(path.join(ROOT, rel)) && read(rel).includes('humanApprovalRecorded: true');
}

function main() {
  console.log('VIONA request source-of-truth auth tenant mapping check (Pack8)');
  console.log(
    'Docs/config/domain contracts only. No API, DB, Prisma migration, adapter, mutation, or Admin Debug data-source change.\n'
  );

  const humanApprovalRecorded = isHumanApprovalRecorded();
  const requiredConfigTokens = humanApprovalRecorded
    ? REQUIRED_CONFIG_TOKENS_APPROVED
    : REQUIRED_CONFIG_TOKENS_PENDING;

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const config = read('src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts');
  const mapping = read('src/domain/requests/vionaRequestSourceOfTruthMappingContract.ts');
  const matrix = read('src/domain/requests/vionaRequestRoleTenantAccessMatrix.ts');
  const persistence = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const operator = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const docs = read('docs/product/VIONA_REQUEST_SOURCE_OF_TRUTH_AUTH_TENANT_MAPPING.md');
  const evidence = read('docs/design/evidence/cursor-request-source-of-truth-auth-tenant-pack8/README.md');
  const combined = `${config}\n${mapping}\n${matrix}\n${persistence}\n${operator}\n${docs}\n${evidence}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const routesChanged = run('git diff --name-only origin/master -- src/navigation/routes.ts');
  const prismaChanged = run('git diff --name-only origin/master -- prisma/');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');

  const missingSafeCopy = missingValues(combined, REQUIRED_SAFE_COPY);
  const missingDocPhrases = missingValues(docs, REQUIRED_DOC_PHRASES);
  const missingConfigTokens = missingValues(config, requiredConfigTokens);
  const missingMappingTokens = missingValues(mapping, REQUIRED_MAPPING_TOKENS);
  const missingMatrixTokens = missingValues(matrix, REQUIRED_ACCESS_MATRIX_TOKENS);
  const missingPersistenceTokens = missingValues(persistence, REQUIRED_PERSISTENCE_POINTER_TOKENS);
  const missingOperatorTokens = missingValues(operator, REQUIRED_OPERATOR_POINTER_TOKENS);
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_SOURCE_OF_TRUTH_AUTH_TENANT_MAPPING.md',
    'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
    'src/domain/requests/vionaRequestSourceOfTruthMappingContract.ts',
    'src/domain/requests/vionaRequestRoleTenantAccessMatrix.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) =>
    [config, mapping, matrix].some((file) => file.includes(token))
  );

  const hasImplementation =
    /\bclass\s+\w+/.test(mapping) ||
    /\bclass\s+\w+/.test(matrix) ||
    (/\bfunction\s+\w+/.test(mapping) && !mapping.includes('export function')) ||
    combined.includes('fetch(') ||
    combined.includes('getPrisma(') ||
    combined.includes('implements VionaRequestRepositoryContract');

  if (missingFiles.length) fail('missing required files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (routesChanged) fail('routes.ts changed vs origin/master', [routesChanged]);
  if (prismaChanged) fail('prisma changed vs origin/master', [prismaChanged.split('\n')[0] || 'prisma/']);
  if (serverChanged) fail('src/server.ts changed vs origin/master', [serverChanged]);
  if (missingSafeCopy.length) fail('missing required safe copy', missingSafeCopy);
  if (missingDocPhrases.length) fail('missing doc requirements', missingDocPhrases);
  if (missingConfigTokens.length) fail('missing config tokens', missingConfigTokens);
  if (missingMappingTokens.length) fail('missing mapping contract tokens', missingMappingTokens);
  if (missingMatrixTokens.length) fail('missing access matrix tokens', missingMatrixTokens);
  if (missingPersistenceTokens.length) fail('persistence readiness Pack8 pointer missing', missingPersistenceTokens);
  if (missingOperatorTokens.length) fail('operator readiness Pack8 pointer missing', missingOperatorTokens);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports in new files', forbiddenImports);
  if (hasImplementation) fail('implementation detected in contract pack', ['types/contracts only']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack8 source-of-truth auth tenant mapping before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Config readiness flags: PASS');
  console.log('Mapping contract: PASS');
  console.log('Access matrix: PASS');
  console.log('Persistence readiness pointer: PASS');
  console.log('Operator readiness pointer: PASS');
  console.log('Required safe copy: PASS');
  console.log('No App.tsx/navigation/screen changes: PASS');
  console.log('No Prisma/API/server changes: PASS');
  console.log('No implementation added: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - source-of-truth auth tenant mapping contract is import-ready.');
}

main();
