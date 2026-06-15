#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const ALLOWED_FILES = [
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
  'src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
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
  'docs/product/VIONA_REQUEST_SOT_FOUNDER_ARCHITECT_SIGNOFF_PACKET.md',
  'src/config/vionaRequestSotFounderArchitectSignoffPacketReadiness.ts',
  'scripts/viona-request-sot-founder-architect-signoff-packet-check.mjs',
  'docs/design/evidence/cursor-request-sot-signoff-packet-pack10/README.md',
];

const REQUIRED_SAFE_COPY = [
  'Founder/Architect Source-of-Truth Sign-off Packet',
  'This packet does not record sign-off',
  'sourceOfTruthDecisionSignedOff remains false',
  'Founder/architect sign-off is pending',
  'Cursor/agent cannot record source-of-truth sign-off',
  'Dedicated VIONA Request Store is the recommended long-term candidate',
  'Direct LocalServiceRequest reuse is not allowed',
  'Hybrid bridge remains future-only',
  'OPERATOR is not a Prisma/Auth role yet',
  'No database schema or migration in this pack',
  'No API or persistence adapter in this pack',
  'Fixture-only Admin Debug preview remains unchanged',
  'No payment captured',
  'Not booking confirmed',
  'No SOS dispatch',
  'No live merchant execution',
  'Human confirmation required before any future protected action',
  'Audit log is not a ledger',
];

const REQUIRED_DOC_PHRASES = [
  '1777583',
  'PENDING',
  'This packet does not record sign-off',
  'dedicatedVionaRequestStore',
  'Direct LocalServiceRequest reuse is not allowed',
  'Hybrid bridge remains future-only',
  'Cursor/agent cannot record source-of-truth sign-off',
  'OPERATOR is not a Prisma/Auth role yet',
  'ADMIN-equivalent',
  'auditRead',
  'field manifest is not Prisma schema',
  'No API',
  'No DB',
  'Pack11',
  'sourceOfTruthDecisionSignedOff remains false',
];

const REQUIRED_CONFIG_TOKENS_PENDING = [
  'export const VIONA_REQUEST_SOT_FOUNDER_ARCHITECT_SIGNOFF_PACKET_READINESS',
  'export const VIONA_REQUEST_SOT_FOUNDER_ARCHITECT_SIGNOFF_PACKET_CHECKLIST',
  'export function getVionaRequestSotFounderArchitectSignoffPacketReadiness',
  'export function isVionaRequestSotFounderArchitectSignoffPacketBlocked',
  'founderArchitectSignoffPacketActive: true',
  'signOffPacketPrepared: true',
  "signOffStatus: 'pending'",
  'sourceOfTruthDecisionSignedOff: false',
  'selectedSourceOfTruthOptionId: null',
  "recommendedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'founderSignoffRecorded: false',
  'architectSignoffRecorded: false',
  'productOwnerSignoffRecorded: false',
  'safetyOwnerSignoffRecorded: false',
  'opsRunbookOwnerSignoffRecorded: false',
  'operatorRoleAddedToAuth: false',
  'operatorPolicyResolvedForImplementation: false',
  'schemaDesignApproved: false',
  'readOnlyApiPhasePromoted: false',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'auditLogActive: false',
  'requestMutationActive: false',
  'productionLiveOpsActive: false',
  'adminDebugUsesFixturesOnly: true',
  'agentMayFlipSignoff: false',
];

const REQUIRED_CONFIG_TOKENS_APPROVED = [
  'export const VIONA_REQUEST_SOT_FOUNDER_ARCHITECT_SIGNOFF_PACKET_READINESS',
  'export const VIONA_REQUEST_SOT_FOUNDER_ARCHITECT_SIGNOFF_PACKET_CHECKLIST',
  'export function getVionaRequestSotFounderArchitectSignoffPacketReadiness',
  'export function isVionaRequestSotFounderArchitectSignoffPacketBlocked',
  'founderArchitectSignoffPacketActive: true',
  'signOffPacketPrepared: true',
  'humanApprovalRecordActive: true',
  'pack11DiscoveryPermitted: true',
  'pack11SchemaDesignContractOnly: true',
  'pack11Started: false',
  "signOffStatus: 'approved'",
  'sourceOfTruthDecisionSignedOff: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  "recommendedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'founderSignoffRecorded: true',
  'architectSignoffRecorded: true',
  'operatorRoleAddedToAuth: false',
  'schemaDesignApproved: false',
  'readOnlyApiPhasePromoted: false',
  'persistenceApiActive: false',
  'prismaSchemaActive: false',
  'auditLogActive: false',
  'requestMutationActive: false',
  'productionLiveOpsActive: false',
  'adminDebugUsesFixturesOnly: true',
  'agentMayFlipSignoff: false',
];

