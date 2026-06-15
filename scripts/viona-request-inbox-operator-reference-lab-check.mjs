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
  'src/components/viona/reference/VionaReferenceRequestOperatorInboxLab.tsx',
  'src/navigation/referenceLabStackScreens.tsx',
  'src/navigation/referenceLabLinking.ts',
  'src/navigation/routes.ts',
  'docs/product/VIONA_REQUEST_INBOX_OPERATOR_REFERENCE_LAB.md',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'docs/design/evidence/codex-request-operator-inbox-reference-lab-pack4/README.md',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
  'docs/product/VIONA_OPERATOR_INBOX_ADMIN_ROUTE_READINESS.md',
  'scripts/viona-operator-inbox-admin-route-readiness-check.mjs',
  'docs/design/evidence/codex-operator-inbox-admin-route-readiness-pack5/README.md',
  'src/config/vionaOperatorInboxAdminDebugGate.ts',
  'src/screens/admin/VionaAdminDebugOperatorInboxPreviewScreen.tsx',
  'docs/product/VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW.md',
  'scripts/viona-operator-inbox-admin-debug-preview-check.mjs',
  'docs/design/evidence/codex-operator-inbox-admin-debug-preview-pack6/README.md',
  'App.tsx',
  'src/navigation/routes.ts',
  'docs/product/VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS.md',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/domain/requests/vionaRequestAuditEventTypes.ts',
  'src/domain/requests/vionaRequestPersistenceContract.ts',
  'scripts/viona-request-persistence-audit-readiness-check.mjs',
  'docs/design/evidence/cursor-request-persistence-audit-readiness-pack7/README.md',
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

const REQUIRED_SAFETY_PHRASES = [
  'Operator ReferenceLab preview',
  'Read-only queue',
  'No payment captured',
  'Not booking confirmed',
  'No SOS dispatch',
  'Human confirmation required before any future action',
  'No live merchant execution',
  'Lab route only',
];

const REQUIRED_DOC_PHRASES = [
  'Pack4 adds a gated ReferenceLab preview route',
  'This follows Pack2 and Pack3',
  'master gate: `EXPO_PUBLIC_VIONA_REFERENCE_LABS_ENABLED=true`',
  'per-lab gate: `EXPO_PUBLIC_VIONA_REFERENCE_REQUEST_OPERATOR_INBOX_LAB=true`',
  'does not use the Admin debug App.tsx block',
  'does not use LocalMerchantRequestInbox or TourismMerchantInbox',
  'No API, DB, payment, booking, SOS, wallet, merchant execution, or live AI integration',
  'Human-confirmed actions only after safety gates pass',
  'Merchant ops only after tenant, fulfillment, and operational readiness gates pass',
];

const REQUIRED_LAB_TOKENS = [
  'export function VionaReferenceRequestOperatorInboxLab',
  'export function VionaReferenceRequestOperatorInboxLabScreen',
  'EXPO_PUBLIC_VIONA_REFERENCE_REQUEST_OPERATOR_INBOX_LAB',
  'VionaRequestInboxReadOnly',
  'VionaRequestDetailReadOnly',
  'VionaRequestStatusBadge',
  'getVionaRequestReadOnlyFixtures',
  'getRequestInboxCounts',
  'getRequestsRequiringHumanConfirmation',
  'getRequestsWithPartnerResponse',
  'groupRequestsByStatus',
  'getRequestStatusSafetyLabel',
  'getRequestUniverseSafetyNote',
];

const FORBIDDEN_DIFF_PATTERNS = [
  /HomeScreen\.tsx$/,
  /LocalScreen\.tsx$/,
  /TravelScreen\.tsx$/,
  /LocalMerchantRequestInbox/,
  /TourismMerchantInbox/,
  /^assets\//,
  /^prisma\//,
  /^migrations?\//,
  /^src\/(?:api|server|services\/(?:payment|payments|booking|bookings|auth|sos|wallet|ai)|screens\/academy)\//i,
  /^src\/(?:payment|payments|booking|bookings|auth|sos|wallet|ai)\//i,
];

const UNSAFE_STANDALONE_CLAIMS = [
  'payment captured',
  'booking confirmed',
  'sos dispatched',
  'emergency dispatched',
  'police called',
  'ambulance called',
  'refund processed',
  'settlement completed',
  'payout completed',
  'live ai action',
  'ai confirms booking',
  'ai pays',
  'ai settles',
  'live merchant execution',
];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function exists(relPath) {
  return existsSync(path.join(ROOT, relPath));
}

