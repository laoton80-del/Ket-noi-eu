# VIONA.WAVE_3B.TRAVEL_AIRPORT_FLIGHT_SEARCH_AND_3_PERSPECTIVE_SERVICE_MATRIX_AUDIT.1

**Date:** 2026-05-30  
**Scope:** Read-only audit of `TravelScreen.tsx`, routes, scenario handlers, i18n, perspective registry, `FlightSearchScreen`.  
**No code changes in this wave.**

---

## 1. Audit result: existing Sân bay / flight search state

### Routing
| Layer | State |
|-------|--------|
| **Sân bay handler** | `travelScenarios` entry `id: 'airport'` → `navigation.navigate('TravelFlightSearch')` |
| **Route** | `TravelFlightSearch` declared in `routes.ts`, registered in `App.tsx` as `FlightSearchScreenGated` |
| **Screen** | `src/screens/b2c/travel/FlightSearchScreen.tsx` |
| **Data** | `FlightApiService.searchFlights()` — **deterministic mock**; comments reference future Duffel/Skyscanner affiliate |
| **Gate** | `travelLiteEnabled` + nested `liveStripePaymentEnabled` MVP gate |

### Where Sân bay appears
1. **Flagship row** (top 4): `airport` — primary visual entry under “TRỢ GIÚP NHANH”
2. **Utility grid**: `airport` also listed in `TRAVEL_UTILITY_IDS` (reordered by perspective, never removed)

### What the flight screen actually does
- Form: origin, destination, dates, passengers → “Tìm chuyến bay”
- Results: mock offers with **“Đặt Vé Ngay”** → Alert: *“Đã ghi nhận yêu cầu đặt vé (demo)”* + affiliate integration note
- Homestay cross-sell after search (merchant browse, not confirmed booking)
- **Not production OTA** — mock + demo acknowledgment

### Perspective behavior (confirmed correct)
- Default: `travelPerspectiveMode = 'overview'`
- Perspective cards toggle `overview | vietnameseAbroad | inboundVietnam | returnVietnam`
- **No gate** — all utility tiles remain; `orderTravelUtilityIds()` reorders only
- Flagship row unchanged by perspective (always airport, translation, taxi, emergency)

---

## 2. Does “Tìm vé máy bay rẻ” exist?

**No — not as visible Travel Hub copy today.**

| Location | Current copy | “Tìm vé máy bay rẻ” |
|----------|--------------|---------------------|
| Flagship Sân bay title | `Sân bay` | ❌ |
| Flagship Sân bay subtitle | `Check-in, an ninh, hành lý` | ❌ |
| Flagship badge | `Xem trước` (Preview) | ❌ |
| i18n `travelHub.flightTitle` | `Đặt vé máy bay` | ❌ not wired to UI |
| i18n `travelHub.flightSub` | `So sánh giá · tích hợp sắp tới` | ❌ not wired to UI |
| FlightSearchScreen header | `✈️ Vé máy bay` / widget `Tìm chuyến` | Partial — only **after** navigation |

**Conclusion:** Flight search is **reachable** via Sân bay but **not labeled** as cheap-flight search on the hub. Users see airport ops copy, not flight-deal intent.

---

## 3. Preview vs real booking?

| Signal | Assessment |
|--------|------------|
| Hub badge on Sân bay | **Preview** (`travelHub.tileBadge.preview`) |
| Pilot strip | “Không thanh toán trong app” |
| FlightSearchScreen | Mock API; “Đặt Vé Ngay” triggers **demo alert**, not payment |
| MVP gate | Live payment flag off message path exists |
| **Risk** | Flight screen CTA **“Đặt Vé Ngay”** overclaims vs hub Preview labeling — screen-level drift (out of scope to fix this wave) |

**Hub-level:** Correctly preview/demo. **Screen-level:** Wording implies booking; mitigated by demo alert only.

---

## 4. Proposed safest UI placement for flight search

### Recommended hub labeling (copy-only follow-up)
Keep **one tap** on flagship Sân bay → `TravelFlightSearch`. Do **not** add a second route.

