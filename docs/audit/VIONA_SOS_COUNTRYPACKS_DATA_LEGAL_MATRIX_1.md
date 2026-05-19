# VIONA.SOS.COUNTRYPACKS.DATA_LEGAL_MATRIX.1

**Document ID:** `VIONA.SOS.COUNTRYPACKS.DATA_LEGAL_MATRIX.1`  
**Type:** Data / legal readiness matrix for SOS `countryPacks` emergency numbers (planning only)  
**Branch:** `pack-af30-sos-countrypacks-data-legal-matrix`  
**Base master:** `2675994` — `fix(copy): merge sos routing safety disclaimers`  
**Prior audits:** [SOS Country Emergency Routing Matrix](./VIONA_SOS_COUNTRY_EMERGENCY_ROUTING_MATRIX_AUDIT_1.md), [SOS Emergency Screen Copy](./VIONA_SOS_EMERGENCY_SCREEN_COPY_AUDIT_1.md), [Global Active/Full lock](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md)  
**Copy pack merged:** `VIONA.SOS.ROUTING.COPY_DISCLAIMER.MERGE.1` (`2675994`) — advisory `emergencySos.numberDisclaimer`, LeTan 112 removed  
**Date:** 2026-05-19  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md) §10.5 / §2.13, [Global Active/Full lock](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md).

**Method:** Full read of `src/config/countryPacks/*`, `EmergencySOSScreen`, `TravelSosHubScreen`, `EmergencySosService`, `emergencyPhrasePacks`, `resolveCountryPack` call sites. **No web-sourced number verification** in this pack — all regulatory claims marked **requires official-source verification**. **No app source changes.**

---

## Summary

| Item | Result |
|------|--------|
| **Overall data/legal readiness** | **Not ready for “verified country routing”** — Only **9 ISO rows + `ZZ` sentinel** exist; almost all EU rows share one **`112`** constant with **no documented official source** in-repo. **Copy layer** is now advisory (post `pack-af29`). **Data layer** should not change until Trust & Safety + legal/ops sign-off. |
| **Highest-risk countries/groups** | **UK/GB** (pack `112` vs TTS `999`); **`ZZ` global unlisted** (`112` for US/Asia/Africa travelers); **VN** (`115` primary, `113`/`114` fallbacks unused); **profile vs GPS** mismatch (`EmergencySOSScreen` vs `TravelSosHub`). |
| **Should `countryPacks` change now?** | **No** — changing digits without verified source-of-truth and sign-off would increase liability while copy already frames numbers as guidance. |
| **Recommended next pack** | **`VIONA.SOS.COUNTRYPACKS.DATA_VERIFY.1`** — data-only PR after legal/ops fills verification column; **do not** enable live GPS routing or drop disclaimers in same PR. |

**Core finding:** `emergencyConfig` in `packs.ts` is the **only** runtime source for PSTN digits on `EmergencySOSScreen`. It is **profile-based** (`user?.country`), **not** device location. `fallbackNumbers` is **schema-only** today (never read in dial UI).

---

## Current countryPacks inventory

**Source of truth in code:** `src/config/countryPacks/packs.ts` → `emergencyConfig.{ primaryNumber, fallbackNumbers }`.  
**Resolution:** `resolveCountryPack(countryCode?)` in `src/config/countryPacks/index.ts` — empty/invalid → `ZZ`; unknown ISO2 → `ZZ`; known key → row.

