/**
 * Outbound AI Sales Force — **architecture bridge** (mock client).
 *
 * Production intent:
 * - **Twilio Voice**: REST `Calls.create` (or Twilio SDK) outbound to `targetPhone`, TwiML URL points at media stream.
 * - **AI voice**: OpenAI Realtime API **or** Gemini Live over WebSocket; server merges telephony ↔ model; partial transcripts streamed to CRM.
 *
 * This module simulates dial outcome + objection handling script and writes to `useOutboundAiSalesCrmStore`.
 */

import {
  useOutboundAiSalesCrmStore,
  type OutboundCampaignMode,
  type OutboundSalesCallDisposition,
} from '../../state/outboundAiSalesCrm';

export type { OutboundCampaignMode } from '../../state/outboundAiSalesCrm';

/** E.164 country calling codes for Twilio local number provisioning (mock / production intent). */
const DIAL_CODE_BY_ISO2: Readonly<Record<string, `+${string}`>> = {
  US: '+1',
  AU: '+61',
  JP: '+81',
  VN: '+84',
  GB: '+44',
  DE: '+49',
  FR: '+33',
  CZ: '+420',
  PL: '+48',
  AT: '+43',
  CH: '+41',
  IT: '+39',
  ES: '+34',
  NL: '+31',
} as const;

export type TwilioLocalNumberProvisionMock = {
  readonly countryCode: string;
  readonly dialCode: `+${string}`;
  readonly exampleE164: string;
  readonly twilioIncomingNumberSidMock: string;
};

/**
 * Resolves a local Twilio DID plan for outbound AI sales based on merchant country (GPS / registration).
 * Mock returns deterministic example E.164; production would call Twilio AvailablePhoneNumber + IncomingPhoneNumber APIs.
 */
export function provisionTwilioLocalNumberMock(countryCode: string): TwilioLocalNumberProvisionMock {
  const raw = countryCode.trim().toUpperCase();
  const iso2 = raw.length === 2 ? raw : 'US';
  const dialCode = DIAL_CODE_BY_ISO2[iso2] ?? '+1';
  const exampleE164 = `${dialCode}5550199` as const;
  return {
    countryCode: iso2,
    dialCode,
    exampleE164,
    twilioIncomingNumberSidMock: `PN_mock_${iso2}_${Math.random().toString(36).slice(2, 10)}`,
  };
}

export type ParsedCampaignLead = {
  readonly phone: string;
  readonly businessName: string;
};

