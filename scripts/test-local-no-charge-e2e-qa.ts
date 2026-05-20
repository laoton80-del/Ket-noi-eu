/**
 * Composes existing Local no-charge integration/UI scripts for QA certification.
 * Requires DATABASE_URL for DB-backed scripts; UI-only scripts run without DB.
 *
 * Run: npx tsx scripts/test-local-no-charge-e2e-qa.ts
 */
import 'dotenv/config';

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

const SCRIPTS: readonly { name: string; file: string; needsDb: boolean }[] = [
  { name: 'schema-defaults', file: 'test-local-request-schema-defaults.ts', needsDb: false },
  { name: 'create-source-of-truth', file: 'test-local-request-create-source-of-truth.ts', needsDb: true },
  { name: 'user-request-list-api', file: 'test-local-user-request-list-api.ts', needsDb: true },
  { name: 'user-request-status-ui-display', file: 'test-local-user-request-status-ui-display.ts', needsDb: false },
  { name: 'user-request-cancel-api', file: 'test-local-user-request-cancel-api.ts', needsDb: true },
  { name: 'merchant-request-inbox-api', file: 'test-local-merchant-request-inbox-api.ts', needsDb: true },
  { name: 'merchant-request-confirm-api', file: 'test-local-merchant-request-confirm-api.ts', needsDb: true },
  { name: 'merchant-request-reject-api', file: 'test-local-merchant-request-reject-api.ts', needsDb: true },
  { name: 'ops-request-cancel-api', file: 'test-local-ops-request-cancel-api.ts', needsDb: true },
  { name: 'merchant-inbox-ui-display', file: 'test-local-merchant-inbox-ui-display.ts', needsDb: false },
  { name: 'user-request-timeline-1', file: 'test-local-user-request-timeline-1.ts', needsDb: true },
  { name: 'audit-read-api-1', file: 'test-local-audit-read-api-1.ts', needsDb: true },
  { name: 'request-expiry-dry-run', file: 'test-local-request-expiry-dry-run.ts', needsDb: true },
  { name: 'request-expiry-apply', file: 'test-local-request-expiry-apply.ts', needsDb: true },
  { name: 'rate-limit-abuse-guard-1', file: 'test-local-rate-limit-abuse-guard-1.ts', needsDb: true },
  { name: 'request-audit-runtime-1', file: 'test-local-request-audit-runtime-1.ts', needsDb: true },
  { name: 'request-audit-runtime-2', file: 'test-local-request-audit-runtime-2.ts', needsDb: true },
  { name: 'request-audit-runtime-3', file: 'test-local-request-audit-runtime-3.ts', needsDb: true },
];

const TOURISM_SCRIPTS: readonly string[] = [
  'test-tourism-confirm-settle-eligibility.ts',
  'test-tourism-cancel-release-eligibility.ts',
  'test-tourism-merchant-inbox-actions.ts',
  'test-tourism-ops-cancel-policy.ts',
  'test-tourism-timeout-release-eligibility.ts',
  'test-tourism-merchant-inbox-ui-display.ts',
];

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function runScript(file: string): { ok: boolean; skipped: boolean } {
  const scriptPath = path.join(ROOT, 'scripts', file);
  const tsxBin = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const r = spawnSync(process.execPath, [tsxBin, scriptPath], {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });
  return { ok: r.status === 0, skipped: false };
}

function main(): void {
  const db = hasDatabaseUrl();
  if (!db) {
    console.warn('[test-local-no-charge-e2e-qa] DATABASE_URL not set — skipping DB-backed scripts.');
  }

  const failed: string[] = [];
  const skipped: string[] = [];
  const passed: string[] = [];

  for (const s of SCRIPTS) {
    if (s.needsDb && !db) {
      skipped.push(s.name);
      console.log(`[SKIP] ${s.name} (needs DATABASE_URL)`);
      continue;
    }
    console.log(`\n[RUN] ${s.name} → ${s.file}`);
    const { ok } = runScript(s.file);
    if (ok) {
      passed.push(s.name);
      console.log(`[PASS] ${s.name}`);
    } else {
      failed.push(s.name);
      console.error(`[FAIL] ${s.name}`);
    }
  }

  console.log('\n--- Tourism regression (no DB) ---');
  for (const file of TOURISM_SCRIPTS) {
    console.log(`\n[RUN] tourism → ${file}`);
    const { ok } = runScript(file);
    if (ok) {
      passed.push(`tourism:${file}`);
      console.log(`[PASS] ${file}`);
    } else {
      failed.push(`tourism:${file}`);
      console.error(`[FAIL] ${file}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`passed: ${passed.length}`);
  console.log(`failed: ${failed.length}`);
  console.log(`skipped: ${skipped.length}`);
  if (failed.length > 0) {
    console.error('Failed:', failed.join(', '));
    process.exit(1);
  }
  console.log('test-local-no-charge-e2e-qa: OK');
}

main();
