import { create } from 'zustand';

/** Outbound dial lane — attribution for CMO dashboards (no spend without a mode). */
export type OutboundCampaignMode = 'default' | 'seo90_sniper';

/** Twilio leg + AI disposition (normalized for CRM dashboards). */
export type OutboundSalesCallDisposition =
  | 'answered'
  | 'busy'
  | 'interested'
  | 'not_interested'
  | 'no_answer'
  | 'failed';

export type OutboundAiCallLog = {
  readonly id: string;
  /** When known (e.g. CRM row); campaign CSV rows may omit. */
  readonly leadId: string | undefined;
  readonly targetPhone: string;
  readonly businessName: string;
  readonly disposition: OutboundSalesCallDisposition;
  readonly transcriptVi: string;
  readonly createdAtIso: string;
  /** Merchant/B2B ISO 3166-1 alpha-2 used for Twilio local DID provisioning (mock). */
  readonly merchantCountryIso2?: string;
  readonly twilioDialCodeMock?: string;
  readonly campaignMode?: OutboundCampaignMode;
};

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

type OutboundAiSalesCrmState = {
  readonly logs: readonly OutboundAiCallLog[];
  appendLog: (row: Omit<OutboundAiCallLog, 'id' | 'createdAtIso'> & { readonly id?: string }) => OutboundAiCallLog;
  getLogsForLeadId: (leadId: string) => readonly OutboundAiCallLog[];
  getLogsMatchingPhoneDigits: (digits: string) => readonly OutboundAiCallLog[];
};

export const useOutboundAiSalesCrmStore = create<OutboundAiSalesCrmState>((set, get) => ({
  logs: [],
  appendLog: (row) => {
    const created: OutboundAiCallLog = {
      id: row.id ?? `ob_ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      createdAtIso: new Date().toISOString(),
      leadId: row.leadId,
      targetPhone: row.targetPhone,
      businessName: row.businessName,
      disposition: row.disposition,
      transcriptVi: row.transcriptVi,
      merchantCountryIso2: row.merchantCountryIso2,
      twilioDialCodeMock: row.twilioDialCodeMock,
      campaignMode: row.campaignMode,
    };
    set((s) => ({ logs: [created, ...s.logs] }));
    return created;
  },
  getLogsForLeadId: (leadId) => get().logs.filter((l) => l.leadId === leadId),
  getLogsMatchingPhoneDigits: (digits) => {
    const needle = normalizePhoneDigits(digits);
    if (needle.length < 6) return [];
    return get().logs.filter((l) => {
      const h = normalizePhoneDigits(l.targetPhone);
      return h === needle || (needle.length >= 8 && h.endsWith(needle.slice(-9))) || h.endsWith(needle.slice(-8));
    });
  },
}));
