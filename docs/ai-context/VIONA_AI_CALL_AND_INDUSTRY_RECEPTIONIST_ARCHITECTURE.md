# VIONA AI Call Assistant & Industry-Aware Receptionist Architecture

> **Loại tài liệu:** Kiến trúc sản phẩm — khóa hướng cho **B2C AI Call Assistant** và **B2B Lễ Tân AI đa ngành**.  
> **Nguồn đã đọc:** `docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT.md` (Leona Call Lite, Lễ Tân AI, tool/policy), `docs/ai-context/B2B_AI_RECEPTIONIST_FULL_PRODUCTION_ARCHITECTURE.md`, `docs/ai-context/VIONA_GLOBAL_COMPANION_OS_ARCHITECTURE.md` (Smart Trio); chủ đề pilot/demo trong `docs/ai-context/AI_RECEPTIONIST_*` và `docs/audit/VIONA_AI_RECEPTIONIST_*`.  
> **Quy tắc phiên này:** Chỉ Markdown — **không** sửa code, refactor, migration, Prisma, API, payment, auth, booking, wallet.  
> **Needs confirmation:** Nhà cung cấp thoại (Twilio vs tương đương) theo từng quốc gia; ghi âm/lưu transcript theo GDPR; mức “AI gọi hộ” được phép pháp lý khi AI là bên thứ ba gọi thay người dùng.

---

## 1. Strategic Decision

VIONA (Global Vietnamese Network + super app mini-app platform) **phải** có hai trụ thoại bổ sung cho Companion OS:

1. **B2C AI Call Assistant** — hỗ trợ người Việt **không hoặc hạn chế tiếng bản địa** khi cần **gọi / đặt lịch / phiên dịch** với cơ sở nước ngoài (bác sĩ scheduling, sửa nhà, trường học, v.v.) trong khung **Lite → Pilot → Production** có kiểm soát.  
2. **B2B Industry-Aware AI Receptionist (Lễ Tân AI)** — một nền tảng **không hard-code** nail/spa/restaurant/barber; merchant chọn **ngành + playbook** để AI hiểu từ vựng dịch vụ, trường intake, chế độ booking và **mức rủi ro**, vẫn tuân **Policy Engine + Tool Gateway** như blueprint.

**Không mâu thuẫn với Master Blueprint:** AI được phép **nghe/giống lễ tân**; mọi hành động vật chất (booking confirm, charge, inventory) chỉ qua backend đã gate.

---

## 2. User Problems

| Vấn đề | Ai gặp | Hệ quả nếu không có giải pháp an toàn |
|--------|--------|----------------------------------------|
| Không đủ tiếng bản địa để gọi đặt lịch | Người Việt ở nước ngoài | Bỏ lỡ y tế (scheduling), sửa chữa, trường học, hành chính |
| Merchant Việt không giao tiếp được với khách bản địa | Chủ DN Việt | Mất khách; phụ thuộc nhân viên song ngữ hiếm |
| Khách bản địa muốn đặt dịch vụ Việt bằng ngôn ngữ họ | Native local customer | Friction cao; churn |
| Ngành đa dạng hơn beauty/F&B | Cùng các persona | Một UI “4 ngành” không scale; sai intake → sai booking / sai kỳ vọng pháp lý |

---

## 3. B2C AI Call Assistant

### Mô tả sản phẩm

Lớp **B2C** giúp user Việt:

- **Script trước cuộc gọi** (Lite, không PSTN): kịch bản song ngữ, từ khóa, cách xưng hô.  
- **Phiên dịch song song** (text hoặc voice-lite): user nói/viết tiếng Việt → hệ thống chuẩn bị câu tiếng bản địa; sau cuộc gọi tóm tắt lại tiếng Việt.  
- **AI gọi hộ / hỗ trợ gọi** (Pilot+): **Needs confirmation** định nghĩa pháp “AI là party” vs “user bấm click-to-call và AI chỉ whispers”; outbound robocall có thể bị hạn chế theo jurisdiction.

### Use cases (ưu tiên an toàn trước)

