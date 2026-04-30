const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const distDir = path.join(projectRoot, 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const oldVendorDir = path.join(distDir, 'assets', 'node_modules');
const newVendorDir = path.join(distDir, 'assets', 'fonts_vendor');
const sourceGlobalCss = path.join(projectRoot, 'assets', 'global.css');
const distGlobalCss = path.join(distAssetsDir, 'global.css');
const sourceFavicon = path.join(projectRoot, 'assets', 'favicon.png');
const distFaviconPng = path.join(distAssetsDir, 'favicon.png');
const distIndexHtml = path.join(distDir, 'index.html');
const sourceVercelJson = path.join(projectRoot, 'vercel.json');
const distVercelJson = path.join(distDir, 'vercel.json');

const GLOBAL_CSS_LINK_ID = 'kn-global-web-effects';
const GLOBAL_CSS_HREF_RELATIVE = './assets/global.css';

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

function stripGlobalCssLinks(html) {
  return html.replace(/<link[^>]*global\.css[^>]*>\s*/gi, '');
}

function injectGlobalCssLink(html) {
  const linkTag = `  <link rel="stylesheet" href="${GLOBAL_CSS_HREF_RELATIVE}" id="${GLOBAL_CSS_LINK_ID}">\n`;
  if (html.includes(`id="${GLOBAL_CSS_LINK_ID}"`)) {
    return html;
  }
  if (html.includes('</head>')) {
    return html.replace('</head>', `${linkTag}</head>`);
  }
  return `${html}\n${linkTag}`;
}

function normalizeFaviconLink(html) {
  if (html.includes('id="kn-brand-favicon"')) return html;
  const pngLink = `  <link rel="icon" type="image/png" href="./assets/favicon.png" id="kn-brand-favicon">\n`;
  const next = html.replace(/<link[^>]*rel=["']icon["'][^>]*>\s*/gi, '');
  return next.replace('</head>', `${pngLink}</head>`);
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

  if (fs.existsSync(sourceGlobalCss)) {
    fs.mkdirSync(distAssetsDir, { recursive: true });
    fs.copyFileSync(sourceGlobalCss, distGlobalCss);
    console.log('[fix-vercel-fonts] Copied assets/global.css -> dist/assets/global.css');
  } else {
    console.warn('[fix-vercel-fonts] assets/global.css not found — web effects bundle will be missing.');
  }

  if (fs.existsSync(sourceFavicon)) {
    fs.mkdirSync(distAssetsDir, { recursive: true });
    fs.copyFileSync(sourceFavicon, distFaviconPng);
    console.log('[fix-vercel-fonts] Copied assets/favicon.png -> dist/assets/favicon.png');
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

  if (fs.existsSync(distIndexHtml)) {
    let html = fs.readFileSync(distIndexHtml, 'utf8');
    html = stripGlobalCssLinks(html);
    html = injectGlobalCssLink(html);
    if (fs.existsSync(distFaviconPng)) {
      html = normalizeFaviconLink(html);
    }
    fs.writeFileSync(distIndexHtml, html, 'utf8');
    console.log(
      `[fix-vercel-fonts] dist/index.html: linked ${GLOBAL_CSS_HREF_RELATIVE} (id=${GLOBAL_CSS_LINK_ID}) and normalized favicon.`
    );
  } else {
    console.log('[fix-vercel-fonts] dist/index.html not found, skipping HTML steps.');
  }

  if (fs.existsSync(sourceVercelJson)) {
    fs.copyFileSync(sourceVercelJson, distVercelJson);
    console.log('[fix-vercel-fonts] Copied vercel.json -> dist/vercel.json (SPA rewrites when deploy root is dist).');
  } else {
    console.warn('[fix-vercel-fonts] vercel.json missing at project root; SPA routes may 404 on refresh.');
  }
}

run();
