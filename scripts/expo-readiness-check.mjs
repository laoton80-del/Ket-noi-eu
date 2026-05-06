import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function runExpoConfig() {
  execSync('npx expo config --type public', {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
}

function readPackageJson() {
  const packageJsonPath = path.join(root, 'package.json');
  return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
}

function dependencyVersion(pkg, name) {
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? null;
}

function main() {
  console.log('[expo-readiness-check] Running Expo public config check...');
  runExpoConfig();

  const pkg = readPackageJson();
  const failures = [];

  if (existsSync(path.join(root, 'app.json'))) {
    failures.push('app.json must not exist (app.config.js is source of truth).');
  }

  const expectedVersions = {
    expo: '~54.0.34',
    'expo-dev-client': '~6.0.21',
    'expo-file-system': '~19.0.22',
    'expo-image-picker': '~17.0.11',
    'expo-localization': '~17.0.8',
    'expo-notifications': '~0.32.17',
    'expo-print': '~15.0.8',
    'expo-sharing': '~14.0.8',
    'expo-updates': '~29.0.17',
    '@react-native-community/slider': '5.0.1',
  };

  for (const [name, expected] of Object.entries(expectedVersions)) {
    const actual = dependencyVersion(pkg, name);
    if (actual !== expected) {
      failures.push(`${name} expected "${expected}" but found "${actual ?? 'missing'}".`);
    }
  }

  const excludes = pkg.expo?.doctor?.reactNativeDirectoryCheck?.exclude;
  if (!Array.isArray(excludes)) {
    failures.push('expo.doctor.reactNativeDirectoryCheck.exclude is missing or invalid.');
  } else {
    for (const required of ['react-native-fast-image', 'react-native-webrtc']) {
      if (!excludes.includes(required)) {
        failures.push(`expo.doctor.reactNativeDirectoryCheck.exclude missing "${required}".`);
      }
    }
  }

  if (failures.length > 0) {
    console.error('[expo-readiness-check] FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('[expo-readiness-check] PASS');
  console.log('- Expo config resolves successfully.');
  console.log('- app.json is absent.');
  console.log('- Expo SDK 54 pinned versions are aligned.');
  console.log('- React Native Directory excludes include required packages.');
}

main();