| Code | Label (product) | primaryNumber | fallbackNumbers | Source in code | Police / fire / medical split | Confidence | Notes |
|------|-----------------|---------------|-----------------|----------------|------------------------------|------------|-------|
| **CZ** | Czech Republic | `112` | `['112']` | `EU_EMERGENCY` | Not modeled | **Low** | EU universal comment only; **requires official-source verification** (CZ integrated 112). |
| **SK** | Slovakia | `112` | `['112']` | `EU_EMERGENCY` | Not modeled | **Low** | Same. |
| **PL** | Poland | `112` | `['112']` | `EU_EMERGENCY` | Not modeled | **Low** | Same. |
| **DE** | Germany | `112` | `['112']` | `EU_EMERGENCY` | Not modeled | **Low** | Same. |
| **FR** | France | `112` | `['112']` | `EU_EMERGENCY` | Not modeled | **Low** | Same. |
| **UK** | United Kingdom (non-ISO alias) | `112` | `['112']` | `EU_EMERGENCY` | Not modeled | **Low** | **112 works in UK** but primary public emergency is often cited as **999** — **requires official-source verification** before presenting as sole digit. |
| **GB** | Great Britain | `112` | `['112']` | `EU_EMERGENCY` | Not modeled | **Low** | Duplicate row vs `UK`; same risk. |
| **CH** | Switzerland | `112` | `['112']` | `EU_EMERGENCY` | Not modeled | **Low** | CH also has service-specific numbers (e.g. 117/118/144) — **requires official-source verification**. |
| **VN** | Vietnam | `115` | `['113', '114']` | VN-specific object | `113` police / `114` fire implied by fallbacks only | **Low** | **Requires official-source verification**; fallbacks **not exposed** in UI. |
| **ZZ** | Global unlisted sentinel | `112` | `['112']` | `GLOBAL_UNLISTED_COUNTRY_PACK` | Not modeled | **Low** | Used for empty profile + any ISO not in table (e.g. **US, JP, AU**). **112 is not universal.** |
| **CZ*** | `DEFAULT_COUNTRY_PACK` | `112` | `['112']` | Same as CZ row | Not modeled | **Low** | Explicit Czech pack for callers needing `CZ`; **not** used when profile empty (uses `ZZ`). |

\* `DEFAULT_COUNTRY_PACK` mirrors CZ pricing/locale defaults; emergency config identical to `EU_EMERGENCY`.

**Not in `COUNTRY_PACKS` but referenced elsewhere:**

| Code | Where referenced | Pack digit if user profile set | Notes |
|------|------------------|--------------------------------|-------|
| **AT** | `EmergencySosService` TTS scripts only | Would be `ZZ` → `112` unless profile maps to DE pack | TTS has AT copy; **no AT pack row**. |
| **US, CA, AU, JP, KR, …** | Any user with ISO not listed | `ZZ` → `112` | **High gap** for global Active/Full vision. |

---

## Consistency issues

| Issue | File(s) | Current value | Conflicting value | Risk | Recommended action |
|-------|---------|---------------|-------------------|------|-------------------|
| UK/GB pack vs travel TTS | `packs.ts` vs `EmergencySosService.ts` | Dial: `112` (via `GB`/`UK` pack) | GB medical VI line: **“Please call 999”** | **P1** | Data-verify pack: align pack **or** TTS after official-source check; until then keep advisory copy only. |
| Profile country vs GPS host | `EmergencySOSScreen.tsx` vs `TravelSosHubScreen.tsx` | Dial number: `resolveCountryPack(user?.country)` | TTS scripts: `getTravelContext()` → `countryCode` | **P1** | Behavior pack **after** legal sign-off: single policy (profile vs device vs user-selected SOS Plus country). |
| SOS Plus country unused for dial | `SosPlusProfileScreen` / `sosPlusLocalStore` vs `EmergencySOSScreen` | `emergencyCountryIso2` on device | Dial uses `user?.country` from auth only | **P2** | Product decision: wire dial to SOS Plus country **or** document that Plus country is future-only. |
| `fallbackNumbers` unused | `types.ts`, `packs.ts`, `EmergencySOSScreen.tsx` | VN: `113`, `114` | UI shows only `primaryNumber` `115` | **P2** | Either surface multi-service UI with legal review **or** remove unused fallbacks from schema until used. |
| `general112` type id + phrase titles | `emergencyPhrasePacks.ts`, `EmergencyActionCard.tsx` | Locale: “Guidance · local emergency number” | EN phrase table titles still say **“112 Emergency”** etc. | **P2** | Copy-only hygiene: de-emphasize `112` in phrase **titles** (not behavior). |
| `ZZ` → `112` for rest of world | `packs.ts` | Unknown country shows `112` | US **911**, etc. | **P1** | Unknown-country policy: **no primary digit** or explicit “call local number” UX after legal sign-off. |
| Stale `sosAITriage` comment | `sosAITriage.ts` | References `SOSModal` dial buffer | `SOSModal` has **no** `tel:` | **P3** | Doc/hygiene only. |
| LeTan intent regex still matches `112` | `LeTanScreen.tsx` | Regex includes `112` | User-facing text fixed | **OK** | Intent detection only; not user advice. |

