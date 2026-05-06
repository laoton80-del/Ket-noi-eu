import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Rule = Readonly<{
  path: string;
  forbidden: readonly string[];
  allowedSnippets?: readonly string[];
}>;

const rules: readonly Rule[] = [
  {
    path: 'src/screens/HomeScreen.tsx',
    forbidden: ['KNG'],
    allowedSnippets: ['Powered by KNG Ecosystem'],
  },
  {
    path: 'src/screens/LifeOSDashboard.tsx',
    forbidden: ['ViGlobal'],
    allowedSnippets: [],
  },
];

let failures = 0;
for (const rule of rules) {
  const abs = resolve(process.cwd(), rule.path);
  const source = readFileSync(abs, 'utf8');
  for (const token of rule.forbidden) {
    const hasToken = source.includes(token);
    const allowlist = rule.allowedSnippets ?? [];
    const allAllowed = allowlist.every((snippet) => !source.includes(snippet));
    if (hasToken && allAllowed) {
      failures += 1;
      // eslint-disable-next-line no-console
      console.error(`[brand-check] ${rule.path}: forbidden token "${token}" detected.`);
    }
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  // eslint-disable-next-line no-console
  console.log('[brand-check] OK');
}

