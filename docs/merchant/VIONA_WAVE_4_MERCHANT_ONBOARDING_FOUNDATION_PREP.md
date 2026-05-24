# VIONA Wave 4 — Merchant Onboarding Foundation Prep

**Pack:** `VIONA.WAVE_4.MERCHANT_ONBOARDING_FOUNDATION.PREP.1`  
**Status:** **COMPLETE (planning)** — **no implementation** in this pack  
**Date (UTC):** 2026-05-20  
**Classification:** Architecture / planning — **not** production merchant launch, **not** commercial SaaS, **not** payment/payout/KYB production

---

## 1. Baseline

| Item | Value |
|------|--------|
| **master / origin at prep** | `35354db` — `docs(design): close Wave 3 consumer UX excellence` |
| **Wave 1 (Local no-charge pilot)** | **Closed** — Sessions 1–5 PASS; exit criteria + handoff |
| **Wave 2 (native mobile confidence)** | **NOT COMPLETED** — RUN.1 not run; no native PASS claim |
| **Wave 3 (Consumer UX Excellence)** | **Closed — PARTIAL PASS** — staging/pre-commercial UX with limitations (`VIONA_WAVE_3_CLOSEOUT.md`) |
| **Local money law** | **Unchanged** — `REQUEST_ONLY_NO_CHARGE`, `walletPhase` **NONE**, `paymentCaptured` **false**, confirmed ≠ paid |
| **VIONA commercial state** | Pre-commercial / staging-pilot foundation |
| **Global Active / full commercial** | **Not yet** |
| **Working tree** | 11 unrelated unstaged `src/` files — **not** in Wave 4 baseline |

**Wave 3 carry-forward (merchant-relevant):** `LocalMerchantRequestInboxScreen` status clarity (`13a7ca3`); Business entry preview copy on Home (`2497383`); B2B merchant workspace exists but **not** production onboarding.

---

## 2. Wave 4 purpose

Wave 4 defines the **merchant onboarding foundation** so VIONA can eventually serve:

| Audience | Need (future) |
|----------|----------------|
| **Vietnamese merchants abroad** | Discoverable business identity, services, hours, request handling |
| **Local customers of Vietnamese merchants** | Clear merchant profile + request-only Local flow |
| **Local service providers** | Catalog + capacity + inbox without payment capture |
| **Business / Merchant tools** | Staged path from preview profile → operational inbox |
| **Future B2B SaaS modules** | Tenant-safe onboarding hooks (isolation, audit metadata) |

### What Wave 4 is

- **Foundation** — data model **planning**, UX surface **inventory**, safety/copy **rules**, small **docs-first** pack map
- **Alignment** with Wave 1 Local pilot evidence and Wave 3 consumer tile/safety grammar
- **Staging-limited roster** mindset (pilot merchants, internal QA personas)

### What Wave 4 is not

| Not in Wave 4 | Reason |
|---------------|--------|
| Production merchant onboarding at scale | Requires finance/legal/ops gates (Level 6+) |
| **KYB/KYC production verification** | Legal/compliance wave — locked |
| **Payment / payout / settlement** | Wave 6–7 architecture + finance approval |
| **Commercial merchant SaaS billing** | Subscription/billing locked |
| **Global Active / full commercial** | Master roadmap gate |
| **Schema migrations / Prisma changes** | Implementation packs only after design sign-off |
| **Production merchant dashboard claim** | Ops/admin production locked |

---

## 3. Merchant onboarding target model (staged levels)

Merchants progress through **documented levels**. Implementation packs must not skip levels without explicit program approval.

