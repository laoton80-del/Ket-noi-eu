# VIONA POST-REC2-R9 EXPANSION BLUEPRINT (MASTER SOCKET MAP)

**VERSION:** FINAL V3 - BROKERAGE & MARKETPLACE ECONOMY INTEGRATED (PARTNER + TRANSACTION NETWORK EDITION)  
**TARGET EPOCH:** POST-REC2-R9K / PRE-GRAND-LAUNCH WAVES A-B-C + SELECTED D / PROGRESSIVE POST-GRAND-LAUNCH EXPANSION  
**GOVERNANCE BOUNDARY:** STRICT ZERO-TRUST / CAPABILITY-AUTHORITY SEPARATION  
**MODULE COUNT:** EXACTLY 63 (LO-05 and TR-06 may expose internal capabilities; no 64th module)  
**BROKERAGE ENGINE COUNT:** EXACTLY 8 (cross-universe economic engines; not modules and not universes)

---

## FINAL V3 SUCCESSOR STATUS

Bản này là successor của `VIONA_POST_REC2_R9_EXPANSION_BLUEPRINT_MASTER_SOCKET_MAP_FINAL_V2_PARTNER_ECONOMY.md`. Nó giữ toàn bộ quyết định Partner Economy và tiếp nhận quyết định Operator mới: **VIONA BROKERAGE & MARKETPLACE ECONOMY** trở thành lớp kinh tế xuyên sáu vũ trụ, gồm đúng 8 brokerage engine, không tạo universe thứ 7 và không tăng 63 module.

Các luật bất biến:

```text
EXACT_UNIVERSE_COUNT=6
UNIVERSES=Local,Travel,Academy,Business,Account,SOS
HOME_IS_SEVENTH_UNIVERSE=NO
PUBLIC_ASSISTANT=Viona
PLATFORM_WORDMARK=VIONA
EXACT_MODULE_COUNT=63
LO_05_INTERNAL_SUBCAPABILITY_COUNT=6
BROKERAGE_ENGINE_COUNT=8
BROKERAGE_ENGINES_ARE_MODULES=NO
BROKERAGE_ENGINES_ARE_UNIVERSES=NO
TR_06_INTERNAL_BOOKING_CAPABILITIES_ALLOWED=YES
NEW_UNIVERSE_CREATED=NO
NEW_TOP_LEVEL_MODULE_CREATED=NO
```

Grand Launch successor ordering được áp dụng cho hướng triển khai hiện tại:

```text
REC2-R9K PLATFORM KERNEL + CONTROLLED FOUNDING PILOT
        ↓
WAVE A — REVENUE / RETENTION / TRUST + VOICE
        ↓
WAVE B — CROSS-UNIVERSE NETWORK
        ↓
WAVE C — PREDICTIVE COMPANION
        ↓
SELECTED WAVE D HIGH-TRUST PILOTS
        ↓
PUBLIC GRAND LAUNCH
        ↓
PROGRESSIVE ACTIVATION OF REMAINING 63-MODULE ROADMAP
```

63 module là **roadmap capability inventory**, không phải 63 lời hứa production cùng ngày. Tính năng chưa đủ điều kiện phải ở trạng thái `Lite / Demo / Pilot / Beta / Coming Soon / Gated / Frozen`, không được fake fulfillment.

**Phạm vi của bản FINAL:** quyết định sản phẩm và kiến trúc kinh tế trong tài liệu, không phải xác nhận đã cập nhật repository, có hợp đồng provider, có giấy phép hay có dịch vụ production. Các mô tả tham vọng của catalog gốc được giữ để không làm mất tầm nhìn; từ “tự động”, “an toàn”, “chuẩn pháp lý”, “kháng lượng tử” hoặc “triệt tiêu lừa đảo” không tự tạo bằng chứng cho những tuyên bố đó. Chi tiết triển khai mới phải đi qua contract, review, dữ liệu đo và gate tương ứng.

---

## 0. ARCHITECTURE & INTEGRATION PROTOCOL

- **Ranh giới thực thi:** Mọi thao tác ghi dữ liệu, trừ tiền hoặc gọi API ngoại vi bắt buộc phải định tuyến qua cổng Thẩm quyền (Authority Gate) và Sổ cái (Cost Ledger) tại REC2-R9. Không một Tác tử AI nào được phép tự ý vượt rào.
- **Phương thức thi công:** Sử dụng chiến thuật "Macro-Delegation". Kiến trúc sư (A0) sẽ phân rã Blueprint này thành Hợp đồng Giao khoán cho AI Builder (Codex/Cursor) thi công, chạy offline tests (100% GREEN), nộp biên bản mã băm (SHA256) chờ Operator xét duyệt hợp nhất.

- **Luật thu nhập cộng đồng:** VIONA được phép tạo marketplace việc làm/gig cho người Việt ở nước ngoài, nhưng không được mở một loại công việc nếu Country Policy Pack chưa chứng minh điều kiện cư trú, quyền làm việc, thuế, giấy phép, bảo hiểm và điều kiện địa phương tương ứng.
- **Luật Partner Economy:** Partner mode là capability xuyên vũ trụ do Local điều phối, Account quản lý identity/eligibility/earnings, Business tạo demand, Academy tạo skill supply, Travel tạo nhu cầu dịch vụ ngôn ngữ/địa phương, SOS bảo vệ người dùng và Partner.

### 0.1 Shared Platform Socket Registry

| Socket | Tên | Trách nhiệm |
|---|---|---|
| S01 | Identity & Profile | Danh tính, profile, thiết bị, entitlement, family/tenant context. |
| S02 | Consent, Privacy & Data Lifecycle | Consent receipt, sensitive scopes, retention/deletion. |
| S03 | Authority Gate & Policy Engine | Mọi consequential write/action, confirmation, idempotency, capability checks. |
| S04 | Cost Ledger & Usage Meter | AI/provider usage, quotas, caps, hard stop, margin control. |
| S05 | Viona Agent Runtime & Specialist Router | Intent routing, specialists, memory boundaries, prepare-vs-execute separation. |
| S06 | External Provider Gateway | Typed provider adapters, credentials isolation, provider reconciliation. |
| S07 | Money / Payment / Settlement Ledger | Charge, refund, payout, settlement, remittance truth. |
| S08 | Trust / Verification / Reputation | User/merchant/partner verification, anti-fraud, provenance, reputation. |
| S09 | Messaging / Notification / Voice | Push, SMS, email, voice, disclosure, delivery evidence. |
| S10 | Location / Mobility / Maps | Geolocation, route, geofence, ETA, offline geo, location permission. |
| S11 | Marketplace / Booking / Transaction | Listings, request, booking/order/job/trip state machines, disputes. |
| S12 | Document Intelligence / Forms | OCR, extraction, translation, form preparation, document comparison. |
| S13 | Evidence / Audit / Compliance | Immutable evidence, action log, reconciliation, incident support. |
| S14 | Country Policy Packs / Jurisdiction | Country/city rules, work eligibility, transport/licensing, language, tax/policy mapping. |
| S15 | Safety / Emergency Escalation | SOS state machine, trusted contacts, escalation, fail-safe. |
| S16 | Device / IoT / Edge / Mesh | Smartwatch, IoT, EV, Bluetooth/Wi-Fi Direct, sensor/device authority. |
| S17 | Search / Discovery / Reputation Growth | Search, ranking, SEO/review ingestion, visibility. |
| S18 | Scheduling / Workforce / Operations | Shifts, appointments, queues, merchant ops, work availability. |
| S19 | Knowledge / Learning / Credential | Courses, tutoring, assessments, skill graph, credentials. |
| S20 | Spatial / AR / VR Media | AR overlays, VR training, spatial media. |

Module implementation law:

```text
MODULE_UI_UX
+ DOMAIN_POLICY
+ SHARED_SOCKET_ADAPTERS
+ MODULE_SPECIFIC_TESTS
+ AUTHORITY_CONTRACT
+ COST_CONTRACT
+ EVIDENCE_CONTRACT
```

Payment, provider credentials, consent, country rules, AI cost or settlement logic không được nhúng trực tiếp vào vertical screen khi socket chung đã sở hữu concern đó.

### 0.2 VIONA BROKERAGE & MARKETPLACE ECONOMY — OFFICIAL CROSS-UNIVERSE ECONOMIC LAYER

