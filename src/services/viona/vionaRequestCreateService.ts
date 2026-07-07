import type { Prisma } from '@prisma/client';

import { vionaRequestUniverses } from '../../domain/requests/vionaRequestTypes';
import { getPrisma } from '../../lib/prisma';
import type {
  CreateVionaRequestFailure,
  CreateVionaRequestInput,
  CreateVionaRequestResult,
} from './vionaRequestCreateDto';
import {
  VIONA_REQUEST_CREATE_ACTION_SAFETY,
  VIONA_REQUEST_CREATE_AUDIT_EVENT_TYPE,
  VIONA_REQUEST_CREATE_BULK_KEYS,
  VIONA_REQUEST_CREATE_FORBIDDEN_SAFETY_LABELS,
  VIONA_REQUEST_CREATE_FORBIDDEN_SIDE_EFFECT_KEYS,
  VIONA_REQUEST_CREATE_INITIAL_STATUS,
  VIONA_REQUEST_CREATE_REQUIRED_SAFETY_LABELS,
  VIONA_REQUEST_CREATE_SAFE_REQUEST_TYPES,
  VIONA_REQUEST_CREATE_VIA,
} from './vionaRequestCreateDto';
import { getVionaRequestById } from './vionaRequestReadService';

const TENANT_ID_MAX_LENGTH = 100;
const REQUEST_TYPE_MAX_LENGTH = 100;
const TITLE_MAX_LENGTH = 200;
const SUMMARY_MAX_LENGTH = 4000;
const LOCALE_MAX_LENGTH = 20;
const COUNTRY_CODE_MAX_LENGTH = 8;
const SOURCE_FEATURE_MAX_LENGTH = 100;
const LABEL_MAX_LENGTH = 64;
const LABELS_MAX_COUNT = 20;
const IDEMPOTENCY_KEY_MAX_LENGTH = 128;
const CORRELATION_ID_MAX_LENGTH = 128;

const UNSAFE_CONTENT_SUBSTRINGS = [
  'http://',
  'https://',
  'bearer ',
  'password',
  'secret',
  'api_key',
  'apikey',
] as const;

function containsUnsafeContent(value: string): boolean {
  const normalized = value.toLowerCase();
  return UNSAFE_CONTENT_SUBSTRINGS.some((fragment) => normalized.includes(fragment));
}

function normalizeOptionalKey(value: string | undefined, maxLength: number): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return undefined;
  return trimmed;
}

/**
 * Screen a raw request body for shape safety before typed extraction.
 * Rejects arrays / bulk-creation shapes and any status-transition or downstream side-effect keys.
 * Returns a failure reason, or `null` when the raw body is shape-safe.
 */
export function screenCreateVionaRequestRawBody(raw: unknown): CreateVionaRequestFailure | null {
  if (Array.isArray(raw)) {
    return 'bulk_forbidden';
  }
  if (raw == null || typeof raw !== 'object') {
    return 'invalid_input';
  }

  const keys = Object.keys(raw as Record<string, unknown>).map((k) => k.toLowerCase());

  if (VIONA_REQUEST_CREATE_BULK_KEYS.some((bulkKey) => keys.includes(bulkKey))) {
    return 'bulk_forbidden';
  }

  if (
    VIONA_REQUEST_CREATE_FORBIDDEN_SIDE_EFFECT_KEYS.some((forbidden) => keys.includes(forbidden))
  ) {
    return 'forbidden_side_effect';
  }

  return null;
}

function validateRequiredText(
  value: string,
  maxLength: number
): { ok: true; value: string } | { ok: false; reason: 'invalid_input' | 'unsafe_content' } {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (containsUnsafeContent(trimmed)) {
    return { ok: false, reason: 'unsafe_content' };
  }
  return { ok: true, value: trimmed };
}