| Level | Name | Scope | Money / legal | Typical exit evidence |
|-------|------|--------|---------------|------------------------|
| **0** | Pilot merchant persona / internal roster | Seed merchants for Local pilot; no public signup | No charge; no KYB | Roster doc + session smoke |
| **1** | Preview merchant profile | Display name, category, market, languages, contact (preview) | Self-declared only; no verification claim | UI audit + copy PASS |
| **2** | Service catalog foundation | Categories, offerings, descriptions, preview/disabled flags | Request-only; no priced checkout | Catalog plan + staging QA |
| **3** | Hours / capacity foundation | Opening hours, capacity notes, service area | No booking guarantee | Hours UI plan + QA |
| **4** | Request / inbox operational readiness | Inbox, detail, confirm/decline **guidance** (no settlement) | `REQUEST_ONLY_NO_CHARGE`; confirmed ≠ paid | Inbox UX continuation + pilot smoke |
| **5** | Ops / support readiness | Escalation path, incident tags, read-only ops alignment | No production admin | Wave 5 overlap; playbook draft |
| **6** | Commercial merchant onboarding | KYB/KYC, billing, payouts, settlements | **Only after** finance/legal gates (Wave 6–7+) | Finance sign-off — **out of Wave 4** |

**Wave 4 implementation target band:** Levels **0–4** (foundation + operational preview). Level **5** coordinates with Wave 5; Level **6** is explicitly **future**.

---

## 4. Merchant data model planning (docs-only — no schema)

Planning fields for future persistence design. **Do not implement** tables or migrations in Wave 4 foundation packs without a dedicated schema design pack approved by engineering + finance.

| Domain | Planned fields (conceptual) | Notes |
|--------|----------------------------|--------|
| **Identity** | Business display name; slug/handle (internal); business category; short tagline | Public-facing preview only at L1+ |
| **Market** | Country; city/region; primary market; timezone | Market gate labels in UI |
| **Language** | Supported languages (VI, EN first); default customer-facing language | i18n keys per §10 |
| **Contact** | Phone/email/chat channel flags (preview); preferred contact method | No auto-dial payment links |
| **Catalog** | Service categories; service items; duration/notes; preview/active/disabled | No live pricing checkout in Wave 4 band |
| **Operations** | Opening hours (weekly template); exceptions; capacity notes; service area radius/notes | Honest “preview hours” labeling |
| **Status** | `preview` \| `pilot` \| `staging_active` \| `paused`; onboarding step completion | No `production_live` without L6 gate |
| **Trust / safety** | Trust notes; pilot disclaimer refs; last safety copy version | Tied to no-charge banners |
| **Ownership** | Owner user id; admin/staff roles (planning); audit actor ids | Tenant isolation checks in future packs |
| **Audit** | createdAt/updatedAt; onboarding pack version; ops review flags (read-only) | Align with Ops Audit read-only posture |

**Relationship to existing code (reference only):** B2B screens (`LocalMerchantRequestInboxScreen`, merchant workspace layouts) may gain **UX** alignment packs; data storage shape TBD in schema design wave.

---

## 5. Merchant UX surfaces (future — planned inventory)

| Surface | Purpose | Wave 4 band | Premium tile / safety |
|---------|---------|-------------|------------------------|
| Merchant welcome / onboarding intro | Explain pilot, no-charge, steps | L0–L1 | Pilot strip; no commercial launch claim |
| Business profile setup | Name, category, market, languages, contact | L1 | VI/EN; self-declared banner |
| Service catalog setup | Categories + services (preview) | L2 | No checkout; preview chips |
| Hours / capacity setup | Hours template + capacity + area | L3 | “Preview hours” honest labeling |
| Request inbox | List incoming Local requests | L4 | Extend Wave 3 merchant inbox clarity |
| Request detail | Status, customer message, timeline | L4 | Confirmed ≠ paid visible |
| Confirm / decline guidance | Education + actions (staging rules) | L4 | No “provider paid” / settlement copy |
| No-charge pilot banner | Persistent money law | L0–L4 | Matches Local consumer hubs |
| Ops / support contact path | Link to support playbook (staging) | L5 | No consumer-tab Ops Audit |

**Out of Wave 4 UX scope:** subscription paywall, payout settings, tax invoice UI, KYB document upload (production), public merchant marketplace at scale.

