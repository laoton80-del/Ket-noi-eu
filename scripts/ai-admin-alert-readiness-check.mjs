/**
 * Pack X — AI admin alert dry-run foundation readiness.
 * Does not read secrets or call APIs.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const FILES = {
  types: 'src/core/aiAlerts/aiAdminAlertTypes.ts',
  build: 'src/core/aiAlerts/buildAiAdminAlertPreview.ts',
  fixtures: 'src/core/aiAlerts/aiAdminAlertFixtures.ts',
  runbook: 'docs/ops/VIONA_AI_ADMIN_ALERT_DRY_RUN_RUNBOOK.md',
  en: 'src/i18n/locales/en.json',
  vi: 'src/i18n/locales/vi.json',
};

const TS_MARKERS = [
  { file: FILES.types, needles: ['previewOnly', 'productionSendEnabled', 'requiresOwnerReview', 'requiresIncidentLog'] },
  { file: FILES.build, needles: ['previewOnly', 'productionSendEnabled'] },
];

function read(rel) {
  return readFileSync(path.join(root, ...rel.split('/')), 'utf8');
}

function main() {
  let errors = 0;

  for (const [label, rel] of Object.entries(FILES)) {
    const full = path.join(root, ...rel.split('/'));
    if (!existsSync(full)) {
      console.error(`[ai-admin-alert-readiness-check] ERROR: missing ${label}: ${rel}`);
      errors += 1;
    }
  }

  if (errors > 0) {
    console.error('[ai-admin-alert-readiness-check] FAIL: required files missing.');
    process.exit(1);
  }

  for (const { file, needles } of TS_MARKERS) {
    const text = read(file);
    for (const n of needles) {
      if (!text.includes(n)) {
        console.error(`[ai-admin-alert-readiness-check] ERROR: ${file} missing marker "${n}"`);
        errors += 1;
      }
    }
  }

  const buildText = read(FILES.build);
  if (buildText.includes('fetch(') || buildText.includes('axios.')) {
    console.error('[ai-admin-alert-readiness-check] ERROR: disallowed HTTP markers in builder.');
    errors += 1;
  }

  let enBundle;
  let viBundle;
  try {
    enBundle = JSON.parse(read(FILES.en));
    viBundle = JSON.parse(read(FILES.vi));
  } catch (e) {
    console.error('[ai-admin-alert-readiness-check] ERROR: failed to parse locale JSON', e);
    process.exit(1);
  }

  if (!enBundle.aiAlerts?.preview?.title || !viBundle.aiAlerts?.preview?.title) {
    console.error('[ai-admin-alert-readiness-check] ERROR: aiAlerts.preview.title missing in en/vi');
    errors += 1;
  }

  if (errors > 0) {
    console.error('[ai-admin-alert-readiness-check] FAIL: marker or i18n checks failed.');
    process.exit(1);
  }

  console.log('[ai-admin-alert-readiness-check] OK: aiAlerts dry-run module + runbook + i18n anchors present.');
  process.exit(0);
}

main();
