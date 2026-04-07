/**
 * Cross-platform CI aggregate gate for release discipline.
 * Keeps the same checks for local Windows and CI Linux runners.
 */
import { execSync } from 'node:child_process';

function run(cmd, env = process.env) {
  execSync(cmd, { stdio: 'inherit', shell: true, env });
}

run('npm run ci:expo-readiness');
run('npm run security:preflight');
run('npm run commercial:preflight');
run('npm run trust:native-readiness', { ...process.env, TRUST_NATIVE_READINESS_STRICT: '1' });
run('npm run preflight:release');
