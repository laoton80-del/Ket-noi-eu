# VIONA / ViGlobal Phase B Readiness Check

## 1. Executive Summary
- Đã làm xong phần chính của Phase B: frontend pilot request, consent bắt buộc, API client, backend email relay endpoint, validation, auth + rate limit, runbook manual ops, và env/ops checklist.
- Public brand trên bề mặt AI Receptionist đang dùng đúng `VIONA` trong UI copy và email subject/message.
- Vẫn còn naming legacy `ket-noi-global`/`viGlobal` ở package/service nội bộ; hiện chưa thấy rò rỉ trực tiếp vào luồng public AI Receptionist, nhưng nên chuẩn hóa dần.
- Chưa ready để smoke test email relay trong môi trường hiện tại vì thiếu env bắt buộc.
- Chưa ready để merchant pilot thủ công vì còn blocker vận hành (owner/SLA/log location/retention ownership chưa chốt).

## 2. Git / Build Status
- Git status summary: sạch (không có file modified/untracked tại thời điểm kiểm tra).
- Recent commits liên quan:
  - `b3dcfac` docs: add AI receptionist manual pilot readiness audit
  - `3d8ef27` docs: add AI receptionist phase B env and ops checklist
  - `621b1c7` docs: add AI receptionist manual ops runbook
  - `5366972` docs: add AI receptionist lead capture decision and verification
  - `385adf1` feat(ai-receptionist): connect pilot request to email relay
  - `c3cbcc3` feat(ai-receptionist): add authenticated pilot lead email relay
- Typecheck result: pass (`tsc --noEmit` exit code 0).
- Lint result: pass với warnings (0 errors, 51 warnings).

## 3. AI Receptionist Lead Capture Flow
| Layer | File | Expected | Current Status | Notes |
|------|------|----------|----------------|------|
| Frontend form | `src/screens/b2b/AiReceptionistPilotRequestScreen.tsx` | Có pilot request form và submit endpoint Phase B | Done | Form đầy đủ field và local fallback khi gửi fail |
| Consent checkbox | `src/screens/b2b/AiReceptionistPilotRequestScreen.tsx` | Bắt buộc consent trước submit | Done | Block submit nếu `consentAccepted=false` |
| API client | `src/services/api/aiReceptionistLeadApi.ts` | POST đúng endpoint `/api/ai-receptionist/pilot-leads/email` | Done | Dùng `restApiFetchJson` chuẩn hiện có |
| Backend controller | `src/controllers/AiReceptionistLeadController.ts` | Verify auth + consent + relay + response an toàn | Done | Trả `503` khi not configured, không fake success |
| Route | `src/routes/aiReceptionistLeadRoutes.ts` | Route POST có middleware bảo vệ | Done | Có `authMiddleware`, rate limit, `validateBody` |
| Validation | `src/validation/aiReceptionistLeadSchema.ts` | Validate strict fields + consent true + contact rule | Done | `z.literal(true)` + `superRefine` contact phone/email |
| Email relay service | `src/services/ai-receptionist/AiReceptionistLeadEmailService.ts` | Gửi email nội bộ, fail nếu thiếu config, không lộ secret | Done | Có `not_configured`, HTML escape, không log payload PII |
| App mount | `src/app.ts` | Mount router an toàn trong API stack | Done | `app.use('/api/ai-receptionist', aiReceptionistLeadRouter)` |
| Rate limit | `src/routes/aiReceptionistLeadRoutes.ts` | Chặn abuse theo IP | Done | `max: 5` mỗi `60_000ms` |
| Auth | `src/routes/aiReceptionistLeadRoutes.ts` | Bắt buộc authenticated session | Done | `authMiddleware` bắt buộc |
| No DB write | Flow Phase B | Không ghi DB lead | Done | Không thấy Prisma/DB write trong lead flow |
| No payment/Twilio/AI/booking mutation | Flow Phase B | Không side effect production | Done | Không gọi payment, Twilio runtime, AI runtime, booking mutation |

## 4. Env Presence Check
| Env Key | Present? | Required For | Notes |
|---------|----------|--------------|------|
| `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL` | Missing | Internal lead recipient | P0 cho smoke test/pilot |
| `AWS_SES_SENDER_EMAIL` | Missing | Sender identity (one supported option) | Có thể thay bằng env sender tương đương |
| `SES_FROM_EMAIL` | Missing | Sender fallback option | Optional theo implementation |
| `MAIL_FROM` | Missing | Sender fallback option | Optional theo implementation |
| `AWS_REGION` | Missing | SES/AWS transport config | P0 cho gửi mail |
| `AWS_ACCESS_KEY_ID` | Missing | AWS auth (nếu không dùng IAM role) | Có thể thay bằng IAM role runtime |
| `AWS_SECRET_ACCESS_KEY` | Missing | AWS auth pair (nếu dùng key) | Không cần nếu dùng IAM role đúng |
| `DATABASE_URL` | Missing | General backend boot/dependencies | Không bắt buộc riêng cho Phase B relay logic |
| `JWT_SECRET` | Missing | Auth token verification | P0 vì endpoint yêu cầu auth |

