/**
 * Append-only gate for LocalProviderEligibilityAuditEvent (Pack A1 schema boundary).
 * Production authority modules must not call update/updateMany/delete/deleteMany.
 */
import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_MUTATION_RE =
  /\.(update|updateMany|delete|deleteMany)\s*\(/;

const SCAN_ROOTS = [
  path.join('src', 'services', 'local'),
  path.join('src', 'controllers'),
  path.join('src', 'routes'),
] as const;

function listTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTsFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Returns absolute paths that appear to mutate LocalProviderEligibilityAuditEvent.
 * Allows comments mentioning the ban.
 */
export function findForbiddenLocalProviderEligibilityAuditMutations(
  repoRoot: string = process.cwd()
): string[] {
  const hits: string[] = [];
  for (const rel of SCAN_ROOTS) {
    const root = path.join(repoRoot, rel);
    for (const file of listTsFiles(root)) {
      const text = fs.readFileSync(file, 'utf8');
      if (!text.includes('localProviderEligibilityAuditEvent')) continue;
      // Strip block comments and line comments for a coarse gate.
      const stripped = text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      if (!stripped.includes('localProviderEligibilityAuditEvent')) continue;
      if (FORBIDDEN_MUTATION_RE.test(stripped)) {
        hits.push(file);
      }
    }
  }
  return hits;
}
