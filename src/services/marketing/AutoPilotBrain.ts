/**
 * Auto-Pilot Brain — ties growth triggers to omni-channel delivery (push + social; Zero-SMS Doctrine).
 */

import { isB2bQrEnforcementDue, mockSetB2bMerchantOnboardedHoursAgo, mockSetB2bMerchantSponsoredSlot } from './AutoTriggerService';
import { sendAppPush, sendSocialMessage, type OmniSendReceipt } from './OmniChannelService';

export const CAMPAIGN_QR_ENFORCEMENT = 'CAMPAIGN_QR_ENFORCEMENT' as const;
export const CAMPAIGN_RANK_PROTECTION = 'CAMPAIGN_RANK_PROTECTION' as const;
export const CAMPAIGN_KOL_DOPAMINE = 'CAMPAIGN_KOL_DOPAMINE' as const;
export const CAMPAIGN_B2C_RECOVERY = 'CAMPAIGN_B2C_RECOVERY' as const;

export type CampaignId =
  | typeof CAMPAIGN_QR_ENFORCEMENT
  | typeof CAMPAIGN_RANK_PROTECTION
  | typeof CAMPAIGN_KOL_DOPAMINE
  | typeof CAMPAIGN_B2C_RECOVERY;

export type BrainRunStatus = 'dispatched' | 'skipped' | 'partial';

export interface BrainCampaignReceipt {
  readonly campaignId: CampaignId;
  readonly status: BrainRunStatus;
  readonly receipts: readonly OmniSendReceipt[];
  readonly note?: string;
}

const KOL_DOPAMINE_THRESHOLD_MAJOR_USD = 5;
const B2C_RECOVERY_MIN_INACTIVE_DAYS = 3;

const SMS_RANK_BODY = 'MẤT TOP 1! Nạp tiền ngay để lấy lại khách!' as const;
const ZALO_KOL_BODY = 'Ting! Tiền về túi. Chia sẻ thêm để nhận hoa hồng lớn hơn!' as const;
const SMS_B2C_VOUCHER = 'Tặng 50 Xu gọi Leona miễn phí chỉ trong hôm nay. Quay lại ngay!' as const;

function summarizeStatus(receipts: readonly OmniSendReceipt[]): BrainRunStatus {
  if (receipts.length === 0) return 'skipped';
  const oks = receipts.filter((r) => r.ok).length;
  if (oks === receipts.length) return 'dispatched';
  if (oks === 0) return 'skipped';
  return 'partial';
}

/**
 * QR tier: ≥48h without QR pack → App push + Zalo reminder.
 */
export function runCampaignQrEnforcement(merchantId: string, zaloUserId: string): BrainCampaignReceipt {
  const mid = merchantId.trim();
  const zid = zaloUserId.trim();
  if (!mid || !zid) {
    return {
      campaignId: CAMPAIGN_QR_ENFORCEMENT,
      status: 'skipped',
      receipts: [],
      note: 'invalid_merchant_or_social_id',
    };
  }
  if (!isB2bQrEnforcementDue(mid)) {
    return {
      campaignId: CAMPAIGN_QR_ENFORCEMENT,
      status: 'skipped',
      receipts: [],
      note: 'not_due_or_qr_already_downloaded',
    };
  }
  const receipts: OmniSendReceipt[] = [];
  receipts.push(
    sendAppPush(
      '[QR] Hết hạn 48h — kích hoạt ngay',
      `Merchant ${mid}: Bạn chưa tải QR cửa hàng sau 48h. Quét = booking + menu. Zalo đồng bộ đã gửi song song.`
    )
  );
  receipts.push(
    sendSocialMessage(
      zid,
      'zalo',
      `Kết Nối EU · Merchant ${mid}: Nhắc nhở QR — tải gói QR ngay trong app B2B để không mất khách walk-in.`
    )
  );
  return { campaignId: CAMPAIGN_QR_ENFORCEMENT, status: summarizeStatus(receipts), receipts };
}

/**
 * Ads tier: outbid on sponsored → high-priority push + secondary push (replaces legacy SMS war-room alert).
 */
