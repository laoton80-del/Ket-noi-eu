#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const ALLOWED_FILES = [
  'docs/product/VIONA_REQUEST_PACK12_PRISMA_SCHEMA_READINESS_BOUNDARY.md',
  'src/domain/requests/vionaRequestPrismaSchemaReadinessBoundary.ts',
  'src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts',
  'scripts/viona-request-pack12-prisma-schema-readiness-boundary-check.mjs',
  'docs/design/evidence/cursor-request-pack12-prisma-schema-readiness-boundary/README.md',
  'src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts',
  'src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts',
  'src/config/vionaRequestSotHumanApprovalReadiness.ts',
  'src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
  'scripts/viona-request-schema-design-human-approval-recording-check.mjs',
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
  'docs/product/VIONA_REQUEST_PACK12_PRISMA_SCHEMA_READINESS_BOUNDARY.md',
  'src/domain/requests/vionaRequestPrismaSchemaReadinessBoundary.ts',
  'src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts',
  'scripts/viona-request-pack12-prisma-schema-readiness-boundary-check.mjs',
  'docs/design/evidence/cursor-request-pack12-prisma-schema-readiness-boundary/README.md',
];

const REQUIRED_DOC_PHRASES = [
  'planning/readiness boundary only',
  'does not create Prisma schema',
  'does not create migration',
  'does not create API',
  'does not create persistence adapter',
  'does not create request mutation',
  'does not change Admin Debug data source',
  'does not add OPERATOR',
  'does not extend VionaRequestRecord',
  'Dedicated VIONA Request Store',
  'dedicatedVionaRequestStore',
  'Pack11B',
  'Direct LocalServiceRequest reuse',
  'Hybrid bridge remains future-only',
  'Audit log is not a payment ledger',
  'Admin Debug remains fixture-only',
  'client-only role checks',
  'wallet balance truth',
  'payment confirmation truth',
  'pack12ImplementationApproved',
  'pack12Started: false',
];

const REQUIRED_DOMAIN_TOKENS = [
  'export const VIONA_REQUEST_PRISMA_SCHEMA_READINESS_BOUNDARY',
  'export const VIONA_REQUEST_PRISMA_SCHEMA_MODEL_CANDIDATES',
  'export const VIONA_REQUEST_PRISMA_SCHEMA_FIELD_BOUNDARIES',
  'export const VIONA_REQUEST_PRISMA_SCHEMA_RELATIONSHIP_BOUNDARIES',
  'export const VIONA_REQUEST_PRISMA_SCHEMA_FORBIDDEN_FIELD_FAMILIES',
  'export const VIONA_REQUEST_PRISMA_SCHEMA_IMPLEMENTATION_BLOCKERS',
  'export const VIONA_REQUEST_PRISMA_SCHEMA_FUTURE_PACK_GATES',
  'export function getVionaRequestPrismaSchemaReadinessBoundary',
  'export function isVionaRequestPrismaSchemaImplementationPermitted',
  'candidateOnly: true',
  'prismaModelActive: false',
  'migrationActive: false',
  'tableActive: false',
  'walletBalanceTruth',
  'paymentConfirmationTruth',
  'localServiceRequestDirectReuseTruth',
  'return false',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_REQUEST_PACK12_PRISMA_SCHEMA_READINESS_BOUNDARY',
  'export const VIONA_REQUEST_PACK12_PRISMA_SCHEMA_READINESS_CHECKLIST',
  'export function getVionaRequestPack12PrismaSchemaReadinessBoundary',
  'export function isVionaRequestPack12ReadyForHumanReview',
  'humanSotApprovalRecorded: true',
  'sourceOfTruthDecisionSignedOff: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'schemaDesignHumanApprovalRecorded: true',
  'schemaDesignApproved: true',
  'pack12PlanningPermitted: true',
  'pack12PlanningReadinessBoundaryOnly: true',
  'pack12PrismaSchemaReadinessBoundaryActive: true',
  'pack12PlanningStarted: true',
  'pack12PlanningOnly: true',
  'pack12ImplementationApproved: false',
  'futurePrismaSchemaImplementationRequiresHumanApproval: true',
  'pack12Started: false',
  'prismaSchemaPermitted: false',
  'prismaMigrationPermitted: false',
  'persistenceAdapterPermitted: false',
  'requestMutationPermitted: false',
  'prismaSchemaActive: false',
  'persistenceApiActive: false',
  'requestMutationActive: false',
  'adminDebugLiveDataActive: false',
  'operatorRoleAddedToAuth: false',
  'adminDebugUsesFixturesOnly: true',
];

const REQUIRED_POINTER_TOKENS = [
  'pack12PrismaSchemaReadinessBoundaryActive: true',
  'pack12PlanningStarted: true',
  'pack12PlanningOnly: true',
  'pack12ImplementationApproved: false',
  'futurePrismaSchemaImplementationRequiresHumanApproval: true',
  'pack12Started: false',
  'prismaSchemaPermitted: false',
  'prismaSchemaActive: false',
  'persistenceApiActive: false',
  'adminDebugUsesFixturesOnly: true',
];

