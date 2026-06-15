#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const ALLOWED_FILES = [
  'src/config/vionaOperatorInboxAdminDebugGate.ts',
  'src/screens/admin/VionaAdminDebugOperatorInboxPreviewScreen.tsx',
  'docs/product/VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW.md',
  'scripts/viona-operator-inbox-admin-debug-preview-check.mjs',
  'docs/design/evidence/codex-operator-inbox-admin-debug-preview-pack6/README.md',
  'App.tsx',
  'src/navigation/routes.ts',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
  'scripts/viona-operator-inbox-admin-route-readiness-check.mjs',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
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
];

const REQUIRED_SAFE_COPY = [
  'Admin Debug preview',
  'Read-only operator preview',
  'Fixture data only',
  'No payment captured',
  'Not booking confirmed',
  'No SOS dispatch',
  'No live merchant execution',
  'Human confirmation required before any future protected action',
  'API and persistence are future gates',
];

const REQUIRED_DOC_PHRASES = [
  'Pack6 adds the first controlled promotion',
  'Why App.tsx Touch Is Allowed Here',
  'Admin Debug Only',
  'EXPO_PUBLIC_VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW=true',
  'serverRole === \'ADMIN\'',
  'Fixture-Only Data',
  'No LocalOpsAudit API reuse',
  'No AdminCommandCenter',
  'No LocalMerchantRequestInbox or TourismMerchantInbox reuse',
  'No API',
  'No DB',
  'No payment',
  'No booking',
  'No SOS dispatch',
  'No wallet',
  'No live AI',
  'No merchant execution',
  'Request persistence/API',
  'Audit log',
];

const REQUIRED_GATE_TOKENS = [
  'VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW_FLAG',
  'EXPO_PUBLIC_VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW',
  'isAdminDebugSurfaceEnabled',
  'export function isVionaOperatorInboxAdminDebugPreviewEnabled',
];

const REQUIRED_SCREEN_TOKENS = [
  'export function VionaAdminDebugOperatorInboxPreviewScreen',
  'user?.serverRole === \'ADMIN\'',
  'Admin preview only',
  'Read-only operator preview',
  'No live operations',
  'VionaRequestInboxReadOnly',
  'VionaRequestDetailReadOnly',
  'getVionaRequestReadOnlyFixtures',
  'getRequestsRequiringHumanConfirmation',
  'getRequestsWithPartnerResponse',
  'groupRequestsByStatus',
  'getRequestInboxCounts',
];