| Ưu tiên | Use case | Ghi chú |
|--------|----------|---------|
| P0 | Đặt lịch nail/spa/barber/restaurant (đã quen ecosystem) | Thấp rủi ro nếu không auto-commit |
| P1 | Sửa chữa / thợ đến nhà — **chỉ** hẹn khảo sát / slot | Tránh cam kết giá phức tạp qua AI |
| P1 | Khách sạn / homestay — availability question | Chỉ chuyển tiếp hoặc lead; confirm policy |
| P2 | Y tế **scheduling only** — không triệu chứng/tư vấy | Disclaimer; human handoff |
| P2 | Trường học / daycare — hỏi giờ, paperwork list | Không cam kết nhập học |
| P3 | Pháp lý / thuế / bảo hiểm | **Information + appointment only**; không tư vấn pháp lý cuối cùng |

### Consent

- **Recording consent** nếu ghi âm (hai phía nơi luật yêu cầu).  
- **Explicit consent** trước khi hệ thống thực hiện bất kỳ outbound call nào mang thương hiệu VIONA/merchant.  
- **Cost consent:** user thấy ước tính phút / credit trước khi bắt đầu phiên live (§9).

### Legal / medical / financial limitations

- **Không** tư vấn pháp lý, y khoa, đầu tư **cuối cùng** — khớp blueprint Leona / Minh Khang.  
- **Y tế:** chỉ lịch hẹn, địa chỉ phòng khám, nhắc mang thẻ BHYT/insurance — **không** chẩn đoán.  
- **Tài chính:** không chuyển tiền, không “xác nhận đã trả” qua AI.

### Manual ops / pilot phase

- **Phase Pilot:** “human-in-the-loop” hoặc lead-only (AI chuẩn bị, merchant/user xác nhận cuối).  
- Tham chiếu vận hành: `AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md`, audit pilot readiness.

---

## 4. B2B Industry-Aware AI Receptionist

### Mô tả

- Merchant (tenant) **chọn `industryId`** (và có thể chọn **vertical** con) trong onboarding; không giới hạn 4 ngành cố định trong code.  
- **Playbook** theo ngành cung cấp: từ vựng dịch vụ, **bookingMode** (appointment vs job vs room night vs order), trường bắt buộc/tùy chọn, **allowedActions** / **blockedActions**, **riskLevel**.  
- AI session load **playbook + catalog snippet + policy** — model chỉ **đề xuất** tool calls đã đăng ký.

### Không hard-code bốn ngành

- UI có thể hiển thị “popular” categories — **backend/registry** là nguồn sự thật cho danh sách đầy đủ (§5–§6).  
- Thêm ngành mới = thêm playbook + policy rules + (optional) tool variants — **không** fork toàn bộ receptionist per industry trong repo dài hạn (**Needs confirmation** chiến lược codegen vs data-driven playbooks).

---

## 5. Industry Taxonomy

Taxonomy **sản phẩm** (có thể mở rộng id trong registry sau; đây là khung khóa).

### Beauty & Wellness

- Nail salon, spa / massage, hair / barber, lash / brow, waxing, medical aesthetics **consultation only** (không điều trị qua AI)

### Food & Retail

- Restaurant / takeaway, grocery / Asian market, bakery, specialty retail (quà, đồ gia dụng nhỏ)

### Stay & Travel

- Hotel / motel, homestay / short-term rental, guesthouse, travel desk / tour desk **lead or booking theo policy**

### Home & Local Services

- Handyman / sửa chữa, điện / nước, HVAC, cleaning, moving / delivery helper, auto repair **appointment / estimate visit**

### Professional Services

- Accounting / tax **scheduling & intake only**, legal **scheduling only**, insurance broker **appointment + forms checklist**, immigration consultant **scheduling only** — **không** advice qua AI

### Education & Community

- Language school / tutoring center, daycare / after-school, community center classes, driving school **scheduling**

### Health Scheduling Only

- GP / clinic / dentist / physio **appointment slot** — triage text chỉ được phép ở mức **Needs confirmation** theo luật địa phương; mặc định thiết kế: **no symptom interpretation in production** without medical board sign-off

---

## 6. Industry Playbook Schema

