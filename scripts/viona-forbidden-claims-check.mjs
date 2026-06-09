#!/usr/bin/env node
/**
 * VIONA forbidden production claims checker (Pack D2B + D2E allowlist).
 * Manual audit tool — not a mandatory CI gate until baseline cleanup.
 * No external dependencies.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ALLOW_MARKER = 'VIONA_FORBIDDEN_CLAIMS_ALLOWED_EXAMPLE';

const SEVERITY = {
  BLOCKER: 'BLOCKER',
  REVIEW: 'REVIEW',
  ALLOWED_DOMAIN_TERM: 'ALLOWED_DOMAIN_TERM',
  DOC_EXAMPLE: 'DOC_EXAMPLE',
};

const scanRoots = [
  { dir: 'src', extensions: new Set(['.ts', '.tsx', '.json']) },
  { dir: 'docs', extensions: new Set(['.md']) },
];

const ignoredDirs = new Set([
  '.expo',
  '.git',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'web-build',
]);

const ignoredExtensions = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.mov',
  '.mp4',
  '.pdf',
  '.png',
  '.svg',
  '.webp',
]);

const categories = [
  {
    id: 'payment',
    name: 'Payment / wallet fake production',
    phrases: [
      'paid',
      'charged',
      'captured',
      'escrow',
      'settled',
      'payout',
      'withdraw',
      'cash out',
      'refund processed',
      'money released',
      'payment guaranteed',
    ],
  },
  {
    id: 'sos',
    name: 'SOS fake production',
    phrases: [
      'dispatched',
      'rescue team',
      'ambulance called',
      'police called',
      'emergency response sent',
      'GPS live tracking',
      'live location shared',
      'authority notified',
      'emergency recording started',
    ],
  },
  {
    id: 'ai',
    name: 'AI fake autonomy',
    phrases: [
      'AI will call automatically',
      'AI confirms booking',
      'AI cancels booking',
      'AI pays',
      'AI settles',
      'fully autonomous',
      'no human confirmation needed',
    ],
  },
  {
    id: 'legal',
    name: 'Legal / medical / official overclaim',
    phrases: [
      'official certificate',
      'legally guaranteed',
      'medical diagnosis',
      'legal protection guaranteed',
      'government approved',
    ],
  },
].map((category) => ({
  ...category,
  rules: category.phrases.map((phrase) => ({
    phrase,
    regex: phraseToRegex(phrase),
  })),
}));

const PAYMENT_DOMAIN_RE =
  /(?:^|\/)(?:payment|payments|wallet|ledger|stripe|billing|escrow|settlement|pricing|commercial|payout|refund|transaction|merchant|prisma|migrations?|supabase)(?:\/|$)/i;
const SOS_DOMAIN_RE = /(?:^|\/)(?:sos|lifeline|emergency)(?:\/|$)|sos/i;
const AI_DOMAIN_RE = /(?:^|\/)(?:ai|voice|receptionist|assistant|automation)(?:\/|$)/i;
const USER_FACING_RE = /^src\/(?:screens|components)\//;
const I18N_RE = /(?:^|\/)(?:i18n|locales)(?:\/|$)/;
const DOC_RE = /^docs\//;
const TEST_RE = /(?:__tests__|\.(?:test|spec)\.(?:ts|tsx|js|mjs)$)/;
const CONFIG_RE = /^src\/(?:config|constants|types|validation|storage|state)\//;
const SERVICE_RE = /^src\/(?:services|api|workers|utils)\//;
const AUDIT_DOC_RE =
  /^docs\/(?:audit|production|ops|operating|merchant|design|ai-context|architecture|strategy|spec|roadmap|release|runbooks|qa|handoff)\//;
const OPS_EXEC_DOC_RE = /^docs\/(?:P4_|PILOT_|RECEIPT_)/i;
const MARKETING_SERVICE_RE = /^src\/services\/marketing\//;
const ADMIN_SCREEN_RE = /^src\/screens\/admin\//;
const MVP_SURFACE_GATE_RE = /^src\/navigation\/mvpSurfaceGate/;
const BOOKING_STATUS_UI_RE = /(?:StatusUi|InboxUi|RequestStatus|orderStatus|bookingStatus)/i;

const DOC_EXAMPLE_FILES = [
  'VIONA_OPERATING_PROTOCOL.md',
  'VIONA_FORBIDDEN_CLAIMS_CHECKER.md',
  'VIONA_FORBIDDEN_CLAIMS_BASELINE_TRIAGE.md',
  'VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK',
  'RELEASE_DISCIPLINE.md',
];

const NEGATIVE_DISCLAIMER_RES = [
  /does\s+not\s+dispatch/i,
  /do\s+not\s+dispatch/i,
  /don't\s+dispatch/i,
  /not\s+dispatched/i,
  /not\s+an?\s+emergency\s+service/i,
  /not\s+emergency\s+service/i,
  /call\s+local\s+emergency/i,
  /preview\s+only/i,
  /guidance\s+only/i,
  /not\s+paid/i,
  /not\s+settled/i,
  /not\s+captured/i,
  /not\s+a\s+guarantee/i,
  /not\s+guaranteed/i,
  /not\s+medical\s+advice/i,
  /not\s+legal\s+advice/i,
  /not\s+an?\s+official/i,
  /must\s+not/i,
  /must\s+never/i,
  /forbidden\s+unless/i,
  /no\s+fake/i,
  /do\s+not\s+imply/i,
  /never\s+imply/i,
  /without\s+(?:explicit|verified|approved)/i,
  /exact\s+examples?\s+for\s+docs\s+only/i,
  /≠/,
  /(?:^|\s)not\s+(?:capture|settle|dispatch|share|record)/i,
  /\b(?:lite|demo|pilot|beta|preview|coming\s+soon|gated)\b/i,
  /VIONA_FORBIDDEN_CLAIMS_ALLOWED_EXAMPLE/,
  /no-fake-production/i,
  /forbidden\s+(?:unless|outcomes?|claims?)/i,
  /prohibited\s+behavior/i,
  /not\s+active/i,
  /not\s+enabled/i,
  /display-only/i,
  /simulator\s+only/i,
  /local\s+simulator/i,
  /not\s+a\s+confirmed/i,
  /\*\*No\*\*/i,
  /when\s+(?:available|enabled|ready)/i,
  /will\s+require/i,
  /not\s+yet/i,
  /per\s+backend\s+record/i,
  /do\s+not\s+(?:permit|claim|fake)/i,
];

