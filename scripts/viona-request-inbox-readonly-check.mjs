#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const PACK2_ALLOWED_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_INBOX_READONLY_FOUNDATION.md',
  'src/domain/requests/vionaRequestFixtures.ts',
  'src/domain/requests/vionaRequestInboxSelectors.ts',
  'src/domain/requests/vionaRequestSafetyCopy.ts',
  'src/domain/requests/index.ts',
  'src/components/viona/requests/VionaRequestInboxReadOnly.tsx',
  'src/components/viona/requests/VionaRequestStatusBadge.tsx',
  'src/components/viona/requests/VionaRequestDetailReadOnly.tsx',
  'src/components/viona/requests/index.ts',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'docs/design/evidence/codex-request-inbox-readonly-foundation/README.md',
];

// This exception allows later gated ReferenceLab preview wiring only; it does not allow live consumer UI or runtime actions.
const GATED_REFERENCE_LAB_PREVIEW_DIFF_FILES = [
  'src/navigation/referenceLabStackScreens.tsx',
  'src/navigation/referenceLabLinking.ts',
  'src/navigation/routes.ts',
  'src/components/viona/reference/VionaReferenceRequestInboxLab.tsx',
  'src/components/viona/reference/VionaReferenceRequestOperatorInboxLab.tsx',
  'docs/product/VIONA_REQUEST_INBOX_REFERENCE_LAB.md',
  'docs/product/VIONA_REQUEST_INBOX_OPERATOR_REFERENCE_LAB.md',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
  'docs/design/evidence/codex-request-inbox-reference-lab-pack3/README.md',
  'docs/design/evidence/codex-request-operator-inbox-reference-lab-pack4/README.md',
];

// Pack5 admin route readiness contract only; does not allow routes, navigation, or live runtime behavior.
const PACK5_ADMIN_ROUTE_READINESS_DIFF_FILES = [
  'src/config/vionaOperatorInboxAdminReadiness.ts',
  'docs/product/VIONA_OPERATOR_INBOX_ADMIN_ROUTE_READINESS.md',
  'scripts/viona-operator-inbox-admin-route-readiness-check.mjs',
  'docs/design/evidence/codex-operator-inbox-admin-route-readiness-pack5/README.md',
];

// Pack6 Admin Debug read-only preview route only; does not allow API, DB, payment, booking, SOS, wallet, live AI, or merchant execution.
// Pack6 App.tsx exception is limited to the Admin Debug operator inbox preview route/gate/linking.
// It does not allow consumer UI, merchant ops, runtime actions, or broad App.tsx edits.
const PACK6_ADMIN_DEBUG_PREVIEW_DIFF_FILES = [
  'src/config/vionaOperatorInboxAdminDebugGate.ts',
  'src/screens/admin/VionaAdminDebugOperatorInboxPreviewScreen.tsx',
  'docs/product/VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW.md',
  'scripts/viona-operator-inbox-admin-debug-preview-check.mjs',
  'docs/design/evidence/codex-operator-inbox-admin-debug-preview-pack6/README.md',
  'App.tsx',
  'src/navigation/routes.ts',
];

const PACK7_PERSISTENCE_AUDIT_READINESS_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS.md',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/domain/requests/vionaRequestAuditEventTypes.ts',
  'src/domain/requests/vionaRequestPersistenceContract.ts',
  'scripts/viona-request-persistence-audit-readiness-check.mjs',
  'docs/design/evidence/cursor-request-persistence-audit-readiness-pack7/README.md',
];

const PACK8_SOURCE_OF_TRUTH_AUTH_TENANT_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_SOURCE_OF_TRUTH_AUTH_TENANT_MAPPING.md',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/domain/requests/vionaRequestSourceOfTruthMappingContract.ts',
  'src/domain/requests/vionaRequestRoleTenantAccessMatrix.ts',
  'scripts/viona-request-source-of-truth-auth-tenant-mapping-check.mjs',
  'docs/design/evidence/cursor-request-source-of-truth-auth-tenant-pack8/README.md',
];

