# VIONA AI Receptionist Manual Pilot Readiness Audit

## 1. Executive Summary
- Có thể chạy **manual demo/pilot với merchant thật** ở mức Phase B, với điều kiện env email relay được cấu hình và test vận hành trước merchant đầu tiên.
- Còn thiếu trước merchant đầu tiên: xác nhận runtime env (`recipient/sender/SES`) + diễn tập runbook một vòng end-to-end.
- Rủi ro production activation nhầm hiện tại thấp: flow hiện có copy safety rõ, manual review gate, và không có auto activation logic.

## 2. Readiness Checklist
| Area | Ready? | Evidence | Gap | Recommendation |
|------|--------|----------|-----|----------------|
| frontend funnel | Yes | Demo simulator + pilot request flow đã chạy với backend relay | None | Giữ flow hiện tại cho manual pilot |
| consent | Yes | Checkbox bắt buộc + submit blocked khi chưa consent | None | Giữ wording theo contract |
| email relay | Yes | Endpoint relay + service trả fail nếu misconfigured | Env chưa xác nhận trên runtime thật | Test send thật vào inbox ops trước merchant đầu tiên |
| env config | Partial | Runbook đã liệt kê env bắt buộc | Chưa có bằng chứng cấu hình production/staging | Tạo checklist deploy + smoke test |
| validation | Yes | Zod schema enforce required fields + consent + contact rule | None | Giữ strict schema |
| auth | Yes | `authMiddleware` trên route lead capture | None | Không mở public endpoint |
| rate limit | Yes | Route limiter 5 req/min/IP | None | Theo dõi abuse logs ban đầu |
| manual ops runbook | Yes | Runbook đã tạo đủ purpose/triage/template/escalation | Cần owner on-call rõ cho vận hành | Chỉ định người trực triage theo ca |
| privacy/retention | Partial | Contract + runbook nêu handling + retention suggestion | Chưa có thực thi retention tự động (Phase B email) | Áp dụng chính sách xóa thủ công định kỳ |
| no auto activation | Yes | UI/backend không có bước activate production phone | None | Tiếp tục lock bằng policy |
| no payment | Yes | Không gọi payment flow từ lead capture | None | Keep out of scope |
| no booking mutation | Yes | Không booking write từ lead flow | None | Keep out of scope |
| no Twilio | Yes | Không Twilio integration trong flow này | None | Chưa bật phone runtime |
| no AI runtime | Yes | Không OpenAI/Gemini/voice runtime call trong flow này | None | Giữ simulated/demo-only |

## 3. Merchant Demo Flow
Safe demo flow hiện tại:

`Merchant Dashboard` -> `Setup Checklist` -> `Demo Simulator` -> `Pilot Request` -> `Email relay` -> `Manual review`

Flow này không kích hoạt production phone automation và không tạo payment/booking mutation.

## 4. Required Environment Before Pilot
Env bắt buộc cần set và verify:
- `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL`
- `AWS_SES_SENDER_EMAIL` hoặc sender env hiện có (`SES_FROM_EMAIL` / `MAIL_FROM`)
- AWS/SES config tương ứng:
  - `AWS_REGION` (hoặc `SES_REGION`)
  - credentials/role hợp lệ cho SES send

## 5. Do Not Enable Yet
- Twilio real number
- AI phone runtime
- auto booking
- payment
- inventory
- bill printing
- DB-backed lead capture nếu chưa approve Phase C

## 6. Pilot Ops Checklist
Khi có lead mới, team cần:
- verify contact info
- classify lead (qualified / needs more info / not ready / rejected)
- schedule demo call
- confirm consent context
- review merchant readiness
- do not activate phone production
- document outcome manually

## 7. Remaining Risks
| Risk | Severity | Recommendation |
|------|----------|----------------|
| Email relay env thiếu/sai khiến lead không được chuyển vào inbox ops | High | Bắt buộc smoke test relay trước pilot thật |
| Phase B email workflow chưa có retention automation | Medium | Thiết lập lịch purge thủ công và owner chịu trách nhiệm |
| Manual triage có thể không đồng nhất giữa operators | Medium | Áp dụng checklist + template bắt buộc từ runbook |

## 8. Final Recommendation
**B. Need docs/env cleanup first.**

Lý do:
- Nền tảng kỹ thuật và safety controls đã đủ cho manual pilot.
- Blocker còn lại chủ yếu là vận hành thực thi: xác nhận env/email relay hoạt động thật và chốt ownership quy trình thủ công trước merchant đầu tiên.

