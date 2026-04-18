/**
 * Read-only semantic map: doctrine / GLOBAL_V1 → public offers, backbone keys, repo surfaces.
 * Does not enforce billing or entitlement.
 *
 * Authority (do not invert): SoT `docs/GLOBAL_V1_*.md`; commercial doctrine `docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md`;
 * backbone names `docs/KNG_PDF_BACKBONE_DOCTRINE.md`; live wallet spine `docs/COMMERCIAL_SPINE_LIVE.md` → `commercialSpine.ts` / `globalWalletPackages.ts`.
 *
 * TODO(entitlement-phase): replace qualitative `includedFromPackages` / `addOnEligible` with server-backed matrix when signed off.
 */

import type { WalletPackageId } from './globalWalletPackages';

// ---------------------------------------------------------------------------
// Core enums (string unions — stable wire-friendly keys)
// ---------------------------------------------------------------------------

export type FlagshipDomain = 'learning' | 'b2c' | 'b2b';

/** Five public value offers (doctrine §4). Not to be confused with six wallet package tiers. */
export type PublicOfferKey = 'ai_teacher' | 'ai_support' | 'ai_document' | 'call_help' | 'business_ops';

/** Internal meters (doctrine §5) — accounting only; not end-user price labels. */
export type InternalMeterKey =
  | 'learning_minutes'
  | 'support_minutes'
  | 'assistant_actions'
  | 'document_pages'
  | 'b2b_operational_volume';

/** Six public wallet tiers (GLOBAL_V1 / `WalletPackageId`) — aligns with `globalWalletPackages.ts`. */
export type PackageTierKey = WalletPackageId;

export type ProductionRolloutStatus = 'active' | 'pilot' | 'planned';

/** Alias for spec/docs that say `ProductionStatus`. */
export type ProductionStatus = ProductionRolloutStatus;

export type CommercialSurfaceRef = {
  /** Stable slug for analytics / entitlement hooks later */
  id: string;
  kind: 'screen' | 'service' | 'component' | 'domain_module';
  /** Repo-relative path */
  path: string;
  notes?: string;
};

export type CommercialOfferDefinition = {
  key: PublicOfferKey;
  domain: FlagshipDomain;
  /** English-neutral name (logs, cross-locale tooling). */
  label: string;
  /** User-facing Vietnamese label (product copy may differ). */
  labelVi: string;
  /** Short doctrine anchor; scope aligns with `doctrineRefs`. */
  doctrineSection: string;
  /** Doc paths + optional § anchor (human-readable, not URL). */
  doctrineRefs: readonly string[];
  /**
   * Which wallet tiers **may** include baseline access to this offer per doctrine §6–7 narrative.
   * **Not** a live entitlement matrix — server policy TBD.
   */
  includedFromPackages: readonly PackageTierKey[];
  /** Tiers allowed to purchase add-ons / overage paths for this offer (qualitative until server matrix exists). */
  addOnEligible: readonly PackageTierKey[];
  internalMeters: readonly InternalMeterKey[];
  relatedSurfaces: readonly CommercialSurfaceRef[];
  notes: string;
  guardrails: string;
  productionStatus: ProductionRolloutStatus;
};

/** Canonical backbone capability keys (doctrine / PDF service grain). */
export type BackboneServiceKey =
  | 'learning_core'
  | 'role_play'
  | 'speaking_practice'
  | 'gemini_teacher_live'
  | 'minh_khang'
  | 'live_interpretation'
  | 'call_help_leona'
  | 'vault_ai_eye'
  | 'sos'
  | 'travel_companion'
  | 'flight_assistant'
  | 'credit_wallet'
  | 'smart_reception'
  | 'inbound_ops'
  | 'queue_management'
  | 'handoff'
  | 'booking_order_state'
  | 'qualification_fulfillment'
  | 'billing_operational_truth';

export type BackboneServiceMapping = {
  key: BackboneServiceKey;
  labelVi: string;
  /** `null` = cross-cutting payment rail (e.g. Credits), not one of the five public value offers. */
  primaryPublicOffer: PublicOfferKey | null;
  /** Doctrine §4 neo: some flows split across offers without a sixth public offer. */
  alternatePublicOffers?: readonly PublicOfferKey[];
  doctrineRefs: readonly string[];
  relatedSurfaces: readonly CommercialSurfaceRef[];
  notes: string;
};

