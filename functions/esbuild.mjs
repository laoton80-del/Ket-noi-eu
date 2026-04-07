import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [path.join(__dirname, 'src', 'index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: path.join(__dirname, 'lib', 'index.js'),
  external: [
    'firebase-admin',
    'firebase-functions',
    // Shared app modules under @app pull client-only deps; never execute in Cloud Functions runtime for these paths.
    'react-native',
    '@react-native-async-storage/async-storage',
    'expo-file-system',
    'expo-file-system/legacy',
  ],
  alias: {
    '@app': path.join(__dirname, '..', 'src'),
  },
});
