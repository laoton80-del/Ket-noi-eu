# VIONA AI Receptionist Lead Capture Phase Decision

## 1. Current State
- Frontend funnel exists (merchant dashboard -> setup checklist -> simulated demo -> pilot request).
- Pilot request is local-only.
- Consent checkbox exists and blocks submit if unchecked.
- No backend/API/DB/payment/Twilio in current pilot request flow.

## 2. Options

| Option | Description | Pros | Cons | When To Use |
|--------|-------------|------|------|-------------|
| A. local-only | Keep pilot request in client state only, no server submission | Lowest risk, zero backend/privacy ops overhead, fastest to maintain | No operational visibility, no queueing, draft lost on app/session reset | Use while consent/retention/tenant/backend governance is still unresolved |
| B. email/manual ops | Add minimal authenticated server relay to internal ops mailbox, still no DB persistence | Fast pilot operations visibility, low implementation scope, controlled rollout | Still handles PII in transit, requires mail config + anti-spam + secure logging discipline | Use for first real merchant pilot intake before full lifecycle/states dashboard is stable |
| C. DB-backed endpoint | Implement dedicated persistent endpoint + table + status lifecycle | Best long-term auditability, review workflow, reporting and CRM integration | Highest scope/risk: migration, tenant ownership, GDPR lifecycle, admin tooling, moderation ops | Use only after contract gates are approved and pilot process semantics are stable |

## 3. Recommended Path
- **Phase A:** local-only done.
- **Phase B:** email/manual ops for first merchant pilots.
- **Phase C:** DB-backed endpoint once pilot process is stable.
- **Phase D:** admin review dashboard.
- **Phase E:** production activation workflow.

Reasoning:
- Contract and backend plan both indicate current state should remain safe and controlled.
- Blueprint enforces no fake production state and strict tenant/privacy guardrails.
- Phase B gives immediate operational signal without prematurely committing to schema/lifecycle that may change during early pilots.

## 4. Phase B Requirements
If using email/manual ops:
- auth required
- consent required
- rate limit
- internal recipient config (env-driven, no hardcoded personal inbox)
- no payment
- no Twilio
- no AI call
- no booking mutation
- no sensitive logs (no raw PII in debug/error logs; redact notes/contact where possible)

Additional execution guardrails:
- strict payload validation before relay
- standardized success/fail response envelope (no internal infra leakage)
- tenant/user identity derived from auth context, not client ownership fields

## 5. Phase C Requirements
If using DB-backed endpoint:
- Prisma model approved
- migration reviewed
- tenant rule approved
- endpoint contract approved
- validation approved
- rate limit approved
- admin review flow approved
- GDPR export/delete plan approved

Additional must-haves before go-live:
- retention window finalized (default 180 days unless policy override approved)
- status lifecycle ownership (ops/admin transitions and audit trace)
- access control matrix for merchant vs admin vs cross-tenant aggregate views

## 6. Decision
**Recommended next implementation: Phase B (email/manual ops).**

Why not jump directly to Phase C now:
- Early pilot process fields and operational statuses may still evolve.
- Immediate business need is lead visibility, not full persistence complexity.
- Reduces time-to-ops while preserving privacy/safety guardrails from contract.

## 7. Do Not Do Yet
- no real phone intake
- no auto booking
- no payment
- no inventory
- no bill printing
- no production AI call

## 8. Next Code Task
Smallest next code task based on this decision:

- Implement a **minimal authenticated Phase B endpoint** that:
  - accepts validated pilot request payload (contract fields + `consentAccepted=true`)
  - enforces route-level rate limit
  - relays sanitized payload to configured internal ops recipient
  - returns standardized success/fail response
  - performs **no DB writes** and triggers **no payment/Twilio/AI/booking actions**

Suggested implementation slice (single PR):
- `POST /api/ai-receptionist/pilot-leads/email-relay` (name can be finalized in API review)
- Zod schema + `validateBody`
- `authMiddleware`
- route limiter
- mail relay service abstraction
- privacy-safe logging policy for this endpoint

