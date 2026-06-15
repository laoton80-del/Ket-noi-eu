#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const ALLOWED_FILES = [
  'docs/product/VIONA_REQUEST_SOT_SIGNOFF_PHASE_PROMOTION_READINESS.md',
  'src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts',
  'src/domain/requests/vionaRequestPhasePromotionContract.ts',
  'src/domain/requests/vionaRequestDedicatedStoreFieldManifest.ts',
  'scripts/viona-request-sot-signoff-phase-promotion-readiness-check.mjs',
  'docs/design/evidence/cursor-request-sot-signoff-phase-promotion-pack9/README.md',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
  'scripts/viona-request-source-of-truth-auth-tenant-mapping-check.mjs',
  'scripts/viona-request-persistence-audit-readiness-check.mjs',
  'scripts/viona-operator-inbox-admin-debug-preview-check.mjs',
  'scripts/viona-operator-inbox-admin-route-readiness-check.mjs',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
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
];

const REQUIRED_SAFE_COPY = [
  'Source-of-truth sign-off phase promotion readiness contract',
  'Sign-off status pending',
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
  'Direct LocalServiceRequest reuse is not allowed',
  'Client-only role checks are not sufficient for persistence APIs',
  'Cursor/agent cannot flip source-of-truth sign-off',
];

const REQUIRED_DOC_PHRASES = [
  'Why Pack9 exists',
  '26d6018',
  'PR #63',
  'Sign-off status pending',
  'dedicatedVionaRequestStore',
  'Direct LocalServiceRequest reuse rejected',
  'Cursor/agent cannot flip',
  'OPERATOR',
  'ADMIN-equivalent',
  'auditRead',
  'field manifest',
  'not Prisma schema',
  'No API',
  'No DB',
  'No Prisma migration',
  'No persistence adapter',
  'Fixture-only Admin Debug',
  'sourceOfTruthDecisionSignedOff: false',
];

const REQUIRED_CONFIG_TOKENS_PENDING = [
  'export const VIONA_REQUEST_SOT_SIGNOFF_PHASE_PROMOTION_READINESS',
  'export const VIONA_REQUEST_SOT_SIGNOFF_CHECKLIST',
  'export { VIONA_REQUEST_PHASE_PROMOTION_STAGES }',
  'export function getVionaRequestSotSignoffPhasePromotionReadiness',
  'export function isVionaRequestSotSignoffPromotionBlocked',
  'sotSignoffReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  "signOffStatus: 'pending'",
  'sourceOfTruthDecisionSignedOff: false',
  'selectedSourceOfTruthOptionId: null',
  "recommendedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'founderSignoffRecorded: false',
  'architectSignoffRecorded: false',
  'operatorRoleAddedToAuth: false',
  'readOnlyApiPhasePromoted: false',
  'schemaDesignApproved: false',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'auditLogActive: false',
  'requestMutationActive: false',
  'productionLiveOpsActive: false',
  'adminDebugUsesFixturesOnly: true',
  'agentMayFlipSignoff: false',
];

const REQUIRED_CONFIG_TOKENS_APPROVED = [
  'export const VIONA_REQUEST_SOT_SIGNOFF_PHASE_PROMOTION_READINESS',
  'export const VIONA_REQUEST_SOT_SIGNOFF_CHECKLIST',
  'export { VIONA_REQUEST_PHASE_PROMOTION_STAGES }',
  'export function getVionaRequestSotSignoffPhasePromotionReadiness',
  'export function isVionaRequestSotSignoffPromotionBlocked',
  'sotSignoffReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'humanApprovalRecordActive: true',
  'pack11DiscoveryPermitted: true',
  'pack11SchemaDesignContractOnly: true',
  'pack11Started: false',
  "signOffStatus: 'approved'",
  'sourceOfTruthDecisionSignedOff: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'founderSignoffRecorded: true',
  'architectSignoffRecorded: true',
  'operatorRoleAddedToAuth: false',
  'schemaDesignApproved: false',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'auditLogActive: false',
  'requestMutationActive: false',
  'productionLiveOpsActive: false',
  'adminDebugUsesFixturesOnly: true',
  'agentMayFlipSignoff: false',
];