---

## 6. Safety and money boundaries (non-negotiable)

All Wave 4 merchant onboarding packs **must** preserve:

| Law | Requirement |
|-----|-------------|
| Local mode | **`REQUEST_ONLY_NO_CHARGE`** |
| Wallet | **`walletPhase` NONE** |
| Capture | **`paymentCaptured` false** in consumer/merchant messaging |
| Status | **Confirmed ≠ paid** on merchant and user surfaces |
| Negations | **No** provider paid; **no** payout; **no** settlement; **no** escrow |
| Booking | **No** paid booking; **no** guaranteed booking |
| Commercial | **No** commercial merchant billing; **no** platform fee claims |
| Consumer exposure | **No** hold/debit/release/refund UI on merchant onboarding |

**Copy grep (required on new merchant onboarding keys):** same forbidden patterns as Wave 3 (`production ready`, `Global Active ready`, `cash-out`, `payout`, `settlement`, `guaranteed booking`, etc.).

---

## 7. KYB / KYC / legal boundaries

| Topic | Wave 4 stance |
|-------|----------------|
| Production KYB/KYC | **Not started** — no document verification pipeline |
| Government / registry verification | **No claim** — no “verified business” badge |
| Legal approval | **No claim** — no “approved to operate” public copy |
| Tax / invoice readiness | **No claim** — no e-invoice or tax ID validation UI |
| Business ownership | **Preview / self-declared** until Level 6 gates |
| Merchant terms | **Draft-only** packs allowed (legal review before publish) |

Merchant onboarding UI may say **“preview profile”**, **“pilot roster”**, **“staging”** — never **“fully verified”** or **“licensed to accept payments”** in Wave 4 band.

---

## 8. Ops / admin relationship

| Area | Relationship to Wave 4 |
|------|-------------------------|
| **Local pilot evidence** | Wave 1 Sessions 1–5 + merchant inbox smoke inform L4 inbox requirements |
| **Ops Audit** | Read-only safety tool for operators — **not** exposed on consumer tab bar; merchant onboarding docs reference audit **metadata** only |
| **Support / incidents** | Future Wave 5 playbook — merchant onboarding provides **contact path** stub copy, not production ticketing |
| **Production admin** | **Locked** — no claim that staging onboarding equals production admin |
| **Pause / resume** | Pilot roster can be paused in ops runbooks without implying payment disable (no payments exist) |

**Principle:** Merchant onboarding improves **clarity and roster discipline**; ops tools remain **read-only / staging** until finance unlock.

---

## 9. i18n / market readiness

| Priority | Plan |
|----------|------|
| **VI / EN first** | All new `merchantOnboarding.*` keys in `en.json` + `vi.json` |
| **Later locales** | cs/de/fr/ko — EN fallback acceptable with documented gap (Wave 3 pattern) |
| **Country-specific terms** | Deferred — use neutral “market” labels until legal review |
| **Market gate labels** | `pilot`, `preview`, `staging` chips — no `live` / `global_active` |
| **Overclaim** | Compact subtitles; `numberOfLines`; Premium App Tile grammar where tiles used |

---

## 10. Wave 4 pack map (proposed)

Small, reviewable packs. **Default:** docs/static audit before code unless pack explicitly allows copy-only.

