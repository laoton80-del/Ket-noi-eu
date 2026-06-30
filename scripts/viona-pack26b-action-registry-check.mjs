#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

const PACK26B_FILES = [
  'src/lib/viona/actions/vionaActionCapabilityTypes.ts',
  'src/lib/viona/actions/vionaActionRegistry.ts',
  'src/lib/viona/actions/vionaActionRegistrySelectors.ts',
  'src/lib/viona/actions/index.ts',
  'scripts/viona-pack26b-action-registry-check.mjs',
  'docs/product/VIONA_REQUEST_PACK26B_ACTION_REGISTRY_CAPABILITY_FLAGS_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack26b-action-registry-capability-flags-implementation/README.md',
];

const REQUIRED_ACTION_IDS = [
  'request.status.submitted_to_triage',
  'request.assign',
  'request.confirm',
  'request.cancel',
  'booking.request',
  'payment.intent',
  'sos.assist',
  'wallet.adjustment',
  'live_ai.action',
];

const FUTURE_BLOCKED_IDS = [
  'request.assign',
  'request.confirm',
  'request.cancel',
  'booking.request',
  'payment.intent',
  'sos.assist',
  'wallet.adjustment',
  'live_ai.action',
];

const REGISTRY_SOURCE_FILES = [
  'src/lib/viona/actions/vionaActionCapabilityTypes.ts',
  'src/lib/viona/actions/vionaActionRegistry.ts',
  'src/lib/viona/actions/vionaActionRegistrySelectors.ts',
  'src/lib/viona/actions/index.ts',
];

