/**
 * Sync staging secrets to Fly (names only in logs). Requires: flyctl auth login, app exists.
 * Usage: node scripts/fly-staging-sync-secrets.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const APP = 'viona-api-staging-eu';
const STAGING_REF = 'euqbfanilcssjiwwtcby';

const SECRET_KEYS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SES_SENDER_EMAIL',
  'MAIL_FROM',
  'SES_FROM_EMAIL',
  // Pack37 — B2B Dispatcher Realization: required for real LLM classification/reply-phrasing on
  // staging. Additive only — the loop below already skips any key with an empty local value, so
  // an operator with no local OPENAI_API_KEY configured sees this simply never synced, never a
  // failure (see docs/product/VIONA_PACK37_B2B_DISPATCHER_REALIZATION_PLAN.md §5.2). Operator must
  // confirm the local value pushed here is the one intended for staging LLM spend/quota.
  'OPENAI_API_KEY',
];

const CORS_ORIGINS =
  'http://localhost:8081,http://localhost:8089,http://127.0.0.1:8081,http://127.0.0.1:8089';

function main() {
  const haystack = `${process.env.DATABASE_URL ?? ''}\n${process.env.DIRECT_URL ?? ''}`;
  if (!haystack.includes(STAGING_REF)) {
    console.error(`[fly-staging-sync-secrets] BLOCKED: staging ref ${STAGING_REF} not in DATABASE_URL/DIRECT_URL`);
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 16) {
    console.error('[fly-staging-sync-secrets] BLOCKED: JWT_SECRET missing or too short');
    process.exit(1);
  }

  const lines = [
    `API_CORS_ORIGINS=${CORS_ORIGINS}`,
    'NODE_ENV=production',
    'MARKETING_AUTO_POSTER_ENABLED=0',
    'TRUST_PROXY_HOPS=1',
  ];
  for (const key of SECRET_KEYS) {
    const v = process.env[key]?.trim() ?? '';
    if (v.length > 0) lines.push(`${key}=${v}`);
  }

  const tmp = path.join(os.tmpdir(), `viona-fly-secrets-${Date.now()}.env`);
  fs.writeFileSync(tmp, `${lines.join('\n')}\n`, { mode: 0o600 });

  const fly = process.platform === 'win32' ? 'flyctl.exe' : 'flyctl';
  const flyPath = path.join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.fly', 'bin', fly);
  const bin = fs.existsSync(flyPath) ? flyPath : fly;

  console.log(`[fly-staging-sync-secrets] Importing secrets to app ${APP} (keys only):`);
  console.log(lines.map((l) => l.split('=')[0]).join(', '));

  // `flyctl secrets import` reads NAME=VALUE pairs from stdin — it does NOT accept a file
  // path positional argument. Passing a file path there is silently ignored and flyctl then
  // blocks forever waiting on stdin, so the secrets payload must be piped in via `input`.
  const r = spawnSync(bin, ['secrets', 'import', '--app', APP], {
    input: fs.readFileSync(tmp),
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: process.platform === 'win32',
  });

  try {
    fs.unlinkSync(tmp);
  } catch {
    /* ignore */
  }

  if (r.status !== 0) {
    console.error('[fly-staging-sync-secrets] FAIL: fly secrets import');
    process.exit(r.status ?? 1);
  }
  console.log('[fly-staging-sync-secrets] OK');
}

main();
