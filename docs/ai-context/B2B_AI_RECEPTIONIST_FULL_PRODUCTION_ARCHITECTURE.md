# VIONA B2B AI Receptionist Full Production Architecture

This document locks the **full production** architecture for the VIONA B2B AI Receptionist: real voice intake, real booking commits, real inventory movement, real billing/print, and real money movement—while staying aligned with **V7/V8** (four universes, Stripe Connect, dual split-fee, EUR base, pre-auth/manual capture, Prompt Armor, tenant isolation, Sentry) and the **mini-app platform** without losing the commercial spine.

---

## 1. Strategic Decision

AI Receptionist B2B is the **flagship business mini-app** of VIONA. It is the primary surface where merchants convert voice and chat into **deterministic** commerce outcomes: holds, bookings, stock reservations, receipts, and captured payments—never “demo success” or silent mocks in production paths.

---

## 2. Production Principle

The AI is allowed to **sound and behave like a trained front-desk employee** (natural language, empathy, pacing). Every **material** action—booking confirmation, inventory mutation, bill generation, payment capture, refund—must pass through a **deterministic policy engine** with explicit rules, limits, and auditability. The model proposes; **policy + tools** dispose.

---

## 3. Architecture Layers

### Voice Layer

- Inbound/outbound telephony (e.g. Twilio or equivalent PSTN/SIP provider): media streams, recording policies where legally allowed, DTMF if needed, call metadata (call SID, direction, ANI/DNIS).
- Streaming ASR/TTS pipeline: low-latency audio to text and text to natural speech; **Chưa xác định** exact vendor mix (OpenAI Realtime vs third-party ASR/TTS) per region and cost tier.
- Session binding: each call is bound to **one tenant context** resolved before the AI session starts (no “late” tenant switch mid-call without re-auth).

### AI Brain Layer

- LLM / multimodal stack for dialogue, intent, and **proposed** tool calls (structured outputs).
- Conversation state: short rolling context + **server-side** facts (slots, catalog snippets, policy outcomes)—not unbounded prompt stuffing with PII across tenants.
- **Model router** (see §11): tiered models by intent complexity and merchant plan.

### Policy Layer

- Central **policy engine** (rules + limits): business hours, service eligibility, min/max party size, deposit rules, discount caps, cancellation windows, “human required” triggers.
- Outputs: `ALLOW` / `DENY` / `REQUIRE_CONFIRMATION` / `ESCALATE` with machine-readable reasons for audit.
- **Prompt Armor** alignment (see §12): policy is the backstop when the model drifts.

### Business Automation Layer

- **Tool gateway only**: idempotent, schema-validated HTTP/RPC tools (booking hold, booking confirm, inventory reserve, print enqueue, payment intent operations)—**no direct DB writes from the model**.
- Orchestration: sagas for multi-step flows (hold → pay link or capture → confirm booking → finalize inventory).
- Integration with **Merchant Dashboard** and existing order/booking services as the system of record.

### Finance & Cost Control Layer

- **Stripe Connect** (platform + connected accounts): PaymentIntents, pre-authorization, manual capture, application fees / dual split-fee per V7/V8 commercial rules; **EUR** as stated base currency for pricing and settlement where product requires it (**Chưa xác định** multi-currency display vs settlement split without product sheet).
- **Ledger** for money movement and reconciliation (see §9).
- **Cost firewall** for AI/voice/token spend per tenant and globally (see §10).

---

## 4. Production Call Flow

1. **Customer calls** merchant published number (or platform-routed DID mapped to `merchantId` / tenant).
2. **Twilio (or equivalent)** accepts call; platform resolves **tenant + merchant context** (fail closed if ambiguous).
3. **Voice layer** streams audio to ASR; text + session id feed **AI Brain**.
4. Brain proposes intents and **structured tool calls** (never raw SQL).
5. **Policy layer** evaluates each tool call against rules + plan + risk signals.
6. On `ALLOW`, **Business automation** invokes tools: e.g. `create_booking_hold`, `reserve_inventory`, `enqueue_print_job`, `create_or_update_payment_intent`.
7. **Webhooks** (Stripe) are **source of truth** for payment state; booking/inventory finalization only transitions when policy + webhook evidence align.
8. **Merchant Dashboard** reflects live order, payment, print queue, and escalation state; **Sentry** captures errors and latency anomalies end-to-end.

---

## 5. Tool-Calling Rules

