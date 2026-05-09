# VIONA SOS Basic & SOS Plus — product spec (UI / positioning)

**Status:** Product positioning and UX intent. **This document does not implement billing, entitlements, emergency dispatch, or live calling.**

## Principles

1. **SOS Basic** must remain **discoverable before login** — users need a serious, visible emergency entry without a paywall or subscription gate for the *entry point* itself.
2. **SOS Plus** (€4.99/month, positioning) covers **advanced protection and continuity features** — not the existence of a red SOS entry.
3. **No implied guarantees:** no copy stating guaranteed rescue, automatic police/fire/ambulance routing as production-complete, or official emergency partnership unless separately verified and legally approved.

## SOS Basic (positioning)

- **Purpose:** Fast, emotionally clear path to in-app emergency assistance surfaces the product already exposes (e.g. existing SOS sheet after authentication where applicable).
- **UX:** Premium red-neon affordance; **hold ~3 seconds** to reduce accidental activation (desktop Home gate in current UI pack).
- **Pre-login:** A **non-destructive** entry (e.g. informational alert on Login) explains Basic vs full in-app flow after sign-in. **Does not** dial numbers or request sensitive permissions by itself in this pack.

## SOS Plus — €4.99 EUR/month (positioning only)

**Planned** differentiators (subject to legal/privacy/engineering review before any build):

| Area | Intent |
|------|--------|
| Trusted contacts | User-defined contacts notified or referenced per policy |
| Emergency profile | Medical / language / context card user maintains |
| Location sharing | Explicit, consent-based sharing windows |
| Encrypted incident vault | User-controlled storage of evidence metadata/files |
| Voice triage | **After** SOS activation, optional guided prompts — requires speech consent, locale rules, false-positive controls |
| Post-incident timeline | Structured log of user-visible steps (not a dispatch guarantee) |

**Monetization:** €4.99/month is a **commercial target**; **no Stripe SKU, entitlement, or subscription enforcement** is defined in the SOS red-neon UI pack.

## Voice command (future — not implemented)

- Activation only **after** user completes SOS hold / explicit SOS activation flow.
- Example keyword intents (Vietnamese): *Cứu* (general emergency), *Cháy* (fire), *Cướp* / *giết người* (severe threat — police-oriented triage copy only).
- Requires: regional emergency-number database, false-positive protection, consent & privacy review, **legal review** before shipping.

## Recording (future — not implemented)

- Audio/video only **after** explicit SOS activation and **separate** informed consent.
- OS permissions requested only in a dedicated flow; visible recording indicator; encrypted storage; upload/share only per user settings and applicable law.
- **No** background recording without user-initiated SOS.

## Constraints (all packs)

- No claim of live emergency dispatch partnership unless verified.
- No “production-ready” auto-routing to PSAP unless certified integrations exist.
- Emergency calling and recording require user setup, device permissions, and regional availability (`sos.disclaimer` in app i18n).