// ---------------------------------------------------------------------------
// Tier helpers
// ---------------------------------------------------------------------------

export const ALL_PACKAGE_TIERS: readonly PackageTierKey[] = [
  'starter',
  'basic',
  'standard',
  'pro',
  'power',
  'enterprise',
] as const;

export const B2B_COMMERCIAL_TIERS: readonly PackageTierKey[] = ['pro', 'power', 'enterprise'] as const;

/** Doctrine §6: Standard+ là điểm bắt đầu “đủ dùng” cho học tập premium có kiểm soát — neo offer `ai_teacher` (không gộp entry Starter/Basic vào offer này trong semantic map). */
export const STANDARD_PLUS_TIERS: readonly PackageTierKey[] = ['standard', 'pro', 'power', 'enterprise'] as const;

// ---------------------------------------------------------------------------
// Public offer keys (exhaustive list)
// ---------------------------------------------------------------------------

export const PUBLIC_OFFER_KEYS: readonly PublicOfferKey[] = [
  'ai_teacher',
  'ai_support',
  'ai_document',
  'call_help',
  'business_ops',
] as const;

export const INTERNAL_METER_KEYS: readonly InternalMeterKey[] = [
  'learning_minutes',
  'support_minutes',
  'assistant_actions',
  'document_pages',
  'b2b_operational_volume',
] as const;

export const BACKBONE_SERVICE_KEYS: readonly BackboneServiceKey[] = [
  'learning_core',
  'role_play',
  'speaking_practice',
  'gemini_teacher_live',
  'minh_khang',
  'live_interpretation',
  'call_help_leona',
  'vault_ai_eye',
  'sos',
  'travel_companion',
  'flight_assistant',
  'credit_wallet',
  'smart_reception',
  'inbound_ops',
  'queue_management',
  'handoff',
  'booking_order_state',
  'qualification_fulfillment',
  'billing_operational_truth',
] as const;

// ---------------------------------------------------------------------------
// Offer definitions (doctrine-aligned; productionStatus from conservative repo read)
// ---------------------------------------------------------------------------

const AI_TEACHER_SURFACES: readonly CommercialSurfaceRef[] = [
  { id: 'hoc_tap_tab', kind: 'screen', path: 'src/screens/HocTapScreen.tsx' },
  { id: 'learning_ai_core', kind: 'service', path: 'src/services/ai/learningAI.ts' },
  { id: 'adult_learning_home', kind: 'screen', path: 'src/screens/learning/AdultLearningHome.tsx' },
  { id: 'kids_learning_home', kind: 'screen', path: 'src/screens/learning/KidsLearningHome.tsx' },
];

