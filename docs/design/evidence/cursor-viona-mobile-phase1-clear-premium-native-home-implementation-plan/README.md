# Evidence — VIONA Mobile Phase 1 Clear Premium Native Home Implementation Plan

**Packet (exactly two docs, uncommitted):**

1. `docs/product/VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_IMPLEMENTATION_PLAN.md`
2. `docs/design/evidence/cursor-viona-mobile-phase1-clear-premium-native-home-implementation-plan/README.md` (this file)

**Primary classification (this docs lane):**

```text
READY_FOR_VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_IMPLEMENTATION_PLAN_STRICT_READ_ONLY_REVIEW
```

**Mode:** Docs-only · dedicated local branch · uncommitted · **zero** stage / commit / push / PR.

Runtime was **not** implemented.

---

## Authorization phrase

```text
APPROVE_VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_IMPLEMENTATION_PLAN_PACKET_ON_DEDICATED_LOCAL_DOCS_BRANCH_FROM_51153BC3F6303D78EFFC75FD8F31EC43895A613B_WITH_EXACT_TWO_NEW_DOCS_UNCOMMITTED_ZERO_STAGE_ZERO_COMMIT_ZERO_PUSH_ZERO_PR_ZERO_RUNTIME_CHANGE_ZERO_WEB_VISUAL_CHANGE_ZERO_NAVIGATION_CHANGE_ZERO_SOS_BEHAVIOR_CHANGE_ZERO_FUNCTION_REMOVAL
```

```text
VIONA_MOBILE_PHASE1_IMPLEMENTATION_PLAN_AUTHORIZATION_PROVENANCE_CONFIRMED
```

---

## Source branch / HEAD

| Field | Value |
|---|---|
| Source branch | `docs/viona-mobile-phase1-clear-premium-native-home-visual-architecture-master-plan` |
| Source / planning HEAD | `51153bc3f6303d78effc75fd8f31ec43895a613b` |
| Source commit subject | `docs(mobile): add Phase 1 native Home visual architecture` |
| Parent of source | `b21d407b26788cebf5cc28f84be9c64f8b2f1f1f` (Phase 0 isolation plan) |
| Source tree before branch create | clean, staged 0, push 0, PR 0 |

---

## Dedicated planning branch

| Field | Value |
|---|---|
| Branch | `docs/viona-mobile-phase1-clear-premium-native-home-implementation-plan` |
| Created from | `51153bc3f6303d78effc75fd8f31ec43895a613b` |
| Local collision before create | **absent** |
| Remote branch | **not queried, not created** |
| Push | **0** |
| PR | **0** |

```text
VIONA_MOBILE_PHASE1_IMPLEMENTATION_PLAN_DEDICATED_LOCAL_BRANCH_CREATED
```

---

## Audit classification preserved

```text
READY_FOR_VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_IMPLEMENTATION_PLAN
VIONA_MOBILE_PHASE0_NATIVE_PRESENTATION_ISOLATION_PLANNED_NOT_IMPLEMENTED
PHASE1_RUNTIME_REQUIRES_PHASE0_NATIVE_PRESENTATION_ISOLATION_COMPLETE
```

Phase 0 isolation remains planned, not implemented. Phase 1 Clear Premium Native Home remains planned, not implemented.

---

## Architecture locks recorded in the plan

| Decision | Lock |
|---|---|
| Mount | OPTION B — OpeningStage stays HomeScreen identity; internally mounts Clear Premium composition |
| HomeScreen | Skip shared WorldCard + quick strip on `native-adaptive` only |
| Domain | Stays in HomeScreen; native-home is presentation only |
| WorldCard restyle | **Rejected** |
| Metro forks of HomeScreen / AdaptiveComposition / WorldCard | **Rejected** |
| Find / Ask | Labeled Local entry + optional Ask; no fake results; no TravelFlightSearch |
| Companion / discovery files | **Deferred** (no safe contextual data) |
| Account cue | **None** in initial Phase 1; chrome → PersonalHub |
| Tokens | New `vionaNativeClearPremiumTokens.ts`; consume only from `native-home/` |
| Light-first carve | PROPOSED_NOT_ACTIVATED |
| Navigation / SOS | Excluded |
| Future CREATE | 7 paths locked (tokens, composition, header, Find, launcher, quick actions, test script) |
| Future MODIFY | OpeningStage (after Phase 0) + HomeScreen sibling skip |
| Future denylist | MainTabNavigator, routes, shell-mode, SOS, AdaptiveComposition/WorldCard internals, fashionTech, Design Mode Lock, API/auth/payment, package/lockfile, PR #450 |

```text
VIONA_MOBILE_PHASE1_OPTION_B_OPENING_STAGE_MOUNTS_CLEAR_PREMIUM_COMPOSITION_SELECTED
VIONA_MOBILE_PHASE1_SHARE_DOMAIN_ISOLATE_NATIVE_PRESENTATION
VIONA_MOBILE_PHASE1_SHARED_WORLD_CARD_RESTYLE_REJECTED
VIONA_MOBILE_PHASE1_COMPANION_AND_DISCOVERY_MODULES_DEFERRED
```