const STRONG_BLOCKER_PHRASES = new Set([
  'refund processed',
  'money released',
  'payment guaranteed',
  'AI will call automatically',
  'AI confirms booking',
  'AI cancels booking',
  'AI pays',
  'AI settles',
  'no human confirmation needed',
  'ambulance called',
  'police called',
  'emergency response sent',
  'GPS live tracking',
  'live location shared',
  'authority notified',
  'emergency recording started',
  'legally guaranteed',
  'legal protection guaranteed',
  'medical diagnosis',
  'government approved',
]);

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function phraseToRegex(phrase) {
  const flexiblePhrase = phrase
    .trim()
    .split(/\s+/)
    .map(escapeRegex)
    .join('[\\s-]+');
  return new RegExp(`\\b${flexiblePhrase}\\b`, 'i');
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function parseArgs(argv) {
  return {
    strict: argv.includes('--strict'),
    json: argv.includes('--json'),
    failOnAny: argv.includes('--fail-on-any'),
    writeBaseline: argv.includes('--write-baseline'),
  };
}

function shouldSkipDir(dirName) {
  return ignoredDirs.has(dirName);
}

function collectFiles(rootDir, extensions, files = []) {
  if (!existsSync(rootDir)) return files;

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue;
      collectFiles(path.join(rootDir, entry.name), extensions, files);
      continue;
    }

    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (ignoredExtensions.has(ext)) continue;
    if (!extensions.has(ext)) continue;
    files.push(path.join(rootDir, entry.name));
  }

  return files;
}

function isDocExampleFile(relPath) {
  const base = path.basename(relPath);
  return DOC_EXAMPLE_FILES.some((name) => base.includes(name));
}