const COMMERCIAL_OFFERS: Record<PublicOfferKey, CommercialOfferDefinition> = {
  ai_teacher: {
    key: 'ai_teacher',
    domain: 'learning',
    label: 'AI Teacher',
    labelVi: 'AI Teacher — học tập tương tác cao cấp',
    doctrineSection: 'COMMERCIAL_FLAGSHIP_DOCTRINE §3.A · §4 · §5 · §7',
    doctrineRefs: [
      'docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.A, §4, §5, §7',
      'docs/KNG_PDF_BACKBONE_DOCTRINE.md §3.1',
      'docs/GLOBAL_V1_MASTER_BLUEPRINT_VI.md (program SoT)',
    ],
    includedFromPackages: [...STANDARD_PLUS_TIERS],
    addOnEligible: [...STANDARD_PLUS_TIERS],
    internalMeters: ['learning_minutes', 'assistant_actions'],
    relatedSurfaces: AI_TEACHER_SURFACES,
    notes:
      'Gemini giáo viên AI trực tiếp chỉ thuộc flagship Học tập. Learning flows exist in app; Gemini live path is env-flagged (`aiRuntime.ts`). Included/add-on semantic từ Standard+ (doctrine §6); Starter/Basic không neo vào offer công khai này trong mapping.',
    guardrails:
      'Không kéo nhãn giáo viên trực tiếp sang B2C/B2B. Không overclaim production completeness cho Gemini live.',
    productionStatus: 'pilot',
  },
  ai_support: {
    key: 'ai_support',
    domain: 'b2c',
    label: 'AI Support',
    labelVi: 'AI Support — hỗ trợ cá nhân đa tác vụ',
    doctrineSection: 'COMMERCIAL_FLAGSHIP_DOCTRINE §3.B · §4 · §7',
    doctrineRefs: [
      'docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.B, §4, §7',
      'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.1, §3.2',
    ],
    includedFromPackages: [...ALL_PACKAGE_TIERS],
    addOnEligible: [...ALL_PACKAGE_TIERS],
    internalMeters: ['support_minutes', 'assistant_actions'],
    relatedSurfaces: [
      { id: 'le_tan_consumer', kind: 'screen', path: 'src/screens/LeTanScreen.tsx', notes: 'Mixed AI paths; see business_ops for ops-heavy B2B mapping.' },
      { id: 'live_interpreter', kind: 'service', path: 'src/services/liveInterpreterService.ts' },
      { id: 'travel_companion', kind: 'screen', path: 'src/screens/TravelCompanionScreen.tsx' },
      { id: 'flight_search_assistant', kind: 'screen', path: 'src/screens/FlightSearchAssistantScreen.tsx' },
      { id: 'emergency_sos', kind: 'screen', path: 'src/screens/EmergencySOSScreen.tsx' },
      { id: 'tien_ich_hub', kind: 'screen', path: 'src/screens/TienIchScreen.tsx' },
    ],
    notes:
      'Minh Khang persona, phiên dịch (chat/voice UI), đồng hành du lịch, tìm chuyến bay, SOS neo vào đây ở lớp offer công khai; tách Call Help / Document khi đóng gói riêng.',
    guardrails:
      'SOS: miễn phí có kiểm soát (doctrine §7). Tìm chuyến bay: free brief vs paid deep support — giữ ranh giới với đồng hành du lịch.',
    productionStatus: 'active',
  },
  ai_document: {
    key: 'ai_document',
    domain: 'b2c',
    label: 'AI Document',
    labelVi: 'AI Document — Vault / AI Eye, đọc–trích–hành động',
    doctrineSection: 'COMMERCIAL_FLAGSHIP_DOCTRINE §3.B · §4 · §5',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.B, §4, §5', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.1'],
    includedFromPackages: [...ALL_PACKAGE_TIERS],
    addOnEligible: [...ALL_PACKAGE_TIERS],
    internalMeters: ['document_pages', 'assistant_actions'],
    relatedSurfaces: [
      { id: 'document_scanner', kind: 'component', path: 'src/components/DocumentScanner.tsx' },
      { id: 'document_ai', kind: 'service', path: 'src/services/documentAI/index.ts' },
    ],
    notes: 'Vault / AI Eye không gom thành “hỗ trợ chung” vô danh.',
    guardrails: 'Không gom Vault/AI Eye thành ngôn ngữ “hỗ trợ chung” làm mất nghĩa (doctrine §9).',
    productionStatus: 'active',
  },
  call_help: {
    key: 'call_help',
    domain: 'b2c',
    label: 'Call Help',
    labelVi: 'Call Help — gọi điện hỏi giúp / Leona',
    doctrineSection: 'COMMERCIAL_FLAGSHIP_DOCTRINE §3.B · §4 · §5',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.B, §4, §5', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.1'],
    includedFromPackages: [...ALL_PACKAGE_TIERS],
    addOnEligible: [...ALL_PACKAGE_TIERS],
    internalMeters: ['support_minutes', 'assistant_actions'],
    relatedSurfaces: [
      { id: 'leona_call', kind: 'screen', path: 'src/screens/LeonaCallScreen.tsx', notes: 'Uses wallet debit / PaymentsService call pricing helpers.' },
    ],
    notes: 'Phiên dịch trực tiếp khi gắn luồng thoại hỗ trợ gọi có thể neo phần charge vào đây (doctrine §4 footnote).',
    guardrails: 'Giữ tách offer Call Help khỏi AI Support khi đóng gói thoại / Leona (doctrine §4).',
    productionStatus: 'active',
  },
  business_ops: {
    key: 'business_ops',
    domain: 'b2b',
    label: 'Business Ops',
    labelVi: 'Business Ops — vận hành doanh nghiệp (lễ tân, queue, handoff, booking/order, billing-adjacent)',
    doctrineSection: 'COMMERCIAL_FLAGSHIP_DOCTRINE §3.C · §4 · §8',
    doctrineRefs: [
      'docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.C, §4, §8',
      'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.2',
      'docs/GLOBAL_V1_MASTER_BLUEPRINT_VI.md (B2B domain truth)',
    ],
    includedFromPackages: [...B2B_COMMERCIAL_TIERS],
    addOnEligible: [...B2B_COMMERCIAL_TIERS],
    internalMeters: ['b2b_operational_volume', 'assistant_actions'],
    relatedSurfaces: [
      { id: 'le_tan_ops', kind: 'screen', path: 'src/screens/LeTanScreen.tsx', notes: 'Inbound / booking flows; overlaps consumer AI — split by contract later.' },
      { id: 'b2b_models', kind: 'domain_module', path: 'src/domain/b2b/models.ts' },
      { id: 'b2b_policies', kind: 'domain_module', path: 'src/domain/b2b/businessPolicies.ts' },
      { id: 'b2b_vertical_bridge', kind: 'domain_module', path: 'src/domain/b2b/b2bVerticalBridge.ts' },
    ],
    notes:
      'Định vị giá trị B2B cao; không mô hình hoá như utility rẻ. Full commercial rollout (platform fee / seats / locations) chưa được neo đầy đủ trong client-only flows.',
    guardrails: 'Parity web/mobile chỉ theo quyết định chương trình (P7 / GLOBAL_V1) — không suy đoán.',
    productionStatus: 'pilot',
  },
};

