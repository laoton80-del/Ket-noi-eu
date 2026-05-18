/**
 * V7 OMNIVERSE — **Outbound AI Sniper**: voice outbound + **OpenAI Realtime** (server-side merge).
 * Onboarding links use **email / deep-link webhooks** (Zero-SMS Doctrine) — no carrier SMS.
 */

import { devWarn } from '../../utils/devLog';
import {
  initiateOutboundSalesCall,
  parseOutboundLeadCsv,
  provisionTwilioLocalNumberMock,
  type OutboundSalesCallResult,
  type ParsedCampaignLead,
  type TwilioLocalNumberProvisionMock,
} from './OutboundAiSalesService';

export type { OutboundCampaignMode } from '../../state/outboundAiSalesCrm';
export type { ParsedCampaignLead, TwilioLocalNumberProvisionMock } from './OutboundAiSalesService';
export {
  initiateOutboundSalesCall,
  parseOutboundLeadCsv,
  provisionTwilioLocalNumberMock,
} from './OutboundAiSalesService';

const EU_ISO_POOL = ['DE', 'FR', 'CZ', 'IT', 'PL', 'NL', 'ES', 'AT'] as const;

export type OnboardingLinkDeliveryResult =
  | Readonly<{ ok: true; deliveryIdMock: string }>
  | Readonly<{ ok: false; code: string }>;

const TOUR_BASE = () =>
  process.env.EXPO_PUBLIC_MARKETING_UNIVERSAL_LINK_BASE?.trim() || 'https://app.ketnoiglobal.com/tour';

/**
 * Delivers ViGlobal **onboarding + Free Tour** link via **email / data webhook** (no SMS).
 * Prefer `EXPO_PUBLIC_MARKETING_ONBOARDING_EMAIL_WEBHOOK_URL` (POST JSON with `toEmail` or `toE164` for CRM correlation).
 */
export async function sendOnboardingLinkDelivery(input: {
  phoneE164: string;
  email?: string | null;
}): Promise<OnboardingLinkDeliveryResult> {
  const to = input.phoneE164.trim();
  if (to.length < 8) {
    return { ok: false, code: 'invalid_e164' };
  }

  const body =
    'VIONA V7: Your 90-day SEO pilot + Free Omniverse Tour — tap to continue (broker-attributed): ' + TOUR_BASE();

  const webhook = process.env.EXPO_PUBLIC_MARKETING_ONBOARDING_EMAIL_WEBHOOK_URL?.trim() ?? '';

  const payload = {
    kind: 'seo90_sniper_onboarding_data' as const,
    toE164: to,
    toEmail: typeof input.email === 'string' && input.email.trim().length > 0 ? input.email.trim() : null,
    body,
    channels: ['email', 'push'] as const,
  };

  if (webhook.length > 0) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        return { ok: false, code: `http_${res.status}` };
      }
      return { ok: true, deliveryIdMock: `em_sn_${Date.now().toString(36)}` };
    } catch (e) {
      return { ok: false, code: e instanceof Error ? e.message : 'network' };
    }
  }

  if (__DEV__) {
    devWarn('OutboundAISniper', 'onboarding_webhook_missing_EXPO_PUBLIC_MARKETING_ONBOARDING_EMAIL_WEBHOOK_URL', payload);
  }
  return { ok: true, deliveryIdMock: `em_mock_${Date.now().toString(36)}` };
}

/** @deprecated Use {@link sendOnboardingLinkDelivery} — SMS retired. */
export async function sendSmsOnboardingLink(phoneNumber: string): Promise<OnboardingLinkDeliveryResult> {
  return sendOnboardingLinkDelivery({ phoneE164: phoneNumber });
}

export type ColdCallCampaignSummary = Readonly<{
  attempted: number;
  interested: number;
  onboardingLinksSent: number;
  callResults: readonly OutboundSalesCallResult[];
}>;

/**
 * **Lễ Tân AI** cold-call wave: pitches the **90-day SEO trial** to European salons; on **interested**, fires data-channel onboarding (no SMS).
 */
export async function executeColdCallCampaign(targetPhoneList: readonly string[]): Promise<ColdCallCampaignSummary> {
  const results: OutboundSalesCallResult[] = [];
  let interested = 0;
  let onboardingLinksSent = 0;
  let attempted = 0;

  for (let i = 0; i < targetPhoneList.length; i += 1) {
    const raw = targetPhoneList[i]?.trim() ?? '';
    if (raw.length === 0) continue;
    attempted += 1;
    const iso = EU_ISO_POOL[i % EU_ISO_POOL.length];
    const salonLabel = `EU Salon · ${iso}`;
    const r = await initiateOutboundSalesCall(raw, salonLabel, undefined, iso, 'seo90_sniper');
    results.push(r);
    if (r.disposition === 'interested') {
      interested += 1;
      const sent = await sendOnboardingLinkDelivery({ phoneE164: raw });
      if (sent.ok) onboardingLinksSent += 1;
    }
  }

  return { attempted, interested, onboardingLinksSent, callResults: results };
}
