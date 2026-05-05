# VIONA AI Receptionist Manual Ops Runbook

## 1. Purpose
Runbook này hướng dẫn team VIONA xử lý pilot lead gửi từ AI Receptionist Pilot Request form trong Phase B (email/manual ops), đảm bảo an toàn sản phẩm, quyền riêng tư, và không kích hoạt production automation ngoài quy trình phê duyệt.

## 2. Required Environment
- `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL`
- Sender email env hiện có trong hệ thống mail:
  - `SES_FROM_EMAIL` hoặc
  - `MAIL_FROM` hoặc
  - `AWS_SES_SENDER_EMAIL`
- SES/AWS env (nếu email relay dùng SES):
  - `AWS_REGION` (hoặc `SES_REGION`)
  - `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` (hoặc runtime role hợp lệ)

## 3. Lead Intake Flow
1. Merchant submit pilot request form trong app.
2. Backend kiểm tra auth + validation + consent (`consentAccepted=true`).
3. Email relay gửi lead vào inbox nội bộ.
4. Team VIONA review thủ công theo checklist.
5. Chỉ sau review mới có bước follow-up phù hợp.
6. Không có automatic activation trong flow này.

## 4. Triage Checklist
Khi nhận lead email, kiểm tra tối thiểu:
- merchant business type (industry)
- location/country
- contact info present (ít nhất email hoặc phone)
- consent accepted
- languages needed
- missed calls estimate
- desired automation
- readiness level (ops/technical)

Suggested quick tags:
- `INDUSTRY_OK`
- `CONTACT_OK`
- `CONSENT_OK`
- `READINESS_LOW|MEDIUM|HIGH`

## 5. Pilot Qualification
Định nghĩa trạng thái triage:
- **qualified**
  - thông tin đầy đủ, consent hợp lệ, use case phù hợp pilot scope.
- **needs more info**
  - thiếu dữ liệu quan trọng (contact/reachability/automation scope/readiness detail).
- **not ready**
  - merchant chưa sẵn sàng về vận hành hoặc kỳ vọng vượt quá Phase B.
- **rejected**
  - không phù hợp policy, rủi ro cao, hoặc yêu cầu ngoài phạm vi an toàn hiện tại.

## 6. Safety Rules
- No production AI phone activation from email lead alone.
- No payment from this flow.
- No booking mutation from this flow.
- No inventory/bill/payment automation from this flow.
- No Twilio connection until approved technical setup and cutover process.
- No sensitive PII sharing outside authorized team.
- Mọi cam kết với merchant phải nêu rõ: review thủ công, không auto-approval.

## 7. Follow-up Templates
### Template A — Request More Information
Subject: VIONA AI Receptionist Pilot - Need Additional Information

Hello {{contactName}},

Thank you for your AI Receptionist pilot request.
To continue the review, please share the following:
- Business hours and peak call times
- Primary services to be handled in pilot
- Preferred contact channel and best time to reach you

Your request is under manual review. No production AI phone activation is performed at this stage.

Best regards,  
VIONA Operations Team

### Template B — Invite to Demo Call
Subject: VIONA AI Receptionist Pilot - Demo Review Invitation

Hello {{contactName}},

Your pilot request looks suitable for the next review step.
We would like to invite you to a short demo review call to confirm:
- service setup expectations
- language support needs
- pilot readiness timeline

Please reply with your preferred time slots.
Note: this process does not activate production AI phone automation.

Best regards,  
VIONA Operations Team

### Template C — Not Ready / Waitlist
Subject: VIONA AI Receptionist Pilot - Waitlist Update

Hello {{contactName}},

Thank you for your interest in VIONA AI Receptionist pilot.
At this moment, your request is marked as not ready for active pilot onboarding.
Reason: {{highLevelReason}}

We can place your request in the waitlist and follow up when the required setup is available.
No production activation has been performed.

Best regards,  
VIONA Operations Team

## 8. Privacy / Retention
- Personal data (name/phone/email) phải được xử lý theo nguyên tắc need-to-know.
- Không forward email lead ra ngoài nhóm được ủy quyền.
- Hạn chế copy/paste PII vào công cụ không được phê duyệt.
- Hỗ trợ deletion/export request theo quy trình privacy nội bộ.
- Default retention suggestion cho Phase B: tối đa 180 ngày nếu không chuyển sang pilot active workflow.
- Không lưu bản sao không cần thiết ở kênh chat cá nhân.

## 9. Escalation
Escalate sang founder/engineering review khi gặp:
- multi-location merchant cần kiến trúc nâng cao
- yêu cầu payment automation
- yêu cầu phone production activation
- legal/medical/high-risk business domain
- bất kỳ yêu cầu vượt scope Phase B manual ops

## 10. Next Phase Criteria
Chuyển sang DB-backed lead capture khi:
- pilot volume đủ lớn, email triage không còn hiệu quả
- cần admin review flow có trạng thái/ownership rõ ràng
- manual email không còn đáp ứng SLA vận hành
- GDPR retention/export/delete workflow được approve chính thức
- contract + schema + security controls cho Phase C đã khóa và được duyệt

