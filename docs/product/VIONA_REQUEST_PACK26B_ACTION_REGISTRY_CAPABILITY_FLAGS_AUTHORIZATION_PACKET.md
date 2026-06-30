# VIONA Request Engine — Pack26B Action Registry + Capability Flags Authorization Packet

**Document type:** Future implementation authorization packet (docs-only — no implementation, deploy, live QA, or data mutation in this pack).
**Packet ID:** `CURSOR_PACK26B_ACTION_REGISTRY_CAPABILITY_FLAGS_AUTHORIZATION_PACKET_DOCS_ONLY`
**Baseline:** `origin/master @ 9b6857d` — `docs(pack26a): sync kernel handoff after automation spine planning (#190)`.
**Related:** `docs/product/VIONA_REQUEST_PACK26A_GLOBAL_ACTION_AUTOMATION_SPINE_READINESS_MATRIX.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** (required before any future execution) |
| Docs-only authorization packet | **YES** |
| Current verified master | **`9b6857d`** |
| Pack26B implementation opened | **NO** |
| Pack26 implementation opened | **NO** |
| Pack27 / Pack28 opened | **NO** |

### Pack25 closure chain

| Milestone | Status |
| --- | --- |
| Pack25 controlled status-action UI chain | **CLOSED / GREEN** through PR #188 @ `2f111d6` |
| Option A post-hoc triage UI evidence | **COMPLETE** |
| Option C current visual-QA row | **HOLD** — no further Send to review click or status POST on current row |

### Pack26A closure chain

| Milestone | Status |
| --- | --- |
| Global Action Automation Spine & Readiness Matrix | **CLOSED / GREEN** — PR #189 @ `56cc18c` |
| Kernel/Handoff sync | **CLOSED / GREEN** — PR #190 @ `9b6857d` |

**This packet prepares authorization scope only.** It does **not** authorize implementation, code changes, deploy, live QA, status POST, data mutation, or Pack27/Pack28 unless the operator issues **separate explicit authorization** with the required implementation phrase (§10).

---

## 2. Pack26B objective

Prepare the **first safe implementation lane** for the Global Action Automation Spine (Pack26A) by defining a future target for:

| Component | Purpose |
| --- | --- |
| **Action Registry** | Canonical catalog of action definitions — metadata, gates, and readiness defaults |
| **Capability flags** | Per-universe / per-action / per-role / per-market enablement model |
| **Universe/action readiness mapping** | Which actions exist in which universes and at what readiness level |
| **Market/role/action capability gating** | Who may see which capability state in which market |
| **Read-only exposure rules** | Lookup and visibility only — no execution affordance |
| **No action execution** | Registry/config surfaces only; no runtime write behavior in Pack26B |

Pack26B future implementation is the **registry and flag foundation** — not workflow expansion, not Pack27 assign/confirm/cancel, and not payment/SOS/wallet/live AI.

---

## 3. Proposed future implementation boundaries

### 3.1 Future Pack26B implementation MAY introduce (staging-safe registry/config only)

| Surface | Allowed |
| --- | --- |
| Action registry definitions | Static or config-driven action metadata |
| Capability flag definitions | Typed flag constants and enums |
| Readiness constants | Alignment with Pack26A readiness levels |
| Pure helper selectors | Read-only lookup: `getActionDefinition`, `getCapabilityForContext`, etc. |
| Read-only capability lookup | No side effects; no persistence mutation |
| Tests for registry consistency | Schema/type checks, duplicate IDs, gate completeness |

### 3.2 Future Pack26B implementation MUST NOT introduce

| Surface | Forbidden |
| --- | --- |
| New backend routes | **NO** |
| New write endpoints | **NO** |
| Status POST changes | **NO** — Pack25 behavior unchanged |
| New transitions | **NO** |
| assign / confirm / cancel | **NO** |
| booking / payment / SOS / wallet / live AI behavior | **NO** |
| DB / schema / migration | **NO** |
| Deploy / live QA | **NO** — unless separately authorized |
| Staging data mutation | **NO** |
| UI executable affordances | **NO** — unless separately authorized (§7) |
| Production or global automation claims | **NO** |

---

## 4. Capability flag model

### 4.1 Readiness / capability flag values

| Flag | Code | Meaning |
| --- | --- | --- |
| **disabled** | `disabled` | Action must not appear or execute |
| **readOnly** | `read_only` | View/detail/timeline lookup only |
| **draftOnly** | `draft_only` | Draft create/edit; no submit/execute |
| **pilot** | `pilot` | Limited actors/markets; explicit pilot labels |
| **stagingVerified** | `staging_verified` | Staging evidence green; not production claim |
| **marketLimited** | `market_limited` | One or few markets with ops coverage |
| **fullActive** | `full_active` | All Pack26A gates passed for action in market |

### 4.2 Required capability dimensions

Every capability lookup must accept or derive:

| Dimension | Required | Notes |
| --- | --- | --- |
| **universe** | Yes | Local, Travel, Academy, Business, Account, SOS |
| **action family** | Yes | Registry key grouping |
| **role** | Yes | owner, operator, merchant, admin, system, etc. |
| **market** | Yes | ISO market / country code |
| **environment** | Yes | local, staging, production |
| **readiness state** | Yes | From flag model above |
| **human approval requirement** | Yes | none / owner / operator / merchant / emergency |
| **legal blocker** | When applicable | Blocks above `read_only` |
| **payment blocker** | When applicable | Blocks payment-gated actions |
| **ops blocker** | When applicable | Blocks operator-dependent actions |
| **SOS blocker** | When applicable | Highest gate — emergency-blocked default |

**Rule:** Effective capability = **minimum** of registry default, universe readiness, market gate, role permission, and environment policy.

---

## 5. Action Registry model

Each registry entry defines metadata only — not executable behavior.

| Field | Type / purpose |
| --- | --- |
| `actionId` | Unique stable key, e.g. `request.status.submitted_to_triage` |
| `universe` | Target universe |
| `actionFamily` | Grouping for permission matrix |
| `displayName` | Human label key (i18n-safe) |
| `description` | Internal/docs description |
| `defaultReadiness` | Initial readiness level from §4.1 |
| `allowedRoles` | Roles that may view/request per Pack26A matrix |
| `requiredCapabilityFlags` | Minimum flags for visibility vs execution (execution deferred) |
| `requiredApprovals` | Human-in-loop requirements |
| `auditCategory` | Maps to audit/timeline contract |
| `timelineCategory` | Timeline label grouping |
| `idempotencyRequired` | Boolean — true for mutating actions (future) |
| `marketGate` | Per-market eligibility rules reference |
| `legalGate` | Legal/compliance gate reference |
| `paymentGate` | Payment readiness gate reference |
| `opsGate` | Operator coverage gate reference |
| `sosGate` | SOS/emergency gate reference |
| `disabledReason` | Operator-readable reason when `disabled` |
| `ownerFacingCopySafetyLevel` | demo / pilot / staging / production-safe label |

### Registry invariants (future implementation)

1. `actionId` must be globally unique.
2. Every entry must have `defaultReadiness` and all gate fields defined (may be `none` / `blocked`).
3. Forbidden action families default to `disabled` with explicit `disabledReason`.
4. No registry entry may imply live execution without `stagingVerified` or higher evidence backing.

---

## 6. Initial action families (definitions only — not executable)

| actionId | Universe | defaultReadiness | Status | Notes |
| --- | --- | --- | --- | --- |
| `request.status.submitted_to_triage` | Local | `staging_verified` | **Reference only** — Pack25 proven; registry documents existing behavior; Pack26B must not change runtime |
| `request.assign` | Local | `disabled` | **Future-blocked** — Pack27 |
| `request.confirm` | Local | `disabled` | **Future-blocked** — Pack27 |
| `request.cancel` | Local | `disabled` | **Future-blocked** — Pack27 |
| `booking.request` | Local / Business | `disabled` | **Future-blocked** |
| `payment.intent` | Account | `disabled` | **Future-blocked** — payment-gated |
| `sos.assist` | SOS | `disabled` | **Future-blocked / highest-gate** — emergency-blocked |
| `wallet.adjustment` | Account | `disabled` | **Future-blocked / highest-gate** |
| `live_ai.action` | Cross-universe | `disabled` | **Future-blocked / highest-gate** |

**Pack25 reference action:** `request.status.submitted_to_triage` is the **only** action with live staging evidence. Pack26B registry work must treat it as **read-only documentation of existing behavior** — not a new implementation target.

---

## 7. Read-only exposure rule

| Rule | Requirement |
| --- | --- |
| Pack26B future implementation scope | **Capability visibility and readiness lookup only** |
| UI executable affordance | **NOT authorized** in Pack26B unless operator separately authorizes UI scope |
| Lookup output | May expose: action exists, readiness level, disabled reason, gate blockers |
| Lookup output must NOT | Trigger transitions, POST, side effects, or imply live global automation |
| Pack25 Option C | **Preserved** — no further click/status POST on current visual-QA row |

---

## 8. Test gates for future implementation

Future Pack26B implementation pack must PASS all of:

| Gate | Requirement |
| --- | --- |
| Registry schema/type checks | All entries conform to registry model |
| Duplicate `actionId` check | Zero duplicates |
| Readiness completeness | Every action has `defaultReadiness` |
| Safety gate completeness | Every action has legal/payment/ops/SOS gate fields |
| Forbidden families blocked | assign/confirm/cancel/booking/payment/SOS/wallet/live AI remain `disabled` |
| No runtime write behavior | No new mutation paths |
| No backend route/action endpoint | No new API surface |
| Pack25 unchanged | Existing `submitted` → `triage` behavior and idempotency unchanged |
| `viona-forbidden-claims-check.mjs --strict` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |
| Allowlist diff gate | Only Pack26B-authorized files changed |

---

## 9. Explicit non-authorization

This authorization packet does **NOT** authorize:

| Category | Status |
| --- | --- |
| Pack26B implementation | **NO** |
| Code changes | **NO** |
| New routes / write endpoints | **NO** |
| New actions / transitions | **NO** |
| assign / confirm / cancel | **NO** |
| booking / payment / SOS / wallet / live AI | **NO** |
| deploy / live QA / status POST | **NO** |
| DB / schema / migration | **NO** |
| staging / auth / data mutation | **NO** |
| production or global automation claims | **NO** |
| Pack26 implementation (broader) | **NO** |
| Pack27 / Pack28 | **NO** |
| Pack25 Option C violation | **NO** — no click/status POST on current row |
| UI executable affordances | **NO** |

---

## 10. Required operator phrase for implementation

Future Pack26B **implementation** requires a **separate** explicit operator phrase in a dedicated implementation pack prompt:

```txt
APPROVE_PACK26B_ACTION_REGISTRY_CAPABILITY_FLAGS_IMPLEMENTATION_STAGING_SAFE
```

| Rule | Requirement |
| --- | --- |
| This packet alone | **Does NOT** authorize implementation |
| Phrase must appear verbatim | In the future implementation pack authorization |
| Without phrase | Cursor must **stop** and report — no code changes |
| With phrase | Still bound by §3 boundaries, §7 read-only exposure, §8 test gates, and file allowlist in that pack |
| Deploy / live QA / UI affordance | **Separate** authorization even if implementation phrase provided |

**Do not execute implementation unless that exact future phrase is provided in a separate step.**

---

## 11. Safety attestations (this docs pack)

| Check | Result |
| --- | --- |
| Code changed | **NO** |
| UI / backend / runtime changed | **NO** |
| Prisma schema / migrations changed | **NO** |
| `.env*` changed | **NO** |
| Deploy / live QA / status POST | **NO** |
| Staging / auth / data / DB activity | **NO** |
| Secrets printed | **NO** |
| Pack26B implementation opened | **NO** |
| Pack26 implementation opened | **NO** |
| Pack27 / Pack28 opened | **NO** |

---

## 12. Recommendation

| Decision | Recommendation |
| --- | --- |
| Pack26B authorization packet | **APPROVE for merge** — docs-only; defines future implementation scope |
| Pack26B implementation | **NOT authorized** until operator provides §10 phrase in separate pack |
| Pack25 Option C | **HOLD** — unchanged |
| Next step after merge | Operator may authorize `CURSOR_PACK26B_ACTION_REGISTRY_CAPABILITY_FLAGS_IMPLEMENTATION_*` with exact phrase + allowlist |

**Operator action required for implementation:** separate pack with verbatim phrase `APPROVE_PACK26B_ACTION_REGISTRY_CAPABILITY_FLAGS_IMPLEMENTATION_STAGING_SAFE`, explicit file allowlist, and §8 gates.