**Flagship Sân bay card (safest):**
- **Title:** `Sân bay` (keep — broad airport lens)
- **Subtitle:** `Tìm vé máy bay rẻ · xem trước · check-in & hành lý`  
  Or split: line1 flight preview, line2 airport ops (Lite)
- **Badge:** keep `Xem trước` (not Lite/Demo — avoids implying live OTA)

**Inside `TravelFlightSearch` (future wave, not this audit):**
- Rename CTA `Đặt Vé Ngay` → `Xem trước giá (demo)` or `Ghi nhận quan tâm (demo)`
- Header kicker already says Travel Lite — good

### Sân bay service bundle (product IA — not all separate routes yet)

| Capability | Safest status | Current home |
|------------|---------------|--------------|
| Tìm vé máy bay rẻ / xem trước | **Preview** | `TravelFlightSearch` (hidden label) |
| Check-in | **Lite** (info) | Subtitle mention only |
| Hành lý | **Lite** | Subtitle mention only |
| An ninh sân bay | **Lite** | Subtitle mention only |
| Delay / terminal / gate | **Coming soon** | Not represented |
| Di chuyển từ sân bay | **Demo** | `taxi` + `transit` → Leona |
| Phiên dịch sân bay | **Lite** | `translation` flagship + utility |
| Khẩn cấp sân bay | **Lite** (SOS info) | `emergency` flagship → `EmergencySOS` |

**Do not** fold all eight into one mega-screen without Lite/Preview labels.

---

## 5. Three-perspective service matrix

Legend: ✅ exists · 🟡 partial · ❌ missing · 🔒 gated/coming soon

### A. Người Việt đi du lịch nước ngoài (`vietnameseAbroad`)

| Priority (recommended) | Feature | Status | Handler / notes |
|------------------------|---------|--------|-----------------|
| 1 | Sân bay + vé rẻ xem trước | 🟡 | `TravelFlightSearch` — relabel needed |
| 2 | Di chuyển | ✅ Demo | taxi/transit → `LeonaCall` |
| 3 | Chỗ nghỉ | ✅ Preview | `TravelHospitality` — no confirmed booking |
| 4 | Phiên dịch | ✅ Lite | `LiveInterpreter` |
| 5 | Bệnh viện & thuốc | ✅ Pilot | `LiveInterpreter` doctor |
| 6 | Khẩn cấp & cảnh sát | ✅ Lite | `EmergencySOS` |
| 7 | Đại sứ quán / giấy tờ | 🟡 | Perspective action “checklist” (Lite text only); `TravelSosHub`/embassy copy exists elsewhere, **not linked from Travel hub** |
| 8 | Local support | ✅ Pilot | `LocalFixer` panel |

**Current utility order when selected:** airport → taxi → transit → hotel → hospital → translation → restaurant → shopping ✅ aligned

**Perspective card actions (registry):** translate, aiCallDemo, checklist, sos, localServices — informational only on card

---

### B. Người nước ngoài đến Việt Nam (`inboundVietnam`)

| Priority (recommended) | Feature | Status | Handler / notes |
|------------------------|---------|--------|-----------------|
| 1 | Arrival to Vietnam | 🟡 | No dedicated arrival card; spread across restaurant/taxi/translation |
| 2 | Visa / entry / SIM / money | ❌ | Not on Travel hub — **Coming soon / Lite guide** candidate |
| 3 | Transport | ✅ Demo | taxi/transit |
| 4 | Restaurants | ✅ Pilot | cravings modal |
| 5 | Culture tips | ❌ | **Lite guide** — perspective `guide` action text only |
| 6 | Interpreter | ✅ Lite | translation |
| 7 | Hospital / pharmacy | ✅ Pilot | hospital |
| 8 | Emergency | ✅ | emergency flagship (utility grid has no emergency pill — **gap**: only top row) |
| 9 | Local Vietnamese support | ✅ Pilot | `LocalFixer` |