const FORBIDDEN_DIFF_PATTERNS = [
  /MainTabNavigator/,
  /referenceLabStackScreens\.tsx$/,
  /referenceLabLinking\.ts$/,
  /HomeScreen\.tsx$/,
  /LocalScreen\.tsx$/,
  /TravelScreen\.tsx$/,
  /LocalMerchantRequestInbox/,
  /TourismMerchantInbox/,
  /^assets\//,
  /^prisma\//,
  /^migrations?\//,
  /^src\/(?:api|server|services\/(?:payment|payments|booking|bookings|auth|sos|wallet|ai)|screens\/academy)\//i,
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
  const prefix = lower.slice(0, index);
  return /\b(no|not|never|without|cannot|can't|does not|do not|must not)\b/.test(prefix);
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
  console.log('VIONA operator inbox Admin Debug preview check (Pack6)');
  console.log(
    'Admin Debug read-only route. Minimal App.tsx only. No API, DB, payment, booking, SOS, wallet, live AI, or merchant execution.\n'
  );

  const missingFiles = ALLOWED_FILES.filter((file) => !exists(file));
  if (missingFiles.length) {
    fail('missing required Pack6 files', missingFiles);
    return;
  }

  const changedFiles = collectChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const gate = read('src/config/vionaOperatorInboxAdminDebugGate.ts');
  const screen = read('src/screens/admin/VionaAdminDebugOperatorInboxPreviewScreen.tsx');
  const app = read('App.tsx');
  const routes = read('src/navigation/routes.ts');
  const readiness = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const docs = read('docs/product/VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW.md');
  const combined = `${gate}\n${screen}\n${app}\n${routes}\n${readiness}\n${docs}`;

  const mainTabChanged = run('git diff --name-only origin/master -- src/navigation/MainTabNavigator.tsx');
  const refLabStackChanged = run(
    'git diff --name-only origin/master -- src/navigation/referenceLabStackScreens.tsx'
  );
  const refLabLinkChanged = run(
    'git diff --name-only origin/master -- src/navigation/referenceLabLinking.ts'
  );

  const missingGateTokens = missingValues(gate, REQUIRED_GATE_TOKENS);
  const missingScreenTokens = missingValues(screen, REQUIRED_SCREEN_TOKENS);
  const missingSafeCopy = missingValues(combined, REQUIRED_SAFE_COPY);
  const missingDocPhrases = missingValues(docs, REQUIRED_DOC_PHRASES);
  const routeMissing = !routes.includes('VionaAdminDebugOperatorInboxPreview: undefined');
  const appStackMissing =
    !app.includes('isVionaOperatorInboxAdminDebugPreviewEnabled()') ||
    !app.includes('name="VionaAdminDebugOperatorInboxPreview"') ||
    !app.includes('VionaAdminDebugOperatorInboxPreviewScreen');
  const linkingMissing = !app.includes(
    "VionaAdminDebugOperatorInboxPreview: 'admin/operator-inbox-preview'"
  );
  const underDemoMetricsOnly =
    app.includes('adminDemoMetricsEnabled') &&
    app.includes('VionaAdminDebugOperatorInboxPreview') &&
    /adminDemoMetricsEnabled[\s\S]{0,400}VionaAdminDebugOperatorInboxPreview/.test(app);
  const referenceLabImport = screen.includes('VionaReferenceRequestOperatorInboxLab');
  const unsafeClaims = findUnsafeStandaloneClaims([
    'src/screens/admin/VionaAdminDebugOperatorInboxPreviewScreen.tsx',
    'docs/product/VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW.md',
    'src/config/vionaOperatorInboxAdminReadiness.ts',
  ]);
  const unsafeScreenTokens = ['fetch(', 'axios.', 'AsyncStorage', 'supabase', 'prisma'].filter(
    (token) => screen.includes(token)
  );
  const readinessNotPreview =
    !readiness.includes('adminDebugPreviewCandidate') ||
    !readiness.includes('productionLiveOpsActive: false') ||
    !readiness.includes('persistenceApiActive: false') ||
    !readiness.includes('mutationsBlocked: true');

  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden live-action paths changed', forbiddenFiles);
  if (mainTabChanged) fail('MainTabNavigator changed vs origin/master', [mainTabChanged]);
  if (refLabStackChanged) {
    fail('referenceLabStackScreens.tsx changed vs origin/master', [refLabStackChanged]);
  }
  if (refLabLinkChanged) fail('referenceLabLinking.ts changed vs origin/master', [refLabLinkChanged]);
  if (missingGateTokens.length) fail('missing gate tokens', missingGateTokens);
  if (missingScreenTokens.length) fail('missing screen tokens', missingScreenTokens);
  if (missingSafeCopy.length) fail('missing required safe copy', missingSafeCopy);
  if (missingDocPhrases.length) fail('missing doc requirements', missingDocPhrases);
  if (routeMissing) fail('route type missing', ['VionaAdminDebugOperatorInboxPreview: undefined']);
  if (appStackMissing) fail('App.tsx Stack.Screen registration missing', ['VionaAdminDebugOperatorInboxPreview']);
  if (linkingMissing) fail('linking path missing', ["admin/operator-inbox-preview"]);
  if (underDemoMetricsOnly) {
    fail('route placed under adminDemoMetricsEnabled only', ['use separate isVionaOperatorInboxAdminDebugPreviewEnabled conditional']);
  }
  if (referenceLabImport) fail('ReferenceLab component imported in admin screen', ['forbidden']);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (unsafeScreenTokens.length) fail('screen contains runtime tokens', unsafeScreenTokens);
  if (readinessNotPreview) fail('readiness config not in preview-only state', ['check Pack6 readiness fields']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack6 Admin Debug preview before import.');
    return;
  }

  console.log(`Required files: PASS (${ALLOWED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Dedicated admin debug gate: PASS');
  console.log('Admin screen + role guard: PASS');
  console.log('App.tsx minimal wiring: PASS');
  console.log('Route type + linking: PASS');
  console.log('Read-only safety copy: PASS');
  console.log('Readiness preview-only state: PASS');
  console.log('No ReferenceLab import: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - Admin Debug operator inbox preview is import-ready.');
}

main();
