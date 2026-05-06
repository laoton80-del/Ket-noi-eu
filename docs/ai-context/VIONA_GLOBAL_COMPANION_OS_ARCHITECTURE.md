# VIONA Global Companion OS Architecture

> **Loại tài liệu:** Khóa kiến trúc sản phẩm / positioning — **bổ sung và làm rõ** `VIONA_FINAL_MASTER_BLUEPRINT.md`, không thay thế Master Blueprint cho đến khi founder ký merge.  
> **Nguồn đã đọc:** `docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT.md`, `docs/ai-context/VIONA_TRAVEL_DUAL_DIRECTION_ARCHITECTURE.md`, `docs/ai-context/MINI_APP_PLATFORM_ARCHITECTURE.md`, `docs/ai-context/CURRENT_STATE.md`; rà soát nhanh chủ đề gate/registry trong `docs/audit/` (ví dụ residual surface, feature gate) — **không** dùng audit làm nguồn sự thật thương mại.  
> **Quy tắc phiên này:** Chỉ Markdown; **không** sửa code, refactor, migration, Prisma, API, auth, payment, booking, wallet.

---

## 1. Strategic Decision

**VIONA = Global Vietnamese Companion OS** (người đồng hành / người bảo hộ toàn cầu cho cộng đồng Việt và mạng lưới xung quanh họ).

Founder khóa các trụ sau (mapping sang blueprint hiện có):

| Trụ Companion OS | Diễn giải ngắn | Liên kết blueprint |
|------------------|----------------|---------------------|
| **Bảo hộ** | SOS / survival, an toàn, không giả lập khẩn cấp | Global Lifeline, Hub survival briefing |
| **Đồng hành** | Hub LifeOS, concierge, cộng đồng, nhịp sống xa quê | Hub + Leona Lite |
| **Xóa rào cản ngôn ngữ** | Smart Trio i18n + Minh Khang | Core OS + AI personas |
| **Giúp kinh doanh** | Merchant, B2B AI Receptionist, Local booking | Universe 2 + Lễ Tân AI |
| **Giúp du lịch an toàn** | Travel OS hai chiều + inbound | Universe 3 + doc dual-direction |
| **Tạo thu nhập cộng đồng** | Merchant onboarding, QR attribution, helper, travel support, academy/broker | Broker QR, monetization layer |

**Quyết định kiến trúc bất biến (từ Master Blueprint):** VIONA vẫn là **super app** triển khai như **mini-app platform** — **không** thu hẹp thành booking app, travel-only, chatbot generic, hay luxury-only.

**Needs confirmation:** Tên công khai tiếng Việt cho “Companion OS” (slogan phụ vs giữ **Connect. Survive. Thrive.**) — chưa thay tagline trong blueprint.

---

## 2. Core Personas

| Persona | Vai trò trong hệ | Ghi chú |
|---------|------------------|---------|
| **Vietnamese abroad** | Người dùng trung tâm: sinh sống, học tập, làm việc, kinh doanh ở nước ngoài | Hub + Local + Survival + Language |
| **Native local customer** | Người bản địa **đặt dịch vụ doanh nghiệp Việt** qua VIONA | Cần UI/flow song ngữ + trust; **Needs confirmation** mức self-serve vs concierge |
| **Vietnamese merchant** | Nail/spa/ăn uống/cắt tóc… + dashboard | Universe 2 rules: tenant isolation, booking không phụ thuộc mock AI |
| **Vietnamese student / broker / community connector** | Thu nhập: onboarding merchant, QR attribution, local helper, travel support | Broker growth trong blueprint; phân quyền **Needs confirmation** theo role |
| **Foreign traveler to Vietnam** | Du lịch an toàn, phiên dịch, fixer, trải nghiệm | Universe 3 inbound (giữ); đồng bộ với dual-direction doc |
| **Overseas Vietnamese returning to Vietnam** | Trục “về nhà” trong Travel OS | Xem `VIONA_TRAVEL_DUAL_DIRECTION_ARCHITECTURE.md` |
| **Admin / operator** | Command center, pilot, compliance, nội dung | Mini-app Admin; audit trail |

---

## 3. Five Operating Systems

Năm “OS” là **lớp khái niệm sản phẩm** (không nhất thiết = repository package riêng) để AI/dev không drift:

