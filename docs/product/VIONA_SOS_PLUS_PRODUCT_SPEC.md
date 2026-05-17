# VIONA SOS Basic & SOS Plus — product spec (AF.SOS.1)

**Document type:** Product / UX specification — Hub · LifeOS · SOS Lifeline mini-app surface.  
**Status:** AF.SOS.1 surface + **AF.SOS.2** local typed entitlement/consent/session contracts & profile UI (see `VIONA_SOS_PLUS_PRODUCTION_ROADMAP.md`). **No live emergency automation, no billing SKU, no server-backed entitlements yet.**

## Audience & personas

**Vietnamese users worldwide** — diaspora in any host country, cross-border travelers, families, and vulnerable users who need **clear, calm** emergency-related guidance without misleading guarantees. Copy is **global**, not Europe-only; Europe appears only when a specific market filter or curated dataset is active.

## Tier definitions

| Tier | Maturity | Purpose |
|------|----------|---------|
| **SOS Basic** | Lite | Always-visible entry; hold-to-confirm; routes (when signed in) to existing in-app emergency sheet and guidance already in the product. |
| **SOS Plus** | Pilot / gated | **Global** emergency companion layer (**€4.99/month** positioning) for Vietnamese people abroad and travelers — deeper companion features; **not** required to see or tap SOS Basic. |

## Honest labeling (non-negotiable)

1. **VIONA SOS does not replace local emergency services.** Users must call local emergency numbers when life safety is at risk.
2. No copy implying **guaranteed** rescue, **automatic** PSAP/police/fire/ambulance routing as production-complete, or official partnerships unless legally verified.
3. Future capabilities are labeled **Planned**, **Pilot**, or **Requires setup** in UX.

## UX behaviors (this repo wave)

- **Red neon SOS** remains in Home top chrome (`VionaFashionHomeCommandBar`) and quick actions (`VionaQuickActionPill`).
- **Hold ~3 seconds** before continuing (`VionaSosHoldButton`; legacy header `components/emergency/SOSModal` aligned to 3s).
- **Desktop fashion Home:** hold gate modal (`VionaSosHoldGateModal`) before invoking existing `triggerSafetyAssist()` → opens **`screens/b2c/SOSModal`** safety sheet only (no interpreter auto-start, no fake dispatch).
- **Pre-login (`LoginScreen`):** SOS pill opens the same hold gate in **`preLogin`** variant — guidance + optional Basic vs Plus info — **no PSTN dial**, no navigation into authenticated tabs, hold completion only closes the gate.
- **SOS Plus info:** `VionaSosPlusInfoModal` — Basic vs Plus, €4.99/month positioning, planned/pilot feature list, disclaimers. Reachable from hold gate (“Basic vs Plus”), emergency sheet link (“About SOS Plus”), and pre-login gate.

## SOS Plus — planned / pilot capabilities (positioning)

Listed in-app as **not active today**:

| Capability | Label |
|------------|-------|
| Voice keyword hints after activation (“Cứu”, “Cháy”, “Cướp”, “Help”) | Pilot — requires setup; not background listening |
| Local emergency guidance by current country/region (informational) | Planned |
| Trusted contact alert (anywhere you travel) | Planned |
| Embassy / consulate pointers (official directories — no auto-dial) | Planned |
| Consent-based audio/video recording | Pilot — consent required |
| Emergency routing setup | Future — requires setup; **not** live dispatch |

## Monetization

**€4.99/month** is a **commercial target** for SOS Plus. **No Stripe checkout, subscription object, or wallet mutation** ships in AF.SOS.1.

## Emergency routing rule (copy + product)

- **Do not** hardcode Vietnam **113 / 114 / 115** or global shortcuts (**112 / 911**) in UX unless tied to a **verified country routing matrix** for that market.
- Until that matrix exists, sheets show **generic guidance**: call your **local** emergency number directly if in immediate danger; categories (medical, police, fire, trusted contact, scam note, embassy/consulate help) stay **global**.

## Explicit non-goals (AF.SOS.1)

- Real PSTN automation or verified one-tap dialing from the guidance sheet without routing data and legal sign-off.
- Twilio / telecom orchestration.
- Voice recognition **activation** or hot-word listening in background.
- Background or covert recording; camera capture pipelines.
- Location **dispatch** to authorities.
- Database / Prisma / API / Auth session semantics changes for SOS Plus entitlement.

## Feature flag

`src/config/sosPlusSurface.ts` — `SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED` (local UI constant). Toggle off to hide Plus strip and info entry points without removing SOS Basic.

## Related audits

- `docs/audit/VIONA_AF_SOS_PLUS_SURFACE_AUDIT.md` — implementation verification for AF.SOS.1.
- `docs/audit/VIONA_PACK_SOS_RED_NEON_AND_PLUS_SPEC_AUDIT.md` — earlier red-neon shell pack notes.

---

**Document control:** Update when billing, consent flows, or regional emergency data pipelines are introduced.