const REQUIRED_CONFIG_TOKENS = REQUIRED_CONFIG_TOKENS_PENDING;

const REQUIRED_PACK9_POINTER_TOKENS_PENDING = [
  'founderArchitectSignoffPacketActive: true',
  'sourceOfTruthDecisionSignedOff: false',
  'agentMayFlipSignoff: false',
  'founderSignoffRecorded: false',
  'architectSignoffRecorded: false',
];

const REQUIRED_PACK9_POINTER_TOKENS_APPROVED = [
  'founderArchitectSignoffPacketActive: true',
  'humanApprovalRecordActive: true',
  'pack11DiscoveryPermitted: true',
  'sourceOfTruthDecisionSignedOff: true',
  'agentMayFlipSignoff: false',
  'founderSignoffRecorded: true',
  'architectSignoffRecorded: true',
];

const REQUIRED_PACK9_POINTER_TOKENS = REQUIRED_PACK9_POINTER_TOKENS_PENDING;

const REQUIRED_PACK8_POINTER_TOKENS_PENDING = [
  'founderArchitectSignoffPacketActive: true',
  'sourceOfTruthDecisionSignedOff: false',
  'persistenceApiActive: false',
];

const REQUIRED_PACK8_POINTER_TOKENS_APPROVED = [
  'founderArchitectSignoffPacketActive: true',
  'humanApprovalRecordActive: true',
  'sourceOfTruthDecisionSignedOff: true',
  'persistenceApiActive: false',
];

const REQUIRED_PACK8_POINTER_TOKENS = REQUIRED_PACK8_POINTER_TOKENS_PENDING;

const REQUIRED_PERSISTENCE_POINTER_TOKENS = [
  'founderArchitectSignoffPacketActive: true',
  'persistenceApiActive: false',
  'sotSignoffPhasePromotionReadinessContractActive: true',
];

