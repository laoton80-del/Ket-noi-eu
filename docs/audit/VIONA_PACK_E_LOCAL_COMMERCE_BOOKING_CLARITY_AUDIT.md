# VIONA Pack E Local Commerce Booking Clarity Audit

## 1. Summary

- **Clarified:** Universe Local is positioned as a **Vietnamese services marketplace** with three explicit audiences (Việt ở nước ngoài, khách bản địa, merchant Việt) plus a **booking-status vocabulary** (Lite, Request, Demo, Pilot, Coming soon, Gated) and a **no-fake-fulfillment** safety note aligned with CEO/CFO risk posture.
- **Why Local first:** Local is the nearest on-device commercial surface for Viet SMB inventory without opening payment/booking production contracts in this pack.
- **Deliverables:** `localCommerceTypes` + `localCommerceRegistry`, `LocalCommerceClarityBlock` on `LocalScreen`, `localCommerce.*` i18n (en/vi), and **copy-only** hardening on the **demo legal booking** `Alert` path (same `createBooking` call graph).

## 2. Current local gaps (pre-Pack E)

| Area | Prior behavior | Booking / payment clarity risk | Smart Trio gap | Pack E action |
|------|----------------|----------------------------------|----------------|----------------|
| `LocalScreen` | Hero + tiles + classifieds; demo lawyer booking used “Success!” | Implies paid/confirmed production | Trio legs not shown on Local | Add clarity block + Smart Trio preview line |
| Demo `createBooking` | Success wording generic | Misread as production receipt | N/A | Replace alerts with demo/request copy via i18n |
| B2B tile | “B2B booking” generic a11y | Merchant vs consumer ambiguity | N/A | `localCommerce.a11y.merchantB2bHub` |
| Leona prefills | Hard-coded Vietnamese strings | Inconsistent EN/VI product voice | N/A | Move prefills to `localCommerce.*` keys |
| `MerchantDetailScreen` | AI tool traces only | Low for Pack E scope | N/A | **Not modified** (no booking CTA surface found) |

## 3. Local commerce model

| Capability | Audience | Status | Risk | Primary CTA key (copy) |
|------------|----------|--------|------|-------------------------|
| `localMarketplace` | `vietnameseAbroad`, `nativeCustomer` | `lite` | low | `browseServices` |
| `serviceMenu` | `nativeCustomer` | `lite` | low | `browseServices` |
| `bookingRequest` | `nativeCustomer` | `requestOnly` | medium | `requestBooking` |
| `merchantDashboard` | `vietnameseMerchant` | `lite` | low | `merchantSetup` |
| `aiReceptionistPilot` | `vietnameseMerchant` | `pilot` | medium | `aiReceptionistPilot` |
| `nativeLanguageBooking` | `nativeCustomer` | `demo` | medium | `requestBooking` |

## 4. UI behavior

| Question | Answer |
|----------|--------|
| Where does the clarity block appear? | Immediately **after** the hero intro `VionaCard`, **before** the Vietnam inbound banner / hero tiles. |
| What changed visually? | One additional card (compact) + CTA chip row + capability list + status legend. |
| Smart Trio? | **Yes** — `useSmartTrio()` renders customer / merchant / native language labels (preview only). |
| Taps | Browse → existing `openServiceHub`; request assist → existing `openLeonaPrefill`; merchant setup → existing `B2BPaywall` route; AI pilot → **Alert** info only (no new navigation). |
| Navigation / routes | **Unchanged** (same `navigate` targets as before). |

## 5. Booking / payment safety

- **No fake payment:** wallet / `reserveAndCommitCredits` flows untouched; demo booking alerts now state **demo/staging / not a receipt**.
- **No fake confirmed booking:** removed celebratory “Success!” framing on demo lawyer booking success path.
- **Request / pilot explained:** `localCommerce.safety.bookingRequestNote` + per-capability descriptions + AI pilot note.
- **Merchant confirmation:** explicitly stated in audience + capability copy.

## 6. What this does not do

- No backend mutation, no Prisma, no Stripe/webhook edits.
- No booking service logic changes (same `createBooking` invocation).
- No payment rails, wallet ledger, or AI production action edits.
- No route renames or feature-flag behavior changes.

## 7. Safety checklist

| Check | Result |
|--------|--------|
| payment touched? | **no** |
| booking mutation touched? | **no** |
| wallet touched? | **no** |
| DB / Prisma touched? | **no** |
| AI production touched? | **no** |
| provider fulfillment touched? | **no** |
| route names changed? | **no** |
| feature flags changed? | **no** |

## 8. Validation

| Command | Result |
|---------|--------|
| `npm run typecheck` | OK |
| `npm run ci:expo-readiness` | PASS |
| `npm run lint` | Exit 0 (0 errors) |
| `npm run ci:release-discipline` | OK |

## 9. Next pack recommendation

- **Pack C.2** — AI Receptionist pilot hardening (gates, logging, human handoff copy).
- **Pack F** — Payment / ledger only after explicit commercial/legal sign-off.
- **Pack E.2** — Service/menu language mapping to Smart Trio legs per merchant category.
