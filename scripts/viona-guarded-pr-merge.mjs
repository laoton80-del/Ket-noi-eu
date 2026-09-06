/**
 * Viona Guarded PR Merge Wrapper
 *
 * REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY
 * GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH
 *
 * Default: DRY-RUN (zero merge mutation).
 * Actual merge requires explicit --execute and passes every verification.
 * Wrapper cannot manufacture gate success, alter protection, or admin-bypass.
 */

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import {
  GATE_CHECK_RUN_NAME,
  CANONICAL_REPOSITORY,
  CANONICAL_BASE_BRANCH,
  CANONICAL_MERGE_MODE,
  REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
  GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
  computeReviewedScopeDigest,
  sanitizeEvidence,
  BLOCKERS,
} from './viona-merge-authorization-gate.mjs';

export {
  REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
  GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
  GATE_CHECK_RUN_NAME,
};

const FULL_SHA_RE = /^[0-9a-f]{40}$/i;

export function parseGuardedMergeArgs(argv) {
  const out = {
    repo: null,
    pr: null,
    head: null,
    base: null,
    mode: null,
    reviewedScopeDigest: null,
    gateAppId: null,
    execute: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    switch (a) {
      case '--repo':
        out.repo = next;
        i += 1;
        break;
      case '--pr':
        out.pr = next;
        i += 1;
        break;
      case '--head':
        out.head = next;
        i += 1;
        break;
      case '--base':
        out.base = next;
        i += 1;
        break;
      case '--mode':
        out.mode = next;
        i += 1;
        break;
      case '--reviewed-scope-digest':
        out.reviewedScopeDigest = next;
        i += 1;
        break;
      case '--gate-app-id':
        out.gateAppId = next;
        i += 1;
        break;
      case '--execute':
        out.execute = true;
        break;
      default:
        break;
    }
  }
  return out;
}

/**
 * Pure verification of guarded-merge preconditions.
 */
export function evaluateGuardedMerge(facts) {
  const evidence = sanitizeEvidence({
    repository: facts.repository,
    prNumber: facts.prNumber,
    headSha: facts.headSha,
    base: facts.base,
    mode: facts.mode,
    primaryEnforcement: REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
    wrapperRole: GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
  });

  const fail = (blocker, extra = {}) => ({
    ok: false,
    blocker,
    evidence: { ...evidence, decision: 'blocked', blocker, ...extra },
  });

  if (facts.repository !== CANONICAL_REPOSITORY) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
      reason: 'repository_mismatch',
    });
  }

  if (facts.prMissing || facts.prState !== 'OPEN') {
    return fail(BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH, {
      reason: facts.prMissing ? 'pr_missing' : 'pr_not_open',
    });
  }

  if (
    !FULL_SHA_RE.test(String(facts.headSha ?? '')) ||
    String(facts.headSha).toLowerCase() !== String(facts.actualHeadSha).toLowerCase()
  ) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH);
  }

  if (facts.base !== CANONICAL_BASE_BRANCH || facts.actualBase !== CANONICAL_BASE_BRANCH) {
    return fail(BLOCKERS.BLOCKED_MERGE_BASE_BRANCH_MISMATCH);
  }

  if (facts.mode !== CANONICAL_MERGE_MODE) {
    return fail(BLOCKERS.BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH);
  }

  if (
    String(facts.computedReviewedScopeDigest).toLowerCase() !==
    String(facts.suppliedReviewedScopeDigest).toLowerCase()
  ) {
    return fail(BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW);
  }

  if (facts.autoMergeActive === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTO_MERGE_ACTIVE);
  }

  if (facts.unresolvedConversation === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION);
  }

  if (facts.reviewSatisfied !== true) {
    return fail(BLOCKERS.BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED);
  }

  if (facts.requiredCheckFailed === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED);
  }

  if (facts.gateCheckMissing === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED, { reason: 'gate_check_missing' });
  }

  if (facts.gateCheckStaleSha === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH, {
      reason: 'gate_check_stale_sha',
    });
  }

  if (facts.gateCheckConclusion !== 'success') {
    return fail(BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED, {
      reason: 'gate_check_not_success',
    });
  }

  if (facts.duplicateConflictingGateContext === true) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS);
  }

  if (facts.gateAppIdMissing === true || facts.gateAppId == null || facts.gateAppId === '') {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED, {
      reason: 'gate_app_id_missing',
    });
  }

  if (String(facts.gateAppId) !== String(facts.actualGateAppId)) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED, {
      reason: 'gate_app_id_mismatch',
    });
  }

  return {
    ok: true,
    blocker: null,
    evidence: { ...evidence, decision: 'verified', blocker: null },
  };
}