| # | Pack ID | Type | Deliverable |
|---|---------|------|-------------|
| 1 | `VIONA.WAVE_4.MERCHANT_ONBOARDING_SURFACE_AUDIT.1` | Docs | Inventory B2B/merchant screens vs levels 0–4 |
| 2 | `VIONA.WAVE_4.MERCHANT_PROFILE_FOUNDATION_UI_PLAN.1` | Docs | L1 profile fields, navigation, tile layout |
| 3 | `VIONA.WAVE_4.MERCHANT_SERVICE_CATALOG_FOUNDATION_PLAN.1` | Docs | L2 catalog UX + preview states |
| 4 | `VIONA.WAVE_4.MERCHANT_HOURS_CAPACITY_FOUNDATION_PLAN.1` | Docs | L3 hours/capacity/area UX |
| 5 | `VIONA.WAVE_4.MERCHANT_NO_CHARGE_PILOT_COPY_RULES.1` | Docs | Merchant-side money law + forbidden wording |
| 6 | `VIONA.WAVE_4.MERCHANT_REQUEST_INBOX_UX_CONTINUATION.1` | Runtime (scoped) | Extend inbox/detail; **no** API/payment changes |
| 7 | `VIONA.WAVE_4.MERCHANT_ONBOARDING_I18N_KEYS_PLAN.1` | Docs | Key namespaces + VI/EN matrix |
| 8 | `VIONA.WAVE_4.MERCHANT_ONBOARDING_SAFETY_TERMS_DRAFT.1` | Docs | Draft terms/disclaimers for legal review |
| 9 | `VIONA.WAVE_4.MERCHANT_ONBOARDING_READINESS_REVIEW.1` | Docs | Staging readiness; limited-roster gate |

**Exit gate (Wave 4 program):** Limited-roster onboarding QA PASS on staging; **not** open public production onboarding (per master roadmap Wave 4).

---

## 11. Recommended first implementation

**Start with:** `VIONA.WAVE_4.MERCHANT_ONBOARDING_SURFACE_AUDIT.1`

| Why first | Detail |
|-----------|--------|
| Docs-only | No schema, API, or payment risk |
| Ground truth | Maps existing B2B screens (`LocalMerchantRequestInboxScreen`, merchant workspace, Business entry) to levels 0–4 |
| Gap list | Drives ordered packs 2–9 |
| Wave 3 alignment | Ensures Premium App Tile + no-charge copy continuity |

**Do not start with:** schema migration, signup API, KYB upload, or billing screens.

---

## 12. Locked zones (unchanged)

Still **locked** for all Wave 4 packs unless master roadmap + finance explicitly unlock:

- Payment / wallet / commercial **implementation**
- Hold / debit / release / refund
- Settlement / payout / cash-out / escrow
- **Merchant subscription / billing**
- **Production KYB/KYC**
- **Production admin** claim
- **Autonomous AI** (merchant auto-reply execution)
- **SOS production reliability**
- **Global Active / full commercial** claim
- **Native PASS** until real native attestation

---

## 13. Non-goals (Wave 4 program)

- Production merchant launch or public self-serve signup at scale  
- Commercial SaaS launch or merchant subscription billing  
- Payment, payout, settlement, or wallet ledger implementation  
- Prisma / DB schema migration (planning fields only in this prep)  
- Production KYB/KYC or government verification  
- Global market activation or “Global Active ready” marketing  
- Wave 7 finance implementation (reference only)  
- Native production confidence (Wave 2 still pending)  

---

## 14. Related documents

| Document | Role |
|----------|------|
| `VIONA_WAVE_3_CLOSEOUT.md` | Wave 3 closed; merchant inbox note |
| `VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md` | Wave 4–7 sequencing |
| `VIONA_PROJECT_KERNEL.md` | Money law + program identity |
| `VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` | Wave 1 exit |
| `VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_HANDOFF_1.md` | Pilot evidence |
| `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` | Tile grammar for merchant UX |

---

## 15. Next action

| Priority | Action |
|----------|--------|
| **1** | Execute **`VIONA.WAVE_4.MERCHANT_ONBOARDING_SURFACE_AUDIT.1`** |
| **2** | Parallel (optional): Wave 2 **RUN.2** on physical device when adb stable |
| **3** | Parallel (optional): Wave 3 demo screenshot capture before external stakeholder demo |
| **4** | **Do not** open Wave 7 or production KYB/payment without finance gate |

---

**Signoff:** Wave 4 prep **complete**. Merchant onboarding **foundation is defined**; **implementation not authorized** by this document alone.