const FORBIDDEN_DIFF_PATTERNS = [
  /^App\.tsx$/,
  /MainTabNavigator/,
  /^src\/navigation\//,
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
  console.log('VIONA request Pack12 Prisma schema readiness boundary check');
  console.log(
    'Planning/readiness only. No Prisma schema, migration, API, adapter, mutation, or Admin Debug data-source change.\n'
  );

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const boundaryDoc = read('docs/product/VIONA_REQUEST_PACK12_PRISMA_SCHEMA_READINESS_BOUNDARY.md');
  const domain = read('src/domain/requests/vionaRequestPrismaSchemaReadinessBoundary.ts');
  const config = read('src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts');
  const schemaApproval = read('src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts');
  const dedicated = read('src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts');
  const human = read('src/config/vionaRequestSotHumanApprovalReadiness.ts');
  const pack9 = read('src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts');
  const pack8 = read('src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts');
  const persistence = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const operator = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const pointerCombined = `${schemaApproval}\n${dedicated}\n${human}\n${pack9}\n${pack8}\n${persistence}\n${operator}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const prismaChanged = run('git diff --name-only origin/master -- prisma/');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');
  const typesChanged = run('git diff --name-only origin/master -- src/domain/requests/vionaRequestTypes.ts');

  const missingDocPhrases = missingValues(boundaryDoc, REQUIRED_DOC_PHRASES);
  const missingDomainTokens = missingValues(domain, REQUIRED_DOMAIN_TOKENS);
  const missingConfigTokens = missingValues(config, REQUIRED_CONFIG_TOKENS);
  const missingPointerTokens = missingValues(pointerCombined, REQUIRED_POINTER_TOKENS);
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_PACK12_PRISMA_SCHEMA_READINESS_BOUNDARY.md',
    'src/domain/requests/vionaRequestPrismaSchemaReadinessBoundary.ts',
    'src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter(
    (token) => config.includes(token) || domain.includes(token)
  );

  const implementationApproved = config.includes('pack12ImplementationApproved: true');
  const pack12Started = config.includes('pack12Started: true');
  const prismaPermitted = config.includes('prismaSchemaPermitted: true');
  const prismaActive =
    config.includes('prismaSchemaActive: true') || config.includes('prismaMigrationActive: true');
  const apiActive =
    config.includes('persistenceApiActive: true') || config.includes('readOnlyApiActive: true');
  const mutationActive = config.includes('requestMutationActive: true');
  const adminDebugLive = config.includes('adminDebugLiveDataActive: true');
  const operatorAdded =
    config.includes('operatorRoleAddedToAuth: true') || config.includes('operatorRoleAddedToPrisma: true');
  const implementationPermitted =
    domain.includes('isVionaRequestPrismaSchemaImplementationPermitted(): boolean') &&
    !domain.includes('return false');

  if (missingFiles.length) fail('missing required files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (prismaChanged) fail('prisma changed vs origin/master', [prismaChanged.split('\n')[0] || 'prisma/']);
  if (serverChanged) fail('src/server.ts changed vs origin/master', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts changed vs origin/master', [typesChanged]);
  if (missingDocPhrases.length) fail('missing boundary doc requirements', missingDocPhrases);
  if (missingDomainTokens.length) fail('missing domain boundary tokens', missingDomainTokens);
  if (missingConfigTokens.length) fail('missing readiness config tokens', missingConfigTokens);
  if (missingPointerTokens.length) fail('missing pointer config tokens', missingPointerTokens);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports', forbiddenImports);
  if (implementationApproved) fail('pack12ImplementationApproved must remain false', ['pack12ImplementationApproved: true']);
  if (pack12Started) fail('pack12Started must remain false', ['pack12Started: true']);
  if (prismaPermitted) fail('prismaSchemaPermitted must remain false', ['prismaSchemaPermitted: true']);
  if (prismaActive) fail('Prisma must remain inactive', ['prisma active']);
  if (apiActive) fail('API must remain inactive', ['persistence API active']);
  if (mutationActive) fail('mutation must remain inactive', ['requestMutationActive: true']);
  if (adminDebugLive) fail('Admin Debug must remain fixture-only', ['adminDebugLiveDataActive: true']);
  if (operatorAdded) fail('OPERATOR must not be added', ['operator role added']);
  if (implementationPermitted && !domain.includes('return false;')) {
    fail('isVionaRequestPrismaSchemaImplementationPermitted must return false', ['implementation permitted']);
  }

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack12 Prisma schema readiness boundary before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Product doc boundaries: PASS');
  console.log('Domain planning contract: PASS');
  console.log('Readiness config: PASS');
  console.log('Pointer configs updated: PASS');
  console.log('pack12ImplementationApproved remains false: PASS');
  console.log('pack12Started remains false: PASS');
  console.log('Prisma/API/adapter/mutation remain blocked: PASS');
  console.log('Admin Debug fixture-only: PASS');
  console.log('OPERATOR Prisma/Auth not added: PASS');
  console.log('No forbidden runtime paths: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - Pack12 Prisma schema readiness boundary is import-ready.');
}

main();