---

## Legal / ops readiness matrix

| Country / group | Current state | Verified by official source | Legal/ops confidence | Launch gate (recommended) | Required sign-off | User-facing framing (now) |
|-----------------|---------------|----------------------------|----------------------|---------------------------|-------------------|----------------------------|
| EU pack rows (CZ, SK, PL, DE, FR, CH) | `112` primary | **Unknown** (not in repo) | **Low** | **Profile-based advisory** only | Trust & Safety + regional ops | `emergencySos.numberDisclaimer` + confirm-before-dial |
| UK / GB | `112` primary | **Unknown** | **Low** | **Profile-based advisory**; **block “verified UK number”** | Legal + UK ops | Same; **do not** claim 999 or 112 as authoritative |
| VN | `115` + fallbacks in data | **Unknown** | **Low** | **Profile-based advisory** | VN ops / legal | Same; fallbacks not shown |
| Global unlisted (`ZZ`) | `112` | **Unknown** | **Low** | **Profile-based advisory**; treat as **weakest** | Global product + legal | Disclaimer mentions unknown country + common number |
| US / CA / AU / JP / KR / … (no row) | Falls through to `ZZ` | N/A | **None** | **Copy-only advisory**; **no digit marketing** | Market owners | “Call local emergency number directly” |
| Travel embassy demo | Mission phone book | Demo disclaimer in UI | **Low** (demo) | **Demo badge** only | Ops | `travelSosHub.embassyCallConfirmBody` |
| Future: live GPS routing | Not implemented | N/A | **None** | **Live routing disabled** until matrix row exists per country | Legal + engineering | N/A |

**Safe launch gates (definitions):**

1. **Copy-only advisory** — Current state after `pack-af29`; no authoritative routing claims.  
2. **Profile-based advisory** — Show `primaryNumber` from profile pack with disclaimers; confirm-before-dial.  
3. **Verified country routing** — Pack digits match signed official-source sheet; UI may still use disclaimers.  
4. **Live routing disabled** — No auto-select from GPS/IP without per-country verified matrix + consent policy.

---

## Data governance proposal

### Source-of-truth policy (recommended)

| Layer | Owner | Content |
|-------|--------|---------|
| **Legal/emergency number sheet** | Trust & Safety + Legal (external spreadsheet or doc, **not** guessed in code) | Per ISO: primary emergency, optional police/fire/ambulance, notes, official source URL/citation, last-reviewed date |
| **Code mirror** | Engineering | `countryPacks/packs.ts` updated **only** from signed sheet rows |
| **UI copy** | Product + i18n | Disclaimers remain even when data is “verified” until legal approves reduction |

### Review cadence

- **Quarterly** review for listed launch markets.  
- **Ad hoc** review within 30 days of any national emergency-number reform reported by ops/legal.  
- **Pre-expansion** review before adding a new ISO row to `COUNTRY_PACKS`.

### Approval owner

- **Trust & Safety Lead** (product/UX) — owns SOS integrity claims.  
- **Compliance & Privacy Owner** — owns liability framing.  
- **Regional ops** — signs off market-specific digits (VN, UK, EU, etc.).  
- **Principal Architect / Core Platform** — approves schema changes (`fallbackNumbers`, multi-number UI).

### Fallback policy

| Scenario | Recommended handling |
|----------|----------------------|
| `fallbackNumbers` in schema | Do not dial automatically; if surfaced later, each number needs sheet row + disclaimer |
| Unknown ISO / empty profile (`ZZ`) | **Do not** imply 112 is correct; prefer copy-only “call local emergency number” **or** omit digit until country known |
| Traveler abroad | **Do not** switch digit from GPS until policy + verification exist; copy already warns profile vs location |

### Unknown-country policy

1. **Short term (current):** Keep `ZZ` → `112` in data **but** UI copy states guidance-only (done).  
2. **Medium term (data pack):** Consider `primaryNumber: ''` or sentinel `'LOCAL'` with UI that **never** opens `tel:` without user-entered number — **requires behavior + legal sign-off**.  
3. **Long term:** Expand `COUNTRY_PACKS` with verified rows for tier-1 launch markets before marketing global SOS.

### Future behavior requirements (non-negotiable)