1. **Survival & Protection OS** — Lifeline/SOS, safety briefing, law/tax/community **định hướng** (không tư vấn pháp y cuối cùng), immigration awareness, destination-aware emergency hints khi Travel mở rộng (**Needs confirmation** chi tiết GPS policy).  
2. **Language Freedom OS** — Smart Trio i18n (§5) + Minh Khang (scan menu, survival phrase, voice).  
3. **Local Commerce OS** — Universe Local: directory, booking, merchant profile, menu, merchant dashboard basic; **native customer → Vietnamese business** (§6).  
4. **Travel Companion OS** — Universe Travel theo **dual-direction** (§7) + translation/fixer/safety/VIP có điều kiện.  
5. **Income & Growth OS** — Attribution QR, broker/cộng tác viên, travel support fees khi thật, B2B SaaS, Academy monetization later, VIO loyalty **không** nhầm với tiền mặt.

---

## 4. Corrected 4 Universes

Ánh xạ **Companion OS** vào **4 Universes** (giữ tên và ranh giới blueprint; làm **rõ positioning** theo founder):

### Universe 1 — VIONA Hub

- **Companion framing:** “Command center” cho người Việt xa quê + cổng vào mọi OS; dual clock; launcher mini-app; VIO preview an toàn.  
- **Must include / Rules:** Giữ nguyên Master Blueprint §Universe 1 (SOS, survival briefing, không crypto dashboard giả).

### Universe 2 — VIONA Local

- **Companion framing:** **Đời sống & kinh doanh** ở nước sở tại + **cầu nối cho khách bản địa tới merchant Việt**.  
- **Must include / Rules:** Giữ blueprint (merchant directory, booking, tenant isolation, payment state never fake).  
- **Bổ sung định hướng (không thay thế blueprint cho đến khi merge):** persona **native local customer** là first-class trong copy và IA Local.

### Universe 3 — VIONA Travel

- **Companion framing:** **Travel Companion OS** theo **ba hướng** — không chỉ inbound VN.  
- **Nguồn chi tiết:** `docs/ai-context/VIONA_TRAVEL_DUAL_DIRECTION_ARCHITECTURE.md`.  
- **Master Blueprint hiện tại** vẫn ghi inbound-only ở Purpose — **cần cập nhật có kiểm soát** trong blueprint chính khi founder ký (task doc, không làm trong phiên “chỉ Markdown” nếu policy cấm sửa blueprint; **Needs confirmation** ai merge khi nào).

### Universe 4 — VIONA Academy

- **Companion framing:** Ngôn ngữ, văn hóa, gia đình, survival phrases; hỗ trợ học sinh / gia đình trong diaspora.  
- **Must include / Rules:** Giữ blueprint (Lite first, không chứng chỉ giả, AI teacher chỉ khi backend thật).

---

## 5. Smart Trio i18n

**Định nghĩa khóa (founder):** Luôn thiết kế UX và nội dung cho **ba lớp ngôn ngữ**:

1. **Tiếng Việt** — người dùng gốc Việt.  
2. **English** — cầu nối toàn cầu, expat, và nhiều market.  
3. **Ngôn ngữ bản địa** (theo quốc gia / khu vực user hoặc đích) — ví dụ DE/FR/JA/… theo `supportedLngs` và mở rộng sau.

**Vai trò kỹ thuật (theo Master Blueprint):** Smart Trio i18n thuộc **VIONA Core OS** (Layer 1), dùng chung mọi mini-app.

**Needs confirmation:** “Native” = locale thiết bị vs locale đích (travel) vs cả hai; ma trận fallback (vi → en → local); RTL nếu mở thị trường Trung Đông — chưa trong blueprint chi tiết.

---

## 6. Local Commerce Model

**Luồng chiến lược:** Người **bản địa** (quốc gia nơi merchant Việt đang kinh doanh) dùng VIONA để **khám phá và đặt** dịch vụ của doanh nghiệp Việt (nail, spa, nhà hàng, barber, …).

**Nguyên tắc:**

- Local vẫn là **business engine đầu tiên** (blueprint).  
- Booking phải chạy được **không phụ thuộc AI mock**.  
- Trust: đánh giá, giờ mở cửa, chính sách hủy, **Needs confirmation** chuẩn KYC hiển thị cho khách bản địa.