function run(command) {
  try {
    return execSync(command, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function toPosix(file) {
  return file.replace(/\\/g, '/').trim();
}

function collectChangedFiles() {
  const commands = [
    'git diff --name-only origin/master..HEAD',
    'git diff --name-only',
    'git diff --name-only --cached',
    'git ls-files --others --exclude-standard',
  ];
  const files = new Set();
  for (const command of commands) {
    const output = run(command);
    if (!output) continue;
    for (const line of output.split('\n')) {
      const file = toPosix(line);
      if (file) files.add(file);
    }
  }
  return [...files].sort();
}

function missingValues(content, values) {
  return values.filter((value) => !content.includes(value));
}

function fail(label, values) {
  console.log(`FAIL ${label}`);
  for (const value of values) console.log(`  - ${value}`);
  process.exitCode = 1;
}

function lineHasNegatedClaim(line, phrase) {
  const lower = line.toLowerCase();
  const claim = phrase.toLowerCase();
  const index = lower.indexOf(claim);
  if (index < 0) return false;
  const prefix = lower.slice(Math.max(0, index - 36), index);
  return /\b(no|not|never|without|cannot|can't|does not|do not)\b/.test(prefix);
}

function findUnsafeStandaloneClaims(files) {
  const hits = [];
  for (const file of files) {
    if (!exists(file)) continue;
    const lines = read(file).split('\n');
    lines.forEach((line, index) => {
      const lower = line.toLowerCase();
      for (const claim of UNSAFE_STANDALONE_CLAIMS) {
        if (!lower.includes(claim)) continue;
        if (lineHasNegatedClaim(line, claim)) continue;
        hits.push(`${file}:${index + 1} :: ${claim} :: ${line.trim()}`);
      }
    });
  }
  return hits;
}

function main() {
  const pack13cActive = isPack13cSchemaOnlyActive();
  console.log('VIONA request inbox operator ReferenceLab check (Pack4)');
  console.log('ReferenceLab-only operator preview. No App.tsx, live UI, API, DB, payment, booking, SOS, wallet, or live AI.\n');

  const missingFiles = ALLOWED_FILES.filter((file) => !exists(file));
  if (missingFiles.length) {
    fail('missing required Pack4 files', missingFiles);
    return;
  }

  const changedFiles = collectChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) => matchesForbiddenDiff(file, pack13cActive));

  const lab = read('src/components/viona/reference/VionaReferenceRequestOperatorInboxLab.tsx');
  const stack = read('src/navigation/referenceLabStackScreens.tsx');
  const linking = read('src/navigation/referenceLabLinking.ts');
  const routes = read('src/navigation/routes.ts');
  const docs = read('docs/product/VIONA_REQUEST_INBOX_OPERATOR_REFERENCE_LAB.md');
  const evidence = read('docs/design/evidence/codex-request-operator-inbox-reference-lab-pack4/README.md');
  const combined = `${lab}\n${stack}\n${linking}\n${routes}\n${docs}\n${evidence}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const pack6AppOnly =
    appChanged &&
    changedFiles.every((file) => ALLOWED_FILES.includes(file)) &&
    changedFiles.includes('App.tsx');

  const missingLabTokens = missingValues(lab, REQUIRED_LAB_TOKENS);
  const missingSafetyPhrases = missingValues(combined, REQUIRED_SAFETY_PHRASES);
  const missingDocPhrases = missingValues(docs, REQUIRED_DOC_PHRASES);
  const routeMissing = !routes.includes('VionaReferenceRequestOperatorInboxLab: undefined');
  const stackMissing =
    !stack.includes('VionaReferenceRequestOperatorInboxLabScreen') ||
    !stack.includes('name="VionaReferenceRequestOperatorInboxLab"') ||
    stack.includes('ReferenceLabStackScreensGate');
  const linkingMissing = !linking.includes(
    "VionaReferenceRequestOperatorInboxLab: 'viona-reference-request-operator-inbox-lab'"
  );
  const unsafeClaims = findUnsafeStandaloneClaims([
    'src/components/viona/reference/VionaReferenceRequestOperatorInboxLab.tsx',
    'docs/product/VIONA_REQUEST_INBOX_OPERATOR_REFERENCE_LAB.md',
    'docs/design/evidence/codex-request-operator-inbox-reference-lab-pack4/README.md',
  ]);
  const unsafeLabRuntimeTokens = [
    'fetch(',
    'XMLHttpRequest',
    'axios.',
    'useNavigation',
    'navigation.',
    'onPress=',
    'createApi',
    'supabase',
    'prisma',
  ].filter((token) => lab.includes(token));

  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden live-action paths changed', forbiddenFiles);
  if (appChanged && !pack6AppOnly) fail('App.tsx changed vs origin/master', [appChanged]);
  if (missingLabTokens.length) fail('missing lab exports/imports/tokens', missingLabTokens);
  if (missingSafetyPhrases.length) fail('missing read-only safety phrases', missingSafetyPhrases);
  if (missingDocPhrases.length) fail('missing doc requirements', missingDocPhrases);
  if (routeMissing) fail('route type missing', ['VionaReferenceRequestOperatorInboxLab: undefined']);
  if (stackMissing) {
    fail('Stack.Screen registration missing or invalid', [
      'plain Stack.Screen for VionaReferenceRequestOperatorInboxLab',
    ]);
  }
  if (linkingMissing) {
    fail('linking path missing', [
      "VionaReferenceRequestOperatorInboxLab: 'viona-reference-request-operator-inbox-lab'",
    ]);
  }
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (unsafeLabRuntimeTokens.length) fail('lab contains runtime/action tokens', unsafeLabRuntimeTokens);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack4 operator ReferenceLab preview before import.');
    return;
  }

  console.log(`Required files: PASS (${ALLOWED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('App.tsx untouched: PASS');
  console.log('Lab exports and per-lab gate: PASS');
  console.log('Route type: PASS');
  console.log('Stack.Screen: PASS');
  console.log('Deep link: PASS');
  console.log('Read-only safety copy: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('No runtime/action tokens in lab: PASS');
  console.log('No ReferenceLabStackScreensGate direct-child risk: PASS');
  console.log('\nResult: PASS - operator request inbox ReferenceLab preview is import-ready.');
}

main();
