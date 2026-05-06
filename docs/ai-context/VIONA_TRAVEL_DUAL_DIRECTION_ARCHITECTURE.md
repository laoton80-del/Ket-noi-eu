# VIONA Travel Dual-Direction Architecture

> **Loại tài liệu:** Kiến trúc sản phẩm / Universe 3 — bổ sung cho `VIONA_FINAL_MASTER_BLUEPRINT.md`.  
> **Phạm vi:** Chỉ định hướng; **không** thay thế toàn bộ Master Blueprint cho đến khi founder ký merge định nghĩa Universe 3 chính thức.  
> **Nguồn đã đọc:** `docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT.md` (Universe 3), `docs/ai-context/MINI_APP_PLATFORM_ARCHITECTURE.md`, `docs/ai-context/B2B_AI_RECEPTIONIST_FULL_PRODUCTION_ARCHITECTURE.md` (tham chiếu V7/V8). **Không** tìm thấy file blueprint tên riêng “VIGLOBAL V7/V8” trong `docs/` — mọi ràng buộc V7/V8 từ tài liệu B2B coi là **Needs confirmation** nếu áp dụng trực tiếp cho Travel OS.

---

## 1. Strategic Decision

**Travel = AI Travel OS hai chiều (dual-direction), không chỉ “Vietnam inbound”.**

Founder xác nhận Universe 3 phải phục vụ đồng thời:

1. **Người Việt Nam / kiều bào đi du lịch nước ngoài** (outbound từ Việt Nam hoặc từ nước sở tại).
2. **Người ngoại quốc đi du lịch Việt Nam** (inbound — giữ nguyên phạm vi hiện có của blueprint).
3. **Kiều bào về Việt Nam** (return journey — trục “về nhà” với nhu cầu lai giữa outbound mindset và inbound thực tế tại VN).

**Quyết định chiến lược:** Positioning từ “hub inbound-only” → **Travel OS** với **ba hướng hành trình** dùng chung lớp an toàn, dịch, concierge, và merchant/provider — khác biệt chủ yếu ở **ngữ cảnh đích**, **nội dung**, **SOS theo địa phương**, và **cờ tính năng theo thị trường**.

---

## 2. Corrected Universe 3 Definition

### Purpose (đã chỉnh)

**VIONA Travel** là **AI Travel OS** phục vụ **hai chiều + kiều bào về nước**: người Việt và kiều bào **ra thế giới**, người nước ngoài và cộng đồng Việt **vào / qua Việt Nam**, và **hành trình về Việt Nam** với nhu cầu kết nối, an toàn, ngôn ngữ, và dịch vụ địa phương tin cậy.

### Must include (giữ toàn bộ blueprint cũ + mở rộng)

**Giữ nguyên (không được coi là “đã xóa” khi mở rộng):**

- Travel Lite first  
- Safety checklist  
- Translation help  
- Local fixer  
- Cravings Radar  
- Vietnam guide (và nội dung tương đương cho đích khác — **Needs confirmation** tên gọi tập trung: “Destination guide” vs giữ “Vietnam guide” cho inbound only)  
- Airport / SIM / taxi / safety guidance  
- VIP / chauffeur / fast-track / tax refund **chỉ khi** provider/payment/operations thật  

**Bổ sung cho dual-direction:**

- **Outbound hub:** checklist, eSIM/flight discovery patterns, document reminders, “first hours abroad” safety — mức Lite trước, nội dung theo `DestinationConfig` (xem §8).  
- **Return-to-Vietnam hub:** family/documents, arrival chaos reduction, health/transport **disclaimer-first**, kết nối dịch vụ thật khi có pilot.  

### Rules (giữ + bổ sung)

**Giữ từ Master Blueprint:**

- Travel có thể mở sớm dạng Travel Lite.  
- Dịch vụ trả phí premium **không** giả production nếu provider/payment/operations chưa sẵn sàng.  
- Travel **không** thu phí cho fulfillment provider giả / mock.  
- Translation và safety help có thể mở sớm kèm disclaimer.  

**Bổ sung:**

