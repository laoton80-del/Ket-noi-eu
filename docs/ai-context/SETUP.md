# Setup Guide

## Requirements

- **Node.js:** tương thích với Expo 54 / RN 0.81 (kiểm tra `package.json` engines nếu có — **Chưa xác định** `engines` field; dùng Node LTS khuyến nghị bởi Expo).
- **npm** (hoặc yarn/pnpm nếu team dùng — mặc định doc dùng **npm** theo script repo).
- **PostgreSQL** (local hoặc cloud: Neon, Supabase, RDS…).
- **Tài khoản AWS** (SES) nếu chạy email OTP thật.
- **(Tuỳ chọn)** Expo CLI, EAS CLI cho build; Xcode / Android Studio cho native build.

## Installation

```bash
git clone <repo-url>
cd ket-noi-eu
npm install
```

Nếu có xung đột peer dependency, team có thể dùng `npm install --legacy-peer-deps` — **Chưa xác định** chính sách cố định; ưu tiên log lỗi cài đặt.

Sinh Prisma client:

```bash
npm run db:generate
```

## Environment Variables

**Không** copy giá trị thật vào doc. Tạo file **`.env`** ở root từ **`.env.example`**.

| Biến (từ .env.example / code) | Mục đích |
|-------------------------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (bắt buộc cho Prisma) |
| `JWT_SECRET` | Ký JWT — tối thiểu 16 ký tự cho luồng OTP/login |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | SES gửi mail |
| `AWS_SES_SENDER_EMAIL` hoặc alias `SES_FROM_EMAIL` / `MAIL_FROM` | Địa chỉ From đã verify SES |
| `API_PORT` | Cổng API (mặc định 8787 nếu không set) |
| `API_CORS_ORIGINS` | Danh sách origin CORS (tuỳ chọn) |
| `TRUST_PROXY_HOPS` | Tin proxy (reverse proxy) |
| `STRIPE_WEBHOOK_SECRET` | Xác minh webhook (server) — **bắt buộc cho production webhook** |
| `MARKETING_AUTO_POSTER_ENABLED` | Set `0` để tắt auto poster khi chạy API local (`server.ts`) |

**Client / Expo (build):** xem `app.config.js` — `EXPO_PUBLIC_*`, `STRIPE_PUBLISHABLE_KEY`, Mapbox, `EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER` (Apple Pay), `GOOGLE_SERVICE_INFO_PLIST`, `GOOGLE_SERVICES_JSON`. Chi tiết bảo mật client vs server: `src/config/env.ts`.

## Local Development

**Expo (app):**

```bash
npm start
# hoặc
npm run android
npm run ios
npm run web
```

**API Node:**

```bash
npm run api:dev
```

Đảm bảo `.env` có `DATABASE_URL` + `JWT_SECRET` trước khi gọi API cần Prisma/OTP.

**Prisma migrate (dev):**

```bash
npm run db:migrate
```

## Build

- **Web export:** `npm run build:web` (Expo export + fix fonts).
- **Firebase functions:** `npm run functions:build` trong workspace prefix `functions/`.

## Test

| Script | Ý nghĩa |
|--------|---------|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run smoke` | Script smoke release |
| `npm run preflight` | typecheck + smoke |
| `npm run lint` | Expo ESLint |
| `npm run test:core-flow` | TS test core flow |

## Deploy

- **Chưa xác định** pipeline CI/CD chi tiết trong repo — xem `docs/RELEASE_DISCIPLINE.md`, `docs/G3_APP_CHECK_AND_RELEASE.md`.
- API triển khai như process Node (Docker/hosting) với env inject.
- Mobile: EAS Build (`eas.json` nếu có — **Chưa xác định** trong quét nhanh).

## Common Problems

| Triệu chứng | Gợi ý |
|-------------|--------|
| API 500 "Authentication service unavailable" khi OTP | `JWT_SECRET` thiếu hoặc &lt; 16 ký tự |
| Không gửi được email OTP | SES credential / From chưa verify sandbox |
| Prisma errors | `DATABASE_URL` sai hoặc chưa `db:migrate` |
| Stripe webhook fail | Raw body bị parser sai — không đổi thứ tự middleware trong `app.ts` |
| `prisma generate` EPERM trên Windows | Đóng process đang giữ file (dev server) |
