# VIONA.WAVE_3B.TRAVEL_LOCAL_SUPPORT_NOT_JUST_MAP_COPY_CLARITY.1

## Goal
Clarify Travel “Hỗ trợ địa phương” is a **Local Support / Local Fixer bridge** — map/location pulse is visual context only.

## Copy (via existing i18n + TravelScreen clarity strings)
| Layer | Text |
|-------|------|
| Section kicker | HỖ TRỢ LOCAL LIÊN KẾT |
| Title | Hỗ trợ địa phương (Local) |
| Subtitle | Thổ địa & fixer Local — tách khỏi thẻ tình huống Travel. |
| Inner card title | Người hỗ trợ địa phương |
| Inner line 1 | Theo vị trí hoặc điểm đến của bạn |
| Inner line 2 | Dịch vụ thay đổi theo quốc gia sở tại |
| Map hint | Minh họa vị trí — bản đồ chỉ là lớp ngữ cảnh, không phải đặt dịch vụ. |
| Safety note | Không xác nhận đặt chỗ · không cam kết fixer · không thanh toán · không điều phối. |
| CTA | Mở Local guides |

## Visual changes
- Emerald accent (Local support semantic) vs destination cyan panel
- Title uses panel title style (not hero kicker)
- **Inner support card** above map (people icon + three semantic lines)
- Map shell = grid + pulse ring + pin + optional coords (tertiary)
- Safety disclaimer below map, before CTA

## Safety
- No booking/payment/dispatch/guaranteed fixer claims
- Route/handler unchanged (`LocalFixer` navigation preserved)
- GPS coords shown only as context when available — not product meaning

## File
- `src/screens/b2c/TravelScreen.tsx`
