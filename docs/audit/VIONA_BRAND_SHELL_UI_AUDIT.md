# VIONA Brand Shell UI Audit

## 1. Executive Summary
- App vẫn còn cảm giác ViGlobal/KNG cũ tập trung ở các bề mặt public lớn: `Home`, `Local`, `DashboardB2C`, một phần `MainTabNavigator` và copy trạng thái hệ thống trong `App.tsx`.
- Nên đổi UI theo lớp (shell first) thay vì đổi toàn bộ một lần: ưu tiên lớp nhìn thấy ngay (hero, tabs, headline cards, badge/copy), giữ nguyên logic/gates/flows.
- Có thể refresh ngay ở mức P0 vì phần lớn là text/tone/token/cấu trúc visual; rủi ro phá logic thấp nếu khóa phạm vi “UI copy + style only”.
- Rủi ro chính không nằm ở code logic mà ở phạm vi thay đổi quá rộng: cần chia đợt nhỏ theo shell để tránh drift và regression UX.

## 2. Public Brand Surface Inventory
| Screen/File | Current Brand Feel | ViGlobal/KNG/VIG Remnants | User Impact | Priority |
|-------------|-------------------|---------------------------|-------------|----------|
| `src/screens/HomeScreen.tsx` | Dark luxury + legacy narrative | Nhiều copy “ViGlobal” (`heroSub`, `ViGlobal Briefing`, SOS ping text), class names `kn-*`, heavy gold tone | Rất cao: entry screen quyết định first impression | P0 |
| `src/screens/b2c/DashboardB2CScreen.tsx` | Multi-universe cards nhưng legacy naming | Card titles `KNG LOCAL`, `KNG TRAVEL`, `KNG ACADEMY`, copy `KNG Travel first` | Rất cao: public B2C shell trung tâm | P0 |
| `src/screens/b2c/LocalScreen.tsx` | “Universe 02 Dark” theo style cũ | Header `ViGlobal Local`, copy “chuẩn ViGlobal”, `ViGlobal Transit`, alert title `ViGlobal` | Rất cao: local discovery public surface | P0 |
| `src/navigation/MainTabNavigator.tsx` | Tab architecture tốt nhưng text chưa đồng nhất brand shell | Alert title còn `Kết Nối Global`, mixed VN/EN copy style | Cao: global nav chrome | P0 |
| `App.tsx` | Navigation/gates tốt nhưng system copy cũ | Maintenance message: `Kết Nối Global is temporarily unavailable.`; route labels còn legacy naming | Cao: app-wide trust copy | P0 |
| `src/screens/b2b/MerchantDashboardScreen.tsx` | Khá gần VIONA trust tone | Vẫn dùng formatter `formatVigTokenNumber`, một số copy chưa chuẩn VIO display/public wording | Trung bình-cao: merchant demo surface | P1 |
| `src/screens/WalletTopUpScreen.tsx` | Có VIO disclaimer đúng hướng | Còn nhiều “legacy tech feel”/mixed copy, visual density cao, chưa thống nhất shell language | Trung bình: financial UI nhạy cảm | P1 |
| `src/screens/b2b/AiReceptionistSetupChecklistScreen.tsx` | Safety-first, tương đối chuẩn | Chủ yếu English ops tone; chưa có “VIONA brand shell polish” nhất quán | Trung bình: pilot readiness context | P1 |
| `src/screens/b2b/AiReceptionistDemoSimulatorScreen.tsx` | Demo card tốt, rõ safety | Mixed language, style có thể đồng bộ mạnh hơn với VIONA shell | Trung bình | P1 |
| `src/screens/b2b/AiReceptionistPilotRequestScreen.tsx` | Consent/safety tốt | Copy tone tốt nhưng visual shell chưa đồng bộ hoàn toàn với core Home/B2C refresh | Trung bình | P1 |

## 3. VIONA Shell Refresh Scope
Scope nhỏ nhất nên làm trước:
- Home/Hero
- Main tabs
- Merchant dashboard (chỉ lớp copy/header/card tone)
- AI Receptionist card/screens (title/kicker/badge/disclaimer tone)
- VIO display surfaces (đảm bảo public là `VIO Points` / `VIO Credits`)
- Disabled/coming soon screens
- Paywall headline/copy

## 4. Do Not Touch
- Prisma
- auth
- payment
- booking logic
- wallet math
- broker backend
- API contracts
- migration
- feature flags logic

## 5. Proposed Design Direction
- **Clean Tech Trust**: sáng, rõ, giảm “heavy dark-gold dominance” ở public shell.
- **Soft Premium**: premium tinh gọn, không dùng luxury motif dày đặc.
- **Human + AI**: copy thể hiện AI hỗ trợ + con người xác nhận, tránh hype.
- **Palette định hướng**: VIO Blue / Ink / Warm Ivory.
- **Accent**: light gold chỉ dùng nhấn hierarchy quan trọng (badge/trust marker), không dùng làm nền mặc định.

## 6. Implementation Plan
### A. Brand shell constants/check
- Audit và chuẩn hóa token/copy qua `brandConfig` + VIO display labels.
- Chuẩn hóa headline/eyebrow/maintenance copy về VIONA.

### B. Home + Merchant Dashboard refresh
- Refresh `HomeScreen` hero, briefing labels, utility strip, trust copy.
- Polish `MerchantDashboardScreen` headline cards và token naming hiển thị.

### C. AI Receptionist surfaces polish
- Đồng bộ tone/kicker/title/disclaimer across setup/demo/pilot.
- Giữ nguyên toàn bộ gates + backend integration behavior.

### D. Wallet/VIO display final polish
- Chuẩn hóa hiển thị `VIO Credits`/`VIO Points` trên wallet-facing copy.
- Giảm “legacy mixed tone”, tăng clarity cho trust/finance labels.

### E. Full mini-app consistency later
- Local/Travel/Academy/broker/admin remaining harmonization.
- Chỉ làm sau khi P0/P1 ổn định và có baseline visual QA.

## 7. Recommended Next Code Task
**VIONA Brand Shell Refresh P0 — Home + DashboardB2C + Local + MainTab copy only**

Phạm vi đề xuất:
- Chỉ đổi UI copy/token/style/layout nhỏ.
- Không đổi navigation logic, feature flags, API call, payment/wallet behavior.

