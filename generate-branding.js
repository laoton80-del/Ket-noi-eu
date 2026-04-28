/* eslint-disable no-console */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = __dirname;
const INPUT_CANDIDATES = [
  'brand-logo-source.png',
  'brand-logo.png',
  'assets/images/brand-logo-premium.png',
];

const IMAGE_DIR = path.join(ROOT, 'assets', 'images');
const PWA_DIR = path.join(ROOT, 'assets', 'pwa');

async function resolveInputPath() {
  for (const rel of INPUT_CANDIDATES) {
    const abs = path.join(ROOT, rel);
    try {
      await fs.access(abs);
      return abs;
    } catch {
      // continue
    }
  }
  throw new Error(
    `No source logo found. Place your premium logo at one of: ${INPUT_CANDIDATES.join(', ')}`
  );
}

async function ensureDirs() {
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(PWA_DIR, { recursive: true });
}

async function squareCanvas(inputPath, outPath, size, background) {
  const logo = sharp(inputPath);
  const metadata = await logo.metadata();
  const srcWidth = metadata.width ?? size;
  const srcHeight = metadata.height ?? size;
  const iconCrop = Math.min(srcHeight, Math.round(srcWidth * 0.42));

  const processed = logo
    .extract({
      left: 0,
      top: Math.max(0, Math.floor((srcHeight - iconCrop) / 2)),
      width: Math.max(1, Math.min(srcWidth, iconCrop)),
      height: Math.max(1, Math.min(srcHeight, iconCrop)),
    })
    .resize(Math.round(size * 0.72), Math.round(size * 0.72), { fit: 'contain' })
    .png();

  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  });
  await canvas
    .composite([{ input: await processed.toBuffer(), gravity: 'center' }])
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(outPath);
}

async function createFavicon(inputPath) {
  await sharp(inputPath)
    .resize(48, 48, { fit: 'cover', position: 'left' })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(path.join(IMAGE_DIR, 'favicon.png'));

  await sharp(inputPath)
    .resize(32, 32, { fit: 'cover', position: 'left' })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(path.join(PWA_DIR, 'favicon-32.png'));

  await sharp(inputPath)
    .resize(16, 16, { fit: 'cover', position: 'left' })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(path.join(PWA_DIR, 'favicon-16.png'));
}

async function createSplash(inputPath, outName, bg) {
  const splashSize = 2048;
  const logo = await sharp(inputPath)
    .extract({ left: 0, top: 0, width: 430, height: 430 })
    .resize(920, 920, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: splashSize,
      height: splashSize,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(path.join(IMAGE_DIR, outName));
}

async function createPwaIcons(inputPath) {
  await squareCanvas(inputPath, path.join(PWA_DIR, 'icon-192.png'), 192, '#0B2A66');
  await squareCanvas(inputPath, path.join(PWA_DIR, 'icon-512.png'), 512, '#0B2A66');
  await squareCanvas(inputPath, path.join(PWA_DIR, 'icon-maskable-512.png'), 512, '#0B2A66');

  const manifest = {
    name: 'Kết Nối Global',
    short_name: 'KNG',
    theme_color: '#0B2A66',
    background_color: '#0B2A66',
    display: 'standalone',
    icons: [
      { src: '/assets/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/assets/pwa/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  await fs.writeFile(
    path.join(PWA_DIR, 'manifest-icons.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
}

async function main() {
  await ensureDirs();
  const inputPath = await resolveInputPath();

  await fs.copyFile(inputPath, path.join(IMAGE_DIR, 'brand-logo-premium.png'));
  await squareCanvas(inputPath, path.join(IMAGE_DIR, 'icon.png'), 1024, '#0B2A66');
  await squareCanvas(inputPath, path.join(IMAGE_DIR, 'adaptive-icon.png'), 1024, '#0B2A66');
  await createFavicon(inputPath);
  await createSplash(inputPath, 'splash.png', '#0B2A66');
  await createSplash(inputPath, 'splash-dark.png', '#04122E');
  await createPwaIcons(inputPath);

  console.log('Branding assets generated successfully.');
  console.log('- assets/images/icon.png');
  console.log('- assets/images/adaptive-icon.png');
  console.log('- assets/images/favicon.png');
  console.log('- assets/images/splash.png');
  console.log('- assets/images/splash-dark.png');
  console.log('- assets/pwa/icon-192.png');
  console.log('- assets/pwa/icon-512.png');
  console.log('- assets/pwa/icon-maskable-512.png');
  console.log('- assets/pwa/manifest-icons.json');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