const REQUIRED_CONFIG_TOKENS_SCHEMA_DESIGN_APPROVED = [
  ...REQUIRED_CONFIG_TOKENS_APPROVED.filter((token) => token !== 'schemaDesignApproved: false'),
  'schemaDesignHumanApprovalRecorded: true',
  'schemaDesignApproved: true',
  'pack12PlanningPermitted: true',
  'pack12PlanningReadinessBoundaryOnly: true',
  'pack12Started: false',
  'schemaDesignReviewRequired: false',
];

const REQUIRED_CONFIG_TOKENS = REQUIRED_CONFIG_TOKENS_PENDING;

const REQUIRED_PHASE_CONTRACT_TOKENS = [
  'VionaRequestPhasePromotionStage',
  'VionaRequestPhasePromotionStatus',
  'VionaRequestPhasePromotionGate',
  'VionaRequestSotSignoffRole',
  'VionaRequestSotSignoffChecklistItem',
  'VionaRequestSotSignoffRecord',
  'VionaRequestPhasePromotionContract',
  'VIONA_REQUEST_PHASE_PROMOTION_CONTRACT',
  'VIONA_REQUEST_SOT_SIGNOFF_ROLES',
  'agentSignoffForbidden: true',
  'sourceOfTruthDecisionSignedOff: false',
  'agentOrCursorMayFlipSignoff: false',
  'founder',
  'principalArchitect',
  'opsRunbookOwner',
];

const REQUIRED_FIELD_MANIFEST_TOKENS = [
  'VionaRequestDedicatedStoreFieldCategory',
  'VionaRequestDedicatedStoreFieldRequirement',
  'VionaRequestDedicatedStoreField',
  'VIONA_REQUEST_DEDICATED_STORE_FIELD_MANIFEST',
  'VIONA_REQUEST_LOCAL_FIELD_COPY_BLOCKLIST',
  'isPrismaSchema: false',
  'migrationInThisPack: false',
  'walletMode',
  'walletPhase',
  'requesterUserId',
  'createdAt',
  'updatedAt',
  'idempotencyKey',
];

const REQUIRED_PACK8_POINTER_TOKENS_PENDING = [
  'sotSignoffPhasePromotionReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'sourceOfTruthDecisionSignedOff: false',
  'persistenceApiActive: false',
];

const REQUIRED_PACK8_POINTER_TOKENS_APPROVED = [
  'sotSignoffPhasePromotionReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'humanApprovalRecordActive: true',
  'sourceOfTruthDecisionSignedOff: true',
  'persistenceApiActive: false',
];

const REQUIRED_PACK8_POINTER_TOKENS = REQUIRED_PACK8_POINTER_TOKENS_PENDING;

const REQUIRED_PERSISTENCE_POINTER_TOKENS = [
  'sotSignoffPhasePromotionReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'persistenceApiActive: false',
  'sourceOfTruthMappingContractActive: true',
];

