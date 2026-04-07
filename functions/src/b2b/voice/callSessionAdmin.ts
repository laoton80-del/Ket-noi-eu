import type { DocumentData, Firestore } from 'firebase-admin/firestore';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

import { callSessionsCollectionPath, tenantDocPath } from '@app/domain/b2b/collections';
import type {
  B2BCallSessionFailureCode,
  B2BCallSessionIntent,
  B2BCallSessionStatus,
  B2BBookingConfirmationState,
  B2BBookingSlotState,
  B2BBusinessType,
  B2BVoiceDialoguePhase,
  B2BVoiceDialogueState,
  BusinessCallSession,
  BusinessTenant,
} from '@app/domain/b2b/models';
import { transitionBookingSlotState } from '@app/services/b2b/ai/bookingSlotSessionApply';
import type { CallVoiceResponse } from '@app/services/b2b/ai/callVoiceTypes';
import { callSessionIdempotencyKey } from '@app/services/b2b/reliability/idempotency';

const TRANSCRIPT_SEP = '\n';

function stableSessionDocId(provider: string, externalCallId: string): string {
  const raw = `${provider}:${externalCallId}`.toLowerCase();
  return raw.replace(/[^a-z0-9:_-]/g, '_').slice(0, 120);
}

function sessionCol(db: Firestore, tenantId: string) {
  return db.collection(callSessionsCollectionPath(tenantId));
}

function docToSession(id: string, d: DocumentData): BusinessCallSession {
  return {
    id,
    tenantId: String(d.tenantId ?? ''),
    locationId: String(d.locationId ?? ''),
    externalCallId: String(d.externalCallId ?? ''),
    inboundNumberE164: String(d.inboundNumberE164 ?? ''),
    phoneNumber: d.phoneNumber ? String(d.phoneNumber) : undefined,
    status: d.status as BusinessCallSession['status'],
    idempotencyKey: String(d.idempotencyKey ?? ''),
    intent: d.intent as BusinessCallSession['intent'],
    detectedIntent: d.detectedIntent as BusinessCallSession['detectedIntent'],
    transcriptUri: d.transcriptUri ? String(d.transcriptUri) : undefined,
    transcript: d.transcript ? String(d.transcript) : undefined,
    extractedPayload: d.extractedPayload as Record<string, unknown> | undefined,
    bookingId: d.bookingId ? String(d.bookingId) : undefined,
    orderId: d.orderId ? String(d.orderId) : undefined,
    billingEventId: d.billingEventId ? String(d.billingEventId) : undefined,
    orderBillingEventId: d.orderBillingEventId ? String(d.orderBillingEventId) : undefined,
    errorCode: d.errorCode ? String(d.errorCode) : undefined,
    outcome: d.outcome as BusinessCallSession['outcome'],
    failureReason: d.failureReason ? String(d.failureReason) : undefined,
    failureCode: d.failureCode as BusinessCallSession['failureCode'],
    voiceDialogueState: (d.voiceDialogueState as B2BVoiceDialogueState | undefined) ?? undefined,
    bookingSlotState: d.bookingSlotState as B2BBookingSlotState | undefined,
    bookingConfirmation: d.bookingConfirmation as B2BBookingConfirmationState | undefined,
    staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : undefined,
    startedAt: d.startedAt,
    endedAt: d.endedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export async function getCallSessionById(
  db: Firestore,
  tenantId: string,
  sessionId: string
): Promise<BusinessCallSession | null> {
  const ref = sessionCol(db, tenantId).doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return docToSession(snap.id, snap.data()!);
}

export async function findSessionByExternalCallId(
  db: Firestore,
  tenantId: string,
  externalCallId: string
): Promise<{ id: string; data: BusinessCallSession } | null> {
  const q = sessionCol(db, tenantId).where('externalCallId', '==', externalCallId).limit(1);
  const snap = await q.get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, data: docToSession(doc.id, doc.data()) };
}

export type EnsureSessionInput = {
  tenantId: string;
  locationId: string;
  externalCallId: string;
  provider?: string;
  inboundNumberE164: string;
  callerPhoneE164?: string;
  initialStatus?: B2BCallSessionStatus;
};

/** Idempotent create by externalCallId within tenant. */
export async function ensureCallSession(db: Firestore, input: EnsureSessionInput): Promise<{ sessionId: string; created: boolean }> {
  const provider = input.provider ?? 'twilio';
  const ref = sessionCol(db, input.tenantId).doc(stableSessionDocId(provider, input.externalCallId));
  const idem = callSessionIdempotencyKey(provider, input.externalCallId);
  const now = FieldValue.serverTimestamp();
  const status = input.initialStatus ?? 'ringing';
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      logger.info('[callSession] idempotent_existing', {
        tenantId: input.tenantId,
        sessionDocId: ref.id,
        externalCallId: input.externalCallId,
        provider,
      });
      return { sessionId: ref.id, created: false };
    }
    logger.info('[callSession] created', {
      tenantId: input.tenantId,
      sessionDocId: ref.id,
      externalCallId: input.externalCallId,
      provider,
    });
    tx.set(ref, {
      tenantId: input.tenantId,
      locationId: input.locationId,
      externalCallId: input.externalCallId,
      inboundNumberE164: input.inboundNumberE164,
      phoneNumber: input.callerPhoneE164 ?? null,
      status,
      idempotencyKey: idem,
      voiceDialogueState: { phase: 'greeting', turnCount: 0 },
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return { sessionId: ref.id, created: true };
  });
}

