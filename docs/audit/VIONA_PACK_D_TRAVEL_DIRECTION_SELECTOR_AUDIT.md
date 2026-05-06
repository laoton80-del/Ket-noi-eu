# VIONA Pack D Travel Direction Selector Audit

## 1. Summary

- **Three travel directions** are modeled in `src/core/travel/travelDirectionTypes.ts` + `travelDirectionRegistry.ts` and surfaced as **three selectable cards** at the **top of `TravelScreen`** (the real Travel hub UI; `TravelHubScreen` remains a thin wrapper).
- **Why it matters:** Universe Travel previously mixed outbound premium tiles, inbound hints, and diaspora needs without an explicit “who am I on this trip?” lens — creating GTM confusion and fulfillment-risk misreads. Pack D makes the **three CEO directions** explicit while staying **Lite / Pilot / Coming soon** in copy.
- **Selection behavior:** Tapping a card sets **local React state only** (`travelDirectionId` on `TravelScreen`). No navigation change, no API, no booking/payment, no provider dispatch.

## 2. Current travel gaps (pre-Pack D)

| File / area | Previous concept | Gap vs 3-direction model | Risk | Recommendation |
|-------------|------------------|---------------------------|------|------------------|
| `TravelScreen.tsx` | Single “VIONA Travel” hub: map hero, flights, cravings, translator, premium bento | No explicit VN→world / world→VN / diaspora homecoming lens | Users assume production fulfillment | **Pack D:** direction strip + honest status pills; keep existing CTAs unchanged. |
| `TravelHubScreen.tsx` | Delegates to `TravelScreen` | None | Low | No logic change. |
| `travelHub` i18n | “Premium travel tools”, chauffeur, fast track, eSIM, etc. | Premium mix without direction context | Over-claim | Copy in new block stresses **no fulfillment**; existing hub strings unchanged. |
| `runUltraMasterBookingWithAlerts` / merchants | Demo / navigate flows | Not direction-aware | Booking-adjacent | **Not modified** in Pack D. |

**Hardcoded Prague/Berlin/CZ/DE:** Not introduced in Pack D; destination examples remain generic (`travelHub.destinationExamples`).

## 3. Direction model

| Direction | User | Purpose | Card `status` | Example `recommendedActions` (registry) |
|-----------|------|---------|-----------------|----------------------------------------|
| `vietnameseAbroad` | Người Việt đi nước ngoài | Language, safety, bureaucracy cues outbound | `lite` | Translate, AI demo, checklist, SOS, local discovery |
| `inboundVietnam` | Người nước ngoài đến VN | Guide, fixer pilot, airport/SIM sheet soon | `pilot` | Guide, fixer (manual ops), airport/SIM coming soon, translation, experiences |
| `returnVietnam` | Kiều bào về VN | Family, paperwork, soft landing | `lite` | Family, paperwork, concierge lite pilot, local discovery, translation |

Each action row carries its own **item** status (`lite` / `pilot` / `comingSoon`) for micro-labeling.

## 4. UI behavior

| Question | Answer |
|----------|--------|
| Where does the selector appear? | First block inside the main `ScrollView` on **`TravelScreen`** (after location consent gate). |
| What does selecting do? | Updates `travelDirectionId` in component state only. |
| Navigation? | **Unchanged** — no new routes, no `navigate` from selector. |
| API / payment / provider? | **None** — no network, no wallet, no booking mutations. |
| Smart Trio? | `TravelDirectionSelector` reads `useSmartTrio()` for a **one-line context hint** (`market` + `native` labels); does **not** call `changeLanguage`. |

## 5. Safety

| Check | Result |
|--------|--------|
| payment touched? | **no** |
| booking touched? | **no** |
| wallet touched? | **no** |
| DB / Prisma touched? | **no** |
| AI production touched? | **no** |
| provider fulfillment touched? | **no** |
| route names changed? | **no** |
| feature flags changed? | **no** |

## 6. Validation

| Command | Result |
|---------|--------|
| `npm run typecheck` | OK |
| `npm run ci:expo-readiness` | PASS |
| `npm run lint` | Exit 0 (0 errors) |
| `npm run ci:release-discipline` | OK |

## 7. Next pack recommendation

- **Pack E:** Local commerce booking clarity (pricing, fulfillment states, merchant truth).
- **Travel Lite fulfillment readiness:** wire direction lens to gated feature modules when product signs off.
- **Provider / manual ops:** playbooks for fixer pilot — still no fake automation.