- **Không** marketing Travel như “chỉ cho khách Tây vào VN”; copy và IA phải phản ánh **ba hướng**.  
- SOS và survival layer **theo địa điểm thực của user** (outbound vs inbound vs return) — chi tiết routing **Needs confirmation** theo telemetry/location policy.  
- Một số market hoặc đích có thể **Gated** hoặc **Frozen** cho đến khi có nội dung / partner / pháp lý phù hợp (xem §6).

---

## 3. Travel Directions

Ba hướng chuẩn (dual-direction + return):

| ID | Tên | Mô tả ngắn |
|----|-----|------------|
| **A** | **Vietnamese Outbound** | Người Việt / kiều bào **đi từ VN ra nước ngoài** hoặc **đi từ nước sở tại sang nước thứ ba** — cùng OS: an toàn, dịch, eSIM/flight, checklist, cravings theo đích. |
| **B** | **Inbound Vietnam** | Người nước ngoài / du khách **đến Việt Nam** — giữ toàn bộ định vị inbound hiện có (guide, fixer, SIM/airport, VIP có điều kiện). |
| **C** | **Return to Vietnam** | Kiều bào / Việt kiều **về Việt Nam** (thăm gia đình, relocation ngắn hạn) — trộn nhu cầu outbound (đã quen ecosystem nước ngoài) với inbound thực địa VN (thủ tục, taxi, an toàn đường phố, cầu nối người thật). |

**Needs confirmation:** Có gom “Vietnamese in Vietnam đi nước ngoài” và “Vietnamese abroad đi nước thứ ba” thành một module UX duy nhất `globalOutbound` hay tách persona-level không — đề xuất kỹ thuật: **một module**, phân nhánh theo `originMarket` trong config.

---

## 4. User Personas

| Persona | Hướng chính | Ghi chú sản phẩm |
|---------|-------------|------------------|
| **Vietnamese abroad traveling to another country** | A | Cần survival phrase, SOS destination-aware, eSIM/flight, cultural bridge. |
| **Vietnamese in Vietnam going abroad** | A | Giống trên nhưng onboarding khác (ngôn ngữ app, thanh toán VN, reminder giấy tờ xuất cảnh). |
| **Foreigner traveling to Vietnam** | B | Giữ focus an toàn, translation, fixer, experiences — như blueprint. |
| **Overseas Vietnamese returning to Vietnam** | C | Cần “về nhà” narrative, giấy tờ/hành lý, gia đình, health disclaimer, kết nối dịch vụ thật. |
| **Merchant / provider supporting travelers** | B2B2C qua Travel | Fixer, xe, concierge, homestay — chỉ monetize khi fulfillment thật; merchant dashboard có thể **Pilot**. |

---

## 5. Mini-App Structure

Danh sách route / logical mini-app id (convention; mapping file thực tế **sau này** — xem §13):

| Mini-app id | Vai trò |
|-------------|---------|
| `travel.home` | Hub Travel OS: chọn hướng (§7), tile module, trạng thái Lite/Beta. |
| `travel.globalOutbound` | Outbound: checklist, flight/eSIM entry, safety theo đích, cravings nước ngoài. |
| `travel.vietnamInbound` | Inbound VN: guide, airport/SIM/taxi, fixer, VIP gated. |
| `travel.returnToVietnam` | Về VN: doc reminders, arrival, family/local bridge — overlap có chủ đích với inbound. |
| `travel.translator` | Minh Khang / translation surfaces — dùng chung, context theo hướng. |
| `travel.safetyChecklist` | Checklist + disclaimer — template theo destination. |
| `travel.localFixer` | Kết nối người địa phương / dịch vụ — **Pilot** khi có provider thật. |
| `travel.cravingsRadar` | Khám phá ẩm thực — có thể đích-specific. |
| `travel.flightSearch` | Discovery chuyến bay — Lite/Demo cho đến khi partner ổn định. |
| `travel.esim` | eSIM / connectivity — gated theo market/partner. |
| `travel.airport` | Airport fast path / lounge / ground — nội dung vs booking tách bạch trust. |
| `travel.vipConcierge` | VIP — **Gated** / production-only khi payment + provider thật. |
| `travel.documentVault` | Nhắc giấy tờ, lưu trữ cục bộ có kiểm soát — **Needs confirmation** mức mã hóa / compliance GDPR. |

---

## 6. Status Strategy

