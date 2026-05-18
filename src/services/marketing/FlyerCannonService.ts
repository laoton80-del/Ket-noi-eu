/**
 * **Flyer Cannon** — V7 OMNIVERSE viral growth: premium share-card + **tracked** deep links.
 * Every impression carries `brokerId` (UUID) for **lifelong commission** (Trojan attribution) + `merchantId` for salon-level analytics.
 *
 * Deep links land on **Free Tour / Demo Mode** entry (`demo_tour=1`) so acquisition cost is measurable before paywall.
 */

import { isValidUuid } from '../broker/V7AttributionService';

/** Must match `expo.scheme` (`app.config.js`). */
export const V7_APP_LINK_SCHEME = 'ketnoiglobal' as const;

export const V7_FLYER_QUERY = {
  campaign: 'flyer_cannon',
  /** 90-day SEO trap preview — legal copy lives server-side; this is routing metadata only. */
  trap: 'seo90_preview',
  demoTour: '1',
} as const;

export type ViralFlyerResult = Readonly<{
  /** Mock CDN / OG image for social & print preflight (replace with Cloudinary / Resized CDN in prod). */
  shareCardImageUrl: string;
  /** Native app URI — opens ViGlobal with attribution + demo entry flags. */
  deepLinkApp: string;
  /** HTTPS universal link for SMS / Meta / Google Ads (configure host + AASA / assetlinks). */
  deepLinkUniversal: string;
  /** Idempotent ref for CRM / BigQuery — never bill media without this key. */
  trackingRef: string;
}>;

function slugForTracking(merchantId: string): string {
  return merchantId.trim().replace(/\s+/g, '_').slice(0, 48) || 'merchant';
}

/**
 * Generates a **premium visual** placeholder URL and **dual-rail** deep links (app + universal) carrying broker + merchant.
 * @throws if `brokerId` is not a UUID (prevents orphan commissions).
 */
export function generateViralFlyer(brokerId: string, merchantId: string): ViralFlyerResult {
  const bid = brokerId.trim();
  const mid = merchantId.trim();
  if (!isValidUuid(bid)) {
    throw new Error('FlyerCannon: brokerId must be a valid UUID for commission tracking');
  }
  if (mid.length === 0) {
    throw new Error('FlyerCannon: merchantId required for salon-level attribution');
  }

  const trackingRef = `fc_${bid.replace(/-/g, '').slice(0, 12)}_${slugForTracking(mid)}_${Date.now().toString(36)}`;
  const qp = new URLSearchParams({
    brokerId: bid,
    merchantId: mid,
    v7_campaign: V7_FLYER_QUERY.campaign,
    v7_trap: V7_FLYER_QUERY.trap,
    demo_tour: V7_FLYER_QUERY.demoTour,
    tracking_ref: trackingRef,
  });

  const deepLinkApp = `${V7_APP_LINK_SCHEME}://tour?${qp.toString()}`;
  const universalBase =
    process.env.EXPO_PUBLIC_MARKETING_UNIVERSAL_LINK_BASE?.trim()?.replace(/\/+$/, '') ??
    'https://app.ketnoiglobal.com';
  const deepLinkUniversal = `${universalBase}/tour?${qp.toString()}`;

  const shareCardImageUrl = `https://placehold.co/1080x1920/0A1628/C5A059/FFFFFF/png?text=${encodeURIComponent(
    'VIONA · V7 Free Tour'
  )}&ref=${encodeURIComponent(trackingRef)}`;

  return {
    shareCardImageUrl,
    deepLinkApp,
    deepLinkUniversal,
    trackingRef,
  };
}