/** Parses scraped CSV: `phone,businessName` per line; optional header row `phone,name`. */
export function parseOutboundLeadCsv(raw: string): readonly ParsedCampaignLead[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const out: ParsedCampaignLead[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (out.length === 0 && (lower.startsWith('phone') || lower.startsWith('sdt'))) {
      continue;
    }
    const idx = line.indexOf(',');
    if (idx === -1) continue;
    const phone = line
      .slice(0, idx)
      .trim()
      .replace(/^["']|["']$/g, '');
    const businessName = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (phone.length > 0) {
      out.push({ phone, businessName: businessName.length > 0 ? businessName : 'Merchant' });
    }
  }
  return out;
}

export type OutboundSalesCallResult = {
  readonly logId: string;
  readonly disposition: OutboundSalesCallDisposition;
  readonly transcriptVi: string;
  readonly twilioCallSidMock: string;
  readonly twilioProvisioning: TwilioLocalNumberProvisionMock;
};

function hashPickIndex(seed: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % modulo;
}

function pickDisposition(phone: string, businessName: string): OutboundSalesCallDisposition {
  const bucket = hashPickIndex(`${phone}|${businessName}`, 100);
  if (bucket < 8) return 'busy';
  if (bucket < 14) return 'no_answer';
  if (bucket < 18) return 'failed';
  if (bucket < 38) return 'not_interested';
  if (bucket < 58) return 'answered';
  return 'interested';
}

function dispositionLabelVi(d: OutboundSalesCallDisposition): string {
  switch (d) {
    case 'answered':
      return 'Đã nghe máy';
    case 'busy':
      return 'Máy bận';
    case 'interested':
      return 'Quan tâm (chốt demo)';
    case 'not_interested':
      return 'Không quan tâm';
    case 'no_answer':
      return 'Không trả lời';
    case 'failed':
      return 'Lỗi kết nối';
  }
}

/** Lễ Tân AI — 90-day SEO trap + EU salon pitch (OpenAI Realtime / Twilio server merge in production). */
function buildSeo90SniperTranscriptVi(businessName: string, disposition: OutboundSalesCallDisposition): string {
  const b = businessName.trim() || 'Salon';
  const intro =
    `Lễ Tân AI: Good day — ViGlobal V7. Am I speaking with the owner of ${b}?\n` +
    `Salon: Yes, briefly please.\n` +
    `Lễ Tân AI: We offer a **90-day SEO visibility pilot** on ViGlobal Omniverse — zero listing fee during the trial; ` +
    `your salon appears in local B2B + tourist discovery with AI receptionist answering DE/FR/EN. ` +
    `Commission only activates after you **opt in** post-trial — full tracking on your dashboard.\n`;

  if (disposition === 'interested') {
    return (
      `${intro}` +
      `Salon: Sounds structured — send me the onboarding link.\n` +
      `Lễ Tân AI: Perfect — SMS arriving now with secure link + broker attribution. Thank you!\n` +
      `[Disposition · INTERESTED · campaign=seo90_sniper]`
    );
  }
  if (disposition === 'not_interested') {
    return `${intro}Salon: Not for us.\nLễ Tân AI: Understood — we will not remarket for 90 days. Goodbye.\n[Disposition · NOT_INTERESTED]`;
  }
  if (disposition === 'busy' || disposition === 'no_answer' || disposition === 'failed') {
    return `${intro}[No live dialogue · ${disposition}]`;
  }
  return `${intro}Salon: I'll review the email if you send it.\nLễ Tân AI: Noted — follow-up sequence paused for 7 days.\n[Disposition · ANSWERED]`;
}

function buildTranscriptVi(
  businessName: string,
  disposition: OutboundSalesCallDisposition,
  campaignMode: OutboundCampaignMode
): string {
  if (campaignMode === 'seo90_sniper') {
    return buildSeo90SniperTranscriptVi(businessName, disposition);
  }

  const b = businessName.trim() || 'anh/chị';
  const intro =
    `AI: Xin chào, em là trợ lý bán hàng của Kết Nối Global — có phải đang nói với chủ ${b} không ạ?\n` +
    `Chủ tiệm: Ừ, nói đi.\n` +
    `AI: Em gọi ngắn 45 giây thôi: Lễ tân AI trả lời cuộc gọi đặt lịch / đơn sỉ bằng tiếng Đức–Séc–Anh, anh không cần nhỡ máy khi đang làm khách.\n`;

  if (disposition === 'busy') {
    return `${intro}Chủ tiệm: Đang bận, gọi lại sau.\nAI: Dạ em ghi nhận — chúc anh ca làm tốt ạ.\n[Kết thúc · ${dispositionLabelVi(disposition)}]`;
  }
  if (disposition === 'no_answer' || disposition === 'failed') {
    return `${intro}[Không có thoại tiếp · ${dispositionLabelVi(disposition)}]`;
  }

  const objectionBusy =
    `Chủ tiệm: Tôi đang bận lắm, bớt quảng cáo giùm.\n` +
    `AI: Dạ em hiểu — chỉ 1 câu: nếu 1 cuộc gọi lỡ = 1 slot trống, anh có muốn nghe 20 giây bản thử giọng AI không ạ?\n`;

  const objectionPrice =
    `Chủ tiệm: Bao nhiêu tiền?\n` +
    `AI: Gói pilot Freemium 7 ngày cho CRM — sau đó mới tính phí theo phút thoại; em gửi link demo Zalo/Messenger ngay sau cuộc gọi.\n`;

  const interestedClose =
    `Chủ tiệm: Ok, gửi link thử đi.\n` +
    `AI: Dạ em gửi link app + shock demo trong 2 phút. Cảm ơn anh đã cho cơ hội!\n[Kết thúc · ${dispositionLabelVi('interested')}]`;

  const notInterestedClose =
    `Chủ tiệm: Không cần đâu.\n` +
    `AI: Dạ em ghi “không quan tâm”, không gọi lại trong 90 ngày. Chúc anh kinh doanh thuận lợi!\n[Kết thúc · ${dispositionLabelVi('not_interested')}]`;

  const answeredOnly =
    `Chủ tiệm: Nghe thử xem sao.\n` + objectionBusy + objectionPrice + `Chủ tiệm: Để tôi xem link.\n[Kết thúc · ${dispositionLabelVi('answered')}]`;

  if (disposition === 'interested') {
    return `${intro}${objectionBusy}${objectionPrice}${interestedClose}`;
  }
  if (disposition === 'not_interested') {
    return `${intro}${objectionBusy}${notInterestedClose}`;
  }
  return `${intro}${answeredOnly}`;
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type DialInput = Readonly<{
  targetPhone: string;
  businessName: string;
  leadId: string | undefined;
  merchantCountryCode: string;
  campaignMode: OutboundCampaignMode;
}>;

async function runOutboundDial(input: DialInput): Promise<OutboundSalesCallResult> {
  const phone = input.targetPhone.trim();
  const name = input.businessName.trim();
  const twilioProvisioning = provisionTwilioLocalNumberMock(input.merchantCountryCode);

  if (phone.length === 0) {
    const log = useOutboundAiSalesCrmStore.getState().appendLog({
      leadId: input.leadId,
      targetPhone: '',
      businessName: name.length > 0 ? name : 'Merchant',
      disposition: 'failed',
      transcriptVi:
        '[Hệ thống] Thiếu số điện thoại hợp lệ — không khởi tạo Twilio Outbound. Nhập SĐT đầy đủ rồi thử lại.',
      merchantCountryIso2: twilioProvisioning.countryCode,
      twilioDialCodeMock: twilioProvisioning.dialCode,
      campaignMode: input.campaignMode,
    });
    return {
      logId: log.id,
      disposition: 'failed',
      transcriptVi: log.transcriptVi,
      twilioCallSidMock: `CA_err_${log.id.slice(-8)}`,
      twilioProvisioning,
    };
  }

  await sleepMs(280 + hashPickIndex(phone, 220));

  const disposition = pickDisposition(phone, name || phone);
  const transcriptVi = buildTranscriptVi(name || 'Merchant', disposition, input.campaignMode);

  const log = useOutboundAiSalesCrmStore.getState().appendLog({
    leadId: input.leadId,
    targetPhone: phone,
    businessName: name.length > 0 ? name : 'Merchant',
    disposition,
    transcriptVi,
    merchantCountryIso2: twilioProvisioning.countryCode,
    twilioDialCodeMock: twilioProvisioning.dialCode,
  });

  if (__DEV__) {
    console.info('[OutboundAiSales] mock Twilio+AI bridge', {
      logId: log.id,
      disposition,
      twilioCallSid: `CA_mock_${log.id.slice(-10)}`,
      localDidPlan: twilioProvisioning,
      provider: 'OpenAI-Realtime|Gemini-Live (server-side)',
    });
  }

  return {
    logId: log.id,
    disposition,
    transcriptVi,
    twilioCallSidMock: `CA_mock_${log.id.slice(-10)}`,
    twilioProvisioning,
  };
}

/**
 * Initiates an outbound AI sales call (mock): Twilio Voice outbound + OpenAI Realtime / Gemini Live (server-side).
 * Logs **Answered / Busy / Interested / Not interested** (+ no-answer/failed) to CRM store.
 *
 * Optional `leadId` ties the transcript to a CRM row (Sales Lead screen).
 */
export async function initiateOutboundSalesCall(
  targetPhone: string,
  businessName: string,
  leadId?: string,
  /** ISO 3166-1 alpha-2 from B2B merchant GPS / registration — selects Twilio local number pool. */
  merchantCountryCode = 'US',
  campaignMode: OutboundCampaignMode = 'default'
): Promise<OutboundSalesCallResult> {
  return runOutboundDial({ targetPhone, businessName, leadId, merchantCountryCode, campaignMode });
}