## 5. ViGlobal / VIONA Naming Check
| Area | Current Naming | Should Change? | Recommendation |
|------|----------------|----------------|----------------|
| Public UI copy (pilot screen) | `VIONA` | No (đã đúng) | Giữ nguyên |
| Public points naming | `VIO` patterns trong app | No (đúng chiến lược public brand) | Giữ `VIO Points` / `VIO Credits` cho public copy |
| Internal legacy modules | Có `viGlobal*` service names, package `ket-noi-global` | Optional | P2 chuẩn hóa dần, không block pilot |
| Email subject/body Phase B | Subject/body dùng `VIONA` | No (đã đúng) | Giữ nguyên |
| Env naming | `VIONA_*` cho lead recipient | No (đã đúng) | Tiếp tục ưu tiên prefix `VIONA_*` cho surface mới |

## 6. Email Relay Readiness
- Recipient env present? **No**
- Sender env present? **No**
- SES/AWS region present? **No**
- Missing config behavior có `503` không? **Yes** (`LEAD_CAPTURE_NOT_CONFIGURED` trong controller).
- Endpoint có fake success không? **No** (trả fail rõ ràng khi relay fail/not configured).
- Logs có tránh PII không? **Mostly yes** (controller log chỉ `authUserId`; service không log payload lead).

Kết luận phần relay: code path an toàn, nhưng runtime config hiện chưa đủ để chạy smoke test thành công.

## 7. Manual Ops Readiness
Theo docs hiện tại:
- Primary owner: **Chưa xác định**
- Backup owner: **Chưa xác định**
- SLA: **Chưa xác định**
- Lead log location: **Chưa xác định**
- Retention rule: **Đã có đề xuất** (tối đa 180 ngày, xóa sớm theo yêu cầu)
- Follow-up templates: **Đã có** (Template A/B/C trong runbook)

Kết luận ops: tài liệu đủ khung, nhưng ownership vận hành thực tế chưa khóa.

## 8. Smoke Test Plan
- Success path:
  - Đăng nhập merchant hợp lệ
  - Submit payload hợp lệ với `consentAccepted=true`
  - Verify API success + email vào inbox nội bộ
- Missing recipient env -> `503`:
  - Bỏ `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL`
  - Verify response `503` + message `LEAD_CAPTURE_NOT_CONFIGURED`
- Consent false:
  - Gửi với `consentAccepted=false`
  - Verify `400`
- Auth missing:
  - Gọi endpoint không token/session
  - Verify `401`
- Validation error:
  - Thiếu `businessName` hoặc thiếu cả phone/email
  - Verify `400` từ schema validation
- Network fail frontend:
  - Giả lập unreachable API
  - Verify UI fallback local draft + không fake success

## 9. Required Changes
| Priority | Change Needed | Reason | File/Area |
|----------|---------------|--------|-----------|
| P0 | Set env tối thiểu cho relay/auth (`recipient`, sender option, region, auth secret) | Không thể smoke test/pilot nếu thiếu | Runtime environment |
| P0 | Chốt primary/backup owner + SLA + shift + lead log location | Blocker vận hành manual triage | Ops process / runbook execution |
| P0 | Chạy và lưu bằng chứng smoke test success + failure path 503 | Cần bằng chứng readiness trước merchant thật | Ops checklist execution |
| P1 | Chuẩn hóa follow-up template thành playbook áp dụng bắt buộc theo status | Giảm lệch triage giữa operators | `docs/ai-context/AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md` |
| P1 | Chốt retention cadence và người chịu trách nhiệm purge | Tránh tồn lưu dữ liệu quá hạn | Ops governance |
| P2 | Dọn naming legacy `ViGlobal/VIG` nội bộ không còn cần thiết | Đồng bộ thương hiệu dài hạn, không block pilot | Internal module naming |

## 10. Final Recommendation
**C. Need env/ops cleanup first.**

Lý do:
- Code path Phase B đã đủ để chạy manual email relay an toàn.
- Nhưng runtime env đang thiếu và manual ops ownership chưa chốt, nên chưa đạt ngưỡng mở merchant pilot.