function isCommentOrDocLine(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('<!--') ||
    trimmed.startsWith('- ') ||
    trimmed.startsWith('|') ||
    /^\*\s*-/.test(trimmed)
  );
}

function hasNegativeDisclaimer(line) {
  return NEGATIVE_DISCLAIMER_RES.some((re) => re.test(line));
}

function isNegatedMatch(line, matchIndex, phrase) {
  const before = line.slice(Math.max(0, matchIndex - 48), matchIndex).toLowerCase();
  const negationHints = [
    'not ',
    'no ',
    'never ',
    "don't ",
    'without ',
    '≠',
    'không ',
    'miễn ',
    '≠ ',
  ];
  if (negationHints.some((hint) => before.endsWith(hint) || before.includes(hint))) return true;

  const windowStart = Math.max(0, matchIndex - 12);
  const around = line.slice(windowStart, matchIndex + phrase.length + 12).toLowerCase();
  if (/\bnot[\s-]+/.test(around)) return true;
  if (/\bno[\s-]+/.test(around)) return true;
  return false;
}

function fileContext(relPath) {
  const ctx = {
    relPath,
    isDoc: DOC_RE.test(relPath),
    isI18n: I18N_RE.test(relPath),
    isUserFacing: USER_FACING_RE.test(relPath) || I18N_RE.test(relPath),
    isTest: TEST_RE.test(relPath),
    isConfig: CONFIG_RE.test(relPath),
    isService: SERVICE_RE.test(relPath),
    isPaymentDomain: PAYMENT_DOMAIN_RE.test(relPath),
    isSosDomain: SOS_DOMAIN_RE.test(relPath),
    isAiDomain: AI_DOMAIN_RE.test(relPath),
    isDocExampleFile: isDocExampleFile(relPath),
  };
  return ctx;
}

function domainAllowsCategory(ctx, categoryId) {
  if (categoryId === 'payment' && (ctx.isPaymentDomain || ctx.isConfig || ctx.isService)) return true;
  if (categoryId === 'sos' && ctx.isSosDomain) return true;
  if (categoryId === 'ai' && ctx.isAiDomain) return true;
  return false;
}

function isAllowedByPathContext(ctx, category, phrase, line) {
  if (category.id === 'sos' && phrase === 'dispatched' && MARKETING_SERVICE_RE.test(ctx.relPath)) {
    return {
      severity: SEVERITY.ALLOWED_DOMAIN_TERM,
      reason: 'Marketing automation trigger status — not emergency dispatch',
    };
  }

  if (category.id === 'payment' && phrase === 'paid' && /SalesLeadCRM/i.test(ctx.relPath)) {
    if (/SALES_LEAD_STATUS\.PAID|PAID:\s*'PAID'/i.test(line)) {
      return {
        severity: SEVERITY.ALLOWED_DOMAIN_TERM,
        reason: 'Admin CRM sales pipeline status — not user wallet claim',
      };
    }
  }

  if (category.id === 'payment' && ADMIN_SCREEN_RE.test(ctx.relPath)) {
    if (
      /\((?:mock|demo)\)/i.test(line) ||
      (/AdminDashboardScreen/i.test(ctx.relPath) && /(?:Cash-Out|Payout Manager|Passive Income)/i.test(line))
    ) {
      return {
        severity: SEVERITY.ALLOWED_DOMAIN_TERM,
        reason: 'Admin-only mock/demo surface — not live user payout',
      };
    }
  }

  if (category.id === 'payment' && phrase === 'settled' && ctx.isI18n && /residencyStatus/i.test(line)) {
    return {
      severity: SEVERITY.ALLOWED_DOMAIN_TERM,
      reason: 'Immigration/residency status label — not payment settlement',
    };
  }

  if (
    category.id === 'payment' &&
    phrase === 'settled' &&
    /__DEV__|hooks settled|console\.log/i.test(line)
  ) {
    return {
      severity: SEVERITY.ALLOWED_DOMAIN_TERM,
      reason: '__DEV__ diagnostic — React hooks settled, not payment',
    };
  }

  if (category.id === 'payment') {
    if (phrase === 'paid' && /\bconst\s+paid\s*=|!paid\.ok/.test(line)) {
      return {
        severity: SEVERITY.ALLOWED_DOMAIN_TERM,
        reason: 'Internal result variable — not user-facing copy',
      };
    }
    if (phrase === 'payout' && /\bconst\s+payout\s*=|payout\.ok/.test(line)) {
      return {
        severity: SEVERITY.ALLOWED_DOMAIN_TERM,
        reason: 'Internal split-payment variable — not user-facing copy',
      };
    }
    if (phrase === 'cash out' && MVP_SURFACE_GATE_RE.test(ctx.relPath) && /not enabled|display-only/i.test(line)) {
      return {
        severity: SEVERITY.ALLOWED_DOMAIN_TERM,
        reason: 'Surface gate negative disclaimer — cash-out disabled',
      };
    }
  }

  return null;
}

