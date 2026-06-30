# VIONA Request Engine — Pack26A Global Action Automation Spine & Readiness Matrix

**Document type:** Architecture, safety-gate, and readiness planning (docs-only — no implementation, deploy, live QA, or data mutation in this pack).
**Packet ID:** `CURSOR_PACK26A_GLOBAL_ACTION_AUTOMATION_SPINE_READINESS_MATRIX_DOCS_ONLY`
**Baseline:** `origin/master @ 2f111d6` — `docs(pack25): sync kernel handoff after post-hoc triage evidence (#188)`
**Related:** `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`, `docs/product/VIONA_REQUEST_PACK25_POST_HOC_TRIAGE_UI_EVIDENCE.md`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only planning pack | **YES** |
| Current verified master | **`2f111d6`** |
| Pack26 implementation opened | **NO** |
| Pack26A planning opened | **YES** (this packet) |

### Pack25 closure chain (summary)

| Milestone | Status |
| --- | --- |
| PR #180 controlled status-action UI implementation | **CLOSED / GREEN** @ `736e260` |
| PR #181 fresh submitted row authorization | **CLOSED / GREEN** @ `b9c3015` |
| PR #182 visual closure evidence | **CLOSED / GREEN** @ `f72e074` |
| PR #183 Kernel/Handoff sync | **CLOSED / GREEN** @ `6fe6da9` |
| PR #185 staging deploy/redeploy evidence | **CLOSED / GREEN** @ `46d6eeb` |
| PR #186 live QA transition + blocked click gate evidence | **CLOSED / GREEN** @ `e04ddb5` |
| PR #187 post-hoc triage UI evidence | **CLOSED / GREEN** @ `93a11ca` |
| PR #188 post-hoc triage Kernel/Handoff sync | **CLOSED / GREEN** @ `2f111d6` |
| Option A post-hoc triage UI evidence | **COMPLETE** |
| Option C current visual-QA row | **HOLD** — no further Send to review click or status POST on current row |
| Visual-QA row post-state | **`triage` / IN REVIEW**; action hidden; timeline/audit safe; 1 status + 1 audit event; no duplicates |

**Pack26A does not reopen Pack25 scope or authorize further transitions on the current visual-QA row.**

---

## 2. Strategic goal

### North star

VIONA's strategic target is **global product full active automation** — a single audited, role-aware, market-aware action spine that lets users, operators, merchants, and governed system agents act safely across all universes and markets.

### Honest product boundary

| Principle | Rule |
| --- | --- |
| Full active automation | **Product vision** — not a claim that all automation is live today |
| Readiness states | Govern what is **active** per action, universe, market, role, and legal/ops/payment/safety status |
| No demo theater | UI, docs, and marketing must not imply live outcomes without verified backing systems |
| Pack ladder | Automation expands only through numbered packs with explicit allowlists, gates, and evidence |

### Why Pack26A exists

Pack25 proved one controlled owner status action (`submitted` → `triage`) with idempotency, audit, and UI affordance gates. Before adding assign, confirm, cancel, payment, booking, SOS, wallet, or live AI actions, VIONA needs a **shared Global Action Automation Spine** and a **Readiness Matrix** so every future action follows the same contracts.

---

## 3. Global Action Automation Spine

The spine is the platform layer required before expanding actions beyond Pack25's controlled status transition.