function validateOptionalText(
  value: string | undefined,
  maxLength: number
): { ok: true; value?: string } | { ok: false; reason: 'invalid_input' | 'unsafe_content' } {
  if (value == null) {
    return { ok: true };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (containsUnsafeContent(trimmed)) {
    return { ok: false, reason: 'unsafe_content' };
  }
  return { ok: true, value: trimmed };
}

function validateSafetyLabels(
  labels: readonly string[]
):
  | { ok: true; value: string[] }
  | { ok: false; reason: 'invalid_input' | 'missing_safety_labels' | 'forbidden_labels' } {
  if (!Array.isArray(labels) || labels.length === 0 || labels.length > LABELS_MAX_COUNT) {
    return { ok: false, reason: 'invalid_input' };
  }

  const normalized: string[] = [];
  for (const label of labels) {
    if (typeof label !== 'string') {
      return { ok: false, reason: 'invalid_input' };
    }
    const trimmed = label.trim().toLowerCase();
    if (trimmed.length === 0 || trimmed.length > LABEL_MAX_LENGTH) {
      return { ok: false, reason: 'invalid_input' };
    }
    normalized.push(trimmed);
  }

  const labelSet = new Set(normalized);

  if (
    VIONA_REQUEST_CREATE_FORBIDDEN_SAFETY_LABELS.some((forbidden) => labelSet.has(forbidden))
  ) {
    return { ok: false, reason: 'forbidden_labels' };
  }

  const hasAllRequired = VIONA_REQUEST_CREATE_REQUIRED_SAFETY_LABELS.every((required) =>
    labelSet.has(required)
  );
  if (!hasAllRequired) {
    return { ok: false, reason: 'missing_safety_labels' };
  }

  return { ok: true, value: Array.from(labelSet).sort() };
}

function isSafeUniverse(value: string): boolean {
  return (vionaRequestUniverses as readonly string[]).includes(value);
}

function isSafeRequestType(value: string): boolean {
  return (VIONA_REQUEST_CREATE_SAFE_REQUEST_TYPES as readonly string[]).includes(value);
}

async function findIdempotentCreateAuditEvent(
  idempotencyKey: string
): Promise<{ requestId: string; auditEventId: string } | null> {
  const existing = await getPrisma().vionaRequestAuditEvent.findFirst({
    where: {
      eventType: VIONA_REQUEST_CREATE_AUDIT_EVENT_TYPE,
      payloadJson: {
        path: ['idempotencyKey'],
        equals: idempotencyKey,
      },
    },
    select: { id: true, requestId: true },
  });
  if (existing == null) {
    return null;
  }
  return { requestId: existing.requestId, auditEventId: existing.id };
}

/**
 * Create exactly one `VionaRequest` row (VionaRequest domain/model only) with initial status
 * `submitted`. Records an `action.create` audit event. Performs no status transition and no
 * note/execution/payment/booking/SOS/AI/merchant/notification/external side effect. Owner and
 * requester are both scoped to the authenticated caller. Staging-testable only; not production-ready.
 */
export async function createVionaRequest(
  input: CreateVionaRequestInput
): Promise<CreateVionaRequestResult> {
  const authUserId = input.authUserId.trim();
  if (authUserId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const tenantResult = validateRequiredText(input.tenantId, TENANT_ID_MAX_LENGTH);
  if (!tenantResult.ok) {
    return { ok: false, reason: tenantResult.reason };
  }

  const rawUniverse = input.sourceUniverse.trim();
  if (!isSafeUniverse(rawUniverse)) {
    return { ok: false, reason: 'unsafe_universe' };
  }

  const rawRequestType = input.requestType.trim();
  if (rawRequestType.length === 0 || rawRequestType.length > REQUEST_TYPE_MAX_LENGTH) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (!isSafeRequestType(rawRequestType)) {
    return { ok: false, reason: 'unsafe_request_type' };
  }

  const titleResult = validateRequiredText(input.title, TITLE_MAX_LENGTH);
  if (!titleResult.ok) {
    return { ok: false, reason: titleResult.reason };
  }

  const summaryResult = validateOptionalText(input.summary, SUMMARY_MAX_LENGTH);
  if (!summaryResult.ok) {
    return { ok: false, reason: summaryResult.reason };
  }

  const localeResult = validateOptionalText(input.locale, LOCALE_MAX_LENGTH);
  if (!localeResult.ok) {
    return { ok: false, reason: localeResult.reason };
  }

  const countryCodeResult = validateOptionalText(input.countryCode, COUNTRY_CODE_MAX_LENGTH);
  if (!countryCodeResult.ok) {
    return { ok: false, reason: countryCodeResult.reason };
  }

  const sourceFeatureResult = validateOptionalText(input.sourceFeature, SOURCE_FEATURE_MAX_LENGTH);
  if (!sourceFeatureResult.ok) {
    return { ok: false, reason: sourceFeatureResult.reason };
  }

  const labelsResult = validateSafetyLabels(input.safetyLabels);
  if (!labelsResult.ok) {
    return { ok: false, reason: labelsResult.reason };
  }

  const idempotencyKey = normalizeOptionalKey(input.idempotencyKey, IDEMPOTENCY_KEY_MAX_LENGTH);
  if (input.idempotencyKey != null && idempotencyKey == null) {
    return { ok: false, reason: 'invalid_input' };
  }

  const clientCorrelationId = normalizeOptionalKey(
    input.clientCorrelationId,
    CORRELATION_ID_MAX_LENGTH
  );
  if (input.clientCorrelationId != null && clientCorrelationId == null) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (idempotencyKey != null) {
    const existing = await findIdempotentCreateAuditEvent(idempotencyKey);
    if (existing != null) {
      const replayDetail = await getVionaRequestById({
        authUserId,
        requestId: existing.requestId,
      });
      if (!replayDetail.ok) {
        return { ok: false, reason: 'invalid_input' };
      }
      return {
        ok: true,
        data: replayDetail.data,
        action: {
          requestId: existing.requestId,
          auditEventId: existing.auditEventId,
          eventType: 'action.create',
          status: VIONA_REQUEST_CREATE_INITIAL_STATUS,
          idempotentReplay: true,
        },
        safety: VIONA_REQUEST_CREATE_ACTION_SAFETY,
      };
    }
  }

  const metadataAudit: Record<string, string> = {
    createdByUserId: authUserId,
    createdByRoleLabel: 'requester-owner',
    sourceIntent: 'pack19-safe-submitted-row-precondition',
  };
  if (idempotencyKey != null) metadataAudit.idempotencyKey = idempotencyKey;
  if (clientCorrelationId != null) metadataAudit.clientCorrelationId = clientCorrelationId;

  const metadataJson: Prisma.InputJsonValue = {
    createdVia: VIONA_REQUEST_CREATE_VIA,
    safetyLabels: labelsResult.value,
    readiness: {
      notProductionReady: true,
      stagingOnly: true,
      noStatusTransition: true,
      noExecutionWiring: true,
      noPayment: true,
      noBooking: true,
      noSos: true,
      noMerchantAction: true,
      noAiCall: true,
      noExternalSideEffect: true,
    },
    audit: metadataAudit,
  };

  const auditPayload: Prisma.InputJsonValue = {
    createdVia: VIONA_REQUEST_CREATE_VIA,
    initialStatus: VIONA_REQUEST_CREATE_INITIAL_STATUS,
    safetyLabels: labelsResult.value,
  };
  if (idempotencyKey != null) {
    (auditPayload as Record<string, unknown>).idempotencyKey = idempotencyKey;
  }
  if (clientCorrelationId != null) {
    (auditPayload as Record<string, unknown>).clientCorrelationId = clientCorrelationId;
  }

  const created = await getPrisma().$transaction(async (tx) => {
    const request = await tx.vionaRequest.create({
      data: {
        tenantId: tenantResult.value,
        requesterUserId: authUserId,
        ownerUserId: authUserId,
        sourceUniverse: rawUniverse,
        sourceFeature: sourceFeatureResult.value ?? null,
        requestType: rawRequestType,
        status: VIONA_REQUEST_CREATE_INITIAL_STATUS,
        title: titleResult.value,
        summary: summaryResult.value ?? '',
        locale: localeResult.value ?? null,
        countryCode: countryCodeResult.value ?? null,
        metadataJson,
      },
      select: { id: true },
    });

    const auditEvent = await tx.vionaRequestAuditEvent.create({
      data: {
        requestId: request.id,
        eventType: VIONA_REQUEST_CREATE_AUDIT_EVENT_TYPE,
        actorUserId: authUserId,
        actorRoleLabel: 'requester-owner',
        message: 'Request created (submitted). Staging test-remediation row; not production-ready.',
        payloadJson: auditPayload,
      },
      select: { id: true },
    });

    return { requestId: request.id, auditEventId: auditEvent.id };
  });

  const detail = await getVionaRequestById({ authUserId, requestId: created.requestId });
  if (!detail.ok) {
    return { ok: false, reason: 'invalid_input' };
  }

  return {
    ok: true,
    data: detail.data,
    action: {
      requestId: created.requestId,
      auditEventId: created.auditEventId,
      eventType: 'action.create',
      status: VIONA_REQUEST_CREATE_INITIAL_STATUS,
      idempotentReplay: false,
    },
    safety: VIONA_REQUEST_CREATE_ACTION_SAFETY,
  };
}