// ---------------------------------------------------------------------------
// Backbone → public offer (preserve PDF service names)
// ---------------------------------------------------------------------------

const B2B_OPS_SURFACES: readonly CommercialSurfaceRef[] = [
  {
    id: 'le_tan_ops',
    kind: 'screen',
    path: 'src/screens/LeTanScreen.tsx',
    notes: 'Inbound / booking flows; overlaps consumer AI — split by contract later.',
  },
  { id: 'b2b_models', kind: 'domain_module', path: 'src/domain/b2b/models.ts' },
  { id: 'b2b_policies', kind: 'domain_module', path: 'src/domain/b2b/businessPolicies.ts' },
  { id: 'b2b_vertical_bridge', kind: 'domain_module', path: 'src/domain/b2b/b2bVerticalBridge.ts' },
];

export const BACKBONE_SERVICE_MAPPINGS: readonly BackboneServiceMapping[] = [
  {
    key: 'learning_core',
    labelVi: 'Học tập — lõi tương tác (backbone)',
    primaryPublicOffer: 'ai_teacher',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.A', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §3.1'],
    relatedSurfaces: AI_TEACHER_SURFACES,
    notes: 'Lõi luồng học tập; không gộp sang B2C support.',
  },
  {
    key: 'role_play',
    labelVi: 'Role-play (học tập)',
    primaryPublicOffer: 'ai_teacher',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.A', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §3.1'],
    relatedSurfaces: AI_TEACHER_SURFACES,
    notes: 'Kịch bản role-play thuộc flagship Học tập / AI Teacher.',
  },
  {
    key: 'speaking_practice',
    labelVi: 'Luyện nói / hội thoại (học tập)',
    primaryPublicOffer: 'ai_teacher',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.A', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §3.1'],
    relatedSurfaces: AI_TEACHER_SURFACES,
    notes: 'Luyện nói và hội thoại học tập — không nhầm với phiên dịch B2C.',
  },
  {
    key: 'gemini_teacher_live',
    labelVi: 'Gemini giáo viên AI trực tiếp',
    primaryPublicOffer: 'ai_teacher',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.A', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §3.1'],
    relatedSurfaces: [
      ...AI_TEACHER_SURFACES,
      { id: 'gemini_live_pilot_switch', kind: 'service', path: 'src/config/aiRuntime.ts' },
      { id: 'live_interpreter_provider', kind: 'service', path: 'src/services/liveInterpreterProvider.ts' },
    ],
    notes:
      'Chỉ neo dưới AI Teacher / learning. Pilot-gated qua env (`EXPO_PUBLIC_GEMINI_LIVE_PILOT_ENABLED`). TODO(entitlement-phase): tách meter theo product.',
  },
  {
    key: 'minh_khang',
    labelVi: 'Minh Khang',
    primaryPublicOffer: 'ai_support',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.B, §4 (neo tên dịch vụ)', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.1'],
    relatedSurfaces: [
      { id: 'live_interpreter', kind: 'service', path: 'src/services/liveInterpreterService.ts', notes: 'Persona Minh Khang / loan.' },
      { id: 'travel_le_tan_scenario', kind: 'screen', path: 'src/screens/TravelCompanionScreen.tsx' },
    ],
    notes: 'Giữ tên dịch vụ trên UI; monetization chính dưới AI Support.',
  },
  {
    key: 'live_interpretation',
    labelVi: 'Phiên dịch trực tiếp',
    primaryPublicOffer: 'ai_support',
    alternatePublicOffers: ['call_help'],
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §4 (neo)', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.1'],
    relatedSurfaces: [
      { id: 'live_interpreter', kind: 'service', path: 'src/services/liveInterpreterService.ts' },
      { id: 'interpreter_session_credits', kind: 'service', path: 'src/services/interpreterSessionConstants.ts' },
    ],
    notes:
      'Luồng LiveInterpreter (STT + completion + TTS). Thoại hỗ trợ gọi có thể neo Call Help — không tạo offer thứ sáu.',
  },
  {
    key: 'call_help_leona',
    labelVi: 'Gọi điện hỏi giúp / Leona',
    primaryPublicOffer: 'call_help',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §4', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.1'],
    relatedSurfaces: [{ id: 'leona_call', kind: 'screen', path: 'src/screens/LeonaCallScreen.tsx' }],
    notes: 'Thoại hỗ trợ tiêu dùng; pricing helpers trong PaymentsService.',
  },
  {
    key: 'vault_ai_eye',
    labelVi: 'Vault / AI Eye',
    primaryPublicOffer: 'ai_document',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §4', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.1'],
    relatedSurfaces: [
      { id: 'document_scanner', kind: 'component', path: 'src/components/DocumentScanner.tsx' },
      { id: 'document_ai', kind: 'service', path: 'src/services/documentAI/index.ts' },
    ],
    notes: 'Tách khỏi AI Support để không làm mất nghĩa sản phẩm.',
  },
  {
    key: 'sos',
    labelVi: 'SOS',
    primaryPublicOffer: 'ai_support',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §7', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.1'],
    relatedSurfaces: [
      { id: 'emergency_sos', kind: 'screen', path: 'src/screens/EmergencySOSScreen.tsx' },
      { id: 'travel_companion_screen', kind: 'screen', path: 'src/screens/TravelCompanionScreen.tsx' },
    ],
    notes: 'Offer bucket = AI Support; free-controlled guard (miễn phí có kiểm soát) — doctrine §7.',
  },
  {
    key: 'travel_companion',
    labelVi: 'Đồng hành du lịch',
    primaryPublicOffer: 'ai_support',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §7, §9', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.1'],
    relatedSurfaces: [{ id: 'travel_companion_screen', kind: 'screen', path: 'src/screens/TravelCompanionScreen.tsx' }],
    notes: 'Tách ranh giới ý nghĩa với flight assistant.',
  },
  {
    key: 'flight_assistant',
    labelVi: 'Tìm chuyến bay / trợ lý chuyến bay (B2C)',
    primaryPublicOffer: 'ai_support',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.B, §7', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.1'],
    relatedSurfaces: [
      { id: 'flight_search_assistant', kind: 'screen', path: 'src/screens/FlightSearchAssistantScreen.tsx' },
      {
        id: 'home_travel_entry',
        kind: 'screen',
        path: 'src/screens/HomeScreen.tsx',
        notes: 'Entry du lịch trên Home — verify UX drift trong audit.',
      },
    ],
    notes: 'B2C: free brief vs paid deep support theo policy — không ghi số ở đây.',
  },
  {
    key: 'credit_wallet',
    labelVi: 'Ví tín dụng (Credits)',
    primaryPublicOffer: null,
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.B', 'docs/COMMERCIAL_SPINE_LIVE.md', 'docs/GLOBAL_V1_COMMERCIAL_ARCHITECTURE_VI.md'],
    relatedSurfaces: [
      { id: 'wallet_top_up', kind: 'screen', path: 'src/screens/WalletTopUpScreen.tsx' },
      { id: 'payments_service', kind: 'service', path: 'src/services/PaymentsService.ts' },
      { id: 'commercial_spine', kind: 'service', path: 'src/config/commercialSpine.ts' },
      { id: 'global_wallet_packages', kind: 'service', path: 'src/config/globalWalletPackages.ts' },
    ],
    notes:
      'Credits là lớp thanh toán chung; không thuộc năm đề nghị công khai §4. TODO(entitlement-phase): cross-cutting rail.',
  },
  {
    key: 'smart_reception',
    labelVi: 'Lễ tân thông minh',
    primaryPublicOffer: 'business_ops',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.C', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.2'],
    relatedSurfaces: B2B_OPS_SURFACES,
    notes: 'Neo vận hành B2B; không định vị như utility rẻ.',
  },
  {
    key: 'inbound_ops',
    labelVi: 'Inbound ops',
    primaryPublicOffer: 'business_ops',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.C', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.2'],
    relatedSurfaces: B2B_OPS_SURFACES,
    notes: 'Tiếp nhận / trạng thái vận hành inbound.',
  },
  {
    key: 'queue_management',
    labelVi: 'Queue / hàng đợi',
    primaryPublicOffer: 'business_ops',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.C', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.2'],
    relatedSurfaces: B2B_OPS_SURFACES,
    notes: 'Hàng đợi xử lý — domain truth GLOBAL_V1 khi triển khai schema.',
  },
  {
    key: 'handoff',
    labelVi: 'Handoff',
    primaryPublicOffer: 'business_ops',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.C', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.2'],
    relatedSurfaces: B2B_OPS_SURFACES,
    notes: 'Chuyển giao nhân sự / bước xử lý.',
  },
  {
    key: 'booking_order_state',
    labelVi: 'Booking / order state',
    primaryPublicOffer: 'business_ops',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.C', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.2'],
    relatedSurfaces: B2B_OPS_SURFACES,
    notes: 'Trạng thái đặt / đơn — tách khái niệm theo vertical.',
  },
  {
    key: 'qualification_fulfillment',
    labelVi: 'Qualification / fulfillment',
    primaryPublicOffer: 'business_ops',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.C', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.2'],
    relatedSurfaces: B2B_OPS_SURFACES,
    notes: 'Đủ điều kiện và thực thi hoàn tất — theo domain B2B.',
  },
  {
    key: 'billing_operational_truth',
    labelVi: 'Billing / billing-adjacent operational truth',
    primaryPublicOffer: 'business_ops',
    doctrineRefs: ['docs/COMMERCIAL_FLAGSHIP_DOCTRINE.md §3.C', 'docs/KNG_PDF_BACKBONE_DOCTRINE.md §1.2'],
    relatedSurfaces: B2B_OPS_SURFACES,
    notes: 'Trạng thái nhạy cảm tiền — server-authoritative; không suy đoán parity nếu chưa có P7.',
  },
];

