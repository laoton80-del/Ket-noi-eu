/**
 * Bounded static check: mobile-reachable roots must not import @prisma/client.
 * Backend / server Local services may still use Prisma.
 *
 * Run: npx tsx scripts/check-mobile-no-prisma-client.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const FORBIDDEN = '@prisma/client';

const ROOT_FILES = ['App.tsx', 'index.ts'] as const;

const ROOT_DIRS = [
  'src/screens',
  'src/components',
  'src/navigation',
  'src/context',
  'src/hooks',
  'src/theme',
  'src/config',
  'src/domain/local',
] as const;

/** Audited Local mobile graph modules (must remain Prisma-free). */
const LOCAL_MOBILE_GRAPH = [
  'src/screens/b2b/localMerchantInboxUi.ts',
  'src/screens/b2c/localUserRequestStatusUi.ts',
  'src/services/local/localMerchantInboxView.ts',
  'src/services/local/localUserRequestCancelEligibility.ts',
  'src/services/local/localMerchantRequestConfirmEligibility.ts',
  'src/services/local/localMerchantRequestRejectEligibility.ts',
  'src/services/localMerchantInboxApi.ts',
  'src/services/localUserRequestApi.ts',
  'src/domain/local/localServiceRequestClientContract.ts',
] as const;

function walkFiles(dir: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(abs, out);
      continue;
    }
    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(abs);
  }
}

function checkFile(relOrAbs: string): string | null {
  const abs = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  if (!fs.existsSync(abs)) return null;
  const src = fs.readFileSync(abs, 'utf8');
  if (!src.includes(FORBIDDEN)) return null;
  return path.relative(ROOT, abs).replace(/\\/g, '/');
}

function run(): void {
  const hits: string[] = [];

  for (const f of ROOT_FILES) {
    const hit = checkFile(f);
    if (hit) hits.push(hit);
  }

  for (const dir of ROOT_DIRS) {
    const files: string[] = [];
    walkFiles(path.join(ROOT, dir), files);
    for (const abs of files) {
      const hit = checkFile(abs);
      if (hit) hits.push(hit);
    }
  }

  for (const f of LOCAL_MOBILE_GRAPH) {
    const hit = checkFile(f);
    if (hit) hits.push(hit);
  }

  const unique = [...new Set(hits)].sort();
  assert.equal(
    unique.length,
    0,
    `mobile-reachable Prisma imports remain:\n${unique.map((h) => `  - ${h}`).join('\n')}`
  );

  console.log('[check-mobile-no-prisma-client] OK');
}

run();
