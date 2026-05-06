# VIONA OPERATING PROTOCOL

**Document type:** Operating charter — engineering, product, and AI/agent execution rules for the VIONA repository and ecosystem.  
**Audience:** Humans (staff, contractors, vendors) and AI coding agents operating on this codebase.  
**Relationship:** Subordinate to **Master Blueprint** (`VIONA_FINAL_MASTER_BLUEPRINT_V2.md` or successor). If this protocol conflicts with a **founder-signed** blueprint clause, **blueprint wins**.

---

## 1. Purpose

Ensure VIONA advances as **Global Vietnamese Companion OS** implemented as a **Super App / Mini-App Platform**, with **trust**, **financial safety**, **tenant safety**, and **honest product state** — without accidental drift into a single-vertical app, demo theater, or runaway AI/payment cost.

---

## 2. Twelve mandatory roles (collective accountability)

These roles must exist as named accountability on every release wave that touches money, identity, AI telephony, or merchant-facing surfaces. One person may wear multiple hats **only** if explicitly documented for that wave.

| # | Role | Charter (what “done” means) |
|---|------|-----------------------------|
| 1 | **Executive Sponsor / Founder Delegate** | Owns north-star trade-offs (Companion OS vs vertical creep); resolves cross-functional disputes; signs commercial posture. |
| 2 | **Chief Product Officer (CPO) Surface Owner** | Owns universe/mini-app UX truth: users never confuse **demo/pilot/live**; IA matches blueprint universes. |
| 3 | **Principal Architect** | Owns layering: Core OS / Shared Business Core / Mini-Apps; prevents architectural drift and “silent routing.” |
| 4 | **Core Platform Lead** | Owns registry/resolver/gates patterns, shell navigation integrity, feature-flag semantics consistency. |
| 5 | **Mini-App Owner (per vertical)** | Owns end-to-end truth for one universe (Hub/Local/Travel/Academy/B2B/etc.) including readiness labels and CTAs. |
| 6 | **Trust & Safety Lead (Product + UX)** | Owns SOS integrity (no fake emergency outcomes), abuse/spam surfaces, misleading CTAs, safety copy. |
| 7 | **AI Safety & Production Reliability Lead** | Owns AI cost firewall posture, model/tool boundaries, incident loops for AI outages and misbehavior. |
| 8 | **Security & Tenant Isolation Lead** | Owns authz correctness, cross-tenant forbidden paths, secrets posture, webhook verification expectations. |
| 9 | **Payments & Ledger Integrity Owner** | Owns money movement truth: webhook SoT, idempotency discipline, reconciliation mindset, “no fake paid.” |
| 10 | **Operations / Incident Commander** | Owns runbooks, on-call expectations for pilots, lead intake triage, smoke evidence before demos/pilots. |
| 11 | **Compliance & Privacy Owner** | Owns GDPR posture, consent/recording disclaimers where applicable, data minimization for pilots. |
| 12 | **Release Train / QA Gate Owner** | Owns “definition of ready” per gate (internal demo / pilot / beta / launch); blocks promotion on failed checks. |

---

## 3. Ten non-negotiable rules

1. **Blueprint supremacy (within signed scope).** Shipping decisions that change positioning (Companion OS vs vertical-only product), liability posture, or commercial promises must align with the **current signed Master Blueprint** (or an explicit amendment process).

2. **No fake production state.** UI must not imply **paid success**, **confirmed booking**, **live SOS resolution**, or **production AI outcomes** unless the backing systems and operations are truly in that mode.

3. **Honest labeling for maturity.** Surfaces that are **Demo / Lite / Pilot / Gated** must be labeled accordingly in UX and docs; “pretty UI” must not obscure truth.

4. **Tenant isolation is mandatory.** No cross-merchant access paths; administrative shortcuts require explicit audited mechanisms.

5. **Money moves only through governed rails.** Payment/settlement/booking financial truth follows server rules + webhook/idempotency discipline as designed for the deployment — never “client-side truth.”

6. **AI cannot silently mutate protected domains.** No silent mutation of **inventory, bills, payroll, or payment state** by AI agents/tools without explicit approved automation gates.

7. **Cost firewall is mandatory for AI/telecom.** Usage must be trackable and constrained by policy (caps, auto-pause/downgrade paths) before scaling pilots.

8. **Zero-loss monetization mindset.** Revenue mechanics must not assume infinite subsidy; broker/payout/growth loops must respect net revenue, caps, clawback, and settlement delays per blueprint economics.

9. **Scope discipline on repo changes.** Avoid unrelated refactors during incident/hotfix windows; avoid “drive-by” expansions that violate mini-app boundaries.

10. **Documentation precedes ambiguous commercial steps.** Material pilot/beta expansions require updated runbooks/checklists and owner assignment **before** widening audience.

---

## 4. Operating mechanics (lightweight)

### 4.1 Change classes

- **Class A — Safe UI/copy/i18n:** low risk if no routing/money/auth semantics change.  
- **Class B — Routing/registry/gates:** requires Architect + Core Platform review.  
- **Class C — Money/identity/AI telephony:** requires Payments/Tenant/AI Safety review and explicit approval path.

### 4.2 Escalation

Unresolved conflicts between Product and Engineering escalate to **Executive Sponsor**. Conflicts involving legal/regulatory claims escalate to **Compliance & Privacy Owner** + Sponsor.

---

## 5. Agent-specific instruction (Cursor / automation)

Agents working in this repository must:

- Prefer **audit-first** when scope is ambiguous commercial readiness.
- Never **mock production** financial outcomes.
- Never bypass explicit **“do not touch”** lists when provided by the operator.
- Produce **evidence-first** reports (commands/logging outputs) when verifying readiness.

---

## 6. Document control

| Field | Value |
|-------|--------|
| Canonical path | `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` |
| Updates | Revision PR with reason; notify Release Train Owner for gate-impacting edits |

---

**End of protocol.**