| Spine component | Purpose |
| --- | --- |
| **Action registry** | Canonical catalog of action types, versions, preconditions, and allowed transitions |
| **Action taxonomy** | Classification of actions by risk, approval model, and execution mode (see §4) |
| **Role / permission model** | Who may view, request, approve, execute, cancel, reverse, or audit each action family (see §5–§6) |
| **Capability flags** | Per-actor, per-market, per-universe toggles that gate whether an action may be offered or executed |
| **Idempotency contract** | Replay-safe keys, conflict behavior, and no-duplicate side effects (see §9) |
| **Audit / timeline contract** | Mandatory fields and replay behavior for every action (see §8) |
| **Failure state model** | Canonical failure, blocked, and compensation states with operator-readable messages |
| **Human-in-loop approval model** | When automation stops and requires owner, operator, merchant, or emergency reviewer approval |
| **Market readiness gates** | Per-market legal, privacy, payment, ops, and partner prerequisites (see §11) |
| **Universe readiness matrix** | Per-universe action families and readiness levels (see §10) |
| **Safety / fraud / abuse controls** | Rate limits, anomaly detection hooks, consent checks, and escalation paths |
| **Rollback / compensation policy** | How reversible actions are undone; when compensation is manual-only |

### Spine design rules

1. **One spine, many domains** — Local, Travel, Academy, Business, Account, and SOS actions register on the same spine; domain packs add action definitions, not parallel audit models.
2. **Readiness before reach** — An action may be defined in the registry but remain **Blocked** or **Read-only** until readiness gates pass.
3. **Explicit transitions only** — No hidden state mutation; every transition is registered, gated, audited, and idempotent.
4. **Human override always available** — Emergency-blocked and legal-gated actions require human-readable stop reasons and escalation paths.

---

## 4. Action taxonomy

Every registered action carries one primary category and zero or more secondary gates.

| Category | Description | Typical approval | Pack25 reference |
| --- | --- | --- | --- |
| **read-only** | View/list/detail; no mutation | None | Pack16/Pack17 planning direction |
| **draft** | Create or edit unpublished state | Owner only | Future request draft flows |
| **request** | User requests an action; system queues | Owner initiates | Pack25 `submitted` affordance |
| **owner-confirmed** | Owner explicitly confirms before execution | Owner | Future owner confirm flows |
| **operator-approved** | Operator must approve before execution | Operator | Future assign/triage workflows |
| **merchant-approved** | Merchant must approve before execution | Merchant | Future Business OS actions |
| **system-assisted** | System proposes; human confirms | Owner or operator | AI suggestion surfaces (gated) |
| **system-executed** | System runs after all gates pass | Pre-authorized gates only | Deferred — highest scrutiny |
| **emergency-blocked** | SOS / safety actions blocked pending legal/ops | Emergency reviewer | SOS universe — blocked |
| **market-disabled** | Action unavailable in this market | N/A | Per-market matrix |
| **payment-gated** | Requires payment rail readiness | Payment provider + ops | Deferred |
| **legal-gated** | Requires legal/compliance sign-off | Legal + ops | Per-market |
| **ops-gated** | Requires operator coverage / SLA | Ops | Per-market |

Secondary gates stack: e.g. `request` + `payment-gated` + `market-disabled` = action visible in registry but not executable in that market.

---

## 5. Role model

| Role | Scope | Boundaries |
| --- | --- | --- |
| **owner / user** | End user who owns the target object | May request and confirm own actions within capability flags; cannot bypass operator/merchant/legal gates |
| **operator** | VIONA internal ops / support | May approve, assign, escalate, and audit within authorized workflows; cannot impersonate owner payment consent |
| **merchant** | Business / B2B party on merchant OS | May approve merchant-scoped actions only; no cross-tenant access |
| **admin** | Platform administration | Configuration and readiness flags; no silent live money/SOS without separate gates |
| **system** | Automated executor after gates pass | Idempotent execution only; no new approval bypass |
| **emergency reviewer** | SOS / safety escalation | May block or release emergency-blocked actions; no fake dispatch claims |
| **payment provider** | External payment rail | Webhook/status only within payment-gated contract; no request lifecycle ownership |
| **external partner** | Third-party integrations | Scoped API tokens; audit all partner-initiated actions |

**Rule:** Roles are **additive constraints**, not overrides — the strictest applicable gate wins.

---

## 6. Permission matrix

For each action family, the spine defines eight permission dimensions. Below: **request-engine status action** (Pack25 proven) and **future workflow actions** (planning only — not authorized).