- The AI **must not** write to the database directly or execute arbitrary queries.
- The AI **only** invokes **registered tools** with:
  - **JSON schema** (or equivalent contract) validated server-side;
  - **Tenant check**: `merchantId` / `tenantId` on every call, matched to the resolved call/session context;
  - **Idempotency key** (e.g. `Idempotency-Key` header or body field) for all mutating operations;
  - **Audit log** entry: who (AI session), what (tool + payload hash), when, result, correlation ids (call SID, payment intent id, booking id).
- Tools return **explicit errors** (slot gone, price changed, policy deny); the brain must surface customer-safe messages and never invent success.

---

## 6. Auto Booking Engine

AI may **auto-commit** a booking only when **all** of the following hold (extend via policy config, not ad-hoc model text):

- **Service valid**: service exists, active, belongs to tenant, matches catalog rules.
- **Slot available**: authoritative schedule engine says slot is free (no optimistic-only UI state).
- **Business hours valid**: local merchant timezone + exceptions (holidays) applied.
- **Capacity valid**: seats, rooms, staff, or concurrent job limits not exceeded.
- **Customer confirmed**: explicit confirmation step recorded (voice “yes” → structured consent event, or dual confirmation for high-risk SKUs).
- **Idempotency key**: same customer intent does not create duplicate bookings on retries.
- **Booking hold before confirmation**: two-phase pattern—**hold** (soft lock) → **confirm** after payment/policy gates; TTL on holds; release on timeout or deny.

If any condition fails, outcome is **hold**, **waitlist**, or **human fallback**—never silent double-book.

---

## 7. Inventory Engine

Stock is driven by an append-only **stock ledger** (conceptual states); **no** direct “set quantity = N” without ledger lines.

Suggested ledger movement types:

- **IN**: goods received, production complete, return-to-stock (policy-governed).
- **OUT**: sale/fulfillment consumption after confirmed booking or shipment event.
- **RESERVED**: tied to booking hold or payment-pending order; reduces **available to promise**, not necessarily **on-hand** display depending on product rules.
- **RELEASED**: hold cancelled or timed out; reserved quantity returned to ATP pool.
- **ADJUSTMENT**: shrink, damage, cycle count—requires role + reason code + audit; may be human-only in early phases.

Inventory tools only append **ledger events**; reporting derives balances from ledger sums.

---

## 8. Billing & Print Engine

- **Order**: canonical order record linked to booking/service line items; immutable line prices after confirmation (**Chưa xác định** whether line prices freeze at hold vs at capture—product decision).
- **Receipt**: fiscal/receipt payload per jurisdiction; stored and linked to order + payment events.
- **Print job**: job row with template id, printer id, payload checksum, status machine.
- **Printer status**: `ONLINE` / `OFFLINE` / `ERROR`; jobs retry with backoff when printer returns.
- **Duplicate copy rule**: max N reprints per order without manager override; override audited.
- **Offline printer queue**: edge agent or store gateway buffers jobs; **conflict rule** when local queue and cloud state diverge—**Chưa xác định** exact merge strategy without hardware spec.

Printing never implies payment succeeded; receipt may show “pending capture” where legally allowed.

---

## 9. Payment Engine

- **Stripe Connect**: connected accounts per merchant (or legal entity) as per platform onboarding; platform fees per dual split-fee model.
- **PaymentIntent**: create with correct amount/currency; metadata includes `merchantId`, `orderId`, `bookingId`, `idempotency` trace.
- **Pre-authorization / manual capture**: authorize first where policy requires; capture only after booking confirm or service delivery milestone.
- **Webhooks as source of truth**: internal payment state transitions **only** on verified webhook handlers (signature validation, event ordering, idempotent processing).
- **Dual split-fee**: application fee components per V7/V8 agreement (**Chưa xác định** exact fee table in this doc—reference commercial spine).
- **Base currency EUR**: product pricing and internal accounting baseline; FX for non-EUR display—**Chưa xác định** without treasury policy.
- **Ledger**: double-entry or event-sourced money ledger aligned with Stripe balance transactions and internal invoices.
- **Reconciliation**: daily/hourly jobs matching PI/charge/dispute to ledger rows; mismatches page on-call.
- **Refunds / chargebacks**: workflows may **force human fallback**; inventory and booking reversal follow policy-linked compensating ledger entries.

**Zero mocks / no fake payment success** in production: staging keys and test clocks only in non-prod; prod never returns synthetic “paid” without Stripe confirmation.

---

## 10. Cost Firewall