**VIONA Brokerage & Marketplace Economy (BME)** là lớp kinh tế chính thức đứng giữa **nhu cầu** và **nguồn cung đã được xác minh**, giúp VIONA kiếm doanh thu khi tạo ra giao dịch, lead, referral, booking, placement hoặc savings-share có giá trị thật. BME không phải universe thứ 7, không phải module thứ 64 và không thay thế sáu universe hiện hữu.

Machine law:

```text
BROKERAGE_MARKETPLACE_ECONOMY=OFFICIAL_CROSS_UNIVERSE_LAYER
BROKERAGE_ENGINE_COUNT=8
BROKERAGE_ENGINE_IS_MODULE=NO
BROKERAGE_ENGINE_IS_UNIVERSE=NO
EXACT_MODULE_COUNT=63
EXACT_UNIVERSE_COUNT=6
USER_VALUE_AND_TRUST_BEFORE_COMMISSION=YES
CONSEQUENTIAL_EFFECT_REQUIRES_AUTHORITY=YES
VARIABLE_PROVIDER_COST_REQUIRES_COST_LEDGER=YES
MONEY_MOVEMENT_REQUIRES_MONEY_LEDGER=YES
MARKET_COUNTRY_POLICY_REQUIRED=YES
NO_FAKE_SUPPLY_PRICE_AVAILABILITY_OR_FULFILLMENT=YES
```

#### 0.2.1 Tám brokerage engine chính thức

| Engine | Tên chính thức | Module neo / module hỗ trợ | Nhu cầu ↔ nguồn cung | Revenue posture | Activation posture |
|---|---|---|---|---|---|
| **BME-01** | **Viona Mobility & Partner Economy** | LO-05; hỗ trợ Account/Business/Travel/SOS | Khách/merchant ↔ Partner đủ eligibility | transaction/lead/platform fee | A2 non-ride pilots; Ride ở B theo market/license |
| **BME-02** | **Viona Travel Marketplace** | TR-06; hỗ trợ TR-01, TR-04, TR-05, TR-07 | Khách du lịch ↔ hotel/transport/tour/provider | booking/provider commission, affiliate, SaaS | B; từng provider/market GREEN |
| **BME-03** | **Viona Home & Real Estate Marketplace** | LO-02; hỗ trợ BU-07 | Người thuê/mua/sang nhượng ↔ owner/broker/business | listing, qualified lead, referral, transaction | B; trust/title/policy gated |
| **BME-04** | **Viona Service Marketplace** | LO-03; hỗ trợ LO-01, Business supply | Người cần dịch vụ ↔ handyman/helper/local professional | lead/transaction commission | A2/B; category-by-category |
| **BME-05** | **Viona Talent Marketplace** | AC-09, AC-03; hỗ trợ BU-04 | Học viên/freelancer ↔ employer/client | recruitment/placement fee, marketplace commission, B2B SaaS | A/B; work-right and fairness gated |
| **BME-06** | **Viona B2B Supply Marketplace** | BU-06, BU-10; hỗ trợ BU-03 | Merchant ↔ supplier/logistics/wholesale provider | partner/transaction commission, savings share, SaaS | B/C; merchant authority required |
| **BME-07** | **Viona Money Marketplace** | AT-01, AT-02, AT-05, AT-08, AT-09 | User/business ↔ licensed financial/payment/professional provider | referral/provider commission, payment fee | selected D; provider-led, jurisdiction gated |
| **BME-08** | **Viona Trusted Professional Network** | LO-04, SO-02, SO-04, BU-12, AT-02, TR-01 | User ↔ verified legal/health/tax/immigration professionals | referral/service fee, Plus/partner revenue | selected D; high-trust, human/provider controlled |

Một module có thể đóng góp cho nhiều engine, và một engine có thể phối hợp nhiều module. `BME-01..08` là **economic orchestration engines**, không phải module IDs.

#### 0.2.2 Brokerage transaction modes

VIONA chỉ được công bố đúng mode mà market/provider đã chứng minh:

```text
LEAD_ONLY
REFERRAL
AFFILIATE_DEEP_LINK
MARKETPLACE_REQUEST
MARKETPLACE_BOOKING
PROVIDER_ORCHESTRATION
DIRECT_PARTNER_TRANSACTION
RECRUITMENT_PLACEMENT
SAVINGS_SHARE
```

Mode cao hơn không được suy ra từ mode thấp hơn. Ví dụ `AFFILIATE_DEEP_LINK=GREEN` không có nghĩa `IN_APP_BOOKING=GREEN`; `SEARCH_RESULT` không có nghĩa `LIVE_AVAILABILITY`; `PAYMENT_AUTHORIZED` không có nghĩa `PROVIDER_CONFIRMED`.

#### 0.2.3 Canonical brokerage lifecycle

```text
DEMAND_CAPTURED
→ ELIGIBILITY_AND_POLICY_CHECK
→ SUPPLY_DISCOVERY
→ TRUST_AND_AVAILABILITY_CHECK
→ QUOTE_PREPARED
→ PRICE_FEE_POLICY_DISCLOSED
→ USER_OR_BUSINESS_CONFIRMATION
→ AUTHORITY_GATE
→ PAYMENT_OR_PROVIDER_RESERVATION_IF_REQUIRED
→ PROVIDER_OR_PARTNER_DISPATCH
→ PROVIDER_CONFIRMATION
→ FULFILLMENT
→ PAYMENT_SETTLEMENT
→ COMMISSION_ACCRUAL
→ COMMISSION_SETTLEMENT
→ EVIDENCE_AND_REPUTATION
→ CLOSED
```

Exception states tối thiểu:

```text
NO_MATCH
QUOTE_EXPIRED
SUPPLY_CHANGED
PAYMENT_PENDING
PAYMENT_FAILED
PROVIDER_UNKNOWN_PENDING_RECONCILIATION
PROVIDER_DECLINED
CUSTOMER_CANCELLED
PARTNER_CANCELLED
REFUND_PENDING
REFUNDED
DISPUTED
CHARGEBACK
SAFETY_BLOCKED
POLICY_BLOCKED
```

Nếu external request có thể đã tới provider nhưng response bị mất, trạng thái phải là `PROVIDER_UNKNOWN_PENDING_RECONCILIATION`; không tự retry mù gây double booking/double order/double payout.

#### 0.2.4 Marketplace truth, ranking và conflict-of-interest law

BME phải giữ truth boundary:

```text
SEARCH_RESULT != AVAILABLE_SUPPLY
DISPLAYED_PRICE != FINAL_PAYABLE_PRICE_UNTIL_QUOTE_VALIDATED
PAYMENT_AUTHORIZED != PROVIDER_CONFIRMED
LEAD_SENT != DEAL_CLOSED
PARTNER_ACCEPTED != JOB_COMPLETED
REFUND_REQUESTED != REFUND_SETTLED
```

Ranking/recommendation law:

```text
ASSISTANT_RECOMMENDATION_USER_VALUE_FIRST=YES
COMMISSION_CANNOT_OVERRIDE_SAFETY_TRUST_OR_POLICY=YES
SPONSORED_PLACEMENT_MUST_BE_LABELED=YES
SPONSORED_PLACEMENT_SEPARATE_FROM_ORGANIC_RECOMMENDATION=YES
PROVIDER_OF_RECORD_DISCLOSED=YES
MERCHANT_OF_RECORD_DISCLOSED_WHEN_APPLICABLE=YES
```

Viona không được đề xuất một provider chỉ vì commission cao hơn nếu provider đó kém phù hợp, không đủ trust/policy hoặc tổng giá trị cho người dùng thấp hơn theo tiêu chí đã công bố.

#### 0.2.5 Brokerage economics and zero-loss controls

Mỗi engine phải có economics ledger tách biệt:

```text
GMV_OR_GTV
GROSS_COMMISSION
NET_REVENUE
PAYMENT_FEES
PROVIDER_FEES
AI_AND_VOICE_VARIABLE_COST
REFUNDS
CHARGEBACKS
FRAUD_LOSS
PARTNER_OR_SUPPLIER_PAYOUT
SUPPORT_COST
CONTRIBUTION_MARGIN
```

