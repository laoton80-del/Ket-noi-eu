/**
 * apiClient must not read EXPO_PUBLIC_DEV_REST_JWT; missing session JWT fails closed
 * (Authorization omitted) per existing restApiFetchJson contract.
 *
 * Run: npx tsx scripts/test-api-client-no-public-dev-jwt.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const API_CLIENT = path.join(ROOT, 'src/services/apiClient.ts');

const EXECUTABLE_ROOTS = [
  'src/services/apiClient.ts',
  'App.tsx',
  'index.ts',
  'app.config.js',
  'src/screens/b2c/LocalScreen.tsx',
  'src/services/ultraMasterBookingFlow.ts',
  'src/utils/b2bAccess.ts',
] as const;

function run(): void {
  for (const rel of EXECUTABLE_ROOTS) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const src = fs.readFileSync(abs, 'utf8');
    assert.equal(
      src.includes('EXPO_PUBLIC_DEV_REST_JWT'),
      false,
      `${rel} must not reference EXPO_PUBLIC_DEV_REST_JWT`
    );
  }

  const apiSrc = fs.readFileSync(API_CLIENT, 'utf8');
  assert.equal(apiSrc.includes('getDevJwtOverride'), false, 'getDevJwtOverride must be removed');
  assert.match(
    apiSrc,
    /return fromStorage\.length > 0 \? fromStorage : null/,
    'getRestApiJwt must return null when storage is empty'
  );
  assert.match(
    apiSrc,
    /if \(jwt\) headers\.Authorization = `Bearer \$\{jwt\}`/,
    'restApiFetchJson must omit Authorization when session JWT is missing'
  );
  assert.equal(
    /process\.env\.EXPO_PUBLIC_DEV_REST_JWT/.test(apiSrc),
    false,
    'apiClient must not read EXPO_PUBLIC_DEV_REST_JWT from process.env'
  );

  console.log('[test-api-client-no-public-dev-jwt] OK');
}

run();