function classifyFinding(ctx, category, phrase, line, matchIndex) {
  if (line.includes(ALLOW_MARKER)) {
    return { severity: SEVERITY.DOC_EXAMPLE, reason: 'Explicit allow marker for docs/examples' };
  }

  if (ctx.isDocExampleFile && (hasNegativeDisclaimer(line) || isCommentOrDocLine(line))) {
    return { severity: SEVERITY.DOC_EXAMPLE, reason: 'Protocol/checker doc listing forbidden examples' };
  }

  if (hasNegativeDisclaimer(line) || isNegatedMatch(line, matchIndex, phrase)) {
    return { severity: SEVERITY.ALLOWED_DOMAIN_TERM, reason: 'Negative disclaimer or negated context' };
  }

  const allowedContext = isAllowedByPathContext(ctx, category, phrase, line);
  if (allowedContext) return allowedContext;

  if (ctx.isDoc) {
    if (AUDIT_DOC_RE.test(ctx.relPath) || OPS_EXEC_DOC_RE.test(ctx.relPath)) {
      return { severity: SEVERITY.DOC_EXAMPLE, reason: 'Internal audit/ops/handoff documentation' };
    }
    if (/_AUDIT_|FAKE_PRODUCTION|RISK_AUDIT/i.test(ctx.relPath)) {
      return { severity: SEVERITY.DOC_EXAMPLE, reason: 'Internal audit/ops documentation' };
    }
    if (
      /forbidden|must not|do not|never|prohibited|no-fake|examples? for docs only|Exact examples/i.test(
        line
      )
    ) {
      return { severity: SEVERITY.DOC_EXAMPLE, reason: 'Doc describing prohibited claims or examples' };
    }
    if (ctx.isDocExampleFile) {
      return { severity: SEVERITY.DOC_EXAMPLE, reason: 'Safety/audit documentation' };
    }
    if (/audit|checklist|gate|baseline|triage/i.test(ctx.relPath)) {
      return { severity: SEVERITY.DOC_EXAMPLE, reason: 'Audit doc listing terms for review' };
    }
    return { severity: SEVERITY.REVIEW, reason: 'Documentation — verify audience and intent' };
  }

  if (ctx.isTest) {
    return { severity: SEVERITY.ALLOWED_DOMAIN_TERM, reason: 'Test file' };
  }

  if (domainAllowsCategory(ctx, category.id)) {
    if (ctx.isUserFacing && !ctx.isI18n && !BOOKING_STATUS_UI_RE.test(ctx.relPath)) {
      return {
        severity: SEVERITY.REVIEW,
        reason: 'Domain path but user-facing component — verify copy',
      };
    }
    return {
      severity: SEVERITY.ALLOWED_DOMAIN_TERM,
      reason: 'Legitimate payment/wallet/SOS/AI domain reference',
    };
  }

  if (BOOKING_STATUS_UI_RE.test(ctx.relPath) && category.id !== 'legal') {
    return {
      severity: SEVERITY.ALLOWED_DOMAIN_TERM,
      reason: 'Booking/request status vocabulary — not a production claim',
    };
  }

  if (isCommentOrDocLine(line) && !ctx.isI18n) {
    return { severity: SEVERITY.ALLOWED_DOMAIN_TERM, reason: 'Code comment explaining boundaries' };
  }

  if (ctx.isI18n || ctx.isUserFacing) {
    if (STRONG_BLOCKER_PHRASES.has(phrase.toLowerCase()) || STRONG_BLOCKER_PHRASES.has(phrase)) {
      return { severity: SEVERITY.BLOCKER, reason: 'Strong user-facing fake-production phrase' };
    }
    if (category.id === 'payment' && ['paid', 'captured', 'settled', 'escrow', 'payout'].includes(phrase)) {
      return { severity: SEVERITY.REVIEW, reason: 'Ambiguous payment term in user-facing copy' };
    }
    if (category.id === 'sos') {
      if (
        BOOKING_STATUS_UI_RE.test(ctx.relPath) ||
        /BrainRunStatus|RunStatus|status.*dispatched/i.test(line)
      ) {
        return {
          severity: SEVERITY.REVIEW,
          reason: 'Non-SOS workflow status label — verify not emergency dispatch claim',
        };
      }
      return { severity: SEVERITY.BLOCKER, reason: 'SOS outcome claim in user-facing copy' };
    }
    if (category.id === 'ai') {
      return { severity: SEVERITY.BLOCKER, reason: 'AI autonomy claim in user-facing copy' };
    }
    if (category.id === 'legal') {
      return { severity: SEVERITY.BLOCKER, reason: 'Official/legal/medical overclaim in user-facing copy' };
    }
    return { severity: SEVERITY.REVIEW, reason: 'User-facing phrase needs human review' };
  }

  if (ctx.isConfig || ctx.isService) {
    return { severity: SEVERITY.REVIEW, reason: 'Config/service reference — verify not surfaced to users' };
  }

  return { severity: SEVERITY.REVIEW, reason: 'Unclassified context — manual review' };
}