Trước external effect phải có allowance/quota/cost reserve phù hợp. Không được dùng doanh thu commission danh nghĩa để che variable provider cost, refund risk hoặc fraud exposure. Margin floor, fee disclosure và reserve policy là market/engine policy, không hard-code toàn cầu.

#### 0.2.6 Market activation unit

Đơn vị mở production của BME là:

```text
MARKET × ENGINE × CAPABILITY × PROVIDER_OR_SUPPLY_CLASS
```

Ví dụ:

```text
CZ × BME-02 × HOTEL_SEARCH × ProviderA = ACTIVE
CZ × BME-02 × IN_APP_HOTEL_BOOKING × ProviderA = PILOT
DE × BME-01 × RIDE × PartnerClass = NOT_ACTIVE
CZ × BME-05 × STUDENT_PART_TIME_MATCHING × EmployerClass = PILOT
```

Một market/capability GREEN không kéo theo market/capability khác GREEN.

#### 0.2.7 Founder brokerage dashboard

Founder-level metrics tối thiểu:

```text
ACTIVE_MARKETS_BY_ENGINE
VERIFIED_SUPPLY_COUNT
QUALIFIED_DEMAND_COUNT
MATCH_RATE
QUOTE_TO_CONFIRM_RATE
CONFIRM_TO_FULFILL_RATE
GROSS_TRANSACTION_VALUE
NET_BROKERAGE_REVENUE
TAKE_RATE
REFUND_RATE
DISPUTE_RATE
CHARGEBACK_RATE
FRAUD_LOSS_RATE
REPEAT_RATE
SUPPLIER_OR_PARTNER_NET_EARNINGS
CONTRIBUTION_MARGIN_AFTER_VARIABLE_COST
UNKNOWN_PENDING_RECONCILIATION_COUNT
```

Không gọi một engine “scale-ready” nếu economics tốt nhưng dispute, safety, provider truth hoặc reconciliation chưa đạt.

#### 0.2.8 Quyền sở hữu giao dịch và tránh tính hoa hồng hai lần

Đây là hợp đồng kinh tế dùng chung, không phải tám backend khác nhau. Một yêu cầu có thể liên quan nhiều engine nhưng mỗi giao dịch có một `transaction_id`, một module sở hữu trạng thái nghiệp vụ và một `primary_engine_id`. Các engine hỗ trợ được ghi riêng; không nhân doanh thu hoặc phí chỉ vì cùng giao dịch xuất hiện ở nhiều universe.

| Trường hợp giao nhau | Chủ sở hữu nghiệp vụ | Engine / module hỗ trợ |
|---|---|---|
| Gọi thợ có người giao vật tư | LO-03 sở hữu đơn dịch vụ; LO-05 sở hữu đơn giao độc lập nếu có | BME-04 và BME-01 liên kết qua parent/child order, không tạo hai khoản phí mơ hồ. |
| Việc ngắn hạn và tuyển dụng | LO-05E sở hữu gig; AC-09 sở hữu placement/tuyển dụng | BME-01 và BME-05 dùng cùng eligibility, không tạo hồ sơ người lao động trùng. |
| Khách sạn kèm tàu/xe và đón sân bay | TR-06 sở hữu đặt phòng; TR-04 giữ năng lực vận tải liên tuyến; LO-05 giữ trip của Partner | BME-02 tổ chức trải nghiệm; mỗi reservation/trip có confirmation và authority riêng. |
| Nguồn hàng kèm logistics | BU-10 sở hữu sourcing/negotiation; BU-06 sở hữu logistics | BME-06 không đồng nhất order-confirmed với delivery-completed. |
| Tư vấn thuế trong Account | AT-02 giữ case dữ liệu; chuyên gia chịu phạm vi dịch vụ đã duyệt | BME-07/BME-08 có một attribution contract, không tự thu hai referral fee. |

`commission_contract_id` phải quy định payer, event đủ điều kiện, fee basis, tiền tệ, thời điểm accrual, thời điểm settlement, cách reversal/clawback và attribution window. `LEAD_QUALIFIED` là kết quả của hợp đồng lead, không được gọi là `DEAL_CLOSED`. Các mode referral/affiliate không được ép đi qua thanh toán do VIONA thu nếu provider là bên thu tiền.

**Không giữ tiền chỉ vì mang tên marketplace:** actor thu tiền, provider/merchant-of-record và đơn vị chịu refund/chargeback phải được công bố theo đúng mô hình đã review. `GMV/GTV`, tiền đi qua hệ thống, payable cho supplier và doanh thu thuần được theo dõi riêng. Không vừa nhận net commission làm doanh thu, vừa trừ lại toàn bộ supplier payout lần nữa trong contribution margin.

#### 0.2.9 Gate thu phí, quyền lợi người dùng và SOS

Các quy tắc sau là policy sản phẩm cho lớp BME; không phải kết luận pháp lý cho một quốc gia cụ thể.

- Mỗi `market × engine × capability × provider/supply class × transaction mode` cần review loại hoạt động, bên ký hợp đồng, giấy phép/chứng chỉ liên quan, quyền thu phí, disclosure, privacy và chủ sở hữu hỗ trợ. “Chỉ referral”, “không custody” hoặc “provider có giấy phép” không tự đóng gate cho vai trò của VIONA.
- Với BME-07 và BME-08, mỗi fee model, referral/fee-sharing và thông điệp quảng bá phải được duyệt riêng. Khi chưa có đánh giá phù hợp, mode giao dịch/thu phí đó giữ `GATED`; không tự suy diễn rằng được phép môi giới tài chính, y tế, luật hoặc thuế.
- `SOS Core = FREE`, `SOS Plus = MONTHLY_PAID`. Không paywall trợ giúp cốt lõi, không xếp tuyến cứu trợ theo commission và không để tư vấn bán hàng chen vào xử lý nguy cấp. Dịch vụ chuyên môn bổ sung chỉ được đề xuất minh bạch khi phù hợp, có quyền đồng ý và có điều kiện hoạt động đã duyệt.
- Với người tìm việc, ưu tiên mô hình doanh nghiệp trả phí theo contract; không giả định sinh viên nào cũng có quyền nhận mọi gig hoặc ride. Không bán quyền ưu tiên bất minh, không hứa thu nhập bảo đảm và không biến KYC thành bảo đảm không có gian lận.
- Khi user từ chối đề xuất, Viona không được tự đặt dịch vụ, gọi provider, gửi dữ liệu nhạy cảm hay ghi nhận referral. S03 kiểm soát hệ quả; S04 kiểm soát variable cost; S07 giữ money/settlement truth; S13 giữ evidence.

#### 0.2.10 Hợp đồng tối thiểu trước khi giao một engine cho Swarm

Mỗi engine dùng chung bộ trường: `engine_id`, `anchor_module_id`, `contributing_module_ids`, `primary_engine_id`, `transaction_mode`, `market_scope`, `provider_or_supply_class`, `supply_verification`, `quote_policy`, `authority_class`, `cost_budget`, `payment_role`, `commission_contract_id`, `consent_policy`, `ranking_disclosure`, `completion_evidence`, `reconciliation_owner`, `activation_state`, `kill_switch_scope` và `success_metrics`.

Các trường chưa chốt được ghi `UNRESOLVED`, không tự điền một commission rate hoặc grant mặc định. Build chỉ mở sau socket readiness, exact write set và dual review; external execution vẫn là lane riêng.

---

## 1. VŨ TRỤ BUSINESS (Cơ hội - Kết nối - Tăng trưởng)

### Nhóm Ứng dụng Quản trị Thực chiến (Deep Verticals)

- **BU-01 | Core POS & Smart Kitchen:** Máy tính tiền, chia hóa đơn, kết nối cân điện tử, máy quét mã vạch, KDS điều phối bếp.
- **BU-02 | Salon & Beauty Engine:** Chia hoa hồng thợ (split tip), xoay tua thợ (turn-based), quản lý vật tư hóa chất.
- **BU-03 | Asia Grocery & Potraviny:** Quản lý kho theo lô/hạn sử dụng, gợi ý hạ giá hàng cận date, công nợ sỉ/lẻ.
- **BU-04 | Staff Shift Optimizer:** Tự động xếp ca làm việc, chấm công GPS/khuôn mặt.
- **BU-05 | Local Reputation & SEO:** Tự động phát hiện đánh giá xấu trên Google/TripAdvisor và soạn phản hồi.
- **BU-06 | Cross-border Logistics Hub:** Theo dõi vận tải tiểu ngạch, check mã HS và kiểm dịch thực vật.
- **BU-07 | Franchise Hub & Commercial Lease:** Quản lý chuỗi chi nhánh, AI quét hợp đồng thuê mặt bằng cảnh báo rủi ro.

