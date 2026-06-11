import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = 'C:/KNG/ket-noi-eu/assets/viona/dynamic-hero/travel';
const TARGET = path.join(__dirname, '../../../../assets/viona/dynamic-hero/travel');
const OUT = __dirname;

function pngMeta(filePath) {
  const buf = readFileSync(filePath);
  const sha256 = createHash('sha256').update(buf).digest('hex');
  let width = null;
  let height = null;
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
    width = buf.readUInt32BE(16);
    height = buf.readUInt32BE(20);
  }
  const aspect = width && height ? +(width / height).toFixed(3) : null;
  return { bytes: buf.length, sha256, width, height, aspect };
}

function classify(name) {
  let group = 'unknown';
  if (name.includes('airport')) group = 'airport';
  else if (name.includes('emergency-police')) group = 'emergencyPolice';
  else if (name.includes('rides-assist')) group = 'rides';
  else if (name.includes('translation-assist')) group = 'translation';

  let kind = 'unknown';
  if (name.includes('-card-')) kind = 'card';
  else if (name.includes('-master-') || name.includes('-source')) kind = 'master';
  else if (name.includes('fullscreen')) kind = 'fullscreen';

  let lane = 'unknown';
  if (kind === 'card') lane = 'card lane';
  else if (kind === 'master' || kind === 'fullscreen') lane = 'hero/master/source lane';

  const slotHint =
    group === 'airport'
      ? kind === 'card'
        ? 'Quick Help Airport card'
        : 'Main hero / airport hover'
      : group === 'translation'
        ? kind === 'card'
          ? 'Quick Help Translation card'
          : 'Translation hero hover'
        : group === 'rides'
          ? kind === 'card'
            ? 'Quick Help Rides card'
            : 'Rides hero hover'
          : group === 'emergencyPolice'
            ? kind === 'card'
              ? 'Quick Help Emergency card'
              : 'Emergency hero hover'
            : '—';

  return { group, kind, lane, slotHint };
}

const files = readdirSync(SOURCE)
  .filter((f) => f.endsWith('.png'))
  .sort();

const inventory = {};
for (const file of files) {
  const full = path.join(SOURCE, file);
  const meta = pngMeta(full);
  const cls = classify(file);
  inventory[file] = { ...meta, sourcePath: full.replace(/\\/g, '/'), ...cls };
}

writeFileSync(path.join(OUT, 'source-asset-inventory.json'), JSON.stringify(inventory, null, 2));

const tiles = files
  .map((file) => {
    const m = inventory[file];
    const rel = `file:///${path.join(SOURCE, file).replace(/\\/g, '/')}`;
    return `<div class="tile"><img src="${rel}" alt="${file}"/><div class="meta"><strong>${file}</strong><br/>${m.width}x${m.height} (${m.aspect}:1)<br/>sha ${m.sha256.slice(0, 12)}…<br/>${m.group} / ${m.kind}<br/>${m.slotHint}</div></div>`;
  })
  .join('\n');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Travel dynamic-hero source contact sheet</title><style>body{font-family:Segoe UI,sans-serif;background:#111;color:#eee;padding:16px}h1{font-size:18px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}.tile{background:#1a1a1a;border:1px solid #333;border-radius:8px;overflow:hidden}.tile img{width:100%;height:140px;object-fit:cover;background:#000}.meta{padding:8px;font-size:11px;line-height:1.4}</style></head><body><h1>Source: C:\\KNG\\ket-noi-eu\\assets\\viona\\dynamic-hero\\travel</h1><div class="grid">${tiles}</div></body></html>`;
writeFileSync(path.join(OUT, 'source-contact-sheet.html'), html);

function pickBest(group, kind) {
  const candidates = files.filter((f) => {
    const c = classify(f);
    return c.group === group && c.kind === kind;
  });
  if (!candidates.length) return null;
  if (kind === 'card') {
    return candidates.find((f) => f.includes('62y')) ?? candidates[0];
  }
  // master: prefer widest aspect for hero
  return candidates
    .map((f) => ({ f, ...inventory[f] }))
    .sort((a, b) => (b.aspect ?? 0) - (a.aspect ?? 0))[0].f;
}

const selection = {
  airport: { card: pickBest('airport', 'card'), master: pickBest('airport', 'master') },
  translation: { card: pickBest('translation', 'card'), master: pickBest('translation', 'master') },
  rides: { card: pickBest('rides', 'card'), master: pickBest('rides', 'master') },
  emergencyPolice: { card: pickBest('emergencyPolice', 'card'), master: pickBest('emergencyPolice', 'master') },
};

mkdirSync(TARGET, { recursive: true });
const copied = [];
for (const [group, slots] of Object.entries(selection)) {
  for (const [lane, file] of Object.entries(slots)) {
    if (!file) continue;
    const src = path.join(SOURCE, file);
    const dst = path.join(TARGET, file);
    let skip = false;
    try {
      const existing = pngMeta(dst);
      if (existing.sha256 === inventory[file].sha256) skip = true;
    } catch {}
    if (!skip) copyFileSync(src, dst);
    copied.push({ group, lane, file, target: dst.replace(/\\/g, '/') });
  }
}

writeFileSync(path.join(OUT, 'selected-assets.json'), JSON.stringify({ selection, copied }, null, 2));
console.log(JSON.stringify({ selection, copiedCount: copied.length }, null, 2));
