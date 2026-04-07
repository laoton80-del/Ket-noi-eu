/**
 * M1 — Repo-level **native App Check readiness** (dependencies + config signals). Does not prove a device token.
 *
 * Checks:
 *   - package.json includes @react-native-firebase/app + app-check
 *   - active Expo config (`app.config.js` preferred, fallback `app.json`) registers both Expo config plugins
 *   - Optional: google-services.json / GoogleService-Info.plist at repo root (native Firebase)
 *
 * Env:
 *   TRUST_NATIVE_READINESS_STRICT=1  → exit 1 if any required piece is missing (default: exit 0, print report)
 *
 * @see docs/G5_PLATFORM_TRUST.md
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const strict = process.env.TRUST_NATIVE_READINESS_STRICT === '1';

function readJSON(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

async function readActiveExpoConfig(rootDir) {
  const configJs = path.join(rootDir, 'app.config.js');
  const configJson = path.join(rootDir, 'app.json');

  if (existsSync(configJs)) {
    // Source-of-truth priority: app.config.js (Expo behavior).
    const loadedModule = await import(pathToFileURL(configJs).href);
    const loaded = loadedModule?.default ?? loadedModule;
    const resolved = typeof loaded === 'function' ? loaded({ config: {} }) : loaded;
    const expo = resolved?.expo ?? {};
    return { expo, sourceFile: 'app.config.js' };
  }

  if (existsSync(configJson)) {
    const app = readJSON(configJson);
    return { expo: app?.expo ?? {}, sourceFile: 'app.json' };
  }

  throw new Error('No Expo config found (expected app.config.js or app.json at repo root).');
}

async function main() {
  const pkgPath = path.join(root, 'package.json');
  const pkg = readJSON(pkgPath);
  const { expo, sourceFile } = await readActiveExpoConfig(root);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const hasApp = Boolean(deps['@react-native-firebase/app']);
  const hasCheck = Boolean(deps['@react-native-firebase/app-check']);
  const plugins = expo?.plugins ?? [];
  const pluginIds = plugins.map((p) => (Array.isArray(p) ? p[0] : p));
  const pluginApp = pluginIds.includes('@react-native-firebase/app');
  const pluginCheck = pluginIds.includes('@react-native-firebase/app-check');
  const gs = existsSync(path.join(root, 'google-services.json'));
  const gi = existsSync(path.join(root, 'GoogleService-Info.plist'));

  const dependencyReady = hasApp && hasCheck;
  const pluginReady = pluginApp && pluginCheck;
  const nativeFirebaseFilesReady = gs && gi;

  /** True when CI/repo can produce a native build wired for RN Firebase App Check (still needs Console + real device). */
  const repoNativeAppCheckWired = dependencyReady && pluginReady;

  const report = {
    native_app_check: {
      rn_firebase_app_dep: hasApp,
      rn_firebase_app_check_dep: hasCheck,
      expo_plugin_app: pluginApp,
      expo_plugin_app_check: pluginCheck,
      config_source_file: sourceFile,
      google_services_android: gs,
      google_service_info_ios: gi,
      repo_native_app_check_wired: repoNativeAppCheckWired,
      native_firebase_config_files_present: nativeFirebaseFilesReady,
    },
    labels: {
      /** Warning-only: store readiness usually requires plist/json in repo or EAS secret copy step. */
      commercial_native_app_check: nativeFirebaseFilesReady && repoNativeAppCheckWired ? 'repo_ready_pending_console' : 'not_ready',
    },
  };

  console.log('[trust-native-readiness]', JSON.stringify(report, null, 2));

  const failures = [];
  if (!dependencyReady) failures.push('missing @react-native-firebase/app or app-check in package.json');
  if (!pluginReady) failures.push(`${sourceFile} expo.plugins must include @react-native-firebase/app and app-check`);
  if (!nativeFirebaseFilesReady) failures.push('google-services.json and/or GoogleService-Info.plist missing at repo root');

  if (strict && failures.length) {
    console.error('[trust-native-readiness] STRICT FAIL:', failures.join('; '));
    process.exit(1);
  }

  if (!strict && failures.length) {
    console.warn('[trust-native-readiness] WARN (non-strict):', failures.join('; '));
  }

  process.exit(0);
}

void main();
