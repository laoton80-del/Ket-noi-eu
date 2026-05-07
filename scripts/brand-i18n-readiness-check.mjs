/**
 * Read-only brand/i18n readiness checks for public surfaces.
 * - No API calls
 * - No secret reads
 * - No state mutations
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import globPkg from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const FORBIDDEN_MARKERS = [
  'VIG Token',
  'VIG Tokens',
  'VIG gate',
  'Kết Nối Global',
  'ViGlobal',
];

const SCAN_GLOBS = [
  'src/screens/**/*.tsx',
  'src/components/**/*.tsx',
  'src/navigation/**/*.tsx',
  'src/i18n/locales/*.json',
  'src/config/appBrand.ts',
  'src/config/brandConfig.ts',
  'src/core/brand/brandConfig.ts',
  'app.config.js',
];

const LEGACY_ALLOWLIST = [
  'src/screens/admin/',
  'src/screens/broker/BrokerDashboardScreen.tsx',
  'src/components/ui/VigTokenIcon.tsx',
  'src/components/superapp/MiniAppContainer.tsx',
  'src/components/academy/CertificateGenerator.tsx',
  'src/components/academy/ShareAchievementButton.tsx',
  'src/config/appBrand.ts',
  'src/core/brand/brandConfig.ts',
];

const REQUIRED_NAMESPACES = [
  'smartTrio',
  'travel.direction',
  'localCommerce',
  'aiReceptionist',
  'aiCost',
  'telephony',
  'aiUsage.preview',
  'aiEnforcement',
  'aiAlerts',
  'incidents',
];

const LOCALE_FILES = {
  en: 'src/i18n/locales/en.json',
  vi: 'src/i18n/locales/vi.json',
  cs: 'src/i18n/locales/cs.json',
  de: 'src/i18n/locales/de.json',
  fr: 'src/i18n/locales/fr.json',
  ja: 'src/i18n/locales/ja.json',
  ko: 'src/i18n/locales/ko.json',
};

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

function getByPath(obj, dottedPath) {
  return dottedPath.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);
}

function isAllowlisted(relPath) {
  return LEGACY_ALLOWLIST.some((entry) => relPath.startsWith(entry) || relPath === entry);
}

function scanBrandMarkers() {
  const errors = [];
  const warnings = [];

  const files = SCAN_GLOBS.flatMap((pattern) => globPkg.sync(pattern, { cwd: root, nodir: true }));

  for (const rel of files) {
    const body = read(rel);
    for (const marker of FORBIDDEN_MARKERS) {
      if (!body.includes(marker)) continue;
      const issue = `${rel} contains "${marker}"`;
      if (isAllowlisted(rel)) warnings.push(issue);
      else errors.push(issue);
    }
  }

  return { errors, warnings };
}

function scanNamespaces() {
  const errors = [];
  const warnings = [];

  const locales = {};
  for (const [code, rel] of Object.entries(LOCALE_FILES)) {
    try {
      locales[code] = JSON.parse(read(rel));
    } catch (error) {
      errors.push(`Cannot parse locale ${code} (${rel}): ${String(error)}`);
    }
  }

  for (const ns of REQUIRED_NAMESPACES) {
    for (const code of ['en', 'vi']) {
      if (getByPath(locales[code], ns) === undefined) {
        errors.push(`Missing required namespace "${ns}" in ${code}.json`);
      }
    }
    for (const code of ['cs', 'de', 'fr', 'ja', 'ko']) {
      if (getByPath(locales[code], ns) === undefined) {
        warnings.push(`Missing fallback namespace "${ns}" in ${code}.json`);
      }
    }
  }

  return { errors, warnings };
}

function main() {
  const brand = scanBrandMarkers();
  const locale = scanNamespaces();

  const errors = [...brand.errors, ...locale.errors];
  const warnings = [...brand.warnings, ...locale.warnings];

  console.log('[brand-i18n-readiness] Brand marker scan:');
  if (brand.errors.length === 0 && brand.warnings.length === 0) {
    console.log('- No forbidden markers found in checked public surfaces.');
  } else {
    for (const issue of brand.errors) console.log(`- ERROR: ${issue}`);
    for (const issue of brand.warnings) console.log(`- WARN (allowlisted): ${issue}`);
  }

  console.log('[brand-i18n-readiness] Namespace coverage scan:');
  if (locale.errors.length === 0 && locale.warnings.length === 0) {
    console.log('- All required namespaces present for en/vi and fallbacks.');
  } else {
    for (const issue of locale.errors) console.log(`- ERROR: ${issue}`);
    for (const issue of locale.warnings) console.log(`- WARN: ${issue}`);
  }

  if (errors.length > 0) {
    console.error(`[brand-i18n-readiness] FAIL with ${String(errors.length)} error(s).`);
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log(`[brand-i18n-readiness] PASS with ${String(warnings.length)} warning(s).`);
  } else {
    console.log('[brand-i18n-readiness] PASS.');
  }
}

main();