/** Append chunk — transaction so concurrent STT posts do not drop text. */
export async function appendTranscriptChunk(
  db: Firestore,
  tenantId: string,
  sessionId: string,
  chunk: string
): Promise<void> {
  const ref = sessionCol(db, tenantId).doc(sessionId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = (snap.get('transcript') as string | undefined) ?? '';
    const next = cur ? `${cur}${TRANSCRIPT_SEP}${chunk}` : chunk;
    tx.update(ref, { transcript: next, updatedAt: FieldValue.serverTimestamp() });
  });
}

/** Append assistant line and persist dialogue state for traceability. */
export async function persistVoiceAssistantTurn(
  db: Firestore,
  tenantId: string,
  sessionId: string,
  voice: CallVoiceResponse
): Promise<void> {
  const ref = sessionCol(db, tenantId).doc(sessionId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = (snap.get('transcript') as string | undefined) ?? '';
    const line = `Assistant: ${voice.spokenText}`;
    const next = cur ? `${cur}${TRANSCRIPT_SEP}${line}` : line;
    tx.update(ref, {
      transcript: next,
      voiceDialogueState: voice.voiceDialogueState,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function applyBookingSlotTransitionFromUtterance(
  db: Firestore,
  tenantId: string,
  sessionId: string,
  latestUserInput: string
): Promise<void> {
  const session = await getCallSessionById(db, tenantId, sessionId);
  if (!session) return;
  const tenant = await loadTenant(db, tenantId);
  const businessType: B2BBusinessType = tenant?.businessType ?? 'restaurant';
  const tr = transitionBookingSlotState({
    intent: session.intent,
    detectedIntent: session.detectedIntent,
    latestUserInput,
    bookingSlotState: session.bookingSlotState,
    bookingConfirmation: session.bookingConfirmation,
    businessType,
  });
  if (!tr) return;
  const ref = sessionCol(db, tenantId).doc(sessionId);
  const prev = session.voiceDialogueState ?? { turnCount: 0, phase: 'greeting' as B2BVoiceDialoguePhase };
  await ref.update({
    bookingSlotState: tr.bookingSlotState,
    bookingConfirmation: tr.bookingConfirmation,
    voiceDialogueState: {
      ...prev,
      phase: tr.voicePhase,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function updateCallSessionIntent(
  db: Firestore,
  tenantId: string,
  sessionId: string,
  detectedIntent: B2BCallSessionIntent,
  extractedPayload?: Record<string, unknown>
): Promise<void> {
  const ref = sessionCol(db, tenantId).doc(sessionId);
  const snap = await ref.get();
  const patch: Record<string, unknown> = {
    intent: detectedIntent,
    detectedIntent,
    status: 'collecting' as const,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (extractedPayload != null) patch.extractedPayload = extractedPayload;
  if (detectedIntent === 'booking' || detectedIntent === 'stay_booking') {
    if (!snap.get('bookingSlotState')) patch.bookingSlotState = {};
    if (!snap.get('bookingConfirmation')) {
      patch.bookingConfirmation = { awaitingConfirm: false, confirmed: false };
    }
  }
  await ref.update(patch);
}

export async function markCallSessionBookingSuccess(
  db: Firestore,
  tenantId: string,
  sessionId: string,
  bookingId: string,
  billingEventId?: string,
  options?: { staffHandoffSummary?: string }
): Promise<void> {
  const ref = sessionCol(db, tenantId).doc(sessionId);
  const patch: Record<string, unknown> = {
    bookingId,
    outcome: 'success',
    status: 'completed',
    billingEventId: billingEventId ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (options?.staffHandoffSummary) {
    patch.staffHandoffSummary = options.staffHandoffSummary;
  }
  await ref.update(patch);
}

export async function markCallSessionOrderSuccess(
  db: Firestore,
  tenantId: string,
  sessionId: string,
  orderId: string,
  orderBillingEventId?: string,
  options?: { staffHandoffSummary?: string }
): Promise<void> {
  const ref = sessionCol(db, tenantId).doc(sessionId);
  const patch: Record<string, unknown> = {
    orderId,
    outcome: 'success',
    status: 'completed',
    orderBillingEventId: orderBillingEventId ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (options?.staffHandoffSummary) {
    patch.staffHandoffSummary = options.staffHandoffSummary;
  }
  await ref.update(patch);
}

export async function markCallSessionBookingFailure(
  db: Firestore,
  tenantId: string,
  sessionId: string,
  failureCode: B2BCallSessionFailureCode,
  failureReason: string
): Promise<void> {
  const ref = sessionCol(db, tenantId).doc(sessionId);
  await ref.update({
    outcome: 'fail',
    failureCode,
    failureReason,
    status: 'error',
    errorCode: failureCode,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function finalizeCallSession(
  db: Firestore,
  tenantId: string,
  sessionId: string,
  status: B2BCallSessionStatus = 'completed'
): Promise<void> {
  const ref = sessionCol(db, tenantId).doc(sessionId);
  await ref.update({
    status,
    endedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function loadTenant(db: Firestore, tenantId: string): Promise<BusinessTenant | null> {
  const snap = await db.doc(tenantDocPath(tenantId)).get();
  if (!snap.exists) return null;
  return snap.data() as BusinessTenant;
}
