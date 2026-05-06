# VIONA AI Receptionist Demo UX Audit

## 1. Executive Summary
- **Nên đặt demo ở screen mới hay dùng screen có sẵn?** Nên dùng **screen mới** chuyên cho demo UX (ví dụ `AiReceptionistDemoSimulatorScreen`) để tách rõ khỏi queue/calendar đang có state thay đổi.
- **Có thể reuse InboundQueue/AiEye không?**
  - `InboundQueue`: chỉ nên reuse một phần UI pattern, **không** dùng làm nơi chạy demo call chính vì hiện có thao tác confirm booking state.
  - `AiEye`: **không phù hợp** (vision/camera flow B2C, không phải B2B receptionist voice demo).
- **Có cần route mới không?** Có. Nên thêm 1 route B2B gated riêng (demo/pilot flag) để merchant truy cập “Simulated Call Demo” mà không chạm production-like surfaces.

## 2. Candidate Screens

| Screen/File | Current Purpose | Fit For Demo UX? | Risk | Recommendation |
|-------------|-----------------|------------------|------|----------------|
| `src/screens/b2b/MerchantDashboardScreen.tsx` | B2B control plane, entry card/CTA | High (entry point) | Low | Giữ làm điểm vào chính, thêm CTA sang demo simulator |
| `src/screens/b2b/AiReceptionistSetupChecklistScreen.tsx` | Read-only setup/cutover checklist | Medium-High | Low | Có thể thêm CTA “Run simulated demo call” từ đây |
| `src/screens/b2b/InboundQueueScreen.tsx` | Queue xử lý yêu cầu chờ | Medium | Medium-High (đang gọi `confirmBooking`) | Không đặt demo call ở đây; chỉ deep-link preview sau khi simulate |
| `src/screens/b2b/SmartCalendarScreen.tsx` | B2B operational cockpit + financial/voice mock panels | Medium | High (nhiều state “đang hoạt động”, có mock transaction panel) | Không làm điểm khởi tạo demo; giữ cho phase vận hành |
| `src/components/b2b/VoiceAiReceptionistMerchantPanel.tsx` | Hiển thị lịch sử call demo tĩnh | High (reuse component/data) | Low | Reuse cho transcript/recording preview trong demo simulator |
| `src/services/ai/voiceReceptionistB2bDemo.ts` | Dataset demo call handled | High | Low | Reuse trực tiếp làm sample scripts/timeline |
| `src/screens/AiEyeScreen.tsx` | Camera OCR/vision flow | No | High | Không dùng cho receptionist demo |
| `src/services/ai/VoiceReceptionistService.ts` | Mock function-calling pipeline, có thể mutate store | Medium | High (có add booking/order state) | Không gọi trực tiếp trong Demo UX Phase 3 nếu muốn zero side-effect |

## 3. Recommended Demo UX
- **Industry selector**
  - Dropdown/chips: `Nail & Spa`, `Restaurant`, `Homestay`, `Wholesale`.
  - Chỉ đổi script/sample text local trong UI.
- **Sample script**
  - Hiển thị 2-3 mẫu hội thoại ngắn theo ngành và ngôn ngữ (vi/en/de/cs).
  - Không gọi model/runtime.
- **Simulated call timeline**
  - Timeline local state: `Incoming` -> `Greeting` -> `Intent captured` -> `Needs merchant confirmation`.
  - Chạy bằng timer client-side, không persistence.
- **Transcript preview**
  - Reuse style từ `VoiceAiReceptionistMerchantPanel` + data từ `voiceReceptionistB2bDemo.ts`.
  - Gắn watermark “SIMULATED DEMO”.
- **Booking request preview**
  - Chỉ render “request card preview”, không gọi booking store mutation.
  - CTA duy nhất: “Review in queue (demo view only)” (nếu có, chỉ navigate).
- **Merchant confirmation required label**
  - Badge cố định: “Merchant confirmation required”.
  - Copy rõ: Beta/Pilot only, AI may make mistakes.
- **No backend side effects**
  - Không gọi API/network/voice pipeline.
  - Không tạo call log production.
  - Không ghi booking/order/inventory/payment state.

## 4. Safety Boundaries
- no Twilio
- no OpenAI/Gemini
- no API
- no DB write
- no booking mutation
- no fake production call logs

Chi tiết boundary theo codebase hiện tại:
- Tránh gọi `processVoiceUtterance` trong `src/api/voicePipeline.ts` (đi vào OpenAI services).
- Tránh gọi `executeBooking` / `executeWholesaleOrder` trong `src/services/ai/VoiceReceptionistService.ts` (mutate booking/order store).
- Không dùng flows trong `SmartCalendarScreen` có “mock transaction” panel như production-like path.
- Chỉ dùng demo data tĩnh như `VOICE_RECEPTIONIST_DEMO_HANDLED`.

## 5. Proposed Code Task
1. **Tạo 1 screen mới** `src/screens/b2b/AiReceptionistDemoSimulatorScreen.tsx`:
   - local-only state machine (industry, language, timeline step).
   - render transcript preview từ `voiceReceptionistB2bDemo.ts`.
   - render booking request preview card (read-only).
2. **Thêm 1 route B2B gated** trong `App.tsx`:
   - chỉ mở khi `b2bAiReceptionistDemoEnabled || b2bAiReceptionistPilotEnabled`.
   - fallback `MvpSurfaceDisabledScreen` khi cả hai false.
3. **Thêm CTA điều hướng** từ:
   - `MerchantDashboardScreen` card “Lễ Tân AI”.
   - (optional) `AiReceptionistSetupChecklistScreen`.
4. **Safety copy bắt buộc trên screen mới**:
   - “SIMULATED DEMO”
   - “No real call is placed”
   - “Merchant confirmation required”
   - “Production automation requires setup and approval”.
5. **Không gọi**:
   - `VoiceReceptionistService` mutation methods
   - `voicePipeline` / OpenAI services
   - bất kỳ API/network write path nào.
