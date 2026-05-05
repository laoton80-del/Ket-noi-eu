# VIONA Expo Web Bundle 500 Audit

## 1. Executive Summary
- Nguyên nhân chính của `index.ts.bundle` trả `500` là lỗi Babel transform, cụ thể thiếu module `react-refresh/babel` trong runtime bundling.
- Cảnh báo CSP/eval không phải nguyên nhân gốc của trắng trang trong case này; lỗi xảy ra trước ở bước Metro/Babel compile.
- Lỗi phát sinh từ entry `index.ts` khi Metro dùng `babel-preset-expo` và cố load `react-refresh/babel` nhưng không tìm thấy module.
- Các file AI Receptionist mới được kiểm tra import/export không thấy mismatch rõ ràng; `typecheck` pass cũng ủng hộ việc không phải lỗi TypeScript import ở các file này.

## 2. Bundle Error
Message chính từ JSON response của bundle URL:

```text
{"type":"TransformError","lineNumber":0,"name":"SyntaxError","message":"index.ts: [BABEL] C:\\KNG\\ket-noi-eu\\index.ts: Cannot find module 'react-refresh/babel' ..."}
```

Chi tiết stack cũng lặp lại:
- `Cannot find module 'react-refresh/babel'`
- While processing `babel-preset-expo`

## 3. Metro/Expo Terminal Error
Lỗi đầu tiên từ terminal Metro:

```text
Web Bundling failed 770ms index.ts (1 module)
ERROR  Error: [BABEL] C:\KNG\ket-noi-eu\index.ts: Cannot find module 'react-refresh/babel'
```

## 4. Suspect Files
| File | Issue | Evidence | Recommended Fix |
|------|-------|----------|-----------------|
| `index.ts` | Entry file bị fail ở Babel transform (không phải logic trong file) | Error JSON và Metro đều trỏ `index.ts: [BABEL] ... Cannot find module 'react-refresh/babel'` | Không đổi code file; fix dependency/config runtime |
| `package.json` | Thiếu dependency `react-refresh` | Không có `react-refresh` trong dependencies/devDependencies | Cài `react-refresh` (dev dependency) để Babel preset resolve được plugin |
| `babel.config.js` | Dùng `babel-preset-expo` (đúng), preset này cần resolve `react-refresh/babel` cho web dev | Stack trace đi qua `node_modules/babel-preset-expo/build/index.js` | Giữ config hiện tại; chỉ bổ sung dependency thiếu |
| `App.tsx` | Dự án đang điều hướng chính bằng React Navigation trong `App.tsx` | `index.ts` import `App`, app hoạt động theo stack/tabs trong `App.tsx` | Không phải nguồn lỗi 500 |
| `src/navigation/routes.ts` | Route types compile bình thường | `npm run typecheck` pass | Không cần sửa cho lỗi này |
| `src/screens/b2b/AiReceptionistSetupChecklistScreen.tsx` | Không thấy import mismatch | Imports nội bộ hợp lệ, typecheck pass | Không phải nguyên nhân bundle 500 |
| `src/screens/b2b/AiReceptionistDemoSimulatorScreen.tsx` | Không thấy import mismatch | Imports hợp lệ, không có lỗi compile TS | Không phải nguyên nhân bundle 500 |
| `src/screens/b2b/AiReceptionistPilotRequestScreen.tsx` | Không thấy import mismatch | Imports service/type hợp lệ, typecheck pass | Không phải nguyên nhân bundle 500 |
| `src/services/api/aiReceptionistLeadApi.ts` | Không thấy export/import mismatch | Export function/type rõ ràng, không conflict | Không phải nguyên nhân bundle 500 |

## 5. Safe Fix Plan
Fix nhỏ nhất, an toàn, chưa sửa code ngay:
1. Cài dependency thiếu:
   - `npm i -D react-refresh`
2. Xóa cache và restart web:
   - `npx expo start --web --clear`
3. Re-test bundle URL cũ để xác nhận hết `TransformError`.
4. Nếu vẫn còn issue sau bước 1-3, mới điều tra tiếp nhánh Expo Router (`routerRoot=src/app`) do project hiện chạy chính bằng `App.tsx` nhưng Metro đang detect `src/app`.

Ghi chú về `routerRoot=src/app`:
- Metro log có dòng `Using src/app as the root directory for Expo Router.`
- Đây cho thấy runtime đang bật logic Expo Router root detection (do cấu trúc thư mục), dù app chính dùng `App.tsx`.
- Trong lỗi hiện tại, đây **không** phải root cause trực tiếp của 500; lỗi chặn trước là missing `react-refresh/babel`.

## 6. Final Recommendation
**A. Apply small import/route fix.**

Diễn giải:
- Ưu tiên fix nhỏ: bổ sung dependency runtime thiếu (`react-refresh`) và retest.
- Chưa cần refactor router/config lớn ở bước này.