### Nhóm Tác tử Tự trị & Pháp chế (Autonomous, AR & Compliance)

- **BU-08 | Autonomous Voice Receptionist:** Tác tử AI đàm thoại thời gian thực chốt lịch hẹn.
- **BU-09 | Predictive Strategy Engine:** Trí tuệ dự báo đề xuất giá bán linh hoạt (Dynamic Pricing).
- **BU-10 | Autonomous Supply Negotiator:** Tác tử đàm phán tự động tìm nguồn hàng rẻ nhất.
- **BU-11 | Spatial AR Storefront:** Giao diện 3D AR quét mặt tiền hiện menu và nút đặt bàn.
- **BU-12 | AI Tax Audit Defender:** Tác tử phân tích yêu cầu thanh tra thuế, tự động trích xuất Sổ cái và soạn thảo hồ sơ đối soát chuẩn pháp lý.
- **BU-13 | GDPR Compliance Auto-Pilot:** Tự động mã hóa và hủy dữ liệu khách hàng theo đúng chuẩn luật bảo vệ dữ liệu EU để tránh án phạt.
- **BU-14 | Spot-Market Energy Optimizer:** AI đọc giá điện/gas thời gian thực, tự động kích hoạt máy móc công suất lớn vào các khung giờ "giá điện âm".

---

## 2. VŨ TRỤ TRAVEL (Đi xa hơn - Trải nghiệm nhiều hơn)

### Nhóm Dịch vụ Di trú & Vận tải (Immigration & Commute)

- **TR-01 | Visa & Immigration Copilot:** Tự động điền tờ khai Schengen, gia hạn cư trú, đặt lịch hẹn ngoại kiều.
- **TR-02 | Tax-Free & VAT Refund Auto-Pilot:** Scan hóa đơn, tự tạo hồ sơ hoàn thuế sân bay.
- **TR-03 | Live Voice Interpreter:** Phiên dịch giọng nói hai chiều trực tiếp (Việt - Bản địa).
- **TR-04 | Intermodal Commute Hub:** Tích hợp mua vé tàu hỏa liên vận quốc tế, xe buýt đường dài.
- **TR-05 | Cross-border Pet Travel:** Hỗ trợ thủ tục kiểm dịch hàng không cho thú cưng.
- **TR-06 | B2B Tour Operator & GDS Hook:** Hệ thống điều hành tour, phân phối inventory du lịch và GDS/provider integration; trong FINAL V3 đây là module neo của **BME-02 Viona Travel Marketplace** và có thể mở các capability booking nội bộ mà không tạo module mới.

### Nhóm Tác tử Tự trị & Sinh thái (Autonomous, AR & Ecology)

- **TR-07 | Dynamic Swarm Routing:** AI định tuyến tự đổi vé liên tuyến/báo trễ khách sạn khi phương tiện delay.
- **TR-08 | Immersive AR Concierge:** Hướng dẫn viên du lịch AR phủ thông tin lịch sử lên không gian thật.
- **TR-09 | Swarm Baggage Tracker:** Mạng lưới Bluetooth diện rộng tự động tìm vali thất lạc qua các thiết bị Viona lân cận.
- **TR-10 | Carbon Footprint Wallet:** Đo lường khí thải di chuyển và tự động mua tín chỉ xanh (Carbon Credits) bằng tiền lẻ tích lũy.

---

## 2A. TR-06 DEEP SPEC — VIONA TRAVEL BOOKING & DISTRIBUTION ENGINE

TR-06 giữ ID module gốc nhưng được mở rộng nội bộ để làm module neo của `BME-02 Viona Travel Marketplace`. Mục tiêu là cho VIONA tiến từ Travel discovery/future provider booking tới một booking/distribution layer có thể hoạt động giống OTA/provider marketplace khi từng provider và market đã GREEN.

### 2A.1 Tám capability nội bộ — không tăng MODULE_COUNT

| ID | Capability | Phạm vi | Production posture |
|---|---|---|---|
| **TR-06A** | **Stay Search & Discovery** | Search khách sạn/apartment, map, filters, ranking, policy-aware recommendations. | Có thể mở sớm với affiliate/provider search truth. |
| **TR-06B** | **Hotel / Apartment Booking** | Room selection, guest details, price disclosure, provider reservation/confirmation. | Wave B, provider-by-provider gated. |
| **TR-06C** | **Rate & Availability Engine** | Rate plan, room inventory, taxes/fees, cancellation, quote expiry. | Chỉ live khi provider freshness/reconciliation proven. |
| **TR-06D** | **Hotel Partner Extranet** | Property profile, rooms, availability, rates, promos, policies, booking inbox. | Direct-supply lane; merchant verification required. |
| **TR-06E** | **Booking Management / Cancel / Refund** | Modify/cancel/refund/dispute/reconciliation. | Money/provider authority required. |
| **TR-06F** | **GDS & Accommodation Provider Gateway** | Typed adapters cho GDS/OTA/bedbank/provider. | Provider isolation + evidence mandatory. |
| **TR-06G** | **Flights / Rail / Ground Distribution** | Flight/rail/bus/ground inventory orchestration; complements TR-04. | Market/provider specific. |
| **TR-06H** | **Tours & Activities** | Attraction/tour/local experience inventory and booking. | Provider/supply truth required. |

`TR-06A..H` là sub-capabilities của TR-06, không phải module mới.

### 2A.2 Hotel booking reference lifecycle

```text
DESTINATION_DATES_GUESTS
→ DISCOVERY
→ PROPERTY_DETAIL
→ ROOM_AND_RATE_SELECTION
→ LIVE_QUOTE_REFRESH
→ TAX_FEE_CANCELLATION_DISCLOSURE
→ GUEST_DETAILS
→ PAYMENT_OR_GUARANTEE_PREPARE
→ USER_CONFIRMATION
→ AUTHORITY_GATE
→ PROVIDER_RESERVATION
→ PROVIDER_CONFIRMATION
→ VIONA_BOOKING_RECORD
→ VOUCHER_AND_ITINERARY
→ MODIFY_CANCEL_REFUND_IF_NEEDED
→ RECONCILIATION
→ REVIEW_AND_TRUST
```

Hard truth laws:

```text
SEARCH_RESULT != LIVE_ROOM_AVAILABILITY
LIVE_ROOM_AVAILABILITY != CONFIRMED_RESERVATION
DISPLAY_PRICE != FINAL_PRICE_UNTIL_TAXES_FEES_AND_POLICY_VALIDATED
PAYMENT_AUTHORIZED != HOTEL_CONFIRMED
PROVIDER_TIMEOUT != BOOKING_FAILED
```

Provider timeout sau request phải đi `UNKNOWN_PENDING_RECONCILIATION`; không silent retry.

### 2A.3 Travel marketplace differentiation

BME-02 không chỉ là OTA clone. Sau booking, VIONA có thể phối hợp các capability đã tồn tại:

```text
HOTEL
→ AIRPORT_TRANSFER / BME-01 PARTNER
→ TR-03 LIVE INTERPRETER
→ LOCAL SERVICES / RESTAURANT
→ TRAVEL DOCUMENTS
→ SOS / EMBASSY
→ DISRUPTION RECOVERY
→ RETURN JOURNEY
```

Viona có thể prepare và recommend toàn hành trình, nhưng mọi booking/payment/provider effect vẫn phải qua Authority + Money/Cost/Evidence gates.

---

## 3. VŨ TRỤ ACADEMY (Học hỏi - Phát triển - Vươn xa)

### Nhóm Đào tạo Nghề & Ngôn ngữ (Education Verticals)

