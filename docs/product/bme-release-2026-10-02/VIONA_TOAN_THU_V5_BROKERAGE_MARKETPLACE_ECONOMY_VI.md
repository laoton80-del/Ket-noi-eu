# VIONA — CẨM NANG TOÀN THƯ V5 — BROKERAGE & MARKETPLACE ECONOMY INTEGRATED

**Ấn bản:** 02/10/2026 · Tiếng Việt · 4 tập · 63 module · 8 brokerage engine · LO-05 có 6 capability nội bộ · TR-06 có 8 capability booking nội bộ · 20 runbook

Đây là tài liệu tham chiếu. Các phần kỹ thuật bổ sung được gắn nhãn thiết kế tham chiếu; không là implementation, runtime proof hoặc execution authority.


## Cách đọc bộ toàn thư
**Tập 1 • MỞ ĐẦU**
**Phạm vi:** NGUỒN / PHẠM VI BIÊN SOẠN
**Nguồn:** D01–D07; quyết định Operator trong cuộc trò chuyện

Một bản đồ sản phẩm, một bộ hợp đồng năng lực và một sổ tay vận hành; không phải giấy phép để tác tử tự thi công.

### Ba tuyến đọc

Founder đọc Tập I rồi dashboard/gate ở Tập II; đội Product đọc cả hồ sơ 63 module; kỹ sư đọc Tập II và Tập IV trước khi chuyển một mục thành implementation contract. Mỗi hồ sơ module kết nối nhu cầu người dùng với dữ liệu, lệnh, test và điều kiện dừng.

### Bốn nhãn phân biệt

| Nhãn | Ý nghĩa |
| --- | --- |
| NGUỒN / ĐÃ CHỐT | Ý định, luật hoặc direction được tài liệu/Operator nêu. Không đồng nghĩa code đã có. |
| THIẾT KẾ THAM CHIẾU | Diễn giải kỹ thuật và quy trình bổ sung trong sách. Cần ADR, scope và review trước triển khai. |
| BÁO CÁO LỊCH SỬ | Trạng thái từ chuỗi công việc đã cung cấp; không phải kiểm tra live Git/Windows/provider. |
| CÒN MỞ | Thiếu quyết định, proof hoặc partner; không gán PASS bằng suy luận. |

### Cách dùng nguồn

Mã D chỉ tài liệu dự án; E chỉ evidence/architecture artifacts; W chỉ tài liệu kỹ thuật công khai; O chỉ quyết định Operator trong cuộc trò chuyện. Danh mục cuối sách ghi tên và hash của file thực đọc. Mã nguồn ví dụ, schema và tên event trong sách là reference design trừ khi ghi rõ khác.

### Ranh giới của sách

Sách không thay Operating Protocol, exact manifest, review receipt hay authority packet. Không tự đổi roadmap canonical trong repository, không cấp quyền build/deploy/payment/provider và không chứng minh một tính năng đang live.


## Phạm vi, phiên bản và độ chắc chắn
**Tập 1 • MỞ ĐẦU**
**Phạm vi:** PHẠM VI / CÒN MỞ
**Nguồn:** D01–D12; E01–E06; O01–O05

Ấn bản toàn thư V5 • Brokerage & Marketplace Economy Integrated • tiếng Việt • chốt nội dung ngày 02/10/2026 trên nguồn đã cung cấp.

### Có trong bản này

Định vị, sáu universe, Home/Viona, roadmap R0–R9K và Post-R9, Voice/Proactive, toàn bộ 63 mã module, Partner Economy trong LO-05, **VIONA Brokerage & Marketplace Economy** với 8 brokerage engine xuyên sáu universe, Travel Booking/Distribution trong TR-06, shared sockets, dữ liệu/API reference, economics, Swarm, QA, vận hành, bootstrap hiện tại và cách xử lý bằng chứng.

### Chưa thể gọi là hồ sơ triển khai hoàn chỉnh

Nguồn chưa có schema/API production, provider contracts, legal clearance, actual performance, toàn bộ code audit và budgets được phê duyệt cho từng module. Sách không lấp chỗ trống bằng cách tự tuyên bố chúng đã có; mỗi mục kỹ thuật mới được ghi là thiết kế tham chiếu.

### Cập nhật trọng tâm của V5

V5 giữ nguyên toàn bộ Partner Economy của D11 và tiếp nhận `VIONA_POST_REC2_R9_EXPANSION_BLUEPRINT_MASTER_SOCKET_MAP_FINAL_V3_BROKERAGE_MARKETPLACE_ECONOMY.md` (D12) như successor cho **lớp kinh tế môi giới/marketplace xuyên sáu universe**. Module count vẫn **63**; `BME-01..08` là economic engines chứ không phải module; `LO-05A..F` và `TR-06A..H` là capability nội bộ chứ không tăng top-level inventory.

Partner Economy được neo ở Local nhưng dùng Account để quản lý identity/eligibility/payout, Business để tạo demand, Academy để tạo skill supply, Travel để tạo nhu cầu hỗ trợ địa phương và SOS để bảo vệ các công việc gặp mặt trực tiếp. Mọi market × capability chỉ được mở sau Country Policy, Authority, Payment/Settlement, Trust/Safety và Cost/Margin gates tương ứng.

**Brokerage & Marketplace Economy** gom 8 engine: Mobility/Partner, Travel, Home/Real Estate, Services, Talent, B2B Supply, Money và Trusted Professional Network. Mỗi engine chỉ là lớp orchestration kinh tế trên module hiện hữu; activation theo `market × engine × capability × provider/supply class`, không suy ra live/legality chỉ vì có trong blueprint.

### Không đồng nhất các lớp trạng thái

| Trạng thái | Điều nó thực sự cho biết |
| --- | --- |
| Có trong blueprint | Nằm trong tầm nhìn và phạm vi cần xem xét. |
| Source review GREEN | Một artifact nguồn đã qua review trong phạm vi xác định. |
| Runtime proof PASS | Một phép thử cụ thể đã chạy với context/evidence cụ thể. |
| Production ready | Toàn bộ gate của scope, country, provider và operation đã đạt. |
| Live / launch | Có quyết định activation và quan sát vận hành thật. |

### Cam kết về tính trung thực

Không tuyên bố 63 module đã được code; không tuyên bố Viona chắc chắn giải cứu, phát hiện mọi lừa đảo, chẩn đoán bệnh hoặc không bao giờ lỗ. Những cụm tuyệt đối trong catalog gốc được bảo tồn như ý tưởng nguồn, kèm giới hạn triển khai.


## VIONA là gì?
**Tập 1 • 01 · BẢN SẮC**
**Phạm vi:** NGUỒN / ĐÃ CHỐT
**Nguồn:** D01; D02 §§1–3; D03 §§1–3

Global Vietnamese Companion OS: giúp người Việt sống, học, đi lại và kinh doanh xuyên biên giới bằng một trải nghiệm liên tục.

### Một lời hứa dễ hiểu

Viona hiểu tình huống, nhận ra điều hữu ích sắp tới, chuẩn bị phương án và thực hiện trong phạm vi người dùng cho phép. Giá trị không nằm ở số chatbot, số màn hình hay số module; nó nằm ở việc giảm công sức, rủi ro ngôn ngữ và chi phí xử lý việc thật.

### OS ở đây nghĩa là gì

Companion OS là cách tổ chức ngữ cảnh, năng lực và quyền trên đời sống. Không phải hệ điều hành thay Windows/iOS/Android. React Native/Expo/TypeScript là hướng codebase đã nêu; native Windows token/ACL là một lane bootstrap của máy thi công, không phải kernel sản phẩm toàn cầu.

### Vòng giá trị

Hiểu việc → Chuẩn bị → Xin quyền → Thực hiện → Đối soát → Theo dõi

### Không thu hẹp VIONA

Không biến VIONA thành app booking, OTA, ví, CRM, translator hoặc AI demo đơn lẻ. Những năng lực đó là phần bên trong sáu universe và phải liên kết qua Account, Viona, authority, cost và history.

### Đích Grand Launch mới

Người dùng có thể nói: “Viona hiểu tình huống của tôi và chủ động giúp tôi trước khi tôi phải tự nghĩ ra mọi bước.” Đây là mục tiêu trải nghiệm cần pilot chứng minh, không phải slogan thay cho evidence.


## Sáu universe, không hơn không kém
**Tập 1 • 01 · BẢN SẮC**
**Phạm vi:** NGUỒN / ĐÃ CHỐT
**Nguồn:** D01; D02 §§3–4; D03

Home điều phối; Viona đại diện trợ lý; universe là miền sản phẩm bền vững.

### Bản đồ sản phẩm

| Universe | Việc chính | Trách nhiệm liên kết |
| --- | --- | --- |
| Local | Sống tốt mỗi ngày: dịch vụ, cộng đồng, công việc đời sống. | Discovery → request → kết quả thật từ Business. |
| Travel | Trước, trong, sau chuyến đi và di chuyển xuyên biên giới. | Ngữ cảnh hành trình → ngôn ngữ → provider → safety. |
| Academy | Ngôn ngữ, kỹ năng, văn hóa, tri thức và nghề nghiệp. | Learning evidence → practice → cơ hội phù hợp. |
| Business | Vận hành doanh nghiệp, khách hàng và tăng trưởng. | Merchant truth, calendar, price, request và service outcome. |
| Account | Danh tính, consent, memory, quyền lợi và lịch sử. | Control plane của người dùng; không tự custody tài chính. |
| SOS | Trợ giúp an toàn, reachable và truthful. | Core miễn phí; escalations có policy, không fake dispatch. |

### Home không là universe thứ bảy

Home chọn điều gì nên hiện ngay bây giờ: tiếp tục việc, lời nhắc có ích, sáu launcher và lối vào Viona/SOS/Account. Nó không sở hữu domain booking hay money, và không trở thành tường 50 card.

### Specialists

Leona, Minh Khang, Cô Giáo AI và Lễ Tân AI là chuyên môn/ngữ cảnh nằm dưới public assistant Viona. Persona không tự tạo credential, quyền ghi dữ liệu hay ngân sách.

### Tên gọi

Wordmark: VIONA. Public assistant: Viona. Alfred chỉ giữ ở technical/historical context khi cần; không mass-rename archive hoặc giả đã thay toàn bộ UI.


## Người dùng và nhu cầu ưu tiên
**Tập 1 • 01 · BẢN SẮC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02; D03 §§8–10,17; thiết kế persona tham chiếu

Khởi đầu từ việc khó và lặp lại, không từ một danh sách tính năng dài.

### Bốn chân dung triển khai

| Nhóm | Nỗi đau | Khoảnh khắc giá trị |
| --- | --- | --- |
| Người Việt mới tới | Ngôn ngữ, giấy tờ, tìm dịch vụ, không biết hỏi ai. | Hiểu một công văn và chuẩn bị cuộc gọi đúng chỗ. |
| Sinh viên/người mới định cư muốn tăng thu nhập | Không biết mình được phép làm loại việc nào, tìm gig ở đâu, nhận tiền và bảo vệ an toàn ra sao. | Account xác định eligibility; LO-05 đưa đúng earning mode, matching, settlement và safety theo market. |
| Gia đình định cư | Lịch, trường học, ngôn ngữ thế hệ sau, chăm sóc người thân. | Một việc được chuẩn bị từ ngữ cảnh và nhắc đúng lúc. |
| Chủ doanh nghiệp | Bỏ lỡ cuộc gọi, lịch chồng, nhân viên và follow-up khách. | Viona nghe máy, chốt booking thật và có thể tạo runner/delivery demand cho Partner đủ điều kiện. |
| Người đi lại/quay về Việt Nam | Hành trình gián đoạn, ngôn ngữ, logistics và safety. | Phương án đi lại mới được chuẩn bị trước khi phải tự xoay xở. |

### Cách chọn một journey cho pilot

1. Phỏng vấn một nhóm cụ thể; ghi tần suất, thời gian và rủi ro của việc hiện tại.
2. Quan sát baseline xử lý không có AI; không chỉ hỏi người dùng có thích app không.
3. Chọn một outcome có thể đối soát: booking xác nhận, hồ sơ chuẩn bị đủ hoặc missed call được xử lý.
4. So sánh kết quả, chi phí, lỗi và mức tin cậy sau pilot.
5. Chỉ mở rộng khi ích lợi được lặp lại và vận hành không vượt giới hạn.

### Sức hút có trách nhiệm

Tối ưu hữu ích, kiểm soát và quay lại tự nguyện. Không thiết kế phụ thuộc cảm xúc, thông báo gây lo âu, dark pattern hay ép bật mọi quyền để tăng retention.


## Một ngày cùng Viona
**Tập 1 • 01 · BẢN SẮC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §§3,15,17; reference journey

Một ví dụ định hướng sản phẩm; không phải mô tả chức năng đã live.

### Consumer → companion

1. Buổi sáng: Account cho phép nhắc lịch và preference; Home hiện một lịch cần chuẩn bị, không quét mọi dữ liệu cá nhân.
2. Buổi trưa: người dùng yêu cầu gọi garage bằng tiếng Czech; Viona xác nhận mục đích, khung giờ, giá trần và dữ liệu được chia sẻ.
3. Trong cuộc gọi: quote vượt ngân sách thì Viona không cam kết; hỏi lựa chọn khác hoặc handoff người thật.
4. Sau cuộc gọi: chỉ khi garage xác nhận đầy đủ mới lưu booking; call completed nhưng chưa chốt lịch vẫn là chưa có booking.
5. Buổi tối: Academy đề xuất luyện các câu đã gặp nếu người dùng đồng ý; không tự sử dụng transcript nhạy cảm cho học hoặc training.

### Proactive ở Wave C

Lần sau, Viona có thể nhận tín hiệu lịch kiểm tra xe sắp tới, kiểm tra dữ liệu đủ mới và chuẩn bị đề nghị gọi. Người dùng vẫn có quyền không nhận nhắc, sửa constraint và từ chối action.

### Những điều phải nhìn thấy trên UI

Lý do gợi ý; dữ liệu nào đã dùng; điều gì còn chưa chắc; chi phí tối đa; action nào sẽ xảy ra; có thể hủy tới lúc nào; ai đã xác nhận outcome. “Tôi đã làm” phải trỏ tới receipt thật.

### Acceptance của journey

Không vượt authority; không duplicate call; không bịa giá/availability; người dùng hiểu outcome; history có provenance; cost được settle hoặc giữ reserve đúng trạng thái.


## Một ngày của doanh nghiệp
**Tập 1 • 01 · BẢN SẮC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02; D03 §§9–11; D04

Business là nơi lời hứa của Voice phải trở thành lịch, dịch vụ và doanh thu có thật.

### Merchant → operations

1. Chủ salon cấu hình dịch vụ, duration, staff skills, giá và giờ nghỉ. Thông tin này có version, effective date và người duyệt.
2. Số điện thoại provider/forwarding nhận cuộc gọi; Viona công bố là trợ lý, nhận ngôn ngữ và nhu cầu.
3. Read API cung cấp quote và slot; caller xác nhận thông tin quan trọng. Mọi hold/booking chạy command service riêng.
4. Nếu calendar đổi trước commit, service từ chối phiên bản cũ; Viona xin chọn slot khác thay vì nói đã đặt.
5. Cuối ngày: chủ salon thấy lịch xác nhận, cuộc gọi cần callback, chi phí Voice và lý do handoff, không chỉ một transcript dài.

### Chủ động nhưng không tự ý

Wave C có thể nhận ra slot trống và chuẩn bị chiến dịch nhắc khách đã opt-in. Không tự chọn người nhận nhạy cảm, gửi quảng cáo hoặc giảm giá ngoài policy.

### Đo đúng hiệu quả

| Đo | Không thay bằng |
| --- | --- |
| Booking được đối soát | Số phút AI nói chuyện |
| Thời gian chủ tiệm tiết kiệm | Tỷ lệ containment bằng mọi giá |
| Net contribution sau chi phí | GMV chưa trừ refund/fees |
| Khách hài lòng và ít cam kết sai | Giọng nói nghe có vẻ tự tin |

### Authority thường trực

Merchant có thể phê duyệt policy thường trực. Mỗi cuộc gọi vẫn phải được máy dẫn xuất một authority giới hạn; không coi policy là quyền vô hạn cho model.


## Home, Viona và thiết kế premium
**Tập 1 • 01 · BẢN SẮC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D01; D09; D02 §§7–8; W06

Đẹp phải đi cùng dễ hiểu, dễ thao tác và biết đâu là sự thật.

### Cấu trúc Home

Header ngữ cảnh và Account; entry Viona; Continue/việc quan trọng; sáu universe launcher; quick actions theo permission; discovery có relevance; SOS reachable. Không để quảng cáo đẩy trợ giúp quan trọng xuống dưới.

### Ngôn ngữ thị giác

Midnight/deep navy, hình ảnh cinematic, V-core trừu tượng; cyan cho điều phối, violet cho học, emerald cho tăng trưởng, rose cho safety, gold dùng tiết chế. Trạng thái phải có chữ/icon, không chỉ màu.

### Thi công UX

1. Inventory component thực có và token màu/type/spacing.
2. Thiết kế desktop/tablet/mobile với font lớn và ngôn ngữ dài.
3. Xây semantic state loading, empty, offline, denied, pending, confirmed.
4. Kiểm keyboard/focus, screen-reader, contrast, safe-area và touch trên runtime thật.
5. Thu evidence từ app build/device đã xác định; screenshot mockup chỉ là design reference.

### Khả năng tiếp cận

WCAG 2.2 là nguồn tham khảo cho web: contrast tối thiểu 4,5:1 với chữ thường, 3:1 với chữ lớn; target size và các ngoại lệ phải đánh giá đúng tiêu chí. Native có quy ước nền tảng riêng; không tuyên bố pass accessibility từ một screenshot.

### Copy truthful

Dùng “Đang gửi”, “Đang chờ xác nhận”, “Chưa đối soát” thay vì “Đã xong” khi chỉ có API accepted. CTA tốn tiền nêu rõ trần và phạm vi.


## Những luật không được trượt
**Tập 1 • 01 · BẢN SẮC**
**Phạm vi:** NGUỒN / ĐÃ CHỐT
**Nguồn:** D01; D04; D07

Phân biệt sản phẩm, năng lực, thẩm quyền và bằng chứng.

### Luật nền tảng

| Luật | Áp dụng thực tế |
| --- | --- |
| Capability ≠ Authority | Có API/native binding không có nghĩa được dùng tạo effect. |
| Vision ≠ Live | Module trong blueprint không phải feature production. |
| Hash ≠ Approval | SHA xác định bytes; phải có review và approval có phạm vi. |
| Model mạnh ≠ Quyền lớn | TIER_X không tự mở thanh toán, gọi điện hay đổi ACL. |
| Prepare ≠ Execute | Draft không mang credential hoặc quyền tự thăng cấp. |
| Provider accepted ≠ Outcome | Cần readback/reconciliation theo domain. |
| No-function-removal | Năng lực chưa sẵn sàng được gate/lite, không fake hoặc xóa âm thầm. |
| SOS Core free | Không paywall trợ giúp cốt lõi, không pay-to-be-rescued. |

### No retry phải đọc đúng scope

Voice external attempt và các bootstrap one-shot đang có retry=0 không được thử lại với cùng authority. Điều này không phải lệnh cấm mọi đọc lại hoặc mọi retry transaction nội bộ của toàn sản phẩm. Mỗi lớp phải có policy riêng và không sinh external effect trùng.

### Không tuyệt đối hóa bảo mật

Exact DACL, pinned handle, hash chain và token check là control có phạm vi. Không được diễn giải thành chống mọi host compromise, không bao giờ thất bại hoặc mọi principal đều không thể can thiệp.


## Bản đồ từ hôm nay tới Grand Launch
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN / ĐÃ CHỐT
**Nguồn:** D03 §§4–7,13–18; O01

Grand Launch chuyển sau Wave C và một phần Wave D được chọn; R9 là readiness của kernel và pilot.

### Chuỗi đích

R0–R2 → R3–R5 → R6–R8 → R9K / pilot → A → B → C / D-select → Grand Launch

### Bốn chặng

| Chặng | Điều phải đạt |
| --- | --- |
| Foundation | Canonical/governance, platform contracts, root/build gates và entry gate. |
| REC2 sản phẩm | Home/shell, vòng Local↔Business, sáu universe, Voice có kiểm soát, production hardening và supply. |
| Post-R9 trước launch | Pilot có người thật; A revenue/voice/trust, B liên thông, C chủ động, D-select high-trust được duyệt. |
| Sau Public Grand Launch | Ổn định vận hành rồi mở module còn lại theo evidence, không chạy 63 backend riêng. |

### R9K là ký hiệu đọc dễ hiểu

Trong sách, R9K nhắc vai trò mới của REC2-R9: Platform Kernel + Controlled Founding Pilot Ready. Không âm thầm đổi ID trong artifact cũ hoặc tự tạo một phase repository mới.

### Chưa có ETA đáng tin

Nguồn chưa có capacity/supply/budget và dữ liệu runtime đủ để ước tính ngày Grand Launch. Không dùng số packet đã tạo hay số trang sách làm phần trăm tiến độ.


## Hiện trạng: điều gì đã có, điều gì chưa
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** BÁO CÁO LỊCH SỬ
**Nguồn:** D10; E01–E06; O02–O03; conversation reports

Snapshot biên tập theo chuỗi đã cung cấp, không phải một lần kiểm tra live hệ thống.

### Bảng trạng thái

| Hạng mục | Tình trạng và giới hạn |
| --- | --- |
| Grand Launch successor | Founder đã chọn C + D-select trước launch; sách không tự cập nhật repo. |
| 11-gate execution packet V5.1 | Được review GREEN trong cuộc trò chuyện; chưa là execution authority; không có proof 11/11 runtime. |
| Scratch/token architecture | Có Base V1 và token continuity V1.3; creator V2 còn blocker/Authz/provenance theo review. |
| Access-matrix clarification | Nội dung reviewed; hai procedural deviations được chấp nhận làm review inputs; semantic adoption được Operator chốt riêng. |
| Authz Decision V1.2 | Lane preparation đã được yêu cầu; chưa có report/artifact hoàn tất trong phạm vi snapshot này. |
| Helper/scratch/DEP01 | Chưa có bằng chứng build helper, tạo root và DEP01 final green. DEP05 là dependency riêng còn chặn theo report. |
| REC2-R3 Swarm | Không tự mở vì một architecture addendum GREEN; entry gate vẫn cần closure đầy đủ. |

### Tài sản lịch sử không mất

Request API, status/idempotency, modern mobile-web shell, SOS/profile/language consolidation, provider/recovery và staging QA đã có nhiều báo cáo lịch sử. Chúng là reuse candidates; phải fresh inventory và regression trước khi tính là REC2 phase closed.

### Điểm gần nhất cần nhìn

Chốt Decision kế nhiệm → review → các gate bootstrap hợp lệ → helper/creator đủ proof → scratch seal → authority cho experiment → runtime evidence → DEP01 closure. Chuỗi này chưa phải product Voice đã live.


## REC2-R0 · Canonical và governance
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + TRÌNH TỰ THAM CHIẾU
**Nguồn:** D02 §16; D03; D07

Một bộ luật sản phẩm/authority và bản đồ nguồn không mâu thuẫn.

### Trình tự phải làm

1. Đọc protocol, final lock và successor; xác định precedence.
2. Inventory code/feature không xóa chức năng.
3. Đối soát publication/governance và evidence.
4. Phân loại hiện vật historical/candidate/adopted.
5. Đóng entry gates bằng readback và cập nhật handoff.

### Đầu ra phải tồn tại

Canonical source register; capability inventory; adoption decisions; protected publication evidence.

### Kiểm chứng riêng của phase

| Kiểm | Bằng chứng phải có |
| --- | --- |
| Nguồn điều khiển | Version/precedence và phạm vi adoption rõ; không dùng bản mô tả cũ để ghi đè successor. |
| Authority history | Consumed/failed/unknown được giữ và không tự refresh bởi prompt. |
| Entry readiness | Publication/root gates cần evidence thật; handbook không thay gate receipt. |

### Exit gate

Phạm vi đã review + implementation/runtime evidence cần thiết + không còn blocker bắt buộc + Operator quyết định closure/activation đúng lớp. Tests PASS chỉ có nghĩa cho bộ test đã định nghĩa, không thay evidence vận hành.

### Dừng khi

Không có nguồn controlling rõ; stale hash; không biết authority đã consumed hay chưa.


## REC2-R1 · Hợp đồng sản phẩm
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + TRÌNH TỰ THAM CHIẾU
**Nguồn:** D02 §16; D03; D07

Mọi đội hiểu cùng một user journey, state machine và định nghĩa thành công.

### Trình tự phải làm

1. Chọn journey Local→Business ưu tiên.
2. Định nghĩa request/booking/cancel/reschedule/decline/expiry/unknown.
3. Chốt chủ sở hữu trạng thái và schema.
4. Viết negative cases, permission và consent.
5. Review UX copy cùng domain transition trước code.

### Đầu ra phải tồn tại

Journey contract; transition matrix; event schema; error taxonomy; acceptance scenarios.

### Kiểm chứng riêng của phase

| Kiểm | Bằng chứng phải có |
| --- | --- |
| State agreement | Designer/Builder/Verifier cùng hiểu request, held, confirmed, canceled và unknown. |
| Constraint examples | Có ca giá thay đổi, slot mất, expiry, duplicate và user revoke; UI copy khớp từng state. |
| Data ownership | Một domain owner cho mỗi transition; hành động consequential có approval/cost plan. |

### Exit gate

Phạm vi đã review + implementation/runtime evidence cần thiết + không còn blocker bắt buộc + Operator quyết định closure/activation đúng lớp. Tests PASS chỉ có nghĩa cho bộ test đã định nghĩa, không thay evidence vận hành.

### Dừng khi

Request bị gọi là booking; người dùng không biết đang chờ; action không có owner hoặc failure law.


## REC2-R2 · Nền tảng dùng chung
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + TRÌNH TỰ THAM CHIẾU
**Nguồn:** D02 §16; D03; D07

Identity, tenant, contracts, authority/cost/evidence và recovery có ranh giới thực.

### Trình tự phải làm

1. Lập ownership map cho service/entity.
2. Thiết kế authn/authz/tenant propagation.
3. Xây idempotency/outbox/reconciliation và budget reservation.
4. Kiểm cross-tenant negative cases, offline/degraded states.
5. Đóng nền tảng và governance entry gate trước Swarm UI.

### Đầu ra phải tồn tại

Typed contracts; tenant tests; ledger invariants; audit trail; capability registry; telemetry/config.

### Kiểm chứng riêng của phase

| Kiểm | Bằng chứng phải có |
| --- | --- |
| Tenant isolation | Negative cases xuyên API, worker, cache, retrieval và history. |
| Consistency | Budget reservation, idempotency và outbox không sinh double effects trong test scope. |
| Degraded behavior | Offline/pending/unknown có owner và recovery; không biến thiếu dữ liệu thành success. |

### Exit gate

Phạm vi đã review + implementation/runtime evidence cần thiết + không còn blocker bắt buộc + Operator quyết định closure/activation đúng lớp. Tests PASS chỉ có nghĩa cho bộ test đã định nghĩa, không thay evidence vận hành.

### Dừng khi

AI ghi DB trực tiếp; timeout thành success; thiếu budget hoặc cross-tenant isolation.


## REC2-R3 · Design System, Home và Shell
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + TRÌNH TỰ THAM CHIẾU
**Nguồn:** D02 §16; D03; D07

Trải nghiệm sáu universe nhất quán, premium và accessible trên runtime thật.

### Trình tự phải làm

1. Wave 0 inventory/DAG/write set.
2. Xây token/component nền dùng chung.
3. Tích hợp Home, shell, sáu launcher và Viona entry.
4. Test web/tablet/native theo activation matrix.
5. Review actual-app evidence và đóng regression.

### Đầu ra phải tồn tại

R3 master manifest; design tokens; responsive/a11y evidence; candidate exact hash; review.

### Kiểm chứng riêng của phase

| Kiểm | Bằng chứng phải có |
| --- | --- |
| Visual proof | Screenshots từ actual build, xác định device/viewport/font scale và activation matrix. |
| Interaction proof | Navigation, SOS/Account reachability, focus/keyboard, screen-reader và touch không lỗi. |
| Regression proof | Legacy capability giữ/gated đúng, không bất ngờ kích hoạt provider/API mutation. |

### Exit gate

Phạm vi đã review + implementation/runtime evidence cần thiết + không còn blocker bắt buộc + Operator quyết định closure/activation đúng lớp. Tests PASS chỉ có nghĩa cho bộ test đã định nghĩa, không thay evidence vận hành.

### Dừng khi

Dùng mockup thay runtime; bỏ reachability SOS; activate native/web ngoài scope.


## REC2-R4 · Account, Viona và vòng kinh doanh đầu tiên
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + TRÌNH TỰ THAM CHIẾU
**Nguồn:** D02 §16; D03; D07

Consumer gửi nhu cầu, merchant xử lý, người dùng nhận kết quả và history đúng.

### Trình tự phải làm

1. Account chốt consent/profile/entitlement/history.
2. Viona intent→specialist→gates.
3. Local discovery tạo request.
4. Business action hợp lệ phát domain outcome.
5. Consumer/Account nhận cùng source truth và đối soát.

### Đầu ra phải tồn tại

End-to-end vertical slice; owner-only transitions; duplicate/timeout tests; outcome history.

### Kiểm chứng riêng của phase

| Kiểm | Bằng chứng phải có |
| --- | --- |
| End-to-end receipt | Một request thực đi qua merchant action đến consumer/history với cùng IDs. |
| Authority proof | Người không sở hữu không transition được; revoked permission bị chặn. |
| Failure proof | Timeout/duplicate/decline không tạo false booking; UI và domain cùng truth. |

### Exit gate

Phạm vi đã review + implementation/runtime evidence cần thiết + không còn blocker bắt buộc + Operator quyết định closure/activation đúng lớp. Tests PASS chỉ có nghĩa cho bộ test đã định nghĩa, không thay evidence vận hành.

### Dừng khi

Consumer thấy success khi merchant chưa nhận; retry tạo request trùng; quyền owner không được check.


## REC2-R5 · Đào sâu sáu universe
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + TRÌNH TỰ THAM CHIẾU
**Nguồn:** D02 §16; D03; D07

Mỗi miền có hành trình đủ sâu, không chỉ landing page đẹp.

### Trình tự phải làm

1. Inventory depth/gaps theo universe.
2. Chọn outcome có supply/data thật.
3. Reuse shared foundation và contracts.
4. Test hành trình normal/degraded/error đa ngôn ngữ.
5. Gắn availability theo market/category và đưa vào capability registry.

### Đầu ra phải tồn tại

Six-universe journey matrix; privacy/cost contracts; fulfillment evidence; truthful gating.

### Kiểm chứng riêng của phase

| Kiểm | Bằng chứng phải có |
| --- | --- |
| Depth proof | Không chỉ hub: mỗi journey có detail, action, outcome, error, follow-up và retention. |
| Coverage truth | Capability registry nêu market/provider/device hỗ trợ và trạng thái gated. |
| Cross-universe proof | Context chuyển đúng consent, không sao chép money/privacy logic hoặc leak data. |

### Exit gate

Phạm vi đã review + implementation/runtime evidence cần thiết + không còn blocker bắt buộc + Operator quyết định closure/activation đúng lớp. Tests PASS chỉ có nghĩa cho bộ test đã định nghĩa, không thay evidence vận hành.

### Dừng khi

Travel/Academy/SOS chỉ mock nhưng gọi production; duplicated backend/cost logic.


## REC2-R6 · Voice và AI thực thi có kiểm soát
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + TRÌNH TỰ THAM CHIẾU
**Nguồn:** D02 §16; D03; D07

Outbound consumer, inbound receptionist và interpreter có pilot kết quả thật.

### Trình tự phải làm

1. Chốt provider/country/language scope.
2. Xây prepare-authority-cost barrier và deterministic tools.
3. Tích hợp number/routing, consent/disclosure, human transfer.
4. Test caps, unknown, interruption, incorrect commitment.
5. Chạy authorized pilot và review evidence trước mở rộng.

### Đầu ra phải tồn tại

Voice envelope; call/provider adapters; call+booking+cost records; telemetry; human fallback.

### Kiểm chứng riêng của phase

| Kiểm | Bằng chứng phải có |
| --- | --- |
| Voice evidence | Provider connection khác business outcome; ba mode có scope và receipts riêng. |
| Budget/safety | Caps, consent, disclosure, no same-UUID retry, no fabricated commitment được test. |
| Human fallback | Người nhận/hours/cost của handoff có thật; không chỉ vẽ nút chuyển người. |

### Exit gate

Phạm vi đã review + implementation/runtime evidence cần thiết + không còn blocker bắt buộc + Operator quyết định closure/activation đúng lớp. Tests PASS chỉ có nghĩa cho bộ test đã định nghĩa, không thay evidence vận hành.

### Dừng khi

Unlimited calls; same-UUID retry; giả người dùng; bịa booking/price; không có kill switch.


## REC2-R7 · Production hardening
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + TRÌNH TỰ THAM CHIẾU
**Nguồn:** D02 §16; D03; D07

Hệ thống chịu lỗi, bảo vệ tiền/dữ liệu và có thể vận hành an toàn.

### Trình tự phải làm

1. Diễn tập provider failure/out-of-order webhook.
2. Đóng payment/refund/ledger/privacy.
3. Test secrets, tenant, backup/restore và rollback.
4. Thiết lập alert/on-call/support.
5. Independent security review cho đúng release scope.

### Đầu ra phải tồn tại

Incident drills; recovery evidence; deployment rollback; observability; compliance readiness.

### Kiểm chứng riêng của phase

| Kiểm | Bằng chứng phải có |
| --- | --- |
| Operational proof | On-call, incident severity, alerts, kill switch, restore và rollback đã diễn tập. |
| Money/privacy proof | Webhook/reconciliation/refund và data-lifecycle cases có evidence. |
| Release proof | Exact artifact/config, compatibility, migrations nếu có và authority từng effect. |

### Exit gate

Phạm vi đã review + implementation/runtime evidence cần thiết + không còn blocker bắt buộc + Operator quyết định closure/activation đúng lớp. Tests PASS chỉ có nghĩa cho bộ test đã định nghĩa, không thay evidence vận hành.

### Dừng khi

Backup chưa restore thử; rollback chỉ undo code nhưng bỏ side effects; telemetry thiếu correlation.


## REC2-R8 · Thị trường khai sinh và supply
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + TRÌNH TỰ THAM CHIẾU
**Nguồn:** D02 §16; D03; D07

Global architecture nhưng activation đúng country/city/category có dịch vụ thật.

### Trình tự phải làm

1. Chọn địa bàn tham chiếu, ví dụ Czechia trong founding cluster.
2. Xác minh merchant/provider/support language.
3. Hoàn chỉnh country policy, economics, voice legality.
4. Test transactions với đối tác thật trong scope.
5. Phê duyệt activation từng ô coverage.

### Đầu ra phải tồn tại

Market pack; verified supply; provider/cost/legal gates; support availability; rollout plan.

### Kiểm chứng riêng của phase

| Kiểm | Bằng chứng phải có |
| --- | --- |
| Supply proof | Merchant và provider nhận/hoàn tất được việc trong city/category cụ thể. |
| Local readiness | Ngôn ngữ, thời gian, phí/thuế, disclosure, safety contacts và support được review. |
| Commercial truth | Claim marketing không vượt ô coverage đã được activation. |

### Exit gate

Phạm vi đã review + implementation/runtime evidence cần thiết + không còn blocker bắt buộc + Operator quyết định closure/activation đúng lớp. Tests PASS chỉ có nghĩa cho bộ test đã định nghĩa, không thay evidence vận hành.

### Dừng khi

App tải được bị coi là toàn quốc live; supplier giả; không hỗ trợ múi giờ/ngôn ngữ địa phương.


## REC2-R9K · Kernel và pilot readiness
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + TRÌNH TỰ THAM CHIẾU
**Nguồn:** D02 §16; D03; D07

Nền tảng sẵn sàng cho Controlled Founding Pilot; chưa Public Grand Launch.

### Trình tự phải làm

1. Consolidate release scope và evidence R0–R8.
2. Xác minh authority/cost/outcome closure.
3. Chốt cohort, feature flags, quota, human fallback.
4. Bật controlled pilot dưới authority riêng.
5. Thu evidence để quyết định Wave A/B/C/D-select.

### Đầu ra phải tồn tại

Kernel readiness dossier; pilot charter; exact scope; kill/rollback; support/cost capacity.

### Kiểm chứng riêng của phase

| Kiểm | Bằng chứng phải có |
| --- | --- |
| Kernel scope | Các capability được mở có đầy đủ prerequisite/evidence, không chỉ code exists. |
| Pilot charter | Cohort, quotas, funding, metrics/strata, human support và stop rule đã chốt. |
| No early launch | R9 readiness không tự phê duyệt Public Grand Launch mới sau C/D-select. |

### Exit gate

Phạm vi đã review + implementation/runtime evidence cần thiết + không còn blocker bắt buộc + Operator quyết định closure/activation đúng lớp. Tests PASS chỉ có nghĩa cho bộ test đã định nghĩa, không thay evidence vận hành.

### Dừng khi

Tự rename readiness thành launch; thiếu người thật kiểm nghiệm; bắt launch chờ cả 63 module.


## Controlled Founding Pilot
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §§7,20; D04 §§6,10

Không Grand Launch sớm, nhưng cũng không xây predictive companion hoàn toàn không có người dùng thật.

### Pilot có thể học được

1. Viết charter theo country/city/category, consumer cohort, merchant và provider/language.
2. Xác nhận từng mode Voice có human fallback thật, quota, cap và thời điểm tắt.
3. Chạy shadow/read-only trước; không dispatch khi chưa có authority cụ thể.
4. Mở cohort nhỏ; theo dõi từng outcome, failure, chi phí và phản hồi.
5. Đạt sample/threshold ở đúng strata, đóng incident và independent review rồi mới mở rộng.

### Dữ liệu pilot cần ghi

| Nhóm | Dữ liệu |
| --- | --- |
| Voice | Task intent, authority, provider call IDs, critical facts, outcome và cost. |
| Proactive | Source freshness, lý do nhắc, suppression, accept/dismiss, downstream outcome. |
| Business | Supply, missed calls, confirmed bookings, owner time saved, support incidents. |
| Safety | False claims, consent/tenant violations, escalations, kill-switch drills. |

### Không dùng số trung bình che lỗi

Một language/market nhỏ có lỗi nặng không được ẩn dưới tổng toàn hệ thống. Zero-tolerance incident chưa giải quyết chặn route dù những call trước tốt. Training/analytics transcript phải có mục đích và consent riêng.


## Wave A và B: giá trị thật, thu nhập cộng đồng và network effect
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + KẾ HOẠCH
**Nguồn:** D03 §§8,13; D06 §§waves,priorities; D11 §§4A,6A

A xây usefulness, trust và doanh thu; B nối vòng dữ liệu/supply giữa các universe. V5 giữ Partner Economy và bổ sung Brokerage Economy theo staged activation mà không thay top-level module count 63.

### Hai wave và vị trí LO-05

| Wave | Đầu ra | Partner Economy | Không nhầm |
| --- | --- | --- | --- |
| A | Voice receptionist/interpreter, business verticals và utility/trust có lợi ích sớm. | **A2 bounded pilots:** LO-05B Delivery, C Errand, D Local Helper, E Student Jobs, F Business Runner nếu market-specific policy/payout/safety gates đạt. | Không có nghĩa mọi module A hoặc mọi earning mode đã production. |
| B | Learning→job, Local→merchant, Travel→services và trust/transaction loops. | **LO-05A Viona Ride** và mobility network chỉ mở từng city/country sau transport/licence/insurance/operations proof. | Liên thông không phải chia mọi dữ liệu của mọi tenant; một market GREEN không suy ra market khác GREEN. |

### Tại sao Partner Economy được staged

D06 lịch sử xếp top-level LO-05 Community Carpool ở Wave B. D11 giữ chính ID `LO-05` nhưng mở rộng thành Viona Mobility & Partner Economy, cho phép một số sub-capability ít phụ thuộc ride-hailing hơn đi qua A2 pilot sớm. Đây là **staged activation trong cùng module**, không tái đếm A/B thành 68 module.

### Cách chọn bundle

1. Chọn outcome signature và supply đang có, không chọn theo số dòng catalog.
2. Ánh xạ shared sockets cần dùng; reuse identity/ledger/authority/provider.
3. Với LO-05, chọn chính xác `market × capability`: ví dụ `CZ-Prague × Student Jobs`, không bật toàn Partner Economy.
4. Đóng nguyên một journey end-to-end: eligibility → request → matching → authority → fulfillment → settlement → evidence.
5. Đo retention, trust, partner net earning, unit economics, safety và support load.
6. Chỉ kéo thêm module/city/capability khi contribution và quality không bị giảm.

### Entry wedge

“Ngại gọi điện vì ngôn ngữ? Viona gọi giúp.” “Bận phục vụ khách? Viona nghe máy giúp.” V5 giữ wedge cộng đồng Partner Economy và bổ sung transaction-network wedge: **“Có thời gian/kỹ năng/phương tiện? Viona cho biết bạn có thể nhận loại việc nào hợp lệ trong market của mình và kết nối việc phù hợp.”**

Thông điệp phải đi cùng eligibility thật, disclosure rõ, payout/reconciliation và safety controls; không quảng bá “bật app là kiếm tiền” nếu Country Policy chưa chứng minh quyền làm việc.

### Catalog không là mệnh lệnh thi công

D06 đề xuất top-level Wave A/B như một lớp planning. Grand Launch successor yêu cầu năng lực/bundle cần thiết, không tự đòi toàn bộ A/B hoàn thiện mọi vertical. D11 chỉ thay phần successor của LO-05 và Partner Economy; 62 ID module còn lại giữ nguyên identity.


## Wave C: chủ động có ích, không tự ý
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN + THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §§14–15; D04 §§3–4; D06 Wave C

Predictive Companion có thể dự đoán nhu cầu, chuẩn bị và hỏi quyền; không nhảy từ suy luận sang hành động.

### Proactive chain

Observe → Predict → Recommend → Prepare → Request authority → Bounded execute → Reconcile

### Signature trọng tâm

LO-06 điều phối đời sống; BU-09 chiến lược doanh nghiệp; TR-07 phục hồi hành trình. Các module C có hardware/XR/supply phức tạp vẫn có thể research/gated, không trở thành launch requirement chỉ vì cùng nhãn Wave C.

### Chứng minh sức hút

1. Định nghĩa một tín hiệu có nguồn, thời hạn hữu ích và action có thể chuẩn bị.
2. Đặt ngưỡng dữ liệu đủ mới và lý do giải thích được.
3. So sánh gợi ý với baseline/reactive flow bằng pilot/holdout phù hợp.
4. Đo giúp ích thực sau outcome, không chỉ tỷ lệ bấm notification.
5. Cho user hiểu/xóa memory, snooze/dismiss; đảm bảo không có action khi authority bị từ chối.

### Cổng an toàn

Prepare store không là authority store; AI không có credential ghi ledger authority. Price, slot, account facts phải được đọc từ source truth; authority bind exact draft hash và limits. Trạng thái UNKNOWN không được dùng làm tín hiệu hoàn thành.


## Wave D-select và Grand Launch
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** NGUỒN / ĐÃ CHỐT
**Nguồn:** D03 §§16–18; D04 §11; D06 Wave D

Chọn năng lực high-trust có đối tác và giới hạn; không chờ toàn bộ lĩnh vực regulated.

### Các family D-select trong roadmap

| Family | Scope ban đầu an toàn |
| --- | --- |
| AT-02 tax/admin | Checklist, cảnh báo deadline và chuyên gia duyệt; không tự filing nghĩa vụ. |
| LO-04 medical bridge | Administrative coordination và provider handoff; không chẩn đoán/kê đơn. |
| SO-02 legal support | Guidance, trusted contact và evidence được phép; không giả luật sư. |
| AT-01 remittance | Comparison và partner handoff; không tự custody hay bảo đảm tỷ giá. |

### Không tự chọn thay Operator

Bốn family trên là lựa chọn định hướng trong roadmap. Manifest launch còn phải chỉ rõ family nào, market nào, mode nào, provider nào, authority nào và trạng thái pilot/production. Không phải cả bốn đã được cấp phép.

### Grand Launch mới

Chỉ diễn ra sau R9K, pilot, nền A/B, Wave C signature và selected D readiness. Gate gồm trải nghiệm, Voice ba mode, supply, money, cost, privacy, support, monitoring, rollback, zero unresolved severe incidents.

### Phần còn lại

Lending, đầu tư tự động, crypto, thừa kế, clinical prediction, drone/XR frontier không mặc định chặn launch. Giữ trong roadmap, gate theo rủi ro; không xóa, không fake, không quảng cáo như hiện có.


## Grand Launch: kiểm tra lời hứa sản phẩm
**Tập 1 • 02 · ROADMAP**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §§17,20–23; D04 §§10–12

Launch là quyết định cho một scope được chứng minh, không phải phần thưởng cho nhiều tháng làm việc.

### Gate cấp Founder

| Gate | Bằng chứng tối thiểu |
| --- | --- |
| Voice | Call/Answer/Talk có outcome, authority, cost, disclosure, handoff và cap tests trong market-language được mở. |
| Proactive | Người dùng thấy lý do, kiểm soát memory, nhận gợi ý hữu ích; hiệu quả được đo ngoài demo. |
| Money & cost | Reservation/settlement/refund đúng; positive expected contribution có nguồn tài trợ ngoại lệ rõ. |
| Trust & privacy | Tenant isolation, consent, deletion/retention, safety escalation và no fake commitments. |
| Supply & support | Đối tác/merchant thật, response SLA và nhân sự tiếp quản thực tế. |
| Operations | Telemetry, on-call, kill switch, rollout/canary, rollback, restore drills. |
| Evidence | Exact release/scope/flags/data/provider versions, independent review và explicit activation. |

### Quyết định launch

1. Chốt scope hẹp có thể vận hành.
2. Review scorecard theo strata và incident ledger.
3. Diễn tập tắt một provider/module mà không mất SOS Core.
4. Xác nhận rollback và customer communication.
5. Operator phê duyệt launch; monitor theo cohort rồi mở rộng từng bước.

### Không dùng checkbox giả

Nếu chưa có người nhận human handoff, chưa có dữ liệu market-language hoặc metrics chưa đủ mẫu, ghi chưa đạt; không đánh GREEN từ mô hình suy luận.


## Monetization và nguyên tắc chi phí
**Tập 1 • 03 · THƯƠNG MẠI**
**Phạm vi:** NGUỒN + GIỚI HẠN
**Nguồn:** D02 §§12–13; D03 §12; D04 §§4–6; D11 §§4A.7–4A.8,6A

Doanh thu ổn định phải gắn với giá trị thực; không bán unlimited variable-cost AI/voice.

### Nguồn thu

| Dòng thu | Điều kiện |
| --- | --- |
| Consumer Plus / bundle | Allowance hữu hạn, benefit rõ, không khóa SOS Core. |
| SOS Plus tháng | Tiện ích tăng thêm; không pay-to-be-rescued. |
| Business SaaS | Vertical operations/CRM/booking có giá trị lặp lại. |
| Voice usage | Included minutes/credits có cap; overage opt-in hoặc prepaid. |
| Lead/transaction/commission | Chỉ ghi nhận theo hợp đồng và outcome thật, disclose sponsored placement. |
| Partner Economy | Marketplace fee/commission, Business delivery plans và partner services/referral nơi được phép; phải đồng thời bảo vệ partner net earning và VIONA contribution margin. |
| Academy/setup/enterprise | Rights nội dung, onboarding/service cost và SLA được định giá. |

### Không bao giờ lỗ là mục tiêu kiểm soát, không bảo đảm

Cap, quota, reservation và unit economics giảm rủi ro; không thể bảo đảm công ty không lỗ do fixed costs, refund/fraud/provider outages hay sai dự báo. Ngoại lệ Free/SOS/promo phải dùng ngân sách tài trợ riêng với trần.

### VIO

VIO Points/Credits là entitlement/loyalty theo policy được chốt; không trình bày như token đầu tư, cash-out hoặc lãi suất. AT-09 crypto là module regulated tách biệt, không tự thay đổi VIO.

### Định giá chưa là launch offer

Bảng giá trong nguồn là baseline thiết kế; thuế, app-store/payment fee, currency, included allowance, annual discount và refund policy phải review trước bán thật.


## VIONA BROKERAGE & MARKETPLACE ECONOMY: lớp kinh tế môi giới xuyên sáu universe
**Tập 1 • 03 · THƯƠNG MẠI**
**Phạm vi:** NGUỒN D12 + THIẾT KẾ TRIỂN KHAI THAM CHIẾU
**Nguồn:** D12 §§0.2–0.2.10,2A,6B; D06 monetization/shared sockets; O05

Brokerage Economy biến những marketplace/referral/booking/placement đã rải trong 63 module thành **một kiến trúc kinh tế chính thức**, nhưng không biến VIONA thành marketplace đơn lẻ. User vẫn đi qua sáu universe; BME chỉ điều phối nhu cầu, nguồn cung, quyền, tiền, evidence và commission.

### Luật hình học sản phẩm

```text
6 UNIVERSES
    ↓
63 TOP-LEVEL MODULES
    ↓
20 SHARED SOCKETS
    ↓
8 BROKERAGE ENGINES
    ↓
VERIFIED SUPPLY / PROVIDERS / PARTNERS
    ↓
CONTROLLED TRANSACTION
```

`BME-01..08` không phải module, không là universe, không thêm launcher vào Home. Một module có thể phục vụ nhiều engine và một engine có thể gọi nhiều module.

### Tám engine chính thức

| Engine | Tên | Module neo / hỗ trợ | Nguồn thu chính | Activation mặc định |
| --- | --- | --- | --- | --- |
| **BME-01** | **Viona Mobility & Partner Economy** | LO-05 + Account/Business/Travel/SOS | marketplace/transaction/lead fee | A2 non-ride; Ride ở B theo licence/market |
| **BME-02** | **Viona Travel Marketplace** | TR-06 + TR-01/04/05/07 | booking/provider commission, affiliate, B2B SaaS | B, provider-by-provider |
| **BME-03** | **Viona Home & Real Estate Marketplace** | LO-02 + BU-07 | listing, qualified lead, referral/transaction | B, property/trust/policy gated |
| **BME-04** | **Viona Service Marketplace** | LO-03 + LO-01 + Business supply | lead/transaction commission | A2/B, category-by-category |
| **BME-05** | **Viona Talent Marketplace** | AC-09 + AC-03 + BU-04 | recruitment/placement, marketplace commission, B2B SaaS | A/B, work-right/fairness gated |
| **BME-06** | **Viona B2B Supply Marketplace** | BU-06 + BU-10 + BU-03 | supplier/logistics commission, savings share, SaaS | B/C, merchant authority required |
| **BME-07** | **Viona Money Marketplace** | AT-01/02/05/08/09 | provider/referral/payment commission | selected D, licensed provider-led |
| **BME-08** | **Viona Trusted Professional Network** | LO-04, SO-02/04, BU-12, AT-02, TR-01 | referral/service fee, Plus/partner revenue | selected D, high-trust human/provider control |

### BME không chỉ là “ăn phần trăm”

VIONA phải tạo giá trị đo được trước khi có quyền thu brokerage revenue: matched demand, qualified lead, confirmed booking, completed service, successful placement hoặc verified savings theo contract. Không tính một `search impression` như một giao dịch thành công.

### Transaction modes

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

Mỗi mode có risk và truth khác nhau. `Affiliate link` không tự nâng thành `in-app booking`; `lead sent` không là `deal closed`.

### Ranking và xung đột lợi ích

Assistant/recommendation phải ưu tiên user value/trust/policy. Sponsored placement phải gắn nhãn và tách khỏi organic ranking. Commission cao hơn không được override safety, eligibility, total-price truth hoặc suitability.

### Brokerage unit economics

Tối thiểu theo dõi `GMV/GTV`, gross commission, net revenue, payment/provider fees, AI/voice cost, refunds, chargebacks, fraud loss, supplier/partner payout, support cost và contribution margin. Gross transaction value không phải doanh thu của VIONA.

### Activation unit

Production không bật theo tên engine chung mà theo:

```text
MARKET × ENGINE × CAPABILITY × PROVIDER_OR_SUPPLY_CLASS
```

Ví dụ hotel search có thể ACTIVE nhưng in-app hotel booking vẫn PILOT; Ride ở Prague có thể NOT_ACTIVE dù Student Jobs đã PILOT.

### Vì sao mô hình này quan trọng

VIONA có thể kiếm tiền **khi hệ sinh thái tạo kết quả**: Partner có thu nhập, merchant có đơn, hotel có booking, learner có job, supplier có order, user chọn provider tài chính/pháp lý phù hợp. Revenue và trust cùng chiều tốt hơn việc chỉ tăng subscription hoặc unlimited AI usage.


## Bảng giá tham chiếu và quyết định còn mở
**Tập 1 • 03 · THƯƠNG MẠI**
**Phạm vi:** BASELINE NGUỒN / CHƯA LÀ OFFER
**Nguồn:** D02 pricing baseline; D04 economics

Không dùng giá thiết kế làm lời hứa thương mại khi chưa có SKU/country entitlement contract.

### Baseline CZ trong canonical source

| Gói | Giá tháng tham chiếu | Ghi chú |
| --- | --- | --- |
| Free | 0 Kč | Quota/tài trợ bị giới hạn; không unlimited AI. |
| Consumer Plus | 249 Kč | Allowance/mode phải được định nghĩa. |
| SOS Plus | 129 Kč | Core vẫn miễn phí. |
| Plus + SOS bundle | 349 Kč | Không cộng quota trùng mà không tính cost. |
| Business Pro | 749 Kč | Vertical scope/locations/seats cần chốt. |
| Business Growth | 2.990 Kč | Included Voice phải finite; overage cần consent. |
| Enterprise | Theo hợp đồng | SLA, private integration và support cost riêng. |

### Cách chuyển thành SKU thật

Định nghĩa currency/minor units, thuế, billing interval, entitlements, credits expiry, cancellation, refund, source of billing truth và quota renewal. Version mỗi policy, chỉ migrate user khi luật/consent cho phép.

### Không nhầm doanh số và tiền giữ lại

GMV là tổng giá trị giao dịch; revenue của VIONA là phí/commission/subscription hợp lệ. Net revenue dùng mẫu số economics phải nêu cách trừ thuế/fees, không đếm một đồng doanh thu cho nhiều module.

### Quyết định cần đóng

Ai trả Voice hold time? Interpreter tính theo phút hay session? Inbound spam ai chịu? Max call cost theo quốc gia? Free/SOS funding? Chưa có đáp án production thì không mở unlimited hoặc auto-overage.


## Founder Dashboard: nhìn kết quả, không đếm packet
**Tập 1 • 03 · THƯƠNG MẠI**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; reference dashboard

Một bảng theo dõi chín cổng đủ rõ để không mất phương hướng.

### Bảng điều hành

| Cổng | Outcome | Nguồn chứng minh |
| --- | --- | --- |
| Foundation | Canonical + entry gate đủ để thi công stage. | Exact current handoff và gate receipts. |
| Experience | Sáu universe reachable, accessible. | Actual app/device QA. |
| First loop | Local↔Business xác nhận việc thật. | Domain receipts, consumer history. |
| Voice | Ba mode giải quyết việc và không vượt cap. | Call/outcome/authority/cost evidence. |
| Proactive | Gợi ý đúng ngữ cảnh và có ích. | Pilot relevance + successful outcomes. |
| Production/market | Supply, support, privacy, payments, recovery. | Market scope + operational drills. |
| Partner Economy | Một market × capability có eligibility, matching, completion, payout, dispute, safety và positive unit economics. | Partner/job/settlement evidence + Country Policy version + incident runbooks. |
| Brokerage Economy | Một `market × engine × capability × provider/supply class` có supply truth, quote, authority, fulfillment, settlement/commission, dispute/reconciliation và contribution margin đã chứng minh. | Engine contract + provider/supply evidence + transaction/commission ledger + dispute/refund metrics. |
| Grand Launch | Scope được Operator activation. | Launch decision + monitoring/rollback. |

### Review mỗi tuần

Hỏi: cổng nào đã dịch chuyển; blocker nào là kỹ thuật, evidence, authority, market hoặc economics; ai sở hữu; artifact nào chứng minh; việc gì tiếp theo làm cổng tiến lên. Không gọi 30 packet là 30% sản phẩm.

### Cảnh báo process debt

Nếu cùng một lớp lỗi lặp qua nhiều phiên bản, dừng vòng prompt nhỏ: viết regression kiểm lỗi đó, gom remediation trong cùng scope hợp lệ và sửa cơ chế sản xuất artifact. Không nới safety để chạy nhanh nhưng cũng không thêm gate không có risk rationale.


## Ba mặt phẳng và ranh giới thực thi
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 architecture; D04; thiết kế triển khai tham chiếu

Tổ chức theo domain và quyền; không để giao diện hay model trở thành nơi quyết định giao dịch.

### Kiến trúc logic

| Mặt phẳng | Thành phần | Không được làm |
| --- | --- | --- |
| Product | Home, six universes, mobile/web, merchant UI. | Tự xác nhận giao dịch chỉ từ local state. |
| Intelligence | Viona, specialist routing, retrieval, memory, draft planning. | Giữ provider/payment secrets hoặc tự ghi authority. |
| Trust & Execution | Identity, policy, consent, authority, cost, command services, audit/reconciliation. | Tin model output thay validation, hoặc gộp outcome với dispatch. |

### Topology tham chiếu

Khởi đầu có thể là modular monolith cho domain/API và worker cho I/O chậm, thay vì 63 microservice. Tách process/credentials cho model và effect executor tại boundary nhạy cảm. Đây là đề xuất cần ADR; sách chưa audit backend hiện tại để khẳng định topology đã tồn tại.

### Đường ghi có kiểm soát

UI / Viona → Typed request → Policy + authority → Cost reserve → Command service → Provider/DB → Readback

### Cách triển khai từng bước

Lập domain ownership; định nghĩa contract; xây adapters qua shared sockets; kiểm negative cases; gắn telemetry; chỉ sau review mới activation. Domain events chứa references và version, không chứa toàn bộ sensitive document.

### Một nguồn sự thật cho mỗi loại dữ liệu

Business sở hữu availability/price; payment provider + ledger đối soát tiền; Account sở hữu consent; model chỉ diễn giải và chuẩn bị. Không tạo một “AI database” song song ghi đè dữ liệu domain.


## Shared Sockets S01–S10
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** NGUỒN + HỢP ĐỒNG THAM CHIẾU
**Nguồn:** D06 §shared sockets

Socket là hợp đồng năng lực dùng chung, không mặc định là WebSocket hoặc một server riêng.

### Socket registry phần 1

| Mã | Năng lực gốc | Hợp đồng tích hợp tối thiểu |
| --- | --- | --- |
| S01 | Identity / Profile | subject, tenant, role, profile version, purpose. |
| S02 | Consent / Privacy / Lifecycle | scope, legal/purpose reference, expiry, withdrawal, retention. |
| S03 | Authority / Policy | action scope, immutable prepare hash, issuer, limits, consumption. |
| S04 | Cost / Usage | reserve, usage event, settle, cap, allocation. |
| S05 | Viona / AI routing | intent, permitted tools, model risk tier, evidence context. |
| S06 | Provider gateway | typed adapters, credential isolation, correlation, outcomes. |
| S07 | Money / Payment / Settlement | payment reference, currency/minor units, ledger and reconciliation. |
| S08 | Trust / Verification / Reputation | verified claim scope, evidence age, appeal. |
| S09 | Message / Notification / Voice | audience consent, call/message attempt, delivery state. |
| S10 | Location / Mobility / Maps | precision, source/time, route constraints, coverage. |

### Versioning

Mỗi socket có input/output schema version, owner, supported effects, permissions, idempotency/retry policy, error taxonomy, metrics và compatibility policy. Module không được tự sao chép payment/consent/provider secret logic để lách socket.

### Mức hoàn thiện

Danh sách này là architecture proposal trong D06. Tên socket không chứng minh service đã tồn tại, contract implementation GREEN hoặc provider đã tích hợp.


## Shared Sockets S11–S20 và S21 XR
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** NGUỒN + CÒN MỞ
**Nguồn:** D06; D08

Giữ version/provenance thay vì âm thầm đổi nghĩa ID.

### Socket registry phần 2

| Mã | Năng lực gốc | Hợp đồng tích hợp tối thiểu |
| --- | --- | --- |
| S11 | Marketplace / Booking / Transaction | catalog, quote, hold, confirm, cancel, dispute. |
| S12 | Document / Forms | original bytes, extracted spans, form version, human review. |
| S13 | Evidence / Audit / Compliance | append evidence, scope, provenance, access/retention. |
| S14 | Country packs | market capability, language, provider/legal/config version. |
| S15 | Safety / Emergency | risk triage, verified resources, handoff, escalation. |
| S16 | Device / IoT / Edge / Mesh | binding, permission, command limits, device acknowledgements. |
| S17 | Search / Discovery / Reputation growth | query isolation, ranking source, sponsored disclosure. |
| S18 | Scheduling / Workforce / Operations | capacity, staff skill, duration, shifts, concurrency. |
| S19 | Knowledge / Learning / Credential | content rights, evidence, assessment scope, progress. |
| S20 | Spatial AR/VR / Media | interaction/media/scene data theo D06. |

### S21 trong blueprint XR

D08 đề xuất S21 Spatial Computing/XR Interface với OpenXR-first. Sách giữ nguồn S20 và S21 riêng: cần một ADR xác định S21 mở rộng/tách phần nào của S20. Không tự gộp ID, không tạo universe thứ bảy hoặc module thứ 64.

### Quy tắc socket mới

Chứng minh socket cũ không đáp ứng, xác định consumer/owner và migration; review trước thêm. Không dùng một “universal tool” nhận mọi path/action để thay typed contracts.


## Mô hình dữ liệu và ownership
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 data/API appendices; D04; reference design

Entity ID là nền tảng liên kết; authority và tenant không được suy ra từ tên màn hình.

### Nhóm entity

| Miền | Đối tượng tham chiếu | Invariant |
| --- | --- | --- |
| Account | Subject, Profile, Consent, Entitlement, MemoryItem | Owner/purpose xác định; revoke truyền được. |
| Business/Local | Tenant, Location, Service, Staff, Quote, Hold, Booking, Request | Request không là booking; quote/slot có version. |
| Execution | PrepareArtifact, AuthorityRecord, Attempt, ProviderReference | Không effect nếu authority/prepare/limits không khớp. |
| Cost/Money | Reservation, UsageEntry, Settlement, LedgerTransaction | Không released reserve khi outcome còn unknown. |
| Evidence | Observation, ReviewReceipt, Incident, ReconciliationCase | Evidence có nguồn/thời gian/scope, không tự gọi approval. |

### Chuẩn bị schema

1. Định nghĩa aggregate owner và invariants trước tạo bảng.
2. Tách public IDs khỏi internal keys; mọi foreign reference kiểm tenant/subject.
3. Dùng timestamp UTC cùng local timezone gốc cho lịch; money minor units/currency rõ.
4. Thêm optimistic version, unique business key và retention class.
5. Viết migration và rollback/compatibility plan dưới authority riêng; không chạy DB từ handbook.

### Fields đề xuất không phải schema live

Ví dụ Booking có id, tenantId, serviceVersion, startUtc, timeZone, status, providerRef, version. Tên table/ORM thực phải đọc repo và ADR; không tự mở Prisma migration chỉ vì sách có entity.


## Identity, tenant và quyền tối thiểu
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 identity/tenant; D04; reference design

Authentication xác định ai; authorization quyết định được làm gì với tài nguyên nào.

### Một request đi qua các cửa

1. Xác minh session/token theo cơ chế đã review; không tin tenantId do client tự gửi.
2. Resolve subject, active tenant và relationship tới resource.
3. Kiểm role/capability cho action, context, market và thời điểm.
4. Kiểm consent/entitlement nếu action cần; hai thứ này không thay permission.
5. Truy vấn data với tenant/resource predicates; audit quyết định deny/allow bằng IDs, tránh log secret.

### Negative tests bắt buộc

| Tình huống | Kết quả |
| --- | --- |
| Đổi bookingId sang tenant khác | Không trả dữ liệu và không effect. |
| Owner bị thu hồi role giữa prepare/execute | Revalidate trước commit; deny, không dùng cache cũ. |
| Người thân mở hồ sơ gia đình | Chỉ dữ liệu đã được chia sẻ cho đúng purpose. |
| AI trích tài liệu trong tenant B | Retrieval lọc quyền trước khi vào prompt. |
| Entitlement hết hạn | Degrade đúng benefit; không khóa SOS Core. |

### Thiết kế operator

Tài khoản support/operator cần quyền hẹp, audit truy cập và break-glass có approval riêng. Không dùng superadmin mặc định cho provider workers hoặc model.

### Cross-tenant failure

Khi có dấu hiệu disclosure: tắt route liên quan, bảo tồn evidence tối thiểu, revoke/invalidate cache phù hợp và incident response. Không vá bằng prompt yêu cầu AI “đừng đọc tenant khác”.


## Consent, entitlement và authority là ba hợp đồng
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; reference design

Đồng ý dùng dữ liệu, có quyền lợi gói, và được phép thực hiện một hành động là ba việc khác nhau.

### Tách quyền

| Lớp | Ví dụ | Không cho phép |
| --- | --- | --- |
| Consent | Dùng lịch của tôi để nhắc việc. | Tự đặt lịch hoặc gửi lịch cho merchant. |
| Entitlement | Gói có allowance Voice hữu hạn. | Gọi ai cũng được với ngân sách vô hạn. |
| Authority | Gọi garage X, mục đích Y, một lần, trần Z. | Đổi người nhận, tăng giá, thanh toán deposit không có scope. |

### Kiểm tại execution boundary

1. Consent còn hiệu lực cho data/purpose và recipient?
2. Entitlement có cho capability, quota và market không?
3. Authority có bind đúng prepare hash, subject/tenant, intent/target, constraints, expiry và attempt budget không?
4. Cost reservation còn đủ và transaction/version conditions còn hợp lệ không?
5. Chỉ executor được review mới được consume và dispatch; thất bại kiểm tra không tự xin quyền rộng hơn.

### Thay đổi draft

Thay đổi target, giá trần, dữ liệu chia sẻ hay lịch sau approval làm draft hash đổi; cần authority phù hợp mới. Chỉnh typo hiển thị không được âm thầm thay payload đã review.

### Standing policy

Answer For Me có thể dẫn xuất per-call permission từ merchant policy version đã duyệt. Derived authority vẫn finite, single-use và gắn request; model không phải issuer.


## Context và memory có nguồn
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 memory; D03 Wave C; D04

“Hiểu tôi” phải đi cùng biết thông tin đến từ đâu và người dùng có thể sửa/xóa.

### Ba loại dữ liệu

| Loại | Cách lưu | Giới hạn |
| --- | --- | --- |
| Facts xác nhận | Nguồn, confidence, observedAt, validUntil, consent/purpose. | Không biến prediction thành fact. |
| Preference | User declared/inferred rõ nhãn, version và edit controls. | Không suy thông tin nhạy cảm không cần thiết. |
| Conversation/session | TTL ngắn, tenant isolation, redaction, chỉ giữ phần cần. | Không mặc định training từ transcript. |

### Memory pipeline

1. Nhận dữ liệu từ nguồn đã consent.
2. Phân loại sensitivity/purpose và kiểm provenance.
3. Tạo candidate fact, resolve conflict bằng source/time/user confirmation.
4. Store versioned fact và index theo access policy.
5. Khi dùng, recheck freshness và quyền; khi revoke/delete, gỡ cả caches/index và downstream uses thuộc scope.

### Xử lý mâu thuẫn

Nếu calendar nói 15:00 còn email nói 16:00, không chọn ngẫu nhiên bằng confidence model. Gắn conflict, giữ cả nguồn và yêu cầu xác nhận hoặc authoritative readback. Deadline quan trọng không được silent overwrite.

### Cold start

Người mới không cần cho truy cập mọi tài khoản. Bắt đầu bằng mục tiêu, ngôn ngữ, lịch nhập tay và một số preferences; proactivity ít nhưng chính xác tốt hơn “cá nhân hóa” bằng giả định.


## Retrieval và prompt injection
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 AI; D04 barrier; reference security design

Tài liệu/web/email là dữ liệu không đáng tin, không phải chỉ thị cho tool executor.

### RAG an toàn

1. Ingest nguồn được phép, giữ original reference và content hash.
2. Chunk/index với tenant, subject, purpose, language, version và validity.
3. Filter quyền trước retrieval; chỉ đoạn cần thiết được đưa vào model.
4. Gắn nguồn vào facts/answer; thông tin thiếu hoặc cũ phải được nói rõ.
5. Tool request từ model qua schema/policy validation độc lập; bỏ chỉ thị “ignore rules / send secrets” trong nội dung nguồn.

### Tấn công thử

| Payload | Control cần chứng minh |
| --- | --- |
| Email yêu cầu bỏ qua approval | Model có thể đọc nhưng không có quyền cấp authority. |
| Website có tool command ẩn | Parser/retrieval xem là content, không executable instruction. |
| Tài liệu chứa secret/PII | Redaction, purpose restriction, không phản hồi tenant khác. |
| Nguồn chính thức đã đổi | Validity/version check và contradiction handling. |

### Đánh giá

Test factual grounding, nguồn sai, quyền truy cập, cross-language retrieval và action misrouting. Một câu trả lời ngôn ngữ đẹp không chứng minh fact đúng hoặc command an toàn.

### Evidence source

Mỗi critical fact trong booking/voice phải trỏ tới source field/snapshot. RAG không tự là authoritative price/calendar API.


## Định tuyến Viona và specialists
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D07 model routing; D03 Voice; reference design

Routing chọn chuyên môn và mức mô hình theo rủi ro, không đổi quyền hạn.

### Intent routing

1. Xác định intent, entities, language và confidence; không đủ dữ kiện thì hỏi ngắn.
2. Map sang capability registry: read, prepare, execute, high-trust/gated.
3. Resolve specialist và công cụ được phép trong tenant/market.
4. Chọn tier dựa trên risk/complexity/budget; task máy làm được giao TIER_M.
5. Trả câu trả lời hoặc draft; execution chỉ qua gate riêng, không nhét secret vào prompt.

### Routing ví dụ

| Tác vụ | Tier/đường đi đề xuất |
| --- | --- |
| Đổi copy UI một component | TIER_F + lint/test máy; không escalates vô cớ. |
| Refactor nhiều file | TIER_S + contract/regression. |
| Thiết kế authority/Authz | TIER_X + reviewer độc lập; API facts từ nguồn chính. |
| Hash, JSON, Git identity | TIER_M; model có thể giải thích không được tự bịa số. |
| Giá và slot hiện tại | Read service authoritative; model không suy giá. |

### Budget per reasoning task

Đặt context/turn/tool/time budget và escalation trigger. Nếu budget hết, trả partial analysis/ask review; không tự gọi model mạnh hơn vô hạn. Platform fixed model được báo đúng, không giả lựa chọn tier.

### Specialist không là security principal mới

Chuyển từ Viona sang Lễ Tân AI không tự cho phép booking/refund. Credential và permission ở service layer, không ở persona name.


## Bức tường PREPARE → EXECUTE
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D04 §3; reference implementation pattern

Ngăn tự thăng cấp bằng kiến trúc, không chỉ prompt.

### Trust domains

AI / Draft store → Hash + version → Authority Gate → Authority ledger → Bounded executor → Provider truth

### Prepare Artifact

Chứa intent, target, constraints, data disclosures, proposed commands và cost bound; immutable sau khi gửi review. Draft có trạng thái chuẩn bị, không chứa usable execution token. AI có quyền ghi draft nhưng không thể sửa authority ledger.

### Authority Gate

Xác minh subject/tenant, policy/consent, risk, quota, prepare hash và approval nguồn. Phát authority record theo scope/expiry/replay rules. Issuer credentials không chia sẻ với planner.

### Machine tests

1. Gửi draft tự gắn approved=true: executor vẫn deny.
2. Thay một byte critical payload sau approval: hash mismatch và deny.
3. Thử gọi provider tool trực tiếp từ AI process: không có secret/network capability phù hợp.
4. Dùng authority của người khác/tenant khác: deny.
5. Revoke consent hoặc expire authority trước consume: không dispatch.

### Cùng service không có nghĩa cùng quyền

Một deployment có thể dùng nhiều namespaces/process credentials; cần threat model. Hai bảng trong cùng DB với một admin credential cho AI không tạo trust separation thật.


## Authority record và single-use attempt
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D04 Voice; D07; E04; reference design

Một UUID chỉ là định danh; tính một lần phải do state transition nguyên tử và context binding thực thi.

### Schema minh họa, không phải authority thật

```text
authorityId: <issued by gate>
subjectId / tenantId / policyVersion
prepareSha256 / actionKind / exactTarget
maxAttempts: 1
expiresAt / currency / maxCostMinor
allowedDisclosures / constraints
state: ACTIVE_UNUSED | CONSUMED
issuedBy / approvalRef / contextBinding
```

### Thực thi

1. Xác minh immutable record và context hiện tại; không tin UUID hợp lệ định dạng.
2. Reserve budget theo cùng correlation trước effect; fail thì chưa dispatch.
3. Atomic compare-and-set ACTIVE_UNUSED→CONSUMED theo attempt contract, không có hai worker cùng thắng.
4. Ghi attempted dispatch và gửi duy nhất external call được bound.
5. Outcome/cost/booking đối soát riêng; crash sau consume không làm authority quay lại unused.

### At-most-once không phải exactly-once

Crash sau consume nhưng trước network gửi có thể tạo zero effect; crash sau provider nhận có thể tạo unknown outcome. Ưu tiên không duplicate theo policy, reconcile read-only trước quyết định attempt mới. Không hứa exactly-once ở biên provider chỉ nhờ UUID.

### Retry phân lớp

Webhook redelivery có thể được deduplicate; transaction retry nội bộ có thể hợp lệ nếu không phát effect. Voice same authority retry vẫn cấm. Mỗi lớp có namespace/key/budget riêng và không tự mở quyền khác.


## Bốn state machine phải tách biệt
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04 §§4–5; reference state model

Call kết thúc không đồng nghĩa booking xác nhận; booking xác nhận không đồng nghĩa tiền đã settle.

### Bốn trục trạng thái

| Trục | State minh họa | Truth source |
| --- | --- | --- |
| Authority | ACTIVE_UNUSED → CONSUMED | Authority service/durable transition. |
| Provider call | DISPATCHING → CONNECTED → ENDED / UNKNOWN | Provider callbacks + status readback. |
| Domain booking | REQUESTED → HELD → CONFIRMED / DECLINED / EXPIRED | Booking service/provider confirmation. |
| Cost | RESERVED → USAGE_PENDING → SETTLED / UNKNOWN_HOLD | Usage evidence + cost ledger reconciliation. |

### Ví dụ lỗi

Mạng rớt sau khi provider nhận lệnh: authority consumed, call unknown, booking chưa biết, reserve vẫn giữ. UI nói “Đang xác minh kết quả, chưa gọi lại” thay vì “Thất bại, thử lại ngay”.

### Cách thiết kế result

1. Return một structure có các state tách biệt và evidence refs.
2. Map UI từ explicit domain result, không dùng HTTP200 hoặc call terminal status.
3. Đặt reconciliation case owner/next check/deadline.
4. Ghi quyết định người thật khi cần thay vì lấp unknown bằng giả định.
5. Chỉ release reserve và mở attempt mới khi đủ policy và evidence.

### Provider completed

Tài liệu Twilio nêu cuộc gọi completed có thể là kết nối tới IVR hoặc voicemail. Vì vậy ngay cả trạng thái provider thành công cũng không chứng minh người thật đã đồng ý đặt lịch. [W01]


## Request → Quote → Hold → Booking
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 contracts; D03 Local↔Business; reference design

Các bước có ý nghĩa khác nhau và phải hiển thị khác nhau.

### Luồng chuẩn

1. Consumer gửi request mô tả nhu cầu; API trả request ID, không booking confirmation.
2. Business/provider đưa quote có service/price/rule version và expiry.
3. Nếu có khả năng giữ chỗ, tạo hold với TTL và owner; hold không thể sống vô hạn.
4. Người dùng xác nhận exact offer; command service kiểm quote còn mới, capacity và authority.
5. Commit booking một lần; gửi notification từ event đã committed; Account nhận history cùng booking reference.

### Command tham chiếu

```text
ConfirmBooking {
  tenantId, requestId, quoteId, quoteVersion,
  holdId, serviceVersion, authorityId,
  idempotencyKey, expectedBookingVersion
}
Result: CONFIRMED | OFFER_CHANGED | EXPIRED | UNKNOWN
```

### Giá và số lượng

Không dùng floating point cho money; price snapshot phải có tax/fees, currency và scope. Khi giá hoặc thời gian đổi sau approval, trả offer changed, yêu cầu confirm lại theo policy.

### Truth rule

Notification “đã đặt” chỉ phát từ booking.confirmed có durable evidence. Email đã gửi hoặc lời nói của AI không tự làm thay đổi state trong booking aggregate.


## Chống double booking ở commit boundary
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 platform; D04 price/availability truth; W05

Availability query chỉ là quan sát; quyền giữ capacity được quyết định khi commit.

### Transaction reference

1. Read command đã authenticated/authorized và exact quote version.
2. Bắt đầu transaction; kiểm idempotency record và booking version.
3. Kiểm capacity bằng unique/resource allocation hoặc concurrency mechanism phù hợp.
4. Tạo booking + capacity allocation + outbox event trong cùng transaction.
5. Commit rồi mới worker gửi notification/provider follow-up có own boundary.

### DB choice còn mở

Có thể dùng optimistic concurrency, serializable transaction hoặc constraint chuyên biệt theo engine. PostgreSQL là ví dụ: serializable có thể trả serialization failure; phải xử lý retry transaction ở application. Không phát provider call trong transaction sẽ được tự retry. [W05]

### Test đồng thời

| Case | Kết quả |
| --- | --- |
| Hai confirm cùng một hold | Một commit; lần sau trả cùng kết quả hoặc conflict có chứng cứ. |
| Hai user cùng staff/time | Capacity invariant không bị vượt. |
| Staff đổi shift trong lúc confirm | Version conflict/revalidation; không hứa slot cũ. |
| Event publish lỗi sau DB commit | Outbox còn để publish; không rollback giả giao dịch đã committed. |

### Không khóa bằng prompt

AI nói “hãy kiểm lịch trước” không thay DB invariant. Cần đo bằng concurrency tests trên storage thật trong authorized test environment.


## Đổi lịch, hủy và bồi hoàn
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 product contracts; D04; reference design

Không coi compensating action là rollback có thể xóa hệ quả đã xảy ra.

### Đổi lịch an toàn

1. Đọc booking hiện hành và policy/version.
2. Chuẩn bị offer mới gồm phí/thời gian; không hủy chỗ cũ quá sớm.
3. Giữ slot mới nếu provider hỗ trợ; xin authority cho phí/phạm vi đổi.
4. Commit theo strategy được review; nếu hai bên/provider không atomic thì dùng saga và trạng thái partial.
5. Đối soát booking cũ/mới, phí/refund và thông báo cùng truth.

### Tình huống khó

| Tình huống | Phản hồi |
| --- | --- |
| Slot mới mất trước commit | Giữ booking cũ nếu còn; xin lựa chọn mới. |
| Hủy thành công nhưng refund pending | Booking canceled, refund pending; không nói tiền đã về. |
| Provider trả timeout | UNKNOWN; đọc lại bằng provider reference, không auto cancel lần hai. |
| User revoke sau dispatch | Ghi thời điểm revoke; xử lý compensating action có authority riêng nếu cần. |

### Chứng cứ

Lưu original booking ID, change request ID, before/after version, policy fee, approval, provider receipts và ledger refs. Không ghi đè lịch sử cũ để làm outcome trông sạch.

### Human support

Case partial/unknown phải có owner, SLA và thao tác được phép. Support không được sửa DB tùy ý để “chốt cho xong”.


## Outbox, inbox và event ownership
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 foundation; D04; W03; reference design

Chống mất event và xử lý trùng ở biên hệ thống mà không tạo thêm effect.

### Outbox

1. Domain command commit state cùng outbox row.
2. Worker lấy một batch có lease/ownership.
3. Publish event với eventId, aggregateId, version, tenant/purpose.
4. Consumer ghi inbox dedup key trước xử lý effect-sensitive logic.
5. Delivery ACK có thể trùng; domain transition phải idempotent theo contract.

### Webhook inbox

Xác thực raw request và signature trước tin dữ liệu; durable enqueue rồi trả HTTP response theo provider contract. Worker xử lý domain transition, không coi thứ tự nhận webhook là thứ tự kinh doanh. Stripe xác nhận webhooks có thể trùng và không bảo đảm order. [W03]

### Envelope tham chiếu

```text
eventId / schemaVersion / eventType
aggregateId / aggregateVersion
tenantId / occurredAt / observedAt
correlationId / causationId
providerReference / evidenceReference
payload (minimal, purpose-bound)
```

### Exactly once local scope

Dedup inbox + transaction giúp kiểm effect trong scope DB. Không được diễn giải thành mạng toàn cầu exactly-once; nếu provider outcome không xác định, cần reconciliation thay blind retry.


## Provider adapters và credential isolation
**Tập 2 • 04 · KIẾN TRÚC**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02; D04; W01–W04

Một provider adapter phải có semantics rõ, không phải hàm fetch tùy ý.

### Hợp đồng adapter

| Phần | Cần định nghĩa |
| --- | --- |
| Capabilities | Read/quote/hold/commit/terminate/status; unsupported phải rõ. |
| Identity | Exact provider account, market, credential scope và environment. |
| Idempotency | Provider hỗ trợ key nào, retention/parameters ra sao; không suy đồng nhất giữa providers. |
| Failure | Timeout, rate limit, auth error, duplicate, partial, terminal và unknown. |
| Cost | Rate version, duration increments, taxes/FX/surcharges, worst-case bound. |
| Readback | Provider reference nào đối soát; eventual consistency và deadline. |

### Tích hợp

1. Dùng sandbox/test fixtures không production secrets.
2. Test signed callbacks, duplicate/out-of-order và retry transport semantics.
3. Pin adapter config/schema; giữ keys ngoài model/client.
4. Canary dưới quota nhỏ và operator authority.
5. Theo dõi outcomes; gate-off từng provider khi degraded.

### Không đổi provider tùy tiện

Failover có thể thay jurisdiction, call identity, data recipient, giá và idempotency scope. Chuẩn bị provider plan mới cần policy/authority phù hợp, không tự gọi lại đồng thời.

### SDK tự retry

Tắt hoặc định nghĩa rõ retry tự động của SDK cho consequential calls. “Chỉ gọi API một lần trong code” không đủ nếu SDK tự dispatch lại.


## Voice Delegation Layer: toàn bộ đường đi
**Tập 2 • 05 · VOICE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §§9–12; D04; reference design

Call For Me, Answer For Me và Talk With Me dùng chung trust/cost/evidence, nhưng khác quyền và UX.

### Realtime voice

Telephony / audio → STT / turn → Viona + tools → Commitment guard → TTS / audio → Provider outcome

### Control plane vs media plane

Media plane xử lý audio, interruption và latency. Control plane giữ session policy, caller context, authority, tool actions, cost and termination. Không để một transcript instruction tự đổi control-plane constraints.

### Orchestration

Speech hiểu nhu cầu; tool gateway đọc facts. Khi phát sinh cam kết, deterministic checker so price/date/service/version và authority trước khi TTS nói “đã xác nhận”. Giao tiếp ngôn ngữ tự nhiên không được làm mất event/order/correlation.

### Ba mode

| Mode | Kênh | Quyền cốt lõi |
| --- | --- | --- |
| CALL FOR ME | Outbound number đã duyệt | User envelope một task/một attempt. |
| ANSWER FOR ME | Business number/SIP/forwarding | Policy merchant + derived per-call authority. |
| TALK WITH ME | App/bridge có quyền audio | Phiên dịch; không tự đưa ra commitment thay user. |

### Khả năng điện thoại thực tế

Không hứa app tự nhấc mọi cuộc gọi SIM cá nhân trên iOS/Android. Số provider, SIP, call forwarding hoặc bridge phải được thiết kế và kiểm chứng theo platform/carrier/market.


## CALL FOR ME: đặt lịch bằng ngôn ngữ bản địa
**Tập 2 • 05 · VOICE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §9; D04; W01

Luồng tham chiếu chi tiết cho một cuộc gọi đặt lịch thông thường, không phải emergency call.

### Từ câu nói tới receipt

1. User nói mục tiêu; xác nhận target, service, khoảng giờ, giá trần, dữ liệu chia sẻ, hành động cấm và max duration.
2. Read provider readiness/price bound; tạo immutable draft. UI giải thích Viona là AI đại diện, không clone giọng đánh lừa.
3. Gate kiểm consent/entitlement; reserve worst-case spend; consume authority ngay theo dispatch contract.
4. Gọi, công bố AI, xử lý IVR/hold/busy/voicemail theo policy; không nói giá/lịch tự nghĩ.
5. Đọc lại các critical facts cho bên kia, chỉ commit trong envelope. Có phí/điều kiện mới thì dừng/handoff.
6. Sau call, reconcile provider + booking; tóm tắt tiếng Việt, calendar entry chỉ từ outcome xác nhận.
7. Usage settle hoặc giữ reserve nếu unknown; không gọi lại cùng UUID.

### Critical facts phải xác nhận

Tên cơ sở, dịch vụ, địa chỉ, ngày/tháng/năm, múi giờ, giờ, giá/currency, deposit/cancel terms. Số điện thoại và target identity không lấy từ link nghi ngờ mà chưa xác minh.

### Cổng kết thúc

Nếu chỉ để voicemail, ghi MESSAGE_LEFT hoặc trạng thái domain tương đương được review; không BOOKED. Provider completed không đủ để kết luận lịch đã chốt. [W01]


## ANSWER FOR ME: lễ tân AI cho merchant
**Tập 2 • 05 · VOICE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §10; D04 Voice truth

Business policy đã duyệt biến thành quyền theo cuộc gọi, không thành thẩm quyền vô hạn.

### Runtime flow

1. Provider inbound callback được xác thực; route tới đúng tenant/location và policy version.
2. Chào bằng disclosure phù hợp; phát hiện ngôn ngữ và nhu cầu, giới hạn data collection.
3. Read services/price/calendar qua authoritative read-only endpoints. Không cho model sửa response factual.
4. Tạo quote/hold theo capacity; caller xác nhận critical fields.
5. Derived authority từ merchant policy kiểm allowed service, staff, time, max discount=0 mặc định, call budget.
6. Booking command revalidate version/capacity; sau durable success mới xác nhận qua voice/SMS đã consent.
7. Handoff các case ngoài policy, safety, refund/discount hoặc dữ liệu không chắc. Tóm tắt owner và outcome.

### Availability không phải data tĩnh

Read-only nghĩa không mutate, không nghĩa snapshot tồn tại mãi. Quote phải có version/expiry; commit dùng current version. Nếu provider không có calendar API đáng tin thì scope chỉ thu yêu cầu/callback, không tự chốt lịch.

### Merchant override

Chủ tiệm sửa policy được version và effective time; phiên đang chạy phải có rule xử lý policy revocation. Không để model tự thương lượng để tối ưu conversion.


## TALK WITH ME: phiên dịch hai chiều
**Tập 2 • 05 · VOICE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §11; TR-03; reference implementation

Giúp user tự tham gia cuộc hội thoại; không thay user đưa ra quyết định hoặc cam kết.

### Từng bước

1. Chọn hai ngôn ngữ, mode in-app hoặc provider bridge được phép.
2. Xin quyền microphone/recording/transcription theo scope; giải thích dữ liệu lưu hay không.
3. STT tạo segment với speaker, confidence và timestamps; turn-taking hỗ trợ ngắt lời.
4. Dịch giữ ý, không tự thêm lời khuyên; số, tên, ngày, giá phải được xác nhận hoặc spell-back khi cần.
5. TTS/hiển thị bản dịch; user có nút stop/mute/nhờ người thật.
6. Kết thúc session; chỉ lưu summary/segments được consent, settle usage và xử lý deletion.

### Một lỗi translation là một lỗi outcome

Dịch “không đồng ý” thành “đồng ý” hoặc nhầm 1.500 thành 15.000 có tác động thật. Đánh giá critical semantic preservation thay vì chỉ naturalness. Với medical/legal context, cần risk-tier restrictions và human review.

### Fallback

| Sự cố | Hành vi |
| --- | --- |
| STT confidence thấp | Yêu cầu nhắc lại; không đoán số. |
| Latency quá cao | Chuyển half-duplex/text hoặc human fallback theo policy. |
| Audio rớt | Dừng phát ý mới, báo reconnect status; không tự call mới. |
| Consent rút | Dừng processing/retention thuộc scope. |

### No-impersonation

Phiên dịch không là quyền clone giọng hoặc giả user. Mọi voice synthesis/persona phải minh bạch, có quyền sử dụng và mục đích hợp lệ.


## Voice envelope và commitment guard
**Tập 2 • 05 · VOICE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 Voice envelope; D04

Chốt điều kiện bằng máy trước khi AI phát biểu một cam kết có hệ quả.

### Envelope minh họa

```text
purpose: appointment_booking
target: <verified merchant/provider>
service: <versioned service>
timeWindow: <date + timezone + range>
maxPriceMinor: <approved amount>
currency: CZK
allowedActions: [ask, prepare, book]
forbiddenActions: [deposit, refund, discount]
maxAttempts: 1
maxDurationSeconds: <reviewed finite policy>
```

### Commitment guard

1. Trích candidate commitment từ planned response/tool result.
2. Kiểm mọi critical field có source/quote version hợp lệ.
3. Kiểm action/cost/data recipient nằm trong envelope.
4. Nếu chưa có command receipt, đổi câu nói thành pending/offer, không “đã đặt”.
5. Nếu vượt điều kiện, block commitment, hỏi user hoặc handoff; log lý do và trigger incident nếu đã phát sai.

### Câu nói và effect

Một câu “giảm giá 20% cho chị” có thể tạo cam kết thương mại dù DB chưa đổi. Guard phải kiểm speech output ở critical moments, không chỉ khóa API mutation.

### Đo lỗi

Incorrect commitment phải được review theo rubric: factual/source mismatch, authority violation, false completion. Zero-tolerance category xử lý ngay; tỷ lệ chỉ là lớp bổ sung, không cho phép quota lỗi nghiêm trọng.


## Hard timeout, mất mạng và UNKNOWN
**Tập 2 • 05 · VOICE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D04 §§4–6; W01

Ngắt local không chứng minh provider ngừng tính tiền; authority đã consumed không quay lại unused.

### Mặc định cho cuộc gọi phi khẩn cấp trong addendum

| Thông số | Default nguồn | Điều kiện |
| --- | --- | --- |
| Connect timeout | 30 giây | Policy provider/market phải bind riêng. |
| Max call duration | 600 giây | Có cost bound/reserve, silence/hold rules. |
| Absolute duration ceiling | 900 giây | Không model/SDK tự kéo dài. |

### Khi chạm timeout/cap

1. Dừng generation/tool actions mới và báo UI trạng thái an toàn.
2. Gửi bounded termination cho exact provider call reference nếu được policy cho phép.
3. Không xác nhận kết thúc khi chưa có provider proof; tạo UNKNOWN_PENDING_RECONCILIATION.
4. Giữ reserve, khóa overlapping reattempt cùng intent/target tới khi xử lý ambiguity.
5. Worker readback/provider events đối soát call/outcome/usage; escalate người thật nếu deadline vượt.
6. Attempt mới chỉ khi có authority mới và reconciliation policy cho phép; không retry cùng UUID.

### Cần đặt thêm trước execution

Silence timeout, maximum IVR hops/hold, termination deadline, reconciliation SLA và max record size là các tham số phải finite trong manifest. Nguồn không có đầy đủ giá trị cho mọi provider; không tự coi một default là áp dụng toàn cầu.

### Termination không là retry call

Lệnh dừng phiên và read-only status query khác tạo cuộc gọi mới, nhưng vẫn cần policy/counter riêng. Không fallback provider âm thầm.


## Voice Cost Governor: reserve trước, settle sau
**Tập 2 • 05 · VOICE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 cost; D04; reference formula

Tính phí phải bao gồm tất cả đoạn chi phí được provider/model tính, kể cả cuộc gọi thất bại.

### Công thức thiết kế

```text
C_max = telecom_bound + realtime_AI_bound
      + STT/TTS_bound + transfer_legs_bound
      + fixed_fees + FX/tax/risk_buffer
reserve(C_max) BEFORE external dispatch
settle(actual_verified_usage) AFTER reconciliation
```

### Cơ chế

1. Nạp tariff/policy version có effective time; tính thời gian làm tròn và hold/transfer cost theo hợp đồng.
2. Kiểm entitlement và user-approved cap; reserve atomic không cho double spend giữa hai session.
3. Meter theo usage events có IDs; watchdog so projected remaining cost với reserve.
4. Chạm cap thì bounded stop, giữ UNKNOWN nếu chưa biết provider final state.
5. Settle actual verified amount; release phần dư khi đủ proof; nếu provider adjustment muộn, reconcile theo accounting policy.

### Chặn lỗ cấp action

Normal paid action cần positive expected contribution theo policy. Free/SOS/promo có ngân sách tài trợ riêng; không tự lấy tiền của một tenant bù cho tenant khác.

### Không chỉ average

Một average call rẻ không chặn outlier giữ máy lâu. Cần hard per-call cap, concurrent-session cap và per-period quota; không miễn trừ vì model đang nói chuyện có vẻ hữu ích.


## Ví dụ kinh tế: một cuộc gọi đặt lịch
**Tập 2 • 05 · VOICE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D04 nguyên tắc; ví dụ tính toán nội bộ

Các con số sau chỉ minh họa phương pháp, không là giá nhà cung cấp hoặc gói VIONA.

### Giả định minh họa

| Hạng mục | Tính toán | Chi phí |
| --- | --- | --- |
| Telecom | 8 phút × 0,50 Kč | 4,00 Kč |
| AI + speech | 8 phút × 1,20 Kč | 9,60 Kč |
| Fixed fee | Mỗi cuộc gọi | 1,00 Kč |
| Reserve buffer | 20% của 14,60 Kč | 2,92 Kč |
| Worst-case reservation | 14,60 + 2,92 | 17,52 Kč |

### Outcome minh họa

Nếu usage đã đối soát chỉ 5 phút: cost biến đổi = 2,50 + 6,00 + 1,00 = 9,50 Kč; phần reserve còn lại 8,02 Kč được release theo policy. Nếu call outcome còn unknown, không release ngay dựa trên đồng hồ local.

### Tính contribution đúng

Giả sử allocated net revenue cho outcome là 30 Kč và support/failure allowance 3 Kč: expected contribution sau actual cost là 17,50 Kč. Đây không bao gồm mọi fixed cost của công ty và không phải bảo đảm lợi nhuận. Không ghi 30 Kč cho hai module cùng phục vụ một outcome.

### Average per successful outcome

Tử số phải cộng cả chi phí attempt thất bại và reconciliation liên quan trong cửa sổ; mẫu số chỉ successful outcomes theo định nghĩa. Chia chi phí chỉ của các call thành công sẽ che lãng phí.

### Trước bán thật

Thay mọi giả định bằng tariff/FX/fee hợp đồng thực, p95/p99 usage, provider rounding, fraud/spam và cancellation/refund. Định nghĩa allocation version để audit.


## Signal engine và action preparation
**Tập 2 • 06 · PROACTIVE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 Wave C; D04; reference design

Proactivity là pipeline có kiểm soát, không phải cron gọi một LLM đọc toàn bộ đời sống.

### Pipeline chi tiết

1. Event intake từ sources có consent, schema và dedup.
2. Chuẩn hóa thành ContextFact với provenance, timestamp, validity và sensitivity.
3. Rule/model phát NeedHypothesis, giữ confidence và alternative explanation.
4. Eligibility filter kiểm consent, market capability, source freshness, safety và quiet hours.
5. Scoring cân expected utility, timing, uncertainty, notification cost và user preference.
6. Draft builder tạo đề nghị có source/constraints/cost; suppression dedup theo intent-window.
7. User chấp thuận mới vào authority gate; outcome feedback cập nhật preference/evaluation, không tự tăng quyền.

### Signal record tham chiếu

```text
signalId / subjectId / tenantContext
sourceRefs / observedAt / validUntil
hypothesis / confidence / sensitivity
recommendedAction / urgency / suppressKey
policyVersion / explanation / evaluationRef
```

### Negative tests

Signal từ người khác; source hết hạn; deadline conflict; no consent; memory đã xóa; hai agent cùng chuẩn bị; user snooze; nguồn chứa instruction độc hại. Tất cả phải có hành vi xác định.


## Đánh giá và điều chỉnh proactivity
**Tập 2 • 06 · PROACTIVE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §20; D04; reference evaluation

Đo helpfulness sau outcome, không tối ưu click bằng notification gây lo lắng.

### Metric

| Định nghĩa | Cách dùng |
| --- | --- |
| Relevant suggestion rate = relevant / reviewed suggestions | Review có rubric và slices theo context/language. |
| Useful completed outcome rate = useful reconciled outcomes / eligible users | Phân biệt user đã đồng ý với action thực hoàn thành. |
| Dismiss / snooze / mute rate | Tín hiệu quá nhiều hoặc timing sai; không tự coi user thiếu engagement. |
| Incorrect prediction và commitment | Prediction sai không luôn là commitment sai; severe action violation xử lý zero tolerance. |
| Cost per useful proactive outcome | Gồm signal/retrieval/model/failed prepare và provider cost. |

### Eval loop

1. Tạo test set có sources và expected outcomes do người có thẩm quyền review.
2. Chạy offline đánh giá leakage/grounding/risk trước pilot.
3. Shadow trên data đã consent, không dispatch.
4. Pilot với holdout/baseline phù hợp để đo incremental value; không gây hại để thử.
5. Giảm frequency hoặc disable capability theo policy; nâng lại qua review khi có sự cố.

### Không training tự động mặc định

Outcome feedback phục vụ product metrics không đồng nghĩa consent dùng dữ liệu huấn luyện model. Tách purpose, retention và opt-out; dữ liệu nhạy cảm cần kiểm soát đặc biệt.


## Cost ledger khác payment ledger
**Tập 2 • 07 · TIỀN & DỮ LIỆU**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02; D04; reference accounting model

Một sổ theo dõi chi phí AI/provider; một sổ theo dõi tiền và nghĩa vụ thanh toán. Không gộp bằng một balance.

### Hai ledger

| Cost ledger | Payment/financial ledger |
| --- | --- |
| Reserve cho dự kiến usage. | Charge, fee, refund, receivable/payable. |
| Meter token/minute/provider units theo version. | Tiền minor units/currency; gross/net/settlement. |
| UNKNOWN giữ exposure và case. | Pending/chargeback/refund có transaction riêng. |
| Release reserve sau đối soát. | Reversal/adjustment không xóa transaction đã posted. |

### Đóng một kỳ

1. Khóa policy/rate allocation version.
2. Đối chiếu provider usage với call/session IDs; phân loại unmatched/late events.
3. Đối chiếu PSP charges/refunds/settlements.
4. Kiểm cân đối theo currency và tenant, không cộng EUR với CZK trực tiếp.
5. Lập discrepancy cases, review adjustment và báo cáo contribution theo SKU/cohort.

### Double-entry reference

Một financial ledger có thể dùng journal entries cân debit/credit theo transaction/currency. Chỉ implement sau accounting ADR; cost reservation không nhất thiết cùng kiểu kế toán nhưng cần invariant không chi vượt entitlement/reserve.

### No silent edits

Sửa giá rate đã áp dụng phải version; adjustment có author/reason/evidence. Không sửa historical usage để làm margin đạt KPI.


## Payment, subscriptions và entitlement
**Tập 2 • 07 · TIỀN & DỮ LIỆU**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 R7; W03–W04; reference design

Provider billing truth phải được chuyển thành quyền sử dụng một cách idempotent và reversible theo policy.

### Subscription flow

1. Tạo checkout/payment intent theo SKU version và tenant/user đúng.
2. Provider xử lý thanh toán; redirect thành công không là source duy nhất.
3. Webhook được xác thực/raw body giữ đúng; enqueue bền vững.
4. Domain handler dedup event, đọc current provider state khi cần và cập nhật entitlement version.
5. Renewal/cancel/past_due/refund điều chỉnh quyền theo contract; Core SOS vẫn reachable.
6. Daily reconciliation tìm user đã trả chưa có benefit hoặc benefit còn dù canceled ngoài policy.

### Idempotency

Key gắn một operation/input hash; provider có retention/parameter semantics riêng. Stripe công bố xử lý idempotent requests nhưng không được suy một key tồn tại vĩnh viễn hoặc áp dụng cho mọi vendor. [W04]

### Test tối thiểu

| Case | Invariant |
| --- | --- |
| Payment success webhook trùng | Không grant credit hai lần. |
| Refund đến trước event chậm | Không resurrect entitlement sai. |
| Currency/amount mismatch | BLOCK và case; không tin client. |
| Provider auth lỗi | Không chuyển user thành fraud; xử lý service incident. |

### Commercial policy

Annual/renewal/proration/usage carryover/tax/app-store billing chưa được chốt đầy đủ trong nguồn. Mỗi thị trường phải có offer và entitlement contract được review trước thu tiền.


## Viona Partner Economy: kiến trúc kiếm thu nhập xuyên sáu universe
**Tập 2 • 07 · TIỀN & DỮ LIỆU**
**Phạm vi:** NGUỒN D11 + THIẾT KẾ TRIỂN KHAI THAM CHIẾU
**Nguồn:** D11 §§0,4A,6A; D06 shared sockets

LO-05 là **Viona Mobility & Partner Economy**, không còn chỉ là carpool. Mục tiêu là tạo một cổng thu nhập có kiểm soát cho người Việt ở nước ngoài, đặc biệt sinh viên/người mới định cư, mà không biến VIONA thành taxi app đơn lẻ.

### Sáu capability nội bộ

| ID | Capability | Bản chất effect | Activation posture |
| --- | --- | --- | --- |
| LO-05A | Viona Ride | Chuyến chở khách, pricing/ETA/location, settlement. | Wave B; city-country licensed gate. |
| LO-05B | Viona Delivery | Giao hàng/đồ ăn/giấy tờ trong scope cho phép. | Wave A2 bounded pilot. |
| LO-05C | Viona Errand | Mua hộ, lấy hàng, xếp hàng, việc vặt. | Wave A2 bounded pilot. |
| LO-05D | Viona Local Helper | Hỗ trợ người mới sang/orientation/accompaniment, không thay chuyên gia regulated. | Wave A2 bounded pilot. |
| LO-05E | Viona Student Jobs | Micro-jobs theo giờ/ca với work-hour/permit cap. | Wave A2; eligibility bắt buộc. |
| LO-05F | Viona Business Runner | Runner/delivery/operational errands cho merchant. | Wave A2/B tùy payment/merchant readiness. |

`LO-05A..F` là sub-capabilities; **MODULE_COUNT vẫn 63**.

### Eligibility trước matching

Account + S14 Country Policy tạo `EligibleCapabilitySet` theo exact market, policy version và thời hạn. Tối thiểu xét identity, residency/right-to-work, student hour limits khi áp dụng, age, tax/payout requirements, role-specific licence/vehicle/insurance và local rules. Không có proof thì fail closed hoặc hiển thị `Coming Soon / Not eligible in this market`.

Reference state machine:

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

Ngoại lệ: `NEEDS_MORE_EVIDENCE`, `CAPABILITY_SUSPENDED`, `MARKET_DISABLED`, `PAYOUT_HOLD`, `DISPUTE_REVIEW`, `EXPIRED_REVERIFICATION_REQUIRED`. Activation capability này không kéo theo capability khác.

### Job/Trip state machine

```text
REQUEST_DRAFT → REQUEST_SUBMITTED → QUOTE_PREPARED → CUSTOMER_CONFIRMED
→ MATCHING → PARTNER_OFFERED → PARTNER_ACCEPTED → PRE_EFFECT_REVALIDATION
→ ACTIVE → ARRIVED_OR_PICKED_UP → COMPLETION_PROPOSED → COMPLETION_CONFIRMED
→ PAYMENT_CAPTURE_OR_FINALIZATION → SETTLEMENT_PENDING → PARTNER_SETTLED → CLOSED
```

Terminal/exception tối thiểu: `CUSTOMER_CANCELLED`, `PARTNER_CANCELLED`, `NO_MATCH`, `EXPIRED`, `PAYMENT_FAILED`, `PROVIDER_UNKNOWN_PENDING_RECONCILIATION`, `DISPUTED`, `SAFETY_STOP`, `POLICY_BLOCKED`. Timeout/provider-unknown không được gọi là chắc chắn failure nếu external effect có thể đã xảy ra.

### Matching engine

Matching chỉ lấy partner đang có entitlement đúng capability/market. Candidate score có thể dùng ETA/khoảng cách, capability/vehicle/tool fit, ngôn ngữ, availability, trust/reliability history, fairness/anti-starvation, remaining work-hour cap và Country Policy constraints. Sensitive attribute không được dùng như shortcut ranking nếu không có lawful/policy basis.

### Pricing, payment và settlement

Không hard-code một commission toàn cầu. Market policy xác định thành phần giá và disclosure. S07 là source of truth cho tiền; S04 giữ AI/maps/SMS/voice/provider variable cost. Luồng tối thiểu:

```text
PAYMENT_INTENT → AUTHORIZED/RESERVED → SERVICE_ACTIVE → COMPLETION_EVIDENCE
→ CAPTURE_OR_FINALIZE → PLATFORM_FEE_LEDGER → PARTNER_PAYABLE
→ SETTLEMENT → PAYOUT_CONFIRMED
```

Refund, cancellation, chargeback, dispute và payout failure phải idempotent, reconcilable và audit được. AI không tự đổi số tiền/refund/payout ngoài tool + policy contract.

### Safety, privacy và location

Ride/Delivery/In-person Helper có risk profile khác nhau. Tối thiểu tích hợp S08 Trust, S13 Evidence, S15 Safety; masked communication khi phù hợp; report/block; trusted-contact sharing; incident evidence; account restriction có review path. Location được thu theo purpose: coarse/availability trước job, precise chỉ khi active service cần, hậu job chỉ giữ policy-required evidence. Không background-track vô hạn.

### Authority classes phải tách

Các effect như tạo confirmed job/trip, partner accept binding job, precise location sharing, payment capture, refund, partner payable/payout, consequential external message/call và safety escalation đều qua S03. `Prepare/recommend` không đồng nghĩa `execute`.

### Market × capability là activation unit

`CZ-Prague × Student Jobs` GREEN không làm `DE-Berlin × Ride` GREEN. Một capability chỉ từ Pilot → Production khi Country Policy, eligibility, Trust/Safety, Authority, Payment/Settlement, Cost/Margin, Dispute/Refund, Provider Reconciliation, Support/Incident và Kill-switch đều đạt; supply/fulfillment không được fake.

### Economics cần nhìn cả Partner và VIONA

Theo dõi Active Eligible Partners, Weekly Earning Partners, median partner net earning per active hour, match/accept/completion, cancellation/dispute/safety, payout success/latency, partner retention, take rate, variable cost, fraud loss và contribution margin/completed job. Không tối ưu GMV bằng cách hy sinh thu nhập người làm, safety, legality hoặc margin.

### Cross-universe flywheel

```text
ACADEMY skill / language / credential
→ ACCOUNT identity / eligibility / payout
→ LOCAL LO-05 jobs / mobility / helper marketplace
→ BUSINESS merchant demand / runner jobs
→ TRAVEL visitor demand / airport / local assistance
→ SOS safety / trusted contact / escalation
→ TRUST + EARNINGS HISTORY ↺
```

Partner Economy là income layer xuyên sáu universe nhưng **neo ở Local**, không là universe thứ bảy.


## Brokerage & Marketplace Runtime: từ nhu cầu đến commission có thể audit
**Tập 2 • 07 · TIỀN & DỮ LIỆU**
**Phạm vi:** NGUỒN D12 + THIẾT KẾ TRIỂN KHAI THAM CHIẾU
**Nguồn:** D12 §§0.2–0.2.10,2A,6B; D06 S03/S06/S07/S08/S10/S11/S13/S14

BME dùng chung runtime giao dịch; mỗi engine thêm domain policy chứ không tự tạo payment/provider/booking stack riêng.

### Canonical lifecycle

```text
DEMAND_CAPTURED
→ ELIGIBILITY_AND_POLICY_CHECK
→ SUPPLY_DISCOVERY
→ TRUST_AND_AVAILABILITY_CHECK
→ QUOTE_PREPARED
→ PRICE_FEE_POLICY_DISCLOSED
→ CUSTOMER_OR_BUSINESS_CONFIRMED
→ AUTHORITY_GRANTED
→ MONEY_OR_PROVIDER_RESERVATION_IF_REQUIRED
→ PROVIDER_OR_PARTNER_DISPATCH
→ PROVIDER_CONFIRMED
→ FULFILLMENT_PENDING
→ FULFILLED
→ COMMISSION_ELIGIBLE
→ COMMISSION_ACCRUED
→ COMMISSION_SETTLED
→ EVIDENCE_AND_REPUTATION
→ CLOSED
```

`COMMISSION_ELIGIBLE` phải bind một event contract cụ thể; không accrue commission chỉ vì user click hoặc vì Viona đã gửi request nếu business model yêu cầu completed outcome.

### Truth boundaries

| Claim | Không được suy ra |
| --- | --- |
| Search result | Còn inventory/slot/chỗ ở hiện tại. |
| Quote prepared | Final payable price chưa thay đổi. |
| Payment authorized | Provider đã xác nhận fulfillment. |
| Provider request sent | Booking/order/job đã thành công. |
| Partner accepted | Service đã hoàn tất. |
| Refund requested | Tiền đã về. |
| Lead delivered | Deal đã đóng. |

Nếu external effect có thể đã xảy ra nhưng response mất, dùng `UNKNOWN_PENDING_RECONCILIATION`; không retry mù bằng same business intent và tạo duplicate effect.

### Brokerage contract tối thiểu

```yaml
engine_id: BME-02
anchor_module: TR-06
market: CZ
capability: HOTEL_BOOKING
transaction_mode: MARKETPLACE_BOOKING
provider_or_supply_class: accommodation_provider
provider_of_record: <explicit>
merchant_of_record: <explicit_if_applicable>
commission_basis: <booking_confirmed|stay_completed|other>
commission_rate_or_formula: <versioned>
quote_ttl: <explicit>
refund_and_clawback_policy: <versioned>
authority_class: <explicit>
cost_class: <explicit>
evidence_schema: <explicit>
reconciliation_policy: <explicit>
ranking_policy_version: <explicit>
country_policy_version: <explicit>
```

### Supply/provider onboarding

Supply không được “verified” chỉ vì có URL/API key. Tối thiểu bind identity, provider contract, service scope, settlement/commission terms, cancellation/refund obligations, support owner, country coverage, provider credentials, status/health and kill switch. Real-estate/professional/ride/financial supply cần thêm domain-specific verification.

### Search, ranking và sponsored placement

Search ranking có thể dùng relevance, availability freshness, total value, trust, cancellation quality, distance, language/skill fit và user preference. Monetized boost chỉ ở lane sponsored đã label. Organic recommendation không được nhận hidden commission weight. Ranking telemetry phải đủ để audit vì sao item được đặt cao.

### Quote và price truth

Quote record cần source/provider ID, price components, currency, tax/fee, commission disclosure khi policy yêu cầu, cancellation/refund terms, expiry và `observedAt`. Nếu giá/provider terms thay sau user confirmation nhưng trước dispatch, phải re-confirm material change.

### Money và commission ledger

S07 giữ payment/refund/payout/settlement truth; BME thêm ledger view cho commission. Event tối thiểu:

```text
transaction.value.recorded
platform.fee.reserved
platform.fee.accrued
platform.fee.settled
platform.fee.clawed_back
supplier.payable.created
supplier.payout.settled
refund.recorded
chargeback.recorded
```

Không đếm cùng một amount vừa là GMV vừa là VIONA revenue. Refund/chargeback có thể claw back commission theo versioned contract.

### Reconciliation

Đối soát ba tầng: VIONA domain state ↔ money ledger ↔ provider/supplier truth. Daily/near-real-time jobs phát hiện booking provider-confirmed nhưng local pending, payout thiếu, refund mismatch, commission accrued khi fulfillment bị hủy, hoặc provider duplicated reference.

### Risk by engine

- `BME-01`: work-right, transport/licence, location, safety, payout.
- `BME-02`: live availability, final price, double booking, cancellation/refund, provider outages.
- `BME-03`: title/identity, listing truth, deposits/fees, discrimination/fairness.
- `BME-04`: service scope, qualification, no-show, in-person safety.
- `BME-05`: work rights, employer verification, fairness, hiring outcome truth.
- `BME-06`: supplier/MOQ/stock/logistics truth, commercial commitment, customs/policy.
- `BME-07`: licensed provider, suitability/financial promotions, custody/AML boundaries.
- `BME-08`: professional credentials, scope of advice, urgent escalation, sensitive data.

### Test matrix tối thiểu

Quote expires; provider price changes; double-submit; webhook duplicated/out-of-order; provider timeout after dispatch; payment captured/provider declined; partial fulfillment; cancel after supplier accepts; refund pending; chargeback; commission clawback; provider disabled mid-session; sponsored ranking mislabeled; country-policy changes; user consent revoked; supplier fraud report; unknown outcome aging.

### Kill switch và degrade

Mỗi engine/provider/capability có kill switch riêng. Khi external truth không đáng tin, degrade theo hướng `SEARCH_ONLY`, `LEAD_ONLY`, `PREPARE_ONLY` hoặc `HUMAN_HANDOFF`; không giữ button “Book/Pay/Dispatch” chỉ vì UI vẫn hoạt động.

### Brokerage Founder metrics

`verified_supply`, qualified demand, match rate, quote freshness, conversion, fulfillment, GMV/GTV, net brokerage revenue, take rate, refund/dispute/chargeback/fraud, repeat, partner/supplier earnings, contribution margin, unknown/reconciliation backlog và support burden. Không gọi scale-ready nếu một nhóm health đỏ.


## TR-06 Travel Booking & Distribution Engine: OTA/provider marketplace trong Companion OS
**Tập 2 • 07 · TIỀN & DỮ LIỆU**
**Phạm vi:** NGUỒN D12 + THIẾT KẾ TRIỂN KHAI THAM CHIẾU
**Nguồn:** D12 §2A; D05 TR-06; D06 S06/S07/S11/S13

TR-06 giữ top-level ID và mở tám capability nội bộ: Stay Search, Hotel/Apartment Booking, Rate & Availability, Hotel Partner Extranet, Booking Management/Cancel/Refund, GDS/Accommodation Gateway, Flights/Rail/Ground Distribution và Tours/Activities. Đây là nền cho `BME-02 Viona Travel Marketplace`, không tạo module 64–71.

### Hotel booking flow

```text
DESTINATION + DATES + GUESTS
→ SEARCH
→ PROPERTY DETAIL
→ ROOM/RATE
→ LIVE QUOTE REFRESH
→ TAX/FEE/CANCELLATION DISCLOSURE
→ GUEST DETAILS
→ PAYMENT/GUARANTEE PREPARE
→ USER CONFIRM
→ AUTHORITY
→ PROVIDER RESERVATION
→ PROVIDER CONFIRM
→ VIONA BOOKING RECORD + VOUCHER
→ MODIFY/CANCEL/REFUND
→ RECONCILIATION
→ REVIEW/TRUST
```

Hard rules: search result không là live room; live room không là confirmed reservation; displayed price không là final price nếu tax/fee/policy chưa validate; payment authorization không là hotel confirmation; provider timeout không là booking failed.

### Partner extranet

Direct-supply hotel/homestay lane cần property verification, room/rate calendar, policies, booking inbox, payout/settlement, support and fraud controls. Chưa có verified supply thì dùng provider/affiliate mode và ghi đúng mode; không giả direct inventory.

### Companion advantage

Sau hotel booking, VIONA có thể phối hợp airport transfer/Partner Economy, live interpreter, Local services, documents, SOS/embassy và disruption recovery. Đây là cross-universe composition, nhưng mỗi effect vẫn có authority/provider/money evidence riêng.


## Hợp đồng kinh tế chung: một giao dịch, một nguồn sự thật
**Tập 2 • 10 · MARKETPLACE & PARTNER ECONOMY**
**Phạm vi:** NGUỒN D12 + THIẾT KẾ THAM CHIẾU
**Nguồn:** D12 §§0.2.8–0.2.10; O05

Tám engine là tám cách tổ chức thị trường trên cùng nền tảng tin cậy. Chúng không được tạo tám sổ thanh toán hoặc tám bản người dùng độc lập.

### Chốt ai sở hữu công việc

Mỗi transaction có `transaction_id`, `primary_engine_id`, `domain_owner_module_id`, danh sách `contributing_engine_ids` và một `commission_contract_id`. LO-05 giữ gig/trip; LO-03 giữ service order; AC-09 giữ recruitment placement; TR-06 giữ accommodation reservation; TR-04 giữ vận tải liên tuyến. Khi ghép dịch vụ, tạo các child order có confirmation riêng thay vì dùng một trạng thái “đã đặt hết”.

### Commission contract, không chỉ một phần trăm

| Trường | Phải trả lời được |
| --- | --- |
| Payer và beneficiary | Ai trả phí; VIONA, provider hoặc Partner nhận khoản nào? |
| Event đủ điều kiện | Lead đã đạt tiêu chí, phòng được xác nhận, dịch vụ hoàn tất, placement được xác minh hay savings đã thực hiện? |
| Fee basis | Tính trên thành phần giá nào; có tính thuế, tip, refund hoặc khuyến mãi không? |
| Accrual / settlement | Khi nào phát sinh khoản phải thu và khi nào tiền thực sự về? |
| Reversal / clawback | Hủy, chargeback hoặc evidence sai sẽ đảo khoản nào bằng event nào? |
| Attribution | Giao dịch đến từ engine nào; một hợp đồng nhiều nguồn được phân bổ ra sao mà không thu trùng? |

### Dòng tiền phải đối soát được

1. Tạo quote với tổng giá và điều kiện hiện hành; không dùng giá cache làm giá thanh toán.
2. Xác định ai là bên thu tiền và ai xác nhận fulfillment; disclosure trước consent/authority.
3. Khi event hợp đồng xảy ra, ghi accrual một lần theo idempotency key; không dùng search click để giả completed outcome.
4. Đối soát provider/PSP receipt và phí thực; phân biệt receivable, settled cash, refund và supplier payable.
5. Nếu hủy hoặc chargeback, ghi reversal tham chiếu original ledger event; không xóa lịch sử.
6. Báo cáo mỗi transaction một lần ở cấp toàn nền tảng; các engine phụ chỉ có attribution theo contract.

### Tránh lợi nhuận ảo

GMV/GTV không phải doanh thu VIONA. Nếu revenue đã là net commission thì supplier payout không được trừ lần hai như một expense của cùng phép tính. Khoản VIONA tài trợ, payment/provider cost, AI/voice, support và tổn thất phải có owner/account riêng. Cách trình bày kế toán cuối cùng là quyết định chuyên môn còn cần review theo mô hình thương mại thực tế.

### Liên kết không phải gộp rủi ro

Một booking khách sạn thành công không chứng minh trip sân bay đã có tài xế. Một người được duyệt nhận gig không tự đủ điều kiện làm taxi. Context có thể chia sẻ qua consent; authority, eligibility, payment và outcome vẫn phải riêng theo từng hệ quả.


## Brokerage: giới hạn thu phí và bảo vệ niềm tin
**Tập 2 • 10 · MARKETPLACE & PARTNER ECONOMY**
**Phạm vi:** POLICY SẢN PHẨM / ĐIỀU KIỆN TRIỂN KHAI CÒN MỞ
**Nguồn:** D12 §0.2.9; D04; O05

Đây là luật thiết kế của VIONA, không phải chứng nhận hoạt động hợp pháp tại mọi thị trường. Một engine được thông qua về sản phẩm vẫn cần pháp lý, provider, privacy và vận hành riêng trước khi mở giao dịch.

### Năm câu hỏi trước khi thu phí

1. Người dùng đang nhận một lead, referral, dịch vụ của VIONA hay dịch vụ của đối tác?
2. Ai ký hợp đồng, thu tiền, xử lý khiếu nại và chịu trách nhiệm hoàn tiền?
3. Phí giới thiệu hoặc chia phí đã được review cho đúng ngành và jurisdiction chưa?
4. User thấy tổng giá, nguồn tài trợ xếp hạng và quan hệ commission trước khi chọn chưa?
5. Dữ liệu nào được chia sẻ, với ai, cho mục đích nào và bao lâu?

Không trả lời được thì giữ mode đó ở `GATED`; không suy ra giấy phép của đối tác bao phủ mọi vai trò của VIONA.

### Các engine nhạy cảm

| Engine / tình huống | Policy trước khi kích hoạt |
| --- | --- |
| BME-07 · Tài chính | Vai trò comparison/referral, thông điệp tài chính, custody/payment, fee và partner responsibilities phải có review riêng; không hứa đầu tư an toàn hoặc lợi nhuận bảo đảm. |
| BME-08 · Chuyên gia | Kiểm tra credentials, phạm vi tư vấn, quyền referral/fee-sharing, consent và hỗ trợ con người; không để AI tự quyết chuyên môn. |
| BME-03 · Nhà đất | Phân biệt listing/lead với môi giới giao dịch; property provenance không đồng nghĩa xác nhận quyền sở hữu pháp lý cuối cùng. |
| BME-05 / LO-05E · Việc làm | Work-right/age/contract theo market; ưu tiên employer-paid; không bán lời hứa được việc hoặc thu nhập. |
| SOS có đối tác trả phí | Không làm chậm trợ giúp cốt lõi, không xếp mức ưu tiên cứu trợ theo commission. |

### SOS không trở thành phễu bán hàng

`SOS Core = FREE`; `SOS Plus = MONTHLY_PAID`. Cảnh báo và trợ giúp cốt lõi không bị khóa vì user chưa thanh toán. Khi tình huống đã phù hợp cho dịch vụ bổ sung, user phải thấy rõ đây là lựa chọn có phí, ai thực hiện, giới hạn trách nhiệm và cách chuyển người thật. Không gắn điều kiện “mua thêm mới được trợ giúp”.

### Kiểm thử niềm tin

Sponsored placement thiếu nhãn, provider commission cao nhưng không đủ eligibility, fee không xuất hiện trong quote, consent bị thu hồi, legal scope thay giữa phiên, refund làm commission phải đảo và safety event đang mở đều phải có negative test. Khi một test trọng yếu không đạt, chặn đúng activation unit; không dùng revenue để hợp lý hóa mở cổng.


## Privacy, retention và xóa dữ liệu
**Tập 2 • 07 · TIỀN & DỮ LIỆU**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 privacy; D04; BU-13; reference design

Xóa dữ liệu là một workflow nhiều nơi, không chỉ DELETE một row.

### Deletion request

1. Xác minh subject và scope; không thu dữ liệu thừa để xác minh.
2. Lập data inventory: primary DB, object store, search/vector index, caches, analytics, provider copies, backups.
3. Áp retention/legal-hold policy đã được luật sư/country owner duyệt.
4. Thực hiện deletion/anonymization theo scope có evidence; revoke tokens và future processing.
5. Đối soát receipts, unresolved provider copies và backup expiry.
6. Thông báo chính xác đã xóa phần nào, phần nào giữ vì căn cứ hợp lệ; không hứa sạch toàn hệ thống khi còn pending.

### Purpose-bound access

Transcript Voice, health, children và location có rủi ro cao; giảm retention và quyền đọc. Support không mặc định xem audio. Consent revocation phải ảnh hưởng retrieval/memory, không chỉ một UI checkbox.

### Nguồn chính sách

Blueprint định hướng privacy, không phải chứng nhận pháp lý. Thời hạn/lawful basis/DPIA/DSAR timelines cần country-specific professional review; sách không tự đặt ngày giữ dữ liệu làm luật chung.

### Test

Delete rồi search không còn nội dung; revoke rồi signal engine không dùng fact; legal hold không làm lộ data cho AI; retry deletion không xóa tenant khác; backup restore không vô tình resurrect dữ liệu đã xóa.


## Offline, sync và thời gian
**Tập 2 • 07 · TIỀN & DỮ LIỆU**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 R2/R3; SO-05; reference design

Mạng yếu là trạng thái bình thường; local cache không được giả thành external truth.

### Offline behavior

1. Phân loại capability offline read, offline draft hay requires online effect.
2. Cache nguồn có version/expiry và encrypt dữ liệu nhạy cảm.
3. Cho người dùng chuẩn bị draft offline, rõ chưa gửi/chưa đặt.
4. Khi reconnect, revalidate consent, authority, quote/capacity và policy; không blind flush mọi command.
5. Sync bằng IDs/version, conflict surfaced khi ảnh hưởng người dùng; server truth cho effect đã committed.

### Thời gian

| Lưu | Không làm |
| --- | --- |
| UTC instant + IANA timezone + local intent | Không chỉ lưu “thứ Sáu 15h” thiếu ngày/zone. |
| Clock/expiry theo server với skew policy | Không tin đồng hồ máy user cho authority expiry. |
| DST ambiguity được hỏi xác nhận | Không chọn 1 trong 2 giờ lặp âm thầm. |
| ObservedAt và sourceOccurredAt riêng | Không lấy thứ tự webhook nhận làm chronology tuyệt đối. |

### Offline SOS

Hiển thị pack/contacts đã tải và độ mới; không nói đang dispatch khi không có network/provider confirmation. Nút gọi hệ thống chỉ có capability thực, không giả emergency routing toàn cầu.


## Localization và Country Packs
**Tập 2 • 07 · TIỀN & DỮ LIỆU**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 markets; D03 §19; D06 S14

“Global” là khả năng thích nghi có kiểm soát, không phải mọi dịch vụ đều live ở mọi quốc gia.

### Một country pack cần gì

| Lớp | Nội dung |
| --- | --- |
| Language | UI copy, speech support, date/currency/address conventions, fallback. |
| Capability | Feature availability theo mode, region, provider và device. |
| Legal/safety | Disclosure/recording/privacy/payment scope và contacts đã review. |
| Commercial | SKU, taxes/fees, billing provider, currency, funding caps. |
| Operations | Support hours, SLA, escalation language, incident owner. |

### Activation

1. Version pack và nguồn policy; có expiry/review date.
2. Test critical facts bằng người dùng ngôn ngữ địa phương.
3. Kiểm supply city/category thực sự nhận được request/calls.
4. Pilot theo provider-language-country, không global flag mơ hồ.
5. Rollback pack/feature flags có migration/compatibility để user không bị kẹt.

### Smart language behavior

Tiếng Việt là entry dễ hiểu; conversation có thể dùng ngôn ngữ bản địa, nhưng critical terms cần confirmation. Không nói model fluent nghĩa là đủ legal/medical translation capability.

### Từ pilot tới market

Czechia là thị trường tham chiếu trong founding cluster CZ/DE/PL/SK. Không gọi cả cluster production nếu mới có vài merchant hoặc một provider pilot.


## Observability và evidence có thể tra cứu
**Tập 2 • 08 · RELIABILITY**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02; D04 health; D07; reference telemetry

Một incident phải truy ngược được từ user outcome đến authority, provider và phiên bản code.

### Correlation tham chiếu

```text
journeyId → requestId → prepareId/hash
→ authorityId → attemptId → providerCallId
→ bookingId / paymentRef
→ costReservationId → reconciliationCaseId
→ releaseVersion / policyVersion / modelVersion
```

### Thu và bảo vệ logs

1. Thu structured events theo schema, không stdout tự do làm source duy nhất.
2. Redact secrets/PII/audio; token IDs và hashes local chỉ trong evidence access-controlled.
3. Gắn observed times, state transitions, producer và event IDs.
4. Dashboard theo market/language/provider và severity; alert route-specific.
5. Retention và export tuân policy; evidence lookup không vượt tenant quyền của support.

### Số liệu không được bịa

Reported, measured, inferred và not-run có field riêng. Static assertion count không phải test coverage semantic; chữ GREEN không thay test receipt/exit code và exact artifacts.

### Audit khác analytics

Audit phục vụ trace hành động/authority; analytics phục vụ product measurement. Không thu “tất cả để sau này dùng AI” rồi gọi đó là cần thiết cho safety.


## Triển khai, canary và rollback
**Tập 2 • 08 · RELIABILITY**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 R7; D07; reference release workflow

Rollback code không hoàn tác cuộc gọi đã gọi hoặc tiền đã chuyển.

### Release pipeline

1. Freeze exact candidate/source manifest và review theo phạm vi.
2. Build bằng toolchain/dependencies được phép; bind binary/container/asset hashes.
3. Deploy staging dưới authority riêng; smoke/regression và migrations nếu có gate riêng.
4. Canary theo cohort/country/provider; theo dõi error, false commitments, cost và support.
5. Gate rộng hơn chỉ khi tiêu chí đạt; severe incident tắt feature/route, không tự nâng lại.
6. Rollback artifact/config tương thích; reconcile các in-flight effect và data migration riêng.

### Release dossier

| Bắt buộc | Ví dụ |
| --- | --- |
| Identity | Commit/tree, image digest, mobile build IDs, API version. |
| Scope | Flags, markets, providers, SKU, excluded capabilities. |
| Evidence | Test results, review, performance, privacy/security checks. |
| Recovery | Kill switch, rollback target, DB compatibility, pending attempts. |
| Authority | Ai cho deploy, ai mở provider/production, expiry và limits. |

### Native mobile

Development build/Expo preview không phải bằng chứng store release hoặc thiết bị thực. Source Expo phân biệt development builds dành cho phát triển; signed production/store readiness vẫn cần kiểm riêng. [W07]


## Bảo mật hệ thống: threat model trước checklist
**Tập 2 • 08 · RELIABILITY**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 safety; D04; D07; reference design

Xác định tài sản, kẻ tấn công và trust boundaries; không gắn nhãn zero-trust để thay kiểm chứng.

### Threat → control

| Threat | Control/lớp kiểm |
| --- | --- |
| Prompt injection | Tool schema+policy, least-privilege credentials, trusted facts. |
| Cross-tenant IDOR | Resource ownership predicate và negative tests. |
| Webhook giả/replay | Provider signature, event dedup, timestamp/replay policy. |
| Secret leak | Vault, scoped credentials, no model/client secrets, rotation. |
| Tampered artifact | Exact hash + trusted provenance/review, no silent regeneration. |
| Provider/delivery ambiguity | At-most-once attempt, reconciliation, held reserve. |
| Privileged host compromise | Threat-model limitation; không hứa DACL chống administrator/kernel. |

### Bộ đánh giá

1. Lập data-flow và trust-domain diagram.
2. Chọn abuse cases theo từng consequential action.
3. Thiết kế controls máy có thể kiểm, xác định gaps.
4. Test adversarial, review độc lập và ghi residual risks.
5. Revisit khi thêm provider/module/context có quyền cao hơn.

### Authz vs authentication

Authz Windows trong appendix chỉ là proof context bootstrap. Product authorization dùng domain/tenant/policy phù hợp backend; không copy local Windows SID law thành quyền end-user VIONA.


## Test pyramid và evidence gates
**Tập 2 • 08 · RELIABILITY**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 acceptance; D07 verifier; D04 metrics

Mỗi test phải có input, oracle, execution context và giới hạn rõ.

### Lớp test

| Loại | Chứng minh | Không chứng minh |
| --- | --- | --- |
| Unit/pure | Validation, canonicalization, state projection, cost math. | Provider hoạt động thật. |
| Contract | Schema/version/error adapter parity. | Runtime under concurrency đầy đủ. |
| Integration | DB constraints, outbox, tenant, policy boundaries. | Market/legal readiness. |
| Behavioral | Actual tools/devices/provider sandbox trong scope. | Mọi phiên bản tương lai. |
| Adversarial/chaos | Retries, lost ACK, race, injection, budgets. | Không còn mọi lỗ hổng. |
| Pilot/operations | Real outcomes/support/cost trong cohort. | Scale toàn cầu tự động. |

### Evidence receipt

1. Ghi exact input/artifact/environment identities.
2. Ghi command/test ID, exit code, timestamps và observed results.
3. Phân loại PASS/FAIL/NOT_RUN/NOT_PROVEN theo oracle.
4. Independent verifier đọc artifact thật, không chỉ summary builder.
5. Promotion scope phải khớp phạm vi test; chưa chạy device thì vẫn NOT_RUN.

### Regression của chính governance

Thêm test bắt hash sai độ dài, copied predecessor reference active, PRE/POST metadata so sai, hard-coded zero, thiếu failure journal, formatter LF. Đừng chỉ lặp source-string scan 100 lần rồi gọi machine proof hoàn chỉnh.


## API specification và ví dụ error contract
**Tập 2 • 08 · RELIABILITY**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D02 API contracts; reference design

Đây là mẫu thiết kế để chuyển vào ADR/implementation contract, không phải danh sách endpoint hiện đang deployed.

### API shape minh họa

```text
POST /requests                 → REQUEST_CREATED
POST /bookings/holds            → HOLD_CREATED
POST /bookings/confirm          → CONFIRMED | OFFER_CHANGED
POST /voice/call-drafts         → PREPARED
POST /authority/requests        → REVIEW_REQUIRED
POST /voice/attempts            → DISPATCH_ACCEPTED
GET  /attempts/{id}             → composite status
POST /provider-webhooks/{name}  → durable inbox ACK
```

### Lỗi có nghĩa

| Code tham chiếu | Client behavior |
| --- | --- |
| AUTHORITY_MISMATCH / EXPIRED | Không thử lại tự động; yêu cầu chuẩn bị/xác nhận hợp lệ. |
| BUDGET_INSUFFICIENT | Không dispatch; trình bày allowance/cap minh bạch. |
| OFFER_CHANGED / VERSION_CONFLICT | Đọc offer mới, re-confirm nếu consequential fields đổi. |
| PROVIDER_OUTCOME_UNKNOWN | Hiển thị đang đối soát; tránh nút retry tạo trùng. |
| TENANT_ACCESS_DENIED | Không trả resource contents; log tối thiểu. |

### Contract cần đầy đủ

Request/response schemas, enum meanings, nullable unknown values, idempotency scope, auth, permissions, retries, rate limit, versioning và audit requirements. Không ghi HTTP500 cho mọi kết quả rồi để AI tự giải thích.

### Current endpoint truth

Một số endpoint request/recovery xuất hiện trong lịch sử dự án. Sách không xác nhận route hiện đang deployed; cần đọc code và staging/readback trong lane có quyền trước dùng.


## Từ ý tưởng tới module có thể mở cổng
**Tập 2 • 09 · NẠP MODULE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D05 §7; D06; D03 §18; reference lifecycle

63 module không phải 63 ứng dụng độc lập. Mỗi module là domain logic/UI + các socket hợp đồng dùng chung.

### Lifecycle kỹ thuật

1. Giữ nguyên module ID/name/source intent; xác định release scope nhỏ và excluded scope.
2. Map dependency sockets, tenant data, market/provider, risk và monetization.
3. Viết typed module contract, journey, error states, test oracle và evidence plan.
4. Builder làm code trong write set; verifier phản biện cùng exact contract.
5. Tích hợp module ở trạng thái disabled/gated; chạy contract/regression/offline tests được phép.
6. Pilot activation riêng theo flags/quotas/market/language/provider.
7. Đo outcomes/economics/support; promote hoặc degrade. Không dùng plugin install đồng nghĩa production activation.

### Capability registration tham chiếu

```text
moduleId / moduleVersion / contractSha256
capabilityIds / requiredSockets / dependencies
markets / languages / deviceRequirements
readiness: DESIGNED | PILOT | PRODUCTION | GATED
allowedEffects / authorityProfile / budgetPolicy
evidenceRefs / rollbackProfile / owner
```

### Không tự nạp code chưa review

Module registry phải reject unknown schema/signature/provenance hoặc incompatible socket. Feature flag chỉ là một control bổ sung, không thay source/binary/security review.


## Module acceptance: một mẫu dùng chung
**Tập 2 • 09 · NẠP MODULE**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D06; D07; template tham chiếu

Một hồ sơ tốt giúp Swarm xây xong một outcome thay vì tạo UI chưa có phần xử lý.

### Hợp đồng module

| Mục | Nội dung cụ thể |
| --- | --- |
| Problem/outcome | Ai, công việc gì, result xác nhận bằng nguồn nào. |
| Scope | Included/excluded actions, device/country/partner limitations. |
| Data | Owned entities, foreign references, sensitivity, retention. |
| Commands/events | Schema/version, idempotency, failure and unknown semantics. |
| Authority/cost | Policy issuer, prepare hash, consent, budgets, retries. |
| Integration | Sockets, backward compatibility, write-set ownership. |
| Testing | Unit/contract/integration/adversarial/pilot criteria. |
| Operations | Dashboards, alerts, support, disable and recovery. |
| Economics | Revenue basis, variable cost, funding, usage caps. |

### Điều kiện đóng

Test receipts tồn tại; exact artifacts được independent review; không required test bị NOT_RUN rồi gọi PASS; UI/runtime truth không mâu thuẫn; provider cost/unknown cases có owner; activation được cấp riêng.

### Tách design và evidence

Acceptance criteria là điều muốn chứng minh; test result là điều đã quan sát. Một matrix điền “required=true” không phải matrix runtime đã đạt.


## S21 Spatial/XR và các module frontier
**Tập 2 • 09 · NẠP MODULE**
**Phạm vi:** NGUỒN + THIẾT KẾ THAM CHIẾU
**Nguồn:** D08; D06 S20; D03 launch successor

XR là giao diện tương tác mới cho core, không một universe riêng và không đường lách authority.

### Direction nguồn

D08 chọn OpenXR-first và vendor extensions khi cần, target Quest-class/future XR. Đây là hướng chiến lược, không chứng minh device support hoặc hardware đã kiểm thử. S20/S21 cần ADR naming/capability ownership.

### XR integration

1. Map intent/scene state về cùng identity/consent/sockets của VIONA.
2. Không để gaze/gesture mơ hồ trở thành approval money/action; dùng confirmation phù hợp risk.
3. Giảm location/biometric/room-map collection, retain đúng purpose.
4. Thiết kế fallback về mobile/web và accessibility/reduced motion.
5. Test device actual, lost tracking, false gesture, comfort/safety, offline và guardian boundaries trước activation.

### Module liên quan

BU-11 storefront; TR-08 concierge; AC-07 vocation simulator; các module dùng camera/spatial context. Scene overlay có thể hiển thị menu/course nhưng price/booking vẫn từ domain service authoritative.

### Grand Launch scope

D08 cũ có câu R9 Grand Launch; D03 đã đổi thứ tự launch. Giữ XR/frontier là expansion có kiểm soát, không kéo mọi tham vọng XR thành prerequisite cho Wave C signature.


## Bản đồ 63 module ↔ 8 brokerage engine
**Tập 3 • 10 · CATALOG 63 MODULE**
**Phạm vi:** NGUỒN D12 / CROSS-REFERENCE
**Nguồn:** D12 §0.2.1; D05/D06 module catalog

Bảng này không tạo module mới; nó chỉ chỉ ra module nào là anchor/supply/support cho economic engine.

| Engine | Module anchor | Module hỗ trợ nổi bật | Điều không được suy ra |
| --- | --- | --- | --- |
| BME-01 Mobility & Partner | LO-05 | AT/BU/TR/SO sockets và journeys | LO-05 GREEN không làm Ride mọi nước GREEN. |
| BME-02 Travel Marketplace | TR-06 | TR-01/04/05/07 | Hotel search không có nghĩa in-app booking đã live. |
| BME-03 Home & Real Estate | LO-02 | BU-07 | Listing không là verified title/deal closed. |
| BME-04 Service Marketplace | LO-03 | LO-01 + Business supply | Lead sent không là service completed. |
| BME-05 Talent Marketplace | AC-09 / AC-03 | BU-04 + Account eligibility | Match không là hired; không tự động tuyển dụng. |
| BME-06 B2B Supply | BU-06 / BU-10 | BU-03 | Suggested supplier không là stock/price/contract truth. |
| BME-07 Money Marketplace | AT-01 | AT-02/05/08/09 | Comparison/referral không là VIONA custody/licence. |
| BME-08 Trusted Professional Network | LO-04 / SO-02 | SO-04, BU-12, AT-02, TR-01 | Referral không là professional conclusion hay emergency guarantee. |

Trong hồ sơ module, “brokerage role” là cross-reference economics; không thay original module description.


## Business · 14 module
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** CATALOG NGUỒN / KẾ HOẠCH
**Nguồn:** D05 original catalog; D06 planning proposals; D03 successor

Vận hành, revenue và khách hàng

### Ranh giới universe

Booking/calendar/price belongs to Business; money/evidence/authority dùng sockets, không sao chép. BU-08 voice và BU-02 salon tạo một vòng giá trị rõ; các vertical còn lại mở theo supply và device/legal readiness.

### Danh mục chính xác

| Mã | Tên gốc | Wave / P / Risk |
| --- | --- | --- |
| BU-01 | Core POS & Smart Kitchen | A / P1 / R2 |
| BU-02 | Salon & Beauty Engine | A / P0 / R1 |
| BU-03 | Asia Grocery & Potraviny | A / P1 / R2 |
| BU-04 | Staff Shift Optimizer | A / P1 / R2 |
| BU-05 | Local Reputation & SEO | A / P0 / R1 |
| BU-06 | Cross-border Logistics Hub | B / P1 / R2 |
| BU-07 | Franchise Hub & Commercial Lease | B / P1 / R2 |
| BU-08 | Autonomous Voice Receptionist | A / P0 / R2 |
| BU-09 | Predictive Strategy Engine | C / P2 / R2 |
| BU-10 | Autonomous Supply Negotiator | C / P2 / R3 |
| BU-11 | Spatial AR Storefront | C / P3 / R4 |
| BU-12 | AI Tax Audit Defender | D / P3 / R3 |
| BU-13 | GDPR Compliance Auto-Pilot | B / P1 / R3 |
| BU-14 | Spot-Market Energy Optimizer | C / P2 / R3 |

### Cách đọc các hồ sơ tiếp theo

Mô tả gốc giữ nguyên D05. Wave/priority/risk/socket/revenue theo đề xuất D06, không là trạng thái đã live hay cấp phép. Trình tự, data entities, commands, tests, KPIs và release đề xuất do sách bổ sung để triển khai có kiểm soát.


## BU-01 · Điểm bán và bếp thông minh
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-01; D06 · Wave A, P1, R2; sockets S03, S04, S07, S11, S13, S18

Core POS & Smart Kitchen

**Kế hoạch D06:** Wave A; P1; risk R2; sockets S03, S04, S07, S11, S13, S18.

### Mô tả gốc · D05

Máy tính tiền, chia hóa đơn, kết nối cân điện tử, máy quét mã vạch, KDS điều phối bếp.

### Mục đích và bản đầu đề xuất

Chủ nhà hàng muốn bàn, đơn món, bếp và thanh toán cùng phản ánh một giao dịch, kể cả giờ cao điểm. Khởi đầu POS một chi nhánh và luồng đơn tới bếp; chỉ bật cân, máy quét, máy in sau kiểm thử model thiết bị cụ thể.

### Luồng kỹ thuật đề xuất

1. Nhân viên chọn bàn và món theo catalog có phiên bản.
2. Tách món theo trạm bếp, gửi kitchen ticket có ID chống trùng.
3. Bếp xác nhận nhận/chế biến/hoàn tất; màn khách không suy trạng thái từ việc gửi thành công.
4. Chia hóa đơn theo món hoặc người; chốt payment bằng provider truth.
5. Đóng ca, đối chiếu tiền và lưu audit mọi void/refund.

### Dữ liệu / quyền sở hữu

Order, OrderLine, TableSession, KitchenTicket, Tender và ShiftClose; mỗi dòng giữ tenant, location, tax category, price version, modifier, người thao tác. Không dùng tồn kho cache làm số dư sổ cái.

### Lệnh và sự kiện tham chiếu

placeOrder → order.accepted → kitchen.ticket.queued; acknowledgeTicket → kitchen.accepted; closeBill → payment.reconciled. Outbox giữ đồng bộ POS/KDS, sequence theo order, không phát lại món vì máy in timeout.

### Test phải có

Hai POS cùng sửa một bàn. • Máy in nhận lệnh nhưng mất ACK. • Một món bị hủy sau khi bếp làm. • Chia hóa đơn và refund một phần không lệch tổng.

### Ranh giới và điều kiện mở cổng

AI không tự đổi giá, hoàn tiền hoặc xóa order. Chế độ mất mạng không được tự chốt payment chưa có bằng chứng. Thuế và chứng từ địa phương cần cấu hình đã duyệt. Chưa có bằng chứng production cho catalog thiết bị, fiscal adapter hay ủy quyền hoàn tiền; cần ADR và pilot nhà hàng.

### KPI và economics

Thời gian nhận đơn; tỷ lệ ticket trùng; sai lệch đóng ca; contribution theo chi nhánh. Nguồn thu đề xuất D06: Business SaaS + transaction.


## BU-02 · Điều hành salon và làm đẹp
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-02; D06 · Wave A, P0, R1; sockets S03, S04, S07, S11, S18

Salon & Beauty Engine

**Kế hoạch D06:** Wave A; P0; risk R1; sockets S03, S04, S07, S11, S18.

### Mô tả gốc · D05

Chia hoa hồng thợ (split tip), xoay tua thợ (turn-based), quản lý vật tư hóa chất.

### Mục đích và bản đầu đề xuất

Giảm mất khách vì không nghe máy, lịch chồng và chia lượt/hoa hồng thiếu minh bạch. Một salon: dịch vụ, kỹ năng thợ, độ dài ca, bảng giá và lịch hẹn; voice nối BU-08 khi được cấp quyền.

### Luồng kỹ thuật đề xuất

1. Chủ salon khai kỹ năng, duration, buffer và luật chia lượt.
2. Hệ thống đưa slot phù hợp; giữ chỗ hữu hạn, chưa gọi là booking.
3. Khách xác nhận dịch vụ, thời gian và giá.
4. Commit booking với version/capacity check; gửi xác nhận sau đối soát.
5. Hoàn tất dịch vụ, tính tip/commission bằng luật đã duyệt, trả lịch sử khách.

### Dữ liệu / quyền sở hữu

ServiceVariant, StaffSkill, AvailabilityWindow, SlotHold, Booking, CommissionRule, TipAllocation; lưu đơn vị tiền nhỏ nhất và rule version, không tính phần trăm bằng floating point.

### Lệnh và sự kiện tham chiếu

holdSlot → slot.held; confirmBooking → booking.confirmed; completeVisit → visit.completed; allocateTip → tip.allocated. Chỉ Business sở hữu lịch; Local và Voice dùng application service chung.

### Test phải có

Hai khách chọn cùng thợ/cùng giờ. • Service dài hơn slot hoặc thợ thiếu kỹ năng. • Tip chia lẻ không mất đồng. • Đổi ca khi khách đã xác nhận.

### Ranh giới và điều kiện mở cổng

Không có “PARALLEL” nào cho phép booking/commission production không qua gate. Risk R1 của bảng ưu tiên chỉ là nhãn lập kế hoạch, không bao phủ mọi action có tiền. Luật turn-based, tiền tip, cancellation và ngành dịch vụ cụ thể phải được merchant duyệt trước pilot.

### KPI và economics

Tỷ lệ đặt thành công; no-show; giờ kín lịch; thời gian chủ salon tiết kiệm; chi phí/booking. Nguồn thu đề xuất D06: Business SaaS.


## BU-03 · Cửa hàng châu Á và Potraviny
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-03; D06 · Wave A, P1, R2; sockets S03, S04, S07, S11, S18

Asia Grocery & Potraviny

**Kế hoạch D06:** Wave A; P1; risk R2; sockets S03, S04, S07, S11, S18.

### Mô tả gốc · D05

Quản lý kho theo lô/hạn sử dụng, gợi ý hạ giá hàng cận date, công nợ sỉ/lẻ.

### Mục đích và bản đầu đề xuất

Giúp chủ cửa hàng biết chính xác hàng nào còn, lô nào sắp hết hạn và khách sỉ còn nợ bao nhiêu. Quản lý lô, hạn dùng và công nợ trước; khuyến nghị giảm giá cần người duyệt, không tự đăng giá mới.

### Luồng kỹ thuật đề xuất

1. Nhập lô với chứng từ, đơn vị và hạn dùng.
2. Bán hàng trừ đúng lô theo rule FEFO đã cấu hình.
3. Cảnh báo lô cận hạn bằng thời điểm thực, không dự báo giả.
4. Chuẩn bị đề xuất giảm giá trong biên merchant; publish qua authority.
5. Đối soát trả hàng, hủy hàng và công nợ sỉ.

### Dữ liệu / quyền sở hữu

SKU, UnitConversion, BatchLot, StockMovement, ExpiryPolicy, SupplierInvoice, Receivable. Tồn kho là tổng chuyển động có audit; sửa trực tiếp quantity làm mất provenance.

### Lệnh và sự kiện tham chiếu

receiveBatch → inventory.received; sellBatch → stock.decremented; approveMarkdown → price.published; recordWaste → inventory.written_off. Inventory reservation và sale commit phải nhất quán.

### Test phải có

Kg/g/thùng đổi đơn vị sai. • Bán đồng thời lô cuối. • Hàng trả về sau hết hạn. • Clock/timezone làm cảnh báo cận hạn lệch ngày.

### Ranh giới và điều kiện mở cổng

Không tuyên bố hạn dùng an toàn từ ảnh mờ; hàng bị thu hồi/cấm bán phải do policy/merchant xác minh. Hạ giá không hợp thức hóa hàng không đủ điều kiện. Kết nối kế toán, quy định thực phẩm và import supplier feed là dependencies chưa được chứng minh live.

### KPI và economics

Waste theo lô; sai lệch stocktake; stockout; tuổi công nợ; margin sau hao hụt. Nguồn thu đề xuất D06: Business SaaS + commerce.


## BU-04 · Xếp ca và chấm công có kiểm soát
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-04; D06 · Wave A, P1, R2; sockets S01, S02, S10, S13, S18

Staff Shift Optimizer

**Kế hoạch D06:** Wave A; P1; risk R2; sockets S01, S02, S10, S13, S18.

### Mô tả gốc · D05

Tự động xếp ca làm việc, chấm công GPS/khuôn mặt.

### Mục đích và bản đầu đề xuất

Ghép nhu cầu phục vụ với người có kỹ năng, đồng thời bảo vệ quyền riêng tư của nhân viên. Tạo đề xuất ca từ lịch rảnh/kỹ năng và xác nhận manager; GPS hoặc khuôn mặt là tùy chọn hard-gated, không mặc định.

### Luồng kỹ thuật đề xuất

1. Nhân viên khai availability và nghỉ phép.
2. Engine tạo roster theo giờ làm, kỹ năng và giới hạn đã duyệt.
3. Manager xem xung đột và phê duyệt phiên bản.
4. Nhân viên nhận lịch, xác nhận đổi ca có audit.
5. Chấm công tối thiểu rồi export bảng đối chiếu cho người có quyền.

### Dữ liệu / quyền sở hữu

StaffProfile, AvailabilityPreference, ShiftDemand, RosterVersion, TimeEntry, ShiftSwap. Tách dữ liệu payroll/private HR khỏi lịch công khai của chi nhánh.

### Lệnh và sự kiện tham chiếu

proposeRoster → roster.prepared; approveRoster → roster.published; requestSwap → swap.pending; attestTime → time.recorded. Không tự sửa salary hay employment contract.

### Test phải có

Ca qua nửa đêm/DST. • Hai người nhận cùng ca. • Nhân viên thu hồi location consent. • Manager tenant A truy cập thời gian tenant B.

### Ranh giới và điều kiện mở cổng

Biometric attendance không tự được bật vì nguồn có nêu; cần privacy/legal review, thay thế không sinh trắc học và chính sách nhân sự phù hợp. Quy tắc lao động từng nước, authority manager và mục đích GPS/biometric cần chốt riêng.

### KPI và economics

Shift fill rate; giờ vượt kế hoạch; số lần sửa thủ công; tranh chấp time entry. Nguồn thu đề xuất D06: Business SaaS.


## BU-05 · Danh tiếng địa phương và SEO
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-05; D06 · Wave A, P0, R1; sockets S05, S06, S09, S13, S17

Local Reputation & SEO

**Kế hoạch D06:** Wave A; P0; risk R1; sockets S05, S06, S09, S13, S17.

### Mô tả gốc · D05

Tự động phát hiện đánh giá xấu trên Google/TripAdvisor và soạn phản hồi.

### Mục đích và bản đầu đề xuất

Giúp doanh nghiệp phản hồi đánh giá đúng lúc mà không bịa khách hàng hoặc phá uy tín. Thu nhận review qua nguồn được phép, phát hiện vấn đề và soạn bản nháp; chủ doanh nghiệp duyệt trước publish.

### Luồng kỹ thuật đề xuất

1. Kết nối account có quyền với platform review.
2. Đồng bộ review ID, thời gian và source link.
3. Phân loại câu hỏi/khiếu nại, tách dữ kiện khỏi suy đoán.
4. Soạn phản hồi theo tone/FAQ; kiểm dữ liệu cá nhân.
5. Duyệt, đăng đúng review rồi lưu receipt và đo phản hồi.

### Dữ liệu / quyền sở hữu

ExternalReview, ReputationIssue, ResponseDraft, PublishingApproval, PublishAttempt; stable provider review ID và content hash ngăn đăng nhầm/trùng.

### Lệnh và sự kiện tham chiếu

ingestReview → review.received; prepareResponse → response.draft; approvePublish → response.authorized; reconcilePublish → response.published hoặc unknown.

### Test phải có

Review chứa prompt injection. • OAuth bị thu hồi giữa chừng. • Retry tạo phản hồi trùng. • Bản dịch đảo ý xin lỗi/đổ lỗi.

### Ranh giới và điều kiện mở cổng

Không tạo review giả, không mua rating giả, không tự cáo buộc người review. Không scraping ngoài quyền nguồn hoặc tự nhận SEO ranking chắc chắn. Quyền API và điều khoản của từng platform cần inventory; chưa được coi Google/TripAdvisor adapter đã live.

### KPI và economics

Thời gian phản hồi; tỷ lệ draft được duyệt; complaint resolved; chi phí/published response. Nguồn thu đề xuất D06: Business SaaS + usage.


## BU-06 · Logistics xuyên biên giới
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-06; D06 · Wave B, P1, R2; sockets S06, S11, S12, S13, S14

Cross-border Logistics Hub

**Kế hoạch D06:** Wave B; P1; risk R2; sockets S06, S11, S12, S13, S14.

### Mô tả gốc · D05

Theo dõi vận tải tiểu ngạch, check mã HS và kiểm dịch thực vật.

### Mục đích và bản đầu đề xuất

Theo dõi lô hàng, chứng từ và mốc xử lý giữa nhà cung cấp, người vận chuyển và cửa hàng. Tracking và checklist chứng từ; mô tả “tiểu ngạch” trong nguồn không phải quyền né hải quan.

### Luồng kỹ thuật đề xuất

1. Tạo shipment với tuyến, hàng hóa, kiện và đơn vị chịu trách nhiệm.
2. Nhập chứng từ, trích thông tin có nguồn và confidence.
3. So sánh checklist country pack và đề xuất kiểm tra mã HS.
4. Nhận mốc carrier theo event ID, đánh dấu trễ/unknown.
5. Người có thẩm quyền duyệt booking/vận chuyển; đối soát nhận hàng và phí.

### Dữ liệu / quyền sở hữu

Shipment, Consignment, CustomsDocument, HSAssessmentDraft, CarrierEvent, DeliveryException; event time khác ingestion time, giữ chứng từ gốc và bản dịch.

### Lệnh và sự kiện tham chiếu

prepareShipment → shipment.prepared; requestCarrier → carrier.requested; ingestTracking → shipment.milestone; confirmReceipt → delivery.reconciled. Mã HS là đề xuất tới khi chuyên môn xác nhận.

### Test phải có

Carrier gửi event ngược thứ tự. • Nhiều kiện giao một phần. • Giấy kiểm dịch hết hạn. • Phí phát sinh khác quote.

### Ranh giới và điều kiện mở cổng

Không hứa thông quan, không giả chứng nhận hay lập chứng từ sai; submission và thanh toán chỉ qua đối tác/quyền đã duyệt. Carrier coverage, customs workflow và quyền dùng dữ liệu logistics phải được chốt theo tuyến.

### KPI và economics

OTIF; số lô thiếu chứng từ; giờ delay; discrepancy cước; cost/shipment. Nguồn thu đề xuất D06: SaaS + partner/transaction.


## BU-07 · Chuỗi chi nhánh và thuê thương mại
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-07; D06 · Wave B, P1, R2; sockets S08, S11, S12, S13, S14

Franchise Hub & Commercial Lease

**Kế hoạch D06:** Wave B; P1; risk R2; sockets S08, S11, S12, S13, S14.

### Mô tả gốc · D05

Quản lý chuỗi chi nhánh, AI quét hợp đồng thuê mặt bằng cảnh báo rủi ro.

### Mục đích và bản đầu đề xuất

Cho chủ chuỗi nhìn hoạt động từng điểm và hiểu rủi ro hợp đồng thuê mà không lộ dữ liệu chéo. Workspace multi-location với document review draft, không tự ký hợp đồng hay đưa kết luận pháp lý cuối.

### Luồng kỹ thuật đề xuất

1. Xác minh quan hệ owner/chi nhánh.
2. Chuẩn hóa KPI mà vẫn giữ sổ chi nhánh riêng.
3. Upload lease, trích clause/deadline kèm trang gốc.
4. So sánh renewal/indexation/deposit theo checklist chuyên gia.
5. Chủ doanh nghiệp duyệt hành động hoặc chuyển luật sư.

### Dữ liệu / quyền sở hữu

Organization, Location, DelegatedRole, LeaseDocument, ClauseFinding, RenewalTask; văn bản trích xuất phải có page/offset, không chỉ summary.

### Lệnh và sự kiện tham chiếu

linkLocation → location.linked; analyzeLease → findings.prepared; scheduleRenewal → task.created; shareWithAdvisor → disclosure.authorized.

### Test phải có

Admin một chi nhánh xem chi nhánh khác. • Phụ lục mâu thuẫn hợp đồng chính. • OCR bỏ dấu phủ định. • Reminder sau lease đã terminate.

### Ranh giới và điều kiện mở cổng

Không dùng “AI phát hiện rủi ro” thành tư vấn luật hoàn chỉnh. Quyền toàn chuỗi không suy từ cùng email/điện thoại. Cần nguồn pháp lý theo jurisdiction, consent chia tài liệu và quy tắc inheritance roles đã duyệt.

### KPI và economics

Clause coverage; thời gian chuẩn bị hồ sơ; overdue renewals; tenant isolation tests. Nguồn thu đề xuất D06: Business SaaS.


## BU-08 · Lễ tân giọng nói tự động
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-08; D06 · Wave A, P0, R2; sockets S03, S04, S05, S06, S09, S18

Autonomous Voice Receptionist

**Kế hoạch D06:** Wave A; P0; risk R2; sockets S03, S04, S05, S06, S09, S18.

### Mô tả gốc · D05

Tác tử AI đàm thoại thời gian thực chốt lịch hẹn.

### Mục đích và bản đầu đề xuất

Giải quyết việc chủ tiệm không thể nghe máy liên tục và khách bản địa khó giao tiếp bằng tiếng Việt. ANSWER FOR ME ở số doanh nghiệp/SIP/forwarding đã cấu hình; không hứa tự nhấc mọi cuộc gọi cellular trên điện thoại cá nhân.

### Luồng kỹ thuật đề xuất

1. Nhận call event, xác định tenant/branch từ số đích đã đăng ký.
2. Kiểm standing merchant policy, quota và derive authority một lần cho session.
3. Giới thiệu rõ là Viona; lấy intent và đọc giá/lịch qua API authoritative.
4. Hold slot, đọc lại thời gian/giá rồi commit qua booking tool khi trong envelope.
5. Đối soát booking, gửi summary tiếng Việt; transfer người thật hoặc giữ unknown khi cần.

### Dữ liệu / quyền sở hữu

VoiceSession, ConversationTurn, BusinessAuthorityPolicy, DerivedCallAuthority, SlotHold, Booking, UsageRecord; call outcome và booking outcome là hai state khác nhau.

### Lệnh và sự kiện tham chiếu

voice.inbound.received → voice.authority.derived → slot.held → booking.confirmed → voice.summary.ready. Webhook dedupe theo provider ID, mỗi child call/transfer có budget/effect allowance riêng.

### Test phải có

Khách nói nhanh, đổi ngôn ngữ, barge-in. • Giá thay giữa call. • Webhook trùng và kết thúc trước answered. • Mất mạng sau khách đồng ý nhưng trước receipt.

### Ranh giới và điều kiện mở cổng

Không tạo discount, không đọc khách khác, không mặc định recording. Standing policy không là quyền vô hạn; kịch bản y tế/khiếu nại nguy hiểm phải handoff. Provider number/forwarding, consent, telephony termination, ngôn ngữ từng thị trường và human coverage cần proof thực; xem RB-04, RB-05 và RB-15.

### KPI và economics

Goal success; incorrect commitments; transfer success; time-to-first-response; cost/confirmed booking. Nguồn thu đề xuất D06: SaaS + metered AI/voice.


## BU-09 · Dự báo chiến lược doanh nghiệp
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-09; D06 · Wave C, P2, R2; sockets S04, S05, S13, S18

Predictive Strategy Engine

**Kế hoạch D06:** Wave C; P2; risk R2; sockets S04, S05, S13, S18.

### Mô tả gốc · D05

Trí tuệ dự báo đề xuất giá bán linh hoạt (Dynamic Pricing).

### Mục đích và bản đầu đề xuất

Nhận ra lịch trống, nhu cầu giảm hoặc cơ hội phục vụ trước khi chủ doanh nghiệp phải tự tổng hợp số liệu. Gợi ý có giải thích và backtest; dynamic pricing chỉ là phương án chuẩn bị, không đổi bảng giá âm thầm.

### Luồng kỹ thuật đề xuất

1. Đọc dữ liệu đã đối soát và loại anomaly/thiếu dữ liệu.
2. Tạo baseline forecast theo chi nhánh/category.
3. Đưa đề xuất cùng giả định, khoảng bất định và expected cost.
4. Merchant duyệt nội dung hoặc rule trong giới hạn.
5. Theo dõi outcome so với baseline/holdout, không nhận công cho mọi tăng trưởng.

### Dữ liệu / quyền sở hữu

DemandSeries, ForecastRun, Recommendation, ExperimentAssignment, MerchantDecision; model/data/version và thời điểm snapshot phải truy được.

### Lệnh và sự kiện tham chiếu

runForecast → forecast.ready; proposeAction → plan.prepared; approveCampaign → action.authorized. Price publishing thuộc service owner, không là output tự thực thi của model.

### Test phải có

Dữ liệu ít/cold start. • Promo trước đó làm lệch dự báo. • Seasonality/DST. • Mô hình ưu tiên khách không công bằng.

### Ranh giới và điều kiện mở cổng

Không tạo urgency giả hoặc tăng giá ngoài policy; không dùng inferred sensitive attributes để tối ưu lợi nhuận. Cần quy định minimum data, holdout và materiality của giá; bằng chứng dự báo không đồng nghĩa quyền execution.

### KPI và economics

Forecast error; recommendation acceptance; incremental filled slots; net uplift sau chi phí; dismiss rate. Nguồn thu đề xuất D06: Premium SaaS.


## BU-10 · Tìm nguồn và chuẩn bị đàm phán
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-10; D06 · Wave C, P2, R3; sockets S03, S04, S05, S06, S11, S13

Autonomous Supply Negotiator

**Kế hoạch D06:** Wave C; P2; risk R3; sockets S03, S04, S05, S06, S11, S13.

### Mô tả gốc · D05

Tác tử đàm phán tự động tìm nguồn hàng rẻ nhất.

### Mục đích và bản đầu đề xuất

Tiết kiệm thời gian so sánh nhà cung cấp mà vẫn kiểm soát chất lượng, MOQ và cam kết mua. RFQ, chuẩn hóa quote và draft đàm phán; mua hàng hoặc ký ràng buộc cần authority riêng.

### Luồng kỹ thuật đề xuất

1. Chủ doanh nghiệp xác định mặt hàng, chất lượng, hạn giao, tổng ngân sách.
2. Tìm supplier có provenance và quyền liên hệ.
3. Gửi RFQ chỉ khi được phép, chuẩn hóa giá giao tới nơi.
4. Chuẩn bị phản hồi trong negotiation envelope; điểm ngoài biên phải hỏi lại.
5. Merchant duyệt purchase order; đối soát receipt/fulfillment.

### Dữ liệu / quyền sở hữu

SourcingIntent, RFQ, SupplierQuote, NegotiationEnvelope, PurchaseOrderDraft; tách unit price, freight, tax, FX, MOQ, expiry.

### Lệnh và sự kiện tham chiếu

prepareRFQ → rfq.draft; authorizeContact → supplier.contacted; compareQuotes → comparison.ready; approvePO → purchase.authorized.

### Test phải có

Giá rẻ nhưng MOQ lớn. • Quote đã hết hạn. • Supplier sửa bank details. • Counter-offer chứa điều khoản không được phép.

### Ranh giới và điều kiện mở cổng

Không hứa “rẻ nhất” tuyệt đối; total landed cost và supplier risk quan trọng hơn giá niêm yết. Không gửi tiền theo email unverified. Cần supplier registry, giới hạn ngôn ngữ đàm phán, anti-fraud payment và exact purchasing authority.

### KPI và economics

Comparable quote coverage; savings đã đối soát; quality dispute; cost/RFQ. Nguồn thu đề xuất D06: SaaS + transaction savings share.


## BU-11 · Mặt tiền cửa hàng AR
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-11; D06 · Wave C, P3, R4; sockets S10, S11, S20

Spatial AR Storefront

**Kế hoạch D06:** Wave C; P3; risk R4; sockets S10, S11, S20.

### Mô tả gốc · D05

Giao diện 3D AR quét mặt tiền hiện menu và nút đặt bàn.

### Mục đích và bản đầu đề xuất

Cho người đi ngang khám phá cửa hàng, menu và khả năng đặt chỗ bằng lớp thông tin không gian. Preview AR chỉ đọc, truy catalog thật; đặt bàn chuyển về flow S11 đã kiểm chứng.

### Luồng kỹ thuật đề xuất

1. Người dùng cấp camera/location vừa đủ.
2. Xác định storefront/anchor bằng nguồn merchant duyệt.
3. Render menu có freshness và fallback 2D.
4. Chọn dịch vụ để mở quote/booking, không auto-commit từ gaze.
5. Ghi metric tổng hợp, dừng camera khi rời mode.

### Dữ liệu / quyền sở hữu

StorefrontAnchor, SpatialAsset, CatalogProjection, AnchorVerification; lưu coordinate system/version và expiration của menu.

### Lệnh và sự kiện tham chiếu

resolveAnchor → storefront.resolved; fetchCatalog → menu.projected; openBooking → booking.prepare_requested. Spatial client không giữ provider secrets.

### Test phải có

Nhận nhầm cửa hàng cạnh nhau. • GPS sai. • Menu hết hiệu lực. • Người dùng không cấp camera.

### Ranh giới và điều kiện mở cổng

Đây là RESEARCH/R4 trong [D06]; không trì hoãn Voice/proactive launch vì hiệu ứng AR. Không coi S20/S21 là vũ trụ mới. Cần device/engine ADR và relationship S20–S21; nguồn chưa chốt adapter tương thích mọi thiết bị.

### KPI và economics

Anchor accuracy; time-to-menu; fallback completion; render latency/battery. Nguồn thu đề xuất D06: Premium SaaS / campaign.


## BU-12 · Chuẩn bị hồ sơ thanh tra thuế
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-12; D06 · Wave D, P3, R3; sockets S03, S05, S12, S13, S14

AI Tax Audit Defender

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S03, S05, S12, S13, S14.

### Mô tả gốc · D05

Tác tử phân tích yêu cầu thanh tra thuế, tự động trích xuất Sổ cái và soạn thảo hồ sơ đối soát chuẩn pháp lý.

### Mục đích và bản đầu đề xuất

Giúp merchant tập hợp chứng từ và hiểu yêu cầu thanh tra, giảm bỏ sót dữ liệu khi làm với kế toán. Chỉ tạo evidence pack và draft để chuyên gia xem; không tự bảo vệ pháp lý, ký hoặc nộp cuối.

### Luồng kỹ thuật đề xuất

1. Upload thông báo và xác nhận đơn vị/country/kỳ thuế.
2. Trích deadline và danh mục tài liệu kèm source span.
3. Thu thập ledger exports được phân quyền.
4. Đối chiếu thiếu/trùng, tạo timeline và câu hỏi cho chuyên gia.
5. Chuyên gia/merchant duyệt trước bất kỳ gửi nộp nào.

### Dữ liệu / quyền sở hữu

AuditNotice, EvidenceRequest, TaxPeriod, LedgerExport, SubmissionDraft; hồ sơ gốc bất biến, redaction copy riêng.

### Lệnh và sự kiện tham chiếu

parseNotice → request.extracted; assembleEvidence → evidence.pack.prepared; professionalReview → draft.reviewed; submit qua lane riêng.

### Test phải có

OCR sai hạn trả lời. • Chứng từ sai kỳ tiền tệ. • Dữ liệu thuộc tenant khác. • Thiếu phụ lục nhưng summary nói đủ.

### Ranh giới và điều kiện mở cổng

Tên “Defender” là concept; không claim tư cách luật sư/kế toán hay chuẩn pháp lý tự động. Quyền truy tax data và retention cần review. Qualified partner, country pack, legal basis và authorization submission là gates trước production.

### KPI và economics

Evidence completeness; discrepancy resolved; review time; false deadline extraction. Nguồn thu đề xuất D06: Premium SaaS / professional service.


## BU-13 · Điều phối vòng đời dữ liệu và privacy
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-13; D06 · Wave B, P1, R3; sockets S02, S03, S13, S14

GDPR Compliance Auto-Pilot

**Kế hoạch D06:** Wave B; P1; risk R3; sockets S02, S03, S13, S14.

### Mô tả gốc · D05

Tự động mã hóa và hủy dữ liệu khách hàng theo đúng chuẩn luật bảo vệ dữ liệu EU để tránh án phạt.

### Mục đích và bản đầu đề xuất

Giúp doanh nghiệp thực hiện chính sách retention/export/erase nhất quán thay vì xóa tùy hứng. Inventory và draft retention job; mã hóa/xóa có hệ quả cần policy, hold check, review và receipt.

### Luồng kỹ thuật đề xuất

1. Gắn mục đích, data class và retention với từng dataset.
2. Nhận yêu cầu export/erase, xác minh đúng subject và tenant.
3. Kiểm legal hold/obligation đã được chuyên gia xác định.
4. Chuẩn bị kế hoạch xóa nguồn, cache, index và provider copies.
5. Thực thi trong authority, đối soát từng destination và báo phần chưa hoàn tất.

### Dữ liệu / quyền sở hữu

DataInventory, RetentionPolicy, PrivacyRequest, DeletionPlan, LegalHold, ErasureReceipt; log tối thiểu không giữ lại nội dung vừa xóa.

### Lệnh và sự kiện tham chiếu

privacy.requested → identity.verified → deletion.prepared → deletion.authorized → deletion.reconciled. Retry technical từng destination phải có policy, không giả erase toàn bộ.

### Test phải có

Backup chưa tới vòng expiry. • Đối tượng có ledger phải lưu. • Revoke giữa job. • Search index còn bản sao.

### Ranh giới và điều kiện mở cổng

Tự động hóa không đồng nghĩa được chứng nhận GDPR. Không dùng AI để quyết định xóa hàng loạt hoặc suy legal hold; không hứa “xóa tức thời mọi nơi”. Controller/processor roles, lawful retention và provider deletion contracts cần review độc lập.

### KPI và economics

Overdue privacy requests; residual copies; reconciliation completeness; unauthorized deletion count. Nguồn thu đề xuất D06: Business SaaS / compliance.


## BU-14 · Tối ưu năng lượng theo giá thị trường
**Tập 3 • 10 · BUSINESS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · BU-14; D06 · Wave C, P2, R3; sockets S03, S04, S06, S13, S16

Spot-Market Energy Optimizer

**Kế hoạch D06:** Wave C; P2; risk R3; sockets S03, S04, S06, S13, S16.

### Mô tả gốc · D05

AI đọc giá điện/gas thời gian thực, tự động kích hoạt máy móc công suất lớn vào các khung giờ "giá điện âm".

### Mục đích và bản đầu đề xuất

Chuẩn bị lịch vận hành thiết bị có thể dịch chuyển để giảm tổng chi phí, không đánh đổi an toàn. Forecast/khuyến nghị trước; điều khiển thiết bị chỉ sau verified tariff, device capability và merchant envelope.

### Luồng kỹ thuật đề xuất

1. Nhập tariff thực áp dụng, công suất, giờ bắt buộc và safety constraints.
2. Đọc giá có timestamp cùng phí lưới/thuế.
3. Tối ưu lịch nhưng giữ mức sẵn sàng phục vụ.
4. Merchant duyệt hoặc preauthorize biên nhỏ.
5. Gửi command qua device gateway, đọc trạng thái và đối soát tiết kiệm thực.

### Dữ liệu / quyền sở hữu

EnergyTariff, PriceInterval, DeviceConstraint, OperationSchedule, DeviceCommand, MeterReading; giá thị trường âm không mặc nhiên làm hóa đơn âm.

### Lệnh và sự kiện tham chiếu

optimizeSchedule → schedule.prepared; dispatchDevice → command.attempted; device.ack → operation.verified; meter.reconciled.

### Test phải có

Tariff stale. • Mất kết nối sau lệnh bật. • Thiết bị không phản hồi. • Safety minimum xung đột giá rẻ.

### Ranh giới và điều kiện mở cổng

Không điều khiển hệ thống critical ngoài certification/authority; manual override và trạng thái an toàn ưu tiên tiết kiệm. Cần energy/device partner, contractual tariff truth và đo chi phí toàn phần theo thị trường.

### KPI và economics

Net savings; comfort/service violations; stale tariff rate; unknown device commands. Nguồn thu đề xuất D06: SaaS + savings share.


## Travel · 10 module
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** CATALOG NGUỒN / KẾ HOẠCH
**Nguồn:** D05 original catalog; D06 planning proposals; D03 successor

Đồng hành qua hành trình và biên giới

### Ranh giới universe

Travel giữ itinerary/context; quyền đặt/đổi vé đi qua provider và authority. TR-03 giảm rào cản ngôn ngữ; TR-07 dùng data/provider truth trước predictive rebooking.

### Danh mục chính xác

| Mã | Tên gốc | Wave / P / Risk |
| --- | --- | --- |
| TR-01 | Visa & Immigration Copilot | B / P1 / R3 |
| TR-02 | Tax-Free & VAT Refund Auto-Pilot | D / P3 / R3 |
| TR-03 | Live Voice Interpreter | A / P0 / R2 |
| TR-04 | Intermodal Commute Hub | B / P1 / R2 |
| TR-05 | Cross-border Pet Travel | B / P1 / R2 |
| TR-06 | B2B Tour Operator & GDS Hook · anchor của Viona Travel Booking & Distribution / BME-02 | B / P1 / R2 |
| TR-07 | Dynamic Swarm Routing | C / P2 / R3 |
| TR-08 | Immersive AR Concierge | C / P3 / R4 |
| TR-09 | Swarm Baggage Tracker | C / P3 / R4 |
| TR-10 | Carbon Footprint Wallet | D / P3 / R3 |

### Cách đọc các hồ sơ tiếp theo

Mô tả gốc giữ nguyên D05. Wave/priority/risk/socket/revenue theo đề xuất D06, không là trạng thái đã live hay cấp phép. Trình tự, data entities, commands, tests, KPIs và release đề xuất do sách bổ sung để triển khai có kiểm soát.


## TR-01 · Đồng hành visa và di trú
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · TR-01; D06 · Wave B, P1, R3; sockets S03, S06, S12, S13, S14

Visa & Immigration Copilot

**Kế hoạch D06:** Wave B; P1; risk R3; sockets S03, S06, S12, S13, S14.

### Mô tả gốc · D05

Tự động điền tờ khai Schengen, gia hạn cư trú, đặt lịch hẹn ngoại kiều.

### Mục đích và bản đầu đề xuất

Giảm rào cản ngôn ngữ, thiếu giấy tờ và quên hạn cho người Việt di chuyển xuyên biên giới. Checklist và điền nháp theo jurisdiction/version; submission qua đối tác hoặc người dùng xác nhận.

### Luồng kỹ thuật đề xuất

1. Phân biệt quốc tịch, nơi cư trú, nơi nộp và mục đích di chuyển.
2. Chọn rule pack có nguồn/ngày hiệu lực.
3. Trích dữ liệu tài liệu với confidence; người dùng sửa trước khi điền.
4. Chuẩn bị bộ hồ sơ và lịch hẹn được phép.
5. Theo dõi receipt/status thật, báo phần thiếu và chuyển chuyên gia.

### Dữ liệu / quyền sở hữu

ImmigrationCase, CountryRuleVersion, RequiredDocument, FormDraft, AppointmentRequest; mỗi field giữ source reference và user verification.

### Lệnh và sự kiện tham chiếu

assessChecklist → checklist.ready; prepareForm → form.draft; confirmSubmission → submission.authorized; receipt.received → case.updated.

### Test phải có

Passport đổi số. • Loại visa sai country. • Form version thay. • Deadline đọc mơ hồ theo DD/MM.

### Ranh giới và điều kiện mở cổng

Không đảm bảo visa/cư trú được cấp. Không bypass CAPTCHA hoặc đăng nhập cổng công thay user ngoài quyền. Không tự nộp thông tin không chắc chắn. Official source freshness, quyền cổng nộp và qualified partner còn cần xác nhận theo từng thủ tục.

### KPI và economics

Checklist completion; field correction; missed deadline; verified appointment rate. Nguồn thu đề xuất D06: Subscription + service/referral.


## TR-02 · Hồ sơ hoàn VAT cho du khách
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · TR-02; D06 · Wave D, P3, R3; sockets S03, S07, S12, S13, S14

Tax-Free & VAT Refund Auto-Pilot

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S03, S07, S12, S13, S14.

### Mô tả gốc · D05

Scan hóa đơn, tự tạo hồ sơ hoàn thuế sân bay.

### Mục đích và bản đầu đề xuất

Tập hợp hóa đơn và điều kiện hoàn thuế để người dùng không bỏ lỡ bước trước khi rời nước. Scan, phân loại và draft hồ sơ; xác nhận eligibility và payout thuộc provider/chuyên gia được phép.

### Luồng kỹ thuật đề xuất

1. Nhập itinerary và hóa đơn được consent.
2. Trích merchant, ngày, thuế, currency và đối chiếu trùng.
3. Kiểm checklist điều kiện theo country pack.
4. Chuẩn bị chứng từ và hướng dẫn điểm xác nhận.
5. Nhận status provider và đối soát tiền thực vào tài khoản.

### Dữ liệu / quyền sở hữu

PurchaseReceipt, RefundEligibilityDraft, TravelExitEvent, RefundClaim, PayoutStatus; không coi OCR total là giá trị pháp lý.

### Lệnh và sự kiện tham chiếu

parseReceipt → receipt.structured; prepareClaim → claim.draft; provider.ack → claim.pending; payout.reconciled.

### Test phải có

Hóa đơn không hợp lệ. • Cùng hóa đơn nộp hai lần. • Currency mix. • Người dùng chưa xác nhận xuất cảnh.

### Ranh giới và điều kiện mở cổng

Không tự khẳng định mọi hóa đơn được hoàn; không giả dấu hải quan hay kết quả thanh toán. Provider coverage, rules và fee schedule phải chốt trước activation; Wave D hard-gated.

### KPI và economics

Claim completeness; duplicate prevention; days pending; fee transparency. Nguồn thu đề xuất D06: Commission / service fee.


## TR-03 · Phiên dịch giọng nói trực tiếp
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · TR-03; D06 · Wave A, P0, R2; sockets S04, S05, S06, S09

Live Voice Interpreter

**Kế hoạch D06:** Wave A; P0; risk R2; sockets S04, S05, S06, S09.

### Mô tả gốc · D05

Phiên dịch giọng nói hai chiều trực tiếp (Việt - Bản địa).

### Mục đích và bản đầu đề xuất

Người dùng vẫn tham gia cuộc gọi/cuộc gặp nhưng không phải tự xoay xở khi người bản địa nói nhanh. TALK WITH ME với cặp ngôn ngữ đã benchmark; không tuyên bố chất lượng thông dịch chuyên môn được chứng nhận.

### Luồng kỹ thuật đề xuất

1. Chọn cặp ngôn ngữ, mode riêng tư và policy ghi âm.
2. Nhận audio theo turn, phát hiện tiếng nói và confidence.
3. Dịch giữ tên, số tiền, thời gian; hỏi lại critical terms.
4. Phát tiếng đích, hỗ trợ barge-in và nút nhờ người thật.
5. Kết thúc, đưa summary đã xác minh và xóa audio theo retention.

### Dữ liệu / quyền sở hữu

InterpretationSession, SpeakerTurn, CriticalTermConfirmation, LanguagePairPolicy, AudioRetention; transcript tạm không mặc định thành permanent memory.

### Lệnh và sự kiện tham chiếu

audio.turn → transcript.partial/final → translation.ready → speech.played; user.corrected cập nhật turn, không tự sửa domain commitment.

### Test phải có

Giọng vùng miền và code-switch. • Nói chồng. • Mạng trễ làm lặp câu. • Số 15/50, âm phủ định và tên riêng.

### Ranh giới và điều kiện mở cổng

Phiên dịch không tự cấp quyền đặt, trả tiền hay đồng ý điều trị. Khi confidence thấp ở nội dung nhạy cảm phải dừng hỏi lại. Voice pipeline, device audio permissions và từng language pair cần pilot riêng; xem phần Voice Delegation ở Tập II và RB-11.

### KPI và economics

Critical-term accuracy; latency P50/P95; interruption recovery; user-rated usefulness; cost/phút. Nguồn thu đề xuất D06: Subscription + metered usage.


## TR-04 · Di chuyển liên phương tiện
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · TR-04; D06 · Wave B, P1, R2; sockets S03, S06, S07, S10, S11

Intermodal Commute Hub

**Kế hoạch D06:** Wave B; P1; risk R2; sockets S03, S06, S07, S10, S11.

### Mô tả gốc · D05

Tích hợp mua vé tàu hỏa liên vận quốc tế, xe buýt đường dài.

### Mục đích và bản đầu đề xuất

Kết nối chuyến tàu, xe buýt và hành trình đầu/cuối để người dùng thấy toàn chuyến đi thay vì nhiều vé rời. Tìm và chuẩn bị phương án; bán vé chỉ cho tuyến/provider có quyền và refund semantics rõ.

### Luồng kỹ thuật đề xuất

1. Nhập origin/destination, thời gian và accessibility needs.
2. Đọc lịch/giá/fare rules có freshness.
3. Tính transfer buffer và cảnh báo kết nối không được bảo đảm.
4. User duyệt từng offer hoặc bundle có tổng trần.
5. Issue ticket, đối soát và lưu từng chặng với trạng thái riêng.

### Dữ liệu / quyền sở hữu

Journey, Leg, FareQuote, ConnectionRisk, TicketAttempt, TicketArtifact; giữ timezone local/UTC và cancellation terms từng leg.

### Lệnh và sự kiện tham chiếu

searchJourney → options.ready; approveItinerary → booking.authorized; issueLeg → leg.ticketed; incomplete bundle → reconcile/handoff.

### Test phải có

DST qua biên giới. • Chặng một issued, chặng hai fail. • Vé chỉ QR offline. • Đổi ga cần buffer lớn.

### Ranh giới và điều kiện mở cổng

Không hứa bảo đảm nối chuyến nếu hợp đồng không có; no hidden fee, không retry purchase sau timeout mù. Cần provider ticket inventory, hỗ trợ sau bán và terms từng tuyến.

### KPI và economics

Itinerary completion; partial issuance; missed connection assistance; total price accuracy. Nguồn thu đề xuất D06: Commission / booking.


## TR-05 · Thú cưng đi xuyên biên giới
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · TR-05; D06 · Wave B, P1, R2; sockets S06, S12, S13, S14

Cross-border Pet Travel

**Kế hoạch D06:** Wave B; P1; risk R2; sockets S06, S12, S13, S14.

### Mô tả gốc · D05

Hỗ trợ thủ tục kiểm dịch hàng không cho thú cưng.

### Mục đích và bản đầu đề xuất

Giúp gia đình chuẩn bị chuyến đi cho thú cưng với đúng giấy tờ và quy định hãng vận chuyển. Checklist hành trình + draft yêu cầu hãng/clinic; xác nhận chuyên môn và vận chuyển thuộc đối tác.

### Luồng kỹ thuật đề xuất

1. Nhập loài, kích thước, hành trình và ngày đi.
2. Lấy country/carrier policy có version.
3. Đối chiếu microchip, vaccine/document dates do người dùng cung cấp.
4. Chuẩn bị checklist và yêu cầu chỗ được phép.
5. Xác nhận carrier acceptance thật và nhắc việc còn thiếu.

### Dữ liệu / quyền sở hữu

PetProfile, RouteRequirement, VeterinaryDocument, CarrierPetRequest; hạn giấy tờ phải có nguồn và không suy y tế từ ảnh.

### Lệnh và sự kiện tham chiếu

pet.trip.prepared → requirements.checked → carrier.requested → acceptance.reconciled.

### Test phải có

Quá cân lồng. • Transit country thêm điều kiện. • Thiếu trang vaccine. • Carrier chưa xác nhận pet slot.

### Ranh giới và điều kiện mở cổng

Không khẳng định đủ điều kiện nhập cảnh hay sức khỏe thú cưng chỉ từ model; bác sĩ thú y/cơ quan có thẩm quyền xác nhận. Rule cập nhật, carrier restrictions và đối tác thú y theo nơi đi/đến phải được duyệt.

### KPI và economics

Document completeness; rejected pet requests; reminder timeliness; support escalation. Nguồn thu đề xuất D06: Service/referral.


## TR-06 · Điều hành tour, GDS & Viona Travel Booking/Distribution
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN D05/D06 + SUCCESSOR D12 + THAM CHIẾU
**Nguồn:** D05 · TR-06; D06 · Wave B, P1, R2; D12 §2A/BME-02; sockets S03, S06, S07, S10, S11, S13, S17

B2B Tour Operator & GDS Hook là tên catalog gốc. D12 giữ ID `TR-06` và mở rộng **nội bộ** thành module neo của `BME-02 Viona Travel Marketplace`; module count vẫn 63.

### Tám capability nội bộ

| ID | Capability | Outcome |
| --- | --- | --- |
| TR-06A | Stay Search & Discovery | Tìm hotel/apartment theo destination, dates, guests, map/filter/trust. |
| TR-06B | Hotel / Apartment Booking | Reservation provider-confirmed trong app khi lane được mở. |
| TR-06C | Rate & Availability Engine | Live quote, rooms/rates, fees/taxes, cancellation, expiry. |
| TR-06D | Hotel Partner Extranet | Direct property supply: room/rate/policy/calendar/booking inbox. |
| TR-06E | Booking Management / Cancel / Refund | Servicing, cancellation, refund/dispute/reconciliation. |
| TR-06F | GDS & Accommodation Provider Gateway | Adapter isolation cho GDS/bedbank/OTA/provider. |
| TR-06G | Flights / Rail / Ground Distribution | Inventory distribution; phối hợp TR-04. |
| TR-06H | Tours & Activities | Attraction/local-experience discovery/booking. |

### Mô tả gốc · D05

Hệ thống điều hành tour, bán vé máy bay B2B.

### Mục đích và bản đầu đề xuất

Bản đầu an toàn nhất là provider/affiliate discovery + B2B quote/PNR management. Sau khi S06/S07/S11/S13 và provider contracts đủ, mở live accommodation quotes rồi in-app booking theo exact market/provider. Direct hotel extranet chỉ khi VIONA có verified supply và operational owner.

### Luồng hotel booking

1. Nhận destination/dates/guests/preferences; xác định market/provider scope.
2. Search qua S06/S17; tách static property content khỏi live availability.
3. Refresh exact room/rate quote; bind currency, tax/fees, cancellation, expiry.
4. User chọn; collect guest details theo minimization; prepare payment/guarantee.
5. Re-confirm material terms; xin S03 authority.
6. Reserve/capture theo provider contract; dispatch reservation exactly once.
7. Reconcile provider response. Timeout sau dispatch → `UNKNOWN_PENDING_RECONCILIATION`, không silent retry.
8. Chỉ sau provider confirmation mới tạo confirmed booking/voucher; write Account/Travel itinerary.
9. Modify/cancel/refund qua versioned rules; reconcile money + provider + domain state.
10. Sau outcome, cập nhật trust/review và BME commission ledger theo exact commission basis.

### Dữ liệu / quyền sở hữu

`Property`, `RoomType`, `RatePlan`, `AvailabilityQuote`, `CancellationPolicy`, `GuestParty`, `BookingAttempt`, `ProviderReservationRef`, `Voucher`, `RefundCase`, `AgencySettlement`, `CommissionRecord`. Static property content và live inventory có freshness/source khác nhau.

### Lệnh và sự kiện tham chiếu

`stay.search.requested → quote.refreshed → booking.prepared → authority.granted → provider.reservation.dispatched → provider.confirmed|unknown → booking.reconciled → commission.accrued|clawed_back`.

### Test phải có

Room sold out giữa search/confirm. • Tax/city fee thay. • Provider timeout sau dispatch. • Payment authorized nhưng hotel declined. • Duplicate callback. • Partial refund. • No-show. • Cancel deadline DST. • Provider outage. • Commission clawback sau refund.

### Ranh giới và điều kiện mở cổng

Không tự đóng vai accredited agency/merchant-of-record nếu chưa có. Không gọi property “available” từ stale cache. Sponsored hotel phải label. Provider/merchant-of-record, total price và cancellation phải rõ. In-app booking, payout/refund và direct inventory đều là lane riêng; provider contract, legal/tax/support readiness và kill switch bắt buộc.

### KPI và economics

Search→quote, quote freshness, quote→confirm, provider confirmation latency, unknown rate, cancellation/refund, support burden, booking GMV, gross/net commission, payment/provider costs, contribution margin và repeat. Nguồn thu: Business SaaS + provider/booking commission; không đếm GMV như VIONA revenue.


## TR-07 · Điều phối lại hành trình khi gián đoạn
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · TR-07; D06 · Wave C, P2, R3; sockets S03, S04, S05, S06, S09, S10, S11

Dynamic Swarm Routing

**Kế hoạch D06:** Wave C; P2; risk R3; sockets S03, S04, S05, S06, S09, S10, S11.

### Mô tả gốc · D05

AI định tuyến tự đổi vé liên tuyến/báo trễ khách sạn khi phương tiện delay.

### Mục đích và bản đầu đề xuất

Viona chủ động nhận ra chuyến trễ và chuẩn bị phương án trước khi người dùng phải tìm từng bước. Wave C signature candidate: nhận tín hiệu, giải thích rủi ro và prepare alternatives; rebooking không tự động ngoài envelope.

### Luồng kỹ thuật đề xuất

1. Quan sát journey đã consent với deadline/end condition.
2. Xác minh delay từ nguồn provider, không tin một push đơn lẻ.
3. Tính tác động trên chặng kế/hotel/meeting.
4. Chuẩn bị lựa chọn kèm chi phí và điều khoản; xin authority.
5. Thực hiện bounded change, reconcile từng leg và thông báo thật.

### Dữ liệu / quyền sở hữu

JourneyWatch, DisruptionSignal, RecoveryPlan, ReplacementOffer, RebookingAttempt; plan hash bind tất cả material terms.

### Lệnh và sự kiện tham chiếu

disruption.confirmed → recovery.prepared → authority.requested → leg.change.attempted → journey.reconciled.

### Test phải có

Delay signal bị rút lại. • Hai agent đề xuất khác nhau. • Rebooking timeout. • Hotel thông báo không nhận được.

### Ranh giới và điều kiện mở cổng

Không suy “đã đổi vé” từ call completed. Không mua chặng thay thế khi chặng cũ còn unknown nếu nguy cơ duplicate chưa được xử lý. Provider maturity, fare-change authority và cost reserve nhiều chặng phải đóng trước execution.

### KPI và economics

Time-to-useful-plan; missed-connection mitigation; accepted plans; overspend; wrong intervention rate. Nguồn thu đề xuất D06: Premium subscription + commission.


## TR-08 · Hướng dẫn viên AR tại điểm đến
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · TR-08; D06 · Wave C, P3, R4; sockets S05, S10, S20

Immersive AR Concierge

**Kế hoạch D06:** Wave C; P3; risk R4; sockets S05, S10, S20.

### Mô tả gốc · D05

Hướng dẫn viên du lịch AR phủ thông tin lịch sử lên không gian thật.

### Mục đích và bản đầu đề xuất

Đặt thông tin lịch sử/ngôn ngữ vào đúng bối cảnh không gian mà không làm người dùng mất tập trung. Overlay thông tin đọc-only với audio/caption và fallback bản đồ; không cần AR để dùng core Travel.

### Luồng kỹ thuật đề xuất

1. Xin camera/location cho session.
2. Resolve landmark với confidence.
3. Chọn nội dung có nguồn và ngôn ngữ phù hợp.
4. Render overlay tránh che đường đi, cho tắt tức thời.
5. Lưu địa điểm yêu thích chỉ khi user cho phép.

### Dữ liệu / quyền sở hữu

Landmark, ContentCitation, SpatialAnchor, ExperienceSession; asset có quyền sử dụng, không gán lịch sử tưởng tượng.

### Lệnh và sự kiện tham chiếu

landmark.detected → context.resolved → overlay.ready; no booking/write authority từ việc nhìn vật thể.

### Test phải có

Nhận nhầm địa danh. • Ánh sáng xấu. • Khách đang di chuyển. • Nội dung không có nguồn.

### Ranh giới và điều kiện mở cổng

Không gọi hình ảnh dựng là bằng chứng địa điểm hiện tại. RESEARCH/P3, không phải Grand Launch gate bắt buộc. Content licensing, anchor system và device compatibility cần ADR trước release.

### KPI và economics

Landmark precision; factual correction; battery/thermal; fallback usage. Nguồn thu đề xuất D06: Premium experience / partner.


## TR-09 · Theo dõi hành lý qua mạng thiết bị
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · TR-09; D06 · Wave C, P3, R4; sockets S01, S02, S10, S15, S16

Swarm Baggage Tracker

**Kế hoạch D06:** Wave C; P3; risk R4; sockets S01, S02, S10, S15, S16.

### Mô tả gốc · D05

Mạng lưới Bluetooth diện rộng tự động tìm vali thất lạc qua các thiết bị Viona lân cận.

### Mục đích và bản đầu đề xuất

Tăng khả năng tìm đồ thất lạc mà không xây một hệ thống theo dõi người bí mật. Prototype opt-in với anti-stalking trước; không hứa độ phủ như mạng hàng triệu thiết bị.

### Luồng kỹ thuật đề xuất

1. Đăng ký tag gắn với account và quyền sở hữu.
2. Phát identifier xoay vòng theo policy.
3. Thiết bị gần đó chuyển sighting tối thiểu, mã hóa và hết hạn.
4. Owner xem last seen có confidence/thời gian.
5. Báo tag lạ hoặc revoke pairing, không cho tra vị trí người khác.

### Dữ liệu / quyền sở hữu

TagOwnership, RotatingIdentifier, Sighting, RecoverySession, AbuseReport; không public owner/location graph.

### Lệnh và sự kiện tham chiếu

tag.paired → sighting.received → location.estimated → recovery.closed; publish sighting không phải xác nhận vali đang ở đó.

### Test phải có

Tag đi cùng người không consent. • Replay sighting. • Thiết bị offline. • Mật độ mạng thấp.

### Ranh giới và điều kiện mở cổng

Anti-stalking là prerequisite, không phụ kiện. Source là moonshot; địa điểm ước tính và độ phủ phải hiển thị đúng. Hardware protocol, privacy cryptography và platform background limitations cần nghiên cứu.

### KPI và economics

Coverage thật; stale sightings; recovery rate; false tracking alerts; privacy complaints. Nguồn thu đề xuất D06: Premium subscription.


## TR-10 · Dấu chân carbon và đối tác bù đắp
**Tập 3 • 11 · TRAVEL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · TR-10; D06 · Wave D, P3, R3; sockets S03, S04, S06, S07, S13

Carbon Footprint Wallet

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S03, S04, S06, S07, S13.

### Mô tả gốc · D05

Đo lường khí thải di chuyển và tự động mua tín chỉ xanh (Carbon Credits) bằng tiền lẻ tích lũy.

### Mục đích và bản đầu đề xuất

Cho người dùng hiểu ước tính tác động hành trình và tự quyết định có mua sản phẩm bù đắp hay không. Đo/ước tính kèm phương pháp trước; mua credits qua provider đã review, không tự trích tiền lẻ mặc định.

### Luồng kỹ thuật đề xuất

1. Lấy dữ liệu journey đủ tối thiểu.
2. Áp emission factors có version và assumptions.
3. Hiển thị khoảng ước tính, không tính thành số đo trực tiếp.
4. Chuẩn bị quote partner và giải thích phí/quyền chứng chỉ.
5. User duyệt purchase; đối soát receipt/retirement nếu có.

### Dữ liệu / quyền sở hữu

EmissionEstimate, MethodVersion, CarbonOffer, PurchaseIntent, RetirementReceipt; tách estimate, credit purchase và verified retirement.

### Lệnh và sự kiện tham chiếu

journey.estimated → carbon.quote.prepared → purchase.authorized → retirement.reconciled.

### Test phải có

Thiếu route distance. • Factor thay phiên bản. • Credit đã bán nhưng chưa retire. • Hủy chuyến sau purchase.

### Ranh giới và điều kiện mở cổng

Không claim “carbon neutral” chỉ vì thanh toán; không coi estimate là certification. Đây là financial/provider effect. Cần partner tiêu chuẩn, giá, claim policy và điều kiện hoàn trước commercial activation.

### KPI và economics

Estimate provenance; receipt completeness; reconciliation time; user comprehension. Nguồn thu đề xuất D06: Partner/commission.


## Academy · 9 module
**Tập 3 • 12 · ACADEMY**
**Phạm vi:** CATALOG NGUỒN / KẾ HOẠCH
**Nguồn:** D05 original catalog; D06 planning proposals; D03 successor

Ngôn ngữ, kỹ năng và cơ hội

### Ranh giới universe

Learning outcome là tiến bộ có chứng cứ, không auto certification. Tách learner/guardian/teacher roles; trẻ em, biometric và tuyển dụng là context cần safeguards riêng.

### Danh mục chính xác

| Mã | Tên gốc | Wave / P / Risk |
| --- | --- | --- |
| AC-01 | Vocational Exam Simulator | A / P0 / R1 |
| AC-02 | Vietnamese Heritage Language Tutor | A / P0 / R1 |
| AC-03 | Expert Knowledge Marketplace | A / P1 / R2 |
| AC-04 | Credential Translator | B / P1 / R2 |
| AC-05 | Bio-sync Cognitive Learner | C / P3 / R3 |
| AC-06 | Lesson Plan Architect | A / P1 / R2 |
| AC-07 | VR Vocation Simulator | C / P3 / R4 |
| AC-08 | Digital Genealogy & Ancestry AI | D / P3 / R3 |
| AC-09 | Skill-to-Job Matching Engine | B / P1 / R3 |

### Cách đọc các hồ sơ tiếp theo

Mô tả gốc giữ nguyên D05. Wave/priority/risk/socket/revenue theo đề xuất D06, không là trạng thái đã live hay cấp phép. Trình tự, data entities, commands, tests, KPIs và release đề xuất do sách bổ sung để triển khai có kiểm soát.


## AC-01 · Luyện thi nghề và hội nhập
**Tập 3 • 12 · ACADEMY**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AC-01; D06 · Wave A, P0, R1; sockets S04, S05, S19

Vocational Exam Simulator

**Kế hoạch D06:** Wave A; P0; risk R1; sockets S04, S05, S19.

### Mô tả gốc · D05

Luyện thi lý thuyết lái xe, an toàn thực phẩm, thi nhập tịch.

### Mục đích và bản đầu đề xuất

Giúp người Việt luyện bài thi thực dụng với giải thích tiếng Việt và ngôn ngữ bản địa. Bộ câu hỏi có quyền sử dụng/version, mock exam và learning feedback; không phát chứng chỉ chính thức.

### Luồng kỹ thuật đề xuất

1. Chọn mục tiêu, thị trường, ngôn ngữ và trình độ.
2. Làm diagnostic không gây áp lực.
3. Hệ thống phân bài theo lỗi và mục tiêu.
4. Mock test dùng rubric/version cố định.
5. Hiển thị tiến bộ và phần chưa chắc, gợi ý ôn tiếp.

### Dữ liệu / quyền sở hữu

ExamBlueprint, QuestionVersion, Attempt, SkillTag, Feedback, StudyPlan; điểm số gắn đúng phiên bản và không chuyển thành official pass.

### Lệnh và sự kiện tham chiếu

attempt.submitted → score.computed → feedback.prepared → progress.updated. Scoring deterministic khi câu trả lời đóng.

### Test phải có

Câu có nhiều đáp án. • Bank câu hỏi đổi. • Offline submit trùng. • Model giải thích mâu thuẫn đáp án.

### Ranh giới và điều kiện mở cổng

Không bảo đảm đỗ thi; không dùng câu rò rỉ hoặc tài liệu chưa có bản quyền. Nội dung luật thi phải có freshness. Cần curriculum local, content rights và review bởi người hiểu bài thi.

### KPI và economics

Learning gain; repeated-error reduction; completion; correction rate; cost/session. Nguồn thu đề xuất D06: Subscription.


## AC-02 · Tiếng Việt cho thế hệ kế tiếp
**Tập 3 • 12 · ACADEMY**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AC-02; D06 · Wave A, P0, R1; sockets S04, S05, S09, S19

Vietnamese Heritage Language Tutor

**Kế hoạch D06:** Wave A; P0; risk R1; sockets S04, S05, S09, S19.

### Mô tả gốc · D05

Dạy tiếng Việt tương tác cho thế hệ F2, F3.

### Mục đích và bản đầu đề xuất

Giữ kết nối ngôn ngữ và văn hóa cho trẻ/gia đình Việt ở nước ngoài bằng việc học vừa sức. Bài học tương tác, hội thoại và family practice có consent; không ghi nhớ dữ liệu trẻ mặc định.

### Luồng kỹ thuật đề xuất

1. Phụ huynh chọn mục tiêu và privacy phù hợp độ tuổi.
2. Đánh giá nhẹ khả năng nghe/nói/đọc.
3. Đưa bài ngắn gắn tình huống gia đình.
4. Phản hồi phát âm tích cực, không xấu hổ hóa.
5. Gia đình xem tiến bộ, tắt voice storage hoặc xóa dữ liệu dễ dàng.

### Dữ liệu / quyền sở hữu

LearnerProfile, GuardianConsent, Lesson, PronunciationAttempt, CulturalTopic, ProgressRecord; role parent khác teacher.

### Lệnh và sự kiện tham chiếu

lesson.started → practice.completed → feedback.ready → progress.recorded; explicit consent trước chia sẻ bài/voice.

### Test phải có

Trẻ kể thông tin nhạy cảm. • Accent bị đánh giá sai. • Parent truy học viên không thuộc nhà. • Tắt microphone giữa bài.

### Ranh giới và điều kiện mở cổng

Không khai thác gắn bó cảm xúc hoặc streak pressure; AI không thay parent/teacher và không gán identity từ giọng nói. Cần age-appropriate content, guardian workflow và benchmark tiếng Việt vùng miền.

### KPI và economics

Weekly learning continuity; skill gain; parent satisfaction; privacy requests fulfilled. Nguồn thu đề xuất D06: Subscription.


## AC-03 · Chợ tri thức chuyên gia
**Tập 3 • 12 · ACADEMY**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AC-03; D06 · Wave A, P1, R2; sockets S03, S07, S11, S19

Expert Knowledge Marketplace

**Kế hoạch D06:** Wave A; P1; risk R2; sockets S03, S07, S11, S19.

### Mô tả gốc · D05

Sàn thương mại đóng gói khóa học, tài liệu.

### Mục đích và bản đầu đề xuất

Chuyên gia kiều bào đóng gói kiến thức; người học mua đúng nội dung, biết rõ ai chịu trách nhiệm. Catalog/course delivery với bản quyền, thanh toán và payout qua rails được duyệt.

### Luồng kỹ thuật đề xuất

1. Verify creator và quyền nội dung.
2. Review syllabus, preview và claims nghề nghiệp.
3. Người học xem giá/refund/access period.
4. Purchase xác nhận bởi payment truth rồi cấp entitlement.
5. Theo dõi học, dispute và payout theo settled revenue.

### Dữ liệu / quyền sở hữu

CourseListing, CreatorVerification, ContentLicense, Enrollment, Purchase, PayoutEligibility; tách content ownership và revenue ownership.

### Lệnh và sự kiện tham chiếu

course.reviewed → listing.published; payment.reconciled → enrollment.activated; eligible.revenue → payout.prepared.

### Test phải có

Chargeback sau học. • Upload tài liệu sao chép. • Creator bị đình chỉ. • Entitlement sai tenant/user.

### Ranh giới và điều kiện mở cổng

Không hứa chứng chỉ có giá trị nghề nghiệp nếu không có tổ chức cấp. Không payout từ GMV pending. Cần rights review, content moderation, payout provider và terms.

### KPI và economics

Course completion; refund rate; content complaints; creator earnings settled; retention. Nguồn thu đề xuất D06: Commission + subscription.


## AC-04 · Dịch và chuẩn bị công nhận bằng cấp
**Tập 3 • 12 · ACADEMY**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AC-04; D06 · Wave B, P1, R2; sockets S12, S13, S14, S19

Credential Translator

**Kế hoạch D06:** Wave B; P1; risk R2; sockets S12, S13, S14, S19.

### Mô tả gốc · D05

Quy đổi và hợp pháp hóa bằng cấp sang chuẩn EU.

### Mục đích và bản đầu đề xuất

Giúp người dùng hiểu bằng của mình, chuẩn bị bản dịch và hồ sơ yêu cầu cơ quan công nhận. Dịch/extract/checklist; “hợp pháp hóa/quy đổi” trong concept không phải năng lực pháp lý tự động của Viona.

### Luồng kỹ thuật đề xuất

1. Nhập mục đích dùng bằng và nước tiếp nhận.
2. Trích dữ liệu bằng, giữ ảnh/trang gốc.
3. Dịch thuật ngữ và yêu cầu user kiểm field quan trọng.
4. Chuẩn bị checklist cơ quan/chuyên gia phù hợp.
5. Gửi khi được phép và theo dõi kết quả thật.

### Dữ liệu / quyền sở hữu

CredentialDocument, TranslationDraft, RecognitionRequirement, ApplicationPacket, AuthorityReceipt; không sửa nội dung gốc.

### Lệnh và sự kiện tham chiếu

credential.parsed → translation.prepared → human.verified → recognition.requested.

### Test phải có

Tên trường phiên âm sai. • Môn học không tương đương. • Dịch thiếu dấu đóng. • Authority yêu cầu bản dịch công chứng.

### Ranh giới và điều kiện mở cổng

Không tự cấp equivalence hay dịch công chứng. Không giả cơ quan đã công nhận. Cần translator/recognition partner và jurisdiction source.

### KPI và economics

Field accuracy; checklist completeness; professional rework; verified submission. Nguồn thu đề xuất D06: Subscription / service fee.


## AC-05 · Học thích nghi theo nhịp sinh học
**Tập 3 • 12 · ACADEMY**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AC-05; D06 · Wave C, P3, R3; sockets S02, S03, S05, S16, S19

Bio-sync Cognitive Learner

**Kế hoạch D06:** Wave C; P3; risk R3; sockets S02, S03, S05, S16, S19.

### Mô tả gốc · D05

Đọc sinh trắc học để đẩy bài học khó vào giờ Peak Focus.

### Mục đích và bản đầu đề xuất

Chọn thời điểm học phù hợp hơn bằng tín hiệu người dùng cho phép, không xâm phạm sức khỏe. Ưu tiên lịch tự khai và mức năng lượng chủ quan; wearable chỉ opt-in nghiên cứu.

### Luồng kỹ thuật đề xuất

1. User chọn dữ liệu được dùng và thời gian yên lặng.
2. Tạo baseline lịch học không cần sinh trắc.
3. So sánh thời điểm với performance trong phạm vi cá nhân.
4. Đề xuất bài ngắn hoặc nghỉ, giải thích vì sao.
5. User phản hồi, tắt signals và xóa lịch sử được kiểm soát.

### Dữ liệu / quyền sở hữu

FocusPreference, ConsentedSignal, LearningWindow, AdaptationExperiment; raw health signals tách khỏi global memory.

### Lệnh và sự kiện tham chiếu

signal.observed → learning.window.suggested → user.accepted/dismissed; không thay lịch người dùng ngoài authority.

### Test phải có

Wearable sai. • Signal mất. • Lịch bận đột xuất. • Dữ liệu trẻ/nhạy cảm bị dùng cross-domain.

### Ranh giới và điều kiện mở cổng

Không suy chẩn đoán, không khẳng định đo “peak cognition” y khoa. Không dùng sinh trắc làm điều kiện học cơ bản. Cần consent, evaluation khoa học và privacy review trước wearable release.

### KPI và economics

Learning gain trong thử nghiệm; relevance; opt-out; signal missingness; privacy incidents. Nguồn thu đề xuất D06: Premium subscription.


## AC-06 · Soạn giáo án và phản hồi bài học
**Tập 3 • 12 · ACADEMY**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AC-06; D06 · Wave A, P1, R2; sockets S04, S05, S13, S19

Lesson Plan Architect

**Kế hoạch D06:** Wave A; P1; risk R2; sockets S04, S05, S13, S19.

### Mô tả gốc · D05

Tự động thiết kế giáo án và chấm bài luận.

### Mục đích và bản đầu đề xuất

Giáo viên chuẩn bị nội dung nhanh hơn, giữ mục tiêu, rubric và quyền quyết định cuối. Draft lesson plans và formative feedback; điểm quyết định quan trọng cần teacher review.

### Luồng kỹ thuật đề xuất

1. Nhập mục tiêu, lứa tuổi, thời lượng và curriculum.
2. Retrieve nguồn được phép.
3. Tạo giáo án/hoạt động với citations và accessible alternatives.
4. Giáo viên chỉnh/duyệt phiên bản.
5. Học viên làm bài; feedback và chấm theo rubric, appeal cho sai sót.

### Dữ liệu / quyền sở hữu

CurriculumGoal, LessonPlanVersion, Rubric, Submission, TeacherReview, GradeDecision; track AI suggestion khác teacher grade.

### Lệnh và sự kiện tham chiếu

plan.generated → plan.reviewed → assignment.published; submission.received → feedback.prepared → teacher.finalized.

### Test phải có

Bài có prompt injection. • Rubric thiếu. • AI bịa nguồn. • Chấm lệch nhóm ngôn ngữ.

### Ranh giới và điều kiện mở cổng

Không tự quyết high-stakes grade/admission; không dùng bài học riêng huấn luyện chung khi chưa quyền. Cần curriculum rights, rubric eval và teacher role boundaries.

### KPI và economics

Teacher time saved; feedback usefulness; override rate; source accuracy. Nguồn thu đề xuất D06: Subscription.


## AC-07 · Mô phỏng nghề bằng VR
**Tập 3 • 12 · ACADEMY**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AC-07; D06 · Wave C, P3, R4; sockets S16, S19, S20

VR Vocation Simulator

**Kế hoạch D06:** Wave C; P3; risk R4; sockets S16, S19, S20.

### Mô tả gốc · D05

Thực hành nghề (nail, bếp) trong môi trường VR.

### Mục đích và bản đầu đề xuất

Thực hành động tác và quy trình nghề trong không gian mô phỏng trước khi làm với khách/thiết bị thật. Prototype bài mô phỏng nail/bếp có instructor; không thay chứng nhận kỹ năng hay an toàn nghề.

### Luồng kỹ thuật đề xuất

1. Chọn lesson/device đã hỗ trợ.
2. Calibrate input và vùng an toàn.
3. Thực hành tình huống có feedback từng bước.
4. Giáo viên xem dấu vết lỗi và cho bài lặp.
5. Export progress như simulation evidence, không official competency.

### Dữ liệu / quyền sở hữu

SimulationScenario, InteractionTrace, SafetyBoundary, AssessmentRubric, InstructorReview; trace nhạy cảm device retention hữu hạn.

### Lệnh và sự kiện tham chiếu

simulation.started → step.completed → scenario.scored → instructor.reviewed.

### Test phải có

Tracking mất. • Motion sickness. • Controller mapping khác. • Sai thao tác nhưng scoring thưởng.

### Ranh giới và điều kiện mở cổng

XR là interface/shared capability; bản học 2D vẫn có. Không trì hoãn core launch để đủ headset. Cần engine/OpenXR ADR, instructor validation và nghiên cứu transfer-to-real-world.

### KPI và economics

Skill transfer study; completion; discomfort; input error; device coverage. Nguồn thu đề xuất D06: Premium course / B2B training.


## AC-08 · Gia phả và ký ức gia đình
**Tập 3 • 12 · ACADEMY**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AC-08; D06 · Wave D, P3, R3; sockets S02, S05, S09, S13, S19

Digital Genealogy & Ancestry AI

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S02, S05, S09, S13, S19.

### Mô tả gốc · D05

Lưu trữ hồi ký và nhân bản giọng nói/tính cách để thế hệ sau giao tiếp với tổ tiên qua AI.

### Mục đích và bản đầu đề xuất

Lưu hồi ký/tư liệu gia đình và tạo cách khám phá có nguồn, không giả người đã mất thật sự đang nói. Timeline ký ức và tìm kiếm tư liệu trước; persona/voice recreation cần consent/quyền riêng và disclosure nổi bật.

### Luồng kỹ thuật đề xuất

1. Xác định ai có quyền tải/lưu/chia từng tư liệu.
2. Số hóa, gắn tác giả/ngày/độ chắc chắn.
3. Người trong gia đình xác minh facts và tranh chấp.
4. Trả câu trả lời dựa nguồn, đánh dấu lời dựng.
5. Export/delete/revoke từng người theo policy.

### Dữ liệu / quyền sở hữu

FamilyTree, MemoryAsset, ContributorConsent, FactAssertion, PersonaLicense; relationship không tự cấp access.

### Lệnh và sự kiện tham chiếu

asset.ingested → fact.proposed → family.verified → memory.published; generated dialogue labeled simulated.

### Test phải có

Quan hệ huyết thống suy đoán sai. • Hai nguồn mâu thuẫn. • Người rút consent giọng nói. • Trẻ xem nội dung nhạy cảm.

### Ranh giới và điều kiện mở cổng

Không tuyên bố phục sinh, không clone để lừa người khác. “Giao tiếp với tổ tiên” là mô phỏng nội dung, không người thật. Voice/persona rights, deceased-person policy và retention cần high-trust review.

### KPI và economics

Provenance coverage; contested facts; export/delete completion; family value. Nguồn thu đề xuất D06: Premium family subscription.


## AC-09 · Kết nối kỹ năng với việc làm
**Tập 3 • 12 · ACADEMY**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AC-09; D06 · Wave B, P1, R3; sockets S02, S05, S08, S11, S13, S19

Skill-to-Job Matching Engine

**Kế hoạch D06:** Wave B; P1; risk R3; sockets S02, S05, S08, S11, S13, S19.

### Mô tả gốc · D05

AI tự động khớp nối học viên vừa tốt nghiệp với các doanh nghiệp kiều bào đang thiếu nhân sự.

### Mục đích và bản đầu đề xuất

Biến tiến bộ học tập thành cơ hội việc phù hợp mà người học và doanh nghiệp đều chủ động quyết định. Skill evidence + explainable recommendations; không tự tuyển/loại ứng viên.

### Luồng kỹ thuật đề xuất

1. Người học cho phép dùng phần kỹ năng chọn lọc.
2. Doanh nghiệp đăng job có yêu cầu rõ.
3. Matching giải thích các tiêu chí liên quan.
4. Hai bên tự đồng ý liên hệ/ứng tuyển.
5. Theo dõi placement thật, phản hồi và cập nhật skill evidence.

### Dữ liệu / quyền sở hữu

SkillEvidence, JobRequirement, MatchRecommendation, ApplicationConsent, HiringOutcome; sensitive attributes không là shortcut ranking.

### Lệnh và sự kiện tham chiếu

skill.verified → match.proposed → contact.authorized → application.submitted → outcome.reported.

### Test phải có

Credential chưa verify. • Job hết hạn. • Bias theo accent/quốc tịch. • Employer lấy dữ liệu ngoài consent.

### Ranh giới và điều kiện mở cổng

Không quyết định tuyển dụng tự trị; cần fairness/evaluation/legal review theo deployment context. Không fake job supply. Cần employer verification, rights to work guidance boundary và local employment policy.

### KPI và economics

Qualified matches; contact acceptance; placement verified; fairness slices; complaints. Nguồn thu đề xuất D06: Recruitment fee / B2B SaaS.


## Local · 10 module
**Tập 3 • 13 · LOCAL**
**Phạm vi:** CATALOG NGUỒN / KẾ HOẠCH
**Nguồn:** D05 original catalog; D06 planning proposals; D11 LO-05 successor; D03 Grand Launch successor

Giải quyết việc đời sống hàng ngày

### Ranh giới universe

Local kết nối người dùng với supply và Business; không xác nhận fulfillment chỉ từ lead gửi đi. LO-06 là signature proactivity; health/social/physical devices được gated theo risk.

### Danh mục chính xác

| Mã | Tên gốc | Wave / P / Risk |
| --- | --- | --- |
| LO-01 | Bureaucracy Navigator | A / P0 / R2 |
| LO-02 | Community Real Estate | B / P1 / R2 |
| LO-03 | On-demand Handyman | A / P1 / R2 |
| LO-04 | Telehealth Medical Bridge | D / P3 / R3 |
| LO-05 | Viona Mobility & Partner Economy *(Community Carpool successor)* | Staged A2/B / per-market, per-capability gate |
| LO-06 | Predictive Lifestyle Orchestrator | C / P2 / R3 |
| LO-07 | Smart Home IoT Link | C / P2 / R3 |
| LO-08 | Drone-Delivery API Hook | C / P3 / R4 |
| LO-09 | Trust-based Networking & Dating | D / P3 / R3 |
| LO-10 | Smart EV Charging Negotiator | C / P2 / R3 |

### Cách đọc các hồ sơ tiếp theo

Mô tả gốc giữ nguyên D05 cho 62 module không đổi. Riêng LO-05 dùng D11 successor: vẫn cùng module ID nhưng mở rộng thành Mobility & Partner Economy với staged activation A2/B. Wave/priority/risk/socket/revenue là planning/architecture, không là trạng thái đã live hay cấp phép. Trình tự, data entities, commands, tests, KPIs và release đề xuất do nguồn successor + sách tổ chức lại để triển khai có kiểm soát.


## LO-01 · Điều hướng giấy tờ hành chính
**Tập 3 • 13 · LOCAL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · LO-01; D06 · Wave A, P0, R2; sockets S05, S12, S13, S14

Bureaucracy Navigator

**Kế hoạch D06:** Wave A; P0; risk R2; sockets S05, S12, S13, S14.

### Mô tả gốc · D05

Dịch công văn hành chính (thuế, tòa án, phạt nguội) và hướng dẫn xử lý.

### Mục đích và bản đầu đề xuất

Người Việt nhận công văn bản địa cần hiểu ai gửi, phải làm gì và hạn nào là quan trọng. Đọc tài liệu do người dùng cung cấp, dịch có dẫn vị trí và tạo checklist; chưa tự nộp hoặc đại diện pháp lý.

### Luồng kỹ thuật đề xuất

1. Người dùng chọn tài liệu và phạm vi sử dụng.
2. Trích văn bản, giữ bản gốc và độ tin cậy từng trường.
3. Phân loại cơ quan, ngày phát hành, hạn trả lời, số tiền; yêu cầu xác nhận khi mơ hồ.
4. Tạo bản dịch và danh sách việc, liên kết nguồn chính thức theo quốc gia.
5. Người dùng duyệt lịch nhắc hoặc nhờ chuyên gia; mọi gửi hồ sơ là hành động riêng.

### Dữ liệu / quyền sở hữu

DocumentVersion, ExtractedField, Deadline, AgencyReference, ActionDraft; lưu page/span, ngôn ngữ, version và trạng thái xác nhận.

### Lệnh và sự kiện tham chiếu

document.ingested → fields.extracted → deadline.confirmed → checklist.prepared. Không dùng kết quả OCR không chắc chắn để tự sinh nghĩa vụ.

### Test phải có

Nhầm ngày tháng dd/mm. • Số tài khoản trong tài liệu giả. • Hạn chót ở múi giờ khác. • Mẫu đơn đã hết hiệu lực.

### Ranh giới và điều kiện mở cổng

Không đưa kết luận pháp lý cuối cùng hoặc tự nhận đã xử lý công văn. Bản dịch không tự trở thành bản dịch chứng thực. Cần catalog nguồn cơ quan cập nhật, đối tác dịch/chuyên gia và retention tài liệu nhạy cảm.

### KPI và economics

Tỷ lệ trường quan trọng được xác nhận; hạn bị nhận sai; việc hoàn thành; mức hữu ích do người dùng đánh giá. Nguồn thu đề xuất D06: Subscription / service lead.


## LO-02 · Nhà ở và sang nhượng trong cộng đồng
**Tập 3 • 13 · LOCAL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · LO-02; D06 · Wave B, P1, R2; sockets S07, S08, S11, S12, S14

Community Real Estate

**Kế hoạch D06:** Wave B; P1; risk R2; sockets S07, S08, S11, S12, S14.

### Mô tả gốc · D05

Sàn sang nhượng quán ăn, tiệm nail, thuê nhà xác thực chủ quyền.

### Mục đích và bản đầu đề xuất

Giúp tìm nhà thuê hoặc cơ sở kinh doanh mà không nhầm một tin đăng với quyền sở hữu đã được xác thực. Tin đăng có mức xác minh cụ thể, yêu cầu xem nhà và kết nối chủ tin; không tự escrow hay công chứng.

### Luồng kỹ thuật đề xuất

1. Người đăng khai chủ thể, địa chỉ và quyền đăng tin.
2. Kiểm tra tài liệu qua quy trình xác minh thích hợp.
3. Người tìm lọc ngân sách, khu vực, loại hình và xem nhãn chứng cứ.
4. Đặt lịch xem qua authority riêng, che thông tin nhạy cảm.
5. Ghi outcome, khiếu nại và trạng thái tin còn hiệu lực.

### Dữ liệu / quyền sở hữu

PropertyListing, VerificationEvidence, ViewingRequest, OwnershipClaim, ListingExpiry; phân biệt người sở hữu, đại diện và người thuê sang nhượng.

### Lệnh và sự kiện tham chiếu

listing.submitted → verification.reviewed → listing.published → viewing.requested. Payment/deposit không nằm trong quyền của bộ tìm kiếm.

### Test phải có

Tin giả trùng địa chỉ. • Người thuê không có quyền sang nhượng. • Evidence hết hạn. • Lộ giấy tờ hoặc địa chỉ của người dễ tổn thương.

### Ranh giới và điều kiện mở cổng

Nhãn verified phải nói rõ đã xác minh điều gì, khi nào và bởi ai; không bảo đảm pháp lý tuyệt đối hoặc giá trị tài sản. Cần policy bất động sản địa phương, quyền sử dụng dữ liệu và đối tác hợp đồng độc lập.

### KPI và economics

Qualified viewing; stale listing rate; complaint rate; verified supply; time to response. Nguồn thu đề xuất D06: Listing/lead/transaction.


## LO-03 · Gọi thợ sửa chữa đáng tin cậy
**Tập 3 • 13 · LOCAL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · LO-03; D06 · Wave A, P1, R2; sockets S03, S08, S09, S10, S11

On-demand Handyman

**Kế hoạch D06:** Wave A; P1; risk R2; sockets S03, S08, S09, S10, S11.

### Mô tả gốc · D05

Gọi thợ sửa điện nước, bảo trì khẩn cấp trong cộng đồng.

### Mục đích và bản đầu đề xuất

Tìm thợ phù hợp ngôn ngữ và công việc, có báo giá cùng lịch thực tế thay vì chờ phản hồi từ nhiều nhóm. Yêu cầu sửa chữa có ảnh, khung giờ và vùng phục vụ; phản hồi thật từ merchant.

### Luồng kỹ thuật đề xuất

1. Người dùng mô tả lỗi, địa điểm và rủi ro khẩn cấp.
2. Phân luồng safety trước khi tìm thợ.
3. Lọc nhà cung cấp theo kỹ năng, coverage và availability được xác nhận.
4. Gửi yêu cầu hoặc gọi theo envelope; chốt giá/phạm vi với người dùng.
5. Theo dõi đến nơi, hoàn thành, chứng cứ và xử lý phát sinh.

### Dữ liệu / quyền sở hữu

WorkRequest, TradeSkill, ServiceArea, Quote, Visit, ChangeOrder; quotation khác invoice, arrival estimate khác guarantee.

### Lệnh và sự kiện tham chiếu

work.requested → quote.received → visit.confirmed → work.completed. Thay phạm vi/chi phí tạo ChangeOrder cần chấp thuận lại.

### Test phải có

Rò gas bị coi là việc sửa thường. • Báo giá tăng sau khi thợ tới. • Hai thợ nhận một job. • No-show và dispute hình ảnh.

### Ranh giới và điều kiện mở cổng

Không tự đảm bảo thợ đủ chứng chỉ khi chưa kiểm tra. Tình huống nguy hiểm phải chuyển hướng khẩn cấp phù hợp, không trì hoãn vì lead fee. Cần supplier verification, trách nhiệm chất lượng, phạm vi bảo hiểm và support escalations.

### KPI và economics

First response; confirmed visit; no-show; dispute resolution; margin per fulfilled job. Nguồn thu đề xuất D06: Lead/transaction commission.


## LO-04 · Cầu nối y tế và ngôn ngữ
**Tập 3 • 13 · LOCAL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · LO-04; D06 · Wave D, P3, R3; sockets S02, S06, S09, S13, S14, S15

Telehealth Medical Bridge

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S02, S06, S09, S13, S14, S15.

### Mô tả gốc · D05

Kết nối bác sĩ đa khoa người Việt từ xa, dịch đơn thuốc bản địa.

### Mục đích và bản đầu đề xuất

Giảm rào cản ngôn ngữ trong việc tìm cơ sở và sắp xếp chăm sóc, không biến Viona thành bác sĩ tự trị. Phối hợp hành chính với nhà cung cấp được xác minh; chuẩn bị câu hỏi, phiên dịch có cảnh báo giới hạn.

### Luồng kỹ thuật đề xuất

1. Phân biệt nhu cầu hành chính với tình huống cần trợ giúp khẩn cấp.
2. Xin consent cho dữ liệu tối thiểu và chọn provider hợp lệ.
3. Chuẩn bị nội dung đặt lịch hoặc yêu cầu thông tin.
4. Thực hiện cuộc gọi trong phạm vi được duyệt; số thuốc/liều và nội dung nhạy cảm cần xác nhận người thật.
5. Ghi kết quả hành chính và follow-up do người dùng cho phép.

### Dữ liệu / quyền sở hữu

CareCoordinationRequest, ProviderCredential, ConsentScope, Appointment, TranslationSegment; tách hồ sơ nhạy cảm khỏi analytics phổ thông.

### Lệnh và sự kiện tham chiếu

care.admin.prepared → call.authorized → appointment.reconciled. Không có diagnose/prescribe command trong release hành chính.

### Test phải có

Triệu chứng khẩn cấp. • Dịch sai liều thuốc. • Provider mất giấy phép. • Consent bị rút khi chia sẻ tài liệu.

### Ranh giới và điều kiện mở cổng

Không chẩn đoán, kê đơn hoặc hứa telehealth hợp pháp ở mọi quốc gia. Wave D-select chỉ mở scope đã kiểm chứng và có người chịu trách nhiệm. Cần review dữ liệu sức khỏe, qualified partners, jurisdiction và quy trình escalation; chưa được suy từ blueprint thành dịch vụ live.

### KPI và economics

Administrative task completion; human escalation; critical translation error; consent integrity. Nguồn thu đề xuất D06: Partner/referral/subscription.


## LO-05 · Viona Mobility & Partner Economy
**Tập 3 • 13 · LOCAL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN SUCCESSOR + THIẾT KẾ TRIỂN KHAI
**Nguồn:** D11 §§4,4A,6A; D05 historical Community Carpool; D06 historical Wave B planning

**Tên hiện hành:** Viona Mobility & Partner Economy *(Community Carpool successor)*

**Giữ module count:** `LO-05A..F` là sáu capability nội bộ; **không tạo module thứ 64–69**.

### Mục đích

Biến Local thành cổng kiếm thu nhập hợp pháp và an toàn cho người Việt ở nước ngoài, đồng thời tạo supply cho nhu cầu ride/delivery/errand/helper/student job/business runner. Viona không mặc định mọi người đều được nhận mọi việc; Account + Country Policy xác định eligibility cho từng market và capability.

### Sáu capability

| ID | Tên | Outcome | Rollout |
| --- | --- | --- | --- |
| LO-05A | Viona Ride | Chở khách theo trip/request được xác nhận. | Wave B, licensed city-country pilot. |
| LO-05B | Viona Delivery | Giao hàng/đồ ăn/giấy tờ trong scope cho phép. | Wave A2 bounded pilot. |
| LO-05C | Viona Errand | Việc mua hộ/lấy hàng/xếp hàng/chạy việc. | Wave A2 bounded pilot. |
| LO-05D | Viona Local Helper | Accompaniment/orientation/local assistance không regulated. | Wave A2 bounded pilot. |
| LO-05E | Viona Student Jobs | Micro-jobs theo giờ/ca trong work-right/hour cap. | Wave A2; policy mandatory. |
| LO-05F | Viona Business Runner | Runner/delivery/operational errands cho merchant. | Wave A2/B. |

### End-to-end journey

```text
USER_NEEDS_HELP
→ LOCAL / VIONA DISCOVERY
→ JOB_OR_TRIP_REQUEST
→ ELIGIBILITY + COUNTRY_POLICY
→ TRUSTED_PARTNER_MATCHING
→ QUOTE / ETA / TERMS
→ CUSTOMER_CONFIRMATION
→ AUTHORITY_GATE
→ BOUNDED_EXECUTION
→ PROOF_OF_COMPLETION
→ PAYMENT + SETTLEMENT
→ PARTNER_EARNINGS
→ RATING + TRUST + DISPUTE EVIDENCE
```

### 1. Onboarding Partner từng bước

1. **DRAFT:** người dùng chọn market và earning modes mong muốn; chưa được nhận job.
2. **IDENTITY_VERIFICATION:** Account xác minh identity/provenance theo policy; không đưa raw identity cho marketplace ngoài necessity.
3. **RESIDENCY_AND_WORK_RIGHT_REVIEW:** S14 kiểm market-specific right-to-work/student limits/age conditions nếu áp dụng.
4. **ROLE_SPECIFIC_DOCUMENTS:** Ride có thể cần licence/vehicle/insurance; Delivery/Runner có policy khác; không copy một checklist cho mọi mode.
5. **TAX/PAYOUT_PROFILE:** cấu hình payout eligibility và tax/settlement profile theo market; không coi một bank account là proof pháp lý đầy đủ.
6. **TRUST_AND_SAFETY_CHECK:** anti-fraud, device/account risk, background/trust controls nơi policy yêu cầu.
7. **COUNTRY_POLICY_EVALUATION:** bind exact policy pack version, market, valid-until.
8. **ELIGIBLE_CAPABILITY_SET_CREATED:** tạo machine-readable entitlement; capability không đủ proof giữ `NOT_ELIGIBLE/NEEDS_MORE_EVIDENCE`.
9. **PARTNER_ACTIVE:** chỉ nhận offer nằm trong entitlement và availability.

Exception: `NEEDS_MORE_EVIDENCE`, `TEMPORARILY_RESTRICTED`, `CAPABILITY_SUSPENDED`, `MARKET_DISABLED`, `PAYOUT_HOLD`, `DISPUTE_REVIEW`, `EXPIRED_REVERIFICATION_REQUIRED`.

### 2. Eligibility record tham chiếu

```yaml
partner_id: <id>
market: CZ-PRAGUE
policy_pack_version: <exact>
valid_until: <timestamp>
capabilities:
  ride: NOT_ELIGIBLE
  delivery: ELIGIBLE
  errand: ELIGIBLE
  local_helper: ELIGIBLE
  student_jobs: ELIGIBLE_WITH_HOUR_CAP
  business_runner: ELIGIBLE
constraints:
  weekly_hour_cap: <policy-derived>
  vehicle_class: null
  payout_profile_status: VERIFIED
```

Đây là schema tham chiếu; actual fields phải qua ADR/schema review.

### 3. Job / Trip lifecycle

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

Terminal/exception: `CUSTOMER_CANCELLED`, `PARTNER_CANCELLED`, `NO_MATCH`, `EXPIRED`, `PAYMENT_FAILED`, `PROVIDER_UNKNOWN_PENDING_RECONCILIATION`, `DISPUTED`, `SAFETY_STOP`, `POLICY_BLOCKED`.

Pre-effect revalidation phải kiểm lại entitlement/policy version, partner status, customer confirmation, job terms, payment reserve nếu áp dụng, location/consent và exact authority.

### 4. Matching engine

Candidate pool chỉ chứa partner `ELIGIBLE + ACTIVE + AVAILABLE`. Score có thể dùng ETA, capability/vehicle/tool fit, language, trust/reliability, preference hợp lệ, fairness/anti-starvation, remaining work-hour cap và country/city constraints. Không dùng sensitive attributes như shortcut ranking nếu không có lawful/policy basis.

Matching output là **proposal**; partner acceptance và customer/service confirmation vẫn có state/authority riêng.

### 5. Pricing và quote

Không có global fixed commission. Market policy định nghĩa quote, cancellation/no-show, taxes/statutory components, provider costs, VIONA fee và partner settlement base. Trước confirm phải hiển thị tổng giá/cách tính, các phần có thể thay đổi, cancellation rule, service type và contracting-party disclosure theo market model.

Variable-cost AI/maps/SMS/voice/provider phải reserve qua S04; không subsidy vô hạn.

### 6. Payment và settlement

S07 là source of truth cho monetary state:

```text
PAYMENT_INTENT
→ AUTHORIZED_OR_RESERVED
→ SERVICE_ACTIVE
→ COMPLETION_EVIDENCE
→ CAPTURE_OR_FINALIZE
→ PLATFORM_FEE_LEDGER
→ PARTNER_PAYABLE
→ SETTLEMENT
→ PAYOUT_CONFIRMED
```

Refund, cancellation, chargeback, dispute và payout failure phải idempotent/reconcilable. AI không trực tiếp sửa tiền, refund hoặc payout. Nếu provider status `UNKNOWN`, giữ reserve/pending state và reconcile thay vì retry blind.

### 7. Safety và trust

Tích hợp S08 + S13 + S15. Theo mode có verified identity, masked communication, trip/job share cho trusted contact, report/block, suspicious device/payment signals, evidence-preserving incident workflow và deactivation/review path. Ride, Delivery và Local Helper dùng policy khác nhau; late-night/high-risk-zone rules chỉ áp dụng khi country/ops policy xác định.

### 8. Privacy và location

`BEFORE_JOB`: coarse/availability nếu cần. `ACTIVE_JOB`: precise location chỉ khi service cần và consent/policy cho phép. `AFTER_JOB`: giữ derived/required evidence theo retention; không background-track vô hạn. Recording, biometric check hoặc emergency escalation là capability riêng có consent/policy.

### 9. Authority classes

Các effect tối thiểu cần S03: confirmed job/trip, partner binding acceptance, external provider action, precise location sharing, payment capture, refund, partner payable, payout trigger, consequential external message/call, safety escalation và high-impact restriction. Prepare/recommend không execute.

### 10. Socket map

`S01,S02,S03,S04,S05,S07,S08,S09,S10,S11,S13,S14,S15,S18`. Ride phụ thuộc mạnh `S10,S14,S15`; Student Jobs mạnh `S01,S14,S18`; Business Runner mạnh `S11,S18`; payout luôn qua `S07`.

### 11. Data entities tham chiếu

PartnerProfile, EligibilityDecision, CapabilityEntitlement, PolicyPackBinding, WorkHourBudget, VehicleOrToolProfile, JobRequest, QuoteVersion, MatchCandidate, PartnerOffer, TripOrJobSession, LocationConsent, CompletionEvidence, PaymentReservation, PartnerPayable, SettlementAttempt, DisputeCase, SafetyIncident, RatingEvidence.

Mỗi entity nhạy cảm cần tenant/purpose/retention owner; không dồn raw identity, precise location, payment và chat vào một bảng “Partner”.

### 12. Commands/events tham chiếu

```text
partner.eligibility.evaluate
partner.capability.activate
job.request.submit
job.quote.prepare
job.customer.confirm
job.match.prepare
job.partner.offer
job.partner.accept
job.pre_effect.revalidate
job.start
job.completion.propose
job.completion.confirm
payment.capture.request
partner.payable.create
settlement.reconcile
dispute.open
safety.stop
```

Tên trên là reference design, chưa là API production.

### 13. Negative tests tối thiểu

Partner hết hạn right-to-work giữa offer và start. • Student vượt hour cap. • Ride partner không còn insurance/licence. • Hai partner accept cùng job. • Customer payment reserve hết hạn. • Partner hoàn thành nhưng provider payment timeout. • Customer/Partner hủy ở ranh giới active. • GPS permission bị rút. • Fake completion evidence. • Dispute + chargeback đồng thời. • Market disabled trong khi có active jobs. • Payout duplicate webhook. • Safety stop khi payment vẫn pending.

### 14. Rollout

```text
P0 READ-ONLY MARKET/POLICY DISCOVERY
P1 PARTNER IDENTITY + ELIGIBILITY + EARNINGS PROFILE
P2 DELIVERY / ERRAND / LOCAL HELPER / STUDENT JOBS / BUSINESS RUNNER PILOTS
P3 TRUST + DISPUTE + PAYMENT/SETTLEMENT HARDENING
P4 VIONA RIDE MARKET-BY-MARKET PILOT
P5 CITY SCALE + DYNAMIC SUPPLY / ETA / PRICING CONTROLS
P6 CROSS-UNIVERSE INCOME ORCHESTRATION
```

### 15. Production gate

Một `market × capability` chỉ Pilot → Production khi:

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

### 16. KPI và economics

Theo dõi Active Eligible Partners, Weekly Earning Partners, median partner net earning per active hour, request→match, match→accept, time-to-match, completion, cancellation by party, dispute, safety incident, payout success/latency, customer repeat, partner retention 30d/90d, take rate, contribution margin/completed job, variable cost/job, policy block và fraud loss.

Không tối ưu GMV bằng cách hy sinh partner earnings, safety, legality hoặc unit economics. Primary monetization: marketplace lead/transaction; secondary: Business SaaS/delivery plans; optional partner services/referral nơi policy cho phép.

### 17. Cross-universe flywheel

Academy tạo skill/credential → Account xác định identity/eligibility/payout → Local LO-05 tạo marketplace → Business tạo job demand → Travel tạo visitor/airport/local-assistance demand → SOS cung cấp safety/trusted-contact/escalation → trust + earnings history quay lại.

### Ranh giới cuối cùng

Không quảng bá “Grab của người Việt” như production toàn cầu khi chỉ có vài market/capability pilot. Viona Ride là capability có legal/insurance/licensing/ops gate riêng. Các capability khác cũng không mặc định tự do pháp lý. Success là **thu nhập thật + settlement thật + safety + positive unit economics** trong scope đã chứng minh.


## LO-06 · Điều phối đời sống chủ động
**Tập 3 • 13 · LOCAL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · LO-06; D06 · Wave C, P2, R3; sockets S03, S04, S05, S11, S17

Predictive Lifestyle Orchestrator

**Kế hoạch D06:** Wave C; P2; risk R3; sockets S03, S04, S05, S11, S17.

### Mô tả gốc · D05

Tiên đoán hết nhu yếu phẩm, tự săn sale và nhắc thanh toán.

### Mục đích và bản đầu đề xuất

Viona nhận ra một việc có ích sắp tới và chuẩn bị phương án đúng lúc, không cần người dùng nhớ mọi bước. Reminder/recommendation theo ngữ cảnh có consent; mua hàng, thanh toán hay đặt lịch luôn cần authority phù hợp.

### Luồng kỹ thuật đề xuất

1. Nhận tín hiệu đã cho phép: lịch, giao dịch đã xác nhận, preference hoặc nhập tay.
2. Kiểm tra freshness, độ chắc chắn và lý do liên quan.
3. Ước lượng giá trị so với rủi ro/làm phiền.
4. Tạo action draft có nguồn, chi phí trần và giải thích vì sao gợi ý.
5. Người dùng duyệt, bỏ qua hoặc sửa; outcome thật cập nhật preference nhưng không tự mở quyền.

### Dữ liệu / quyền sở hữu

ContextFact, SignalCandidate, NeedHypothesis, SuppressionRule, ActionDraft, OutcomeFeedback; memory không được trở thành authority.

### Lệnh và sự kiện tham chiếu

signal.observed → suggestion.qualified → action.prepared → authority.requested → outcome.reconciled.

### Test phải có

Giấy tờ đã gia hạn nhưng memory cũ. • Hai agent nhắc cùng việc. • Thiếu dữ liệu người mới. • Prompt injection trong email biến thành lệnh mua.

### Ranh giới và điều kiện mở cổng

Đây là signature Wave C; không dự báo như sự thật chắc chắn, không theo dõi ngầm hoặc phát 20 thông báo không cần thiết mỗi ngày. Cần consent event sources, suppression policy, cold-start UX và bộ đánh giá lợi ích thực trên pilot.

### KPI và economics

Useful proactive action rate; dismiss/snooze; incorrect commitment; repeat value; cost per useful outcome. Nguồn thu đề xuất D06: Subscription + commerce commission.


## LO-07 · Kết nối ngôi nhà thông minh
**Tập 3 • 13 · LOCAL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · LO-07; D06 · Wave C, P2, R3; sockets S03, S06, S16

Smart Home IoT Link

**Kế hoạch D06:** Wave C; P2; risk R3; sockets S03, S06, S16.

### Mô tả gốc · D05

Tích hợp điều khiển thiết bị nhà thông minh.

### Mục đích và bản đầu đề xuất

Tổng hợp ngữ cảnh và đề xuất thao tác thiết bị an toàn qua adapter đã được kiểm chứng. Ưu tiên read-only trạng thái; chỉ thêm hành động thấp rủi ro khi device/country policy đã duyệt.

### Luồng kỹ thuật đề xuất

1. Người dùng ghép thiết bị bằng quy trình chính thức.
2. Đồng bộ capability và trạng thái có timestamp.
3. Phân loại hành động theo tác động vật lý.
4. Chuẩn bị lệnh có giới hạn, xin authority.
5. Gửi lệnh và chờ device acknowledgement/readback; mất ACK không đồng nghĩa đã tắt.

### Dữ liệu / quyền sở hữu

DeviceBinding, CapabilityProfile, DeviceState, CommandAttempt, SafetyInterlock; secret thiết bị lưu trong vault.

### Lệnh và sự kiện tham chiếu

device.state.observed → command.prepared → command.authorized → device.acknowledged.

### Test phải có

Trạng thái cache cũ. • Lệnh bật nóng chạy hai lần. • Device offline. • Thiết bị dùng chung nhưng account không có quyền.

### Ranh giới và điều kiện mở cổng

Không tự mở khóa cửa, bật thiết bị nguy hiểm hoặc coi API accepted là effect completed. Giới hạn vật lý phải tồn tại ngoài mô hình. Cần ecosystem/device certification, household role model và kiểm thử physical safety.

### KPI và economics

Acknowledged command rate; stale state; unexpected activation; manual override success. Nguồn thu đề xuất D06: Subscription / partner.


## LO-08 · Kết nối robot và giao hàng bằng drone
**Tập 3 • 13 · LOCAL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · LO-08; D06 · Wave C, P3, R4; sockets S03, S06, S10, S16

Drone-Delivery API Hook

**Kế hoạch D06:** Wave C; P3; risk R4; sockets S03, S06, S10, S16.

### Mô tả gốc · D05

Cổng kết nối robot giao hàng nội khu.

### Mục đích và bản đầu đề xuất

Cổng tích hợp đối tác giao hàng tự hành, không phải VIONA tự vận hành máy bay hay đảm bảo delivery ở mọi nơi. Capability discovery và theo dõi read-only; execution chỉ với đối tác, khu vực và loại hàng được phép.

### Luồng kỹ thuật đề xuất

1. Đối tác công bố service area và constraints.
2. Kiểm tra kiện hàng, vị trí và điều kiện môi trường qua dữ liệu provider.
3. Chuẩn bị shipment/quote.
4. Người dùng duyệt qua gate của partner-controlled execution.
5. Theo dõi pickup/dropoff có proof; không giao được chuyển support, không tự điều khiển bay.

### Dữ liệu / quyền sở hữu

DeliveryCapability, Geofence, ParcelConstraint, DeliveryQuote, DeliveryProof; location precision giảm theo need-to-know.

### Lệnh và sự kiện tham chiếu

route.eligible → delivery.quoted → delivery.authorized → delivery.reconciled.

### Test phải có

Geofence thay đổi. • Mất liên lạc. • Thiếu proof giao hàng. • Người nhận khác danh tính.

### Ranh giới và điều kiện mở cổng

Moonshot/provider-gated. Không hướng dẫn điều khiển drone ngoài giới hạn pháp lý hoặc tự bypass vùng cấm. Cần operator được phép, insurance, aircraft/robot interfaces, weather reliability và jurisdiction review.

### KPI và economics

Eligible request coverage; successful delivery proof; exception cost; safety incidents. Nguồn thu đề xuất D06: Partner/transaction.


## LO-09 · Kết nối xã hội dựa trên niềm tin
**Tập 3 • 13 · LOCAL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · LO-09; D06 · Wave D, P3, R3; sockets S01, S02, S08, S11, S13

Trust-based Networking & Dating

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S01, S02, S08, S11, S13.

### Mô tả gốc · D05

Sàn giao lưu/hẹn hò yêu cầu KYC 100% sinh trắc học, triệt tiêu lừa đảo.

### Mục đích và bản đầu đề xuất

Tạo không gian giao lưu có kiểm soát lạm dụng mà không biến xác minh danh tính thành bảo đảm an toàn tuyệt đối. Profile, consent, block/report và matching bảo vệ riêng tư; biometrics chỉ là đề xuất nguồn cần review riêng.

### Luồng kỹ thuật đề xuất

1. Người dùng chọn mục đích, privacy và giới hạn tiếp cận.
2. Xác minh theo risk tier và data minimization.
3. Matching không phơi bày dữ liệu nhạy cảm.
4. Hai bên đồng ý liên hệ; có giới hạn nhắn tin và anti-scam signals.
5. Khiếu nại được xử lý, quyền truy cập và retention được cập nhật.

### Dữ liệu / quyền sở hữu

SocialProfile, VerificationLevel, MatchConsent, AbuseReport, ContactBoundary; không phát public giấy tờ hoặc biometric template.

### Lệnh và sự kiện tham chiếu

profile.verified → match.proposed → contact.mutually.accepted → abuse.reviewed.

### Test phải có

Account bị chiếm dù đã KYC. • Stalking theo vị trí. • Trẻ vị thành niên vào dating. • False report có động cơ.

### Ranh giới và điều kiện mở cổng

Nguồn viết KYC sinh trắc học 100%/triệt tiêu lừa đảo; đó không phải capability đã chứng minh. Đề xuất an toàn: age/consent gates, không hứa loại bỏ mọi scam. Cần quyết định riêng về biometrics, age assurance, moderation staffing và social safety.

### KPI và economics

Safe mutual contacts; report response; repeat abuse; privacy complaints; verification drop-off. Nguồn thu đề xuất D06: Subscription.


## LO-10 · Điều phối sạc xe điện theo chi phí
**Tập 3 • 13 · LOCAL**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · LO-10; D06 · Wave C, P2, R3; sockets S03, S04, S06, S13, S16

Smart EV Charging Negotiator

**Kế hoạch D06:** Wave C; P2; risk R3; sockets S03, S04, S06, S13, S16.

### Mô tả gốc · D05

Tác tử tự động đàm phán với lưới điện để sạc xe điện vào khung giờ giá rẻ nhất trong đêm.

### Mục đích và bản đầu đề xuất

Chuẩn bị lịch sạc theo giá, thời điểm cần xe và giới hạn pin; không để tối ưu giá làm người dùng lỡ việc. Mô phỏng lịch/ước tính rồi xác nhận; tự điều khiển chỉ với charger/provider tương thích.

### Luồng kỹ thuật đề xuất

1. Nhập giờ rời đi, mức pin mục tiêu, charger và tariff được xác minh.
2. Tính lịch khả thi với công suất và giới hạn thiết bị.
3. Trình bày tổng chi phí gồm phí mạng/thuế.
4. Nhận authority theo cửa sổ, kWh và trần tiền.
5. Readback phiên sạc thực tế; khi provider lỗi ưu tiên mục tiêu người dùng theo policy đã duyệt.

### Dữ liệu / quyền sở hữu

ChargingConstraint, TariffVersion, ChargePlan, EnergyReservation, MeterReadback.

### Lệnh và sự kiện tham chiếu

charge.plan.prepared → schedule.authorized → session.started → energy.reconciled.

### Test phải có

Giá spot âm nhưng phụ phí dương. • Xe bị rút cáp. • DST đổi giờ. • API accepted mà không sạc.

### Ranh giới và điều kiện mở cổng

Không cam kết luôn có giá rẻ nhất; không dùng dự báo giá như lệnh vật lý ngoài authority. Cần charger adapter, metering truth, tariff contracts và safety review trước Wave C execution.

### KPI và economics

Energy target met; realized total cost; schedule deviation; failed charging sessions. Nguồn thu đề xuất D06: Subscription + savings share.


## Account · 10 module
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** CATALOG NGUỒN / KẾ HOẠCH
**Nguồn:** D05 original catalog; D06 planning proposals; D03 successor

Control plane cá nhân và trust

### Ranh giới universe

Account core identity/consent/history có trước frontier finance. AT modules mở rộng không biến app thành licensed financial institution hoặc cho AI custody tài sản.

### Danh mục chính xác

| Mã | Tên gốc | Wave / P / Risk |
| --- | --- | --- |
| AT-01 | Smart Remittance Router | D / P2 / R3 |
| AT-02 | Cross-border Tax Compliance | D / P2 / R3 |
| AT-03 | Viona Trust Index | D / P3 / R3 |
| AT-04 | Family Treasury & Micro-lending | D / P3 / R3 |
| AT-05 | Multi-tenant Payment Gateway | D / P2 / R3 |
| AT-06 | Digital Inheritance Vault (Quantum-ready) | D / P3 / R4 |
| AT-07 | Scam Shield AI | A / P0 / R2 |
| AT-08 | Micro-Wealth Autonomous Agent | D / P3 / R3 |
| AT-09 | Crypto-Fiat Autonomous Bridge | D / P3 / R3 |
| AT-10 | Smart Crowdfunding | D / P3 / R3 |

### Cách đọc các hồ sơ tiếp theo

Mô tả gốc giữ nguyên D05. Wave/priority/risk/socket/revenue theo đề xuất D06, không là trạng thái đã live hay cấp phép. Trình tự, data entities, commands, tests, KPIs và release đề xuất do sách bổ sung để triển khai có kiểm soát.


## AT-01 · So sánh và định tuyến kiều hối
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AT-01; D06 · Wave D, P2, R3; sockets S03, S04, S06, S07, S13, S14

Smart Remittance Router

**Kế hoạch D06:** Wave D; P2; risk R3; sockets S03, S04, S06, S07, S13, S14.

### Mô tả gốc · D05

So sánh tỷ giá và định tuyến kiều hối hợp pháp tối ưu.

### Mục đích và bản đầu đề xuất

Giúp người dùng thấy người nhận thực lĩnh bao nhiêu, mất bao lâu và provider nào phù hợp. So sánh quote có timestamp và handoff tới provider được phép; không tự giữ tiền hay đảm bảo tỷ giá.

### Luồng kỹ thuật đề xuất

1. Người dùng chọn hành lang chuyển tiền và mục tiêu.
2. Lấy quote từ partner hợp lệ, tính tổng phí/FX/giới hạn.
3. Hiển thị số nhận ròng và thời hạn quote.
4. Consent + authority cho chuyển tiếp dữ liệu tối thiểu; giao dịch tiền ở partner flow.
5. Nhận trạng thái đã xác minh và đối soát, không coi redirect thành remittance success.

### Dữ liệu / quyền sở hữu

RemittanceQuote, CorridorPolicy, ProviderEligibility, TransferReference, SettlementStatus; KYC/AML ownership phải rõ.

### Lệnh và sự kiện tham chiếu

quote.compared → provider.selected → handoff.authorized → transfer.reconciled.

### Test phải có

Quote hết hạn. • Người nhận khác tên. • Provider pending. • Hai callback cùng transfer.

### Ranh giới và điều kiện mở cổng

Wave D-select có thể chỉ comparison/handoff. Licensing, sanctions/AML và partner responsibility không được suy từ việc có API. Cần provider agreements, country/corridor scope, disclosures và dữ liệu cấp phép hiện hành.

### KPI và economics

Net quote accuracy; handoff completion; pending age; complaints; margin after partner fees. Nguồn thu đề xuất D06: Partner/commission.


## AT-02 · Điều phối nghĩa vụ thuế xuyên biên giới
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AT-02; D06 · Wave D, P2, R3; sockets S05, S12, S13, S14

Cross-border Tax Compliance

**Kế hoạch D06:** Wave D; P2; risk R3; sockets S05, S12, S13, S14.

### Mô tả gốc · D05

Cảnh báo nghĩa vụ khai thuế song phương.

### Mục đích và bản đầu đề xuất

Nhắc người dùng chuẩn bị hồ sơ và hỏi chuyên gia đúng vấn đề, không tự quyết định nơi cư trú thuế. Checklist theo khai báo và nguồn chính thức có ngày; advisory/human-review trước mọi filing.

### Luồng kỹ thuật đề xuất

1. Thu thập country/time/context tối thiểu với consent.
2. Xác định dữ kiện còn thiếu; không kết luận khi thông tin mâu thuẫn.
3. Tạo danh sách tài liệu và deadline nguồn.
4. Chuyên gia hoặc người dùng xác nhận nội dung.
5. Chỉ ghi trạng thái nộp khi có receipt từ cơ quan/provider.

### Dữ liệu / quyền sở hữu

TaxContextDeclaration, JurisdictionRuleVersion, FilingChecklist, ProfessionalReview, FilingReceipt.

### Lệnh và sự kiện tham chiếu

tax.context.declared → checklist.prepared → review.completed → filing.receipt.recorded.

### Test phải có

Double residence. • Quy định đã đổi. • Tài liệu thiếu hoặc giả. • AI tự gắn nhãn đã nộp.

### Ranh giới và điều kiện mở cổng

Không thay thế tax advisor, không cam kết compliance bằng một thuật toán chung; dữ liệu tài chính có retention/purpose riêng. Cần jurisdiction-specific legal/tax packs và người chịu trách nhiệm review.

### KPI và economics

Deadline correctness; checklist completion; advisor escalation; rejected filing count. Nguồn thu đề xuất D06: Subscription / professional referral.


## AT-03 · Chỉ số tin cậy giao thương
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AT-03; D06 · Wave D, P3, R3; sockets S02, S03, S08, S13

Viona Trust Index

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S02, S03, S08, S13.

### Mô tả gốc · D05

Chấm điểm tín nhiệm giao thương nội bộ người dùng.

### Mục đích và bản đầu đề xuất

Cung cấp tín hiệu minh bạch giúp đánh giá giao dịch, không tạo một điểm số con người áp dụng mọi ngữ cảnh. Tín hiệu giao dịch có nguồn, giải thích và cơ chế phản đối; chưa dùng cho tín dụng/tuyển dụng/quyền cơ bản.

### Luồng kỹ thuật đề xuất

1. Xác định mục đích và dữ liệu giao dịch hợp lệ.
2. Chỉ dùng sự kiện đã xác minh, không suy từ dân tộc/ngôn ngữ.
3. Tách mức xác minh, lịch sử thực hiện và dispute.
4. Hiển thị lý do/độ mới thay vì điểm tuyệt đối bí mật.
5. Người dùng phản hồi, appeal và sửa dữ liệu.

### Dữ liệu / quyền sở hữu

TrustSignal, EvidenceReference, ContextualScore, AppealCase, Correction; mỗi score có model/rule version.

### Lệnh và sự kiện tham chiếu

trust.signal.verified → context.score.computed → explanation.served → appeal.resolved.

### Test phải có

Sybil/fake reviews. • Dispute chưa xử xong. • Bias theo ít dữ liệu. • Điểm bị tái dùng ngoài mục đích.

### Ranh giới và điều kiện mở cổng

Tên module không cho phép social scoring hoặc đánh giá tín dụng không được duyệt. Sensitive/high-stakes uses phải có legal/fairness gate riêng. Phải chốt allowable-use policy, retention, fairness và external data rights trước rollout.

### KPI và economics

Explanation coverage; appeal reversal; false adverse decision; abuse detection precision. Nguồn thu đề xuất D06: Platform trust / B2B premium.


## AT-04 · Quỹ gia đình và hỗ trợ tài chính nhóm
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AT-04; D06 · Wave D, P3, R3; sockets S01, S03, S07, S13

Family Treasury & Micro-lending

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S01, S03, S07, S13.

### Mô tả gốc · D05

Quản lý quỹ gia đình đa quốc gia, hợp đồng thông minh cho họ/hụi.

### Mục đích và bản đầu đề xuất

Cho các thành viên nhìn rõ đóng góp, mục đích và trách nhiệm, nhưng không mặc nhiên biến VIONA thành nền tảng cho vay. Ledger theo dõi nội bộ và consent roles; micro-lending/họ hụi là scope high-risk tách riêng.

### Luồng kỹ thuật đề xuất

1. Nhóm thống nhất vai trò và mục đích quỹ.
2. Ghi đóng góp bằng receipt đã xác minh.
3. Lập đề nghị chi có người duyệt.
4. Thực thi tiền qua provider khi đủ policy và licensing.
5. Đối soát và giải quyết dispute; không sửa lịch sử giao dịch đã chốt.

### Dữ liệu / quyền sở hữu

FamilyGroup, TreasuryPolicy, Contribution, SpendProposal, Approval, LedgerEntry; quyền gia đình không đồng nghĩa quyền xem mọi tài khoản.

### Lệnh và sự kiện tham chiếu

contribution.recorded → spend.proposed → approval.collected → settlement.reconciled.

### Test phải có

Thành viên rút consent. • Tiền nhận khác tiền khai. • Double spend. • Smart contract lỗi nhưng ledger ghi success.

### Ranh giới và điều kiện mở cổng

Không bảo đảm khoản vay an toàn hoặc hợp đồng thông minh tự làm hoạt động tài chính hợp pháp. Cần legal/financial review, custody model, licensed partner và anti-fraud; không chặn Grand Launch bằng toàn bộ lending.

### KPI và economics

Ledger reconciliation; dispute age; unauthorized fund movement; cost per group. Nguồn thu đề xuất D06: Subscription / transaction fee.


## AT-05 · Thanh toán và chia doanh thu đa đơn vị
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AT-05; D06 · Wave D, P2, R3; sockets S03, S04, S07, S11, S13

Multi-tenant Payment Gateway

**Kế hoạch D06:** Wave D; P2; risk R3; sockets S03, S04, S07, S11, S13.

### Mô tả gốc · D05

Cổng thanh toán, chia sẻ doanh thu tự động.

### Mục đích và bản đầu đề xuất

Một giao dịch merchant cần trace được payer, fee, settlement và refund mà không trộn tiền giữa các tenant. Provider-managed payment orchestration/connected accounts sau review; không tự xây ngân hàng hay custody.

### Luồng kỹ thuật đề xuất

1. Tạo payment intent từ order đã xác nhận.
2. Provider xử lý authentication/payment.
3. Webhook xác thực được ghi inbox bền vững.
4. Ledger phân loại gross, fees, net và khoản phải trả.
5. Settlement/refund đối soát với provider, xử lý pending thay vì cộng số dư sớm.

### Dữ liệu / quyền sở hữu

PaymentIntent, Charge, FeeAllocation, Settlement, Refund, LedgerTransaction; unique provider reference và tenant isolation.

### Lệnh và sự kiện tham chiếu

payment.initiated → provider.event.accepted → ledger.posted → settlement.reconciled.

### Test phải có

Webhook trùng/out-of-order. • Refund một phần. • Chargeback sau payout. • Sai currency hoặc tenant.

### Ranh giới và điều kiện mở cổng

AT-05 mở rộng post-R9 khác payment core tối thiểu R7. Cần ledger thật, provider contract và phân định trách nhiệm trước khi money movement. PSP, connected-account model, reserves, jurisdiction và accounting policy chưa tự được chốt bởi handbook.

### KPI và economics

Reconciliation completeness; duplicate posting=0; settlement age; failed refund; net margin. Nguồn thu đề xuất D06: Payment fee / SaaS.


## AT-06 · Két thừa kế và tài sản số
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AT-06; D06 · Wave D, P3, R4; sockets S02, S03, S07, S08, S13

Digital Inheritance Vault (Quantum-ready)

**Kế hoạch D06:** Wave D; P3; risk R4; sockets S02, S03, S07, S08, S13.

### Mô tả gốc · D05

Két di chúc và tài sản số kích hoạt khẩn cấp (Multisig) kháng lượng tử.

### Mục đích và bản đầu đề xuất

Lưu hướng dẫn/tài liệu và kế hoạch truy cập khi có biến cố mà không mở khóa tài sản bởi suy đoán AI. Encrypted document vault và chỉ dẫn liên hệ; release tài sản/di chúc là pilot có xác minh và người duyệt.

### Luồng kỹ thuật đề xuất

1. Chủ thể khai tài sản tham chiếu, beneficiary và quyền truy cập.
2. Mã hóa, quản lý khóa và diễn tập recovery.
3. Tín hiệu kích hoạt tạo case, không tự giải mã.
4. Xác minh điều kiện qua đa bên và quy trình pháp lý.
5. Chỉ giải phóng đúng scope; audit và thông báo an toàn.

### Dữ liệu / quyền sở hữu

VaultItem, BeneficiaryPolicy, KeyCustodyReference, TriggerCase, ReleaseApproval, RecoveryReceipt.

### Lệnh và sự kiện tham chiếu

vault.encrypted → trigger.reported → verification.completed → release.authorized.

### Test phải có

Báo tử giả. • Người thừa kế tranh chấp. • Mất khóa. • Policy cũ và quốc gia khác.

### Ranh giới và điều kiện mở cổng

Quantum-ready trong nguồn là mục tiêu nghiên cứu, không chứng nhận đã kháng lượng tử. Không tự diễn giải di chúc hay đổi ownership. Cần cryptographic design review, estate law, custody/beneficiary provider và retention dài hạn.

### KPI và economics

Recovery drill pass; unauthorized release=0; key rotation evidence; dispute handling. Nguồn thu đề xuất D06: Premium subscription.


## AT-07 · Lá chắn chống lừa đảo
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AT-07; D06 · Wave A, P0, R2; sockets S02, S05, S08, S09, S13

Scam Shield AI

**Kế hoạch D06:** Wave A; P0; risk R2; sockets S02, S05, S08, S09, S13.

### Mô tả gốc · D05

Quét tin nhắn/link với DB tội phạm mạng để chặn lừa đảo.

### Mục đích và bản đầu đề xuất

Đánh dấu dấu hiệu rủi ro trong tin nhắn/link và giúp xác minh độc lập trước khi người dùng chuyển tiền. User-submitted content + explainable warning; tích hợp inbox/call chỉ khi có quyền truy cập nền tảng và consent.

### Luồng kỹ thuật đề xuất

1. Nhận nội dung theo scope cho phép.
2. Chuẩn hóa URL/tin nhắn trong môi trường cách ly, không thực thi payload.
3. Kết hợp tín hiệu nguồn và model, ghi độ chắc chắn.
4. Đề xuất xác minh bằng kênh tin cậy, không tự gửi dữ liệu cho đối tượng nghi ngờ.
5. Nhận feedback và xử lý false positive với audit.

### Dữ liệu / quyền sở hữu

ScamSubmission, SafeUrlFeatures, ThreatSignal, RiskExplanation, VerificationAction; không công khai dữ liệu nạn nhân.

### Lệnh và sự kiện tham chiếu

content.submitted → risk.assessed → warning.presented → verification.prepared.

### Test phải có

Link mới chưa có blacklist. • Legit message bị cảnh báo. • Prompt injection. • Người dùng đang bị thúc ép chuyển tiền.

### Ranh giới và điều kiện mở cổng

Không hứa phát hiện 100%, không truy cập tất cả SMS/cuộc gọi nếu OS không cho phép; warning không thay điều tra hoặc partner security. Cần threat-feed rights, secure URL fetching architecture, data minimization và appeal policy.

### KPI và economics

Precision/recall theo test set; critical misses; false positives; useful verification rate. Nguồn thu đề xuất D06: Subscription / security premium.


## AT-08 · Trợ lý tích lũy và đầu tư nhỏ
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AT-08; D06 · Wave D, P3, R3; sockets S03, S04, S07, S13

Micro-Wealth Autonomous Agent

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S03, S04, S07, S13.

### Mô tả gốc · D05

Trích lập tiền lẻ để tự động đầu tư an toàn.

### Mục đích và bản đầu đề xuất

Giúp theo dõi mục tiêu tiết kiệm; việc đầu tư là dịch vụ rủi ro cao cần giới hạn độc lập. Mục tiêu/budget và mô phỏng; execution chỉ trong partner-regulated flow sau review.

### Luồng kỹ thuật đề xuất

1. Người dùng khai mục tiêu và hoàn cảnh theo phạm vi phù hợp.
2. Mô phỏng khoản tiết kiệm với giả định rõ.
3. Hiển thị phí, rủi ro và kịch bản lỗ.
4. Provider đủ điều kiện thực hiện suitability/approval và transaction.
5. Đối soát tài sản/tiền thật, cho phép dừng ủy quyền.

### Dữ liệu / quyền sở hữu

SavingsGoal, ContributionPlan, RiskDisclosure, ProviderMandate, InvestmentReceipt.

### Lệnh và sự kiện tham chiếu

goal.created → simulation.prepared → regulated.handoff → transaction.reconciled.

### Test phải có

Thị trường giảm. • Fee vượt khoản lẻ. • User revoke trước execution. • Quote outdated.

### Ranh giới và điều kiện mở cổng

Nguồn dùng từ đầu tư an toàn; handbook không xem đó là cam kết. Không hứa lợi nhuận, không tự giao dịch hoặc quản lý tài sản ngoài giấy phép. Cần legal/regulated partner, suitability, custody và risk controls; không thuộc launch core mặc định.

### KPI và economics

Cost drag; user comprehension; mandate violations=0; reconciliation; complaints. Nguồn thu đề xuất D06: Subscription / partner fee.


## AT-09 · Cầu nối tài sản số và tiền pháp định
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AT-09; D06 · Wave D, P3, R3; sockets S03, S04, S06, S07, S13, S14

Crypto-Fiat Autonomous Bridge

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S03, S04, S06, S07, S13, S14.

### Mô tả gốc · D05

Cầu nối tự động đổi Crypto sang Fiat để thanh toán tức thời, sinh báo cáo AML.

### Mục đích và bản đầu đề xuất

Handoff giao dịch hợp pháp qua đối tác có kiểm soát; không gắn VIO loyalty với tiền mã hóa hoặc cash-out. Research/policy, partner eligibility và quote comparison trước; chưa tự custody/exchange.

### Luồng kỹ thuật đề xuất

1. Xác định corridor, tài sản và provider được phép.
2. Kiểm tra eligibility/AML ở phạm vi partner.
3. Trình bày quote, spread, fees và finality risk.
4. Người dùng duyệt riêng và thực hiện tại partner.
5. Đối chiếu on-chain/provider/fiat status, giữ UNKNOWN khi chưa đủ xác nhận.

### Dữ liệu / quyền sở hữu

AssetPair, ExchangeQuote, ProviderEligibility, TransferReference, ChainConfirmation, FiatSettlement.

### Lệnh và sự kiện tham chiếu

exchange.quoted → partner.handoff.authorized → chain.observed → fiat.reconciled.

### Test phải có

Wrong chain/address. • Reorg/confirmation delay. • AML hold. • Fiat settled một phần.

### Ranh giới và điều kiện mở cổng

Không hỗ trợ né AML/sanctions; không hứa instant tuyệt đối; không nhận private keys hoặc seed phrase qua Viona. Cần crypto/fiat legal review, provider licenses, custody boundaries và chain-risk policy riêng.

### KPI và economics

Quote-to-settlement accuracy; unresolved transfer age; compliance holds; loss incidents. Nguồn thu đề xuất D06: Partner/transaction commission.


## AT-10 · Gọi vốn theo cột mốc
**Tập 3 • 14 · ACCOUNT**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · AT-10; D06 · Wave D, P3, R3; sockets S03, S07, S08, S11, S13

Smart Crowdfunding

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S03, S07, S08, S11, S13.

### Mô tả gốc · D05

Sàn gọi vốn cộng đồng giải ngân theo tiến độ (Milestone) bằng Smart Contract.

### Mục đích và bản đầu đề xuất

Cho người đóng góp thấy mục tiêu, điều kiện giải ngân và bằng chứng tiến độ thay vì chỉ tin chiến dịch. Campaign transparency/advisory; nhận tiền/escrow/smart contract chỉ sau kiểm định và pháp lý.

### Luồng kỹ thuật đề xuất

1. Chủ dự án cung cấp identity, mục tiêu và milestones đo được.
2. Reviewer kiểm thông tin và loại hình góp vốn.
3. Người đóng góp nhận disclosures và consent.
4. Milestone evidence được thẩm định độc lập trước release.
5. Đối soát giải ngân/refund/dispute theo hợp đồng, không tự sửa điều kiện.

### Dữ liệu / quyền sở hữu

Campaign, FundingType, Milestone, Contribution, Verification, ReleaseDecision, Dispute.

### Lệnh và sự kiện tham chiếu

campaign.reviewed → contribution.confirmed → milestone.evidence.submitted → release.authorized.

### Test phải có

Evidence giả. • Smart contract và điều khoản khác nhau. • Milestone chỉ hoàn thành một phần. • Refund thiếu tiền.

### Ranh giới và điều kiện mở cổng

Smart contract không thay review, trách nhiệm pháp lý hay bảo vệ nhà đầu tư. Không mở crowdfunding tài chính theo mặc định. Cần funding model, escrow/licensed partner, smart-contract audit nếu sử dụng và country policy.

### KPI và economics

Evidence quality; release disputes; funds reconciled; project completion; protection incidents. Nguồn thu đề xuất D06: Platform/transaction fee.


## SOS · 10 module
**Tập 3 • 15 · SOS**
**Phạm vi:** CATALOG NGUỒN / KẾ HOẠCH
**Nguồn:** D05 original catalog; D06 planning proposals; D03 successor

An toàn reachable và có trách nhiệm

### Ranh giới universe

SOS Core miễn phí. Lớp Plus trả phí không là điều kiện được cứu. Nguồn mô tả predictive survival mạnh; từng capability phải có evidence, partners và legal/safety boundary trước activation.

### Danh mục chính xác

| Mã | Tên gốc | Wave / P / Risk |
| --- | --- | --- |
| SO-01 | Lost Passport Emergency Flow | A / P0 / R2 |
| SO-02 | Emergency Legal Guard | D / P3 / R3 |
| SO-03 | Community Beacon Alert | B / P1 / R3 |
| SO-04 | Mental Health SOS & Cultural Navigator | D / P2 / R3 |
| SO-05 | Zero-Connection Safe Map | A / P0 / R1 |
| SO-06 | Predictive Biometric Over-watch | D / P3 / R4 |
| SO-07 | Mesh-Network Survival Mode | C / P3 / R4 |
| SO-08 | IoT Crash Detection | D / P2 / R3 |
| SO-09 | Deepfake & Voice Clone Detector | A / P0 / R2 |
| SO-10 | Coercion Silent Alarm | D / P3 / R3 |

### Cách đọc các hồ sơ tiếp theo

Mô tả gốc giữ nguyên D05. Wave/priority/risk/socket/revenue theo đề xuất D06, không là trạng thái đã live hay cấp phép. Trình tự, data entities, commands, tests, KPIs và release đề xuất do sách bổ sung để triển khai có kiểm soát.


## SO-01 · Hỗ trợ khi mất hộ chiếu
**Tập 3 • 15 · SOS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · SO-01; D06 · Wave A, P0, R2; sockets S03, S09, S12, S14, S15

Lost Passport Emergency Flow

**Kế hoạch D06:** Wave A; P0; risk R2; sockets S03, S09, S12, S14, S15.

### Mô tả gốc · D05

Tạo đơn trình báo mất giấy tờ tự gửi cảnh sát/Đại sứ quán.

### Mục đích và bản đầu đề xuất

Giúp người dùng bình tĩnh xác định việc cần làm, liên hệ đúng nơi và chuẩn bị hồ sơ bằng ngôn ngữ hiểu được. Offline checklist + thông tin cơ quan có nguồn; hồ sơ gửi ra chỉ sau xác nhận và kênh được duyệt.

### Luồng kỹ thuật đề xuất

1. Xác định nơi đang ở và mức an toàn mà không ép chia sẻ vị trí.
2. Mở checklist cùng số liên hệ đã cập nhật.
3. Chuẩn bị bản khai từ thông tin user xác nhận.
4. Người dùng/đối tác duyệt trước gửi, nếu không có API thì hỗ trợ thủ công.
5. Lưu receipt thật và nhắc bước tiếp theo.

### Dữ liệu / quyền sở hữu

LostDocumentCase, EmbassyContactVersion, FormDraft, SubmissionConsent, SubmissionReceipt.

### Lệnh và sự kiện tham chiếu

incident.declared → guidance.served → form.prepared → submission.authorized → receipt.recorded.

### Test phải có

Embassy contact cũ. • Không có mạng. • Passport scan bị lộ. • Form gửi nhưng thiếu receipt.

### Ranh giới và điều kiện mở cổng

SOS Core không bị paywall; không tự gửi cho cảnh sát/đại sứ quán từ dự đoán hoặc hứa đã được tiếp nhận. Cần country-specific contact/form maintenance và support escalation; không có quyền ngoại giao.

### KPI và economics

Guidance reachability; contact freshness; receipt accuracy; user task completion. Nguồn thu đề xuất D06: SOS Core trust / optional Plus ops.


## SO-02 · Kết nối trợ giúp pháp lý khẩn cấp
**Tập 3 • 15 · SOS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · SO-02; D06 · Wave D, P3, R3; sockets S02, S03, S09, S13, S14, S15

Emergency Legal Guard

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S02, S03, S09, S13, S14, S15.

### Mô tả gốc · D05

Ghi âm khẩn cấp, phát tín hiệu cho luật sư khi bị tạm giữ.

### Mục đích và bản đầu đề xuất

Hỗ trợ liên hệ luật sư/người tin cậy trong tình huống quan trọng, với quyền riêng tư và pháp luật địa phương. Guidance + contact/handoff có consent; recording/evidence truyền đi là phạm vi riêng cần review.

### Luồng kỹ thuật đề xuất

1. Xác định user có thể thao tác an toàn hay không.
2. Hiển thị lựa chọn liên hệ luật sư/đầu mối đã xác minh.
3. Chuẩn bị nội dung tối thiểu và xin authority phù hợp.
4. Gửi/call qua kênh được duyệt, không giả kết quả tiếp nhận.
5. Lưu bằng chứng được phép và hỗ trợ người thật tiếp quản.

### Dữ liệu / quyền sở hữu

LegalSupportCase, VerifiedContact, EvidenceConsent, ContactAttempt, HandoffReceipt.

### Lệnh và sự kiện tham chiếu

help.requested → safe.options.offered → contact.authorized → human.handoff.reconciled.

### Test phải có

Recording không hợp pháp theo bối cảnh. • Thiết bị bị người khác kiểm soát. • Liên hệ không nhận máy. • Gửi nhầm vị trí.

### Ranh giới và điều kiện mở cổng

Không tư vấn chiến thuật đối đầu, không giả luật sư, không bảo đảm giải cứu. Selected D chỉ mở scope có đối tác và policy rõ. Cần legal review từng thị trường, recording consent, retention và trusted-contact model.

### KPI và economics

Safe handoff; wrong-contact=0; evidence access audit; support response. Nguồn thu đề xuất D06: SOS Plus / partner service.


## SO-03 · Cảnh báo cộng đồng có kiểm soát
**Tập 3 • 15 · SOS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · SO-03; D06 · Wave B, P1, R3; sockets S02, S03, S09, S10, S15

Community Beacon Alert

**Kế hoạch D06:** Wave B; P1; risk R3; sockets S02, S03, S09, S10, S15.

### Mô tả gốc · D05

Phát tin báo mất tích (trẻ em/người già) bán kính hẹp.

### Mục đích và bản đầu đề xuất

Phối hợp tìm người mất tích hoặc người cần trợ giúp mà không tạo công cụ theo dõi, bôi nhọ hay doxxing. Case review + targeted alert với người chịu trách nhiệm; không phát đại trà nội dung chưa xác minh.

### Luồng kỹ thuật đề xuất

1. Tiếp nhận case và xác minh quan hệ/quyền báo tin.
2. Đánh giá nguy cơ lạm dụng và dữ liệu có thể chia sẻ.
3. Chọn geofence/audience tối thiểu với approval.
4. Phát cảnh báo có hạn sử dụng và kênh báo tin an toàn.
5. Cập nhật tìm thấy/thu hồi alert, bảo vệ lịch sử nhạy cảm.

### Dữ liệu / quyền sở hữu

BeaconCase, ReporterRelationship, SafetyReview, AlertAudience, SightingReport, Closure.

### Lệnh và sự kiện tham chiếu

case.submitted → safety.reviewed → alert.authorized → sightings.triaged → alert.closed.

### Test phải có

Người bạo hành tìm nạn nhân. • Ảnh trẻ em bị tái chia sẻ. • Tin giả. • Alert vẫn hiển thị sau khi đóng.

### Ranh giới và điều kiện mở cổng

Không coi community alert là police dispatch; không cho người dùng truy xuất vị trí cá nhân tùy ý. Cần safeguarding/minor policy, moderation trực, đối tác và handling khẩn cấp.

### KPI và economics

Time to review; verified sighting; abuse attempts blocked; closure propagation. Nguồn thu đề xuất D06: SOS Core/Plus trust.


## SO-04 · Hỗ trợ tinh thần và thích nghi văn hóa
**Tập 3 • 15 · SOS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · SO-04; D06 · Wave D, P2, R3; sockets S02, S05, S09, S14, S15

Mental Health SOS & Cultural Navigator

**Kế hoạch D06:** Wave D; P2; risk R3; sockets S02, S05, S09, S14, S15.

### Mô tả gốc · D05

Cố vấn tâm lý khẩn cấp và cảnh báo "luật bất thành văn".

### Mục đích và bản đầu đề xuất

Tạo điểm tựa ngôn ngữ, hỗ trợ định hướng nguồn trợ giúp, không thay chuyên gia khủng hoảng. Supportive conversation + reliable crisis-resource routing; giới hạn dữ liệu và công bố AI rõ.

### Luồng kỹ thuật đề xuất

1. Nghe nhu cầu không phán xét và hỏi điều cần thiết.
2. Nhận diện mức khẩn cấp theo policy đã được chuyên gia đánh giá.
3. Kết nối nguồn giúp đỡ/người tin cậy khi phù hợp.
4. Handoff tới người đủ năng lực thay vì kéo dài tương tác nguy hiểm.
5. Lưu tối thiểu, user kiểm soát retention và follow-up.

### Dữ liệu / quyền sở hữu

SupportSession, SafetyAssessmentReference, ResourceDirectory, HandoffConsent, FollowUpPreference.

### Lệnh và sự kiện tham chiếu

support.started → escalation.assessed → resource.offered → handoff.accepted.

### Test phải có

Khủng hoảng tức thời. • Model trả lời phán xét. • Nguồn hotline sai quốc gia. • Đề xuất văn hóa bị hiểu là luật.

### Ranh giới và điều kiện mở cổng

Không chẩn đoán/điều trị, không hứa bảo mật tuyệt đối trong mọi tình huống; cần escalation chuyên nghiệp và review người dễ tổn thương. Cần professional clinical/safety review, local crisis directory và availability thực.

### KPI và economics

Safe escalation; harmful-response rate; source accuracy; user-controlled follow-up. Nguồn thu đề xuất D06: SOS Plus / partner.


## SO-05 · Bản đồ an toàn khi mất mạng
**Tập 3 • 15 · SOS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · SO-05; D06 · Wave A, P0, R1; sockets S10, S14, S15, S16

Zero-Connection Safe Map

**Kế hoạch D06:** Wave A; P0; risk R1; sockets S10, S14, S15, S16.

### Mô tả gốc · D05

Bản đồ Offline trạm xá, đồn cảnh sát, nhà cộng đồng kiều bào.

### Mục đích và bản đầu đề xuất

Cho người dùng tiếp cận thông tin thiết yếu ngay cả khi mất kết nối, kèm thời điểm cập nhật để tránh tin cũ. Gói offline theo khu vực: cơ sở trợ giúp, địa chỉ, câu giao tiếp và hướng dẫn; không giả định luôn định vị được.

### Luồng kỹ thuật đề xuất

1. Người dùng chọn tải khu vực trước khi đi.
2. Gói dữ liệu được version/hash và kiểm tra nguồn.
3. Mở offline với nhãn dữ liệu lưu lúc nào.
4. Route/định hướng chỉ ở mức capability thiết bị hỗ trợ.
5. Khi có mạng, cập nhật an toàn và không xóa gói đang dùng trước khi bản mới hoàn chỉnh.

### Dữ liệu / quyền sở hữu

OfflineSafetyPack, ContactPoint, SourceVersion, RegionCoverage, PackIntegrity.

### Lệnh và sự kiện tham chiếu

pack.downloaded → integrity.verified → offline.guidance.opened → update.completed.

### Test phải có

Không GPS. • Cơ sở đóng cửa. • Gói tải thiếu. • Ngôn ngữ local thiếu glyph.

### Ranh giới và điều kiện mở cổng

Offline map không gửi SOS, không chứng minh nơi đó đang mở hay có người tiếp nhận; chức năng core an toàn luôn reachable. Cần map data license, update cadence, storage budget và emergency-resource ownership.

### KPI và economics

Offline open success; pack integrity; contact freshness; navigation fallback. Nguồn thu đề xuất D06: SOS Core trust.


## SO-06 · Tín hiệu sinh trắc học hỗ trợ an toàn
**Tập 3 • 15 · SOS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · SO-06; D06 · Wave D, P3, R4; sockets S02, S03, S06, S13, S15, S16

Predictive Biometric Over-watch

**Kế hoạch D06:** Wave D; P3; risk R4; sockets S02, S03, S06, S13, S15, S16.

### Mô tả gốc · D05

Dự báo đột quỵ/nhồi máu cơ tim qua smartwatch và tự gọi cấp cứu.

### Mục đích và bản đầu đề xuất

Nghiên cứu tín hiệu từ wearable để hỗ trợ người dùng tìm trợ giúp; không mặc nhiên chẩn đoán đột quỵ/nhồi máu. Research/advisory với thiết bị và population được đánh giá; không autonomously call emergency từ model chưa được thẩm định.

### Luồng kỹ thuật đề xuất

1. Xác định intended use và scope y tế trước thu dữ liệu.
2. Consent riêng cho wearable và độ tin cậy sensor.
3. Phân tích tín hiệu theo protocol được chuyên gia duyệt.
4. Nhắc kiểm tra hoặc handoff theo safety policy, không kết luận chắc bệnh.
5. Theo dõi adverse events và tắt route khi vượt ngưỡng.

### Dữ liệu / quyền sở hữu

WearableSignal, DeviceValidity, ClinicalProtocol, SafetyAlert, AdverseEvent; không dùng dữ liệu để marketing.

### Lệnh và sự kiện tham chiếu

signal.received → quality.checked → advisory.reviewed → safety.action.gated.

### Test phải có

Sensor nhiễu. • False negative khẩn cấp. • False alarm hàng loạt. • Mất pin/mất mạng.

### Ranh giới và điều kiện mở cổng

Nguồn nói dự báo bệnh và tự gọi cấp cứu; đây là tham vọng cần clinical/regulatory validation, không phải launch promise hoặc capability đã chứng minh. Cần intended-use/regulatory review, validated devices, clinical partners và emergency integration riêng.

### KPI và economics

Clinical validity trong scope; false alarms; missed events; response safety; sensor coverage. Nguồn thu đề xuất D06: SOS Plus / partner.


## SO-07 · Liên lạc cục bộ khi hạ tầng gián đoạn
**Tập 3 • 15 · SOS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · SO-07; D06 · Wave C, P3, R4; sockets S02, S09, S15, S16

Mesh-Network Survival Mode

**Kế hoạch D06:** Wave C; P3; risk R4; sockets S02, S09, S15, S16.

### Mô tả gốc · D05

Tạo mạng kết nối truyền tay (Bluetooth/Wifi Direct) khi sập mạng viễn thông.

### Mục đích và bản đầu đề xuất

Truyền thông điệp ngắn trong mạng thiết bị lân cận theo quyền cho phép, không hứa kết nối mọi nơi. Lab/pilot local relay có encryption, TTL và giới hạn pin; không thay dịch vụ khẩn cấp chính thức.

### Luồng kỹ thuật đề xuất

1. Người dùng bật chế độ phù hợp OS và consent.
2. Ghép discovery với rotating identifiers.
3. Mã hóa thông điệp, đặt TTL/hop budget.
4. Relay chỉ payload hợp lệ, không đọc nội dung trung gian.
5. Báo trạng thái delivered/relayed/unknown rõ và ngừng khi hết TTL.

### Dữ liệu / quyền sở hữu

MeshIdentity, EncryptedMessage, RelayEnvelope, TTL, DeliveryReceipt; tránh permanent device tracking.

### Lệnh và sự kiện tham chiếu

message.queued → relay.accepted → delivery.acknowledged hoặc ttl.expired.

### Test phải có

Không peer. • Replay flood. • Tracking device. • OS chặn background Bluetooth.

### Ranh giới và điều kiện mở cổng

Không hứa zero-connection tương đương internet; cần kiểm thử thiết bị thật, privacy và chống abuse trước mở rộng. Cần platform permission feasibility, cryptography review, mesh protocol và field test.

### KPI và economics

Delivery by density; battery impact; replay rejection; privacy failures. Nguồn thu đề xuất D06: SOS Plus / resilience.


## SO-08 · Phát hiện va chạm và hỗ trợ phản ứng
**Tập 3 • 15 · SOS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · SO-08; D06 · Wave D, P2, R3; sockets S03, S09, S15, S16

IoT Crash Detection

**Kế hoạch D06:** Wave D; P2; risk R3; sockets S03, S09, S15, S16.

### Mô tả gốc · D05

Tự kích hoạt SOS qua cảm biến va chạm gia tốc.

### Mục đích và bản đầu đề xuất

Kết hợp cảm biến/partner để gợi ý kiểm tra an toàn, không biến mọi rung mạnh thành cuộc gọi cấp cứu. Pilot với thiết bị được hỗ trợ, countdown/cancel dễ dùng và human-confirmed escalation.

### Luồng kỹ thuật đề xuất

1. Kiểm tra sensor/device readiness và consent.
2. Nhận signal có độ tin cậy/độ mới.
3. Đưa lời hỏi an toàn hoặc countdown đúng policy.
4. Nếu điều kiện đủ và có ủy quyền hợp lệ, liên hệ trusted contact/provider đã duyệt.
5. Đối soát outcome, false alarm và lưu tối thiểu.

### Dữ liệu / quyền sở hữu

CrashSignal, SensorProfile, EscalationPolicy, CancelWindow, ContactAttempt, SafetyOutcome.

### Lệnh và sự kiện tham chiếu

impact.detected → safety.check.requested → escalation.authorized → outcome.reconciled.

### Test phải có

Rơi điện thoại. • Tai nạn nhưng sensor không ghi. • User hủy mà lệnh đã dispatch. • Không có mạng.

### Ranh giới và điều kiện mở cổng

Không bảo đảm phát hiện mọi crash hoặc tự dispatch cứu hộ khi chưa có hợp đồng và country readiness. Cần sensor validation, legal/insurance review, emergency provider partnership và failover rõ.

### KPI và economics

False alarm; cancellation success; missed detection in validated scope; contact outcome. Nguồn thu đề xuất D06: SOS Plus / partner.


## SO-09 · Cảnh báo giả giọng và deepfake
**Tập 3 • 15 · SOS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · SO-09; D06 · Wave A, P0, R2; sockets S04, S05, S08, S09

Deepfake & Voice Clone Detector

**Kế hoạch D06:** Wave A; P0; risk R2; sockets S04, S05, S08, S09.

### Mô tả gốc · D05

Trình quét phổ âm thanh thời gian thực cảnh báo cuộc gọi lừa đảo mạo danh người thân.

### Mục đích và bản đầu đề xuất

Giúp người dùng nghi ngờ hợp lý và xác minh lại cuộc gọi, nhất là yêu cầu tiền khẩn cấp từ người quen. Risk signals trên nội dung được consent; không khẳng định xác thực danh tính chỉ bằng detector.

### Luồng kỹ thuật đề xuất

1. Nhận audio theo quyền OS/provider và công bố xử lý.
2. Kiểm chất lượng, ngôn ngữ và phạm vi model.
3. Kết hợp tín hiệu lừa đảo và detector để đưa cảnh báo có mức chắc chắn.
4. Đề xuất gọi lại qua số đã lưu hoặc kênh độc lập.
5. Ghi feedback, theo dõi drift và false positives.

### Dữ liệu / quyền sở hữu

AudioConsent, DetectionScope, SpoofRisk, VerificationPlan, ModelVersion; retention audio tối thiểu.

### Lệnh và sự kiện tham chiếu

audio.assessed → risk.explained → independent.verification.prepared.

### Test phải có

Giọng thật nhưng audio nén. • Deepfake mới ngoài training. • Người dùng nhầm warning thành proof. • Lộ audio nhạy cảm.

### Ranh giới và điều kiện mở cổng

Không nhận diện tên người thật từ giọng như bảo đảm; không hứa phát hiện 100%. Signature trust có thể mở ở mức advisory trước frontier. Cần benchmark adversarial, privacy rights, OS feasibility và legal review audio.

### KPI và economics

False positive/negative theo quality/language; verified intervention; latency/cost. Nguồn thu đề xuất D06: Subscription / SOS Plus / security premium.


## SO-10 · Yêu cầu trợ giúp kín đáo
**Tập 3 • 15 · SOS**
**Phạm vi:** HỒ SƠ MODULE · NGUỒN + THAM CHIẾU
**Nguồn:** D05 · SO-10; D06 · Wave D, P3, R3; sockets S02, S03, S09, S10, S13, S15

Coercion Silent Alarm

**Kế hoạch D06:** Wave D; P3; risk R3; sockets S02, S03, S09, S10, S13, S15.

### Mô tả gốc · D05

Kích hoạt cảnh báo ngầm (ghi âm, gửi tọa độ) thông qua cử chỉ vuốt nghịch lý hoặc mật mã giọng nói ẩn khi người dùng bị khống chế.

### Mục đích và bản đầu đề xuất

Tạo lựa chọn tìm trợ giúp trong tình huống bị ép buộc mà không làm tăng rủi ro do thông báo hay thao tác sai. Chuyên gia safety thiết kế, user-configured pilot; ưu tiên trusted-contact flow và diễn tập trước.

### Luồng kỹ thuật đề xuất

1. Người dùng cấu hình phương thức kích hoạt và người nhận ở thời điểm an toàn.
2. Kiểm tra quyền và khả năng thiết bị mà không tạo dấu vết dễ gây nguy hiểm.
3. Khi trigger, xác thực theo policy hạn chế false activation.
4. Chỉ gửi dữ liệu đã cho phép qua kênh an toàn, không hứa cứu hộ.
5. Đối soát/thu hồi hoặc support theo quy trình bảo vệ nạn nhân.

### Dữ liệu / quyền sở hữu

DuressPreference, SafeContact, TriggerPolicy, MinimalAlert, DeliveryState; dữ liệu và logs cần threat model riêng.

### Lệnh và sự kiện tham chiếu

duress.triggered → policy.checked → bounded.alert.dispatched → delivery.reconciled.

### Test phải có

Người bạo hành xem lịch sử. • Kích hoạt nhầm. • Contact đổi số. • OS không cho chạy nền.

### Ranh giới và điều kiện mở cổng

Không triển khai hidden surveillance hoặc ghi âm trái phép. Không công khai chi tiết vận hành có thể làm nạn nhân nguy hiểm; high-trust pilot phải có chuyên gia. Cần safeguarding/threat model, jurisdiction review và kiểm thử kín với chuyên gia trước deployment.

### KPI và economics

Safe usability; false activation; reliable handoff; privacy exposure; adverse events. Nguồn thu đề xuất D06: SOS Plus.


## Macro-Delegation: nhanh hơn nhưng không vượt quyền
**Tập 4 • 16 · SWARM**
**Phạm vi:** NGUỒN / ĐÃ CHỐT
**Nguồn:** D07; D04; macro handoff source

Tự chủ kết thúc tại ranh giới rủi ro, không phải tại từng dòng code.

### Vai trò

| Vai trò | Nhiệm vụ | Không tự làm |
| --- | --- | --- |
| Operator/Founder | Intent, ngân sách/rủi ro, adoption, irreversible approval, launch. | Không biến summary thành evidence. |
| A0 Governor/Architect | DAG, contracts, routing, conflict resolution, integration plan. | Không tự cấp quyền provider/money/merge. |
| Builder Bx | Code/tests/docs trong write set được cấp. | Không tự mở remote/production ngoài envelope. |
| Verifier Vx | Adversarial review trên exact artifact/contract. | Không chỉ rubber-stamp hoặc sửa rồi tự review cùng evidence. |
| Integrator I0 | Hợp nhất các cell đủ gate và regression. | Không redesign hoặc widen scope âm thầm. |

### Công cụ là lựa chọn theo task

ChatGPT, Codex, Cursor và model khác có thể đóng vai trò phù hợp khi được review. Không hard-code A0 luôn một model hay Builder luôn một app; independence phải do process/evidence/roles, không chỉ tên vendor.

### Local autonomy

Một macro envelope có thể cho phép audit→implement→tests→bounded fixes→docs→candidate trong cùng scope. Push/PR/merge/deploy/DB/provider/payments vẫn ở hard gate được cấp riêng.


## Wave 0 và R3_SWARM_MASTER_MANIFEST_V1
**Tập 4 • 16 · SWARM**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D07 Wave0; D04 manifest blocks; Operator template direction

Khởi tạo quy hoạch trước nhiều agent; Wave 0 không tự là implementation authority.

### Khởi tạo

1. Fresh baseline và nguồn controlling; phân loại known/unknown/blocked.
2. Inventory Home/shell/design/source assets thực, activation matrix và reuse candidates.
3. Tạo DAG cells, ownership paths, shared contracts và sequencing.
4. Map risk→model tier, deterministic facts→machine validators.
5. Viết Builder/Verifier prompts cùng contract ID/hash, budget/remediation/stop law.
6. Kiểm overlap write sets, dependencies và output paths; chỉ mở builders sau entry gate và authority thích hợp.

### Các block bắt buộc

```text
BASELINE_AND_SOURCE_REGISTER
CELL_DAG_AND_WRITE_OWNERSHIP
MODEL_ROUTING_AUDIT
MACHINE_PROOF_CONTROL
AUTHORITY_AND_COST_BOUNDARIES
ARTIFACT_TRANSPORT_POLICY
TEST_AND_EVIDENCE_PLAN
FOUR_HEALTH_GROUPS
STOP_AND_ESCALATION_RULES
```

### Không có launch qua tên manifest

R3 manifest chỉ được init theo đúng lane; entry gate chưa GREEN thì implementation không mở. File tồn tại, parsed JSON PASS hoặc task count nhiều không chứng minh chương trình Swarm đã an toàn.


## Một cell contract có thể giao khoán
**Tập 4 • 16 · SWARM**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D07; template tham chiếu

Cùng một hợp đồng điều khiển Builder, Verifier và Integration.

### Schema cell minh họa

```text
cellId / contractVersion / contractSha256
objective / inScope / outOfScope
baseCommit / baseTree / sourceRefs
readSet / writeSet / dependencies
riskTier / modelRouting / budget
allowedEffects / authorityRefs
acceptanceCriteria / negativeTests
outputArtifacts / evidenceSchema
maxRemediationRounds / stopConditions
```

### Đóng hợp đồng

1. Mục tiêu phải là outcome, không “làm UI đẹp” hoặc “fix tất cả”.
2. Write set chính xác đủ làm việc nhưng không phạm domain khác.
3. Mỗi acceptance criterion có oracle/test và evidence owner.
4. Nếu cần đổi schema/provider/authority ngoài scope, STOP và đề xuất delta có lý do.
5. Khi bàn giao, include exact diff/tree, results, limitations và không diễn giải tests chưa chạy thành PASS.

### Tính độc lập

Verifier nhận nguồn contract, exact candidate và test artifacts; có quyền bác bỏ. Có thể kiểm lại tests độc lập khi lane cho phép. Self-review Builder hữu ích nhưng không thay independent review.

### Không nhầm mã phân loại

REC2-R1/R2 là phase; R1–R4 trong D06 là risk planning; TIER_F/S/X/M là model/tool routing. Không dùng cùng một chữ R để suy authority.


## Dual prompting: hai nhiệm vụ đối kháng
**Tập 4 • 16 · SWARM**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D07; template tham chiếu

Builder cố đạt acceptance; Verifier cố tìm counterexample có evidence.

### Prompt A · Builder

```text
Read exact contract and controlling sources.
Verify baseline and allowed write set.
Implement only scoped behavior.
Run allowed tests; preserve failed evidence.
Do not infer new authority or fake runtime PASS.
Return exact candidate + evidence + limitations.
STOP at publication/effect boundary.
```

### Prompt B · Verifier

```text
Read exact same contract and exact candidate.
Try to disprove each acceptance criterion.
Test negative paths, scope drift and false claims.
Distinguish source presence from runtime proof.
Do not mutate candidate during independent review.
Return finding, evidence, severity and narrow remedy.
No inferred build/merge/deploy authority.
```

### Khi phát hiện lỗi

Một finding cần file/function/field hoặc reproducible case, expectation từ controlling contract, actual behavior và consequence. Không yêu cầu redesign không liên quan hoặc tuyên bố “chỉ còn một lỗi cuối” không có cơ sở.

### Một nguồn tiêu chí

Verifier không tự thay product intent sau khi Builder làm xong. Nếu tiêu chí controlling thực sự mơ hồ, cần architecture clarification/adoption như case access matrix; không để hai agent tự chọn semantics khác nhau.


## One-writer, integration và scope compression
**Tập 4 • 16 · SWARM**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D07 governance compression; reference workflow

Giảm vòng phê duyệt cơ học mà không nới consequential authority.

### One-writer law

Hai active builder không ghi cùng file/resource scope. Nếu giao nhau: serialize, tách interface hoặc hợp cell. Git merge không đủ giải quyết semantic conflict trong cùng contract/feature flag.

### Integration

1. Freeze từng candidate đủ review, không lấy working tree chưa định danh.
2. Kiểm dependency versions, read/write overlaps và changed contracts.
3. Apply dưới integration scope; chạy shared regression và tests liên thông.
4. Nếu merge giải quyết conflict cần code mới, code đó phải review/validate; không thừa hưởng GREEN từ hai nhánh cũ.
5. Tạo candidate tổng hợp và STOP trước protected publication.

### Compression hợp lệ

Audit, nhiều local edits, formatting, tests, docs và bounded fixes có thể cùng lane nếu cùng effect class, cùng risk boundary và authority đủ. Không cần approval mỗi hunk khi macro scope rõ.

### Compression không hợp lệ

Không gộp source review→build→deploy→charge user thành một vòng chỉ vì “đã chọn blueprint”. Không bỏ self-stop trên unknown provider, privilege/context mismatch hoặc unapproved write.


## Model routing audit và bốn nhóm Health
**Tập 4 • 16 · SWARM**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D04 §§7–8; D07 model routing

Đo máy làm gì, AI được dùng ở đâu và boundary nào vẫn chưa đóng.

### Bốn Health

| Nhóm | Thông tin cần báo |
| --- | --- |
| Authority Health | Bypass/reuse/hash mismatch, unauthorized effect, approval scope. |
| Model Economics | Actual model/tier, calls nếu biết, AI/provider cost, unnecessary escalation, allocation. |
| Machine-Proof Health | Deterministic claims, verified/unproven, hash/parity, tests and evidence scope. |
| Swarm Execution | Active writers, overlaps, scope drift, remediation rounds, unauthorized remote mutations. |

### Không tự bịa số

Nếu platform không cho model identifier/call count, ghi UNKNOWN hoặc PLATFORM_FIXED_SESSION_NOT_MAPPED. Không ghi TIER_X_CALL_COUNT=0 chỉ vì chưa map được tier. TIER_M là công cụ kiểm, không một model suy luận.

### Review economics

1. Tác vụ máy giải được có dùng model mạnh vô ích không?
2. Token/context có vượt budget vì lặp lại toàn history không?
3. Blocker cần human architecture decision hay chỉ formatter fix?
4. Có thể dùng bounded macro remediation với regression thay nhiều packet nhỏ không?
5. Chỉ escalates khi risk/ambiguity cần, không để escalation mở authority.

### GREEN có phạm vi

Một Health xanh không kéo ba nhóm khác xanh. Nội dung artifact có thể reviewed GREEN nhưng procedural deviation vẫn cần disposition riêng; runtime vẫn NOT_RUN.


## Exact artifacts: tạo, chuyển và review
**Tập 4 • 16 · SWARM**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D07 machine-proof law; E01–E02; reference runbook

Tệp đúng bytes mới là đối tượng review; summary hay screenshot không thay canonical artifact.

### Transport law

EXACT FILE → SHA256 + bytes → ATTACH / TRANSFER → REVIEW EXACT BYTES → SCOPE CLASSIFICATION

### Tạo artifact tin cậy

1. Xác minh output path/scope; nếu one-shot CreateNew thì tồn tại phải STOP.
2. Hoàn thiện object và validate canonical bytes trong memory trước ghi.
3. Persist bằng cơ chế được lane cho phép; no-rewrite task thì không trim LF lần hai.
4. Readback từ stored bytes, tính length/SHA; ZIP thì đọc entry từ ZIP đối chiếu manifest.
5. Transfer exact file; reviewer tính lại identity trước semantic review.
6. Giữ predecessor và failure evidence; replacement phải successor có provenance, không dựng lại summary như exact original.

### Canonical JSON

UTF-8/no BOM/NFC/key ordering/compact/no terminal newline/duplicate keys là profile cụ thể. Escaping, numbers, sorting và schema cần exact serializer profile; semantic equality không đảm bảo byte equality. Không dùng alphabetical locale sort thay unsigned UTF-8 ordering nếu contract yêu cầu.

### Hash không xác thực tác giả

SHA256 khớp chứng minh bytes tương ứng digest, không chứng minh ai phê duyệt hoặc authority còn hiệu lực. Review identity và authorization provenance là kiểm riêng.


## Khi artifact đúng nhưng quy trình sai
**Tập 4 • 16 · SWARM**
**Phạm vi:** BÀI HỌC LỊCH SỬ
**Nguồn:** E01–E02; Operator review-only và semantic-adoption decisions

Giữ nội dung, provenance, quy trình và authority thành các verdict riêng.

### Bốn câu hỏi

| Câu hỏi | Bằng chứng |
| --- | --- |
| Bytes cuối đúng không? | Hash/length/canonical readback. |
| Nội dung đúng không? | Independent content review với controlling sources. |
| Quy trình có tuân thủ không? | Command log/write scope/remediation limits, phần chưa chứng minh. |
| Đã được dùng/adopt/execute chưa? | Operator disposition đúng phạm vi và durable integration khi được phép. |

### Bài học thực tế

Một formatter từng làm rỗng candidate rồi được biên soạn lại; reconciliation packet từng bị rewrite để bỏ LF. User chấp nhận hai bản cuối làm review inputs với deviations giữ nguyên, rồi chấp thuận semantic adoption riêng. Không có retroactive procedural GREEN.

### Xử lý

1. STOP khi phát hiện vi phạm; không tiếp tục sửa để làm báo cáo đẹp.
2. Hash file hiện còn, ghi affected paths và điều biết/chưa biết.
3. Review final bytes nếu được Operator cho phép; giữ incident history.
4. Nếu content được chấp nhận, adoption/authority vẫn tách riêng.
5. Sửa quy trình tạo artifact để lỗi không lặp, không tạo vô hạn packet giải trình lồng nhau.

### Không tự viết lại quá khứ

Thiếu log/timestamp/backup thì ghi unproven. Không tạo receipt giả hoặc gọi recreated draft là byte-identical restoration.


## RB-01 · Tiếp nhận một task mới
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Khi Founder hoặc A0 giao một objective cho Builder.

### Người chịu trách nhiệm

A0 định nghĩa scope; Builder xác minh preconditions; Operator giữ quyền consequential.

### Trình tự xử lý

1. Đọc exact source register và task, phân biệt instruction với data.
2. Fresh-read canonical root/top-level/branch/HEAD/status theo lane.
3. Kiểm output targets, authority state và relevant predecessors.
4. Viết acceptance/negative tests và allowed write/effect sets.
5. Bắt đầu chỉ việc được cấp; khác baseline thì STOP và report.

### Evidence tối thiểu

Task/contract identity, current baseline, write set, source hashes, unknowns và allowed actions.

### Không được làm

Không tự reset/stash/checkout để làm baseline khớp; không dùng memory làm nguồn current state.

### Điều kiện đóng / mở lại

Preconditions và authority scope khớp; Builder/Verifier cùng contract. Chưa có authority thì chỉ preparation/read allowed.


## RB-02 · Khôi phục sau gián đoạn model/session
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Task bị ngắt vì limit, crash hoặc mất phiên, không rõ cuối cùng đã ghi gì.

### Người chịu trách nhiệm

Builder continuation, reviewer kiểm exact resume boundary.

### Trình tự xử lý

1. Không restart hoặc regenerate theo mặc định.
2. Readback current files/ZIP/manifest và mutation logs còn có.
3. So state với last known evidence; tách known/unknown.
4. Revalidate static checks không effect nếu lane cho phép.
5. Nếu đã có final valid artifact thì transfer, không package lại chỉ để đổi tên.
6. Nếu có partial/vi phạm thì STOP theo cleanup/retry policy.

### Evidence tối thiểu

Exact current file identities, partial outputs, command counts nếu có, authority consumption state.

### Không được làm

Không dán lại prompt để renew authority; không suy request chưa gửi chỉ vì không thấy output.

### Điều kiện đóng / mở lại

Chỉ tiếp tục phần còn được scope cũ/new explicit continuation cho phép; ambiguous effect cần read-only reconciliation.


## RB-03 · Review một ZIP/JSON đã nhận
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Builder gửi artifact ready-for-independent-review.

### Người chịu trách nhiệm

Independent Verifier; mặc định không mutate.

### Trình tự xử lý

1. Mở đúng file được transfer, kiểm existence và bytes/hash.
2. ZIP kiểm duplicate/unsafe paths/unexpected entries và từng stored entry.
3. Parse JSON reject duplicate key, validate exact canonical profile.
4. Đọc code/contract semantic, negative paths và claims provenance.
5. Phân biệt raw input hashes với live host facts.
6. Return verdict theo layer: identity/content/procedural/runtime/authority.

### Evidence tối thiểu

Hash/length, entry manifest, checks đã chạy, findings cụ thể và test/line/field support.

### Không được làm

Không review summary như artifact; không build/run effecting code chỉ để kiểm nhanh.

### Điều kiện đóng / mở lại

Nội dung coherent không tự mở execution. Nếu thiếu source decisive thì request exact artifact, không reconstruct.


## RB-04 · Cuộc gọi rớt khi đang đặt lịch
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Call timeout hoặc mất kết nối sau possible external dispatch.

### Người chịu trách nhiệm

Voice runtime + reconciliation worker; human support nếu quá deadline.

### Trình tự xử lý

1. Đóng generation/actions mới; giữ authority consumed.
2. Thực hiện bounded termination theo provider call ID.
3. Đặt provider outcome unknown nếu chưa có xác nhận.
4. Khóa overlapping reattempt cùng intent/target và giữ cost reserve.
5. Read status/events/booking references theo policy.
6. Chỉ thông báo confirmed/failed khi evidence đủ; còn ambiguous chuyển support.

### Evidence tối thiểu

Authority/attempt/call IDs, dispatch/timeout times, termination request, provider receipts, booking/cost states.

### Không được làm

Không release reserve dựa local timeout; không tự gọi lại cùng UUID hoặc đổi provider để tránh chờ.

### Điều kiện đóng / mở lại

Có coherent provider+domain+cost disposition; new call cần policy/authority mới, không xóa attempt trước.


## RB-05 · Phát hiện cam kết sai
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

AI nói đã đặt, báo giá hoặc hứa dịch vụ không có source/authority hợp lệ.

### Người chịu trách nhiệm

Voice safety owner + merchant/support; incident commander nếu widespread.

### Trình tự xử lý

1. Đánh dấu potential critical commitment violation, freeze route liên quan.
2. Bảo tồn minimal transcript/tool/source evidence theo privacy policy.
3. Đối chiếu quote/version/authority/booking receipt.
4. Thông báo user/merchant chính xác và xử lý sửa hậu quả dưới quyền riêng.
5. Root-cause: retrieval, guard, policy, concurrency hay prompt injection.
6. Thêm regression và independent review trước mở lại.

### Evidence tối thiểu

Exact spoken commitment, factual source, model/policy version, authorization and receipt mismatch.

### Không được làm

Không sửa transcript/history để che sai; không tiếp tục autonomy vì tỷ lệ tổng còn dưới threshold.

### Điều kiện đóng / mở lại

Zero-tolerance incident reconciled; guard tests pass; operator authorizes reenable scope.


## RB-06 · Hai khách tranh cùng một slot
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Concurrent confirm hoặc stale availability dẫn tới conflict.

### Người chịu trách nhiệm

Booking domain owner.

### Trình tự xử lý

1. Giữ transaction/capacity constraint làm truth.
2. Xác định booking nào committed và hold nào expired.
3. Trả offer_changed/conflict cho bên chưa được xác nhận.
4. Tìm alternative slot nhưng chỉ prepare, không tự giảm giá hay đặt.
5. Đối chiếu notification/outbox để không có hai thông báo confirmed.
6. Replay test cùng race và review.

### Evidence tối thiểu

Booking/hold/quote IDs, versions, capacity allocation, transaction results và notifications.

### Không được làm

Không xóa booking đã valid để làm test pass; không tin UI cache hoặc order of message arrival.

### Điều kiện đóng / mở lại

Một truth duy nhất, users biết outcome, recurring race fix được kiểm chứng.


## RB-07 · Webhook giả, trùng hoặc sai thứ tự
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Provider callback có signature lỗi, duplicate event hoặc backward transition.

### Người chịu trách nhiệm

Provider gateway + security/operations.

### Trình tự xử lý

1. Verify signature bằng exact provider semantics trước enqueue.
2. Invalid signature không được update state.
3. Valid event ghi inbox và dedup; giữ event reference.
4. So aggregate/provider version, không blindly overwrite state.
5. Khi conflict đọc authoritative provider status nếu cho phép.
6. Alert replay/auth anomalies và rotate secret theo authority nếu compromise.

### Evidence tối thiểu

Raw-body digest/metadata tối thiểu, signature verification outcome, event IDs và state transition decisions.

### Không được làm

Không log auth token hoặc toàn PII; không dùng default retry để gửi lại money/call.

### Điều kiện đóng / mở lại

No duplicate effect, coherent state, attack/misconfiguration xử lý. Twilio/Stripe signature semantics cần adapter-specific tests. [W02,W03]


## RB-08 · Chi phí vượt dự kiến hoặc cap
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Usage projected vượt reservation hoặc actual charge ngoài policy.

### Người chịu trách nhiệm

Cost governor + provider ops + finance owner.

### Trình tự xử lý

1. Không tạo action mới và degrade route theo severity.
2. Enforce duration/concurrency termination trong scope.
3. Giữ reserve/exposure nếu provider chưa final.
4. Đối chiếu tariff/rounding/transfer legs/FX và late charges.
5. Xác định có cap breach thật hay sai accounting.
6. Điều chỉnh policy qua review, bồi hoàn/charge correction theo quyền riêng.

### Evidence tối thiểu

Rate versions, estimate, reserve, usage events, actual invoice/provider records và actor.

### Không được làm

Không tự trừ thêm tiền user để bù; không ghi rate cũ lên usage mới; không cam kết zero-loss tuyệt đối.

### Điều kiện đóng / mở lại

Exposure reconciled, funding/price/quota corrected, tests watchdog và clear operator disposition.


## RB-09 · Có dấu hiệu lộ dữ liệu tenant
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Response/retrieval/log chứa dữ liệu ngoài subject/tenant được phép.

### Người chịu trách nhiệm

Security/privacy incident lead + domain owner.

### Trình tự xử lý

1. Disable affected retrieval/tool route theo incident policy.
2. Giữ evidence tối thiểu và restrict access.
3. Xác định impacted identities/data/caches/provider exposure.
4. Revoke/rotate credentials hoặc invalidate indexes dưới authority phù hợp.
5. Fix access predicates và regression đa tenant.
6. Professional privacy/legal review quyết định notification/response obligations.

### Evidence tối thiểu

Correlation, resource IDs, access decisions, affected scope, source/code version, containment steps.

### Không được làm

Không lan truyền payload nhạy cảm trong chat điều tra; không tự khẳng định không ảnh hưởng ai khi thiếu logs.

### Điều kiện đóng / mở lại

Containment verified, impact đánh giá, isolation regression GREEN, independent approval trước reopen.


## RB-10 · Nguồn thông tin mâu thuẫn
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Calendar, email, provider API hoặc tài liệu đưa critical fact khác nhau.

### Người chịu trách nhiệm

Domain source owner + Viona orchestrator.

### Trình tự xử lý

1. Không chọn fact bằng model confidence đơn thuần.
2. Giữ source/version/time và phân loại authoritative vs user-declared.
3. Kiểm freshness và known eventual-consistency window.
4. Readback hoặc hỏi xác nhận user/merchant.
5. Invalidate draft/authority nếu critical payload phải đổi.
6. Record conflict disposition và update memory có provenance.

### Evidence tối thiểu

Both source refs, fact differences, resolution rule, confirmation and downstream invalidations.

### Không được làm

Không im lặng overwrite memory hoặc gửi booking theo một giờ chưa xác định.

### Điều kiện đóng / mở lại

Critical fact xác nhận; affected drafts re-reviewed; không có stale commitment.


## RB-11 · Handoff người thật
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Authority limit, safety trigger, low confidence hoặc provider outage đòi người tiếp quản.

### Người chịu trách nhiệm

Human support/merchant đã có availability thật.

### Trình tự xử lý

1. Kiểm người nhận và giờ support; nếu không có thì báo rõ không có agent sẵn.
2. Chuẩn bị summary tối thiểu: intent, verified facts, pending/unknown states, forbidden actions.
3. Xin consent chia sẻ và chuyển kênh trong cost cap.
4. Xác nhận người thật nhận; không coi dialed là accepted handoff.
5. Theo dõi outcome và cost các call legs.
6. Nếu handoff fail, giữ safe state và hướng dẫn lựa chọn còn khả dụng.

### Evidence tối thiểu

Handoff target, consent, summary refs, transfer/call IDs, accepted timestamp và limits.

### Không được làm

Không handoff tới một số chưa verified hoặc tự mở ngân sách transfer vô hạn.

### Điều kiện đóng / mở lại

Người nhận có trách nhiệm rõ; user hiểu ai đang xử lý; pending case không bị bỏ quên.


## RB-12 · Xử lý yêu cầu xóa/export
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Người dùng thực hiện privacy request.

### Người chịu trách nhiệm

Privacy operations + data domain owners.

### Trình tự xử lý

1. Xác minh scope/identity bằng cách tối thiểu.
2. Inventory source/derived/provider/backup copies và holds.
3. Prepare execution plan với authority phù hợp.
4. Export qua kênh an toàn hoặc xóa/anonymize theo policy.
5. Readback index/cache/provider receipts.
6. Report kết quả và phần còn pending/retained với lý do được review.

### Evidence tối thiểu

Request ID, verification, data-map version, execution receipts, unresolved systems, final response.

### Không được làm

Không cho support tải mọi transcript ra máy cá nhân; không xóa financial/audit records trái retention policy.

### Điều kiện đóng / mở lại

Complete theo exact scope hoặc minh bạch giới hạn; deadline theo policy pháp lý thị trường đã duyệt.


## RB-13 · Provider lỗi hàng loạt
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Failure/unknown/error spikes theo route hoặc country-language.

### Người chịu trách nhiệm

Provider ops/on-call; finance theo exposure.

### Trình tự xử lý

1. Tính metric đúng cửa sổ/mẫu số và kiểm alert integrity.
2. Degrade hoặc disable affected route; severe invariant có thể jump thẳng disabled.
3. Dừng new dispatch, reconcile in-flight và giữ reserves cần thiết.
4. Kiểm auth/quota/rate limits/network/provider status.
5. Chuẩn bị failover chỉ khi target/cost/data policy còn phù hợp.
6. Recovery review và operator reenable, không model auto-recover.

### Evidence tối thiểu

Failure/unknown counts, affected cohort, provider account/adapter version, incident timeline.

### Không được làm

Không retry mass gọi lại khách; không đổi provider lén; không dùng old successful metrics xóa incident mới.

### Điều kiện đóng / mở lại

Root cause xử lý, in-flight reconciled, canary passes, policy/cost/legal fit cho route mở lại.


## RB-14 · Rollback một release
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Canary hoặc production release vi phạm reliability/safety/cost gate.

### Người chịu trách nhiệm

Release commander + domain/on-call.

### Trình tự xử lý

1. Disable new effect path/feature flag thích hợp.
2. Identify exact release/image/config and affected intents.
3. Rollback binary/config theo reviewed plan; DB compatibility kiểm riêng.
4. Reconcile actions đã dispatch, payment/booking data không rollback giả.
5. Verify restored service cùng tenant/privacy/budget controls.
6. Đóng incident với user/merchant communication và regression.

### Evidence tối thiểu

Before/after release IDs, flags, in-flight cases, migration state, rollback authority và smoke outcomes.

### Không được làm

Không xóa evidence hoặc chạy migration revert không được review; không auto redeploy nhiều lần.

### Điều kiện đóng / mở lại

Recovery target proven; unresolved external effects có owner; independent reenable/next-release gate.


## RB-15 · Onboard merchant mới
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Một doanh nghiệp muốn dùng Business/Answer For Me.

### Người chịu trách nhiệm

Market ops + merchant owner + provider ops.

### Trình tự xử lý

1. Xác minh doanh nghiệp, người có quyền cấu hình và service area.
2. Import catalog/staff/price/calendar; owner duyệt version.
3. Kết nối số provider/SIP/forwarding và test inbound trong scope.
4. Chốt standing policy, per-call limits, privacy/disclosure, human fallback.
5. Dry-run adversarial booking/price/unknown cases.
6. Pilot quota nhỏ, review outcomes/cost rồi activation đúng category/city.

### Evidence tối thiểu

Verification scope, approved catalog/policy, telephony readiness, test calls, owner consent, billing plan.

### Không được làm

Không fake verified merchant hoặc import calendar production dùng credential thử; không hứa nhận mọi cuộc gọi SIM.

### Điều kiện đóng / mở lại

Merchant hiểu limits, nhận summaries thật, support và cost caps hoạt động.


## RB-16 · Mở một thị trường hoặc ngôn ngữ
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Muốn rollout country/city/category mới.

### Người chịu trách nhiệm

Country owner + product/safety/legal/finance/provider team.

### Trình tự xử lý

1. Chuẩn bị coverage cell và source register.
2. Chốt provider/legal/disclosure/billing/safety resources theo country.
3. Tuyển supply và human support đủ ngôn ngữ.
4. Test critical fact translation với native reviewers.
5. Pilot với strata metrics riêng và kill switch.
6. Operator activation từng ô; quảng cáo chỉ đúng scope đã mở.

### Evidence tối thiểu

Market pack version, provider/country agreements, supply counts có nguồn, metrics theo language, rollback.

### Không được làm

Không coi app accessible là service live toàn quốc; không dùng legal review nước A cho nước B.

### Điều kiện đóng / mở lại

Safety/truth/money/cost/support evidence đạt, launch claims được đối chiếu với registry.


## RB-17 · Nạp module mới vào pilot
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

Một trong 63 module vượt design gate và xin integration.

### Người chịu trách nhiệm

A0 + domain owner + independent verifier.

### Trình tự xử lý

1. Confirm module ID/scope và priority bundle.
2. Map sockets/data/authority/cost and write sets.
3. Review source/test candidate, dependency compatibility.
4. Integrate disabled, regression toàn loop, privacy/tenant tests.
5. Pilot activation riêng; collect actual outcome/cost and rollback drills.
6. Promote theo capability registry, không sửa source catalog thành proof đã live.

### Evidence tối thiểu

Module contract/source hash, socket versions, test receipts, pilot scope/flags, operational owner.

### Không được làm

Không tạo backend/credentials riêng lặp core; không bypass gate vì module chỉ là mini-app.

### Điều kiện đóng / mở lại

All required proof layers passed; excluded capabilities vẫn gated; documentation/truth synchronized.


## RB-18 · Thu hồi quyền sau khi action đã bắt đầu
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03; D04; D07; thiết kế runbook tham chiếu

User rút consent hoặc hủy authorization sau khi có in-flight effect.

### Người chịu trách nhiệm

Authority service + domain reconciliation + support.

### Trình tự xử lý

1. Ghi revocation time/version và dừng future processing thuộc scope.
2. Xác định attempt đã consumed/dispatched hay chưa.
3. Nếu chưa dispatch, deny effect.
4. Nếu đang chạy, bounded cancel/terminate theo provider contract, không hứa hoàn tác tức thì.
5. Reconcile actual outcome/cost, compensation chỉ dưới quyền hợp lệ.
6. Thông báo điều đã/không thể dừng và lịch sử minh bạch.

### Evidence tối thiểu

Revocation record, authority transition, provider references, cancellation proof, data deletion scope.

### Không được làm

Không đổi consumed thành unused; không tự refund hoặc xóa transaction để giả chưa xảy ra.

### Điều kiện đóng / mở lại

No new unauthorized effects, in-flight disposition rõ, user controls và provider retention được xử lý.


## RB-19 · Partner Economy: eligibility, safety, payment hoặc payout có vấn đề
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D11 §§4A.3–4A.16; D04 authority/reconciliation principles

Một incident LO-05 thường chạm nhiều state machine cùng lúc. Không gộp “job failed” với “payment failed”, “eligibility expired” hoặc “safety incident”.

### Trigger

Eligibility/policy mismatch; partner/customer báo nguy hiểm; active job không rõ outcome; payment captured nhưng completion tranh chấp; payable tạo nhưng payout unknown/failed; duplicated provider/webhook; precise location hoặc messaging vượt policy.

### Xử lý từng bước

1. **Contain:** tạm dừng offer mới cho đúng `partner × capability × market` hoặc route/provider bị ảnh hưởng; không tắt toàn VIONA nếu không cần.
2. **Preserve evidence:** job/trip ID, authority ID, policy version, eligibility decision, quote, payment reservation/capture, provider IDs, location-consent state và incident reports; không chỉnh sửa lịch sử để “sạch”.
3. **Safety first:** nếu có nguy cơ con người đang diễn ra, kích hoạt safety/human escalation đúng market policy; payment/reputation không được ưu tiên hơn an toàn.
4. **Split truth:** xác định riêng `JOB/TRIP`, `PAYMENT`, `SETTLEMENT/PAYOUT`, `ELIGIBILITY`, `PROVIDER` và `SAFETY` states. `UNKNOWN` ở một state không tự đổi state khác.
5. **Revalidate entitlement:** nếu eligibility hết hạn/market disabled, chặn effect mới; active job xử lý theo safe-completion/cancellation policy đã phê duyệt, không tự tạo quyền mới.
6. **Reconcile money:** tra source of truth S07/provider; duplicate webhook/idempotency key không tạo double capture/refund/payable/payout. Không retry mù cùng authority UUID khi outcome chưa biết.
7. **Communicate:** thông báo rõ người dùng/partner điều đã biết, điều chưa biết, support route và mốc tiếp theo; không nói payout/ride/refund “xong” khi chưa có receipt.
8. **Disposition:** dispute/refund/partner restriction/safety review theo policy; high-impact account restriction phải có evidence và review path.
9. **Recovery gate:** chỉ mở lại capability sau khi root cause, affected cohort, balances/effects, provider state và regression test đã được review. No auto-recovery cho incident nghiêm trọng nếu policy không cho phép.
10. **Postmortem:** cập nhật Country Policy, matching guard, authority/cost rules hoặc runbook/test để ngăn lặp lại; không dùng incident làm lý do nới verification.

### Không được làm

Không xóa job để “reset”; không tự hoàn payout để làm đẹp KPI; không retry external charge/payout khi status unknown; không chuyển partner sang capability khác để lách eligibility; không chia sẻ precise location/transcript ngoài incident purpose.

### Exit criteria

Affected effects được reconcile; người dùng/partner có thông tin đúng; safety case được disposition; financial ledger không lệch; policy/eligibility state nhất quán; regression/evidence đủ; exact activation scope được quyết định lại nếu cần.


## RB-20 · Brokerage/Marketplace: booking, provider, commission hoặc ranking có vấn đề
**Tập 4 • 17 · RUNBOOK**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D12 §§0.2.2–0.2.7,2A,6B; D04 reconciliation principles

Dùng cho mọi BME engine khi domain state, provider truth, money/commission hoặc ranking disclosure không đồng nhất.

### Trigger

Provider timeout sau dispatch; double booking/order; final price khác quote; payment captured nhưng provider declined; fulfillment tranh chấp; refund/chargeback; commission accrued sai; provider/supply verification bị thu hồi; sponsored placement không label; organic ranking bị commission weight can thiệp; country policy/provider contract thay giữa phiên.

### Xử lý từng bước

1. **Contain exact scope:** tắt đúng `market × engine × capability × provider/supply class`; degrade sang search/lead/prepare-only nếu an toàn, không tắt toàn VIONA theo phản xạ.
2. **Freeze new irreversible effects:** giữ discovery nếu source vẫn đáng tin nhưng chặn booking/payment/dispatch/settlement mới khi truth boundary hỏng.
3. **Preserve evidence:** request/quote hash, policy/ranking version, authority, payment, provider references, webhook/raw receipt, fulfillment and commission ledger; không rewrite state để “khớp”.
4. **Split state:** domain booking/job/order, provider state, payment/refund, supplier payout, commission, dispute và ranking state được reconcile riêng.
5. **Unknown handling:** nếu provider có thể đã nhận request, chuyển `UNKNOWN_PENDING_RECONCILIATION`; không retry blind và không tạo second reservation/order.
6. **Money reconciliation:** verify S07/source of truth; ngăn double capture/refund/payout; claw back commission nếu contract yêu cầu sau refund/chargeback.
7. **Customer/supplier communication:** nói rõ known/unknown, total price/refund status và next checkpoint; không gọi “confirmed/refunded/settled” khi thiếu receipt.
8. **Ranking incident:** gỡ/label sponsored placement sai, snapshot ranking inputs/version, kiểm tra user harm; commission không được dùng để sửa organic order âm thầm.
9. **Provider/supply disposition:** suspend exact provider/listing/partner nếu trust/contract invalid; không chuyển traffic sang provider chưa review chỉ để giữ conversion.
10. **Recovery:** chỉ mở lại khi root cause, affected cohort, balances/provider truth, regression tests, provider health và operator disposition đã rõ.

### Không được làm

Không tự retry booking/order/payout khi outcome unknown; không mark fulfillment thành success để giữ commission; không che fee/affiliate relation; không dùng refund mới để bù ledger cũ mà không reconciliation; không xóa duplicate record làm mất audit trail.

### Exit criteria

Không còn unauthorized/duplicate effect; provider/domain/money/commission states reconciled hoặc case owner rõ; affected users/suppliers informed; sponsored/organic ranking đúng disclosure; regression + kill switch verified; exact activation scope được review lại.


## Từ KPI tới phép đo có thể audit
**Tập 4 • 18 · METRICS & GATES**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §20; D04 §5

Một tỷ lệ thiếu mẫu số, cửa sổ và policy version không đủ để quyết định launch.

### Định nghĩa nguồn

| Metric | Ý nghĩa |
| --- | --- |
| Incorrect commitment | Cam kết factual ngoài source truth hoặc ngoài authority/policy; không tính lỗi phong cách không có hệ quả. |
| Provider failure | Lỗi từ provider ngăn terminal success; tách user cancel và policy refusal. |
| Reconciliation mismatch | Outcome hiển thị user khác authoritative tool/provider outcome. |
| Unknown outcome | Effect đã dispatch nhưng terminal provider truth chưa được biết. |
| Cost / successful outcome | Tổng chi phí liên quan, kể cả failures, chia successful outcomes hợp lệ. |

### Metric event cần có

```text
metricName / policyVersion / cohort
country / language / provider / voiceMode
windowStart / windowEnd
numerator / denominator / exclusions
observedRate / uncertaintyBound
threshold / decision / evidenceRefs
```

### Unknown denominator

Terminal-outcome sample cho readiness không được dùng để làm biến mất calls unknown. Unknown rate cần mẫu số dispatched attempts trong cửa sổ và aging cutoff đã được review. Count thay đổi khi reconciliation hoàn tất phải trace version.

### Không nới mẫu số

Không loại failures khỏi mẫu để đạt KPI; không chọn cửa sổ thuận lợi sau khi nhìn kết quả. Thiết lập policy trước pilot, ghi version và thay đổi có review.


## Ngưỡng pilot V1.1: giữ đúng nguồn
**Tập 4 • 18 · METRICS & GATES**
**Phạm vi:** DEFAULT POLICY NGUỒN / CHƯA ĐO
**Nguồn:** D04 §§5.2–5.6

Đây là initial governance defaults đã ghi trong addendum, không phải kết quả VIONA hiện đạt.

### Readiness và runtime thresholds

| Chỉ số | Default nguồn | Hành vi |
| --- | --- | --- |
| Terminal outcomes / core Voice mode | ≥1.000 | Sample tối thiểu cho readiness. |
| Terminal outcomes / primary market-language pair | ≥200 | Không gom toàn cầu để che gap. |
| Incorrect commitment | Target ≤0,25%; hard >0,50% | Hard degrade; severe violation xử lý ngay. |
| Provider failure | >3% / >5% / >10% | Warning / handoff-only / circuit breaker. |
| Booking mismatch | >0,50% | Hard degrade. |
| Unknown outcome | >2% | Hard degrade và investigate. |
| Variable AI/provider cost ratio | Target ≤12%; warn >12–15%; trần quản trị 20% | Theo allocated net revenue và SKU/market. |

### Zero tolerance

Unauthorized effect, duplicate call cùng authority, authority bypass, fabricated price/availability, booking success không có reconciled truth, hard cap breach và cross-tenant disclosure: một sự kiện là incident, disable/handoff route và không auto reenable.

### Rolling window

D04 đưa ví dụ tối thiểu 100 cuộc gọi / tối đa 24 giờ; đây là ví dụ cần provider/market policy, không là giá trị universal đã khóa. Theo dõi confidence interval hoặc uncertainty bound, không coi sample nhỏ không lỗi là proof an toàn tuyệt đối.

### Giới hạn economics

12/15/20% không thay absolute per-call cap. Cần định nghĩa denominator allocation, taxes/fees và funded exceptions; không gọi management ceiling là cam kết không lỗ.


## Automatic degrade và recovery
**Tập 4 • 18 · METRICS & GATES**
**Phạm vi:** NGUỒN + VẬN HÀNH THAM CHIẾU
**Nguồn:** D04 §§5–6

Hạ quyền phải xảy ra bằng máy, khôi phục phải có evidence và authority phù hợp.

### State

| State | Cho phép | Không cho phép |
| --- | --- | --- |
| NORMAL_AUTONOMY | Bounded execution trong envelope. | Vượt policy/chi phí hoặc tự nâng authority. |
| LIMITED_AUTONOMY | Interpret/prepare; human confirm commitments. | Tự cam kết dựa heuristic. |
| HUMAN_HANDOFF_ONLY | Thu facts, summarize và handoff theo scope. | Domain execution hoặc commitment tự trị. |
| VOICE_EXECUTION_DISABLED | Non-voice fallback/support được phép. | New provider voice calls trên route disabled. |

### Recovery

1. Close/reconcile incident, xác định affected intents/tenants và exposure.
2. Fix root cause trong scope được cấp, thêm regression với counterexample.
3. Machine validation và independent review exact candidate.
4. Operator cho controlled reenable với cohort/quotas/monitoring.
5. Nếu threshold/invariant lại fail, giữ downgrade, không model tự thử mở lại.

### Không cần đi tuần tự khi khẩn cấp

Ladder diễn tả mức authority, không ép đi qua LIMITED trước khi DISABLED. Zero-tolerance severe event có thể tắt route ngay; tiếp tục availability của SOS Core/read-only safe fallback nếu không bị ảnh hưởng.

### Không phải chỉ UI flag

Backend executor phải enforce disabled state và revocation; chỉ ẩn nút trên app không ngăn worker/provider dispatch.


## Ma trận acceptance cho signature launch
**Tập 4 • 18 · METRICS & GATES**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §§17–23; D04; reference acceptance matrix

Một bộ kiểm nghiệm dựa trên outcome để quyết định có đáp ứng lời hứa mới hay chưa.

### Journey → proof

| Journey | Đầu ra phải đo | Negative case bắt buộc |
| --- | --- | --- |
| Call For Me | Task đúng ngôn ngữ, constraints, receipt và cost. | Quote vượt trần, IVR/voicemail, call unknown. |
| Answer For Me | Booking thật vào lịch merchant, summary/handoff. | Slot race, price change, refund request, policy revoke. |
| Talk With Me | Critical meaning giữ đúng, user kiểm soát. | Số/ngày nhầm, background noise, stop consent. |
| Proactive lifestyle | Gợi ý có nguồn và utility, quyền rõ. | Memory stale, duplicate reminder, denied authority. |
| Predictive business | Recommendation cải thiện outcome theo pilot. | Dirty data, seasonality, unapproved repricing. |
| Travel disruption | Alternative được chuẩn bị và approved change reconciled. | Partial reissue, provider pending, cost increase. |
| D-select | Human/partner-controlled scope được chứng minh. | High-risk request ngoài permission, provider unavailable. |

### Release scorecard

Với từng journey, ghi country/language/device/provider, số mẫu, failures, unresolved incidents, usage cost, support SLA và evidence IDs. Không gọi toàn Voice GREEN từ một demo tiếng Anh trên web.

### Grand Launch quyết định gì

Activation đúng bundle/scope đã kiểm; không chứng nhận mọi module, mọi bệnh lý, mọi thị trường hoặc mọi phiên bản model trong tương lai.


## Bài tập diễn tập trước pilot
**Tập 4 • 18 · METRICS & GATES**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D04; D07; reference test exercises

Tập xử lý thất bại trong môi trường được cấp quyền để khi người dùng thật gặp lỗi, hệ thống không đoán.

### Diễn tập liên thông

1. Lost ACK: provider nhận call, client timeout. Chứng minh một attempt, reserve giữ và reconciliation đúng.
2. Double booking: đồng thời hai confirms cùng slot. Chứng minh capacity không vượt và chỉ một outcome confirmed.
3. Prompt injection: nguồn chứa chỉ thị gọi một số mới/chia sẻ secrets. Chứng minh draft/tool gate chặn.
4. Wrong currency: quote CZK nhưng budget EUR. Chứng minh không tự convert và chấp thuận.
5. Revoked policy: merchant thu quyền discount giữa call. Chứng minh final commitment bị chặn.
6. Provider outage: circuit breaker hoạt động, không tự retry wave calls.
7. Privacy deletion: data bị xóa không quay lại retrieval sau rebuild index.
8. Rollback: release bị tắt nhưng in-flight unknown vẫn có case owner.

### Review diễn tập

Mỗi exercise có expected states ở cả authority/provider/domain/cost, actual results, context versions và finding. Không sử dụng tài khoản/provider production ngoài approval test scope.

### Đo sự thật

Cần receipts từ layer có quyền quyết định. Simulated provider useful cho unit/integration nhưng không thay behavioral/provider proof required trước live.


## Ba đối tượng kỹ thuật không được nhầm
**Tập 4 • 19 · BOOTSTRAP**
**Phạm vi:** BÁO CÁO LỊCH SỬ + PHÂN BIỆT
**Nguồn:** E01–E06; D10; conversation reports

Capability scratch root, authority-state root và NF01A fragment có mục đích, ACL và authority khác nhau.

### Đối tượng

| Vai trò | Không phải |
| --- | --- |
| DEP01 capability scratch root | Root + run-a, run-b, toolchain-tmp, evidence phục vụ thí nghiệm toolchain. Không được coi thư mục đã tồn tại khi mới có architecture. |
| NF01A authority-state root | Lưu trạng thái durable single-use theo profile được review; không là chỗ build/test tùy ý. |
| NF01A normative fragment | Target source fragment có object/schema/byte hash riêng; không phải authority record hay directory. |

### Quan hệ hiện tại

Theo closure-order successor được review trong hội thoại: DEP01 behavioral/toolchain closure trước, rồi creator build/state-root và NF01A materialization qua gate riêng. Authz helper bootstrap phát sinh cho scratch proof là ngoại lệ đề xuất riêng, không mặc định dùng exception installation trước đó.

### Không dùng số byte làm tên nhiệm vụ

Gói lost historical33.145byte khác NF01A31.018byte và các packet JSON/ZIP mới. Exact identity luôn là tên/schema + length + hash + lineage, không “file JSON gần giống”.

### Tính tạm thời

Các điều kiện Windows cụ thể thuộc snapshot/manifest. Không biến SID, branch hoặc chín dirty files thành định luật chung của backend/mobile VIONA.


## DEP01: 11 behavioral gates và bằng chứng
**Tập 4 • 19 · BOOTSTRAP**
**Phạm vi:** ĐẶC TẢ NGUỒN / RUNTIME CHƯA CHẠY
**Nguồn:** E05; E06; prior source-spec review

Source probe đã review không đồng nghĩa compiler/linker/librarian đã được chứng minh.

### Gate

| Gate | Phép chứng minh cần có |
| --- | --- |
| 1 · MSVC_CPP20_X64_SUPPORTED | Source có C++20 constructs; compile success và actual object/PE x64. |
| 2 · STATIC_CRT_SUPPORTED | Inputs/libs đúng; normal và delay imports không có prohibited dynamic CRT. |
| 3 · COMPILER_Z7_SUPPORTED | Object debug info thực; đo compiler-stage PDB count trước linker. |
| 4 · LINKER_DEBUG_FULL_SUPPORTED | PDB tồn tại + RSDS/debug metadata đủ, không chỉ flag. |
| 5 · PDB_EXACT_PATH_SUPPORTED | Physical PDB đúng exact output path. |
| 6 · PDBALTPATH_SUPPORTED | Embedded stable path khác physical A/B paths, được inspect. |
| 7 · INCREMENTAL_NO_SUPPORTED | Không ILK/incremental artifact; exact output set. |
| 8 · MANIFEST_EMBED_SUPPORTED | PE resource inventory + ID/language leaves + extraction/XML proof. |
| 9 · REPRODUCIBLE_COMPILER_SUPPORTED | Object A/B length/hash/raw bytes bằng nhau. |
| 10 · REPRODUCIBLE_LINKER_SUPPORTED | EXE A/B byte equality, không normalize. |
| 11 · REPRODUCIBLE_LIBRARIAN_SUPPORTED | Static library A/B equality theo contract. |

### Current state

Execution architecture V5.1 được báo reviewed GREEN; cả 11 runtime proof chưa có. Chỉ đủ source/packet không được promote DEP01; helper bootstrap build cũng không được tính thay các gate này.


## Thiết kế thí nghiệm RUN_A / RUN_B
**Tập 4 • 19 · BOOTSTRAP**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** E05; E06; conversation scope

Đây là mô tả gate, không là lệnh cho phép chạy compiler.

### Thí nghiệm hữu hạn

1. Fresh verify sources, toolchain/static seal, input libraries, exact environment và repository prestate.
2. Scratch hierarchy phải được tạo/seal độc lập và kiểm owner/reparse/file IDs đúng.
3. Review exact orchestrator implementation và source pinning; authority execution phải bind exact package/context/counts.
4. Hai run có cùng source/tool/library/flags/non-output semantics, outputs tách riêng.
5. Inspect object/PE/imports/PDB/manifest/archive; capture stdout/stderr/process events và failure journal.
6. So raw bytes A/B không timestamp stripping hoặc patch artifacts.
7. Independent review evidence; cả 11 PASS mới đủ điều kiện status promotion riêng.

### Containment và quan sát

Job object, descendant events, exact image identities, timeouts và evidence durability là các obligation trong orchestrator. Event observer không tự ngăn mọi hành vi trước quan sát; runtime threat/containment proof vẫn có phạm vi.

### No retry / preserve failure

Tool failure tiêu hao bound attempt rồi STOP; timeout phải có bounded abort/drain/failure evidence theo contract. Không cleanup scratch để chạy lại với cùng authority; không gọi output chỉnh sửa là reproducible.


## Token continuity: đúng token, đúng thời điểm
**Tập 4 • 19 · BOOTSTRAP**
**Phạm vi:** ARCHITECTURE ĐÃ REVIEW / CHƯA RUNTIME
**Nguồn:** E04; W09; source-policy summary

Handle lifetime, token identity và authorization state là các khái niệm khác nhau.

### Chuỗi policy V1.3

1. Bind exact DEP03 process, loaded managed assemblies/native modules theo approved identity.
2. No thread impersonation; lấy một WindowsIdentity Query-only và AccessToken của cùng identity.
3. DangerousAddRef giữ handle lifetime; query TokenStatistics/TokenPrivileges theo exact ABI.
4. Resolve SeChangeNotifyPrivilege LUID local qua name, không hard-code23 hoặc lấy từ builder token.
5. Authority bind UserSid/TokenId/AuthenticationId/ModifiedId/TokenType và allowed enabled privileges.
6. Fresh same-thread continuity trước root và từng child; drift thì stop, preserve partial prefix.
7. Release pin/identity đúng terminal finally; không mutate/revert/enable privileges để làm check pass.

### Giới hạn cần nhớ

Giữ handle mở không làm token bất biến; TokenId nhận diện object, ModifiedId dùng phát hiện thay đổi context. Same-thread check-to-effect là obligation code flow, không chứng minh loại bỏ mọi race từ host/process bị compromise. [W09]

### Policy lane-specific

Chỉ SeChangeNotifyPrivilege enabled là policy bảo thủ của creator lane, không phải yêu cầu cho mọi người dùng VIONA. Privilege khác có thể tồn tại disabled; “có mặt” khác “đang enabled”.


## Access matrix đã được tiếp nhận
**Tập 4 • 19 · BOOTSTRAP**
**Phạm vi:** QUYẾT ĐỊNH OPERATOR / CHƯA CANONICAL REPO SYNC
**Nguồn:** E01; E02; O02–O03

Sự thay đổi ngữ nghĩa 11 mục phải được giữ tường minh trong mọi successor.

### Ba lớp đã chốt

| Lớp | Scope |
| --- | --- |
| Principal identity | Chín nhãn gắn SID và provenance; không tự nói effective access. |
| Direct DACL matrix | Exact ACE grants của descriptor; zero direct grant không phải mọi token có SID đó đều zero. |
| Authz effecting token | Windows authorization result của exact owner token trên descriptor trước creation-authority consumption. |

### Không sửa quá khứ

Base V1 rows trước đó ambiguous. Operator đã tiếp nhận prospective semantics theo exact E01 hash; E02 giữ sự cố formatter/rewrite và scope review-only riêng. Các JSON predecessor không bị sửa và các implementation blocked không tự GREEN.

### Counter đúng

Identity unresolved count và proof-schema unresolved count có thể zero sau static checks. Runtime Authz status vẫn NOT_RUN, measured mask null. Không dùng nine rows populated=9 Authz passes hoặc global effective writer count=0.

### Current next lane

Chuẩn bị Authz Bootstrap Decision V1.2 để align adopted semantics, exact token-open và private-pipe boundaries. Chưa có report completion của lane đó trong snapshot này; không ghi helper source/build đã authorized.


## Authz helper bootstrap: điều đã chọn và gate còn mở
**Tập 4 • 19 · BOOTSTRAP**
**Phạm vi:** KẾ HOẠCH / GATES CÒN MỞ
**Nguồn:** E03; E01; conversation Authz decision lineage; W08

Thiếu admissible fixed binding trong runtime được kiểm đã dẫn tới đề xuất helper native read-only riêng.

### Mục đích helper

Evaluate exact Base-V1 descriptor bằng Windows Authz trên token tương quan chính xác với creator; trả một record qua private inherited pipe. Helper không tạo directory, không thay ACL, không authority và không tự attest binary hash làm proof.

### Chuỗi gate chưa được phép nhảy

1. Align architecture decision theo adopted semantic map và review.
2. Chuẩn bị source/build recipe, SDK/libs/native imports và no-CRT feasibility.
3. One-shot bootstrap build authority riêng; build output location không là canonical repo hoặc scratch chưa tồn tại.
4. Bounded build và independent binary review/import/readback.
5. Behavioral token correlation và pipe provenance proof; không coi cùng SID là cùng token.
6. Creator successor bind helper exact binary; review rồi creation authority/root readback/seal.
7. Capability experiment authority và cả 11 evidence vẫn tách riêng.

### Kênh output

Helper tự check stdout FILE_TYPE_PIPE trước WriteFile; creator phải chứng minh private child/pipe relation. Pipe type không chứng minh privacy. Shell redirection có thể mở file trước helper chạy nên authorized launcher không dùng shell.

### Không gọi ngoại lệ đã có hiệu lực

“Helper needed” là decision proposal/architecture path, không phép compile ngay khi DEP01 chưa GREEN. Ngoại lệ mới phải review/approval; kết quả helper build không promote DEP01.


## Ma trận chứng cứ bootstrap và giới hạn
**Tập 4 • 19 · BOOTSTRAP**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** E01–E06; D07

Không dùng read-only inspection, source presence hoặc copied metadata như chứng minh runtime đã an toàn.

### Claim → proof owner

| Claim | Bằng chứng đúng |
| --- | --- |
| Exact file bytes/hash | Machine hashing uploaded/stored bytes. |
| Loaded assembly tương ứng | Current process loaded path/hash/MVID metadata dưới quyền read. |
| Token có đúng privilege | Exact current-token queries, policy/ABI/context binding. |
| Direct DACL grants | Parse exact descriptor ACE/SID/masks với phạm vi direct. |
| Effective owner access | Actual Authz result cho đúng token/descriptor. |
| Repository unchanged | Fresh pre/post state projection + exact dirty-file identities. |
| No unexpected external effect | Bounded execution evidence/containment trong scope; không host-wide tuyệt đối nếu không có audit. |
| Adoption | Exact Operator decision + later canonical recording khi lane cho phép. |

### Nhiều cấp GREEN

Content review GREEN, process compliance GREEN, build GREEN và runtime GREEN khác nhau. Procedural exception có thể được Operator chấp nhận để review final artifacts mà không sửa lịch sử thành compliant.

### Không tái tạo source mất

Gói bytes không recoverable không được dựng từ summary rồi dùng old hash/identity. Chỉ successor mới theo review, giữ historical loss. Packet này không phải nguồn cho code generation mà không có task scope.


## Các quyết định còn mở trước triển khai sâu
**Tập 4 • 20 · ADR & MỞ RỘNG**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D01–D09; E01–E06; reference decision register

Tài liệu đầy đủ phải nêu cả điều chưa chốt, không bịa cho mọi ô trông hoàn thành.

### Decision backlog

| Nhóm | Điều cần chốt | Owner |
| --- | --- | --- |
| Backend/storage | Actual topology, engine/ORM, transaction/queue/search choices. | Platform architect |
| Voice provider | Markets, number/SIP/forwarding, consent/recording, tariff/limits. | Voice + legal/ops |
| Authority | Durable issuer/store/anti-replay từng effect class; derived policy authority. | Security architect |
| Data/privacy | Retention, backup erasure, lawful basis/country-specific reviews. | Privacy owner |
| Commercial | SKU allowance/overage, VAT/fees, refunds, safety funding. | Founder/finance |
| Partner Economy | Country/city work-rights, employment/self-employment model, transport/insurance, payout/tax, dispute and partner-safety policies per market × capability. | Product + legal/ops + finance |
| D-select | Exact family/provider/market/mode và user safety obligations. | Product + qualified partners |
| XR S20/S21 | Ownership, version mapping, client interfaces. | Platform/XR |
| Metrics | Provider-specific rolling windows/caps, uncertainty and pilot cohort. | Product/ops |
| Bootstrap | Decision V1.2, helper/build/native proof và scratch execution prerequisites. | A0/Operator |

### ADR chuẩn

Một ADR ghi problem, alternatives, exact source constraints, decision proposal, risks, proof obligations, adoption scope, rollback và follow-on authority. Không viết “accepted” khi chưa có người quyết định.


## Không bị lạc trong 63 module
**Tập 4 • 20 · ADR & MỞ RỘNG**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D03 §18; D06; reference portfolio practice

Ưu tiên theo outcome, reuse và bằng chứng; không tối ưu phần trăm catalog đã code.

### Quarter/wave planning

1. Lập capacity map: team/Swarm/test/devices/providers/support/budget.
2. Chọn 2–3 measurable signature outcomes theo pilot evidence, không phải tùy hứng số lượng module.
3. Tính critical path sockets và gate khó nhất cho từng bundle.
4. Reuse certified capability, không copy pipeline wallet/voice/evidence.
5. Đặt stop/loss cap cho research; project không có provider/evidence phải gated rõ.
6. Review hàng tuần progression của outcome/gates, cập nhật source of truth và không xóa historical failures.

### Ví dụ bundle tham chiếu

Salon: BU-02 + BU-08 + BU-05 + Local requests + Account controls. Consumer language: TR-03 + LO-01 + Call For Me + LO-06. Travel proactive: TR-04/TR-07 + itinerary core + S09/S10. Bundle chỉ là đề xuất, từng component có own gates.

### 64th module?

S21 XR là socket/interface concept, không thêm một ID module vào catalog 63. Call For Me là shared core signature. Tương tự, `LO-05A..F` và `TR-06A..H` là sub-capabilities nội bộ, còn `BME-01..08` là brokerage engines; **không có mục nào là module 64+**. Khi một capability tăng scope/risk, mở contract/gate riêng nhưng giữ canonical top-level inventory 63.

### Thành công thương mại

Một bundle nhỏ có repeat value, trustworthy outcome và margin bền vững tốt hơn 63 module hời hợt. Không biến đây thành bỏ chức năng; roadmap còn lại được giữ với readiness rõ.


## Đọc đúng các tuyên bố tham vọng trong catalog
**Tập 4 • 20 · ADR & MỞ RỘNG**
**Phạm vi:** THIẾT KẾ THAM CHIẾU
**Nguồn:** D05; D03–D04; G01 audit lessons

Giữ tầm nhìn nhưng không biến từ marketing thành promise về năng lực, pháp lý hoặc an toàn.

### Cụm trong nguồn

| Cụm nguồn | Cách đọc/triển khai có trách nhiệm |
| --- | --- |
| “Tự động”, “Autonomous” | Mục tiêu tối ưu trong policy; consequential execution vẫn cần authority/cost/evidence. |
| “Triệt tiêu lừa đảo”, “100% KYC” | Không bảo đảm không còn scam; identity checks và biometric policy cần review riêng. |
| “Đầu tư an toàn” | Không bảo đảm không lỗ; regulated partner/risk disclosure và user authority. |
| “Dự báo đột quỵ/nhồi máu” | Clinical/medical-device/intended-use validation trước bất kỳ claim production. |
| “Hợp pháp hóa/quy đổi bằng cấp” | Assistance/translation không tự tạo recognition của cơ quan. |
| “Quantum-ready” | Research posture, không phải cryptographic certification. |
| “Tự gọi cấp cứu” | Không fake dispatch; device/provider/country/safety gates bắt buộc. |
| “GDPR Auto-Pilot” | Công cụ hỗ trợ lifecycle, không tự chứng nhận pháp lý. |

### Thay đổi ở đây là gì

Tên và mô tả gốc của 63 module được giữ trong hồ sơ. Bản đầu đề xuất, giới hạn và kỹ thuật triển khai là bổ sung biên tập có nhãn; không silently rewrite D05 hoặc tuyên bố cả 63 modules đã sẵn sàng.

### Sửa nhầm tầng

Cẩm nang không là hiến pháp tối cao; Windows bootstrap không là product OS; số9 dirty files không luật vĩnh viễn; roles không fixed vendor; no-retry theo authority/effect chứ không cấm mọi operation read-only.


## Sản phẩm và roadmap
**Tập 4 • 21 · THUẬT NGỮ**
**Phạm vi:** TỪ ĐIỂN THAM CHIẾU
**Nguồn:** D01–D07; E01–E06; tổng hợp biên tập

Giải thích để đọc đúng blueprint, manifest và báo cáo tiến độ.

### Thuật ngữ

| Tên | Nghĩa và giới hạn |
| --- | --- |
| Universe | Một trong sáu miền sản phẩm. Không thêm Home, Viona hoặc XR thành universe mới. |
| Home / orchestration | Bề mặt ưu tiên ngữ cảnh và chuyển người dùng tới capability; không sở hữu mọi domain state. |
| Viona / specialist | Trợ lý công khai và vai trò chuyên môn; không phải authority issuer. |
| REC2 | Chương trình reconstruction R0–R9; phase closure cần outcome/evidence. |
| R9K | Ký hiệu sách cho vai trò kernel/pilot readiness mới của REC2-R9. |
| Wave A/B/C/D | Các lớp mở rộng sau kernel: revenue/voice, liên thông, predictive, regulated/high-trust. |
| D-select | Một số scope high-trust được chọn, không đòi toàn bộ Wave D. |
| Module / socket | Module là capability domain; socket là interface/core capability tái sử dụng. |
| Partner Economy | Income layer neo ở Local/LO-05, dùng Account/Business/Academy/Travel/SOS; không là universe mới. |
| Brokerage & Marketplace Economy | Lớp kinh tế xuyên sáu universe, gồm BME-01..08; không là universe/module mới. |
| Brokerage engine | Economic orchestration engine gom demand, verified supply, transaction truth và revenue trên các module hiện hữu. |
| Activation unit | `market × engine × capability × provider/supply class`; một unit GREEN không suy ra unit khác. |
| Earning mode | Một sub-capability LO-05A..F; activation phải theo exact market × capability. |
| Market × capability | Đơn vị rollout/policy độc lập, ví dụ `CZ-Prague × Student Jobs`; GREEN không lan sang market khác. |
| Lite/Pilot/Gated | Mức availability truthful; không được UI gắn production khi chỉ prototype. |


## Thẩm quyền và bằng chứng
**Tập 4 • 21 · THUẬT NGỮ**
**Phạm vi:** TỪ ĐIỂN THAM CHIẾU
**Nguồn:** D01–D07; E01–E06; tổng hợp biên tập

Giải thích để đọc đúng blueprint, manifest và báo cáo tiến độ.

### Thuật ngữ

| Tên | Nghĩa và giới hạn |
| --- | --- |
| Capability | Khả năng kỹ thuật có thể làm một việc; không đồng nghĩa được phép làm. |
| Authority | Quyền thực hiện exact effect trong constraints/context/expiry đã xác định. |
| Consent | Cho phép xử lý/chia sẻ dữ liệu theo purpose; không thay authority execution. |
| Entitlement | Quyền lợi gói/allowance; không là approval gọi provider tùy ý. |
| Prepare Artifact | Draft immutable khi review, có hash và constraints, chưa usable authority. |
| Single-use | Một authority chỉ dùng trong effect budget; UUID tự nó không enforce điều này. |
| Consumed | Attempt đã tiêu hao quyền theo contract; không quay lại unused khi outcome unknown. |
| Readback | Đọc nguồn kết quả có thẩm quyền sau effect; khác lời báo đã chạy lệnh. |
| Independent review | Review khác scope selfcheck, đọc exact artifact và tìm counterexample. |
| Canonical JSON | Byte serialization profile chính xác; semantic JSON equality chưa đủ. |


## Dữ liệu, tiền và reliability
**Tập 4 • 21 · THUẬT NGỮ**
**Phạm vi:** TỪ ĐIỂN THAM CHIẾU
**Nguồn:** D01–D07; E01–E06; tổng hợp biên tập

Giải thích để đọc đúng blueprint, manifest và báo cáo tiến độ.

### Thuật ngữ

| Tên | Nghĩa và giới hạn |
| --- | --- |
| Idempotency | Xử lý lặp cùng logical operation không tạo kết quả mới trong scope contract. |
| Outbox / inbox | Ghi event cùng transaction / dedup inbound, giúp chống mất/trùng ở scope hệ thống. |
| Reconciliation | Đối chiếu nhiều evidence để xác định outcome cuối, không đoán từ timeout. |
| UNKNOWN | Chưa biết terminal truth; không bằng FAILED, không cho retry blind. |
| Reservation | Giữ budget/capacity trước effect; khác chi phí thực settle. |
| Cost ledger | Sổ usage/reserve/settle của AI/provider; không nhất thiết money ledger. |
| GMV / net revenue | Tổng giá trị giao dịch / doanh thu giữ lại theo accounting; không dùng lẫn. |
| Circuit breaker | Tắt/giảm route khi failure hoặc invariant breach theo policy. |
| Canary / rollback | Rollout cohort nhỏ / quay release an toàn; không hoàn tác external effect đã xảy ra. |


## Kỹ thuật Windows và Swarm
**Tập 4 • 21 · THUẬT NGỮ**
**Phạm vi:** TỪ ĐIỂN THAM CHIẾU
**Nguồn:** D01–D07; E01–E06; tổng hợp biên tập

Giải thích để đọc đúng blueprint, manifest và báo cáo tiến độ.

### Thuật ngữ

| Tên | Nghĩa và giới hạn |
| --- | --- |
| DACL / ACE | Danh sách điều khiển truy cập / từng entry SID-mask; direct grants khác token effective rights. |
| Authz | Windows authorization evaluation trong bootstrap; không phải toàn bộ product authorization. |
| SID / token | Định danh principal / security context chứa identity/groups/privileges. |
| TokenId / ModifiedId | Identity của token instance / chỉ dấu thay đổi context trong source policy. |
| SafeHandle pin | Giữ lifetime handle; không tự bảo đảm token hoặc filesystem bất biến. |
| FILE_CREATE | Creation disposition fail nếu tồn tại; không adopt existing object. |
| Reparse / TOCTOU | Chuyển hướng filesystem / khoảng giữa kiểm và dùng; cần control theo threat model. |
| TIER_M | Machine validation, không phải AI model; fact phải được đo. |
| Write set / cell | Tập đường ghi được cấp / đơn vị công việc hợp đồng có dependency. |
| Macro-delegation | Agent tự xử lý nhiều bước trong same authorized scope, dừng ở risk boundary. |


## Danh mục file nguồn 1
**Tập 4 • 22 · NGUỒN & PROVENANCE**
**Phạm vi:** NGUỒN / ĐỊNH DANH MÁY
**Nguồn:** Source register generated from exact available files

Các hash được tính trên file đọc tại thời điểm biên soạn. Không chia sẻ font hoặc coi digest là chữ ký approval.

### D01 · 01_VIONA_FINAL_CANONICAL_LOCK_2_0_0.md

Final canonical lock 2.0.0: bản sắc, sáu universe, tên công khai và boundary.

### Định danh file nguồn

```text
Bytes: 6575
SHA256: a8c16198dfb318a0b9920e59da8e9fa31048b2bd7eb7c6ccdf91045e3039772a
```

### D02 · 90_SOURCE_VIONA_CANONICAL_RC2_FULL_UNMODIFIED.md

Canonical reconstruction RC2 đầy đủ, nguồn lịch sử chưa sửa; dùng cho platform, journey, pricing và R0–R9. Launch ordering/naming đọc cùng successor.

### Định danh file nguồn

```text
Bytes: 225024
SHA256: 0814f2f92c5470620f4a5765b3d98fefeca76e410f89b011947f05e821790840
```

### D03 · VIONA_GRAND_LAUNCH_SUCCESSOR_ROADMAP_V1.md

Grand Launch Successor Roadmap V1: R9 kernel/pilot, C + D-select trước public launch, Voice signature.

### Định danh file nguồn

```text
Bytes: 31540
SHA256: 2f4dc4305607085f8c1ef242eb94f71741bcfd5ab52b015eaa6a5acac3caa58d
```


## Danh mục file nguồn 2
**Tập 4 • 22 · NGUỒN & PROVENANCE**
**Phạm vi:** NGUỒN / ĐỊNH DANH MÁY
**Nguồn:** Source register generated from exact available files

Các hash được tính trên file đọc tại thời điểm biên soạn. Không chia sẻ font hoặc coi digest là chữ ký approval.

### D04 · VIONA_GRAND_LAUNCH_SUCCESSOR_ROADMAP_V1_1_GOVERNANCE_ADDENDUM.md

Governance Addendum V1.1: barrier, single-use Voice, timeout, truth, cost, metrics, degrade.

### Định danh file nguồn

```text
Bytes: 27641
SHA256: 60fadff30601578c5ca968c6c8644dca246e777e729cfec15b8f0ed22dba08d5
```

### D05 · VIONA_POST_REC2_R9_EXPANSION_BLUEPRINT_MASTER_SOCKET_MAP_FINAL.md

Master Socket Map original: exact 63 mã, tên và mô tả; không là proof implementation.

### Định danh file nguồn

```text
Bytes: 10577
SHA256: bb23e5ee278ad185aadbcb034bd13a6a95e1b977f42344d6b3a3819ded1539a8
```

### D06 · VIONA_POST_R9_MODULE_PRIORITIZATION_AND_SOCKET_ARCHITECTURE_V1(1).md

Module prioritization/socket proposal: wave, priority, risk, revenue và sockets; planning không là authority.

### Định danh file nguồn

```text
Bytes: 36591
SHA256: 5fef5b4d09c62e120a00507cd4dec9d7c7e548f67314481a132f435d094de17f
```


## Danh mục file nguồn 3
**Tập 4 • 22 · NGUỒN & PROVENANCE**
**Phạm vi:** NGUỒN / ĐỊNH DANH MÁY
**Nguồn:** Source register generated from exact available files

Các hash được tính trên file đọc tại thời điểm biên soạn. Không chia sẻ font hoặc coi digest là chữ ký approval.

### D07 · VIONA_REC2-R3_to_REC2-R9_SWARM_DUAL_PROMPTING_MODEL_ROUTED_BLUEPRINT_V2(1).md

Swarm Dual Prompting Model Routed Blueprint V2: Wave0, cell roles, model economics, machine law và macro boundaries.

### Định danh file nguồn

```text
Bytes: 30014
SHA256: f15712d0d70d5f8810141cae1bebedf8fc76451f8eb0bd31a1a1b2e9a2c93a66
```

### D08 · VIONA_POST_R9_SPATIAL_COMPUTING_XR_BLUEPRINT_V1(1).md

Spatial/XR Blueprint: S21/OpenXR concept, cần reconcile với S20; old launch ordering superseded bởi D03.

### Định danh file nguồn

```text
Bytes: 24641
SHA256: 36e4d495747ec7bd96d591bfd33d69ee54a407b8f954fb6999a148a8e550bb6f
```

### D09 · 04_READ_ME_UI_TARGET_FINAL.md

Final UI target: premium/dark/cinematic, Home/six-universe layout và activation intent.

### Định danh file nguồn

```text
Bytes: 10426
SHA256: 050efd361a808cd680c4d32d9cf4fb3d9a8bf6397af2c99532e54d282d81c464
```


## Danh mục file nguồn 4
**Tập 4 • 22 · NGUỒN & PROVENANCE**
**Phạm vi:** NGUỒN / ĐỊNH DANH MÁY
**Nguồn:** Source register generated from exact available files

Các hash được tính trên file đọc tại thời điểm biên soạn. Không chia sẻ font hoặc coi digest là chữ ký approval.

### D10 · Văn bản đã dán (1)(20260929-071737).txt

Kernel 29/09/2026 được cung cấp: historical reported state, không fresh Windows verification.

### Định danh file nguồn

```text
Bytes: 18972
SHA256: b20eae3abd9b662c74dfc19896b36cd7fc9eb1c8b85c97f87dd7b9d8fd62fedc
```

### D11 · VIONA_POST_REC2_R9_EXPANSION_BLUEPRINT_MASTER_SOCKET_MAP_FINAL_V2_PARTNER_ECONOMY.md

FINAL V2 successor tích hợp Viona Mobility & Partner Economy trong LO-05, giữ đúng 63 module và sáu universe; định nghĩa six sub-capabilities, eligibility, lifecycle, settlement, safety, staged A2/B rollout và market×capability launch gates.

### Định danh file nguồn

```text
Bytes: 30648
SHA256: 157ebf20171e9e9ded2c6ef83db2129fcf368951f507cd422ce8c1293cbf7605
```

### D12 · VIONA_POST_REC2_R9_EXPANSION_BLUEPRINT_MASTER_SOCKET_MAP_FINAL_V3_BROKERAGE_MARKETPLACE_ECONOMY.md

FINAL V3 successor giữ Partner Economy, chính thức hóa **VIONA Brokerage & Marketplace Economy** với đúng 8 economic engines, mở rộng TR-06 bằng 8 booking/distribution capabilities và vẫn giữ 63 top-level module/sáu universe.

### Định danh file nguồn

```text
Bytes: 51772
SHA256: a0903eaa5d9d0e5425184a51bba6413e4d70e7dc179e9810c57addc95e44db44
```

### E01 · VIONA_DEP01_BASE_V1_EFFECTIVE_ACCESS_MATRIX_CLARIFICATION_ADDENDUM_V1.json

Clarification matrix: 11 semantic changes, identity/direct-DACL/actual owner-token Authz tách biệt.

### Định danh file nguồn

```text
Bytes: 21325
SHA256: 242c8bef5e8f648a7825965d3a36d9e19a650b6d525e0ae36b41b054304d069b
```

### E02 · VIONA_DEP01_ACCESS_MATRIX_CLARIFICATION_ADOPTION_AND_PROCEDURAL_RECONCILIATION_PACKET_V1.json

Reconciliation packet: incident provenance/limitations; Operator review-input disposition + adoption nằm ở conversation.

### Định danh file nguồn

```text
Bytes: 23709
SHA256: e7271159063a87ed2c70a8e4d429ed9ac4cd044ebef5b639082f210d7c62fcb3
```


## Danh mục file nguồn 5
**Tập 4 • 22 · NGUỒN & PROVENANCE**
**Phạm vi:** NGUỒN / ĐỊNH DANH MÁY
**Nguồn:** Source register generated from exact available files

Các hash được tính trên file đọc tại thời điểm biên soạn. Không chia sẻ font hoặc coi digest là chữ ký approval.

### E03 · VIONA_DEP01_MINIMAL_AUTHZ_BINDING_BOOTSTRAP_ARCHITECTURE_DECISION_V1_1.json

Authz Decision V1.1 predecessor blocked; không source/build approval.

### Định danh file nguồn

```text
Bytes: 14144
SHA256: 04d69a5ff13ce43bba0dc3e883cd0ba8b078ca27662baca740b0df203e95e7a2
```

### E04 · VIONA_DEP01_CAPABILITY_PROOF_SCRATCH_ROOT_MATERIALIZATION_ARCHITECTURE_V1_3_EFFECTING_TOKEN_CONTINUITY_ADDENDUM.json

Token continuity V1.3 architecture: exact identity, before-effect checks, không runtime race proof.

### Định danh file nguồn

```text
Bytes: 15648
SHA256: 40ddc6d0093d80500ec3b9d8f48a0a541e64b585fb3dcef57cbd9fcdb1c71eb2
```

### E05 · VIONA_A3PR6_DAEC_B01_DEP01_ELEVEN_BEHAVIORAL_CAPABILITY_PROOF_EXECUTION_PACKET_V5_1.zip

11-gate packet V5.1 ZIP: architecture/orchestrator reviewed trong hội thoại; chưa thí nghiệm authority.

### Định danh file nguồn

```text
Bytes: 49559
SHA256: 394cfcb53fa705ff79f6b48389ce2a455207208114302f24ea0a5cd85bee126e
```


## Danh mục file nguồn 6
**Tập 4 • 22 · NGUỒN & PROVENANCE**
**Phạm vi:** NGUỒN / ĐỊNH DANH MÁY
**Nguồn:** Source register generated from exact available files

Các hash được tính trên file đọc tại thời điểm biên soạn. Không chia sẻ font hoặc coi digest là chữ ký approval.

### E06 · VIONA_DAEC_B01_CONTROLLING_DEPENDENCY_CONTRACT_SUCCESSOR_V2.json

Controlling dependency successor V2: five-dependency closed model, eleven gates và future review.

### Định danh file nguồn

```text
Bytes: 119257
SHA256: 62bc202c65a4adc3c485e02cbdd3edfd7c0a9a9a761a18d8556b424a4b2f279c
```

### G01 · Đã dán markdown (1)(20261001-215010).md

Gemini handbook tham chiếu phụ, đã chỉ ra nhầm tầng và overclaims; không controlling authority.

### Định danh file nguồn

```text
Bytes: 26529
SHA256: 55b49c78e8e6afe8cb7ea591a84fa493dbc7581f493df5fdf1ebb8d6d59f5c6b
```


## Tài liệu kỹ thuật công khai 1
**Tập 4 • 22 · NGUỒN & PROVENANCE**
**Phạm vi:** WEB CHÍNH THỨC / THAM KHẢO
**Nguồn:** W01–W10

Đối chiếu nguồn chính thức ngày 02/10/2026. Chúng hỗ trợ semantics kỹ thuật, không thay private Project contracts.

### W01 · Twilio · Call resource

Trạng thái call, callbacks, termination và lý do completed không bằng booking success.

https://www.twilio.com/docs/voice/api/call-resource

### W02 · Twilio · Security

Xác thực request callback theo hướng dẫn/SDK chính thức.

https://www.twilio.com/docs/usage/security

### W03 · Stripe · Webhooks

Signature, duplicate/out-of-order event và ingestion boundary.

https://docs.stripe.com/webhooks

### W04 · Stripe · Idempotent requests

Scope và semantics idempotency của một provider, không universal guarantee.

https://docs.stripe.com/api/idempotent_requests

### W05 · PostgreSQL · Transaction isolation

Serializable/concurrency tham chiếu; không lựa chọn DB hiện tại của VIONA.

https://www.postgresql.org/docs/current/transaction-iso.html


## Tài liệu kỹ thuật công khai 2
**Tập 4 • 22 · NGUỒN & PROVENANCE**
**Phạm vi:** WEB CHÍNH THỨC / THAM KHẢO
**Nguồn:** W01–W10

Đối chiếu nguồn chính thức ngày 02/10/2026. Chúng hỗ trợ semantics kỹ thuật, không thay private Project contracts.

### W06 · W3C · WCAG 2.2

Accessibility web, contrast/target size; không tự chứng nhận native app.

https://www.w3.org/TR/WCAG22/

### W07 · Expo · Development builds

Phân biệt development build với production readiness.

https://docs.expo.dev/develop/development-builds/introduction/

### W08 · Microsoft · AuthzAccessCheck

Authorization engine/return data tham chiếu cho bootstrap architecture.

https://learn.microsoft.com/en-us/windows/win32/api/authz/nf-authz-authzaccesscheck

### W09 · Microsoft · TOKEN_STATISTICS

Token identity fields trong technical appendix.

https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-token_statistics

### W10 · European Commission · AI transparency

Nguồn để legal team kiểm nghĩa vụ disclosure; handbook không là legal clearance.

https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations


## Quyết định Operator và nguồn chưa đầy đủ
**Tập 4 • 22 · NGUỒN & PROVENANCE**
**Phạm vi:** QUYẾT ĐỊNH / GIỚI HẠN
**Nguồn:** O01–O05; D03–D04; D11–D12; E01–E02

Không invent một signed receipt hoặc thời điểm adoption ngoài những gì conversation chứa.

### O01 · Grand Launch

Founder chọn dời public launch sau Wave C + selected Wave D; Voice Call/Answer/Talk là signature. D03/D04 lưu direction/policy. Không tự chứng minh repo đã adopt hoặc runtime đã đạt.

### O02 · Review inputs only

```text
APPROVE_VIONA_ACCESS_MATRIX_FINAL_ARTIFACTS_FOR_REVIEW_ONLY_WITH_BOTH_DISCLOSED_PROCEDURAL_DEVIATIONS
```

### O03 · Semantic adoption only

```text
APPROVE_VIONA_ACCESS_MATRIX_SEMANTIC_ADOPTION_ONLY_WITH_RUNTIME_AUTHZ_GATE_RETAINED_BEFORE_EFFECT
```

### O04 · Partner Economy finale

Operator yêu cầu cập nhật Partner Economy vào blueprint ở trạng thái FINAL; D11 là successor sử dụng cho Cẩm nang V4. Phạm vi: giữ 63 module/sáu universe, nâng LO-05 thành Viona Mobility & Partner Economy, staged A2/B theo exact market × capability và không suy ra production/legal clearance từ blueprint.

### O05 · Brokerage & Marketplace Economy finale

Operator chấp thuận cập nhật Blueprint FINAL và Cẩm nang để **VIONA Brokerage & Marketplace Economy** trở thành lớp chính thức gồm 8 brokerage engines: Mobility/Partner, Travel, Home/Real Estate, Services, Talent, B2B Supply, Money và Trusted Professional Network. Điều kiện bất biến: vẫn đúng 6 universe và 63 module; BME engines không là module IDs; activation vẫn cần exact market/provider/policy/evidence và không suy ra runtime live từ tài liệu.

### Phạm vi

O02 cho phép dùng final E01/E02 làm review inputs, giữ hai deviations. O03 tiếp nhận 11 semantic changes, giữ runtime Authz before effect. Không source/build/helper/scratch/DEP01 authority được suy ra.

### Nguồn chưa đủ để khẳng định live

Không có fresh live Git/GitHub audit trong lần biên soạn; không local Windows runtime/SDK binary verification; không real provider/market metrics hoặc complete schema/ADR cho mọi module. Catalog63 đầy đủ theo D05; chi tiết kỹ thuật triển khai ngoài nguồn đã được nhãn tham chiếu.

### Cập nhật sách

Khi có new canonical source/review/activation, cập nhật source register và status appendix, không rewrite lịch sử. Luôn phân biệt artifact self-classification với latest independent review và Operator disposition.


## Checklist khi chuyển toàn thư thành công việc
**Tập 4 • 22 · NGUỒN & PROVENANCE**
**Phạm vi:** KẾT LUẬN / VẬN HÀNH
**Nguồn:** D01; D04; D07; E01–E02

Sử dụng sách để đặt câu hỏi đúng và viết hợp đồng đúng; không paste cả sách thành quyền thực thi.

### Trước một module hoặc lane

1. Chọn chính xác module/journey và nguồn controlling mới nhất.
2. Phân biệt phần nguồn đã chốt với reference design trong sách.
3. Fresh baseline đúng environment và review history.
4. Định nghĩa outcome, data owner, effects, risk, budget, scope và test/evidence oracle.
5. Tạo contract/manifest với authority riêng cho effect cần làm; không gộp approval blueprint với runtime.
6. Builder/Verifier độc lập đọc cùng exact artifact; giữ NOT_RUN và unknown trung thực.
7. Chỉ cập nhật capability readiness sau required evidence và quyết định activation.
8. Nếu là LO-05, khóa exact `market × capability`, eligibility/policy version, partner-safety, payment/settlement và payout/dispute proof trước activation.
9. Đưa bài học vào regression và handbook source register, không thêm quy trình hình thức không có risk rationale.

### Thước đo cuối cùng

Viona giúp người dùng giải quyết việc thực bằng ngôn ngữ họ hiểu, chủ động đúng lúc, biết xin quyền và biết nói chưa biết. Business nhận giá trị thật; người Việt đủ điều kiện có thể tiếp cận cơ hội kiếm thu nhập qua Partner Economy; nhu cầu trong sáu universe có thể kết nối với verified supply qua 8 Brokerage Engines; costs có giới hạn, dữ liệu và safety được bảo vệ, đội ngũ có thể vận hành và phục hồi.

### Đích của VIONA

Không phải “63/63 code exists”. Đích là hệ sinh thái Companion OS có outcome đáng tin, thói quen hữu ích, nền kinh tế bền vững và khả năng mở rộng mà không đánh mất authority/truth.
