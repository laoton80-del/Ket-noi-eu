import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const requiredAnchors = [
  'docs/design/VIONA_GLOBAL_EXPERIENCE_MANIFESTO.md',
  'src/design/vionaTokens.ts',
  'src/design/index.ts',
  'src/components/viona/VionaSurface.tsx',
  'src/components/viona/VionaButton.tsx',
  'src/components/viona/VionaStatusPill.tsx',
  'src/components/viona/VionaUniverseCard.tsx',
  'src/components/viona/VionaUtilityDock.tsx',
  'src/components/viona/VionaSafetyAssist.tsx',
  'src/components/viona/VionaModalSurface.tsx',
  'src/components/viona/index.ts',
];

const tokenGroups = ['colors', 'typography', 'spacing', 'radius', 'shadows', 'layout'];
const forbiddenPublicMarkers = ['VIG Token', 'ViGlobal', 'KNG'];

function readUtf8(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return fs.readFileSync(absolutePath, 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

const missingAnchors = requiredAnchors.filter((anchor) => !exists(anchor));
if (missingAnchors.length > 0) {
  console.error('[design:readiness] Missing required anchors:');
  for (const anchor of missingAnchors) {
    console.error(`- ${anchor}`);
  }
  process.exit(1);
}

const tokenSource = readUtf8('src/design/vionaTokens.ts');
const missingGroups = tokenGroups.filter((group) => !new RegExp(`\\b${group}\\b`).test(tokenSource));
if (missingGroups.length > 0) {
  console.error('[design:readiness] Missing token groups in src/design/vionaTokens.ts:');
  for (const group of missingGroups) {
    console.error(`- ${group}`);
  }
  process.exit(1);
}

if (tokenSource.includes('unsafe-eval')) {
  console.error('[design:readiness] Found forbidden token source marker: unsafe-eval');
  process.exit(1);
}

const foundationFiles = [
  'src/design/vionaTokens.ts',
  'src/design/index.ts',
  'src/components/viona/VionaSurface.tsx',
  'src/components/viona/VionaButton.tsx',
  'src/components/viona/VionaStatusPill.tsx',
  'src/components/viona/VionaUniverseCard.tsx',
  'src/components/viona/VionaUtilityDock.tsx',
  'src/components/viona/VionaSafetyAssist.tsx',
  'src/components/viona/VionaModalSurface.tsx',
  'src/components/viona/index.ts',
];

for (const file of foundationFiles) {
  const source = readUtf8(file);
  if (source.includes('unsafe-eval')) {
    console.error(`[design:readiness] Found forbidden marker "unsafe-eval" in ${file}`);
    process.exit(1);
  }

  for (const marker of forbiddenPublicMarkers) {
    if (source.includes(marker)) {
      console.error(`[design:readiness] Found forbidden public marker "${marker}" in ${file}`);
      process.exit(1);
    }
  }
}

console.log('[design:readiness] PASS');
console.log(`- Required anchors found: ${requiredAnchors.length}`);
console.log(`- Token groups verified: ${tokenGroups.join(', ')}`);
console.log('- Forbidden markers not detected in foundation scope');