Quy ước trạng thái (khớp tinh thần Master Blueprint: active / beta / pilot / lite / coming soon / frozen; bổ sung **Demo** / **Gated** cho độ rõ UX):

| Module | Đề xuất trạng thái | Lý do ngắn |
|--------|-------------------|------------|
| `travel.home` | **Active** (Lite) | Cần luôn mở được khi flag Travel bật. |
| `travel.vietnamInbound` | **Lite** → **Beta** | Nội dung cốt lõi đã gắn với positioning cũ. |
| `travel.globalOutbound` | **Lite** / **Demo** | Nội dung theo đích; **Needs confirmation** depth theo market. |
| `travel.returnToVietnam` | **Lite** / **Pilot** | Cần copy và trust đặc thù; có overlap inbound. |
| `travel.translator` | **Active** / **Beta** | Có disclaimer; không thay thế dịch chính thức. |
| `travel.safetyChecklist` | **Active** (Lite) | Không tính phí survival basics. |
| `travel.localFixer` | **Pilot** / **Gated** | Chỉ mở rộng khi có provider pool thật. |
| `travel.cravingsRadar` | **Lite** / **Demo** | Dễ ship content; tránh claim sai địa phương. |
| `travel.flightSearch` | **Demo** / **Beta** | Partner & accuracy — **Needs confirmation** roadmap. |
| `travel.esim` | **Gated** / **Pilot** | Phụ thuộc affiliate thật. |
| `travel.airport` | **Lite** | Hướng dẫn trước; booking **Gated**. |
| `travel.vipConcierge` | **Gated** / **Frozen** (nếu chưa có ops) | Không giả thanh toán / fulfillment. |
| `travel.documentVault` | **Frozen** hoặc **Coming soon** | Cho đến khi có security review — **Needs confirmation**. |

---

## 7. UI / Navigation

**Đề xuất mode selector (top-level trong Travel hub):**

1. **Người Việt đi nước ngoài** → maps to `travel.globalOutbound` (+ shared translator/safety).  
2. **Đến Việt Nam** → maps to `travel.vietnamInbound`.  
3. **Về Việt Nam** → maps to `travel.returnToVietnam`.

**Hành vi:** Lưu lựa chọn gần nhất trong profile hoặc local preference; cho phép đổi nhanh không mất context SOS. Deep link có thể kèm query `?mode=outbound|inbound|return` — **Needs confirmation** schema URL.

**Accessibility:** Mỗi mode hiển thị rõ disclaimer emergency; không ẩn SOS khi đổi mode (khớp rule SOS blueprint).

---

## 8. Destination Config

**Đề xuất schema (conceptual JSON / TS type sau này):**

```typescript
// Conceptual only — not implemented in this doc task.
interface DestinationConfig {
  destinationId: string;           // e.g. "VN", "DE", "US-CA"
  displayName: { en: string; vi: string };
  directionSupport: Array<"outbound" | "inbound_vn" | "return_vn">;
  sos: {
    emergencyNumber: string;       // primary local emergency
    embassyHintKey?: string;       // i18n key, not legal advice
    defaultPhrasePackId: string;
  };
  content: {
    safetyChecklistId: string;
    airportGuideId?: string;
    esimAffiliateId?: string | null;  // null = hidden
  };
  flags: {
    flightSearchEnabled: boolean;
    vipConciergeGated: boolean;
    localFixerPilot: boolean;
  };
  compliance: {
    disclaimerVersion: string;
    lastReviewedAt?: string;       // Needs confirmation: process owner
  };
}

interface MarketConfig {
  marketId: string;                // user's billing / primary residence market
  originCountry: string;
  supportedDestinations: string[]; // destinationId[]
  paymentsMode: "demo" | "pilot" | "production";  // Needs confirmation enum set
  aiCreditsPolicyId: string;
}
```

**Needs confirmation:** Ai là source of truth cho `DestinationConfig` (CMS vs static JSON vs API).

---

## 9. AI Personas

