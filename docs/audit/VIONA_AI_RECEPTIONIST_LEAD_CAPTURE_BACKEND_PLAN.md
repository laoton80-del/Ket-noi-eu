# VIONA AI Receptionist Lead Capture Backend Plan

## 1. Executive Summary
- **Should we store real pilot requests now?** Not yet in this phase. Keep current local-only flow as default until product/legal finalize consent + retention policy and backend ownership model.
- **New endpoint vs existing lead/CRM?** Use a **new dedicated endpoint** later (`/api/ai-receptionist/pilot-leads`) instead of reusing current marketing/admin CRM paths.
- **Need migration?** For true persistent lead capture: **yes**, a new DB model/table is required (currently no pilot-lead model exists in `prisma/schema.prisma`).
- **Auth/tenant/privacy risk?** Medium if rushed. Payload contains personal data (phone/email/contact), so auth + tenant ownership + retention + GDPR lifecycle must be defined before production write.

## 2. Current Frontend Form
Current form fields in `AiReceptionistPilotRequestScreen`:
- businessName
- industry
- city
- country
- contactName
- contactPhone
- contactEmail
- languagesNeeded
- estimatedMissedCallsPerDay
- desiredAutomation
- preferredPilotDate
- notes

## 3. Backend Options

| Option | Description | Pros | Cons | Risk | Recommendation |
|--------|-------------|------|------|------|----------------|
| local-only for now | Keep form as local draft only | Zero backend risk, no migration/auth/privacy handling yet | No operational visibility, lead can be lost client-side | Low | Keep as immediate default (current state) |
| email lead notification | Server endpoint relays form payload to internal email inbox | Fast ops onboarding, no CRM UI needed | Still handles PII, needs anti-spam and secure mail config | Medium | Good intermediate step after consent copy is approved |
| existing CRM/service reuse | Reuse current admin/marketing/broker related flows | Lower initial coding if compatible | Existing surfaces are not tenant-safe for this merchant pilot intake shape; semantics mismatch | Medium/High | Not recommended |
| new API endpoint + DB table | Add dedicated pilot lead API + persistent table + status lifecycle | Clean domain model, auditability, admin reporting ready | Requires migration, validation/auth/tenant/privacy work | Medium | Best long-term target (Phase C) |
| external form tool/manual ops | Use external form or manual spreadsheet | Very quick to launch operationally | Fragmented data, weak tenant/control guarantees, compliance overhead | Medium | Only temporary fallback if engineering bandwidth is blocked |

## 4. Recommended Data Model
If DB persistence is enabled later, introduce a dedicated model:

- `AiReceptionistPilotLead`
  - `id` (uuid)
  - `merchantUserId` (FK -> `User.id`, from JWT `authUserId`)
  - `businessName`
  - `industry` (enum/string)
  - `city`
  - `country`
  - `contactName`
  - `contactPhone`
  - `contactEmail`
  - `languagesNeeded` (string or JSON string array)
  - `estimatedMissedCallsPerDay` (int)
  - `desiredAutomation` (JSON or normalized child table)
  - `preferredPilotDate` (date nullable)
  - `notes` (text nullable)
  - `status` (`DRAFT` | `SUBMITTED` | `UNDER_REVIEW` | `APPROVED` | `REJECTED`)
  - `sourceSurface` (e.g. `DEMO`, `CHECKLIST`, `DASHBOARD`, `PAYWALL`)
  - `createdAt`, `updatedAt`
  - optional: `reviewedByUserId`, `reviewedAt`, `reviewNote`

Tenant/merchant relation:
- Base ownership should bind to authenticated merchant identity (`merchantUserId`) and never accept arbitrary owner id from client.

Privacy notes:
- `contactPhone` and `contactEmail` are personal data and require retention + delete/export policy.

## 5. API Proposal
Future endpoint proposal:

- `POST /api/ai-receptionist/pilot-leads`

Validation:
- Use `validateBody` + Zod schema (same pattern as `authRoutes`).
- Enforce required fields + length bounds + enum checks.
- Sanitize whitespace and reject oversized payloads.

Auth requirement:
- Require `authMiddleware` (JWT).
- Read user from `req.authUserId`; do not trust client-provided owner ids.

Rate limit:
- Keep global `pathAwareApiRateLimiter`, and add stricter route-level limiter if needed (anti-spam).

Tenant ownership:
- Server writes `merchantUserId = req.authUserId`.
- Optional later: verify merchant role / workspace access before accepting.

Response shape:
- Use existing envelope style:
  - success: `{ success: true, data: { id, status, createdAt } }`
  - fail: `{ success: false, error: string }`

## 6. Privacy / Compliance
- phone/email are personal data.
- GDPR deletion/export flows should include pilot lead data when persistence is enabled.
- no sensitive call recording yet in this form flow.
- consent copy should explicitly state pilot request review process and non-production activation.
- retention policy should define:
  - retention window (e.g. 180/365 days if no activation),
  - purge/anonymize strategy,
  - admin access boundaries.

## 7. Security Rules
- auth required
- tenant check
- rate limit
- validation
- no public spam endpoint
- no payment
- no AI call
- no Twilio call

Additional hardening:
- no direct DB write from client identifiers (server owns identity mapping)
- reject unsafe payload size and malformed arrays
- add basic audit log event for lead creation once backend write is enabled

## 8. Implementation Phases
- **Phase A: keep local-only**
  - Continue current UI draft flow, polish UX copy and field validation on client.
- **Phase B: email/manual ops**
  - Add minimal authenticated endpoint that forwards sanitized lead details to internal ops inbox (no DB yet).
- **Phase C: DB-backed lead capture**
  - Add Prisma model + migration + controller/route + zod validation + ownership checks.
- **Phase D: CRM/admin dashboard**
  - Add admin review/list APIs, status transitions, and operational dashboard integration.

## 9. Recommended Next Code Task
Recommended smallest next task:
- **Do not code full backend yet.**
- Execute a **schema/API contract plan only** first (fields, validation rules, consent text, retention policy), then implement Phase B or C after legal/product approval.

Practical next increment:
- Keep local-only in app, add explicit "export/share draft payload" internal QA tool (optional) before enabling any server persistence.

