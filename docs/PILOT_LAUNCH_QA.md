# Pilot launch QA (EU controlled rollout)

Structured readiness checks for **Android**, **iPhone**, and fragile paths. Mark each row **Pass / Fail / N/A** with build id and date.

## 1. Environment & install

| Check | Android | iPhone | Notes |
|--------|---------|--------|--------|
| Cold start after install | | | Splash, fonts, intent modal, no crash |
| `app_open` in growth log | | | After launch (local snapshot: Admin / debug export if available) |
| Onboarding / skip intent | | | `onboarding_complete` once |

## 2. Network

| Check | Notes |
|--------|--------|
| Weak / flaky Wi‑Fi | Wallet sync, Leona charge, interpreter session start |
| Offline → online | Retry wallet top-up verification; no duplicate charges |
| Airplane mode | Graceful errors; no white screen |

## 3. Credits

| Flow | Zero credits | Sufficient credits |
|------|----------------|-------------------|
| Live Interpreter | Block / prompt top-up | Session debits once (`first_interpreter`, `interpreter_used`) |
| Leona outbound | Low-credit banner + failed path | `first_call_attempt`, then success history |
| Vault reminders | N/A | N/A |

## 4. Vault OCR

| Input | Expected |
|--------|-----------|
| Good image (sharp, flat) | `ocr_success`, sensible expiry |
| Poor image (blur, glare) | Low confidence toast; user can edit manual |
| Parse / API failure | `ocr_fail`, manual path still works |

## 5. Live Interpreter

| Scenario | Expected |
|----------|-----------|
| Silence / no mic | Clear error or timeout; credits policy unchanged |
| Fast speech | Partial transcript OK; session recoverable |
| Mixed VI / EN | Scenario still works; no crash |

## 6. Payments

| Case | Expected |
|------|-----------|
| Stripe sheet dismissed | Top-up pending cleared; user can retry |
| Success | `successful_credit_topup`, balance updates |
| Server verify slow | “Đang chờ xác minh” path; retry works |

## 7. Calls & booking

| Path | Expected |
|------|-----------|
| Leona insufficient credits | History `failed` + inline message |
| Leona payment error | `payment_unavailable` history; return to idle |
| Le Tan booking simulation success | `successful_booking` (and usage history) |

## 8. Pilot scope (must stay true)

- **In scope:** Live Interpreter, Leona, Vault + reminders, LifeOS, Wallet, SOS, Le Tan (reception).
- **Out of scope / hidden:** Community tab off; Radar redirects to Leona when disabled; marketplace auto-book UI off unless `LAUNCH_PILOT_CONFIG.enableMarketplaceSurface`.

## 9. Launch-critical analytics (local growth log)

Canonical names (see `src/services/growth/launchEvents.ts`):

`app_open`, `onboarding_complete`, `first_interpreter`, `first_call_attempt`, `successful_credit_topup`, `successful_booking`, `ocr_success`, `ocr_fail`

Verify at least one occurrence per happy path on a clean install (where applicable).