// ---------------------------------------------------------------------------
// Selectors (read-only)
// ---------------------------------------------------------------------------

export function getOfferDefinition(offer: PublicOfferKey): CommercialOfferDefinition {
  return COMMERCIAL_OFFERS[offer];
}

export function listOfferDefinitions(): readonly CommercialOfferDefinition[] {
  return PUBLIC_OFFER_KEYS.map((k) => COMMERCIAL_OFFERS[k]);
}

/** Offers where `tier` appears in included or add-on lists (qualitative doctrine map). */
export function getOffersForPackage(tier: PackageTierKey): PublicOfferKey[] {
  const out: PublicOfferKey[] = [];
  for (const k of PUBLIC_OFFER_KEYS) {
    const d = COMMERCIAL_OFFERS[k];
    if (d.includedFromPackages.includes(tier) || d.addOnEligible.includes(tier)) {
      out.push(k);
    }
  }
  return out;
}

export function getBackboneMapping(service: BackboneServiceKey): BackboneServiceMapping | undefined {
  return BACKBONE_SERVICE_MAPPINGS.find((r) => r.key === service);
}

/** Primary offer for a backbone key; use mapping.alternatePublicOffers for split flows. */
export function getPrimaryOfferByBackboneService(service: BackboneServiceKey): PublicOfferKey | undefined {
  const p = getBackboneMapping(service)?.primaryPublicOffer;
  return p ?? undefined;
}

/** Alias for `getPrimaryOfferByBackboneService` (spec naming). */
export const getOfferByBackboneService = getPrimaryOfferByBackboneService;

export function listBackboneMappingsForOffer(offer: PublicOfferKey): readonly BackboneServiceMapping[] {
  return BACKBONE_SERVICE_MAPPINGS.filter(
    (m) => m.primaryPublicOffer === offer || (m.alternatePublicOffers?.includes(offer) ?? false)
  );
}