### 6.1 Pack25 proven — owner status action (`submitted` → `triage`)

| Dimension | Rule |
| --- | --- |
| View | Owner, operator (read-only audit) |
| Request | Owner only when status = `submitted` |
| Approve | N/A — owner-initiated request category |
| Execute | System on valid owner POST after gates |
| Cancel | **Not implemented** — deferred to Pack27 |
| Reverse / compensate | **Not implemented** — manual ops only |
| Audit | Owner, operator (timeline) |
| Human approval required | None beyond owner auth |
| Legal / payment / ops block | Action **ops-gated** on staging; production requires market readiness |

### 6.2 Future — assign (Pack27 planning reference only)

| Dimension | Rule |
| --- | --- |
| View | Owner, assigned operator |
| Request | Operator or system-assisted proposal |
| Approve | Operator lead or merchant per policy |
| Execute | System after operator-approved |
| Cancel | Operator or owner per policy |
| Reverse / compensate | Operator + audit trail |
| Audit | All parties with need-to-know |
| Human approval | **Required** — operator-approved |
| Blocked until | Pack26B–26D spine complete; Pack27 authorization |

### 6.3 Future — confirm / cancel (Pack27 planning reference only)

| Dimension | Rule |
| --- | --- |
| Human approval | Owner-confirmed and/or operator-approved per action subtype |
| Payment-gated variants | **Blocked** until payment readiness matrix passes |
| SOS variants | **emergency-blocked** until legal + ops gates pass |

### 6.4 Matrix template (all future families)

Every new action family must complete this template before implementation authorization:

| Field | Required definition |
| --- | --- |
| `actionType` | Registry key |
| `taxonomy` | Primary + secondary categories |
| `viewRoles` | Who can see action affordance |
| `requestRoles` | Who can initiate |
| `approveRoles` | Who must approve |
| `executeRoles` | Who/system executes |
| `cancelRoles` | Who can cancel |
| `reverseRoles` | Who can reverse/compensate |
| `auditRoles` | Who can read audit/timeline |
| `humanApproval` | Yes/no + which role |
| `legalPaymentOpsBlock` | Which gates must pass |

---

## 7. Automation state model

Canonical lifecycle states for governed automation objects (requests and future action targets):

| State | Meaning | Typical entry |
| --- | --- | --- |
| **read-only** | Observation only; no write affordance | Default for unauthenticated or blocked market |
| **draft** | Editable unpublished | Owner draft save |
| **submitted** | Owner submitted for processing | Pack25 pre-transition |
| **triage** | In review queue | Pack25 post-transition |
| **in review** | Active human/system review | Operator workflow |
| **pending approval** | Awaiting explicit approver | Operator/merchant/legal gate |
| **approved** | All pre-execution gates passed | Pre-execute |
| **executing** | System executing side effects | Short-lived |
| **completed** | Terminal success | Audit closed |
| **failed** | Terminal failure with reason | Retry policy per action |
| **blocked** | Cannot proceed; human intervention required | Gate failure |
| **cancelled** | Terminal cancel | Owner/operator policy |
| **reversed / compensated** | Terminal undo or compensation recorded | Ops policy |

**Pack25 verified subset:** `submitted` → `triage` only. All other states are **defined for spine consistency** — not implemented or claimed live.

---

## 8. Audit / timeline contract

Every action execution or attempted execution must produce or update audit records with:

| Field | Required | Notes |
| --- | --- | --- |
| `actionType` | Yes | Registry key, e.g. `action.status` |
| `actorRole` | Yes | owner, operator, system, etc. |
| `actorId` | Yes | Non-secret user/operator identifier |
| `ownerUserId` | Yes when applicable | Request owner |
| `targetObjectType` | Yes | e.g. `viona_request` |
| `targetObjectId` | Yes | UUID |
| `beforeState` | Yes for transitions | e.g. `submitted` |
| `afterState` | Yes for transitions | e.g. `triage` |
| `idempotencyKey` | Yes for mutating actions | Client-supplied or server-derived |
| `timestamp` | Yes | UTC, server-authoritative |
| `universe` | Yes | Local, Travel, etc. |
| `market` | Yes | ISO market / country code |
| `readinessState` | Yes | From readiness matrix at execution time |
| `safetyGate` | Yes | Which gate allowed or blocked |
| `failureReason` | When failed/blocked | Operator-readable, non-secret |
| `timelineLabel` | Yes | Human-readable i18n key or label |
| `replayBehavior` | Yes | `created`, `idempotentReplay`, `conflict` |