**Không drift:** Đây không biến VIONA thành “generic marketplace địa phương” — differentiation là **mạng lưới Việt** + Smart Trio + Companion OS.

---

## 7. Travel Dual-Direction Model

Ba hướng (đồng bộ với tài liệu Travel):

| Hướng | Mô tả |
|-------|--------|
| **Vietnamese outbound** | Người Việt / kiều bào đi nước ngoài (từ VN hoặc từ nước sở tại). |
| **Inbound Vietnam** | Người ngoại quốc đến VN — giữ must-include blueprint. |
| **Returning to Vietnam** | Kiều bào về VN — trục “về nhà”. |

Chi tiết mini-app id, trạng thái, selector UX: `VIONA_TRAVEL_DUAL_DIRECTION_ARCHITECTURE.md`.

---

## 8. Income Model

| Kênh | Ai hưởng lợi | Ghi chú guardrail |
|------|----------------|-------------------|
| **Merchant** | Chủ DN Việt | Phí dịch vụ / booking theo policy; không fake payment |
| **Student / part-time helper** | Người trẻ trong cộng đồng | **Needs confirmation** SKU pháp lý (contractor vs volunteer vs gig) |
| **Broker / cộng tác viên** | QR attribution, giới thiệu merchant | Blueprint: broker performance; không payout trước settlement (§11) |
| **Local fixer / travel support** | Provider trong Travel | Chỉ Pilot/production khi fulfillment thật |
| **Academy creator / tutor** | Sau này, khi có chương trình rõ | Không chứng chỉ giả |

VIO: **loyalty / credits** theo blueprint — không rút tiền mặt MVP.

---

## 9. AI Personas

Khớp **§6 The AI Personas** trong Master Blueprint; thêm **vai trò trong Companion OS**:

| Persona | Vai trò | Ranh giới ngắn |
|---------|---------|----------------|
| **Minh Khang** | Vision & voice, dịch real-time, travel survival, scan menu/biển | Không tư vấn pháp y / y khoa cuối cùng; không scan trả phí mock |
| **Leona** | B2C concierge, travel/expat, emotional support, call lite nếu thật | Không giả lawyer/doctor; không thay thế cơ quan khẩn cấp |
| **Lễ Tân AI** | B2B phone receptionist, đa ngôn ngữ, booking qua tool gateway | **Không** ghi DB / charge / inventory trực tiếp ngoài policy engine + audit (blueprint) |
| **Cô Giáo AI** | Academy tutor, phát âm, kids/family | Lite/Beta; không chứng chỉ hợp pháp giả |

**Needs confirmation:** Branding tiếng Việt thống nhất trên UI (tên hiển thị vs internal id) cho từng persona.

---

## 10. Mini-App Registry Requirements

Mỗi mini-app **phải** có metadata tối thiểu (theo Master Blueprint §Layer 3):

| Trường | Ý nghĩa |
|--------|---------|
| **id** | Stable slug (ví dụ `local`, `travel`, `academy`) |
| **name** | Tên hiển thị |
| **status** | active / beta / pilot / lite / coming soon / frozen (+ **demo/gated** nếu team chuẩn hóa — **Needs confirmation**) |
| **route** | Stack/tab route |
| **featureFlag** | Cờ bật tắt theo phase |
| **requiredRole** | B2C / B2B / broker / admin… |
| **permissions** | Camera, mic, location… |
| **data dependencies** | API / models |
| **monetization model** | free / credits / subscription / take rate… |
| **risk level** | Để ưu tiên review |
| **production readiness** | Chuẩn release |

**Nguyên tắc:** Không xóa tính năng vision — chuyển trạng thái Lite/Beta/Frozen.

---

## 11. Safety & Monetization Guardrails

Tổng hợp **bất khả xâm phạm** (blueprint + audit tinh thần):

- **No fake payment** — UI và server không báo đã thanh toán nếu luồng chưa thật.  
- **No unlimited AI** — cost firewall, quota, usage tracking.  
- **No payout before settlement** — broker / affiliate theo ledger policy (**Needs confirmation** chi tiết kế toán theo thị trường).  
- **No AI DB writes** (cho hành động rủi ro) — Lễ Tân AI chỉ qua policy engine / tool gateway / idempotency / audit.  
- **VIO is loyalty only** — không crypto public MVP; không rút cash; hiển thị đúng VIO Points/Credits.

