# Evidence — VIONA Mobile Phase 0 Native Presentation Isolation Implementation Plan

**Packet (exactly two docs, uncommitted):**

1. `docs/product/VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_IMPLEMENTATION_PLAN.md`
2. `docs/design/evidence/cursor-viona-mobile-phase0-native-presentation-isolation-implementation-plan/README.md` (this file)

**Primary classification (this docs lane):**

```text
READY_FOR_VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_IMPLEMENTATION_PLAN_STRICT_READ_ONLY_REVIEW
```

**Mode:** Docs-only · dedicated local branch · uncommitted · **zero** stage / commit / push / PR.

Runtime was **not** implemented.

---

## Authorization phrase

```text
APPROVE_VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_IMPLEMENTATION_PLAN_PACKET_ON_DEDICATED_LOCAL_DOCS_BRANCH_FROM_C788FB36DF1BD2984B30B958C57BBDBCA96FACB6_WITH_EXACT_TWO_NEW_DOCS_UNCOMMITTED_ZERO_STAGE_ZERO_COMMIT_ZERO_PUSH_ZERO_PR_ZERO_RUNTIME_CHANGE_ZERO_WEB_VISUAL_CHANGE_ZERO_NAVIGATION_CHANGE_ZERO_SOS_BEHAVIOR_CHANGE_ZERO_FUNCTION_REMOVAL
```

```text
VIONA_MOBILE_PHASE0_IMPLEMENTATION_PLAN_AUTHORIZATION_PROVENANCE_CONFIRMED
```

---

## Source branch / HEAD

| Field | Value |
|---|---|
| Source branch | `docs/viona-mobile-clear-premium-companion-master-plan` |
| Source / planning HEAD | `c788fb36df1bd2984b30b958c57bbdbca96facb6` |
| Source Master Plan commit | `c788fb36df1bd2984b30b958c57bbdbca96facb6` (subject: `docs(mobile): add Clear Premium Companion master plan`) |
| Parent / origin/master | `c6a19e203a3aa6897cffad8dc9d908f9bca9e9ec` |
| Source tree before branch create | clean, staged 0, local Master Plan unpublished, push 0, PR 0 |

---

## Dedicated planning branch

| Field | Value |
|---|---|
| Branch | `docs/viona-mobile-phase0-native-presentation-isolation-implementation-plan` |
| Created from | `c788fb36df1bd2984b30b958c57bbdbca96facb6` |
| Local collision before create | **absent** |
| Remote branch | **not queried, not created** |
| Push | **0** |
| PR | **0** |

```text
VIONA_MOBILE_PHASE0_IMPLEMENTATION_PLAN_DEDICATED_LOCAL_BRANCH_CREATED
```

---

## Audit classification preserved

```text
READY_FOR_VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_IMPLEMENTATION_PLAN
VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_PLANNED_NOT_IMPLEMENTED
```

Isolation remains planned, not implemented.

---

## Architecture locks recorded in the plan

| Decision | Lock |
|---|---|
| Primary | OPTION A — native presentation wrapper around shared domain/data |
| Secondary | OPTION C — opening-stage presentation adapter/slot only in Phase 0 |
| Option B | Leaf presentation files only; **not** used in Phase 0; never HomeScreen / MainTabNavigator / AdaptiveComposition Metro split |
| Smallest scope | Native **opening stage** only |
| Shared this phase | universe tiles, quick actions, CharityWidget, handlers, i18n, flags |
| `fashionHomeShellMode.ts` | **Do not modify** — presentation target consumes existing shell-mode |
| Feature flag `nativeHomePresentationIsolated` | **Rejected for Phase 0** — deterministic presentation target (Option 2) |
| Native opening | Parity wrapper (A), not a visual copy (B) |
| Token file | **Not** in Phase 0 allowlist; native-specific namespace deferred |
| Clear Premium restyle | Phase 1+, separately authorized |

```text
VIONA_MOBILE_PHASE0_OPTION_A_WITH_OPTION_C_SLOTS_SELECTED_FOR_IMPLEMENTATION_PLANNING
VIONA_MOBILE_PHASE0_OPTION_B_RESTRICTED_TO_LEAF_PRESENTATION_FILES
VIONA_MOBILE_PHASE0_SMALLEST_SAFE_OPENING_STAGE_SCOPE_DOCUMENTED
```

---

## Exact two docs

Existing files modified: **0**.

| Path | Role |
|---|---|
| `docs/product/VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_IMPLEMENTATION_PLAN.md` | Implementation-ready plan |
| `docs/design/evidence/cursor-viona-mobile-phase0-native-presentation-isolation-implementation-plan/README.md` | This evidence record |

