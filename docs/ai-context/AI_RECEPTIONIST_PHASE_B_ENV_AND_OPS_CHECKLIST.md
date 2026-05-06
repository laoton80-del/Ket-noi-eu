# VIONA AI Receptionist Phase B Env & Ops Checklist

## 1. Purpose
Checklist để xác nhận Phase B email/manual ops sẵn sàng trước merchant pilot thật.

## 2. Required Environment Variables
Required:
- `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL`
- `AWS_SES_SENDER_EMAIL` hoặc sender env tương đương (`SES_FROM_EMAIL` / `MAIL_FROM`)
- `AWS_REGION` (hoặc `SES_REGION` nếu vận hành theo cấu hình tương đương)
- `AWS_ACCESS_KEY_ID` hoặc IAM role
- `AWS_SECRET_ACCESS_KEY` nếu dùng key

Optional/implementation-dependent:
- `SES_FROM_EMAIL`
- `MAIL_FROM`
- `SES_REGION`

## 3. Email Relay Smoke Test
Checklist:
- backend running
- authenticated merchant session
- `consentAccepted` true
- valid contact email/phone
- submit pilot request
- email received by internal recipient
- email content không lộ secret
- failure path tested khi recipient env missing
- `503 LEAD_CAPTURE_NOT_CONFIGURED` verified

Suggested test evidence to store:
- test timestamp (UTC)
- test account id/role
- endpoint response payload
- screenshot/inbox proof received
- failure-path proof (503 response)

## 4. Manual Ops Owner
Chốt vận hành:
- Primary owner: **Chưa xác định**
- Backup owner: **Chưa xác định**
- Response SLA: **Chưa xác định**
- Timezone/shift coverage: **Chưa xác định**
- Manual triage record location: **Chưa xác định**

## 5. Manual Lead Log
Đề xuất Phase B thủ công:
- private spreadsheet / CRM / Notion / secure doc (chỉ team được ủy quyền truy cập)

Minimum fields:
- `receivedAt`
- `businessName`
- `countryCity`
- `contactMethod`
- `status`
- `owner`
- `nextAction`
- `retentionDeleteDate`

## 6. Retention Phase B
Đề xuất:
- giữ lead tối đa 180 ngày nếu chưa thành pilot
- xóa sớm nếu merchant yêu cầu
- không forward PII ra ngoài team được ủy quyền
- không lưu call recordings trong Phase B

Operational notes:
- review retention định kỳ (ví dụ hàng tuần)
- log lại deletion/export request và thời điểm xử lý

## 7. Triage Statuses
Định nghĩa trạng thái:
- `new`
- `contacted`
- `needs_more_info`
- `demo_scheduled`
- `qualified`
- `not_ready`
- `rejected`
- `archived`

## 8. Pilot Start Criteria
Trước khi gọi merchant là “pilot”:
- owner assigned
- merchant contacted
- merchant understands no production phone automation yet
- setup checklist reviewed
- no payment captured
- no Twilio number connected
- no auto booking enabled

## 9. Do Not Do
- không bật Twilio real number
- không bật AI phone runtime
- không tạo booking tự động
- không thu payment từ pilot form
- không lưu DB nếu Phase C chưa approve
- không forward PII tùy tiện

## 10. Final Go/No-Go Checklist
- [ ] env set
- [ ] smoke test success
- [ ] failure path tested
- [ ] owner assigned
- [ ] backup owner assigned
- [ ] manual lead log ready
- [ ] retention rule approved
- [ ] follow-up templates ready

## 11. Recommendation
- Nếu checklist chưa đủ -> **Not ready for merchant pilot**
- Nếu checklist đủ -> **Ready for manual pilot demo**

Current recommendation (based on known blockers): **Not ready for merchant pilot** until env proof + ops ownership are completed.