**Current utility order:** restaurant → taxi → transit → translation → shopping → airport → hotel → hospital

**Registry:** `airportSim` = **Coming soon** — matches visa/SIM/arrival gap

---

### C. Kiều bào về Việt Nam (`returnVietnam`)

| Priority (recommended) | Feature | Status | Handler / notes |
|------------------------|---------|--------|-----------------|
| 1 | Flight home | 🟡 | Same `TravelFlightSearch` — not labeled “về nước” |
| 2 | Documents / family paperwork | 🟡 | Registry `paperwork` Lite — no hub tile |
| 3 | Airport arrival | 🟡 | Sân bay card (generic) |
| 4 | Transport | ✅ Demo | taxi/transit |
| 5 | Local support | ✅ Pilot | LocalFixer |
| 6 | Family / local services | 🟡 | Registry `family` Lite — no dedicated tile |
| 7 | Health | ✅ Pilot | hospital |
| 8 | Legal/property light | ❌ | **Lite info** — not on hub |
| 9 | Language for family | ✅ Lite | translation |

**Current utility order:** restaurant → hotel → taxi → transit → translation → hospital → airport → shopping

---

## 6. Missing features → add as Lite / Demo / Pilot / Preview / Coming soon

| Feature | Label | Suggested surface |
|---------|-------|-------------------|
| Tìm vé máy bay rẻ (visible) | **Preview** | Sân bay subtitle + optional utility sublabel |
| Delay / terminal / gate | **Coming soon** | Sân bay hub sub-bullet or future airport hub screen section |
| Visa / entry / SIM / money (inbound) | **Coming soon** | Inbound perspective highlights + future “Arrival” Lite card |
| Đại sứ quán / giấy tờ (VN abroad) | **Lite** | Link from perspective actions or new utility **Preview** → info sheet (not dispatch) |
| Documents / family paperwork (return) | **Lite** | Return perspective + checklist module |
| Culture tips (inbound) | **Lite** | Perspective `guide` → Academy/Travel info (no booking) |
| Legal/property light (return) | **Lite** | Return perspective only until module exists |
| Airport SIM/taxi safe (inbound) | **Coming soon** | Already in registry as `airportSim` |
| Emergency in utility grid | **Lite** | Consider duplicate emergency pill when inbound/return selected (highlight only) — optional UX, not required |

**Do not add:** live OTA checkout, taxi dispatch, fixer guarantee, SOS dispatch, hotel payment.

---

## 7. Safety drift report

| Check | Result |
|-------|--------|
| Routes/handlers changed this audit | **No** |
| Fake production booking on hub | **No** — Preview badge on Sân bay |
| Flight screen overclaim | **⚠️** — “Đặt Vé Ngay” (screen not in allowed edit set this wave) |
| Hotel/taxi/emergency handlers | Unchanged; subtitles state demo/no dispatch where applicable |
| Perspective gating | **None** — reorder only ✅ |
| Perspective lite notice | Present: “Không đặt dịch vụ, không thu phí” ✅ |

---

## 8. Code change recommendation

**YES — small copy-only follow-up (next wave), not this audit commit.**

Minimal safe diff (suggested):
1. `vi.json` (+ en parity): update `travelHub.scenario.airport.sub` to include `Tìm vé máy bay rẻ · xem trước` + keep check-in/luggage Lite scope
2. Optionally wire dormant `flightTitle`/`flightSub` into a second line on flagship Sân bay only
3. **Do not** change `onPress` or routes
4. **Do not** edit `FlightSearchScreen` in a hub-only wave (separate screen safety pass for “Đặt Vé Ngay”)

This audit wave: **no code changes.**

---

## 9. Gate results (audit-only)

| Gate | Result |
|------|--------|
| Typecheck / lint / smoke | **Not run** — no code diff |
| Expected if copy follow-up | Should pass with i18n + TravelScreen subtitle only |

---

## 10. Commit / push status

- **Commit status:** NOT COMMITTED  
- **Push status:** NOT PUSHED