const FORBIDDEN_RUNTIME_PATTERNS = [
  /\bfetch\s*\(/,
  /\baxios\b/,
  /\bPOST\b/,
  /\bprisma\b/i,
  /\bsupabase\b/i,
  /\bprocess\.env\b/,
  /\bAuthorization\b/,
  /\bJWT\b/,
  /\bPIN\b/,
];

const REQUIRED_SELECTORS = [
  'getAllVionaActionRegistryEntries',
  'getVionaActionRegistryEntry',
  'getVionaActionCapabilitySummary',
  'isVionaActionKnown',
  'isVionaActionExecutableInPack26B',
  'isVionaActionUiAffordanceAllowedInPack26B',
  'getVionaActionsByUniverse',
  'getVionaActionsByReadiness',
];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function fail(message, details = []) {
  console.log(`FAIL ${message}`);
  for (const detail of details) console.log(`  - ${detail}`);
  process.exitCode = 1;
}

function extractRegistryBlocks(registrySource) {
  const blocks = [];
  const entryPattern = /\{\s*\n\s*actionId:\s*'([^']+)'/g;
  let match;
  while ((match = entryPattern.exec(registrySource)) !== null) {
    const actionId = match[1];
    const start = match.index;
    let depth = 0;
    let end = start;
    for (let i = start; i < registrySource.length; i += 1) {
      const char = registrySource[i];
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    blocks.push({ actionId, block: registrySource.slice(start, end) });
  }
  return blocks;
}

function blockHasField(block, field, value) {
  const pattern = new RegExp(`${field}:\\s*${value === false ? 'false' : `'${value}'`}`);
  return pattern.test(block);
}

function runTsxSelectorSmoke() {
  const script = `
import {
  getVionaActionCapabilitySummary,
  isVionaActionExecutableInPack26B,
  isVionaActionUiAffordanceAllowedInPack26B,
  getAllVionaActionRegistryEntries,
} from './src/lib/viona/actions/index.ts';

const entries = getAllVionaActionRegistryEntries();
if (entries.length !== ${REQUIRED_ACTION_IDS.length}) {
  throw new Error('unexpected registry count: ' + entries.length);
}

const unknown = getVionaActionCapabilitySummary('unknown.pack26b.action');
if (unknown.known) throw new Error('unknown action must not be known');
if (unknown.defaultReadiness !== 'disabled') throw new Error('unknown readiness must be disabled');
if (isVionaActionExecutableInPack26B('unknown.pack26b.action')) {
  throw new Error('unknown action must not be executable');
}
if (isVionaActionUiAffordanceAllowedInPack26B('request.status.submitted_to_triage')) {
  throw new Error('Pack25 reference must not allow UI affordance in Pack26B');
}
for (const entry of entries) {
  if (isVionaActionExecutableInPack26B(entry.actionId)) {
    throw new Error('executable in Pack26B: ' + entry.actionId);
  }
  if (isVionaActionUiAffordanceAllowedInPack26B(entry.actionId)) {
    throw new Error('UI affordance in Pack26B: ' + entry.actionId);
  }
}
console.log('SELECTOR_SMOKE_OK');
`;

  const result = spawnSync('npx', ['tsx', '-e', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    fail('selector smoke via tsx failed', [
      result.stderr?.trim() || result.stdout?.trim() || 'tsx exited non-zero',
    ]);
    return false;
  }
  return true;
}

function main() {
  console.log('VIONA Pack26B action registry check');
  console.log('Read-only registry layer. No routes, writes, or execution.\n');

  const missingFiles = PACK26B_FILES.filter((rel) => !existsSync(path.join(ROOT, rel)));
  if (missingFiles.length) {
    fail('required Pack26B files missing', missingFiles);
    return;
  }

  const registrySource = read('src/lib/viona/actions/vionaActionRegistry.ts');
  const selectorsSource = read('src/lib/viona/actions/vionaActionRegistrySelectors.ts');
  const blocks = extractRegistryBlocks(registrySource);

  const foundIds = blocks.map((b) => b.actionId);
  const duplicateIds = foundIds.filter((id, index) => foundIds.indexOf(id) !== index);
  if (duplicateIds.length) {
    fail('duplicate actionId values', [...new Set(duplicateIds)]);
  }

  const missingIds = REQUIRED_ACTION_IDS.filter((id) => !foundIds.includes(id));
  if (missingIds.length) {
    fail('missing required actionId entries', missingIds);
  }

  const missingSelectors = REQUIRED_SELECTORS.filter((name) => !selectorsSource.includes(name));
  if (missingSelectors.length) {
    fail('missing required selector exports', missingSelectors);
  }

  for (const { actionId, block } of blocks) {
    const requiredStringFields = [
      'universe',
      'actionFamily',
      'displayName',
      'description',
      'defaultReadiness',
      'auditCategory',
      'timelineCategory',
    ];
    for (const field of requiredStringFields) {
      if (!new RegExp(`${field}:`).test(block)) {
        fail(`entry missing ${field}`, [actionId]);
      }
    }
    if (!/allowedRoles:\s*\[/.test(block)) {
      fail('entry missing allowedRoles', [actionId]);
    }
    if (!/idempotencyRequired:\s*(true|false)/.test(block)) {
      fail('entry missing idempotencyRequired', [actionId]);
    }
    for (const gate of ['marketGate', 'legalGate', 'paymentGate', 'opsGate', 'sosGate']) {
      if (!new RegExp(`${gate}:`).test(block)) {
        fail(`entry missing ${gate}`, [actionId]);
      }
    }
    if (!blockHasField(block, 'executionEnabled', false)) {
      fail('executionEnabled must be false', [actionId]);
    }
    if (!blockHasField(block, 'uiAffordanceAllowed', false)) {
      fail('uiAffordanceAllowed must be false', [actionId]);
    }
  }

  for (const actionId of FUTURE_BLOCKED_IDS) {
    const block = blocks.find((b) => b.actionId === actionId)?.block ?? '';
    if (!/defaultReadiness:\s*'disabled'/.test(block)) {
      fail('future-blocked action must have defaultReadiness disabled', [actionId]);
    }
  }

  const pack25Block = blocks.find((b) => b.actionId === 'request.status.submitted_to_triage')?.block ?? '';
  if (!/defaultReadiness:\s*'staging_verified'/.test(pack25Block)) {
    fail('Pack25 reference action must document staging_verified readiness');
  }

  for (const rel of REGISTRY_SOURCE_FILES) {
    const source = read(rel);
    for (const pattern of FORBIDDEN_RUNTIME_PATTERNS) {
      if (pattern.test(source)) {
        fail('forbidden runtime pattern in registry source', [`${rel}: ${pattern}`]);
      }
    }
  }

  const routeHints = ['routes/', 'controllers/', 'src/server.ts', 'prisma/'];
  const diffForbidden = routeHints.filter((hint) => {
    const full = path.join(ROOT, hint);
    return existsSync(full) && PACK26B_FILES.some((f) => f.includes(hint));
  });
  if (diffForbidden.length) {
    fail('Pack26B touched forbidden backend paths', diffForbidden);
  }

  if (!runTsxSelectorSmoke()) {
    return;
  }

  if (process.exitCode) {
    console.log('\nResult: FAIL — fix Pack26B action registry.');
    return;
  }

  console.log(`Registry entries: PASS (${foundIds.length})`);
  console.log('Duplicate actionId: PASS');
  console.log('Required fields: PASS');
  console.log('executionEnabled false: PASS');
  console.log('uiAffordanceAllowed false: PASS');
  console.log('Future-blocked readiness: PASS');
  console.log('Forbidden runtime patterns: PASS');
  console.log('Selector smoke: PASS');
  console.log('\nResult: PASS — Pack26B read-only action registry is consistent.');
}

main();