- **AC-01 | Vocational Exam Simulator:** Luyện thi lý thuyết lái xe, an toàn thực phẩm, thi nhập tịch.
- **AC-02 | Vietnamese Heritage Language Tutor:** Dạy tiếng Việt tương tác cho thế hệ F2, F3.
- **AC-03 | Expert Knowledge Marketplace:** Sàn thương mại đóng gói khóa học, tài liệu.
- **AC-04 | Credential Translator:** Quy đổi và hợp pháp hóa bằng cấp sang chuẩn EU.

### Nhóm Hấp thụ Tri thức Tự trị (Autonomous, VR & Matching)

- **AC-05 | Bio-sync Cognitive Learner:** Đọc sinh trắc học để đẩy bài học khó vào giờ Peak Focus.
- **AC-06 | Lesson Plan Architect:** Tự động thiết kế giáo án và chấm bài luận.
- **AC-07 | VR Vocation Simulator:** Thực hành nghề (nail, bếp) trong môi trường VR.
- **AC-08 | Digital Genealogy & Ancestry AI:** Lưu trữ hồi ký và nhân bản giọng nói/tính cách để thế hệ sau giao tiếp với tổ tiên qua AI.
- **AC-09 | Skill-to-Job Matching Engine:** AI tự động khớp nối học viên vừa tốt nghiệp với các doanh nghiệp kiều bào đang thiếu nhân sự.

---

## 4. VŨ TRỤ LOCAL (Sống tốt hơn mỗi ngày)

### Nhóm Đời sống & Cộng đồng (Local Living)

- **LO-01 | Bureaucracy Navigator:** Dịch công văn hành chính (thuế, tòa án, phạt nguội) và hướng dẫn xử lý.
- **LO-02 | Community Real Estate:** Sàn sang nhượng quán ăn, tiệm nail, thuê nhà xác thực chủ quyền.
- **LO-03 | On-demand Handyman:** Gọi thợ sửa điện nước, bảo trì khẩn cấp trong cộng đồng.
- **LO-04 | Telehealth Medical Bridge:** Kết nối bác sĩ đa khoa người Việt từ xa, dịch đơn thuốc bản địa.
- **LO-05 | Viona Mobility & Partner Economy (Community Carpool successor):** Hệ sinh thái kiếm thu nhập hợp pháp cho người Việt ở nước ngoài thông qua Ride, Delivery, Errand, Local Helper, Student Jobs và Business Runner; mọi mode được Country Policy, Identity/Eligibility, Trust, Authority, Payment/Settlement và Safety gate theo từng quốc gia/thành phố.

### Nhóm Đời sống Dự báo & Tiện ích (Predictive Lifestyle)

- **LO-06 | Predictive Lifestyle Orchestrator:** Tiên đoán hết nhu yếu phẩm, tự săn sale và nhắc thanh toán.
- **LO-07 | Smart Home IoT Link:** Tích hợp điều khiển thiết bị nhà thông minh.
- **LO-08 | Drone-Delivery API Hook:** Cổng kết nối robot giao hàng nội khu.
- **LO-09 | Trust-based Networking & Dating:** Sàn giao lưu/hẹn hò yêu cầu KYC 100% sinh trắc học, triệt tiêu lừa đảo.
- **LO-10 | Smart EV Charging Negotiator:** Tác tử tự động đàm phán với lưới điện để sạc xe điện vào khung giờ giá rẻ nhất trong đêm.

---

## 4A. LO-05 DEEP SPEC — VIONA MOBILITY & PARTNER ECONOMY

### 4A.1 Mục tiêu sản phẩm

LO-05 không chỉ là carpool. Nó là **cổng kiếm thu nhập hợp pháp** cho sinh viên, người mới định cư và công dân Việt Nam đang sinh sống ở nước ngoài, đồng thời tạo nguồn cung dịch vụ đáng tin cậy cho cộng đồng VIONA.

```text
USER_NEEDS_HELP
      ↓
LOCAL / VIONA DISCOVERY
      ↓
JOB_OR_TRIP_REQUEST
      ↓
ELIGIBILITY + COUNTRY_POLICY
      ↓
TRUSTED_PARTNER_MATCHING
      ↓
QUOTE / ETA / TERMS
      ↓
CUSTOMER_CONFIRMATION
      ↓
AUTHORITY_GATE
      ↓
BOUNDED_EXECUTION
      ↓
PROOF_OF_COMPLETION
      ↓
PAYMENT + SETTLEMENT
      ↓
PARTNER_EARNINGS
      ↓
RATING + TRUST + DISPUTE EVIDENCE
```

### 4A.2 Sáu capability nội bộ — vẫn chỉ là một module LO-05

| Capability | Tên | Mục đích | Activation posture |
|---|---|---|---|
| **LO-05A** | **Viona Ride** | Chở khách: sân bay, ga tàu, đi làm, đi học, local ride. | Wave B / city-country licensed gate. |
| **LO-05B** | **Viona Delivery** | Giao món ăn, hàng nhỏ, giấy tờ, grocery/merchant delivery. | Wave A2 bounded pilot khi local work/payout rules GREEN. |
| **LO-05C** | **Viona Errand** | Mua hộ, lấy hàng, xếp hàng, chạy việc theo yêu cầu. | Wave A2 bounded pilot. |
| **LO-05D** | **Viona Local Helper** | Hỗ trợ người mới sang, accompaniment, local orientation, non-professional language help. | Wave A2 bounded pilot; regulated advice excluded. |
| **LO-05E** | **Viona Student Jobs** | Công việc linh hoạt theo giờ, sự kiện, support, delivery, approved micro-jobs. | Wave A2; work-hour/permit policy mandatory. |
| **LO-05F** | **Viona Business Runner** | Merchant giao hàng, lấy vật tư, chuyển hàng giữa chi nhánh, operational errands. | Wave A2/B depending merchant/payment readiness. |

`LO-05A..F` là sub-capabilities, **không tăng MODULE_COUNT=63**.

### 4A.3 Không phải ai cũng được bật mọi earning mode

Account + Country Policy Pack quyết định eligibility theo quốc gia/thành phố và loại công việc. Tối thiểu phải xét:

```text
IDENTITY_VERIFIED
RESIDENCY_STATUS
RIGHT_TO_WORK
STUDENT_WORK_LIMITS_IF_APPLICABLE
AGE_REQUIREMENT
TAX_REGISTRATION_REQUIREMENT
EMPLOYMENT_OR_SELF_EMPLOYMENT_CLASSIFICATION
DRIVING_LICENCE_IF_APPLICABLE
VEHICLE_REGISTRATION_IF_APPLICABLE
COMMERCIAL_TRANSPORT_OR_RIDEHAIL_LICENCE_IF_APPLICABLE
INSURANCE_IF_APPLICABLE
BACKGROUND_OR_TRUST_CHECK_IF_REQUIRED
CITY_OR_MUNICIPAL_RULES
PAYOUT_ELIGIBILITY
```

Kết quả phải là machine-readable entitlement, ví dụ:

```text
partner_id: <id>
market: CZ-PRAGUE
ride: NOT_ELIGIBLE
student_jobs: ELIGIBLE_WITH_HOUR_CAP
delivery: ELIGIBLE
local_helper: ELIGIBLE
business_runner: ELIGIBLE
policy_pack_version: <exact>
valid_until: <timestamp>
```

Không có policy/eligibility proof thì capability phải fail closed hoặc chỉ hiện `Coming Soon / Not eligible in this market`.

### 4A.4 Partner onboarding state machine

```text
DRAFT
→ IDENTITY_VERIFICATION
→ RESIDENCY_AND_WORK_RIGHT_REVIEW
→ ROLE_SPECIFIC_DOCUMENTS
→ TAX/PAYOUT_PROFILE
→ TRUST_AND_SAFETY_CHECK
→ COUNTRY_POLICY_EVALUATION
→ ELIGIBLE_CAPABILITY_SET_CREATED
→ PARTNER_ACTIVE
```

Các trạng thái ngoại lệ:

```text
NEEDS_MORE_EVIDENCE
TEMPORARILY_RESTRICTED
CAPABILITY_SUSPENDED
MARKET_DISABLED
PAYOUT_HOLD
DISPUTE_REVIEW
EXPIRED_REVERIFICATION_REQUIRED
```

Activation của một capability không được kéo theo activation tự động của capability khác.

### 4A.5 Job / Trip lifecycle

