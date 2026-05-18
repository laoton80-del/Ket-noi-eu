# VIONA.GLOBAL_ACTIVE_FULL_STANDARD_LOCK.1

**Document ID:** `VIONA.GLOBAL_ACTIVE_FULL_STANDARD_LOCK.1`  
**Type:** Strategy lock (docs only)  
**Branch:** `pack-af16-global-active-full-standard-lock`  
**Base master:** `40d4d5f`  
**Date:** 2026-05-16  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md) §1.1, [Global Language Strategy](./VIONA_I18N_GLOBAL_LANGUAGE_STRATEGY_AUDIT_1.md), [Tier-1 Locale Completeness](./VIONA_I18N_TIER1_LOCALE_COMPLETENESS_AUDIT_1.md).

**Lock statement:** VIONA’s **target product state** is **Active / Full globally** for the **entire app** and **all markets**. **Lite / Pilot / Demo / Gated / Beta / Coming Soon** are **internal readiness and safety gates only** — not a reduced product vision and not permission to treat any market as strategically “demo-only.”

---

## 1. Global Active / Full target

| Dimension | Definition |
|-----------|------------|
| **Product** | **Global Vietnamese Companion OS + Super App Mini-App Platform** — one platform, all universes, all markets in strategic scope. |
| **Geography** | **All markets are in scope.** Rollout order (Tier 0 → Tier 3, locale packs, ops readiness) describes **implementation sequence**, not permanent exclusion. |
| **Universes** | Every VIONA universe is **intended to be available globally** (subject to lawful operation and honest readiness labels per surface). |
| **No demo-only market** | Absence of native locale, payment rail, or ops runbook in a region is **progress debt**, not a statement that VIONA is “not a real product there.” |

### 1.1 Full core app (global target)

The following are **in scope globally** as core VIONA — not optional regional modules:

| Surface | Global target role |
|---------|-------------------|
| **Home / LifeOS** | Command hub, multiverse entry, wallet/role shortcuts |
| **SOS / Global Lifeline** | Safety layer for Vietnamese worldwide (Basic → Plus → Live Automation per gates) |
| **Travel** | Direction-aware companion (not OTA theater) |
| **Local** | Vietnamese services marketplace + merchant ops |
| **Academy** | Learning, family practice, AI teacher surfaces |
| **Account / Profile** | Identity, roles, setup, preferences |
| **VIO Loyalty** | VIO Credits / VIO Points — in-app motivation, not cash/crypto |
| **AI Companion** | Leona, interpreters, receptionist pilots — cost-governed |
| **Business / Merchant** | Merchant workspace, catalog, orders, growth |
| **B2B Wholesale / E-shop Import** | Supplier → merchant → storefront commerce layer |
| **Income / Broker / Community loops** | Referral, broker, community economics per blueprint |
| **Smart Trio language layer** | Vietnamese + English + native local language by market |

---

## 2. Internal readiness labels (not product vision)

| Label | Meaning | What it is **not** |
|-------|---------|-------------------|
| **Lite** | Reduced automation or async flows; honest capability bounds | “This universe does not exist in this country” |
| **Pilot** | Limited audience, manual ops, or staged integrations | “Permanent beta product for this market only” |
| **Demo** | Non-production data paths, preview UI, training flows | “VIONA is a demo app in this region” |
| **Gated** | Blocked until legal, payment, identity, or compliance sign-off | “Feature removed from global roadmap” |
| **Beta** | Live-ish with known gaps and escalation paths | “Unlimited production promises” |
| **Coming Soon** | Surface visible; behavior not wired | “Market excluded from platform” |

**Why labels exist:** Control **safety**, **legal**, **ops**, **payment**, **AI cost**, and **fulfillment risk** while the platform advances toward Active/Full globally.

**UX rule:** Show readiness honestly on the surface. **Do not** use Lite/Pilot/Demo to imply VIONA is a smaller product category in a given country.

---

## 3. No-fake production boundary

**Active/Full target does not relax honesty rules.** The following must not be implied in UI, locale, or marketing unless **verified systems + ops + legal** support the claim:

| Forbidden implication | Examples |
|----------------------|----------|
| Emergency dispatch | “Authorities notified,” “response team dispatched,” “VIONA called police for you” |
| GPS / location sharing | “GPS shared with VIONA center,” “location sent to emergency services” without real consent + implementation |
| Payment / money | “Payment captured,” “paid successfully,” “refund guaranteed,” payout/cash-out, withdrawable VIO |
| Booking / fulfillment | “Booking confirmed,” “instant fulfillment,” “order on radar” without merchant/SoT truth |
| Certification | Official diploma, accreditation, immigration/legal outcomes from Academy AI |
| Commerce | Fake supplier verification, stock, MOQ, delivery date, wholesale price |
| AI telephony | Live AI calling, autonomous booking/payment, “human concierge on the line” when demo |
| Trust badges | Verified merchant/provider/identity when status is unverified |

**Canonical process:** Author safety and payment strings in **`en.json`** first; localize only after Trust & Safety / Payments review. See Operating Protocol §3 rule 2 and SOS/B2B sections.

---

## 4. Release and readiness language

| Audience | Language |
|----------|----------|
| **Public / strategic** | VIONA is a **global full platform** for the Vietnamese diaspora and connected ecosystems worldwide. |
| **Internal / engineering** | Per-surface readiness: Lite, Pilot, Demo, Gated, Beta, Coming Soon, Active — tied to feature flags, runbooks, and owners. |
| **Investor / partner decks** | Full universe map globally; call out **honest gates** on live claims, not “we only ship in X.” |

**Anti-patterns:**

- “Czech market is demo-only” → **Wrong** (implementation may be Lite; market is in scope).
- “Travel is not part of VIONA in FR” → **Wrong** (locale gap ≠ universe removal).
- “We will never do B2B wholesale in US” → **Wrong** unless founder-signed blueprint amendment.

---

## 5. Locale and language strategy (implementation only)

| Topic | Lock |
|-------|------|
| **Locale files** | Current `src/i18n/locales/*.json` coverage is **implementation progress** — not a permanent language or country ceiling. |
| **Missing native locale** | Does **not** remove a market from global scope. |
| **Early operation** | **English bridge + Vietnamese + safety-critical local bundle** may operate until full native UI is ready. |
| **Final target** | **Full native-language support by market** (Smart Trio: vi + en + native). |
| **Honest UI** | Settings / Smart Trio may show **Preview · EN bridge** when coverage is partial — without shrinking strategic scope. |

**Cross-reference:** Tier-1 completeness audit describes **today’s** key counts; post–`VIONA.I18N.TIER1_CS_DE_COMPLETION.1` cs/de coverage rises while **global Active/Full** remains the vision regardless of percentage.

---

## 6. Relationship to rollout tiers

| Tier (language strategy doc) | Role under this lock |
|------------------------------|----------------------|
| **Tier 0** (en, vi) | Canonical copy + safety baseline — not “the only two languages forever.” |
| **Tier 1** (cs, de, fr, ja, ko) | Pilot **implementation** for matrix markets — not “CZ/DE/FR/JP/KR-only product.” |
| **Tier 2–3** | Expansion sequence — markets added to scope **before or with** locale/ops readiness. |

---

## 7. Agent and pack instructions

When scoping work:

1. Assume **global Active/Full** unless a **founder-signed blueprint amendment** says otherwise.
2. Use **Lite / Pilot / Demo** in copy and flags to describe **current behavior limits**, not roadmap shrinkage.
3. Never trade **honest readiness** for **fake production** to “look Active.”
4. Locale PRs increase **implementation coverage**; they do not redefine product scope.

---

## 8. Validation (this pack)

| Check | Expected |
|-------|----------|
| App source changed | **No** |
| Locale JSON changed | **No** |
| Docs only | **Yes** |

---

## 9. Confirmations

| Question | Answer |
|----------|--------|
| App logic / routes / backend / auth / payment / wallet / Prisma / package changed? | **No** |
| Product vision limited to pilot markets? | **No** |
| Lite/Pilot/Demo = internal gates only? | **Yes** |

---

*End of lock — `VIONA.GLOBAL_ACTIVE_FULL_STANDARD_LOCK.1`*