const REQUIRED_OPERATOR_POINTER_TOKENS = [
  'sotSignoffPhasePromotionReadinessContractActive: true',
  'founderArchitectSignoffPacketActive: true',
  'adminDebugUsesFixturesOnly: true',
  'persistenceApiActive: false',
  'mutationsBlocked: true',
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

function isHumanApprovalRecorded() {
  const rel = 'src/config/vionaRequestSotHumanApprovalReadiness.ts';
  return existsSync(path.join(ROOT, rel)) && read(rel).includes('humanApprovalRecorded: true');
}

function isSchemaDesignHumanApprovalRecorded() {
  const rel = 'src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts';
  return existsSync(path.join(ROOT, rel)) && read(rel).includes('schemaDesignHumanApprovalRecorded: true');
}

function main() {
  console.log('VIONA request SoT sign-off phase promotion readiness check (Pack9)');
  console.log(
    'Docs/config/domain contracts only. No API, DB, Prisma migration, adapter, sign-off flip, or Admin Debug data-source change.\n'
  );

  const humanApprovalRecorded = isHumanApprovalRecorded();
  const schemaDesignHumanApprovalRecorded = isSchemaDesignHumanApprovalRecorded();
  const requiredConfigTokens = schemaDesignHumanApprovalRecorded
    ? REQUIRED_CONFIG_TOKENS_SCHEMA_DESIGN_APPROVED
    : humanApprovalRecorded
      ? REQUIRED_CONFIG_TOKENS_APPROVED
      : REQUIRED_CONFIG_TOKENS_PENDING;
  const requiredPack8Tokens = humanApprovalRecorded
    ? REQUIRED_PACK8_POINTER_TOKENS_APPROVED
    : REQUIRED_PACK8_POINTER_TOKENS_PENDING;

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const config = read('src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts');
  const phaseContract = read('src/domain/requests/vionaRequestPhasePromotionContract.ts');
  const fieldManifest = read('src/domain/requests/vionaRequestDedicatedStoreFieldManifest.ts');
  const pack8 = read('src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts');
  const persistence = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const operator = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const docs = read('docs/product/VIONA_REQUEST_SOT_SIGNOFF_PHASE_PROMOTION_READINESS.md');
  const evidence = read('docs/design/evidence/cursor-request-sot-signoff-phase-promotion-pack9/README.md');
  const combined = `${config}\n${phaseContract}\n${fieldManifest}\n${pack8}\n${persistence}\n${operator}\n${docs}\n${evidence}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const routesChanged = run('git diff --name-only origin/master -- src/navigation/routes.ts');
  const prismaChanged = run('git diff --name-only origin/master -- prisma/');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');

  const missingSafeCopy = missingValues(combined, REQUIRED_SAFE_COPY);
  const missingDocPhrases = missingValues(docs, REQUIRED_DOC_PHRASES);
  const missingConfigTokens = missingValues(config, requiredConfigTokens);
  const missingPhaseTokens = missingValues(phaseContract, REQUIRED_PHASE_CONTRACT_TOKENS);
  const missingManifestTokens = missingValues(fieldManifest, REQUIRED_FIELD_MANIFEST_TOKENS);
  const missingPack8Tokens = missingValues(pack8, requiredPack8Tokens);
  const missingPersistenceTokens = missingValues(persistence, REQUIRED_PERSISTENCE_POINTER_TOKENS);
  const missingOperatorTokens = missingValues(operator, REQUIRED_OPERATOR_POINTER_TOKENS);
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_SOT_SIGNOFF_PHASE_PROMOTION_READINESS.md',
    'src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts',
    'src/domain/requests/vionaRequestPhasePromotionContract.ts',
    'src/domain/requests/vionaRequestDedicatedStoreFieldManifest.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) =>
    [config, phaseContract, fieldManifest].some((file) => file.includes(token))
  );

  const signoffFlipped = humanApprovalRecorded
    ? config.includes('agentMayFlipSignoff: true')
    : config.includes('sourceOfTruthDecisionSignedOff: true') ||
      config.includes('founderSignoffRecorded: true') ||
      config.includes('architectSignoffRecorded: true') ||
      config.includes('agentMayFlipSignoff: true');

  const hasImplementation =
    /\bclass\s+\w+/.test(phaseContract) ||
    /\bclass\s+\w+/.test(fieldManifest) ||
    combined.includes('implements VionaRequestRepositoryContract') ||
    combined.includes('getPrisma(') ||
    combined.includes('fetch(');

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
  if (missingPhaseTokens.length) fail('missing phase promotion contract tokens', missingPhaseTokens);
  if (missingManifestTokens.length) fail('missing field manifest tokens', missingManifestTokens);
  if (missingPack8Tokens.length) fail('Pack8 readiness Pack9 pointer missing', missingPack8Tokens);
  if (missingPersistenceTokens.length) fail('persistence readiness Pack9 pointer missing', missingPersistenceTokens);
  if (missingOperatorTokens.length) fail('operator readiness Pack9 pointer missing', missingOperatorTokens);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports in new files', forbiddenImports);
  if (signoffFlipped) {
    fail(
      humanApprovalRecorded ? 'agentMayFlipSignoff must remain false' : 'sign-off must remain false in Pack9',
      [humanApprovalRecorded ? 'agentMayFlipSignoff: true' : 'sourceOfTruthDecisionSignedOff or agent flip detected']
    );
  }
  if (hasImplementation) fail('implementation detected in contract pack', ['types/contracts only']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack9 sign-off phase promotion readiness before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Config readiness flags: PASS');
  console.log('Phase promotion contract: PASS');
  console.log('Dedicated store field manifest: PASS');
  console.log('Pack8/Pack7/Pack6 pointers: PASS');
  console.log('Required safe copy: PASS');
  console.log(humanApprovalRecorded ? 'Human approval recorded: PASS' : 'Sign-off remains false: PASS');
  console.log('No App.tsx/navigation/screen changes: PASS');
  console.log('No Prisma/API/server changes: PASS');
  console.log('No implementation added: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - SoT sign-off phase promotion readiness contract is import-ready.');
}

main();