---

## Exact two docs

Existing files modified: **0**.

| Path | Role |
|---|---|
| `docs/product/VIONA_MOBILE_PHASE1_CLEAR_PREMIUM_NATIVE_HOME_IMPLEMENTATION_PLAN.md` | Implementation-ready plan |
| `docs/design/evidence/cursor-viona-mobile-phase1-clear-premium-native-home-implementation-plan/README.md` | This evidence record |

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
VIONA_MOBILE_PHASE1_RUNTIME_CHANGE_ZERO
VIONA_WEB_VISUAL_CHANGE_ZERO
VIONA_MOBILE_PHASE1_NAVIGATION_CHANGE_EXCLUDED
VIONA_MOBILE_PHASE1_SOS_BEHAVIOR_CHANGE_EXCLUDED
VIONA_MOBILE_PHASE1_STAGE_ZERO
VIONA_MOBILE_PHASE1_COMMIT_ZERO
VIONA_MOBILE_PHASE1_PUSH_ZERO
VIONA_MOBILE_PHASE1_PR_ZERO
```

---

## Plan contents checklist

The product plan documents:

- six-item Phase 0 hard prerequisite gate (isolation not claimed implemented);
- OPTION B mount architecture and HomeScreen sibling skip;
- initial scope lock (no companion/discovery/Account cue/search API/AI client);
- root composition + grouped props;
- header / Find / launcher / quick-action contracts;
- companion/discovery/account-cue deferral;
- AI optional Ask; SOS entry-only;
- native token file consumed only by native-home;
- exact CREATE (7) / MODIFY (2) / denylist;
- no silent scope expansion;
- web freeze, navigation, function preservation;
- additive sequence 0–11 (OpeningStage wired at step 3);
- test contract (38 items + Phase 0/B/C goldens);
- acceptance A–Z;
- stop conditions;
- Phase 1 rollback that leaves Phase 0 isolation intact.

```text
VIONA_MOBILE_PHASE1_PHASE0_PREREQUISITE_GATE_DOCUMENTED
VIONA_MOBILE_PHASE1_OPTION_B_MOUNT_ARCHITECTURE_DOCUMENTED
VIONA_MOBILE_PHASE1_ROOT_COMPOSITION_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_EXACT_RUNTIME_ALLOWLIST_DOCUMENTED
VIONA_MOBILE_PHASE1_EXACT_RUNTIME_DENYLIST_DOCUMENTED
VIONA_MOBILE_PHASE1_DOMAIN_OWNERSHIP_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_HEADER_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_FIND_ASK_SAFE_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_UNIVERSE_LAUNCHER_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_QUICK_ACTION_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_COMPANION_DISCOVERY_DEFERRAL_DOCUMENTED
VIONA_MOBILE_PHASE1_ACCOUNT_ACTIVITY_CUE_DEFERRED
VIONA_MOBILE_PHASE1_AI_COST_RUNTIME_BOUNDARY_DOCUMENTED
VIONA_MOBILE_PHASE1_SOS_BOUNDARY_DOCUMENTED
VIONA_MOBILE_PHASE1_NATIVE_TOKEN_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_DEVICE_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_ASSET_REUSE_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_HOMESCREEN_MINIMAL_MUTATION_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_IMPLEMENTATION_SEQUENCE_DOCUMENTED
VIONA_MOBILE_PHASE1_TEST_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_ACCEPTANCE_CRITERIA_DOCUMENTED
VIONA_MOBILE_PHASE1_ROLLBACK_CONTRACT_DOCUMENTED
VIONA_MOBILE_PHASE1_STOP_CONDITIONS_DOCUMENTED
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
PHASE1_RUNTIME_REQUIRES_PHASE0_NATIVE_PRESENTATION_ISOLATION_COMPLETE
```

Not returned: `READY_TO_IMPLEMENT`, `CLEAR_PREMIUM_ACTIVATED`, `VIONA_NATIVE_PRESENTATION_ISOLATED`, `LIGHT_MODE_CANONICAL`, `BOTTOM_NAV_CHANGED`, `WEB_RESTYLED`.

Eventual implementation marker `VIONA_WEB_VISUAL_ARCHITECTURE_UNCHANGED_BY_PHASE1` is **planned for a future runtime packet**, not achieved here.

---

## Validation (this turn)

| Command | Expected / result |
|---|---|
| `git diff --check` | no whitespace errors on the two new docs |
| `git status --short --branch` | planning branch; exactly two untracked allowlisted docs |
| `git diff --name-only` | empty (untracked docs are not tracked modifications) |
| `git diff --cached --name-only` | empty (staged **0**) |
| HEAD | `51153bc3f6303d78effc75fd8f31ec43895a613b` |
| `npx tsc --noEmit` | run if tree otherwise mutation-free |
| `npm run ci:expo-readiness` | run if tree otherwise mutation-free |
| `npm run ci:release-discipline` | run if tree otherwise mutation-free |

---

## Next action only

Separately authorize a **strict read-only review** of this two-file Phase 1 implementation-plan packet.

Do not implement Phase 0. Do not implement Phase 1. Do not stage, commit, push, or open a PR.
