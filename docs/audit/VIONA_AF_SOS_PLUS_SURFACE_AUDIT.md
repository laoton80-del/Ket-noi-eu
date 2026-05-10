# Audit: AF.SOS.1 — SOS Plus product surface & safety gate

**Wave:** AF.SOS.1  
**Scope:** UI + i18n + documentation only — Hub / LifeOS / SOS Lifeline positioning for **Vietnamese users worldwide** (global safety layer; not Europe-only unless a market filter is active).  
**Risk class:** Legal + safety + trust copy (no money movement in this wave).

## Intent verification

| Requirement | Evidence |
|-------------|----------|
| Serious emergency red (not “nightclub” hype) | Hold gate + Plus modal use controlled `sosNeon` accents on dark surfaces; calm typography |
| SOS Basic discoverable; SOS Plus gated/pilot positioning | Basic remains default path; Plus labeled **Pilot / gated** with €4.99/month **positioning only** |
| Hold ~3 seconds | `VionaSosHoldButton` default 3000ms; `components/emergency/SOSModal` `HOLD_DURATION_MS = 3000` |
| Pre-login SOS entry | `LoginScreen` opens `VionaSosHoldGateModal` `variant="preLogin"` — no `triggerSafetyAssist`, no stack navigation |
| No fake dispatch | Copy: gateSub, disclaimerNotReplacement, disclaimerUiOnly; Plus features tagged Planned/Pilot/Future |
| EN + VI strings | `src/i18n/locales/en.json`, `vi.json` under `sos.*` |
| Local UI flag | `SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED` in `src/config/sosPlusSurface.ts` |
| Product spec updated | `docs/product/VIONA_SOS_PLUS_PRODUCT_SPEC.md` |

## Files touched (implementation)

| Path | Role |
|------|------|
| `src/config/sosPlusSurface.ts` | UI feature gate constant |
| `src/components/viona/VionaSosHoldGateModal.tsx` | Plus strip, preLogin variant, learn-more CTA |
| `src/components/viona/VionaSosHoldButton.tsx` | Optional `helperText` for pre-login hold copy |
| `src/components/viona/VionaSosPlusInfoModal.tsx` | Basic vs Plus + planned capabilities + disclaimers |
| `src/components/viona/index.ts` | Barrel exports |
| `src/screens/HomeScreen.tsx` | Plus info modal state + gate `onOpenPlusInfo` |
| `src/screens/LoginScreen.tsx` | Pre-login gate + Plus modal (replaces Alert-only stub) |
| `src/screens/b2c/SOSModal.tsx` | “About SOS Plus” link + stacked info modal |
| `src/components/emergency/SOSModal.tsx` | 3s hold + i18n keys (`sos.legacy*`) |
| `src/i18n/locales/en.json`, `vi.json` | Expanded `sos` namespace |

## Explicit exclusions verified

| Excluded | Confirmed |
|----------|-----------|
| Stripe / subscription billing | Not added |
| Twilio / new telecom | Not added |
| Voice activation / background recording | Copy only — “not live listening today” |
| DB / Prisma / API / Auth changes | Not in file list above |
| AI provider calls for SOS Plus | Not added |

## Residual risk / next waves

- Regional emergency-number accuracy and maintenance process.
- DPIA / consent UX for any future recording or location sharing beyond today’s sheets.
- Entitlement enforcement when/if SOS Plus becomes a billable SKU.

## Sign-off prerequisites (future)

- [ ] Legal review of liability copy per market (global Vietnamese diaspora + host countries; Europe-only wording only when justified by an explicit market filter).
- [ ] Operational truth for any “dispatch” or “alert” claims before removing Pilot labels.

---

**Canonical audit path:** `docs/audit/VIONA_AF_SOS_PLUS_SURFACE_AUDIT.md`