export function runCampaignRankProtection(merchantId: string, _phone: string, isOutbid: boolean): BrainCampaignReceipt {
  const mid = merchantId.trim();
  if (!mid) {
    return {
      campaignId: CAMPAIGN_RANK_PROTECTION,
      status: 'skipped',
      receipts: [],
      note: 'invalid_merchant',
    };
  }
  if (!isOutbid) {
    return {
      campaignId: CAMPAIGN_RANK_PROTECTION,
      status: 'skipped',
      receipts: [],
      note: 'not_outbid',
    };
  }
  const receipts: OmniSendReceipt[] = [];
  receipts.push(
    sendAppPush(
      'SOS · MẤT TOP SPONSORED',
      `Merchant ${mid}: Đối thủ vừa vượt bid — mất luồng khách top-of-feed. Ưu tiên cao.`
    )
  );
  receipts.push(
    sendAppPush('SOS · Nhắc nhanh (không SMS)', `${SMS_RANK_BODY} · Merchant ${mid}`)
  );
  return { campaignId: CAMPAIGN_RANK_PROTECTION, status: summarizeStatus(receipts), receipts };
}

/**
 * KOL tier: commission above threshold → Zalo dopamine ping.
 */
export function runCampaignKolDopamine(kolZaloUserId: string, amountMajorUsd: number): BrainCampaignReceipt {
  const zid = kolZaloUserId.trim();
  if (!zid || !Number.isFinite(amountMajorUsd)) {
    return {
      campaignId: CAMPAIGN_KOL_DOPAMINE,
      status: 'skipped',
      receipts: [],
      note: 'invalid_kol_or_amount',
    };
  }
  if (amountMajorUsd <= KOL_DOPAMINE_THRESHOLD_MAJOR_USD) {
    return {
      campaignId: CAMPAIGN_KOL_DOPAMINE,
      status: 'skipped',
      receipts: [],
      note: 'below_threshold',
    };
  }
  const receipts: OmniSendReceipt[] = [];
  receipts.push(sendSocialMessage(zid, 'zalo', ZALO_KOL_BODY));
  return { campaignId: CAMPAIGN_KOL_DOPAMINE, status: summarizeStatus(receipts), receipts };
}

/**
 * B2C recovery: inactive ≥3 days → SMS voucher nudge.
 */
export function runCampaignB2cRecovery(userId: string, _phone: string, inactiveDays: number): BrainCampaignReceipt {
  const uid = userId.trim();
  if (!uid) {
    return {
      campaignId: CAMPAIGN_B2C_RECOVERY,
      status: 'skipped',
      receipts: [],
      note: 'invalid_user',
    };
  }
  if (inactiveDays < B2C_RECOVERY_MIN_INACTIVE_DAYS) {
    return {
      campaignId: CAMPAIGN_B2C_RECOVERY,
      status: 'skipped',
      receipts: [],
      note: 'insufficient_inactivity',
    };
  }
  const receipts: OmniSendReceipt[] = [];
  receipts.push(
    sendAppPush('Ưu đãi quay lại', `${SMS_B2C_VOUCHER} · user ${uid.slice(0, 8)}…`)
  );
  return { campaignId: CAMPAIGN_B2C_RECOVERY, status: summarizeStatus(receipts), receipts };
}

/**
 * One-shot bundle for admin demos (deterministic fixture IDs).
 */
export function runOmniBrainDemoScenarios(): readonly BrainCampaignReceipt[] {
  const out: BrainCampaignReceipt[] = [];

  mockSetB2bMerchantOnboardedHoursAgo('merch-demo-qr', 49);
  out.push(runCampaignQrEnforcement('merch-demo-qr', 'zalo_merch_qr_001'));

  mockSetB2bMerchantSponsoredSlot('merch-demo-rank', 1);
  out.push(runCampaignRankProtection('merch-demo-rank', '+420999888777', true));

  out.push(runCampaignKolDopamine('zalo_kol_hero_77', 12.5));

  out.push(runCampaignB2cRecovery('b2c-demo-id', '+84901234567', 2));
  out.push(runCampaignB2cRecovery('b2c-demo-id', '+84901234567', 5));

  return out;
}
