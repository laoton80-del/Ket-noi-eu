/**
 * Pack 62LOCALBRIGHT_APPROVE — operator-approved visual set governance + QA.
 *   node scripts/operator-approved-visual-set-pack-62localbright.mjs [--port 8094] [--skip-capture]
 */
import { createHash } from 'node:crypto';
import { copyFileSync, readFileSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = path.join(ROOT, 'assets/viona/dynamic-hero/local');
const APPROVED = path.join(
  ROOT,
  'assets/viona/dynamic-hero/_incoming-local-bright-62localbright/_operator-approved-visual-set-62localbright'
);
const SUPERSEDED = path.join(
  ROOT,
  'assets/viona/dynamic-hero/_incoming-local-bright-62localbright/_superseded-semantic-fail-do-not-wire'
);
const BACKUP = path.join(LIVE, '_backup-before-superseded-ab-preview-62localbright');
const OUT = path.join(
  ROOT,
  'docs/design/evidence/wave-3b-local-bright-operator-approved-visual-set-pack-62localbright'
);
const port = process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : '8094';
const skipCapture = process.argv.includes('--skip-capture');
const BASE = `http://localhost:${port}`;
const OPERATOR_DATE = '2026-06-08';

const PATTERNS = [
  /^local-.+-web-normal-master-62localbright\.png$/,
  /^local-.+-web-normal-card-62localbright\.png$/,
];

const EXPECTED_MASTERS = [
  'local-overview-web-normal-master-62localbright.png',
  'local-my-requests-web-normal-master-62localbright.png',
  'local-booking-assist-web-normal-master-62localbright.png',
  'local-legal-wealth-web-normal-master-62localbright.png',
  'local-browse-services-web-normal-master-62localbright.png',
];

const EXPECTED_CARDS = [
  'local-my-requests-web-normal-card-62localbright.png',
  'local-booking-assist-web-normal-card-62localbright.png',
  'local-legal-wealth-web-normal-card-62localbright.png',
  'local-browse-services-web-normal-card-62localbright.png',
];

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function pngMeta(filePath) {
  const buf = readFileSync(filePath);
  let png;
  try {
    png = PNG.sync.read(buf);
  } catch (e) {
    throw new Error(`Invalid PNG: ${filePath}: ${e.message}`);
  }
  return {
    width: png.width,
    height: png.height,
    size: buf.length,
    sha256: sha256(filePath),
    validPng: true,
  };
}

async function listApprovedFiles(dir) {
  return (await readdir(dir))
    .filter((n) => PATTERNS.some((re) => re.test(n)))
    .sort();
}

async function manifestRows(dir) {
  const names = await listApprovedFiles(dir);
  const rows = [];
  for (const name of names) {
    rows.push({ filename: name, ...pngMeta(path.join(dir, name)) });
  }
  return rows;
}

function approvalManifestMd(rows) {
  const lines = [
    '# Operator-approved manifest — Pack 62LOCALBRIGHT_APPROVE',
    '',
    `**Operator decision date:** ${OPERATOR_DATE}`,
    '**Source:** Current live preview copied from `_superseded-semantic-fail-do-not-wire/` (operator visually approved)',
    '**Semantic auto-audit:** FAIL downgraded to **WARN** by operator for this pack only',
    '',
    '| filename | size (bytes) | dimensions | SHA256 | dim check |',
    '|----------|--------------|------------|--------|-----------|',
    ...rows.map((r) => {
      const isMaster = r.filename.includes('-master-');
      const dimOk = isMaster
        ? r.width === 2590 && r.height === 607
        : r.width === 1672 && r.height === 941;
      return `| ${r.filename} | ${r.size} | ${r.width}×${r.height} | \`${r.sha256}\` | ${dimOk ? 'PASS' : 'FAIL'} |`;
    }),
    '',
    `**Masters:** ${rows.filter((r) => r.filename.includes('-master-')).length}/5`,
    `**Cards:** ${rows.filter((r) => r.filename.includes('-card-')).length}/4`,
    '',
  ];
  return lines.join('\n');
}

async function stageApprovedFromLive() {
  await mkdir(APPROVED, { recursive: true });
  const liveNames = await listApprovedFiles(LIVE);
  if (liveNames.length !== 9) throw new Error(`Expected 9 live files, found ${liveNames.length}`);
  for (const name of liveNames) {
    copyFileSync(path.join(LIVE, name), path.join(APPROVED, name));
  }
  return liveNames;
}

async function syncLiveFromApproved(approvedRows) {
  let copied = 0;
  for (const row of approvedRows) {
    const livePath = path.join(LIVE, row.filename);
    const liveSha = sha256(livePath);
    if (liveSha !== row.sha256) {
      copyFileSync(path.join(APPROVED, row.filename), livePath);
      copied++;
    }
  }
  return copied;
}

async function captureScreenshots() {
  await mkdir(OUT, { recursive: true });
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const captures = [
    { file: 'local-approved-default-1920x1080.png', w: 1920, h: 1080, hover: null },
    { file: 'local-approved-hover-my-requests-1920x1080.png', w: 1920, h: 1080, hover: 'local-tile-my-requests' },
    { file: 'local-approved-hover-booking-assist-1920x1080.png', w: 1920, h: 1080, hover: 'local-cta-booking-assist' },
    { file: 'local-approved-hover-legal-wealth-1920x1080.png', w: 1920, h: 1080, hover: 'local-tile-legal-wealth' },
    { file: 'local-approved-hover-browse-services-1920x1080.png', w: 1920, h: 1080, hover: 'local-cta-browse-services' },
    { file: 'local-approved-default-1366x768.png', w: 1366, h: 768, hover: null },
    { file: 'local-approved-mobile-sanity-390x844.png', w: 390, h: 844, hover: null },
  ];
  const runtime = [];
  for (const cap of captures) {
    const page = await browser.newPage({ viewport: { width: cap.w, height: cap.h } });
    await page.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    });
    await page.goto(`${BASE}/local?approved62=${Date.now()}`, { waitUntil: 'commit', timeout: 300_000 });
    await page.waitForSelector('[data-testid="local-dynamic-hero-frame"]', { timeout: 180_000 });
    await page.waitForTimeout(1500);
    if (cap.hover) {
      await page.locator(`[data-testid="${cap.hover}"]`).hover();
      await page.waitForTimeout(900);
    }
    const state = await page.evaluate(() => {
      const hero = document.querySelector('[data-testid="local-dynamic-hero"]');
      const title = document.querySelector('[data-testid="local-hero-title"]');
      return {
        activeHeroKey: hero?.dataset?.activeHeroKey ?? null,
        heroCopyKey: hero?.dataset?.heroCopyKey ?? null,
        heroTitle: hero?.dataset?.heroTitle ?? title?.textContent?.trim() ?? null,
        heroDisplayMode: hero?.dataset?.heroDisplayMode ?? null,
      };
    });
    await page.locator('[data-testid="local-dynamic-hero-frame"]').screenshot({
      path: path.join(OUT, cap.file),
    });
    runtime.push({ ...cap, state });
    await page.close();
    console.log('captured', cap.file);
  }
  await browser.close();
  return runtime;
}

