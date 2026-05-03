import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type BoundaryRule = Readonly<{
  path: string;
  forbiddenImports: readonly string[];
}>;

const rules: readonly BoundaryRule[] = [
  {
    path: 'src/lifeOS/hooks/useLifeOSActionCells.ts',
    forbiddenImports: ['../services/b2b/'],
  },
  {
    path: 'src/services/marketplace/merchantRanking.ts',
    forbiddenImports: ['../../lifeOS/'],
  },
];

let failures = 0;
for (const rule of rules) {
  const src = readFileSync(resolve(process.cwd(), rule.path), 'utf8');
  for (const forbidden of rule.forbiddenImports) {
    if (src.includes(forbidden)) {
      failures += 1;
      // eslint-disable-next-line no-console
      console.error(`[boundary-check] ${rule.path}: forbidden import prefix ${forbidden}`);
    }
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  // eslint-disable-next-line no-console
  console.log('[boundary-check] OK');
}