```text
REQUEST_DRAFT
→ REQUEST_SUBMITTED
→ QUOTE_PREPARED
→ CUSTOMER_CONFIRMED
→ MATCHING
→ PARTNER_OFFERED
→ PARTNER_ACCEPTED
→ PRE_EFFECT_REVALIDATION
→ ACTIVE
→ ARRIVED_OR_PICKED_UP
→ COMPLETION_PROPOSED
→ COMPLETION_CONFIRMED
→ PAYMENT_CAPTURE_OR_FINALIZATION
→ SETTLEMENT_PENDING
→ PARTNER_SETTLED
→ CLOSED
```

Các terminal/exception states tối thiểu:

```text
CUSTOMER_CANCELLED
PARTNER_CANCELLED
NO_MATCH
EXPIRED
PAYMENT_FAILED
PROVIDER_UNKNOWN_PENDING_RECONCILIATION
DISPUTED
SAFETY_STOP
POLICY_BLOCKED
```

Không được gọi timeout/provider-unknown là failure chắc chắn nếu external effect có thể đã xảy ra. Cùng một authority UUID không được retry mù.

### 4A.6 Matching engine

Matching chỉ dùng partner đang có entitlement phù hợp. Candidate score có thể dùng:

- khoảng cách/ETA;
- capability + vehicle/tool fit;
- ngôn ngữ;
- merchant/customer preference hợp lệ;
- trust/reliability history;
- availability;
- fairness / anti-starvation controls;
- job-hour cap còn lại;
- country/city policy constraints.

Không dùng sensitive attribute để xếp hạng nếu không có lawful/policy basis. AI có thể **recommend/match/prepare**, nhưng không tự bỏ qua eligibility hoặc Authority Gate.

### 4A.7 Giá, phí và thu nhập

Không hard-code một commission toàn cầu. Economics là market-policy config:

```text
CUSTOMER_GROSS_PRICE
- APPLICABLE_TAX_OR_STATUTORY_COMPONENTS
- PAYMENT_PROVIDER_COST
- EXTERNAL_PROVIDER_COST_IF_ANY
- VIONA_PLATFORM_FEE
- OPTIONAL_INSURANCE_OR_PARTNER_SERVICE_COMPONENT
= PARTNER_SETTLEMENT_BASE
```

Mọi khoản phải có ledger truth. Trước khi customer xác nhận phải hiển thị tối thiểu:

- tổng giá / cách tính;
- phần có thể thay đổi nếu luật/quote cho phép;
- cancellation/no-show rule;
- loại service;
- identity của contracting party theo market model;
- estimated partner earning khi luật/policy cho phép hiển thị;
- platform fee/fees theo disclosure policy.

Không có `unlimited subsidy`. Mọi AI/maps/SMS/voice/provider variable cost phải qua S04 Cost Ledger và hard cap.

### 4A.8 Payment / settlement

S07 là source of truth cho tiền. Tối thiểu:

```text
PAYMENT_INTENT
→ AUTHORIZED/RESERVED
→ SERVICE_ACTIVE
→ COMPLETION_EVIDENCE
→ CAPTURE_OR_FINALIZE
→ PLATFORM_FEE_LEDGER
→ PARTNER_PAYABLE
→ SETTLEMENT
→ PAYOUT_CONFIRMED
```

Refund, cancellation, chargeback, dispute và payout failure phải idempotent, reconcilable và audit được. AI không được trực tiếp đổi số tiền, refund hoặc payout ngoài policy/tool contract.

### 4A.9 Safety & trust

Bắt buộc tích hợp S08 + S13 + S15. Tùy mode:

- verified identity;
- trip/job share to trusted contact;
- masked communication where appropriate;
- report/block;
- emergency shortcut;
- suspicious account/device/payment signals;
- evidence-preserving incident workflow;
- partner/customer deactivation with review path;
- high-risk-zone/late-night policy where legally and operationally appropriate.

Ride, delivery và in-person helper có safety profiles khác nhau; không dùng một policy chung cho tất cả.

### 4A.10 Privacy & location

Location chỉ được thu thập đúng purpose và lifecycle:

```text
BEFORE_JOB: coarse / availability as needed
ACTIVE_JOB: precise only if service requires
AFTER_JOB: retain only policy-required evidence / derived record
```

Không bật background tracking vô thời hạn. Sharing location, recording, biometric check hoặc emergency escalation phải theo consent/policy tương ứng.

### 4A.11 Authority classes

Các effect sau phải qua S03 Authority Gate:

```text
CREATE_CONFIRMED_JOB_OR_TRIP
PARTNER_ACCEPT_BINDING_JOB
START_EXTERNAL_PROVIDER_ACTION
START_PRECISE_LOCATION_SHARING
CAPTURE_CUSTOMER_PAYMENT
ISSUE_REFUND
CREATE_PARTNER_PAYABLE
RELEASE_OR_TRIGGER_PAYOUT
SEND_EXTERNAL_MESSAGE_OR_CALL_WHEN_CONSEQUENTIAL
SAFETY_ESCALATION
SUSPEND_OR_RESTRICT_HIGH_IMPACT_ACCOUNT_ACTION
```

Prepare/recommend không đồng nghĩa execute.

### 4A.12 Socket map

LO-05 dùng các socket chính:

```text
S01 Identity & Profile
S02 Consent / Privacy
S03 Authority Gate
S04 Cost Ledger
S05 Viona Agent Runtime
S07 Payment / Settlement
S08 Trust / Verification
S09 Messaging / Voice
S10 Location / Maps
S11 Marketplace / Transaction
S13 Evidence / Audit
S14 Country Policy
S15 Safety Escalation
S18 Scheduling / Workforce
```

Ride có dependency mạnh hơn vào `S10,S14,S15`; Student Jobs mạnh hơn vào `S01,S14,S18`; Business Runner mạnh hơn vào `S11,S18`; mọi payout dùng `S07`.

### 4A.13 Cross-universe flywheel

```text
ACADEMY
skill / language / credential
      ↓
ACCOUNT
identity / eligibility / payout
      ↓
LOCAL LO-05
jobs / mobility / helper marketplace
      ↓
BUSINESS
merchant demand / shifts / runner jobs
      ↓
TRAVEL
visitor demand / airport / local assistance
      ↓
SOS
safety / trusted contact / escalation
      ↓
TRUST + EARNINGS HISTORY
      ↺
```

Viona Partner vì vậy là **income layer xuyên 6 universe nhưng được neo ở Local**, không phải universe thứ 7.

### 4A.14 Rollout order

Không đợi xây xong một ride-hailing platform hoàn chỉnh mới tạo thu nhập cộng đồng.

```text
PHASE P0 — READ-ONLY MARKET/POLICY DISCOVERY
PHASE P1 — PARTNER IDENTITY + ELIGIBILITY + EARNINGS PROFILE
PHASE P2 — DELIVERY / ERRAND / LOCAL HELPER / STUDENT JOBS / BUSINESS RUNNER PILOTS
PHASE P3 — TRUST + DISPUTE + PAYMENT/SETTLEMENT HARDENING
PHASE P4 — VIONA RIDE MARKET-BY-MARKET PILOT
PHASE P5 — CITY SCALE + DYNAMIC SUPPLY / ETA / PRICING CONTROLS
PHASE P6 — CROSS-UNIVERSE INCOME ORCHESTRATION
```

Viona Ride chỉ mở ở market có đầy đủ legal/insurance/licensing/operational evidence. Các capability khác cũng không được giả định là tự do pháp lý; mỗi mode có Country Policy contract riêng.

### 4A.15 Success metrics

Founder/Operator nên theo dõi ít nhất:

```text
ACTIVE_ELIGIBLE_PARTNERS
WEEKLY_EARNING_PARTNERS
MEDIAN_PARTNER_NET_EARNING_PER_ACTIVE_HOUR
REQUEST_TO_MATCH_RATE
MATCH_TO_ACCEPT_RATE
TIME_TO_MATCH
COMPLETION_RATE
CANCELLATION_RATE_BY_PARTY
DISPUTE_RATE
SAFETY_INCIDENT_RATE
PAYOUT_SUCCESS_RATE
PAYOUT_LATENCY
CUSTOMER_REPEAT_RATE
PARTNER_RETENTION_30D_90D
PLATFORM_TAKE_RATE
CONTRIBUTION_MARGIN_PER_COMPLETED_JOB
VARIABLE_COST_PER_COMPLETED_JOB
POLICY_BLOCK_RATE
FRAUD_LOSS_RATE
```

