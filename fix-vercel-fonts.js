const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const distDir = path.join(projectRoot, 'dist');
const oldVendorDir = path.join(distDir, 'assets', 'node_modules');
const newVendorDir = path.join(distDir, 'assets', 'fonts_vendor');

function walkFiles(dirPath, collector) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, collector);
    } else {
      collector.push(fullPath);
    }
  }
}

function run() {
  if (!fs.existsSync(distDir)) {
    console.log('[fix-vercel-fonts] dist folder not found, skipping.');
    return;
  }

  if (fs.existsSync(oldVendorDir)) {
    if (fs.existsSync(newVendorDir)) {
      fs.rmSync(newVendorDir, { recursive: true, force: true });
    }
    fs.renameSync(oldVendorDir, newVendorDir);
    console.log('[fix-vercel-fonts] Renamed assets/node_modules -> assets/fonts_vendor');
  } else {
    console.log('[fix-vercel-fonts] assets/node_modules not found, continuing rewrite pass.');
  }

  const allFiles = [];
  walkFiles(distDir, allFiles);

  const jsFiles = allFiles.filter((filePath) => filePath.endsWith('.js'));
  let replacedFiles = 0;

  for (const jsFile of jsFiles) {
    const content = fs.readFileSync(jsFile, 'utf8');
    if (!content.includes('assets/node_modules/')) {
      continue;
    }
    const nextContent = content.split('assets/node_modules/').join('assets/fonts_vendor/');
    fs.writeFileSync(jsFile, nextContent, 'utf8');
    replacedFiles += 1;
  }

  console.log(`[fix-vercel-fonts] Rewrote font paths in ${replacedFiles} JS file(s).`);
}

run();
