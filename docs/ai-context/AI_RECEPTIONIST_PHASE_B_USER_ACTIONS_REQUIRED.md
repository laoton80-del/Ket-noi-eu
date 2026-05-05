# VIONA AI Receptionist Phase B — User Actions Required

## 1. Actions Cursor Cannot Complete
| Action | Why Cursor Cannot Complete | Owner | Status |
|--------|----------------------------|-------|--------|
| Set real recipient env | Needs real production/staging email destination and environment access | User action required | Pending |
| Set real sender/SES env | Needs cloud credentials/role and mail sender ownership | User action required | Pending |
| Verify inbox email received | Requires access to internal mailbox/out-of-band proof | User action required | Pending |
| Assign primary owner | Organizational decision | Founder/Ops lead action required | Pending |
| Assign backup owner | Organizational decision | Founder/Ops lead action required | Pending |
| Choose SLA | Policy/business decision | Founder/Ops lead action required | Pending |
| Create private lead log location | Needs private workspace/tool setup | User action required | Pending |
| Approve retention/deletion policy | Governance/privacy approval required | Founder/Privacy owner action required | Pending |

## 2. Exact Env To Set
Set the following keys (do not commit values to repo):
- `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL`
- `AWS_SES_SENDER_EMAIL` or `SES_FROM_EMAIL` / `MAIL_FROM`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID` or IAM role
- `AWS_SECRET_ACCESS_KEY` if using key

## 3. PowerShell Commands For User
Use this to check env presence locally without printing values:

```powershell
$keys = @(
  "VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL",
  "AWS_SES_SENDER_EMAIL",
  "SES_FROM_EMAIL",
  "MAIL_FROM",
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY"
)
foreach ($k in $keys) {
  if ([Environment]::GetEnvironmentVariable($k)) { Write-Host "$k: present" } else { Write-Host "$k: missing" }
}
```

## 4. Manual Smoke Test Steps
1. restart backend after env set
2. login merchant
3. open pilot request form
4. submit valid form with consent
5. check success response
6. check recipient inbox
7. remove recipient env in staging/local
8. restart backend
9. submit again
10. verify 503 and no fake success
11. restore env

## 5. Current Recommendation
Nếu env/owner/smoke evidence chưa đủ:
**Not ready for merchant pilot.**

Nếu đủ:
**Ready for manual pilot demo.**