Không tối ưu GMV bằng cách hy sinh partner earnings, safety, legality hoặc unit economics.

### 4A.16 Launch gate

Một market/mode chỉ được chuyển từ Pilot sang Production khi:

```text
COUNTRY_POLICY_GREEN=YES
IDENTITY_AND_ELIGIBILITY_GREEN=YES
TRUST_AND_SAFETY_GREEN=YES
AUTHORITY_GATE_GREEN=YES
PAYMENT_AND_SETTLEMENT_GREEN=YES
COST_AND_MARGIN_GUARD_GREEN=YES
DISPUTE_AND_REFUND_GREEN=YES
PROVIDER_RECONCILIATION_GREEN=YES
SUPPORT_AND_INCIDENT_RUNBOOK_GREEN=YES
ROLLBACK_OR_KILL_SWITCH_GREEN=YES
NO_FAKE_SUPPLY_OR_FULFILLMENT=YES
```

---

## 5. VŨ TRỤ ACCOUNT (Của bạn - An toàn - Thông minh)

### Nhóm Tài chính & Pháp lý (Finance & Legal)

- **AT-01 | Smart Remittance Router:** So sánh tỷ giá và định tuyến kiều hối hợp pháp tối ưu.
- **AT-02 | Cross-border Tax Compliance:** Cảnh báo nghĩa vụ khai thuế song phương.
- **AT-03 | Viona Trust Index:** Chấm điểm tín nhiệm giao thương nội bộ người dùng.
- **AT-04 | Family Treasury & Micro-lending:** Quản lý quỹ gia đình đa quốc gia, hợp đồng thông minh cho họ/hụi.
- **AT-05 | Multi-tenant Payment Gateway:** Cổng thanh toán, chia sẻ doanh thu tự động.

### Nhóm Bảo vệ Dự báo & Lượng tử (Quantum & Autonomous)

- **AT-06 | Digital Inheritance Vault (Quantum-ready):** Két di chúc và tài sản số kích hoạt khẩn cấp (Multisig) kháng lượng tử.
- **AT-07 | Scam Shield AI:** Quét tin nhắn/link với DB tội phạm mạng để chặn lừa đảo.
- **AT-08 | Micro-Wealth Autonomous Agent:** Trích lập tiền lẻ để tự động đầu tư an toàn.
- **AT-09 | Crypto-Fiat Autonomous Bridge:** Cầu nối tự động đổi Crypto sang Fiat để thanh toán tức thời, sinh báo cáo AML.
- **AT-10 | Smart Crowdfunding:** Sàn gọi vốn cộng đồng giải ngân theo tiến độ (Milestone) bằng Smart Contract.

---

## 6. VŨ TRỤ SOS (An toàn luôn bên bạn)

### Nhóm Cứu hộ Cộng đồng (Community Rescue)

- **SO-01 | Lost Passport Emergency Flow:** Tạo đơn trình báo mất giấy tờ tự gửi cảnh sát/Đại sứ quán.
- **SO-02 | Emergency Legal Guard:** Ghi âm khẩn cấp, phát tín hiệu cho luật sư khi bị tạm giữ.
- **SO-03 | Community Beacon Alert:** Phát tin báo mất tích (trẻ em/người già) bán kính hẹp.
- **SO-04 | Mental Health SOS & Cultural Navigator:** Cố vấn tâm lý khẩn cấp và cảnh báo "luật bất thành văn".
- **SO-05 | Zero-Connection Safe Map:** Bản đồ Offline trạm xá, đồn cảnh sát, nhà cộng đồng kiều bào.

### Nhóm Cứu hộ Dự báo & Tác chiến (Predictive Survival & Tactical)

- **SO-06 | Predictive Biometric Over-watch:** Dự báo đột quỵ/nhồi máu cơ tim qua smartwatch và tự gọi cấp cứu.
- **SO-07 | Mesh-Network Survival Mode:** Tạo mạng kết nối truyền tay (Bluetooth/Wifi Direct) khi sập mạng viễn thông.
- **SO-08 | IoT Crash Detection:** Tự kích hoạt SOS qua cảm biến va chạm gia tốc.
- **SO-09 | Deepfake & Voice Clone Detector:** Trình quét phổ âm thanh thời gian thực cảnh báo cuộc gọi lừa đảo mạo danh người thân.
- **SO-10 | Coercion Silent Alarm:** Kích hoạt cảnh báo ngầm (ghi âm, gửi tọa độ) thông qua cử chỉ vuốt nghịch lý hoặc mật mã giọng nói ẩn khi người dùng bị khống chế.

---

## 6A. STRATEGIC EXECUTION UPDATE — PARTNER ECONOMY

### Wave placement

LO-05 giữ vai trò cross-universe network module nhưng có **staged activation**:

```text
WAVE A2 EARLY BOUNDED PILOTS
- LO-05B Delivery
- LO-05C Errand
- LO-05D Local Helper
- LO-05E Student Jobs
- LO-05F Business Runner

WAVE B LICENSED MOBILITY
- LO-05A Viona Ride
- cross-city / cross-market mobility network
```

A2 không có nghĩa là “mặc định hợp pháp ở mọi nước”. Mỗi sub-capability vẫn phải pass market-specific S14 Country Policy gate.

### Priority cross-universe loops

```text
Academy Skill → Partner Eligibility → Student Job / Helper → Business Demand
Local Demand → LO-05 Matching → Partner Earning → Account Settlement
Business Merchant → Runner/Delivery Job → Local Partner Supply
Travel Context → Airport/Local Assistance → Local Partner
SOS + Trust → Safer In-Person Work → Higher Marketplace Confidence
```

### Monetization posture

```text
PRIMARY=MARKETPLACE_LEAD_OR_TRANSACTION
SECONDARY=BUSINESS_SAAS_AND_DELIVERY_PLANS
OPTIONAL=PARTNER_SERVICES_OR_INSURANCE_REFERRAL_WHERE_ALLOWED
VARIABLE_COSTS=METERED_AND_HARD_CAPPED
NO_GLOBAL_FIXED_COMMISSION_ASSUMPTION=YES
```

Partner Economy phải chứng minh **cả hai phía economics**:

```text
PARTNER_NET_EARNING_SUSTAINABLE=YES
VIONA_CONTRIBUTION_MARGIN_NON_NEGATIVE_AT_SCALE_TARGET=YES
```

Không được “tăng trưởng” bằng cách bỏ qua provider cost, refunds, fraud loss, tax/settlement obligations hoặc safety operations.

---

## 6B. STRATEGIC EXECUTION UPDATE — BROKERAGE & MARKETPLACE ECONOMY

BME tạo một transaction network xuyên sáu universe nhưng không làm VIONA thành một marketplace đơn lẻ. Home vẫn orchestration; mỗi engine được kích hoạt qua module neo và shared sockets.

### 6B.1 Wave placement

**Wave A / A2 — bounded revenue proof**

- `BME-01`: Delivery / Errand / Local Helper / Student Jobs / Business Runner tại market đủ eligibility.
- `BME-04`: On-demand local services/handyman theo category đã trust-gated.
- `BME-05`: Expert marketplace và bounded job/freelance matching; employer pays where appropriate.

**Wave B — cross-universe transaction network**

- `BME-01`: licensed Viona Ride where market/license/insurance rules GREEN.
- `BME-02`: Travel Marketplace — hotel/provider booking, ground/rail/tours by provider readiness.
- `BME-03`: Home & Real Estate Marketplace — listing/lead/verified transaction support.
- `BME-05`: deeper Talent Marketplace linking Academy → Business.
- `BME-06`: B2B Supply Marketplace and logistics/provider matching.

**Selected Wave D — regulated brokerage pilots**

- `BME-07`: Money Marketplace; default provider-led routing/referral, not VIONA custody by assumption.
- `BME-08`: Trusted Professional Network for legal/health/tax/immigration contexts; high-trust human/provider-controlled execution.

### 6B.2 Cross-universe economic flywheel

