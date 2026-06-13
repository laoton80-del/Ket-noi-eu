#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const ALLOWED_FILES = [
  'src/config/vionaOperatorInboxAdminReadiness.ts',
  'docs/product/VIONA_OPERATOR_INBOX_ADMIN_ROUTE_READINESS.md',
  'scripts/viona-operator-inbox-admin-route-readiness-check.mjs',
  'docs/design/evidence/codex-operator-inbox-admin-route-readiness-pack5/README.md',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
];

const REQUIRED_MATURITY_LABELS = [
  'referenceLabOnly',
  'adminDebugPreviewCandidate',
  'adminDebugPreviewReady',
  'productionBlocked',
];

const REQUIRED_SAFETY_FLAGS = [
  'requiresFeatureFlag',
  'requiresAdminRoleGate',
  'requiresOperatorRunbook',
  'requiresAuditLogBeforeMutation',
  'requiresPersistenceApiBeforeRealData',
  'requiresHumanConfirmationBeforeProtectedAction',
  'requiresMerchantOpsReadinessBeforePartnerExecution',
  'requiresPaymentReadinessBeforeMoneyMovement',
  'requiresSosLegalOpsReadinessBeforeEmergencyAction',
  'prohibitsAutonomousAiAction',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_OPERATOR_INBOX_ADMIN_READINESS',
  'export const VIONA_OPERATOR_INBOX_ADMIN_ROUTE_PHASES',
  'export function getVionaOperatorInboxAdminReadiness',
  'referenceLabPreviewMerged',
  'adminRouteActive: false',
  'productionLiveOpsActive: false',
  'appTsxRouteDeferred: true',
  'LocalMerchantRequestInbox',
  'TourismMerchantInbox',
];

const REQUIRED_SAFE_COPY = [
  'Read-only operator preview',
  'Admin route not active in this pack',
  'No payment captured',
  'Not booking confirmed',
  'No SOS dispatch',
  'No live merchant execution',
  'Human confirmation required before any future protected action',
  'API and persistence are future gates',
];

const REQUIRED_DOC_PHRASES = [
  'Why Pack5 exists',
  '35220c8',
  'PR #59',
  'Admin Debug route is deferred',
  'App.tsx is not touched',
  'LocalMerchantRequestInbox',
  'TourismMerchantInbox',
  'Dedicated feature flag',
  'Admin role gate',
  'Read-only mode',
  'Audit log plan',
  'Request persistence/API',
  'Human-confirmed actions',
  'Merchant operations',
  'No live admin route',
  'Future Pack6',
  'read-only operator route behind a dedicated feature flag only',
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
  /LocalMerchantRequestInbox/,
  /TourismMerchantInbox/,
  /^assets\//,
  /^prisma\//,
  /^migrations?\//,
  /^src\/(?:api|server|services\/(?:payment|payments|booking|bookings|auth|sos|wallet|ai)|screens\/academy)\//i,
  /^src\/(?:payment|payments|booking|bookings|auth|sos|wallet|ai)\//i,
  /VionaReferenceRequestOperatorInboxLab/,
  /Stack\.Screen/,
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
  console.log('VIONA operator inbox admin route readiness check (Pack5)');
  console.log('Docs/config only. No route, App.tsx, navigation, API, DB, payment, booking, SOS, wallet, or live AI.\n');

  const missingFiles = ALLOWED_FILES.filter((file) => !exists(file));
  if (missingFiles.length) {
    fail('missing required Pack5 files', missingFiles);
    return;
  }

  const changedFiles = collectChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const config = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const docs = read('docs/product/VIONA_OPERATOR_INBOX_ADMIN_ROUTE_READINESS.md');
  const evidence = read('docs/design/evidence/codex-operator-inbox-admin-route-readiness-pack5/README.md');
  const combined = `${config}\n${docs}\n${evidence}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const mainTabChanged = run('git diff --name-only origin/master -- src/navigation/MainTabNavigator.tsx');
  const routesChanged = run('git diff --name-only origin/master -- src/navigation/routes.ts');
  const refLabStackChanged = run(
    'git diff --name-only origin/master -- src/navigation/referenceLabStackScreens.tsx'
  );
  const refLabLinkChanged = run(
    'git diff --name-only origin/master -- src/navigation/referenceLabLinking.ts'
  );

  const missingMaturity = missingValues(combined, REQUIRED_MATURITY_LABELS);
  const missingFlags = missingValues(config, REQUIRED_SAFETY_FLAGS);
  const missingConfigTokens = missingValues(config, REQUIRED_CONFIG_TOKENS);
  const missingSafeCopy = missingValues(combined, REQUIRED_SAFE_COPY);
  const missingDocPhrases = missingValues(docs, REQUIRED_DOC_PHRASES);
  const unsafeClaims = findUnsafeStandaloneClaims([
    'src/config/vionaOperatorInboxAdminReadiness.ts',
    'docs/product/VIONA_OPERATOR_INBOX_ADMIN_ROUTE_READINESS.md',
    'docs/design/evidence/codex-operator-inbox-admin-route-readiness-pack5/README.md',
  ]);
  const routeAdded =
    routesChanged.length > 0 ||
    config.includes('Stack.Screen') ||
    docs.includes('Stack.Screen') ||
    combined.includes('VionaReferenceRequestOperatorInboxLabScreen');

  const forbiddenRuntimeImports = [
    'react-native',
    'fetch(',
    '@react-navigation',
    'AsyncStorage',
    'prisma',
    'supabase',
  ].filter((token) => config.includes(token));

  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden live-action paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (mainTabChanged) fail('MainTabNavigator changed vs origin/master', [mainTabChanged]);
  if (routesChanged) fail('routes.ts changed vs origin/master', [routesChanged]);
  if (refLabStackChanged) fail('referenceLabStackScreens.tsx changed vs origin/master', [refLabStackChanged]);
  if (refLabLinkChanged) fail('referenceLabLinking.ts changed vs origin/master', [refLabLinkChanged]);
  if (missingMaturity.length) fail('missing maturity labels', missingMaturity);
  if (missingFlags.length) fail('missing safety flags', missingFlags);
  if (missingConfigTokens.length) fail('missing config tokens', missingConfigTokens);
  if (missingSafeCopy.length) fail('missing required safe copy', missingSafeCopy);
  if (missingDocPhrases.length) fail('missing doc requirements', missingDocPhrases);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (routeAdded) fail('route or Stack.Screen registration detected', ['no route additions allowed in Pack5']);
  if (forbiddenRuntimeImports.length) fail('config contains runtime imports/tokens', forbiddenRuntimeImports);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack5 admin route readiness contract before import.');
    return;
  }

  console.log(`Required files: PASS (${ALLOWED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('App.tsx untouched: PASS');
  console.log('Navigation files untouched: PASS');
  console.log('Maturity labels: PASS');
  console.log('Safety flags: PASS');
  console.log('Config exports: PASS');
  console.log('Required safe copy: PASS');
  console.log('Doc requirements: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('No route additions: PASS');
  console.log('Config is pure data/functions: PASS');
  console.log('\nResult: PASS - operator inbox admin route readiness contract is import-ready.');
}

main();
