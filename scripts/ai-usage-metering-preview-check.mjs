/**
 * Pack V — AI usage metering admin evidence preview readiness.
 * Does not read secrets or call APIs.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const FILES = {
  component: 'src/components/admin/AiUsageMeteringPreview.tsx',
  audit: 'docs/audit/VIONA_PACK_V_AI_USAGE_METERING_PREVIEW_AUDIT.md',
  en: 'src/i18n/locales/en.json',
  vi: 'src/i18n/locales/vi.json',
};

const PREVIEW_KEYS = [
  'title',
  'subtitle',
  'fixture',
  'expected',
  'actual',
  'margin',
  'remaining',
  'autoPause',
  'productionReady',
  'evidenceOnly',
  'noProviderCalls',
  'pass',
  'mismatch',
];

function read(rel) {
  return readFileSync(path.join(root, ...rel.split('/')), 'utf8');
}

function assertPreviewKeys(bundle, label) {
  let errors = 0;
  const preview = bundle?.aiUsage?.preview;
  if (!preview || typeof preview !== 'object') {
    console.error(`[ai-usage-metering-preview-check] ERROR: ${label} missing aiUsage.preview object`);
    return 1;
  }
  for (const k of PREVIEW_KEYS) {
    if (typeof preview[k] !== 'string' || preview[k].length === 0) {
      console.error(`[ai-usage-metering-preview-check] ERROR: ${label} aiUsage.preview.${k} missing or empty`);
      errors += 1;
    }
  }
  return errors;
}

function main() {
  let errors = 0;

  for (const [label, rel] of Object.entries(FILES)) {
    const full = path.join(root, ...rel.split('/'));
    if (!existsSync(full)) {
      console.error(`[ai-usage-metering-preview-check] ERROR: missing ${label}: ${rel}`);
      errors += 1;
    }
  }

  if (errors > 0) {
    console.error('[ai-usage-metering-preview-check] FAIL: required files missing.');
    process.exit(1);
  }

  const component = read(FILES.component);
  if (!component.includes('AI_USAGE_AUDIT_FIXTURES') || !component.includes('evaluateAiUsageFixtureForAudit')) {
    console.error('[ai-usage-metering-preview-check] ERROR: component missing fixture imports/usages.');
    errors += 1;
  }
  if (component.includes('fetch(') || component.includes('axios.')) {
    console.error('[ai-usage-metering-preview-check] ERROR: disallowed HTTP client markers in component.');
    errors += 1;
  }

  let enBundle;
  let viBundle;
  try {
    enBundle = JSON.parse(read(FILES.en));
    viBundle = JSON.parse(read(FILES.vi));
  } catch (e) {
    console.error('[ai-usage-metering-preview-check] ERROR: failed to parse locale JSON', e);
    process.exit(1);
  }
  errors += assertPreviewKeys(enBundle, 'en.json');
  errors += assertPreviewKeys(viBundle, 'vi.json');

  if (errors > 0) {
    console.error('[ai-usage-metering-preview-check] FAIL: validation failed.');
    process.exit(1);
  }

  console.log('[ai-usage-metering-preview-check] OK: preview component, i18n markers, audit doc present.');
  process.exit(0);
}

main();