function scanFile(filePath, rootDir) {
  const relPath = toPosixPath(path.relative(rootDir, filePath));
  const ctx = fileContext(relPath);
  const findings = [];
  let content;

  try {
    if (statSync(filePath).size > 2_000_000) return findings;
    content = readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`[viona-forbidden-claims] Skipping unreadable file: ${relPath} (${error.message})`);
    return findings;
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const category of categories) {
      for (const rule of category.rules) {
        const match = rule.regex.exec(line);
        if (!match) continue;
        const { severity, reason } = classifyFinding(ctx, category, rule.phrase, line, match.index ?? 0);
        findings.push({
          severity,
          category: category.name,
          categoryId: category.id,
          file: relPath,
          lineNumber: index + 1,
          phrase: rule.phrase,
          line: line.trim(),
          reason,
        });
      }
    }
  });

  return findings;
}

function countBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1]));
}

function topFiles(findings, severities, limit = 10) {
  const filtered = findings.filter((f) => severities.includes(f.severity));
  const byFile = new Map();
  for (const f of filtered) {
    const entry = byFile.get(f.file) ?? { count: 0, categories: new Set(), sample: f };
    entry.count += 1;
    entry.categories.add(f.categoryId);
    byFile.set(f.file, entry);
  }
  return [...byFile.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([file, meta]) => ({
      file,
      count: meta.count,
      categories: [...meta.categories],
      samplePhrase: meta.sample.phrase,
      sampleReason: meta.sample.reason,
      sampleLine: meta.sample.line.slice(0, 120),
    }));
}

function sampleByCategory(findings, severities, perCategory = 3) {
  const out = {};
  for (const category of categories) {
    const samples = findings
      .filter((f) => f.category === category.name && severities.includes(f.severity))
      .slice(0, perCategory);
    if (samples.length) out[category.name] = samples;
  }
  return out;
}

function buildSummary(findings, filesScanned) {
  const bySeverity = countBy(findings, (f) => f.severity);
  const byCategory = countBy(findings, (f) => f.category);
  const actionable = findings.filter(
    (f) => f.severity === SEVERITY.BLOCKER || f.severity === SEVERITY.REVIEW
  );
  return {
    scannedFiles: filesScanned,
    totalFindings: findings.length,
    bySeverity,
    byCategory,
    blockerCount: bySeverity[SEVERITY.BLOCKER] ?? 0,
    reviewCount: bySeverity[SEVERITY.REVIEW] ?? 0,
    allowedDomainCount: bySeverity[SEVERITY.ALLOWED_DOMAIN_TERM] ?? 0,
    docExampleCount: bySeverity[SEVERITY.DOC_EXAMPLE] ?? 0,
    topBlockerReviewFiles: topFiles(findings, [SEVERITY.BLOCKER, SEVERITY.REVIEW]),
    samples: sampleByCategory(findings, [SEVERITY.BLOCKER, SEVERITY.REVIEW]),
    actionableCount: actionable.length,
  };
}

