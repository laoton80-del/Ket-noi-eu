# VIONA AI Tool Permission Matrix

**Pack:** `VIONA.AI_AUTOMATION_READINESS_DOCS.PACK_AI0`
**Document type:** Tool/action permission charter for AI agents and copilots
**Audience:** Engineering, AI Safety Lead, Mini-App Owners, Compliance
**Relationship:** Subordinate to `VIONA_OPERATING_PROTOCOL.md` §1.1 no-fake-production boundary.

---

## Permission levels

| Level | Code | Meaning |
| --- | --- | --- |
| Read-only | `ALLOW_READ_ONLY` | Fetch SoT and explain; no writes |
| Draft only | `ALLOW_DRAFT_ONLY` | Generate draft; no submit without separate human action |
| User confirmation | `ALLOW_WITH_USER_CONFIRMATION` | Submit mutation only after end-user explicit confirm |
| Merchant confirmation | `ALLOW_WITH_MERCHANT_CONFIRMATION` | Submit mutation only after merchant user confirm |
| Admin confirmation | `ALLOW_WITH_ADMIN_CONFIRMATION` | Submit mutation only after admin role confirm |
| Forbidden | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | No tool implementation until legal/backend/ops gates |

**Default:** If an action is not listed or is ambiguous → `FORBIDDEN_UNTIL_PRODUCTION_GATES`.

---

## Action matrix

| Action type | Permission | Min phase | Notes / SoT required |
| --- | --- | ---: | --- |
| Navigation help | `ALLOW_READ_ONLY` | 1 | Route registry, current screen context |
| Translation | `ALLOW_READ_ONLY` | 1 | Smart Trio locale packs; no invented legal text |
| Summarization | `ALLOW_READ_ONLY` | 1 | Only text already returned by backend APIs |
| Form prefill | `ALLOW_DRAFT_ONLY` | 2 | Profile/request SoT; user edits before submit |
| Local service request draft | `ALLOW_DRAFT_ONLY` | 2 | Local catalog + merchant SoT; user confirms submit |
| Booking request draft | `ALLOW_DRAFT_ONLY` | 2 | Availability SoT if shown; never imply confirmed |
| Merchant reply draft | `ALLOW_DRAFT_ONLY` | 2 | Inbox thread SoT; merchant confirms send |
| Profile update draft | `ALLOW_DRAFT_ONLY` | 2 | User profile SoT; user confirms save |
| Local request submit | `ALLOW_WITH_USER_CONFIRMATION` | 2 | Request API + audit log + consent flags |
| Booking request submit | `ALLOW_WITH_USER_CONFIRMATION` | 2 | Booking/request API; server returns pending state |
| Merchant reply send | `ALLOW_WITH_MERCHANT_CONFIRMATION` | 2 | Merchant authz + tenant boundary |
| Merchant ops template auto-send | `ALLOW_WITH_MERCHANT_CONFIRMATION` | 3 | Merchant opt-in + policy engine |
| Admin config / feature flag | `ALLOW_WITH_ADMIN_CONFIRMATION` | 3 | Admin RBAC + audit |
| Payment capture | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | 5 | Webhook SoT, PCI, Payments Owner sign-off |
| Wallet debit / settlement | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | 5 | Ledger integrity + reconciliation |
| Refund execution | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | 5 | Idempotent refund pipeline + legal |
| Booking confirm (final) | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | 4 | Provider confirmation SoT per universe |
| Booking cancel (final) | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | 4 | Cancellation policy + user/merchant confirm rules |
| Merchant ops full automation | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | 4–5 | Per-merchant contract + kill switch |
| SOS call / dispatch / GPS | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | 5 | SOS Safety Lead + legal + routing matrix |
| Legal final advice | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | — | Information + draft only; never final counsel |
| Medical final advice | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | — | Triage/info only; never diagnosis |
| Financial final advice | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | — | Education only; no personalized investment/legal tax advice |
| AI calling humans (outbound) | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | 5 | Telephony compliance + cost consent + recording law |
| Hidden AI pretending to be human | `FORBIDDEN_UNTIL_PRODUCTION_GATES` | — | **Always forbidden** without explicit legal/safety approval and disclosure UX |