async function listAllPrFiles(deps, owner, repo, prNumber) {
  const files = [];
  let page = 1;
  for (;;) {
    const batch = await deps.restRequest({
      method: 'GET',
      urlPath: `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`,
    });
    const items = Array.isArray(batch) ? batch : [];
    files.push(...items);
    if (items.length < 100) break;
    page += 1;
  }
  return files;
}

export async function runGuardedPrMerge(deps) {
  const args = deps.args ?? parseGuardedMergeArgs(deps.argv ?? []);
  const mergeCalls = [];
  const checkRunCreates = [];
  const protectionMutations = [];

  const restRequest = async (req) => {
    if (/\/merges$|\/merge$/.test(req.urlPath) && req.method === 'PUT') {
      mergeCalls.push(req);
    }
    if (/\/check-runs$/.test(req.urlPath) && req.method === 'POST') {
      checkRunCreates.push(req);
    }
    if (/\/protection/.test(req.urlPath) && ['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      protectionMutations.push(req);
    }
    return deps.restRequest(req);
  };

  const [owner, repoName] = CANONICAL_REPOSITORY.split('/');
  let pr = null;
  let prMissing = true;
  try {
    pr = await restRequest({
      method: 'GET',
      urlPath: `/repos/${owner}/${repoName}/pulls/${args.pr}`,
    });
    prMissing = !pr || pr.message === 'Not Found';
  } catch {
    prMissing = true;
  }

  let files = [];
  if (!prMissing) {
    files = await listAllPrFiles({ restRequest }, owner, repoName, args.pr);
  }
  const computedDigest = computeReviewedScopeDigest(files);

  let unresolvedConversation = false;
  if (!prMissing && deps.graphqlRequest) {
    try {
      const gql = await deps.graphqlRequest({
        query: `query($owner:String!,$repo:String!,$number:Int!){
          repository(owner:$owner,name:$repo){
            pullRequest(number:$number){
              reviewThreads(first:100){ nodes { isResolved } }
            }
          }
        }`,
        variables: { owner, repo: repoName, number: Number(args.pr) },
      });
      const threads = gql?.data?.repository?.pullRequest?.reviewThreads?.nodes ?? [];
      unresolvedConversation = threads.some((t) => t && t.isResolved === false);
    } catch {
      unresolvedConversation = true;
    }
  }

  let reviews = [];
  if (!prMissing) {
    try {
      reviews = await restRequest({
        method: 'GET',
        urlPath: `/repos/${owner}/${repoName}/pulls/${args.pr}/reviews`,
      });
    } catch {
      reviews = [];
    }
  }
  const reviewSatisfied = Array.isArray(reviews) && reviews.some((r) => r.state === 'APPROVED');

  let requiredCheckFailed = false;
  let gateCheckMissing = true;
  let gateCheckStaleSha = false;
  let gateCheckConclusion = null;
  let actualGateAppId = null;
  let duplicateConflictingGateContext = false;

  if (!prMissing && pr?.head?.sha) {
    const checks = await restRequest({
      method: 'GET',
      urlPath: `/repos/${owner}/${repoName}/commits/${pr.head.sha}/check-runs`,
    });
    const checkRuns = [...(checks?.check_runs ?? []), ...(deps.extraCheckRuns ?? [])];
    const gateOnHead = checkRuns.filter(
      (c) =>
        c.name === GATE_CHECK_RUN_NAME &&
        String(c.head_sha).toLowerCase() === String(pr.head.sha).toLowerCase(),
    );
    const gateOther = checkRuns.filter(
      (c) =>
        c.name === GATE_CHECK_RUN_NAME &&
        String(c.head_sha).toLowerCase() !== String(pr.head.sha).toLowerCase(),
    );
    if (gateOther.some((c) => c.conclusion === 'success')) {
      // conflicting success elsewhere is noted but does not satisfy current head
      void gateOther;
    }
    const aliases = checkRuns.filter(
      (c) =>
        typeof c.name === 'string' &&
        c.name !== GATE_CHECK_RUN_NAME &&
        c.name.startsWith('Viona Merge Authorization Gate'),
    );
    if (aliases.length > 0) duplicateConflictingGateContext = true;
    if (deps.forceDuplicateConflictingGateContext === true) {
      duplicateConflictingGateContext = true;
    }

    if (gateOnHead.length === 0) {
      gateCheckMissing = true;
      if (checkRuns.some((c) => c.name === GATE_CHECK_RUN_NAME)) {
        gateCheckStaleSha = true;
      }
    } else {
      gateCheckMissing = false;
      const success = gateOnHead.find((c) => c.conclusion === 'success');
      gateCheckConclusion = success?.conclusion ?? gateOnHead[0]?.conclusion ?? null;
      actualGateAppId = success?.app?.id ?? gateOnHead[0]?.app?.id ?? null;
    }

    const protection = await restRequest({
      method: 'GET',
      urlPath: `/repos/${owner}/${repoName}/branches/master/protection`,
    });
    const requiredContexts = protection?.required_status_checks?.contexts ?? [];
    for (const ctx of requiredContexts) {
      if (ctx === GATE_CHECK_RUN_NAME) continue;
      const onHead = checkRuns.filter(
        (c) =>
          c.name === ctx &&
          String(c.head_sha).toLowerCase() === String(pr.head.sha).toLowerCase(),
      );
      if (!onHead.some((c) => c.conclusion === 'success')) {
        requiredCheckFailed = true;
      }
    }
  }

  if (deps.forceFacts) {
    // applied after construction below
  }

  const facts = {
    repository: args.repo,
    prNumber: args.pr,
    prMissing,
    prState: prMissing ? null : pr?.state === 'open' ? 'OPEN' : String(pr?.state ?? '').toUpperCase(),
    headSha: args.head,
    actualHeadSha: pr?.head?.sha ?? null,
    base: args.base,
    actualBase: pr?.base?.ref ?? null,
    mode: args.mode,
    computedReviewedScopeDigest: computedDigest,
    suppliedReviewedScopeDigest: args.reviewedScopeDigest,
    autoMergeActive: Boolean(pr?.auto_merge),
    unresolvedConversation,
    reviewSatisfied,
    requiredCheckFailed,
    gateCheckMissing,
    gateCheckStaleSha,
    gateCheckConclusion,
    duplicateConflictingGateContext,
    gateAppIdMissing: args.gateAppId == null || args.gateAppId === '',
    gateAppId: args.gateAppId,
    actualGateAppId,
  };

  if (deps.forceFacts) Object.assign(facts, deps.forceFacts);

  const verification = evaluateGuardedMerge(facts);
  const result = {
    ...verification,
    executeRequested: args.execute === true,
    mergeCalls,
    checkRunCreates,
    protectionMutations,
    mergeInvoked: false,
  };

  if (!verification.ok) {
    deps.log?.(JSON.stringify(sanitizeEvidence(result.evidence)));
    return result;
  }

  if (!args.execute) {
    deps.log?.(JSON.stringify(sanitizeEvidence({ ...result.evidence, dryRun: true })));
    return result;
  }

  // Re-verify immediately before merge (same facts path; deps may re-query)
  const reverify = evaluateGuardedMerge(facts);
  if (!reverify.ok) {
    deps.log?.(JSON.stringify(sanitizeEvidence(reverify.evidence)));
    return { ...result, ...reverify, mergeInvoked: false };
  }

  // At most one merge API invocation; bind to exact current head; never retry
  await restRequest({
    method: 'PUT',
    urlPath: `/repos/${owner}/${repoName}/pulls/${args.pr}/merge`,
    body: {
      merge_method: 'squash',
      sha: pr.head.sha,
    },
  });
  result.mergeInvoked = true;
  result.mergeCalls = mergeCalls;
  deps.log?.(JSON.stringify(sanitizeEvidence({ ...result.evidence, mergeInvoked: true })));
  return result;
}

export function createProductionDeps(env = process.env) {
  const token = env.GITHUB_TOKEN;
  const apiBase = 'https://api.github.com';

  async function restRequest({ method, urlPath, body }) {
    const res = await fetch(`${apiBase}${urlPath}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { message: 'unparseable_response' };
    }
    if (!res.ok) {
      const err = new Error(`GitHub REST ${res.status}`);
      err.sanitized = { status: res.status, message: json?.message ?? 'error' };
      throw err;
    }
    return json;
  }

  async function graphqlRequest({ query, variables }) {
    const res = await fetch(`${apiBase}/graphql`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    return res.json();
  }

  return {
    env,
    restRequest,
    graphqlRequest,
    log: (msg) => console.log(msg),
  };
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(entry)).href;
  } catch {
    return false;
  }
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const deps = createProductionDeps(env);
  deps.argv = argv;
  const result = await runGuardedPrMerge(deps);
  if (!result.ok) process.exitCode = 1;
  return result;
}

if (isDirectRun()) {
  main().catch((err) => {
    console.error(JSON.stringify({ error: 'guarded_merge_failed', message: err?.sanitized?.message ?? 'error' }));
    process.exitCode = 1;
  });
}