Đề xuất **type khái niệm** (triển khai sau trong `industryTypes.ts` — **không** tạo file trong task này):

```typescript
// Conceptual — documentation only until implemented.

type BookingMode =
  | 'appointment_staff'      // chair / room / person
  | 'appointment_job_visit' // tradesperson window
  | 'room_night'             // hospitality
  | 'order_takeout'          // F&B pickup/delivery time
  | 'lead_capture_only';     // no auto-commit

type RiskLevel = 'low' | 'medium' | 'high' | 'regulated';

interface IndustryPlaybook {
  industryId: string;
  name: { en: string; vi: string; nativeKey?: string }; // nativeKey = i18n key for third label — Needs confirmation
  bookingMode: BookingMode;
  requiredFields: string[];   // e.g. partySize, serviceId, date, phone
  optionalFields: string[];
  allowedActions: string[];   // tool names e.g. create_booking_hold, send_sms_link
  blockedActions: string[];   // e.g. capture_payment for regulated without policy
  riskLevel: RiskLevel;
  handoffRules: {
    escalateToHumanWhen: string[]; // e.g. complaint, refund, legal keyword
    afterHours: 'voicemail' | 'sms_link' | 'deny';
  };
  confirmationPolicy: {
    requireVoiceYes: boolean;
    requireSmsPin: boolean;    // high-risk SKUs — Needs confirmation
    dualConfirmForHighRisk: boolean;
  };
}
```

**Needs confirmation:** Chuẩn hóa `industryId` (ISO-style vs slug); đa tenant override playbook per merchant.

---

## 7. Smart Trio Language Flow

Luồng **mục tiêu** (khớp Companion OS / Smart Trio):

1. **Khách** (có thể là native local hoặc người Việt) dùng **ngôn ngữ ưu tiên** (native / EN / VI) trên app hoặc thoại.  
2. **AI** đàm thoại với khách chủ yếu bằng **ngôn ngữ khách** (native local language hoặc EN), với fallback EN.  
3. **Tóm tắt cho merchant** bằng **tiếng Việt** (hoặc song song VI + EN tùy cấu hình merchant trong playbook).  
4. **Xác nhận lại với khách** bằng **ngôn ngữ khách** trước khi bất kỳ tool mutating nào được policy `ALLOW`.

**Needs confirmation:** Chiều outbound “AI gọi ra ngoài” có luôn dùng giọng TTS tiếng bản địa hay merchant DID quy định ngôn ngữ mặc định.

---

## 8. Tool & Policy Rules

Khớp **Master Blueprint §Lễ Tân AI** và **B2B_AI_RECEPTIONIST_FULL_PRODUCTION_ARCHITECTURE §5**:

- AI **không** ghi DB trực tiếp.  
- AI **không** charge tiền trực tiếp.  
- AI **không** tự xác nhận hành động rủi ro (cancel đơn hàng lớn, refund, giảm inventory) ngoài `ALLOW` từ policy.  
- **Tool Gateway** bắt buộc cho mọi mutation; schema validate; lỗi explicit cho model.  
- **Policy Engine:** `ALLOW` / `DENY` / `REQUIRE_CONFIRMATION` / `ESCALATE`.  
- **Tenant check** mọi tool invocation.  
- **Idempotency** mọi mutation.  
- **Audit log** (call SID, session, payload hash, kết quả).

B2C Call Assistant: nếu chưa có Tool Gateway production cho “third party merchant”, **mặc định** lead/script only — **Needs confirmation** bảng tool tối thiểu cho B2C.

---

## 9. Cost Firewall

| Cơ chế | Mô tả |
|--------|--------|
| **Included minutes** | Theo gói merchant (B2B) hoặc VIO / subscription (B2C) — **Needs confirmation** bảng giá |
| **Call duration cap** | Hard stop hoặc chuyển voicemail khi vượt ngưỡng |
| **Overage** | Billing thật hoặc chặn; không “silent unlimited” |
| **Auto pause** | Khi tenant vượt ngưỡng chi phí ngày/giờ |
| **Cheap model for intent** | Router: intent/slot extraction trên model nhẹ |
| **Realtime model chỉ live call** | Chỉ khi session PSTN/WebRTC được phê duyệt; simulator/demo dùng tier rẻ hơn |

