# Audit: AF.SOS.2 — SOS Plus entitlement, consent, and live-ready architecture (Phase 1)

**Wave:** AF.SOS.2  
**Scope:** Typed frontend models, **local-only** persistence (AsyncStorage), consent/profile UI, SOS session record shape, documentation.  
**Explicit out of scope (verified):** Stripe checkout, Twilio calls, emergency dispatch, background/camera recording, upload pipelines, Prisma/DB migrations, REST/GraphQL mutations for SOS Plus.

## Checklist

| Item | Status | Evidence |
|------|--------|----------|
| Entitlement abstraction (stub labeled) | Pass | `SosPlusEntitlementSnapshot` in `src/domain/sos/sosPlusModels.ts`; UI banner `sosPlus.stubBanner` |
| Consent model (all requested fields) | Pass | `SosConsentSnapshot` — location, audio, video, trusted alert, emergency call assist, legal timestamp |
| SOS Plus profile UI | Pass | `SosPlusProfileScreen` + route `SosPlusProfile` in `App.tsx` / `routes.ts` |
| Price shown (€4.99 positioning) | Pass | Uses existing `sos.priceEuroUi` when Plus preview active |
| Session/event types | Pass | `src/domain/sos/sosSessionModels.ts` + `createSosSessionDraft` |
| No fake live call | Pass | No new `Linking`/`tel:` from profile screen; copy forbids auto-dispatch claims |
| No recording implementation | Pass | Toggles are consent **preferences** only |
| No Stripe | Pass | No new checkout or SKU wiring |
| DB/API | **Not touched** | No `prisma/`, no new API routes in this wave |
| Docs | Pass | `docs/product/VIONA_SOS_PLUS_PRODUCTION_ROADMAP.md`, this audit |

## Files added / materially changed

| Path | Role |
|------|------|
| `src/domain/sos/sosPlusModels.ts` | Entitlement + consent + trusted contact types |
| `src/domain/sos/sosSessionModels.ts` | Session record + draft factory |
| `src/services/sos/sosPlusLocalStore.ts` | AsyncStorage persistence v1 |
| `src/config/sosPlusProduction.ts` | `SOS_PLUS_PROFILE_UI_ENABLED` |
| `src/screens/sos/SosPlusProfileScreen.tsx` | Profile & consent UI |
| `src/components/viona/VionaSosPlusInfoModal.tsx` | CTA → profile |
| `src/screens/HomeScreen.tsx`, `LoginScreen.tsx`, `src/screens/b2c/SOSModal.tsx` | Navigation wiring |
| `App.tsx`, `src/navigation/routes.ts` | Stack registration |
| `src/i18n/locales/en.json`, `vi.json` | `sosPlus.*` strings |
| `docs/product/VIONA_SOS_PLUS_PRODUCTION_ROADMAP.md` | Roadmap |
| `docs/audit/VIONA_AF_SOS_PLUS_ENTITLEMENT_CONSENT_AUDIT.md` | This file |

## Residual risk

- **Local-only consent** can diverge across devices — server reconciliation required before enforcement.  
- **Simulate SOS Plus** must remain visually distinct from paid state until Stripe entitlements exist.  
- **Trusted contacts** stored as plaintext on device — migrate to encrypted container before pilot scale-up.

## Sign-off targets (future)

- [ ] Replace `local_stub` with signed entitlement payload.  
- [ ] Wire `SosSessionRecord` to privacy-preserving analytics + audit sink.  
- [ ] Legal-approved strings for each market before widening audience (global Vietnamese positioning; local emergency numbers only after a verified routing matrix).

---

**Canonical path:** `docs/audit/VIONA_AF_SOS_PLUS_ENTITLEMENT_CONSENT_AUDIT.md`
