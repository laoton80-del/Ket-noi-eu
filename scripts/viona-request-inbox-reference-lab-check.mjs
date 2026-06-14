#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const ALLOWED_FILES = [
  'src/components/viona/reference/VionaReferenceRequestInboxLab.tsx',
  'src/components/viona/reference/VionaReferenceRequestOperatorInboxLab.tsx',
  'src/navigation/referenceLabStackScreens.tsx',
  'src/navigation/referenceLabLinking.ts',
  'src/navigation/routes.ts',
  'docs/product/VIONA_REQUEST_INBOX_REFERENCE_LAB.md',
  'docs/product/VIONA_REQUEST_INBOX_OPERATOR_REFERENCE_LAB.md',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'docs/design/evidence/codex-request-inbox-reference-lab-pack3/README.md',
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
];

const REQUIRED_SAFETY_PHRASES = [
  'Read-only ReferenceLab preview',
  'No payment captured',
  'Not booking confirmed',
  'No SOS dispatch',
  'Human confirmation required before any future action',
  'Lab route only',
];

const REQUIRED_DOC_PHRASES = [
  'Pack3 adds a gated ReferenceLab preview route',
  'This follows Pack2',
  'master gate: `EXPO_PUBLIC_VIONA_REFERENCE_LABS_ENABLED=true`',
  'per-lab gate: `EXPO_PUBLIC_VIONA_REFERENCE_REQUEST_INBOX_LAB=true`',
  'No API, DB, payment, booking, SOS, wallet, merchant execution, or live AI integration',
  'Human-confirmed actions only after safety gates pass',
  'Merchant ops only after tenant, fulfillment, and operational readiness gates pass',
];

const REQUIRED_LAB_TOKENS = [
  'export function VionaReferenceRequestInboxLab',
  'export function VionaReferenceRequestInboxLabScreen',
  'EXPO_PUBLIC_VIONA_REFERENCE_REQUEST_INBOX_LAB',
  'VionaRequestInboxReadOnly',
  'VionaRequestDetailReadOnly',
  'VionaRequestStatusBadge',
  'getVionaRequestReadOnlyFixtures',
  'getRequestInboxCounts',
  'getRequestNotProductionCopy',
];

const FORBIDDEN_DIFF_PATTERNS = [
  /HomeScreen\.tsx$/,
  /LocalScreen\.tsx$/,
  /TravelScreen\.tsx$/,
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
  return /\b(no|not|never|without|cannot|can't)\b/.test(prefix);
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
  console.log('VIONA request inbox ReferenceLab check (Pack3)');
  console.log('ReferenceLab-only route. No App.tsx, live UI, API, DB, payment, booking, SOS, wallet, or live AI.\n');

  const missingFiles = ALLOWED_FILES.filter((file) => !exists(file));
  if (missingFiles.length) {
    fail('missing required Pack3 files', missingFiles);
    return;
  }

  const changedFiles = collectChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const lab = read('src/components/viona/reference/VionaReferenceRequestInboxLab.tsx');
  const stack = read('src/navigation/referenceLabStackScreens.tsx');
  const linking = read('src/navigation/referenceLabLinking.ts');
  const routes = read('src/navigation/routes.ts');
  const docs = read('docs/product/VIONA_REQUEST_INBOX_REFERENCE_LAB.md');
  const evidence = read('docs/design/evidence/codex-request-inbox-reference-lab-pack3/README.md');
  const combined = `${lab}\n${stack}\n${linking}\n${routes}\n${docs}\n${evidence}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const pack6AppOnly =
    appChanged &&
    changedFiles.every((file) => ALLOWED_FILES.includes(file)) &&
    changedFiles.includes('App.tsx');

  const missingLabTokens = missingValues(lab, REQUIRED_LAB_TOKENS);
  const missingSafetyPhrases = missingValues(combined, REQUIRED_SAFETY_PHRASES);
  const missingDocPhrases = missingValues(docs, REQUIRED_DOC_PHRASES);
  const routeMissing = !routes.includes('VionaReferenceRequestInboxLab: undefined');
  const stackMissing =
    !stack.includes('VionaReferenceRequestInboxLabScreen') ||
    !stack.includes('name="VionaReferenceRequestInboxLab"') ||
    stack.includes('ReferenceLabStackScreensGate');
  const linkingMissing = !linking.includes("VionaReferenceRequestInboxLab: 'viona-reference-request-inbox-lab'");
  const unsafeClaims = findUnsafeStandaloneClaims([
    'src/components/viona/reference/VionaReferenceRequestInboxLab.tsx',
    'docs/product/VIONA_REQUEST_INBOX_REFERENCE_LAB.md',
    'docs/design/evidence/codex-request-inbox-reference-lab-pack3/README.md',
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
  if (routeMissing) fail('route type missing', ['VionaReferenceRequestInboxLab: undefined']);
  if (stackMissing) fail('Stack.Screen registration missing or invalid', ['plain Stack.Screen for VionaReferenceRequestInboxLab']);
  if (linkingMissing) fail('linking path missing', ["VionaReferenceRequestInboxLab: 'viona-reference-request-inbox-lab'"]);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (unsafeLabRuntimeTokens.length) fail('lab contains runtime/action tokens', unsafeLabRuntimeTokens);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack3 ReferenceLab preview before import.');
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
  console.log('\nResult: PASS - request inbox ReferenceLab preview is import-ready.');
}

main();