No source, runtime, assets, package, lockfile, Kernel/Handoff, Design Mode Lock, workflow, script, or Expo/native config files created or edited.

---

## Mutation counts (this lane)

| Runtime | 0 |
| Source | 0 |
| Web visual | 0 |
| Navigation | 0 |
| SOS | 0 |
| Assets | 0 |
| Package | 0 |
| Lockfile | 0 |
| Existing files | 0 |
| Stage | 0 |
| Commit | 0 |
| Push | 0 |
| PR | 0 |

```text
VIONA_MOBILE_PHASE0_RUNTIME_CHANGE_ZERO
VIONA_WEB_VISUAL_CHANGE_ZERO
VIONA_MOBILE_PHASE0_NAVIGATION_CHANGE_EXCLUDED
VIONA_MOBILE_PHASE0_SOS_BEHAVIOR_CHANGE_EXCLUDED
VIONA_MOBILE_PHASE0_STAGE_ZERO
VIONA_MOBILE_PHASE0_COMMIT_ZERO
VIONA_MOBILE_PHASE0_PUSH_ZERO
VIONA_MOBILE_PHASE0_PR_ZERO
```

---

## Plan contents checklist

The product plan documents:

- exact future runtime boundary (Option A + opening-stage slot);
- exact candidate CREATE/MODIFY/denylist;
- exact `HomePresentationTarget` contract (`web-desktop` / `web-adaptive` / `native-adaptive` / `legacy`);
- exact native opening props and parity-wrapper behavior;
- exact web freeze contract;
- native-specific token namespace strategy (deferred; carve not activated);
- navigation exclusion (four tabs; Account chrome → PersonalHub);
- SOS exclusion (3000ms, canonical modal, exact-one host);
- function preservation (Local, Travel, Academy, Business, Account, SOS);
- test contract (24 items; unit vs static/golden);
- acceptance criteria A–M;
- presentation-layer-only rollback;
- Phase 1 handoff without pulling Phase 1 work.

```text
VIONA_MOBILE_PHASE0_EXACT_CANDIDATE_FILE_BOUNDARY_DOCUMENTED
VIONA_MOBILE_PHASE0_PRESENTATION_TARGET_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE0_WEB_FREEZE_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE0_NATIVE_TOKEN_NAMESPACE_STRATEGY_DOCUMENTED
VIONA_MOBILE_PHASE0_FUNCTION_PRESERVATION_DOCUMENTED
VIONA_MOBILE_PHASE0_TEST_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE0_ACCEPTANCE_CRITERIA_DOCUMENTED
VIONA_MOBILE_PHASE0_ROLLBACK_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE0_PHASE1_BOUNDARY_DOCUMENTED
```

---

## Governance (untouched)

```text
EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_ACTIVE
NEW_ORDINARY_VIONA_PR_CREATION_SUSPENDED
ALL_VIONA_PR_MERGES_PROHIBITED
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
B1B_GOVERNANCE_FREEZE_ACTIVE
NO_RETROACTIVE_AUTHORIZATION_CLAIMED
```

PR #450 was not touched.

---

## Implementation not executed

```text
VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_PLANNED_NOT_IMPLEMENTED
```

Not returned: `READY_TO_IMPLEMENT`, `VIONA_NATIVE_PRESENTATION_ISOLATED`, `CLEAR_PREMIUM_ACTIVATED`, `LIGHT_MODE_CANONICAL`, `BOTTOM_NAV_CHANGED`, `WEB_RESTYLED`.

Eventual implementation marker `VIONA_WEB_VISUAL_ARCHITECTURE_UNCHANGED_BY_PHASE0` is **planned for a future implementation packet**, not achieved here.

---

## Validation (this turn)

| Command | Expected / result |
|---|---|
| `git diff --check` | no whitespace errors on the two new docs |
| `git status --short --branch` | planning branch; exactly two untracked allowlisted docs |
| `git diff --name-only` | empty (untracked docs are not tracked modifications) |
| `git diff --cached --name-only` | empty (staged **0**) |
| HEAD | `c788fb36df1bd2984b30b958c57bbdbca96facb6` |
| `npx tsc --noEmit` | run if tree otherwise mutation-free |
| `npm run ci:expo-readiness` | run if tree otherwise mutation-free |
| `npm run ci:release-discipline` | run if tree otherwise mutation-free |

---

## Next action only

Separately authorize a **strict read-only review** of this two-file Phase 0 implementation-plan packet.

Do not implement runtime. Do not stage, commit, push, or open a PR.
