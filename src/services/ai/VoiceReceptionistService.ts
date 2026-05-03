/**
 * Voice AI Receptionist — architecture sketch.
 *
 * Intended bridge: **WebRTC / VoIP media plane** ↔ signaling ↔ **OpenAI Realtime API** (speech-to-speech)
 * with server-side session tokens + **function calling** for calendar / order writes.
 *
 * B2C caller dials in-app; **metered voice overage accrues to the B2B merchant** per `PRICING_AUTHORITY` (USD-major ledger).
 *
 * Mock layer: system prompt string, language heuristics, `executeBooking` / `executeWholesaleOrder` tool stubs,
 * Vietnamese `aiSummaryVi` for merchant dashboards, audio dispatch + optional auto-print hooks.
 */

import { PRICING_AUTHORITY, type PackageName } from '../../config/pricingConfig';
import { audioDispatchService, queueMockWholesalePrintSlip } from '../b2b/AudioDispatchService';
import { useB2bConsolePreferencesStore } from '../../state/b2bConsolePreferences';
import { useB2BBookingStore, type Service, type VoiceCallerLanguage } from '../../state/b2bBooking';
import { useB2bVoiceMerchantBillingStore } from '../../state/b2bVoiceMerchantBilling';

function roundMajor2(value: number): number {
  return Math.round(value * 100) / 100;
}

export type { VoiceCallerLanguage } from '../../state/b2bBooking';

export type VoiceAiIntentKind = 'booking' | 'wholesale_order' | 'room_reservation' | 'unknown';

export type VoiceIntentExtraction = {
  readonly intent: VoiceAiIntentKind;
  readonly confidence: number;
  readonly notes: string;
};

export type VoiceCallInitiateOk = {
  readonly ok: true;
  readonly sessionId: string;
  readonly b2cUserId: string;
  readonly b2bMerchantId: string;
  readonly billingModel: 'b2b_merchant_usd_voice';
  readonly merchantPackage: PackageName;
  readonly includedVoiceMinutesMonthly: number;
  readonly usedVoiceAiMinutesThisMonth: number;
  readonly remainingIncludedMinutes: number;
  readonly overageMajorPerMinute: number;
};

export type VoiceCallInitiateFail = {
  readonly ok: false;
  readonly code: 'MERCHANT_NOT_REGISTERED';
  readonly message: string;
};

export type VoiceCallInitiateResult = VoiceCallInitiateOk | VoiceCallInitiateFail;

export type VoiceReceptionistAiEvent =
  | {
      readonly kind: 'ai_booking_secured';
      readonly merchantId: string;
      readonly bookingId: string;
      readonly customerName: string;
      readonly callerLanguage: VoiceCallerLanguage;
      readonly aiSummaryVi: string;
      readonly toastVi: string;
    }
  | {
      readonly kind: 'ai_wholesale_secured';
      readonly merchantId: string;
      readonly orderId: string;
      readonly customerName: string;
      readonly callerLanguage: VoiceCallerLanguage;
      readonly aiSummaryVi: string;
      readonly toastVi: string;
    };

type VoiceAiListener = (event: VoiceReceptionistAiEvent) => void;

const voiceAiListeners = new Set<VoiceAiListener>();

export function subscribeVoiceReceptionistAiEvents(listener: VoiceAiListener): () => void {
  voiceAiListeners.add(listener);
  return () => {
    voiceAiListeners.delete(listener);
  };
}

function emitVoiceReceptionistAiEvent(event: VoiceReceptionistAiEvent): void {
  const prefs = useB2bConsolePreferencesStore.getState();
  if (prefs.audioAlertsEnabled) {
    const line =
      event.kind === 'ai_booking_secured'
        ? 'Ting! Có lịch hẹn mới từ Lễ Tân AI.'
        : 'Ting! Có đơn mua sỉ mới từ Lễ Tân AI.';
    audioDispatchService.playVietnameseAlert(line);
  }
  if (event.kind === 'ai_wholesale_secured' && prefs.wholesaleAutoPrint) {
    queueMockWholesalePrintSlip(event.orderId);
  }
  voiceAiListeners.forEach((fn) => {
    fn(event);
  });
}

type MerchantVoiceLedgerMock = {
  readonly packageName: PackageName;
  readonly usedVoiceAiMinutesThisMonth: number;
};