### Replay behavior (contract)

| Outcome | HTTP semantics (API layer) | Audit behavior |
| --- | --- | --- |
| First success | 201 Created | One status event + one audit event |
| Idempotent replay | 200 OK, `idempotentReplay: true` | No duplicate events |
| Conflict | 409 Conflict | No state change; audit may record attempt per policy |
| Blocked | 403/422 with reason | No transition; optional blocked audit entry |

Pack25 live QA demonstrated idempotent replay with **1 → 1** status and audit events — this is the reference implementation pattern for the spine.

---

## 9. Idempotency rules

| Rule | Requirement |
| --- | --- |
| No duplicate transition on replay | Same idempotency key + same intent → same final state, no new events |
| Safe replay response | Client receives explicit `idempotentReplay` (or equivalent) |
| Clear conflict behavior | Stale state, wrong actor, or key reuse with different intent → conflict, not silent merge |
| No hidden side effects | Replay must not trigger payment, notification, or external calls twice |
| No duplicate audit/status events | Enforced at persistence layer |
| Replay-safe UI behavior | UI hides action when precondition fails; refresh does not double-submit |
| Operator-readable failure messages | Non-secret reason codes + human labels |

### Idempotency key contract (planning)

- Scope: per `targetObjectId` + `actionType` + client intent version
- TTL: defined per action family in registry (Pack26B)
- Storage: spine-level idempotency record linked to audit entry

---

## 10. Readiness matrix

### Readiness levels

| Level | Code | Meaning |
| --- | --- | --- |
| **Blocked** | `blocked` | Action must not appear or execute |
| **Read-only** | `read_only` | View/detail/timeline only |
| **Draft-only** | `draft_only` | Create/edit draft; no submit |
| **Pilot** | `pilot` | Limited actors/markets; explicit labels |
| **Staging verified** | `staging_verified` | Staging live QA + evidence green |
| **Market limited** | `market_limited` | One or few markets with ops coverage |
| **Full active** | `full_active` | All gates passed for action in market |

### Universe matrix (planning defaults)

| Universe | Likely action families | Default readiness (today) | Primary gates |
| --- | --- | --- | --- |
| **Local** | request status, assign, confirm, cancel, notes | `staging_verified` for owner status only; others `blocked` | ops, market |
| **Travel** | itinerary assist, interpreter request, transport request | `read_only` / `draft_only` | legal, ops, i18n |
| **Academy** | enrollment request, credential view | `read_only` | legal, no fake certification |
| **Business** | merchant request, B2B order draft | `draft_only` | merchant-approved, payment-gated |
| **Account** | profile, consent, wallet view | `read_only` | privacy, payment-gated for wallet writes |
| **SOS** | emergency guidance, callback request | `emergency-blocked` | legal, ops, no fake dispatch |

### Home universe

Home/LifeOS is a **cross-universe hub** — actions inherit the readiness of the target universe; Home itself does not bypass gates.

---

## 11. Market / legal readiness gates

Per-market checklist before elevating any action above `pilot`:

| Gate | Requirement |
| --- | --- |
| **Legal eligibility** | Product counsel sign-off for action type in market |
| **Privacy / data compliance** | GDPR/local DPA, retention, consent artifacts |
| **Payment readiness** | Rail live, dispute process, chargeback handling if payment-gated |
| **Operator coverage** | SLA, escalation path, language support |
| **Emergency / SOS restrictions** | No dispatch claims; emergency disclaimer; local emergency number policy |
| **Partner availability** | Required integrations contracted and monitored |
| **Language / i18n** | Safety-critical strings + action labels for market |
| **Failure handling readiness** | Runbooks, user messaging, compensation policy |
| **Dispute / chargeback** | Required when payment-gated actions execute |