const PACK9_SOT_SIGNOFF_PHASE_PROMOTION_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_SOT_SIGNOFF_PHASE_PROMOTION_READINESS.md',
  'src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts',
  'src/domain/requests/vionaRequestPhasePromotionContract.ts',
  'src/domain/requests/vionaRequestDedicatedStoreFieldManifest.ts',
  'scripts/viona-request-sot-signoff-phase-promotion-readiness-check.mjs',
  'docs/design/evidence/cursor-request-sot-signoff-phase-promotion-pack9/README.md',
];

const PACK10_FOUNDER_ARCHITECT_SIGNOFF_PACKET_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_SOT_FOUNDER_ARCHITECT_SIGNOFF_PACKET.md',
  'src/config/vionaRequestSotFounderArchitectSignoffPacketReadiness.ts',
  'scripts/viona-request-sot-founder-architect-signoff-packet-check.mjs',
  'docs/design/evidence/cursor-request-sot-signoff-packet-pack10/README.md',
];

const PACK10B_SOT_SIGNOFF_TEMPLATE_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_SOT_HUMAN_SIGNOFF_TEMPLATE.md',
  'docs/design/evidence/cursor-request-sot-signoff-template-pack10b/README.md',
];

const PACK10C_SOT_HUMAN_APPROVAL_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_SOT_HUMAN_APPROVAL_RECORD.md',
  'src/config/vionaRequestSotHumanApprovalReadiness.ts',
  'scripts/viona-request-sot-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-sot-human-approval-pack10c/README.md',
];

const PACK11_DEDICATED_STORE_SCHEMA_DESIGN_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT.md',
  'src/domain/requests/vionaRequestDedicatedStoreSchemaDesignContract.ts',
  'src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts',
  'scripts/viona-request-dedicated-store-schema-design-contract-check.mjs',
  'docs/design/evidence/cursor-request-dedicated-store-schema-design-pack11/README.md',
];

const PACK11B_SCHEMA_DESIGN_HUMAN_APPROVAL_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_SCHEMA_DESIGN_HUMAN_APPROVAL_RECORD.md',
  'src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts',
  'scripts/viona-request-schema-design-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-schema-design-human-approval-pack11b/README.md',
];

const PACK12_PRISMA_SCHEMA_READINESS_BOUNDARY_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_PACK12_PRISMA_SCHEMA_READINESS_BOUNDARY.md',
  'src/domain/requests/vionaRequestPrismaSchemaReadinessBoundary.ts',
  'src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts',
  'scripts/viona-request-pack12-prisma-schema-readiness-boundary-check.mjs',
  'docs/design/evidence/cursor-request-pack12-prisma-schema-readiness-boundary/README.md',
];

const PACK13A_PRISMA_SCHEMA_IMPLEMENTATION_APPROVAL_PACKET_DIFF_FILES = [
  'docs/product/VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_APPROVAL_PACKET.md',
  'src/config/vionaRequestPack13PrismaSchemaImplementationApprovalPacketReadiness.ts',
  'scripts/viona-request-pack13-prisma-schema-implementation-approval-packet-check.mjs',
  'docs/design/evidence/cursor-request-pack13a-prisma-schema-implementation-approval-packet/README.md',
];

const ALLOWED_DIFF_FILES = [
  ...PACK2_ALLOWED_DIFF_FILES,
  ...GATED_REFERENCE_LAB_PREVIEW_DIFF_FILES,
  ...PACK5_ADMIN_ROUTE_READINESS_DIFF_FILES,
  ...PACK6_ADMIN_DEBUG_PREVIEW_DIFF_FILES,
  ...PACK7_PERSISTENCE_AUDIT_READINESS_DIFF_FILES,
  ...PACK8_SOURCE_OF_TRUTH_AUTH_TENANT_DIFF_FILES,
  ...PACK9_SOT_SIGNOFF_PHASE_PROMOTION_DIFF_FILES,
  ...PACK10_FOUNDER_ARCHITECT_SIGNOFF_PACKET_DIFF_FILES,
  ...PACK10B_SOT_SIGNOFF_TEMPLATE_DIFF_FILES,
  ...PACK10C_SOT_HUMAN_APPROVAL_DIFF_FILES,
  ...PACK11_DEDICATED_STORE_SCHEMA_DESIGN_DIFF_FILES,
  ...PACK11B_SCHEMA_DESIGN_HUMAN_APPROVAL_DIFF_FILES,
  ...PACK12_PRISMA_SCHEMA_READINESS_BOUNDARY_DIFF_FILES,
  ...PACK13A_PRISMA_SCHEMA_IMPLEMENTATION_APPROVAL_PACKET_DIFF_FILES,
];