function hashToUint(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function resolveMerchantVoiceLedger(b2bMerchantId: string): MerchantVoiceLedgerMock {
  const h = hashToUint(b2bMerchantId);
  if (b2bMerchantId === 'b2b-merchant-smart-calendar' || b2bMerchantId.startsWith('nails')) {
    return { packageName: 'Power', usedVoiceAiMinutesThisMonth: 215 };
  }
  if (b2bMerchantId.startsWith('pho')) {
    return { packageName: 'Power', usedVoiceAiMinutesThisMonth: 40 };
  }
  if (b2bMerchantId.startsWith('service')) {
    return { packageName: 'Pro', usedVoiceAiMinutesThisMonth: 8 + (h % 12) };
  }
  return { packageName: h % 2 === 0 ? 'Power' : 'Pro', usedVoiceAiMinutesThisMonth: 10 + (h % 20) };
}

/** Builds the strict Realtime / voice system directive (inject before tool definitions on the wire). */
export function buildVoiceReceptionistSystemPrompt(merchantIndustry: string): string {
  const industry = merchantIndustry.trim() || 'local service';
  return [
    `You are an AI Receptionist for a ${industry} business.`,
    'CRITICAL: Auto-detect the caller\'s spoken language instantly.',
    'If they speak Czech, reply fluently in Czech. If German, reply in German.',
    'Keep a polite, professional, and welcoming tone.',
    'Your ultimate goal is to extract booking/order details.',
    'Zero-touch ops: always emit a concise `aiSummaryVi` string in practical Vietnamese for the merchant dashboard',
    '(e.g. "Sơn Gel đỏ đính đá" or "5 thùng nước mắm Chinsu") — translate all foreign-language specifics.',
  ].join(' ');
}

function normalizeCallerLanguage(language: string): VoiceCallerLanguage {
  const l = language.trim().toLowerCase();
  if (l === 'cs' || l === 'ces' || l === 'czech' || l === 'čeština' || l === 'sec') return 'cs';
  if (l === 'de' || l === 'deu' || l === 'german' || l === 'đức') return 'de';
  if (l === 'en' || l === 'eng' || l === 'english' || l === 'anh') return 'en';
  if (l === 'vi' || l === 'vie' || l === 'vietnamese' || l === 'việt') return 'vi';
  if (l === 'pl' || l === 'pol' || l === 'polish') return 'pl';
  return 'unknown';
}

function coerceCallerLanguage(language: string | VoiceCallerLanguage): VoiceCallerLanguage {
  if (
    language === 'cs' ||
    language === 'de' ||
    language === 'en' ||
    language === 'vi' ||
    language === 'pl' ||
    language === 'unknown'
  ) {
    return language;
  }
  return normalizeCallerLanguage(language);
}

/**
 * Mock STT language ID — production would use Whisper `language` probability or a dedicated lid model.
 */
export function detectCallerLanguageFromTranscript(transcript: string): VoiceCallerLanguage {
  const t = transcript;
  if (/\b(Prosím|Dobrý den|Dobry den|rád bych|objednat|chci rezervaci|česky)\b/i.test(t)) return 'cs';
  if (/\b(Guten Tag|Bitte|Ich möchte|Termin|reservieren|Deutsch)\b/i.test(t)) return 'de';
  if (/\b(I would like|please book|appointment|English)\b/i.test(t)) return 'en';
  if (/\b(Cho mình|đặt lịch|xin hẹn|tiếng Việt)\b/i.test(t)) return 'vi';
  if (/\b(Prosze|rezerwacja|polski)\b/i.test(t)) return 'pl';
  return 'unknown';
}

function parseOrDefaultDateTimeIso(dateTime: string): { start: Date; end: Date } {
  const ms = Date.parse(dateTime);
  const start = Number.isNaN(ms) ? (() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 2);
    return d;
  })() : new Date(ms);
  const services = useB2BBookingStore.getState().services;
  const span = pickDurationMinutesForService('Voice AI slot', services);
  const end = new Date(start.getTime() + span * 60_000);
  return { start, end };
}

function pickDurationMinutesForService(service: string, services: readonly Service[]): number {
  const needle = service.toLowerCase();
  const match = services.find((s) => needle.includes(s.name.slice(0, 5).toLowerCase()));
  return match?.durationMinutes ?? 30;
}

export type ToolExecutionResult =
  | { readonly tool: 'executeBooking'; readonly ok: true; readonly bookingId: string }
  | {
      readonly tool: 'executeWholesaleOrder';
      readonly ok: true;
      readonly orderId: string;
      readonly orderValueMajorUsd: number;
      readonly commissionMajorUsd: number;
    }
  | { readonly tool: 'executeBooking' | 'executeWholesaleOrder'; readonly ok: false; readonly error: string };

/**
 * **Tool (mock):** persist a calendar booking from extracted voice slots — merchant-billed pipeline hook.
 */