Thêm: không fulfillment provider giả; SOS không ẩn vì tắt Travel; không mock AI production.

---

## 12. Super App Lite Roadmap

| Phase | Trọng tâm | Kết quả nhận biết |
|-------|-----------|-------------------|
| **Phase 0 — Trust shell** | Hub sạch, SOS, flags, brand đúng | Người dùng hiểu “đây là VIONA Companion”, không crypto giả |
| **Phase 1 — Lite surfaces** | Local + Travel + Academy ở mức Lite | Giá trị ngay không cần full AI |
| **Phase 2 — Smart Trio rollout** | Ba lớp ngôn ngữ trên flow chính | Native customer có thể dùng được flow đặt merchant Việt (**Needs confirmation** phạm vi màn hình) |
| **Phase 3 — Registry & gates** | Mini-app registry đầy đủ metadata §10; UI status | Giảm deep-link / shortcut lệch cờ (theo audit chủ đề) |
| **Phase 4 — Travel dual-direction** | Selector + nội dung theo hướng | Đồng bộ `VIONA_TRAVEL_DUAL_DIRECTION_ARCHITECTURE.md` |
| **Phase 5 — Production money paths** | Payment/booking/wallet chỉ khi gate pass | Tách khỏi Lite demo |

**Needs confirmation:** Timeline ngày cụ thể; phụ thuộc nguồn lực và pilot từng quốc gia.

---

## 13. P0 Implementation Packs

Gói công việc **ưu tiên không đổi schema** (khi được phép sửa code trong sprint riêng):

1. **Mini-App Registry** — Một nguồn metadata: id, flag, role, readiness (§10).  
2. **Smart Trio Foundation** — Chuẩn chuỗi + fallback + **copy** cho khách bản địa; **Needs confirmation** danh sách locale P0.  
3. **Local Commerce Definition** — PRD ngắn: native → Vietnamese merchant journey + trust checklist.  
4. **Travel Direction Selector** — Spec UX 3 mode (đã mô tả trong Travel dual-direction doc).  
5. **Gate / Status UI** — Nhãn Lite/Beta/Demo; shortcut không gọi màn gated âm thầm (phù hợp audit residual surface).

---

## 14. Do Not Touch

Trừ khi có **task riêng** đã được founder/kỹ thuật phê duyệt và runbook rõ ràng:

- **Database schema / migrations**  
- **Payment / Stripe / VietQR / wallet settlement**  
- **Auth flows / session model**  
- **Booking core / double-booking logic**  
- **AI production paths** ghi ledger, inventory, capture tiền  

Phiên **Companion OS doc** này: **chỉ** định hướng; mọi thay đổi trên các lớp trên phải qua review tách biệt.

---

## 15. Final Recommendation

**Nên làm tiếp theo (và vì sao):**

1. **Merge có kiểm soát** nội dung §4 (Universe 3 dual-direction) và §5 (Smart Trio) **vào** `VIONA_FINAL_MASTER_BLUEPRINT.md` để mọi agent/session có một SSoT — tránh drift giữa ba file (`MASTER`, `TRAVEL_DUAL`, `COMPANION_OS`).  
2. **Hoàn thiện registry + cờ** trước khi mở rộng tính năng tiền — registry là “khóa” để ship Lite an toàn (audit đã nhắc shortcut vs gate).  
3. **Smart Trio trên 2–3 flow vàng:** Hub launcher, Local merchant card + booking CTA, Travel mode selector — tối đa hóa cảm nhận Companion mà không chạm DB/payment.

**Needs confirmation:** Thứ tự ưu tiên giữa B2B Lễ Tân AI pilot vs B2C Local native journey khi nguồn lực hạn chế.

---

## Cross-Reference Index

| Tài liệu | Vai trò |
|----------|---------|
| `VIONA_FINAL_MASTER_BLUEPRINT.md` | SSoT hiện tại |
| `VIONA_TRAVEL_DUAL_DIRECTION_ARCHITECTURE.md` | Chi tiết Universe 3 ba hướng |
| `MINI_APP_PLATFORM_ARCHITECTURE.md` | Lớp Core / Shared / Mini-app |
| `VIONA_MONETIZATION_ZERO_LOSS_ENGINE.md` | Tiền + VIO + guardrail thương mại |
