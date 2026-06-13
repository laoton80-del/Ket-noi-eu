#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const ALLOWED_FILES = [
  'src/components/viona/reference/VionaReferenceRequestOperatorInboxLab.tsx',
  'src/navigation/referenceLabStackScreens.tsx',
  'src/navigation/referenceLabLinking.ts',
  'src/navigation/routes.ts',
  'docs/product/VIONA_REQUEST_INBOX_OPERATOR_REFERENCE_LAB.md',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'docs/design/evidence/codex-request-operator-inbox-reference-lab-pack4/README.md',
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
  /^App\.tsx$/,
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
  console.log('VIONA request inbox operator ReferenceLab check (Pack4)');
  console.log('ReferenceLab-only operator preview. No App.tsx, live UI, API, DB, payment, booking, SOS, wallet, or live AI.\n');

  const missingFiles = ALLOWED_FILES.filter((file) => !exists(file));
  if (missingFiles.length) {
    fail('missing required Pack4 files', missingFiles);
    return;
  }

  const changedFiles = collectChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const lab = read('src/components/viona/reference/VionaReferenceRequestOperatorInboxLab.tsx');
  const stack = read('src/navigation/referenceLabStackScreens.tsx');
  const linking = read('src/navigation/referenceLabLinking.ts');
  const routes = read('src/navigation/routes.ts');
  const docs = read('docs/product/VIONA_REQUEST_INBOX_OPERATOR_REFERENCE_LAB.md');
  const evidence = read('docs/design/evidence/codex-request-operator-inbox-reference-lab-pack4/README.md');
  const combined = `${lab}\n${stack}\n${linking}\n${routes}\n${docs}\n${evidence}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
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
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
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