const REQUIRED_FILES = PACK2_ALLOWED_DIFF_FILES;

const FORBIDDEN_DIFF_PATTERNS = [
  /^App\.tsx$/,
  /HomeScreen\.tsx$/,
  /LocalScreen\.tsx$/,
  /TravelScreen\.tsx$/,
  /AcademyScreen\.tsx$/,
  /^prisma\//,
  /^assets\//,
  /^src\/api\//,
  /^api\//,
  /\/migrations\//,
  /MainTabNavigator/,
];

const REQUIRED_SELECTORS = [
  'filterRequestsForInbox',
  'groupRequestsByStatus',
  'groupRequestsByUniverse',
  'getRequestInboxCounts',
  'getRequestsRequiringHumanConfirmation',
  'getRequestsWithPartnerResponse',
];

const REQUIRED_SAFETY_HELPERS = [
  'getRequestStatusSafetyLabel',
  'getRequestUniverseSafetyNote',
  'getRequestHumanConfirmationNote',
  'getRequestNotProductionCopy',
];

const REQUIRED_READ_ONLY_PHRASES = [
  'Read-only preview',
  'no payment captured',
  'not booking confirmed',
  'Needs human confirmation',
  'SOS guidance only',
  'Ops readiness required',
];

const REQUIRED_SAFETY_BOUNDARIES = [
  'submitted is not paid',
  'partnerResponded is not booking confirmed',
  'completed is not settled',
  'AI cannot autonomously pay',
];

const UNSAFE_POSITIVE_OVERCLAIMS = [
  'submitted is paid',
  'partnerResponded is booking confirmed',
  'completed is settled',
  'SOS dispatched',
  'police contacted',
  'ambulance dispatched',
  'payout completed',
  'driver assigned',
  'ticket booked',
  'settlement completed',
  'payment captured',
  'booking confirmed',
];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function missingValues(content, values) {
  return values.filter((value) => !content.includes(value));
}

function fail(label, values) {
  console.log(`FAIL ${label}`);
  for (const value of values) console.log(`  - ${value}`);
  process.exitCode = 1;
}