Markets advance independently — **global product vision** does not imply **global full_active** for every action on day one.

---

## 12. Forbidden automation claims

The following claims are **forbidden** unless backed by verified systems, gates, and evidence on master:

| Forbidden claim | Why |
| --- | --- |
| Full production automation is live globally | Readiness matrix governs per action/market |
| Booking completed | No booking SoT or fulfillment proof |
| Implied-live payment settlement | Payment rails not governed in Pack26A |
| Implied-live SOS or emergency services outcome | emergency-blocked; does not contact authorities |
| Operator / merchant assignment completed | Pack27 not opened |
| Live AI action completed | Highest gate — separate authorization |
| Global readiness completed | Markets and universes differ by level |
| Pack26 implementation complete | Pack26A is planning only |

Use internal labels: **Pilot**, **Staging verified**, **Market limited**, **Blocked** — per `VIONA_OPERATING_PROTOCOL.md` no-fake-production boundary.

---

## 13. Recommended next ladder

| Pack | Scope | Authorization |
| --- | --- | --- |
| **Pack26A** | Global Action Automation Spine + Readiness Matrix (this doc) | **Planning only** — this packet |
| **Pack26B** | Action registry + capability flags | Separate docs + implementation pack |
| **Pack26C** | Unified audit/timeline contract (cross-action) | Separate pack |
| **Pack26D** | Operator approval / human-in-loop layer | Separate pack |
| **Pack27** | Controlled workflow actions: assign, confirm, cancel | Separate authorization per action |
| **Pack28+** | Local / Travel / Business domain automation pilots | Per-universe readiness |
| **Later** | Payment, SOS, wallet, live AI | Highest gates; legal + ops + founder |

**Sequencing rule:** Pack26B → 26C → 26D before Pack27 implementation. Pack26A does not skip the ladder.

---

## 14. Explicit non-authorization

Pack26A does **NOT** authorize:

| Category | Status |
| --- | --- |
| Code implementation | **NO** |
| New routes / API endpoints | **NO** |
| New actions or transitions | **NO** |
| assign / confirm / cancel | **NO** |
| booking / payment / SOS / wallet / live AI | **NO** |
| deploy / Fly restart | **NO** |
| live QA / status POST | **NO** |
| DB / schema / migration | **NO** |
| staging or production data mutation | **NO** |
| production or global automation claims | **NO** |
| Pack27 / Pack28 execution | **NO** |
| Pack26 implementation (beyond planning) | **NO** |
| Further Pack25 click/status POST on current visual-QA row | **NO** — Option C hold |

---

## 15. Safety attestations (this docs pack)

| Check | Result |
| --- | --- |
| Code changed | **NO** |
| UI / backend / runtime changed | **NO** |
| Prisma schema / migrations changed | **NO** |
| `.env*` changed | **NO** |
| Deploy / live QA / status POST | **NO** |
| Staging / auth / data / DB activity | **NO** |
| Secrets printed | **NO** |
| Pack27 / Pack28 opened | **NO** |
| Pack26 implementation opened | **NO** |
| Pack26A planning opened | **YES** |

---

## 16. Recommendation

| Decision | Recommendation |
| --- | --- |
| Pack26A planning | **APPROVE for merge** — docs-only spine and readiness matrix |
| Pack26B | **Next planning/implementation candidate** — action registry + capability flags |
| Pack25 Option C | **HOLD** — unchanged |
| Pack27+ | **Blocked** until spine packs 26B–26D progress with evidence |

**Operator action required for any implementation:** separate explicit authorization packet scoped to Pack26B or later with allowlist and gates.