const copiedToApproved = await stageApprovedFromLive();
const approvedRows = await manifestRows(APPROVED);
await writeFile(path.join(APPROVED, 'APPROVAL_MANIFEST.md'), approvalManifestMd(approvedRows));

const mastersOk = EXPECTED_MASTERS.every((f) => {
  const r = approvedRows.find((x) => x.filename === f);
  return r && r.width === 2590 && r.height === 607;
});
const cardsOk = EXPECTED_CARDS.every((f) => {
  const r = approvedRows.find((x) => x.filename === f);
  return r && r.width === 1672 && r.height === 941;
});

const liveRows = await manifestRows(LIVE);
const liveMatch = approvedRows.every((a) => {
  const l = liveRows.find((x) => x.filename === a.filename);
  return l && l.sha256 === a.sha256;
});
let liveSynced = 0;
if (!liveMatch) {
  liveSynced = await syncLiveFromApproved(approvedRows);
}

const supersededRows = await manifestRows(SUPERSEDED).catch(() => []);
const approvedMatchesSuperseded = approvedRows.every((a) => {
  const s = supersededRows.find((x) => x.filename === a.filename);
  return s && s.sha256 === a.sha256;
});

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, 'approved-asset-manifest.md'), approvalManifestMd(approvedRows));

const proof = {
  pack: '62LOCALBRIGHT_APPROVE',
  operatorDecisionDate: OPERATOR_DATE,
  approvedFolder: APPROVED,
  filesCopiedToApproved: copiedToApproved,
  approvedCount: approvedRows.length,
  mastersVerified: mastersOk,
  cardsVerified: cardsOk,
  allValidPng: approvedRows.every((r) => r.validPng),
  liveMatchesApproved: liveMatch || liveSynced > 0,
  liveSyncedFiles: liveSynced,
  approvedMatchesSupersededSource: approvedMatchesSuperseded,
  approved: approvedRows,
  live: await manifestRows(LIVE),
  backupDir: BACKUP,
  supersededDir: SUPERSEDED,
};

if (!skipCapture) {
  proof.captures = await captureScreenshots();
}

await writeFile(path.join(OUT, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Approved folder → ${APPROVED}`);
console.log(`Files staged: ${approvedRows.length}`);
console.log(`Masters 2590×607: ${mastersOk ? 'PASS' : 'FAIL'}`);
console.log(`Cards 1672×941: ${cardsOk ? 'PASS' : 'FAIL'}`);
console.log(`Live matches approved: ${proof.liveMatchesApproved ? 'YES' : 'NO'} (synced ${liveSynced})`);
console.log(`Evidence → ${OUT}`);