| Persona | Vai trò trong Travel OS | Giới hạn |
|---------|-------------------------|----------|
| **Minh Khang** | **Travel voice / vision & language translator** — phrase survival, đọc menu/biển báo, tone đồng cảm người Việt ở nước ngoài. | Không tư vấn pháp y / y khoa cuối cùng; không thay thế dịch công chứng. |
| **Leona** | **Travel concierge** — gợi ý lịch, nhắc giờ bay, gợi ý dịch vụ **khi** catalog/provider thật hoặc gắn nhãn Demo. | Không book giả; không xác nhận thanh toán giả. |
| **Safety (hệ thống)** | Hướng dẫn số khẩn cấp, embassy, contact, location share — **destination-aware SOS**. | Không giả lập phản hứng khẩn cấp; AI chỉ hỗ trợ ngôn ngữ distress. |

---

## 10. Monetization

| Tier | Mô tả |
|------|--------|
| **Free / Lite** | Checklist, một phần translation, SOS basics, nội dung hub — không thu phí survival cốt lõi. |
| **Travel Pack** | Bundle add-on (concierge credits, bảo vệ/ưu đãi phí — chi tiết bundle **Needs confirmation** theo `VIONA_MONETIZATION_ZERO_LOSS_ENGINE.md`). |
| **AI Credits** | Usage-based cho tương tác AI nặng; firewall chi phí theo Core OS. |
| **Premium / VIP** | Chauffeur, fast-track, fixer cao cấp — **chỉ** khi provider + payment + ops **production thật**. |

**Rule:** Không tạo state “đã thanh toán” hoặc “đã đặt” giả trong DB hoặc UI.

---

## 11. Safety & Compliance

- **No fake provider fulfillment** — khớp blueprint; áp dụng cho cả outbound và return.  
- **No fake payment** — Stripe / manual / VietQR chỉ hiển thị luồng thật theo phase.  
- **No legal / medical final advice** — chỉ định hướng và disclaimer; user phải tới chuyên gia địa phương.  
- **Emergency disclaimer** — mọi mode; đa ngôn ngữ.  
- **Destination-aware SOS** — số khẩn cấp và gợi ý phrase theo `DestinationConfig`; **Needs confirmation** fallback khi GPS tắt (last selected destination vs profile residence).

---

## 12. Implementation Plan

| Phase | Nội dung |
|-------|----------|
| **A — docs/registry** | Cập nhật blueprint Universe 3; thêm registry entries / status table cho mini-app ids §5; liên kết doc này. |
| **B — UI mode selector** | Ba mode §7 trong Travel hub; persistence — **code later**. |
| **C — Travel Lite content** | Nội dung outbound/return ở mức Lite; inbound giữ và mở rộng nhẹ nếu cần. |
| **D — AI translation integration** | Context theo hướng + destination; giữ cost firewall. |
| **E — Local fixer / premium provider pilot** | Pool thật, SLA, support channel; một hoặc vài thành phố/đích. |
| **F — payment / provider production** | Kết nối thanh toán thật, fulfillment measurable, audit trail. |

---

## 13. Files to change later (đề xuất — không sửa trong task này)

**Chỉ gợi ý, không chỉnh sửa code trong phiên docs này:**

- `docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT.md` — §Universe 3 Purpose/Must include (merge bản “Corrected” §2 của doc này).  
- `docs/ai-context/MINI_APP_PLATFORM_ARCHITECTURE.md` — một đoạn Travel OS dual-direction nếu cần đồng bộ ngôn từ platform.  
- Mini-app / feature-flag registry trong repo (ví dụ `src/core/miniapps/` hoặc tương đương — **Needs confirmation** path chính xác khi triển khai).  
- `TravelScreen` / `TravelHubScreen` và navigator — mode selector + deep link.  
- `src/i18n/locales/*.json` — chuỗi cho ba mode và disclaimer SOS.  
- SOS components — đảm bảo destination context không phá hold-to-trigger và không ẩn SOS khi tắt Travel.  
- Bất kỳ `brandConfig` / marketing copy nào còn nói “chỉ inbound”.

---

## Cross-reference

- **Master Blueprint Universe 3 (trước chỉnh):** Purpose giới hạn “Vietnam inbound hub…” — doc này **mở rộng** có kiểm soát, **không xóa** inbound hay fixer/translator/safety/VIP.  
- **V7/V8:** Không có file blueprint tách trong repo; liên hệ thương mại/thanh toán nâng cao — **Needs confirmation** khi áp dụng cho Travel GMV.