function getDiffFiles() {
  try {
    const output = execSync('git diff --name-only origin/master..HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!output) return [];
    return output.split('\n').map((line) => line.replace(/\\/g, '/'));
  } catch {
    return [];
  }
}

function findUnsafeOverclaims(content) {
  const hits = [];
  for (const claim of UNSAFE_POSITIVE_OVERCLAIMS) {
    if (!content.includes(claim)) continue;
    const lines = content.split('\n');
    for (const line of lines) {
      if (!line.includes(claim)) continue;
      const normalized = line.toLowerCase();
      if (normalized.includes(`not ${claim}`)) continue;
      if (normalized.includes(`no ${claim}`)) continue;
      if (claim === 'payment captured' && normalized.includes('no payment captured')) continue;
      if (claim === 'booking confirmed' && normalized.includes('not booking confirmed')) continue;
      if (claim === 'payout completed' && normalized.includes('no payout completed')) continue;
      if (claim === 'ticket booked' && normalized.includes('no ticket booked')) continue;
      if (claim === 'SOS dispatched' && normalized.includes('no sos dispatch')) continue;
      hits.push(`${claim} (${line.trim()})`);
    }
  }
  return [...new Set(hits)];
}

function isPack6AppOnlyDiff(diffFiles) {
  if (!diffFiles.includes('App.tsx')) return false;
  if (!diffFiles.every((file) => ALLOWED_DIFF_FILES.includes(file))) return false;

  const app = read('App.tsx');
  const hasGateHelper = app.includes('isVionaOperatorInboxAdminDebugPreviewEnabled()');
  const hasRouteScreen =
    app.includes('name="VionaAdminDebugOperatorInboxPreview"') &&
    app.includes('VionaAdminDebugOperatorInboxPreviewScreen');
  const hasLinking = app.includes(
    "VionaAdminDebugOperatorInboxPreview: 'admin/operator-inbox-preview'"
  );
  const underDemoMetricsOnly =
    app.includes('adminDemoMetricsEnabled') &&
    app.includes('VionaAdminDebugOperatorInboxPreview') &&
    /adminDemoMetricsEnabled[\s\S]{0,400}VionaAdminDebugOperatorInboxPreview/.test(app);

  return hasGateHelper && hasRouteScreen && hasLinking && !underDemoMetricsOnly;
}

function main() {
  console.log('VIONA request inbox read-only check (Pack 2)');
  console.log('Fixtures/selectors/components only. No API, DB, navigation, or live ops.\n');

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  if (missingFiles.length) {
    fail('missing required files', missingFiles);
    return;
  }

  const diffFiles = getDiffFiles();
  const pack6AppOnly = isPack6AppOnlyDiff(diffFiles);
  const unexpectedDiff = diffFiles.filter((file) => !ALLOWED_DIFF_FILES.includes(file));
  const forbiddenDiff = diffFiles.filter((file) => {
    if (file === 'App.tsx' && pack6AppOnly) return false;
    return FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file));
  });

  const selectors = read('src/domain/requests/vionaRequestInboxSelectors.ts');
  const safetyCopy = read('src/domain/requests/vionaRequestSafetyCopy.ts');
  const fixtures = read('src/domain/requests/vionaRequestFixtures.ts');
  const inbox = read('src/components/viona/requests/VionaRequestInboxReadOnly.tsx');
  const detail = read('src/components/viona/requests/VionaRequestDetailReadOnly.tsx');
  const docs = read('docs/product/VIONA_REQUEST_INBOX_READONLY_FOUNDATION.md');
  const combined = `${selectors}\n${safetyCopy}\n${fixtures}\n${inbox}\n${detail}\n${docs}`;

  const missingSelectors = missingValues(selectors, REQUIRED_SELECTORS);
  const missingSafetyHelpers = missingValues(safetyCopy, REQUIRED_SAFETY_HELPERS);
  const missingReadOnlyPhrases = missingValues(combined, REQUIRED_READ_ONLY_PHRASES);
  const missingSafetyBoundaries = missingValues(combined, REQUIRED_SAFETY_BOUNDARIES);
  const overclaims = findUnsafeOverclaims(combined);

  if (unexpectedDiff.length) fail('unexpected files in diff vs origin/master', unexpectedDiff);
  if (diffFiles.includes('App.tsx') && !pack6AppOnly) {
    fail('App.tsx changed without valid Pack6 admin debug preview exception', ['App.tsx']);
  }
  if (forbiddenDiff.length) fail('forbidden files in diff vs origin/master', forbiddenDiff);
  if (missingSelectors.length) fail('missing inbox selectors', missingSelectors);
  if (missingSafetyHelpers.length) fail('missing safety copy helpers', missingSafetyHelpers);
  if (missingReadOnlyPhrases.length) fail('missing read-only safety phrases', missingReadOnlyPhrases);
  if (missingSafetyBoundaries.length) fail('missing safety boundaries', missingSafetyBoundaries);
  if (overclaims.length) fail('unsafe standalone production claims', overclaims);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix request inbox read-only foundation.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Diff scope: PASS (${diffFiles.length || ALLOWED_DIFF_FILES.length} allowed files)`);
  if (pack6AppOnly) console.log('App.tsx Pack6 admin debug preview exception: PASS');
  console.log('Inbox selectors: PASS');
  console.log('Safety copy helpers: PASS');
  console.log('Read-only phrases: PASS');
  console.log('Safety boundaries: PASS');
  console.log('Unsafe overclaims: PASS');
  console.log('\nResult: PASS - request inbox read-only foundation is import-ready.');
}

main();
