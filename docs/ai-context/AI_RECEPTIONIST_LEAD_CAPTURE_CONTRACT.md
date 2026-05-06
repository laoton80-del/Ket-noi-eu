# VIONA AI Receptionist Lead Capture Contract

## 1. Strategic Decision
Pilot request hiện giữ local-only. Backend chỉ được triển khai sau khi contract này được approve.

## 2. Data Classification
Proposed field classification:

- `businessName` — business profile data (not direct personal data by default)
- `industry` — business category data (non-personal)
- `city` / `country` — business/location context (can become personal when tied to sole proprietor)
- `contactName` — **personal data**
- `contactPhone` — **personal data**
- `contactEmail` — **personal data**
- `languagesNeeded` — operational preference data (may be personal context in small businesses)
- `estimatedMissedCallsPerDay` — business operational metric (non-personal)
- `desiredAutomation` — product preference data (non-personal)
- `preferredPilotDate` — scheduling preference (contextual business data)
- `notes` — free text (treat as potentially sensitive; must be minimized and sanitized)

Personal data summary:
- Mandatory handling as personal data: `contactName`, `contactPhone`, `contactEmail`
- Context-sensitive fields that should still be protected: `city`, `country`, `languagesNeeded`, `notes`

## 3. Consent Copy
Proposed short consent copy for form:

> By submitting this pilot request, you agree that VIONA may contact you regarding AI Receptionist pilot evaluation.  
> This request does not activate production AI phone automation.  
> No payment is taken.  
> No booking is created.  
> No real AI phone call is made from this request.  
> Your data is used only to evaluate pilot eligibility and onboarding readiness.

## 4. Retention Policy
- Current phase (local-only draft):
  - no server-side storage
  - data remains in local UI/session state only
- Future backend phase:
  - default retention: 180 days from submission, or until user deletion request (whichever is earlier)
  - allow legal/ops extension only with documented policy approval
- GDPR:
  - support deletion and export
  - include pilot lead records in user privacy lifecycle

## 5. Tenant / Ownership Rule
- Lead must be bound to `merchantId`/`tenantId` when requester is a merchant.
- Requester can only view/update leads under their own merchant/tenant scope.
- Admin roles can access cross-tenant aggregate/ops views under explicit role checks.
- Cross-tenant lookup is forbidden for pilot lead data.
- Server must derive ownership from authenticated identity; never trust client-supplied ownership fields alone.

## 6. API Contract Proposal
Future endpoint:

- `POST /api/ai-receptionist/pilot-leads`

Request body:
- `businessName`
- `industry`
- `city`
- `country`
- `contactName`
- `contactPhone`
- `contactEmail`
- `languagesNeeded`
- `estimatedMissedCallsPerDay`
- `desiredAutomation`
- `preferredPilotDate`
- `notes`
- `consentAccepted`

Response:
- `success`
- `leadId`
- `status`
- `message`

## 7. Validation Rules
- `businessName` required
- `industry` must match allowed enum
- at least one of `contactEmail` or `contactPhone` is required
- `consentAccepted` must be `true`
- `notes` max length enforced
- `desiredAutomation` must contain allowed values only
- reject unknown fields in strict mode for anti-abuse predictability

## 8. Security Rules
- auth required
- rate limit
- tenant check
- validation
- no public spam endpoint
- no payment
- no Twilio
- no AI call
- no booking mutation

Additional safeguards:
- sanitize free-text input (`notes`)
- consistent response envelope to avoid information leakage
- audit trail for lead create/update/status transitions (future backend phase)

## 9. Database Model Proposal
Future model proposal:

`AiReceptionistPilotLead`
- `id`
- `merchantId`
- `userId`
- `businessName`
- `industry`
- `city`
- `country`
- `contactName`
- `contactPhone`
- `contactEmail`
- `languagesNeeded`
- `estimatedMissedCallsPerDay`
- `desiredAutomation`
- `preferredPilotDate`
- `notes`
- `consentAccepted`
- `status`
- `createdAt`
- `updatedAt`

No migration is created in this task.

## 10. Status Lifecycle
Proposed status lifecycle:
- `draft`
- `submitted`
- `reviewing`
- `approved_for_demo`
- `approved_for_pilot`
- `rejected`
- `archived`

Lifecycle notes:
- `approved_for_demo` and `approved_for_pilot` are operational approvals only; they do not imply production automation activation.
- production activation remains controlled by separate feature flags and cutover checklist gates.

## 11. Implementation Phases
- Phase A: local-only
- Phase B: email/manual ops
- Phase C: DB-backed API
- Phase D: admin/CRM dashboard
- Phase E: production pilot activation

## 12. Definition of Done Before Backend
Backend only starts when all are approved:
- consent copy approved
- retention policy approved
- tenant rule approved
- API schema approved
- rate limit approved
- admin review flow approved

## 13. Next Code Task Recommendation
Smallest next task:
- update local-only form UI with consent checkbox and privacy copy
- still no backend/API