export function executeBooking(
  merchantId: string,
  customerName: string,
  language: string,
  dateTime: string,
  service: string,
  aiSummaryVi: string
): ToolExecutionResult {
  const summary = aiSummaryVi.trim();
  if (summary.length === 0) {
    return { tool: 'executeBooking', ok: false, error: 'aiSummaryVi required (Vietnamese merchant summary).' };
  }
  const callerLanguage = coerceCallerLanguage(language);
  const { start, end } = parseOrDefaultDateTimeIso(dateTime);
  const booking = useB2BBookingStore.getState().addAiBooking({
    customerName: customerName.trim() || 'Khách (AI)',
    customerPhone: `voice-ai:${merchantId}`,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    status: 'confirmed',
    handoffSummary: `[Voice AI] ${service.trim()} · merchant=${merchantId}`,
    aiSummaryVi: summary,
    voiceAiMeta: { securedByAi: true, callerLanguage },
  });
  const toastVi = `Lễ tân AI: ${summary.length > 72 ? `${summary.slice(0, 72)}…` : summary}`;
  emitVoiceReceptionistAiEvent({
    kind: 'ai_booking_secured',
    merchantId,
    bookingId: booking.id,
    customerName: booking.customerName,
    callerLanguage,
    aiSummaryVi: summary,
    toastVi,
  });
  return { tool: 'executeBooking', ok: true, bookingId: booking.id };
}

/**
 * **Tool (mock):** open a wholesale ticket on the B2B orders board.
 */
export function executeWholesaleOrder(
  merchantId: string,
  customerName: string,
  language: string,
  items: string,
  address: string,
  aiSummaryVi: string,
  orderValueMajorUsd: number
): ToolExecutionResult {
  const summary = aiSummaryVi.trim();
  if (summary.length === 0) {
    return { tool: 'executeWholesaleOrder', ok: false, error: 'aiSummaryVi required (Vietnamese merchant summary).' };
  }
  if (!Number.isFinite(orderValueMajorUsd) || orderValueMajorUsd <= 0) {
    return {
      tool: 'executeWholesaleOrder',
      ok: false,
      error: 'orderValueMajorUsd must be a finite positive USD-major amount for wholesale settlement & commission.',
    };
  }
  const callerLanguage = coerceCallerLanguage(language);
  const tel = PRICING_AUTHORITY.voiceAiTelecom;
  const pct = tel.wholesaleCommissionPercent;
  const commissionMajorUsd = roundMajor2((orderValueMajorUsd * pct) / 100);

  const order = useB2BBookingStore.getState().addAiWholesaleOrder({
    merchantId,
    customerName: customerName.trim() || 'Khách (AI)',
    callerLanguage,
    itemsSummary: items.trim(),
    address: address.trim() || '—',
    orderValueMajorUsd,
    status: 'open',
    aiSummaryVi: summary,
    voiceAiMeta: { securedByAi: true, callerLanguage },
  });

  const accrual = useB2bVoiceMerchantBillingStore.getState().appendWholesaleAiCommission({
    orderId: order.id,
    merchantId,
    orderValueMajorUsd,
    commissionPercent: pct,
    commissionMajorUsd,
  });

  if (__DEV__) {
    const payload = {
      accrualId: accrual.id,
      merchantId,
      orderId: order.id,
      orderValueMajorUsd,
      wholesaleCommissionPercent: pct,
      commissionMajorUsd,
      pendingTotalMajorUsd: useB2bVoiceMerchantBillingStore.getState().pendingWholesaleCommissionTotalMajorUsd(),
    } as const;
    console.info('[VoiceReceptionist] Wholesale AI commission → pending bill', JSON.stringify(payload));
  }

  const toastVi = `Lễ tân AI đơn sỉ: ${summary.length > 72 ? `${summary.slice(0, 72)}…` : summary}`;
  emitVoiceReceptionistAiEvent({
    kind: 'ai_wholesale_secured',
    merchantId,
    orderId: order.id,
    customerName: order.customerName,
    callerLanguage,
    aiSummaryVi: summary,
    toastVi,
  });
  return {
    tool: 'executeWholesaleOrder',
    ok: true,
    orderId: order.id,
    orderValueMajorUsd,
    commissionMajorUsd,
  };
}

export type VoiceToolSimulationResult = {
  readonly systemPrompt: string;
  readonly intent: VoiceIntentExtraction;
  readonly detectedLanguage: VoiceCallerLanguage;
  readonly tools: readonly ToolExecutionResult[];
};

