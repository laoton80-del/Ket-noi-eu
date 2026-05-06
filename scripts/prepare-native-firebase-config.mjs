import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const googleServicesJsonPath = path.join(root, 'google-services.json');
const googleServiceInfoPlistPath = path.join(root, 'GoogleService-Info.plist');

function requiredEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function decodeBase64(value, label) {
  try {
    return Buffer.from(value, 'base64');
  } catch {
    throw new Error(`Invalid base64 payload for ${label}.`);
  }
}

function writeRequiredFile(filename, bytes) {
  const targetPath = path.join(root, filename);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, bytes);
  if (!existsSync(targetPath)) {
    throw new Error(`Failed to create ${filename}.`);
  }
}

function main() {
  const alreadyPresent = existsSync(googleServicesJsonPath) && existsSync(googleServiceInfoPlistPath);
  if (alreadyPresent) {
    console.log('native Firebase config already present');
    process.exit(0);
  }

  const jsonB64 = requiredEnv('GOOGLE_SERVICES_JSON_B64');
  const plistB64 = requiredEnv('GOOGLE_SERVICE_INFO_PLIST_B64');

  if (!jsonB64 || !plistB64) {
    console.error(
      'Missing GOOGLE_SERVICES_JSON_B64 and/or GOOGLE_SERVICE_INFO_PLIST_B64. Add GitHub Actions secrets or provide native Firebase config files locally.'
    );
    process.exit(1);
  }

  const jsonBytes = decodeBase64(jsonB64, 'GOOGLE_SERVICES_JSON_B64');
  const plistBytes = decodeBase64(plistB64, 'GOOGLE_SERVICE_INFO_PLIST_B64');

  writeRequiredFile('google-services.json', jsonBytes);
  console.log('created google-services.json');
  writeRequiredFile('GoogleService-Info.plist', plistBytes);
  console.log('created GoogleService-Info.plist');

  if (!existsSync(googleServicesJsonPath) || !existsSync(googleServiceInfoPlistPath)) {
    console.error('Failed to materialize native Firebase config files at repo root.');
    process.exit(1);
  }
}

main();