function printHumanReport(summary, findings, opts) {
  console.log('VIONA forbidden production claims check (Pack D2B/D2E — severity triage + allowlists)');
  console.log(`Scanned files: ${summary.scannedFiles}`);
  console.log(`Whitelist marker for docs/examples only: ${ALLOW_MARKER}`);
  console.log('');
  console.log('Manual audit mode; not yet a mandatory CI gate until baseline cleanup.');
  if (opts.strict) console.log('Mode: --strict (non-zero on BLOCKER or REVIEW)');
  if (opts.failOnAny) console.log('Mode: --fail-on-any (non-zero on any finding)');
  console.log('');
  console.log('Findings by severity:');
  for (const sev of Object.values(SEVERITY)) {
    console.log(`  ${sev}: ${summary.bySeverity[sev] ?? 0}`);
  }
  console.log('');
  console.log('Findings by category:');
  for (const [cat, count] of Object.entries(summary.byCategory)) {
    console.log(`  ${cat}: ${count}`);
  }

  if (summary.topBlockerReviewFiles.length) {
    console.log('\nTop files (BLOCKER + REVIEW):');
    for (const row of summary.topBlockerReviewFiles) {
      console.log(
        `  ${row.file} (${row.count}) [${row.categories.join(', ')}] — ${row.sampleReason}; e.g. "${row.samplePhrase}"`
      );
    }
  }

  for (const [categoryName, samples] of Object.entries(summary.samples)) {
    console.log(`\n## ${categoryName} — sample BLOCKER/REVIEW`);
    for (const f of samples) {
      console.log(`- [${f.severity}] ${f.file}:${f.lineNumber} :: "${f.phrase}" (${f.reason})`);
      console.log(`  ${f.line}`);
    }
  }

  if (summary.blockerCount === 0 && summary.reviewCount === 0) {
    console.log('\nResult: PASS — no BLOCKER or REVIEW findings.');
  } else if (opts.strict && (summary.blockerCount > 0 || summary.reviewCount > 0)) {
    console.log(
      `\nResult: FAIL (--strict) — ${summary.blockerCount} BLOCKER, ${summary.reviewCount} REVIEW.`
    );
  } else if (summary.blockerCount === 0) {
    console.log(`\nResult: PASS (default) — ${summary.reviewCount} REVIEW finding(s); no BLOCKER.`);
  } else {
    console.log(`\nResult: FAIL (default) — ${summary.blockerCount} BLOCKER, ${summary.reviewCount} REVIEW.`);
  }
}

function resolveExitCode(summary, opts) {
  if (opts.failOnAny && summary.totalFindings > 0) return 1;
  if (opts.strict && (summary.blockerCount > 0 || summary.reviewCount > 0)) return 1;
  if (summary.blockerCount > 0) return 1;
  return 0;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const rootDir = process.cwd();
  const files = scanRoots.flatMap((root) => collectFiles(path.join(rootDir, root.dir), root.extensions));
  const findings = files.flatMap((file) => scanFile(file, rootDir));
  const summary = buildSummary(findings, files.length);

  if (opts.writeBaseline) {
    const baselinePath = path.join(rootDir, 'scripts', 'viona-forbidden-claims-baseline.json');
    writeFileSync(
      baselinePath,
      JSON.stringify({ generatedAt: new Date().toISOString(), summary, findings }, null, 2),
      'utf8'
    );
    console.log(`Baseline written: ${toPosixPath(path.relative(rootDir, baselinePath))}`);
  }

  if (opts.json) {
    console.log(JSON.stringify({ summary, findings }, null, 2));
  } else {
    printHumanReport(summary, findings, opts);
  }

  process.exitCode = resolveExitCode(summary, opts);
}

main();