const REQUIRED_OPERATOR_POINTER_TOKENS = [
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

function isHumanApprovalRecorded() {
  const rel = 'src/config/vionaRequestSotHumanApprovalReadiness.ts';
  return existsSync(path.join(ROOT, rel)) && read(rel).includes('humanApprovalRecorded: true');
}

function main() {
  console.log('VIONA request SoT founder/architect sign-off packet check (Pack10)');
  console.log(
    'Docs/config/check-script only. No sign-off flip, API, DB, Prisma, adapter, route, mutation, or Admin Debug data-source change.\n'
  );

  const humanApprovalRecorded = isHumanApprovalRecorded();
  const requiredConfigTokens = humanApprovalRecorded
    ? REQUIRED_CONFIG_TOKENS_APPROVED
    : REQUIRED_CONFIG_TOKENS_PENDING;
  const requiredPack9Tokens = humanApprovalRecorded
    ? REQUIRED_PACK9_POINTER_TOKENS_APPROVED
    : REQUIRED_PACK9_POINTER_TOKENS_PENDING;
  const requiredPack8Tokens = humanApprovalRecorded
    ? REQUIRED_PACK8_POINTER_TOKENS_APPROVED
    : REQUIRED_PACK8_POINTER_TOKENS_PENDING;

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const config = read('src/config/vionaRequestSotFounderArchitectSignoffPacketReadiness.ts');
  const pack9 = read('src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts');
  const pack8 = read('src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts');
  const persistence = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const operator = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const docs = read('docs/product/VIONA_REQUEST_SOT_FOUNDER_ARCHITECT_SIGNOFF_PACKET.md');
  const evidence = read('docs/design/evidence/cursor-request-sot-signoff-packet-pack10/README.md');
  const combined = `${config}\n${pack9}\n${pack8}\n${persistence}\n${operator}\n${docs}\n${evidence}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const routesChanged = run('git diff --name-only origin/master -- src/navigation/routes.ts');
  const prismaChanged = run('git diff --name-only origin/master -- prisma/');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');
  const typesChanged = run('git diff --name-only origin/master -- src/domain/requests/vionaRequestTypes.ts');

  const missingSafeCopy = missingValues(combined, REQUIRED_SAFE_COPY);
  const missingDocPhrases = missingValues(docs, REQUIRED_DOC_PHRASES);
  const missingConfigTokens = missingValues(config, requiredConfigTokens);
  const missingPack9Tokens = missingValues(pack9, requiredPack9Tokens);
  const missingPack8Tokens = missingValues(pack8, requiredPack8Tokens);
  const missingPersistenceTokens = missingValues(persistence, REQUIRED_PERSISTENCE_POINTER_TOKENS);
  const missingOperatorTokens = missingValues(operator, REQUIRED_OPERATOR_POINTER_TOKENS);
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_SOT_FOUNDER_ARCHITECT_SIGNOFF_PACKET.md',
    'src/config/vionaRequestSotFounderArchitectSignoffPacketReadiness.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) => config.includes(token));

  const signoffFlipped = humanApprovalRecorded
    ? config.includes('agentMayFlipSignoff: true')
    : config.includes('sourceOfTruthDecisionSignedOff: true') ||
      pack9.includes('sourceOfTruthDecisionSignedOff: true') ||
      config.includes('founderSignoffRecorded: true') ||
      config.includes('architectSignoffRecorded: true') ||
      config.includes('agentMayFlipSignoff: true') ||
      config.includes("signOffStatus: 'approved'") ||
      config.includes('signOffStatus: "approved"');

  const packetRecordsSignoff =
    docs.includes('sign-off recorded') && !docs.toLowerCase().includes('does not record sign-off');

  const prismaOperatorAdded =
    run('git diff origin/master..HEAD -- prisma/schema.prisma').includes('OPERATOR') ||
    combined.includes('operatorRoleAddedToAuth: true');

  if (missingFiles.length) fail('missing required files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (routesChanged) fail('routes.ts changed vs origin/master', [routesChanged]);
  if (prismaChanged) fail('prisma changed vs origin/master', [prismaChanged.split('\n')[0] || 'prisma/']);
  if (serverChanged) fail('src/server.ts changed vs origin/master', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts changed vs origin/master', [typesChanged]);
  if (missingSafeCopy.length) fail('missing required safe copy', missingSafeCopy);
  if (missingDocPhrases.length) fail('missing doc requirements', missingDocPhrases);
  if (missingConfigTokens.length) fail('missing config tokens', missingConfigTokens);
  if (missingPack9Tokens.length) fail('Pack9 readiness Pack10 pointer missing', missingPack9Tokens);
  if (missingPack8Tokens.length) fail('Pack8 readiness Pack10 pointer missing', missingPack8Tokens);
  if (missingPersistenceTokens.length) fail('persistence readiness Pack10 pointer missing', missingPersistenceTokens);
  if (missingOperatorTokens.length) fail('operator readiness Pack10 pointer missing', missingOperatorTokens);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports in Pack10 config', forbiddenImports);
  if (signoffFlipped) {
    fail(
      humanApprovalRecorded ? 'agentMayFlipSignoff must remain false' : 'sign-off must remain false in Pack10',
      [humanApprovalRecorded ? 'agentMayFlipSignoff: true' : 'sourceOfTruthDecisionSignedOff or sign-off flip detected']
    );
  }
  if (packetRecordsSignoff) fail('packet must not record sign-off', ['sign-off recorded without negation']);
  if (prismaOperatorAdded) fail('OPERATOR must not be added', ['OPERATOR role or operatorRoleAddedToAuth: true']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack10 founder/architect sign-off packet before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Config readiness flags: PASS');
  console.log(humanApprovalRecorded ? 'Human approval recorded: PASS' : 'Human sign-off blanks pending: PASS');
  console.log('Pack9/Pack8/Pack7/Pack6 pointers: PASS');
  console.log('Required safe copy: PASS');
  console.log(humanApprovalRecorded ? 'Human approval flags recorded: PASS' : 'Sign-off remains false: PASS');
  console.log('No App.tsx/navigation/screen changes: PASS');
  console.log('No Prisma/API/server/types changes: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - SoT founder/architect sign-off packet is import-ready.');
}

main();
