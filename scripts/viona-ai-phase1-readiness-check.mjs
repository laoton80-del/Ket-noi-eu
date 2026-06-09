#!/usr/bin/env node
/**
 * VIONA AI Phase 1 readiness check (Pack AI1).
 * Verifies AI0 + AI1 planning docs exist with required sections.
 * No AI API calls. No external dependencies. Not a mandatory CI gate.
 */
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

const AI0_SCRIPT = 'scripts/viona-ai-safety-readiness-check.mjs';

const AI1_DOCS = [
  {
    rel: 'docs/ai-context/VIONA_AI_PHASE1_READ_ONLY_COPILOT_PLAN.md',
    sections: [
      'Phase 1 scope',
      'Explicit forbidden',
      'Prompt policy',
      'source-of-truth',
      'Phase 2 promotion',
    ],
  },
  {
    rel: 'docs/ai-context/VIONA_AI_PHASE1_TRAVEL_LOCAL_SPEC.md',
    sections: [
      'Travel Phase 1',
      'Local Phase 1',
      'Forbidden',
      'source-of-truth',
      'Phase 2 promotion',
      'Smart Trio',
    ],
  },
];

function checkDoc(doc) {
  const abs = path.join(ROOT, doc.rel);
  if (!existsSync(abs)) {
    return { ok: false, missing: true, sectionFails: doc.sections };
  }
  const content = readFileSync(abs, 'utf8');
  const sectionFails = doc.sections.filter((s) => !content.includes(s));
  return { ok: sectionFails.length === 0, missing: false, sectionFails };
}

function runAi0Check() {
  const scriptPath = path.join(ROOT, AI0_SCRIPT);
  if (!existsSync(scriptPath)) {
    return { ok: false, reason: 'AI0 readiness script missing' };
  }
  try {
    execFileSync('node', [AI0_SCRIPT], { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.stderr || error.message };
  }
}

function main() {
  let fail = 0;

  console.log('VIONA AI Phase 1 readiness check (Pack AI1 — planning docs only)');
  console.log('No AI API calls. Travel + Local read-only copilot plan.\n');

  const ai0 = runAi0Check();
  console.log(`AI0 foundation check: ${ai0.ok ? 'PASS' : 'FAIL'}`);
  if (!ai0.ok) {
    console.log(`  ${ai0.reason}`);
    fail += 1;
  }

  console.log('\nAI1 plan docs:');
  for (const doc of AI1_DOCS) {
    const r = checkDoc(doc);
    if (r.ok) {
      console.log(`  PASS ${doc.rel}`);
    } else if (r.missing) {
      console.log(`  FAIL ${doc.rel} — file missing`);
      fail += 1;
    } else {
      console.log(`  FAIL ${doc.rel} — missing sections: ${r.sectionFails.join(', ')}`);
      fail += 1;
    }
  }

  const planPath = path.join(ROOT, 'docs/ai-context/VIONA_AI_PHASE1_READ_ONLY_COPILOT_PLAN.md');
  if (existsSync(planPath)) {
    const plan = readFileSync(planPath, 'utf8');
    const forbiddenHits = (plan.match(/Confirm booking|Debit wallet|Dispatch SOS/gi) || []).length;
    console.log(`\nForbidden action examples in plan: ${forbiddenHits >= 3 ? 'present' : 'weak'}`);
    if (forbiddenHits < 3) fail += 1;
  }

  if (fail > 0) {
    console.log('\nResult: FAIL — complete AI1 planning docs before Phase 1 implementation.');
    process.exitCode = 1;
    return;
  }

  console.log('\nResult: PASS — AI1 read-only copilot plan docs present.');
  console.log('Next: commit AI1 docs; then operator sign-off for Travel + Local Phase 1 pilot wiring.');
}

main();
