import type { Firestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

import { callSessionsCollectionPath, phoneRouteDocPath } from '@app/domain/b2b/collections';
import type {
  B2BBusinessType,
  B2BCallSessionFailureCode,
  B2BInboundRouteResolution,
} from '@app/domain/b2b/models';
import {
  mapBookingCodeToCallFailure,
  mapOrderCodeToCallFailure,
} from '@app/services/b2b/ai/bookingToCallSessionFailure';
import { generateCallResponse } from '@app/services/b2b/ai/callResponseGenerator';
import type { VoiceOrchestrationRequest, VoiceOrchestrationResponse } from '@app/services/b2b/ai/inboundVoicePipelineTypes';
import {
  commitBooking,
  commitOrder,
  resolveTenantByPhone,
  type CommitBookingOrderDeps,
} from '@app/services/b2b/ai/receptionistOrchestrator';
import { parseVoiceOrderCommitLines, parseVoiceOrderLineClarifications } from '@app/services/b2b/ai/voiceOrderCommit';
import type { CreateBookingCommand } from '@app/services/b2b/engines/bookingEngineTypes';
import type { CreateOrderCommand } from '@app/services/b2b/engines/orderEngineTypes';
import type { B2BDb } from '@app/services/b2b/engines/bookingEngine';
import {
  buildHospitalityStayInquiryNotes,
  normalizeStayDateInput,
  parseOccupancyGuestCounts,
} from '@app/services/b2b/hospitality/stayCommitMapping';
import type { B2BRepositoryBundle, PhoneRouteRepository } from '@app/services/b2b/repositories';
import { bookingIdempotencyKey, orderIdempotencyKey } from '@app/services/b2b/reliability/idempotency';
import {
  b2bPhaseToDialoguePhase,
  getVoiceRealismEngineConfig,
  humanizeSpokenResponse,
  resolveVoicePersona,
  type VoiceScenario,
} from '@app/services/voice';

import {
  appendTranscriptChunk,
  applyBookingSlotTransitionFromUtterance,
  ensureCallSession,
  findSessionByExternalCallId,
  finalizeCallSession,
  getCallSessionById,
  loadTenant,
  markCallSessionBookingFailure,
  markCallSessionBookingSuccess,
  markCallSessionOrderSuccess,
  persistVoiceAssistantTurn,
  updateCallSessionIntent,
} from './callSessionAdmin';

/** Tenant for orchestration is always resolved from inbound DID (`to`), never from client `tenantId` alone. */
async function requireTrustedTenantFromInboundDid(
  db: Firestore,
  repos: Pick<B2BRepositoryBundle, 'phoneRoute'>,
  body: VoiceOrchestrationRequest
): Promise<{ tenantId: string } | VoiceOrchestrationResponse> {
  const to = body.to?.trim();
  if (!to) return badRequest('missing_to', 'invalid_input');
  const route = await resolveTenantByPhone(db as unknown, repos, { inboundNumberE164: to });
  if (!route) return badRequest('tenant_not_found', 'tenant_not_found');
  if (body.tenantId && body.tenantId !== route.tenantId) {
    logger.warn('[b2bVoice] tenant_claim_mismatch', {
      claimedTenantId: body.tenantId,
      resolvedTenantId: route.tenantId,
      externalCallId: body.externalCallId,
      inboundDid: to,
    });
    return badRequest('tenant_mismatch', 'invalid_input');
  }
  return { tenantId: route.tenantId };
}

function adminPhoneRouteRepo(db: Firestore): PhoneRouteRepository {
  return {
    async getByInboundE164(_db: B2BDb, e164: string) {
      void _db;
      const snap = await db.doc(phoneRouteDocPath(e164)).get();
      if (!snap.exists) return null;
      const d = snap.data() as B2BInboundRouteResolution & Record<string, unknown>;
      if (!d?.tenantId || !d?.locationId) return null;
      return {
        tenantId: String(d.tenantId),
        locationId: String(d.locationId),
        inboundNumberE164: String(d.inboundNumberE164 ?? e164),
      };
    },
  };
}

const noopRepos = {} as unknown as CommitBookingOrderDeps;

function businessTypeToVoiceScenario(bt: B2BBusinessType): VoiceScenario {
  switch (bt) {
    case 'nails':
      return 'nails';
    case 'restaurant':
      return 'restaurant';
    case 'potraviny':
    case 'grocery_retail':
      return 'potraviny';
    case 'grocery_wholesale':
      return 'grocery_wholesale';
    case 'hospitality_stay':
      return 'hospitality_stay';
    default:
      return 'b2b_receptionist';
  }
}

function badRequest(msg: string, failureCode?: B2BCallSessionFailureCode): VoiceOrchestrationResponse {
  if (failureCode) return { ok: false, error: msg, failureCode };
  return { ok: false, error: msg };
}

type VoicePayload = NonNullable<Extract<VoiceOrchestrationResponse, { ok: true }>['voiceResponse']>;

async function runVoiceTurn(
  db: Firestore,
  sid: { tenantId: string; sessionId: string },
  latestUserInput: string,
  skipVoice: boolean | undefined
): Promise<{ voiceResponse?: VoicePayload }> {
  if (skipVoice) return {};
  const tenant = await loadTenant(db, sid.tenantId);
  if (!tenant) return {};
  const session = await getCallSessionById(db, sid.tenantId, sid.sessionId);
  if (!session) return {};
  const vp = resolveVoicePersona({
    mode: 'b2b_inbound',
    scenario: businessTypeToVoiceScenario(tenant.businessType),
    language: tenant.ai?.defaultLanguage ?? 'vi',
    userGender: 'unknown',
    businessType: tenant.businessType,
    tenantConfig: { defaultLanguage: tenant.ai?.defaultLanguage },
  });
  const voice = generateCallResponse({
    session: {
      id: session.id,
      transcript: session.transcript,
      intent: session.intent,
      detectedIntent: session.detectedIntent,
      extractedPayload: session.extractedPayload,
      voiceDialogueState: session.voiceDialogueState,
      bookingSlotState: session.bookingSlotState,
      bookingConfirmation: session.bookingConfirmation,
    },
    latestUserInput,
    tenantDisplayName: tenant.name,
    businessType: tenant.businessType,
    defaultLanguage: tenant.ai?.defaultLanguage,
    ttsVoiceId: vp.voiceId,
  });
  const { mode, level } = getVoiceRealismEngineConfig();
  const phase = session.voiceDialogueState?.phase ?? 'greeting';
  const humanized = humanizeSpokenResponse({
    rawText: voice.spokenText,
    language: tenant.ai?.defaultLanguage ?? 'vi',
    tone: vp.tone,
    dialoguePhase: b2bPhaseToDialoguePhase(phase),
    realismLevel: level,
    engineMode: mode,
  });
  const voiceForPersist = { ...voice, spokenText: humanized.spokenText };
  await persistVoiceAssistantTurn(db, sid.tenantId, sid.sessionId, voiceForPersist);
  return {
    voiceResponse: {
      spokenText: humanized.spokenText,
      voiceDialogueState: voice.voiceDialogueState,
      tts: voice.tts,
      audioEncoding: voice.audioEncoding,
      audioBase64: voice.audioBase64,
    },
  };
}

export async function processVoiceOrchestrationRequest(
  db: Firestore,
  body: VoiceOrchestrationRequest
): Promise<VoiceOrchestrationResponse> {
  const action = body?.action;
  if (
    action !== 'ensure_session' &&
    action !== 'append_transcript' &&
    action !== 'set_intent' &&
    action !== 'commit_booking' &&
    action !== 'commit_order' &&
    action !== 'finalize_session'
  ) {
    return badRequest('invalid_action', 'invalid_input');
  }
  if (!body.externalCallId || typeof body.externalCallId !== 'string') {
    return badRequest('missing_externalCallId', 'invalid_input');
  }
  const repos: Pick<B2BRepositoryBundle, 'phoneRoute'> = { phoneRoute: adminPhoneRouteRepo(db) };

  const resolveSid = async (tenantId: string): Promise<{ tenantId: string; sessionId: string } | null> => {
    const sessionIdFromBody = body.sessionId;
    if (sessionIdFromBody) {
      const sref = db.doc(`${callSessionsCollectionPath(tenantId)}/${sessionIdFromBody}`);
      const snap = await sref.get();
      if (!snap.exists) return null;
      if (String(snap.get('externalCallId') ?? '') !== body.externalCallId) return null;
      return { tenantId, sessionId: sessionIdFromBody };
    }
    const hit = await findSessionByExternalCallId(db, tenantId, body.externalCallId);
    if (!hit) return null;
    return { tenantId, sessionId: hit.id };
  };

  switch (body.action) {
    case 'ensure_session': {
      const to = body.to?.trim();
      if (!to) return badRequest('missing_to', 'invalid_input');
      const route = await resolveTenantByPhone(db as unknown, repos, { inboundNumberE164: to });
      if (!route) return badRequest('tenant_not_found', 'tenant_not_found');
      if (body.tenantId && body.tenantId !== route.tenantId) {
        logger.warn('[b2bVoice] tenant_claim_mismatch', {
          claimedTenantId: body.tenantId,
          resolvedTenantId: route.tenantId,
          externalCallId: body.externalCallId,
          inboundDid: to,
        });
        return badRequest('tenant_mismatch', 'invalid_input');
      }
      const { sessionId } = await ensureCallSession(db, {
        tenantId: route.tenantId,
        locationId: route.locationId,
        externalCallId: body.externalCallId,
        provider: body.provider,
        inboundNumberE164: to,
        callerPhoneE164: body.from?.trim(),
        initialStatus: 'greeting',
      });
      return {
        ok: true,
        sessionId,
        action: body.action,
        tenantId: route.tenantId,
      };
    }
    case 'append_transcript': {
      const trusted = await requireTrustedTenantFromInboundDid(db, repos, body);
      if (!('tenantId' in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== 'string' || !tenantId) return badRequest('tenant_context_invalid', 'invalid_input');
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest('session_not_found', 'invalid_input');
      logger.info('[b2bVoice] append_transcript', { tenantId: sid.tenantId, sessionId: sid.sessionId, externalCallId: body.externalCallId });
      const chunk = body.transcriptChunk?.trim();
      if (!chunk) return badRequest('missing_transcriptChunk', 'invalid_input');
      const line =
        chunk.startsWith('Caller:') || chunk.startsWith('Assistant:') ? chunk : `Caller: ${chunk}`;
      await appendTranscriptChunk(db, sid.tenantId, sid.sessionId, line);
      await applyBookingSlotTransitionFromUtterance(db, sid.tenantId, sid.sessionId, chunk);
      const voicePart = await runVoiceTurn(db, sid, chunk, body.skipVoiceResponse);
      return { ok: true, sessionId: sid.sessionId, action: body.action, ...voicePart };
    }
    case 'set_intent': {
      const trusted = await requireTrustedTenantFromInboundDid(db, repos, body);
      if (!('tenantId' in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== 'string' || !tenantId) return badRequest('tenant_context_invalid', 'invalid_input');
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest('session_not_found', 'invalid_input');
      logger.info('[b2bVoice] set_intent', { tenantId: sid.tenantId, sessionId: sid.sessionId, externalCallId: body.externalCallId });
      const intent = body.detectedIntent;
      if (!intent) return badRequest('missing_detectedIntent', 'invalid_input');
      await updateCallSessionIntent(db, sid.tenantId, sid.sessionId, intent, body.extractedPayload);
      const latest = body.latestUserInput?.trim() ?? '';
      const voicePart = await runVoiceTurn(db, sid, latest, body.skipVoiceResponse);
      return { ok: true, sessionId: sid.sessionId, action: body.action, ...voicePart };
    }
    case 'commit_booking': {
      const trusted = await requireTrustedTenantFromInboundDid(db, repos, body);
      if (!('tenantId' in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== 'string' || !tenantId) return badRequest('tenant_context_invalid', 'invalid_input');
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest('session_not_found', 'invalid_input');
      logger.info('[b2bVoice] commit_booking_attempt', {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        externalCallId: body.externalCallId,
      });
      if (body.confirmed !== true) {
        return badRequest('commit_requires_confirmed_true', 'invalid_input');
      }
      const slotDigest = body.slotDigest?.trim();
      if (!slotDigest) return badRequest('missing_slotDigest', 'invalid_input');
      if (body.startsAtMs == null || body.endsAtMs == null) {
        return badRequest('missing_startsAtMs_or_endsAtMs', 'invalid_input');
      }

      const tenant = await loadTenant(db, sid.tenantId);
      if (!tenant) return badRequest('tenant_not_found', 'tenant_not_found');

      const sessionRef = db.doc(`${callSessionsCollectionPath(sid.tenantId)}/${sid.sessionId}`);
      const sessionSnap = await sessionRef.get();
      if (!sessionSnap.exists) return badRequest('session_not_found', 'invalid_input');
      const bookingConf = sessionSnap.get('bookingConfirmation') as { confirmed?: boolean } | undefined;
      if (!bookingConf?.confirmed) {
        return badRequest('booking_not_confirmed', 'invalid_input');
      }
      if (String(sessionSnap.get('outcome') ?? '') === 'success' && sessionSnap.get('bookingId')) {
        return {
          ok: true,
          sessionId: sid.sessionId,
          action: body.action,
          bookingId: String(sessionSnap.get('bookingId')),
          billingEventId: sessionSnap.get('billingEventId') ? String(sessionSnap.get('billingEventId')) : undefined,
          outcome: 'success',
        };
      }

      const locationId = body.locationId ?? String(sessionSnap.get('locationId') ?? '');
      if (!locationId) return badRequest('missing_locationId', 'invalid_input');

      const slotState = sessionSnap.get('bookingSlotState') as
        | {
            name?: string;
            stayCheckIn?: string;
            stayCheckOut?: string;
            occupancy?: string;
            service?: string;
          }
        | undefined;
      const sessionIntent = String(sessionSnap.get('detectedIntent') ?? sessionSnap.get('intent') ?? '');
      const stayIntent = sessionIntent === 'stay_booking';
      const stayInquiryFlow = tenant.businessType === 'hospitality_stay' || stayIntent;

      const occ = parseOccupancyGuestCounts(slotState?.occupancy);
      const stayIn = normalizeStayDateInput(slotState?.stayCheckIn);
      const stayOut = normalizeStayDateInput(slotState?.stayCheckOut);
      const roomOrService =
        typeof body.extractedPayload?.roomUnitLabel === 'string'
          ? String(body.extractedPayload.roomUnitLabel)
          : slotState?.service?.trim();

      let notes =
        typeof body.extractedPayload?.notes === 'string' ? String(body.extractedPayload.notes) : undefined;
      if (stayInquiryFlow) {
        notes = buildHospitalityStayInquiryNotes(notes);
      }

      const cmd: CreateBookingCommand = {
        tenantId: sid.tenantId,
        locationId,
        businessType: tenant.businessType,
        serviceIds: body.serviceIds ?? [],
        resourceIds: body.resourceIds ?? [],
        resourceCandidateIds: body.resourceCandidateIds,
        startsAtMs: Number(body.startsAtMs),
        endsAtMs: Number(body.endsAtMs),
        customerPhoneE164: body.from ?? (sessionSnap.get('phoneNumber') ? String(sessionSnap.get('phoneNumber')) : undefined),
        customerName: body.customerName ?? slotState?.name,
        partySize: body.partySize ?? occ.adults,
        idempotencyKey: bookingIdempotencyKey(sid.sessionId, slotDigest),
        sourceCallSessionId: sid.sessionId,
        notes,
        stayCheckInDate: stayIn,
        stayCheckOutDate: stayOut,
        adults: occ.adults,
        children: occ.children,
        roomUnitLabel: roomOrService,
        ...(stayInquiryFlow
          ? {
              billable: false,
              isInquiryOnly: true,
              treatAsStayInquiry: tenant.businessType !== 'hospitality_stay' && stayIntent,
            }
          : {}),
      };

      const result = await commitBooking(db as unknown, noopRepos, cmd);
      if (!result.ok) {
        const mapped = mapBookingCodeToCallFailure(result.code, result.message);
        await markCallSessionBookingFailure(
          db,
          sid.tenantId,
          sid.sessionId,
          mapped.failureCode,
          mapped.failureReason
        );
        return {
          ok: false,
          error: mapped.failureReason,
          failureCode: mapped.failureCode,
          sessionId: sid.sessionId,
        };
      }

      await markCallSessionBookingSuccess(db, sid.tenantId, sid.sessionId, result.booking.id, result.billingEventId, {
        staffHandoffSummary: result.booking.staffHandoffSummary,
      });
      logger.info('[b2bVoice] commit_booking_success', {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        bookingId: result.booking.id,
        billingEventId: result.billingEventId,
        externalCallId: body.externalCallId,
      });
      return {
        ok: true,
        sessionId: sid.sessionId,
        action: body.action,
        bookingId: result.booking.id,
        billingEventId: result.billingEventId,
        outcome: 'success',
      };
    }
    case 'commit_order': {
      const trusted = await requireTrustedTenantFromInboundDid(db, repos, body);
      if (!('tenantId' in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== 'string' || !tenantId) return badRequest('tenant_context_invalid', 'invalid_input');
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest('session_not_found', 'invalid_input');
      logger.info('[b2bVoice] commit_order_attempt', {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        externalCallId: body.externalCallId,
      });
      if (body.confirmed !== true) {
        return badRequest('commit_order_requires_confirmed_true', 'invalid_input');
      }
      const orderDigest = body.orderDigest?.trim();
      if (!orderDigest) return badRequest('missing_orderDigest', 'invalid_input');
      if (body.windowStartMs == null || body.windowEndMs == null) {
        return badRequest('missing_window_bounds', 'invalid_input');
      }
      const lines = parseVoiceOrderCommitLines(body.lines);
      if (!lines) return badRequest('invalid_order_lines', 'invalid_input');

      const tenant = await loadTenant(db, sid.tenantId);
      if (!tenant) return badRequest('tenant_not_found', 'tenant_not_found');

      const sessionRef = db.doc(`${callSessionsCollectionPath(sid.tenantId)}/${sid.sessionId}`);
      const sessionSnap = await sessionRef.get();
      if (!sessionSnap.exists) return badRequest('session_not_found', 'invalid_input');
      if (String(sessionSnap.get('outcome') ?? '') === 'success' && sessionSnap.get('orderId')) {
        return {
          ok: true,
          sessionId: sid.sessionId,
          action: body.action,
          orderId: String(sessionSnap.get('orderId')),
          orderBillingEventId: sessionSnap.get('orderBillingEventId')
            ? String(sessionSnap.get('orderBillingEventId'))
            : undefined,
          outcome: 'success',
        };
      }

      const locationId = body.locationId ?? String(sessionSnap.get('locationId') ?? '');
      if (!locationId) return badRequest('missing_locationId', 'invalid_input');

      const fulfillment = body.fulfillment === 'delivery' ? 'delivery' : 'pickup';
      const lineClarifications = parseVoiceOrderLineClarifications(body.lineClarifications);
      const palletOrVolumeHint =
        typeof body.palletOrVolumeHint === 'string' ? body.palletOrVolumeHint.trim() : undefined;

      const ocmd: CreateOrderCommand = {
        tenantId: sid.tenantId,
        locationId,
        businessType: tenant.businessType,
        lines,
        fulfillment,
        windowStartMs: Number(body.windowStartMs),
        windowEndMs: Number(body.windowEndMs),
        customerPhoneE164: body.from ?? (sessionSnap.get('phoneNumber') ? String(sessionSnap.get('phoneNumber')) : undefined),
        customerName:
          typeof body.customerName === 'string'
            ? body.customerName
            : (sessionSnap.get('bookingSlotState') as { name?: string } | undefined)?.name,
        deliveryAddress:
          typeof body.extractedPayload?.deliveryAddress === 'string'
            ? String(body.extractedPayload.deliveryAddress)
            : undefined,
        idempotencyKey: orderIdempotencyKey(sid.sessionId, orderDigest),
        sourceCallSessionId: sid.sessionId,
        lineClarifications,
        palletOrVolumeHint,
        /** Voice intake: never debit until wholesale staff confirmation path or explicit billable create. */
        billable: false,
      };

      const oresult = await commitOrder(db as unknown, noopRepos, ocmd);
      if (!oresult.ok) {
        const mapped = mapOrderCodeToCallFailure(oresult.code, oresult.message);
        await markCallSessionBookingFailure(
          db,
          sid.tenantId,
          sid.sessionId,
          mapped.failureCode,
          mapped.failureReason
        );
        return {
          ok: false,
          error: mapped.failureReason,
          failureCode: mapped.failureCode,
          sessionId: sid.sessionId,
        };
      }

      await markCallSessionOrderSuccess(
        db,
        sid.tenantId,
        sid.sessionId,
        oresult.order.id,
        oresult.billingEventId,
        { staffHandoffSummary: oresult.order.staffHandoffSummary }
      );
      logger.info('[b2bVoice] commit_order_success', {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        orderId: oresult.order.id,
        orderBillingEventId: oresult.billingEventId,
        externalCallId: body.externalCallId,
      });
      return {
        ok: true,
        sessionId: sid.sessionId,
        action: body.action,
        orderId: oresult.order.id,
        orderBillingEventId: oresult.billingEventId,
        outcome: 'success',
      };
    }
    case 'finalize_session': {
      const trusted = await requireTrustedTenantFromInboundDid(db, repos, body);
      if (!('tenantId' in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== 'string' || !tenantId) return badRequest('tenant_context_invalid', 'invalid_input');
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest('session_not_found', 'invalid_input');
      logger.info('[b2bVoice] finalize_session', { tenantId: sid.tenantId, sessionId: sid.sessionId, externalCallId: body.externalCallId });
      await finalizeCallSession(db, sid.tenantId, sid.sessionId);
      return { ok: true, sessionId: sid.sessionId, action: body.action };
    }
    default:
      return badRequest('unknown_action', 'invalid_input');
  }
}