---

## Tool implementation checklist

Before adding a new AI tool to runtime:

1. Map action to this matrix (no new permission level without architect review).
2. Verify minimum phase for target universe in `VIONA_AI_AUTOMATION_READINESS_MATRIX.md`.
3. Implement audit log fields: `actor`, `universe`, `toolId`, `phase`, `confirmationType`, `confirmationId`, `soTVersion`.
4. Wire feature flag default **off**.
5. Run `node scripts/viona-forbidden-claims-check.mjs --strict`.
6. Run `node scripts/viona-ai-safety-readiness-check.mjs` after AI0 commit.

---

## Forbidden autonomy list (explicit)

Until production gates are signed, AI tools **must not**:

| # | Forbidden behavior |
| --- | --- |
| 1 | Confirm booking without human confirmation and server SoT |
| 2 | Cancel booking without human confirmation and policy check |
| 3 | Capture payment or imply payment captured |
| 4 | Debit wallet or transfer credits without receipt SoT |
| 5 | Settle, payout, or cash-out |
| 6 | Dispatch SOS or imply authorities contacted |
| 7 | Call police, ambulance, or emergency services autonomously |
| 8 | Share live GPS or location to third parties without consent |
| 9 | Give final medical, legal, or financial advice |
| 10 | Impersonate a human without disclosure and legal approval |
| 11 | Act across tenant boundaries |
| 12 | Bypass cost/rate limits |
| 13 | Omit audit log on any mutation attempt |

Copy may describe **draft**, **preview**, **pilot**, or **request received** — not **confirmed**, **paid**, **dispatched**, or **guaranteed**.

---

## Source-of-truth requirements (all tools)

AI tools may only assert facts present in:

| SoT domain | Examples | AI rule |
| --- | --- | --- |
| User profile | Name, locale, residency status, consent flags | Read via API; never invent |
| Merchant profile | Tenant id, verified badge state, industry playbook | Tenant-scoped fetch only |
| Catalog / service data | SKUs, services, MOQ, price lists | Show stale label if cache |
| Request / booking state | pending, merchant_must_confirm, cancelled | Mirror server enum labels |
| Locale / market / country | `countryPacks`, safety bundles | No market excluded from vision; gate behavior only |
| Safety flags | SOS consent, recording consent, pilot mode | Hard stop if missing |
| Consent records | GDPR, recording, location | No action without record |
| Audit logs | Append-only tool invocation log | Required for Phase 2+ mutations |
| Cost / rate limits | Per-user and per-tenant budgets | Enforce before model/tool call |
| Feature flags | Universe and phase gates | Deny tool if flag off |
| Tenant boundaries | workspace / merchant id | Cross-tenant = deny |
| Rollback / fallback | Global AI kill switch | Disable tools; keep app usable |

---

## Production gates (summary)

| Gate | Applies to |
| --- | --- |
| Phase sign-off per universe | Phase 2+ mutations |
| Payments & Ledger Integrity Owner | Payment, wallet, refund tools |
| SOS Safety Product Lead | Any emergency-adjacent tool or copy |
| Compliance & Privacy Owner | Recording, location, outbound call |
| AI Safety & Production Reliability Lead | All tools; cost firewall |
| Security & Tenant Isolation Lead | Merchant/admin tools |
| Release Train / QA Gate Owner | Promotion to pilot/beta/live |

---

## Related documents

- `docs/ai-context/VIONA_AI_PHASE_ROADMAP.md`
- `docs/ai-context/VIONA_AI_AUTOMATION_READINESS_MATRIX.md`
- `docs/ai-context/VIONA_FORBIDDEN_CLAIMS_CHECKER.md`
