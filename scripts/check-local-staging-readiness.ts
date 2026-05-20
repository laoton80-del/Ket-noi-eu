/**
 * Read-only Local staging readiness probe (no secrets printed, no DB mutations).
 *
 * Run: npx tsx scripts/check-local-staging-readiness.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

const ENV_KEYS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'EXPO_PUBLIC_REST_API_BASE',
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
] as const;

function envPresent(name: string): boolean {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
}

function loadDotEnvFiles(): void {
  for (const name of ['.env', '.env.local']) {
    const p = path.join(ROOT, name);
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key] === undefined) {
        process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

function main(): void {
  loadDotEnvFiles();

  const present: string[] = [];
  const missing: string[] = [];

  for (const key of ENV_KEYS) {
    if (envPresent(key)) present.push(key);
    else missing.push(key);
  }

  console.log('[check-local-staging-readiness] env keys present:', present.join(', ') || '(none)');
  console.log('[check-local-staging-readiness] env keys missing:', missing.join(', ') || '(none)');
  console.log(
    '[check-local-staging-readiness] DATABASE_URL:',
    envPresent('DATABASE_URL') ? 'set' : 'not set'
  );
  console.log(
    '[check-local-staging-readiness] DIRECT_URL:',
    envPresent('DIRECT_URL') ? 'set' : 'not set'
  );

  if (!envPresent('DATABASE_URL')) {
    console.warn(
      '[check-local-staging-readiness] DB-backed Local scripts will SKIP without DATABASE_URL.'
    );
    process.exitCode = 0;
    return;
  }

  console.log('[check-local-staging-readiness] OK — minimum DB env present for scripted verification.');
}

main();