- **Included minutes**: per merchant plan and optional burst pool.
- **Token / audio budget**: per call, per day, per merchant; soft warn then hard stop.
- **Cost per merchant**: aggregate provider invoices allocated by usage metering.
- **Provider cost tracking**: Twilio minutes, STT/TTS units, LLM tokens, embedding calls—tagged by `merchantId` where possible.
- **Model router**: cheap path by default; premium models gated (see §11).
- **Call duration cap**: max length per plan; graceful wind-down or transfer.
- **Spending cap**: merchant-level and platform-level circuit breakers.
- **Auto-pause**: stop new AI sessions when cap exceeded; dashboard banner + email.
- **Overage billing**: metered billing or prepurchase packs—**Chưa xác định** commercial packaging.

---

## 11. AI Model Router

- **Small model for intent**: classify route (FAQ, booking, complaint, payment) and extract slots.
- **Cached FAQ**: embedding retrieval or static cache for high-hit merchant answers—reduces tokens and hallucination surface.
- **Realtime voice for calls**: vendor-specific streaming stack for lowest latency path.
- **Premium model only for complex cases**: escalations, multi-constraint scheduling, dispute language—invoked by router, not user-selectable in prod.
- **Fallback model**: degraded mode when primary vendor errors; must still respect **same tool and policy** boundaries (no “fallback = unrestricted”).

---

## 12. Prompt Armor

- **No prompt leakage**: system prompts and tools never echo other tenants’ data; retrieval scoped by tenant.
- **No unauthorized discounts**: discounts only via policy-approved promo codes or manager tool.
- **No cross-tenant data**: retrieval, CRM, and order lookup always include tenant predicate.
- **No legal/medical advice**: scripted deferrals and escalation paths.
- **No payment outside approved tools**: no Zelle/Venmo/handshake; only Stripe tool paths.
- **No booking outside policy**: model cannot “confirm” without policy `ALLOW` + tool success.

---

## 13. Tenant Isolation

- Every tool call includes **`merchantId` / `tenantId`** resolved from authenticated session or telephony mapping.
- Every query checks **ownership** (row-level scope); shared-nothing logical isolation; **Chưa xác định** physical DB per tenant vs shared schema—architecture allows both if queries enforce tenant.
- **No cross-merchant lookup** in AI tools (including “search similar business”).
- **Audit log every AI action**: tool name, args (redacted where PII), policy decision, outcome, correlation ids.

---

## 14. Human Fallback

Escalate to human (in-app queue, phone transfer, or callback) when:

- **AI confidence low** (calibrated scores or abstain class).
- **Price conflict** (catalog vs quoted vs PI amount mismatch).
- **Slot conflict** (race lost after hold TTL).
- **Angry customer** (sentiment + policy trigger).
- **Refund / complaint** (policy marks human-only).
- **Emergency** (safety keywords, SOS adjacent flows—coordinate with platform safety policy).
- **Policy unknown** (new SKU type, edge holiday rule)—default deny or hold, not guess.

Human handoff preserves **context package** (summary, ids, no cross-tenant payload).

---

## 15. Monitoring & Alerts

- **Sentry**: frontend, API, worker, webhook workers; trace ids propagated from call → tool → Stripe.
- **Call failure alerts**: ASR drop, SIP errors, high post-dial delay.
- **Webhook alerts**: signature failures, duplicate events, unprocessed backlog age.
- **Cost alerts**: burn rate vs budget per merchant and global.
- **Payment reconciliation alerts**: ledger vs Stripe mismatch.
- **Double booking alerts**: two confirmed bookings overlapping same constrained resource.
- **Queue dead-letter alerts**: print, notification, or async booking saga stuck past SLA.

---

## 16. SaaS Pricing Guardrails

- **No unlimited AI** in any public tier; always metered or capped.
- **Included minutes** + transparent **overage price**.
- **Hard cost cap** per merchant and platform-wide kill switch.
- **Margin dashboard**: revenue vs Twilio + LLM + infra per merchant cohort.
- **Trial / demo limits**: watermarked flows, capped minutes, no live capture without KYB completion—**Chưa xác định** exact trial matrix.

---

## 17. Merchant Production Cutover Checklist

A merchant may be switched to **full production** AI Receptionist only when:

1. **KYB / Stripe Connect** complete and **charges_enabled** (or equivalent) true where payments apply.
2. **Webhook endpoints** live in production with verified signing secret rotation plan.
3. **Policy pack** signed off: hours, services, deposits, cancellation, discount caps, human-only intents.
4. **Inventory** ledger enabled and opening balances reconciled (if auto inventory on).
5. **Phone numbers** mapped 1:1 to tenant with **fail closed** on mismatch.
6. **Prompt Armor** rules deployed for merchant vertical (no medical/legal overreach).
7. **Cost firewall** configured: caps, included minutes, router tier—**auto-pause** tested.
8. **Human fallback** queue staffed or overflow SLA defined.
9. **Sentry + dashboards** green; synthetic call test in prod-like staging passed.
10. **No fake payment success**: UAT proved capture/refund paths on Stripe test mode before prod keys.
11. **Tenant isolation tests** passed (pen test scripts: cross-tenant id in tool rejected).
12. **Idempotency** verified under duplicate webhook and duplicate tool retry.
13. **Print path** validated or **b2bAutoBillPrintEnabled** remains off until hardware ready.
14. **Definition of Done** (§21) signed by engineering + finance + ops.