Tham chiếu: B2B doc §Finance & Cost Control; blueprint cost firewall.

---

## 10. Rollout Phases

| Phase | Nội dung | Đầu ra |
|-------|----------|--------|
| **A** | Docs + taxonomy + playbook schema (file này + registry spec) | Agent/dev cùng ngôn |
| **B** | **Demo simulator** — industry profiles, fake phone, không Twilio prod | UX review, training merchant |
| **C** | **B2C script / call assistant Lite** — script, phrase bank, optional recorded practice | Không charge; không fake booking success |
| **D** | **Twilio (hoặc tương đương) pilot** — consent, recording policy, số giới hạn | Chỉ sau legal review |
| **E** | **Merchant production intake** — inbound DID, tenant resolve, transcript audit | Tool gateway live read-only hoặc hold-only trước |
| **F** | **Safe auto booking / payment / inventory** | Chỉ khi Phase E stable + policy two-phase hold→confirm |

**Needs confirmation:** Có tách B2C Phase D thành “callback từ merchant” thay vì AI outbound hay không.

---

## 11. P0 Code Task Proposal

**Đề xuất** tạo/chỉnh các file sau trong sprint **sau** khi doc được duyệt — **không** thực hiện trong task Markdown này:

| File / surface | Mục đích |
|------------------|----------|
| `src/core/industries/industryTypes.ts` | Types: `IndustryPlaybook`, `BookingMode`, `RiskLevel`, … |
| `src/core/industries/industryRegistry.ts` | Đăng ký `industryId` → metadata + flags |
| `src/core/industries/aiReceptionistIndustryPlaybooks.ts` | Playbook data hoặc loader từ JSON — tách khỏi UI |
| `AiReceptionistSetupChecklistScreen` | Merchant chọn ngành + xác nhận policy/cost |
| `AiReceptionistDemoSimulatorScreen` | Phase B — không PSTN production |
| `AiReceptionistPilotRequestScreen` | Lead / pilot enrollment — có thể đã một phần trong audit funnel |
| `src/i18n/locales/vi.json`, `en.json` | Chuỗi Smart Trio, disclaimer, trạng thái Lite/Demo |

**Needs confirmation:** Tên route/nav chính xác và có reuse màn hình pilot hiện có hay tách mới.

---

## 12. Do Not Do

- **No production calls** cho đến khi Phase D gate + legal OK.  
- **No payment** qua AI path trong demo/pilot Lite.  
- **No DB mutation** từ model; chỉ Tool Gateway backend.  
- **No Twilio production** (hoặc tương đương) **without** consent flow + legal review + recording compliance.  
- **No legal / medical advice** — scheduling & intake only where marked.  
- **No fake booking success** — UI và API không báo confirmed nếu policy/tool không `ALLOW`.

---

## 13. Final Recommendation

**Hướng an toàn nhất:** triển khai **Phase A → B → C** (taxonomy + simulator + B2C script Lite) **trước** mọi PSTN production và trước auto-booking; song song **chuẩn hóa Industry Playbook registry** để B2B không phụ thuộc bốn ngành hard-code. Chỉ mở **Phase D–E** khi runbook + audit pilot readiness đóng; **Phase F** chỉ sau bằng chứng webhook thanh toán và hold→confirm ổn định.

**Needs confirmation:** Liệu B2C “AI gọi hộ” có nên trì hoãn sau **click-to-call + script trên màn hình** (user tự bấm gọi) để giảm rủi ro pháp và brand.

---

## Cross-Reference

| Tài liệu | Liên quan |
|----------|-----------|
| `VIONA_FINAL_MASTER_BLUEPRINT.md` | Leona Call Lite; Lễ Tân AI; production layers |
| `B2B_AI_RECEPTIONIST_FULL_PRODUCTION_ARCHITECTURE.md` | Voice → Brain → Policy → Tools → Finance |
| `VIONA_GLOBAL_COMPANION_OS_ARCHITECTURE.md` | Smart Trio; native customer |
| `AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md` | Pilot vận hành |