| Requirement | Current status |
|-------------|----------------|
| Confirm-before-dial | **Yes** — `EmergencySOSScreen` `Alert.alert` before `Linking.openURL('tel:…')` |
| No auto-dial | **Yes** — `SOSModal` (tabs) has no `tel:` |
| No auto-dispatch | **Yes** — copy + no backend dispatch |
| No auto authority contact | **Yes** |
| No auto location share to authorities | **Yes** — location on-device reference only |
| User in control | **Yes** — user confirms dialer open |

Any future GPS-based routing must **not** weaken the above without explicit legal review.

---

## Future pack recommendations

| Priority | Pack ID | Target files | Type | Required sign-off | Do-not-touch |
|----------|---------|--------------|------|-------------------|--------------|
| **P0** | `VIONA.SOS.COUNTRYPACKS.DATA_VERIFY.1` | `docs/` sheet import → `packs.ts` only | **Data-only** | Legal + regional ops per changed ISO | `tel:` logic, GPS, Twilio, routes |
| **P1** | `VIONA.SOS.COUNTRYPACKS.UK_GB_ALIGN.1` | `packs.ts` (GB/UK), `EmergencySosService.ts` (999 line) | **Data + copy in TTS** | UK official-source verification | Auto-dial |
| **P1** | `VIONA.SOS.COUNTRYPACKS.ZZ_POLICY.1` | `packs.ts`, optional `EmergencySOSScreen` | **Data + minimal UI** | Global legal | Removing confirm-before-dial |
| **P2** | `VIONA.SOS.COUNTRYPACKS.VN_MULTI_NUMBER.1` | `packs.ts`, `EmergencySOSScreen` or hub tiles | **Data + UI** | VN ops | Showing numbers without disclaimer |
| **P2** | `VIONA.SOS.COUNTRYPACKS.EXPAND_ISO.1` | `packs.ts` (+ tests) | **Data-only** | Per-country ops | Broad behavior refactor |
| **P3** | `VIONA.SOS.PHRASE_TITLE_112_HYGIENE.1` | `emergencyPhrasePacks.ts` | **Copy-only** | Trust & Safety | Routing logic |
| **P3** | `VIONA.SOS.ROUTING.PROFILE_VS_GPS.2` | `EmergencySOSScreen`, `TravelSosHub`, auth/SOS Plus | **Behavior** | Legal + product | Until data matrix filled |
| **P3** | `VIONA.SOS.AITRIAGE_DOC_HYGIENE.1` | `sosAITriage.ts` | **Docs** | Engineering | PSTN |

**Explicitly deferred until matrix + sign-off:**

- Live GPS / IP country for `primaryNumber` selection  
- Auto-dial or shortened confirm  
- Presenting `fallbackNumbers` without multi-service legal copy  
- Removing `emergencySos.numberDisclaimer` or diluting “guidance only” language

---

## Runtime wiring reference (for data pack authors)

| Consumer | Input for emergency digit | Notes |
|----------|---------------------------|-------|
| `EmergencySOSScreen` | `user?.country` → `resolveCountryPack` → `primaryNumber` | Sole in-app PSTN digit path |
| `emergencyPhrasePacks` | `country` arg (profile) → language + templates | Titles mention “112” in EN table |
| `TravelSosHub` TTS | `getTravelContext().countryCode` | Does **not** change dial digit on `EmergencySOSScreen` |
| `SosPlusProfile` | `emergencyCountryIso2` (local) | **Not** wired to dial today |
| `b2c/SOSModal` | None | Routing alert only |

---

## Validation (this pack)

- `npm run typecheck` — pass (no source changes)  
- `npm run lint` — pass (0 errors)  
- `npm run smoke` — pass  
- **App logic:** unchanged  
- **`countryPacks/packs.ts`:** unchanged  

---

## Related documents

- [VIONA_SOS_COUNTRY_EMERGENCY_ROUTING_MATRIX_AUDIT_1.md](./VIONA_SOS_COUNTRY_EMERGENCY_ROUTING_MATRIX_AUDIT_1.md)  
- [VIONA_SOS_EMERGENCY_SCREEN_COPY_AUDIT_1.md](./VIONA_SOS_EMERGENCY_SCREEN_COPY_AUDIT_1.md)  
- [VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md)