---

## 18. Mini-App Integration

How this module lives inside VIONA super-app / mini-app platform:

- **Hub**: entry for “AI Receptionist” status, caps, and escalation inbox (merchant-facing summary).
- **Local**: optional consumer touchpoints that **route** to the same booking spine when the merchant is local-listed (**Chưa xác định** product boundary vs pure B2C).
- **Merchant Dashboard**: primary control plane—services, hours, inventory, orders, print queue, payment reconciliation, AI session logs (redacted).
- **Broker**: **Chưa xác định** whether broker earns on AI-attributed bookings; if yes, attribution id must flow in metadata for split-fee without leaking other merchants’ data.
- **Travel / Leona**: voice AI for travel is a **separate product slice**; reuse **policy + tool** patterns but not the same tenant mapping as B2B merchant without explicit cross-sell architecture—**Chưa xác định** shared router vs isolated stack.
- **Academy**: training content and simulations only; **no** production payment tools from Academy surfaces.

Mini-app shell loads the B2B AI module via **feature flags** and entitlement service; core remains **one spine** for orders/payments.

---

## 19. Feature Flags (Proposed)

| Flag | Purpose |
|------|--------|
| `b2bAiReceptionistEnabled` | Master gate for B2B AI Receptionist surfaces and APIs. |
| `b2bAiReceptionistVoiceEnabled` | Live PSTN/streaming voice path (expensive path). |
| `b2bAutoBookingEnabled` | Policy may auto-confirm booking after holds + confirmations. |
| `b2bAutoInventoryEnabled` | Ledger-based reserve/release/out on tool success. |
| `b2bAutoBillPrintEnabled` | Print job enqueue and printer integration. |
| `b2bAutoPaymentEnabled` | Create/capture PaymentIntents via approved tools only. |
| `b2bHumanFallbackEnabled` | Escalation queues and transfers active. |
| `b2bAiCostFirewallEnabled` | Enforce caps, router throttling, auto-pause. |

**Note:** Names are illustrative; align with `EXPO_PUBLIC_FEATURE_*` / server config conventions in repo (**Chưa xác định** final naming without code touch in this task).

---

## 20. Implementation Phases

| Phase | Scope |
|-------|--------|
| **Phase 1 — Foundation** | Tenant-scoped tool registry, audit log, policy engine skeleton, Sentry, feature flags, dry-run mode (tools log but no mutations). |
| **Phase 2 — Real phone intake** | Twilio (or equivalent) prod routing, voice streaming, STT/TTS, cost metering, session-tenant binding. |
| **Phase 3 — Auto booking** | Holds, confirmation, idempotency, schedule/capacity integration, human fallback hooks. |
| **Phase 4 — Safe payment** | Stripe Connect PI, pre-auth/manual capture, webhooks, ledger, reconciliation, zero fake success. |
| **Phase 5 — Inventory / bill** | Ledger engine, print job pipeline, receipt generation, offline queue strategy. |
| **Phase 6 — Full B2B SaaS** | Plan tiers, overage, margin dashboard, broker attribution (if product), hardening and compliance pack. |

---

## 21. Definition of Done

Full production for a merchant (or globally) is **only** enabled when:

- **Typecheck / lint** pass on all touched services (**Chưa xác định** mono-repo CI matrix).
- **No fake payment state** in any environment that uses prod keys.
- **Sandbox payment** tested end-to-end (auth, capture, refund, partial capture if offered).
- **Webhooks verified** (signature, replay, ordering, idempotency).
- **Ledger reconciles** with Stripe and internal orders.
- **Test calls** passed (audio quality, drop rates, policy denials, happy path booking).
- **Cost cap works** (unit and integration tests + staged soak).
- **Tenant isolation tested** (negative tests on cross-tenant ids).
- **Human fallback works** (queue or transfer verified under load).
- **Monitoring works** (Sentry + alerts + runbooks).

---

## Appendix: Open Items

Items explicitly **Chưa xác định** in this lock doc should be resolved by product/legal/finance before build commitments: multi-currency UX, broker attribution on AI bookings, travel vs B2B shared voice stack, print merge rules, exact SaaS tiers, and DB tenancy model (shared vs dedicated).