```text
USER_OR_BUSINESS_NEED
→ VIONA_INTENT_AND_CONTEXT
→ DISCOVERY_AND_MATCHING
→ VERIFIED_SUPPLY
→ QUOTE_AND_POLICY
→ AUTHORITY
→ TRANSACTION_OR_REFERRAL
→ FULFILLMENT
→ SETTLEMENT_AND_COMMISSION
→ EVIDENCE_AND_TRUST
→ BETTER_FUTURE_MATCHING
```

Strategic principle:

> VIONA ưu tiên kiếm tiền khi người dùng/Partner/merchant **được phục vụ, kiếm được tiền, bán được hàng hoặc tiết kiệm được tiền**, thay vì chỉ tăng subscription bằng mọi giá.

### 6B.3 Brokerage revenue aggregation

Tám engine phải roll up vào một brokerage ledger view:

```text
BME_01_MOBILITY_REVENUE
BME_02_TRAVEL_COMMISSION
BME_03_REAL_ESTATE_LEAD_TRANSACTION_REVENUE
BME_04_SERVICE_MARKETPLACE_REVENUE
BME_05_TALENT_PLACEMENT_MARKETPLACE_REVENUE
BME_06_B2B_SUPPLY_TRANSACTION_SAVINGS_REVENUE
BME_07_MONEY_PROVIDER_REVENUE
BME_08_TRUSTED_PROFESSIONAL_REFERRAL_REVENUE
```

Không trộn gross transaction value với VIONA net revenue.

---

## 7. MACRO-DELEGATION EXECUTION RULES

Khi Operator yêu cầu triển khai một Module:

1. Sinh ra Hợp đồng Giao khoán Vĩ mô (Macro-Delegation Execution Mandate).
2. Chặn cứng `REMOTE_MUTATION_COUNT=0` và khóa quyền ghi (write) cho đến khi Operator rà soát SHA256.
3. Đảm bảo Integration Tests GREEN 100%, không phá vỡ trạng thái Sổ cái (Ledger) cốt lõi tại R9.
4. Mọi module có external effect phải có `MODULE_SOCKET_CONTRACT`, Authority class, Cost class, Evidence requirements và reconciliation path.
5. Với LO-05, mỗi **market × capability** là một activation unit độc lập; không được dùng một market GREEN để suy ra market khác GREEN.
6. AI/Swarm có thể phân tích, recommend, prepare và test offline; không được tự mở driver/partner eligibility, charge, payout, dispatch, location sharing hoặc provider execution.
7. Founder/Operator gate cuối cùng phải dựa trên exact evidence, không dựa trên self-reported PASS của Builder.
8. Với BME, mỗi `market × engine × capability × provider_or_supply_class` là activation unit độc lập.
9. Một engine chỉ được thu commission cho event đã định nghĩa rõ (`lead_qualified`, `booking_confirmed`, `fulfillment_completed`, `placement_closed`, `savings_realized`, v.v.); không accrue commission từ trạng thái mơ hồ.
10. Sponsored placement, organic ranking và Viona assistant recommendation phải được tách về evidence/telemetry; commission không được override safety/trust/policy.

---

## 8. FINAL MACHINE SUMMARY

```text
BLUEPRINT_VERSION=FINAL_V3_BROKERAGE_MARKETPLACE_ECONOMY_INTEGRATED
EXACT_MODULE_COUNT=63
EXACT_UNIVERSE_COUNT=6
LO_05_EXPANDED=YES
LO_05_SUBCAPABILITY_COUNT=6
TR_06_INTERNAL_BOOKING_CAPABILITY_COUNT=8
BROKERAGE_MARKETPLACE_ECONOMY_OFFICIAL=YES
BROKERAGE_ENGINE_COUNT=8
BROKERAGE_ENGINE_IS_MODULE=NO
BROKERAGE_ENGINE_IS_UNIVERSE=NO
NEW_TOP_LEVEL_MODULE_COUNT=0
HOME_IS_SEVENTH_UNIVERSE=NO
PARTNER_ECONOMY_IS_SEVENTH_UNIVERSE=NO
PARTNER_ECONOMY_HOME_UNIVERSE=Local
CROSS_UNIVERSE_INTEGRATION=YES

LO_05A_VIONA_RIDE=YES
LO_05B_VIONA_DELIVERY=YES
LO_05C_VIONA_ERRAND=YES
LO_05D_VIONA_LOCAL_HELPER=YES
LO_05E_VIONA_STUDENT_JOBS=YES
LO_05F_VIONA_BUSINESS_RUNNER=YES

COUNTRY_POLICY_GATE_MANDATORY=YES
RIGHT_TO_WORK_GATE_MANDATORY=YES
ROLE_SPECIFIC_LICENSE_GATE_MANDATORY=YES
TRUST_AND_SAFETY_GATE_MANDATORY=YES
PAYMENT_SETTLEMENT_GATE_MANDATORY=YES
AUTHORITY_GATE_MANDATORY=YES
COST_LEDGER_MANDATORY_FOR_VARIABLE_COST=YES
NO_FAKE_SUPPLY_OR_FULFILLMENT=YES
NO_UNGATED_AI_EXTERNAL_EFFECT=YES

RIDE_MARKET_BY_MARKET_ACTIVATION=YES
EARLY_NON_RIDE_PARTNER_PILOTS_ALLOWED_WHEN_GATED=YES
STUDENT_WORK_LIMITS_POLICY_DRIVEN=YES
PARTNER_INCOME_AS_PLATFORM_FLYWHEEL=YES
BME_01_MOBILITY_PARTNER_ECONOMY=YES
BME_02_TRAVEL_MARKETPLACE=YES
BME_03_HOME_REAL_ESTATE_MARKETPLACE=YES
BME_04_SERVICE_MARKETPLACE=YES
BME_05_TALENT_MARKETPLACE=YES
BME_06_B2B_SUPPLY_MARKETPLACE=YES
BME_07_MONEY_MARKETPLACE=YES
BME_08_TRUSTED_PROFESSIONAL_NETWORK=YES
USER_VALUE_BEFORE_COMMISSION=YES
SPONSORED_PLACEMENT_LABEL_REQUIRED=YES
MARKET_ENGINE_CAPABILITY_PROVIDER_ACTIVATION_UNIT=YES
```

---

## 9. SOURCE BASIS AND SUCCESSOR LAW

Source basis:

- `VIONA_POST_REC2_R9_EXPANSION_BLUEPRINT_MASTER_SOCKET_MAP_FINAL.md` — canonical 63-module concept inventory and original module descriptions.
- `VIONA_POST_R9_MODULE_PRIORITIZATION_AND_SOCKET_ARCHITECTURE_V1` — 20 shared sockets, Waves, risk/priority planning, cross-universe composition and module-contract execution model.
- Operator decision in the current VIONA project conversation — expand LO-05 into Viona Mobility & Partner Economy while preserving exactly 63 modules and 6 universes.
- Operator decision in the current VIONA project conversation — adopt **VIONA BROKERAGE & MARKETPLACE ECONOMY** as an official cross-universe layer covering exactly 8 brokerage engines while preserving exactly 6 universes and 63 modules.
- Current project governance — REC2-R9K as platform-kernel/controlled-pilot readiness; Wave A/B/C + selected D before public Grand Launch; remaining modules progressive thereafter.

Successor law:

```text
THIS_FINAL_V3_SUPERSEDES_FINAL_V2_FOR_BROKERAGE_MARKETPLACE_STRATEGY=YES
FINAL_V2_PARTNER_ECONOMY_DECISIONS_PRESERVED=YES
BROKERAGE_MARKETPLACE_ECONOMY_LAYER_ADOPTED=YES
BROKERAGE_ENGINE_COUNT=8
TR_06_INTERNAL_BOOKING_EXPANSION_ADOPTED=YES
ALL_63_TOP_LEVEL_MODULE_IDS_PRESERVED=YES
ORIGINAL_63_MODULE_COUNT_PRESERVED=YES
LO_05_SUBCAPABILITIES_ARE_NOT_NEW_TOP_LEVEL_MODULES=YES
IMPLEMENTATION_AUTHORITY_GRANTED_BY_BLUEPRINT=NO
COUNTRY_OR_CITY_PRODUCTION_CLAIM_GRANTED_BY_BLUEPRINT=NO
```