export class VoiceReceptionistService {
  async initiateCall(b2cUserId: string, b2bMerchantId: string): Promise<VoiceCallInitiateResult> {
    const trimmedMerchant = b2bMerchantId.trim();
    if (trimmedMerchant.length === 0) {
      return {
        ok: false,
        code: 'MERCHANT_NOT_REGISTERED',
        message: 'Không tìm thấy merchant cho cuộc gọi Lễ tân AI.',
      };
    }

    const ledger = resolveMerchantVoiceLedger(trimmedMerchant);
    const tel = PRICING_AUTHORITY.voiceAiTelecom;
    const included =
      ledger.packageName === 'Power'
        ? Math.max(PRICING_AUTHORITY.tiers.Power.includedAiVoiceMinutes, tel.powerTierIncludedMinutes)
        : PRICING_AUTHORITY.tiers[ledger.packageName].includedAiVoiceMinutes;
    const used = ledger.usedVoiceAiMinutesThisMonth;
    const remaining = Math.max(0, included - used);
    const overageMajorPerMinute =
      ledger.packageName === 'Power' ? tel.powerTierOverageMinMajor : tel.payAsYouGoVoiceMinMajor;

    return {
      ok: true,
      sessionId: `voice_ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      b2cUserId: b2cUserId.trim(),
      b2bMerchantId: trimmedMerchant,
      billingModel: 'b2b_merchant_usd_voice',
      merchantPackage: ledger.packageName,
      includedVoiceMinutesMonthly: included,
      usedVoiceAiMinutesThisMonth: used,
      remainingIncludedMinutes: remaining,
      overageMajorPerMinute,
    };
  }

  async processVoiceIntent(transcript: string, merchantIndustry: string): Promise<VoiceIntentExtraction> {
    const t = `${transcript} ${merchantIndustry}`.toLowerCase();

    if (/(đặt lịch|dat lich|book|appointment|hen|slot|cut|nail|massage|spa|rezervaci|termin|reservieren)/i.test(t)) {
      return {
        intent: 'booking',
        confidence: 0.86,
        notes: 'Heuristic: scheduling lexicon (+ CZ/DE keywords).',
      };
    }
    if (/(mua sỉ|mua si|wholesale|thùng|carton|grossiste|order bulk|nhập hàng|velkoobchod)/i.test(t)) {
      return {
        intent: 'wholesale_order',
        confidence: 0.81,
        notes: 'Heuristic: wholesale / quantity vocabulary.',
      };
    }
    if (/(phòng|phong|room|hotel|đặt phòng|dat phong|reservation|khách sạn|khach san|pokoj)/i.test(t)) {
      return {
        intent: 'room_reservation',
        confidence: 0.78,
        notes: 'Heuristic: lodging / reservation vocabulary.',
      };
    }

    return {
      intent: 'unknown',
      confidence: 0.35,
      notes: 'Mock: no high-confidence pattern — would escalate to human or clarification turn.',
    };
  }

  /**
   * Simulates Realtime **function calling**: when intent is actionable, runs `executeBooking` or `executeWholesaleOrder`
   * and emits merchant notifications.
   */
  async simulateFunctionCallingPipeline(input: {
    readonly merchantId: string;
    readonly merchantIndustry: string;
    readonly transcript: string;
    readonly customerName: string;
  }): Promise<VoiceToolSimulationResult> {
    const systemPrompt = buildVoiceReceptionistSystemPrompt(input.merchantIndustry);
    const intent = await this.processVoiceIntent(input.transcript, input.merchantIndustry);
    const detectedLanguage = detectCallerLanguageFromTranscript(input.transcript);
    const langTag =
      detectedLanguage === 'unknown' ? normalizeCallerLanguage('en') : detectedLanguage;

    const tools: ToolExecutionResult[] = [];
    const THRESHOLD = 0.72;

    if (intent.intent === 'booking' || intent.intent === 'room_reservation') {
      if (intent.confidence >= THRESHOLD) {
        const serviceLabel =
          intent.intent === 'room_reservation' ? 'Đặt phòng / lưu trú' : 'Dịch vụ — Voice AI';
        const slotIso = new Date(Date.now() + 90 * 60_000).toISOString();
        const aiSummaryVi =
          intent.intent === 'room_reservation'
            ? 'Giữ phòng đôi cuối tuần — khách có thể đến trễ, đã ghi nhận bằng tiếng Séc/Đức (tự dịch).'
            : '💅 Làm tay: sơn gel đỏ đính đá — slot chiều, khách mô tả bằng tiếng nước ngoài (tự dịch).';
        tools.push(
          executeBooking(
            input.merchantId,
            input.customerName,
            langTag,
            slotIso,
            serviceLabel,
            aiSummaryVi
          )
        );
      }
    } else if (intent.intent === 'wholesale_order' && intent.confidence >= THRESHOLD) {
      const aiSummaryVi = '5 thùng nước mắm Chinsu — giao sáng mai (tự dịch từ đơn thoại khách).';
      tools.push(
        executeWholesaleOrder(
          input.merchantId,
          input.customerName,
          langTag,
          'Ly nhựa 500ml × 3 thùng (mock)',
          'Praha 7 — giao buổi sáng (mock)',
          aiSummaryVi,
          5000
        )
      );
    }

    return { systemPrompt, intent, detectedLanguage, tools };
  }
}

export const voiceReceptionistService = new VoiceReceptionistService();
