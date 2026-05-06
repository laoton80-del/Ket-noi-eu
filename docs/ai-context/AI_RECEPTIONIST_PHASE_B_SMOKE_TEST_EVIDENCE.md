# VIONA AI Receptionist Phase B Smoke Test Evidence

## 1. Purpose
Ghi bằng chứng smoke test cho AI Receptionist pilot lead email relay trước merchant pilot thật.

## 2. Environment Presence Check
| Env Key | Present? | Required? | Notes |
|---------|----------|-----------|------|
| `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL` | missing | Yes | Recipient inbox for internal lead relay |
| `AWS_SES_SENDER_EMAIL` | missing | Yes (or equivalent sender env) | One sender option is required |
| `SES_FROM_EMAIL` | missing | Conditional | Alternative sender env |
| `MAIL_FROM` | missing | Conditional | Alternative sender env |
| `AWS_REGION` | missing | Yes | SES/AWS transport region |
| `AWS_ACCESS_KEY_ID` | missing | Conditional | Required if not using IAM role |
| `AWS_SECRET_ACCESS_KEY` | missing | Conditional | Required if using access key |
| `JWT_SECRET` | missing | Yes | Needed for authenticated endpoint behavior |
| `DATABASE_URL` | missing | Platform dependent | Not specific to relay logic, may be required by runtime bootstrap |

Note: Không in env value thật. Chỉ ghi present/missing.

## 3. Success Path Test
Template:
- Date:
- Environment:
- Tester:
- Merchant test account:
- Consent accepted: yes/no
- API response:
- Email received by recipient: yes/no
- Email subject:
- Logs checked for secret/PII exposure: yes/no
- Result: pass/fail
- Notes:

Expected:
- API success
- UI shows pilot request sent for manual review
- Email received by internal recipient
- No DB write
- No payment
- No Twilio
- No AI runtime

## 4. Failure Path Test — Missing Recipient Env
Template:
- Date:
- Environment:
- Tester:
- Recipient env intentionally missing: yes/no
- API status:
- API code:
- UI message:
- Draft retained locally: yes/no
- Email not sent: yes/no
- Result: pass/fail
- Notes:

Expected:
- HTTP 503
- LEAD_CAPTURE_NOT_CONFIGURED
- UI does not fake success
- Draft remains local

## 5. Consent False Test
Template:
- Consent unchecked:
- Submit blocked before API call: yes/no
- Inline error shown: yes/no
- Result:

## 6. Auth Missing Test
Template:
- Logged out / invalid token:
- API status:
- UI message:
- Result:

## 7. Final Go/No-Go
Checklist:
- [ ] env set
- [ ] success path pass
- [ ] failure path pass
- [ ] consent false pass
- [ ] auth missing pass
- [ ] owner assigned
- [ ] backup owner assigned
- [ ] lead log ready
- [ ] retention approved

Recommendation:
- Ready / Not ready

