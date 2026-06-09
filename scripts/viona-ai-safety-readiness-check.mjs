#!/usr/bin/env node
/**
 * VIONA AI safety readiness check (Pack AI0).
 * Verifies AI foundation docs exist and contain required sections.
 * No AI API calls. No external dependencies. Not a mandatory CI gate.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

const REQUIRED_DOCS = [
  {
    rel: 'docs/ai-context/VIONA_AI_PHASE_ROADMAP.md',
    sections: ['Phase 0', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5', 'Forbidden'],
  },
  {
    rel: 'docs/ai-context/VIONA_AI_TOOL_PERMISSION_MATRIX.md',
    sections: [
      'ALLOW_READ_ONLY',
      'ALLOW_DRAFT_ONLY',
      'ALLOW_WITH_USER_CONFIRMATION',
      'FORBIDDEN_UNTIL_PRODUCTION_GATES',
      'Forbidden autonomy',
      'Source-of-truth',
    ],
  },
  {
    rel: 'docs/ai-context/VIONA_AI_AUTOMATION_READINESS_MATRIX.md',
    sections: [
      'Home',
      'Local',
      'Travel',
      'Academy',
      'Business',
      'Account',
      'SOS',
      'B2B Wholesale',
      'Source-of-truth',
      'Production gates',
    ],
  },
];

const RELATED_DOCS = [
  'docs/ai-context/VIONA_OPERATING_PROTOCOL.md',
  'docs/ai-context/VIONA_FORBIDDEN_CLAIMS_CHECKER.md',
  'docs/ai-context/VIONA_ROUTE_CAPABILITY_INVENTORY.md',
];

const READINESS_CATEGORIES = [
  { id: 'foundation_docs', label: 'AI foundation docs (Phase 0)' },
  { id: 'permission_matrix', label: 'Tool permission matrix' },
  { id: 'universe_matrix', label: 'Universe readiness matrix' },
  { id: 'related_safety', label: 'Related safety / inventory docs' },
  { id: 'forbidden_autonomy', label: 'Forbidden autonomy documented' },
];

function checkDoc(doc) {
  const abs = path.join(ROOT, doc.rel);
  if (!existsSync(abs)) {
    return { ok: false, missing: [doc.rel], sectionFails: [] };
  }
  const content = readFileSync(abs, 'utf8');
  const sectionFails = doc.sections.filter((s) => !content.includes(s));
  return { ok: sectionFails.length === 0, missing: [], sectionFails };
}

function main() {
  const results = [];
  let fail = 0;

  for (const doc of REQUIRED_DOCS) {
    const r = checkDoc(doc);
    results.push({ doc: doc.rel, ...r });
    if (!r.ok) fail += 1;
  }

  const relatedMissing = RELATED_DOCS.filter((rel) => !existsSync(path.join(ROOT, rel)));

  const toolMatrix = readFileSync(
    path.join(ROOT, 'docs/ai-context/VIONA_AI_TOOL_PERMISSION_MATRIX.md'),
    'utf8'
  );
  const forbiddenCount = (toolMatrix.match(/FORBIDDEN_UNTIL_PRODUCTION_GATES/g) || []).length;

  console.log('VIONA AI safety readiness check (Pack AI0 — docs only)');
  console.log('No AI API calls. Manual audit companion.\n');

  console.log('Readiness categories:');
  for (const cat of READINESS_CATEGORIES) {
    let status = 'PASS';
    if (cat.id === 'foundation_docs' && results.some((r) => r.doc.includes('PHASE_ROADMAP') && !r.ok)) {
      status = 'FAIL';
    }
    if (cat.id === 'permission_matrix' && results.some((r) => r.doc.includes('TOOL_PERMISSION') && !r.ok)) {
      status = 'FAIL';
    }
    if (cat.id === 'universe_matrix' && results.some((r) => r.doc.includes('AUTOMATION_READINESS') && !r.ok)) {
      status = 'FAIL';
    }
    if (cat.id === 'related_safety' && relatedMissing.length > 0) status = 'FAIL';
    if (cat.id === 'forbidden_autonomy' && forbiddenCount < 5) status = 'FAIL';
    console.log(`  ${cat.label}: ${status}`);
  }

  console.log('\nRequired docs:');
  for (const r of results) {
    if (r.ok) {
      console.log(`  PASS ${r.doc}`);
    } else {
      if (r.missing.length) console.log(`  FAIL ${r.doc} — missing file`);
      if (r.sectionFails?.length) {
        console.log(`  FAIL ${r.doc} — missing sections: ${r.sectionFails.join(', ')}`);
      }
    }
  }

  if (relatedMissing.length) {
    console.log('\nRelated docs missing:');
    for (const m of relatedMissing) console.log(`  - ${m}`);
    fail += 1;
  } else {
    console.log('\nRelated safety docs: PASS');
  }

  console.log(`\nForbidden-gated actions documented: ${forbiddenCount}`);

  if (fail > 0) {
    console.log('\nResult: FAIL — fix missing docs/sections before AI phase promotion.');
    process.exitCode = 1;
    return;
  }

  console.log('\nResult: PASS — AI0 foundation docs present.');
  console.log('Next: operator sign-off for Phase 1 per universe in VIONA_AI_AUTOMATION_READINESS_MATRIX.md');
}

main();
