import type { FirestoreTimestamp } from './firestoreTypes';

/**
 * Vertical — drives resource shape, engine, and console modules.
 *
 * **Phase 3:** `grocery_retail` and `grocery_wholesale` are **distinct** product/engine semantics (đổ hàng / sỉ vs tạp hoá).
 * `hospitality_stay` is room/night stay (inquiry vs billable reservation is explicit on booking + summaries).
 * **`potraviny`** remains for **legacy tenants** only — same fulfillment family as retail; migrate off when Firestore allows.
 * Bridge table: `b2bVerticalBridge.fulfillmentEngineFamily`, marketplace map: `b2bMarketplaceAdapter`.
 */
export type B2BBusinessType =
  | 'nails'
  | 'restaurant'
  | 'grocery_retail'
  | 'grocery_wholesale'
  | 'hospitality_stay'
  | 'potraviny';

/** Mirrors B2C wallet geo groups for usage debit. */
export type B2BPricingGroup = 'group1' | 'group2';

export type B2BSubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export type B2BWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Opening hours per weekday — intervals in tenant timezone (IANA). */
export type B2BOpeningDay = {
  weekday: B2BWeekday;
  /** HH:mm 24h local */
  open: string;
  close: string;
  closed?: boolean;
};

export type B2BAiConfig = {
  /** Persona / system prompt version id (managed remotely). */
  promptProfileId: string;
  defaultLanguage: string;
  /** Allowed outbound clarification languages for staff. */
  supportedLocales?: string[];
  /** Model routing (mini vs pro) — server-side only in production. */
  modelTier?: 'standard' | 'premium';
  /** Feature flags: voice STT, TTS voice id, etc. */
  featureFlags?: Record<string, boolean>;
};

export type B2BBillingConfig = {
  pricingGroup: B2BPricingGroup;
  /** Credits charged per successful inbound booking/order completion (usage). */
  creditsPerSuccessfulInbound: number;
  /** Server-maintained B2B wallet balance for usage debits; clients must not trust writes. */
  walletCreditsBalance?: number;
  /** Monthly flat in platform credits or minor currency — integrate with Stripe later. */
  subscription?: {
    status: B2BSubscriptionStatus;
    planId: string;
    /** Period end — server clock. */
    currentPeriodEnd?: FirestoreTimestamp;
    externalSubscriptionId?: string;
  };
  /** Wallet / ledger account id (platform). */
  b2bWalletAccountId?: string;
};

/**
 * Root tenant — one legal/billing entity; may have many locations.
 */
export type BusinessTenant = {
  id: string;
  name: string;
  legalName?: string;
  businessType: B2BBusinessType;
  /** IANA timezone default for locations. */
  timezone: string;
  pricingGroup: B2BPricingGroup;
  ai: B2BAiConfig;
  billing: B2BBillingConfig;
  /** E.164 numbers owned by tenant — primary routing key on index. */
  inboundPhoneNumbers: string[];
  openingHoursTemplate?: B2BOpeningDay[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  /** Soft delete / suspend AI answering. */
  status: 'active' | 'suspended';
};

export type BusinessLocation = {
  id: string;
  tenantId: string;
  displayName: string;
  address?: string;
  timezone?: string;
  /** Override opening hours; else inherit tenant template. */
  openingHours?: B2BOpeningDay[];
  /** Location-specific inbound numbers (subset or override). */
  inboundPhoneNumbers?: string[];
  /** Potraviny: default prep time minutes. */
  defaultPrepMinutes?: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type B2BServiceCategory =
  | 'nail_service'
  | 'food_course'
  | 'grocery_item'
  | 'hospitality_room_night'
  | 'wholesale_line'
  | 'other';

export type BusinessService = {
  id: string;
  tenantId: string;
  locationId: string;
  category: B2BServiceCategory;
  name: string;
  /** Duration in minutes (nails, restaurant seating turnover). */
  durationMinutes?: number;
  priceCents?: number;
  currency?: string;
  active: boolean;
  /** Business-type extensions (JSON-safe). */
  metadata?: Record<string, unknown>;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type B2BResourceKind =
  | 'nail_table'
  | 'foot_chair'
  | 'restaurant_table'
  | 'potraviny_fulfillment_slot'
  | 'grocery_retail_fulfillment_slot'
  | 'grocery_wholesale_fulfillment_slot'
  | 'hospitality_room';

export type BusinessResource = {
  id: string;
  tenantId: string;
  locationId: string;
  kind: B2BResourceKind;
  label: string;
  /** Capacity: nail table = 1 tech concurrent; restaurant = seats. */
  capacity: number;
  parallelSlots?: number;
  /** Restaurant party min/max; grocery/hospitality throughput or room capacity hints. */
  metadata?: Record<string, unknown>;
  active: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type B2BBookingStatus =
  | 'pending_confirm'
  | 'confirmed'
  | 'checked_in'
  | 'completed_no_show'
  | 'canceled'
  | 'failed';

export type BusinessBooking = {
  id: string;
  tenantId: string;
  locationId: string;
  status: B2BBookingStatus;
  /** Customer phone / name from call or manual. */
  customerPhoneE164?: string;
  customerName?: string;
  serviceIds: string[];
  resourceIds: string[];
  /** UTC instant start/end (computed from local + TZ). */
  startsAt: FirestoreTimestamp;
  endsAt: FirestoreTimestamp;
  /** Idempotency: same call leg should not double-book. */
  idempotencyKey: string;
  sourceCallSessionId?: string;
  notes?: string;
  /** Party size (restaurant). */
  partySize?: number;
  /** Vertical trace for billing metadata + merchant handoff (optional on older rows). */
  b2bVertical?: B2BBusinessType;
  /** Stay: local calendar dates in tenant TZ (YYYY-MM-DD). */
  stayCheckInDate?: string;
  stayCheckOutDate?: string;
  adults?: number;
  children?: number;
  roomUnitLabel?: string;
  /**
   * Caller asked for information only — **must not** be described as a confirmed paid booking.
   * Billable commits should set false / omit; server billing gates on `billable` in command.
   */
  isInquiryOnly?: boolean;
  /** Staff-facing handoff block (callback / escalation); not shown to caller as a “receipt”. */
  staffHandoffSummary?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type B2BOrderStatus =
  | 'draft'
  | 'pending_confirm'
  | 'confirmed'
  | 'preparing'
  | 'ready_pickup'
  | 'out_for_delivery'
  | 'completed'
  | 'canceled';

export type BusinessOrderLine = {
  serviceId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPriceCents?: number;
  notes?: string;
  /** True if quantity/unit needs staff callback before confirming. */
  needsClarification?: boolean;
};

/** Wholesale pipeline stage — billing only when staff/system marks billable + success. */
export type B2BWholesaleQualificationStatus =
  | 'needs_clarification'
  | 'qualified_pending_confirm'
  | 'confirmed_for_fulfillment';

export type BusinessOrder = {
  id: string;
  tenantId: string;
  locationId: string;
  status: B2BOrderStatus;
  lines: BusinessOrderLine[];
  customerPhoneE164?: string;
  customerName?: string;
  fulfillment: 'pickup' | 'delivery';
  /** Requested window — enforced in engine vs capacity. */
  windowStart: FirestoreTimestamp;
  windowEnd: FirestoreTimestamp;
  idempotencyKey: string;
  sourceCallSessionId?: string;
  deliveryAddress?: string;
  b2bVertical?: B2BBusinessType;
  /** Product layer: retail counter vs đổ hàng / wholesale. */
  orderSegment?: 'retail' | 'wholesale';
  wholesaleQualification?: B2BWholesaleQualificationStatus;
  /** Merchant callback: open questions per line (VI/EN/CS optional). */
  lineClarifications?: { lineIndex: number; vi?: string; en?: string; cs?: string }[];
  palletOrVolumeHint?: string;
  staffHandoffSummary?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type B2BCallSessionStatus =
  | 'ringing'
  | 'greeting'
  | 'collecting'
  | 'checking_availability'
  | 'confirming'
  | 'completed'
  | 'abandoned'
  | 'error';

export type B2BCallSessionIntent =
  | 'booking'
  | 'stay_booking'
  | 'order'
  | 'wholesale_order'
  | 'faq'
  | 'transfer'
  | 'unknown';

/**
 * Voice dialogue phase — drives next assistant question (persisted on session).
 * Not a replacement for NLU intent; complements `detectedIntent`.
 */
export type B2BVoiceDialoguePhase =
  | 'greeting'
  | 'intent_clarify'
  | 'booking_collect'
  | 'booking_slot_fill'
  | 'booking_confirm'
  | 'order_collect'
  | 'faq'
  | 'confirm_handoff'
  | 'closing';

export type B2BVoiceDialogueState = {
  phase: B2BVoiceDialoguePhase;
  /** Increments on each assistant turn (user + assistant exchange). */
  turnCount: number;
  /** Last assistant prompt for continuity (avoid repeating verbatim). */
  lastQuestionAsked?: string;
};

/** Collected booking slots from voice (deterministic extraction + merge). */
export type B2BBookingSlotState = {
  service?: string;
  /** Human-readable time phrase from caller (STT). */
  time?: string;
  name?: string;
  /** Hospitality: check-in / check-out (phrase or YYYY-MM-DD). */
  stayCheckIn?: string;
  stayCheckOut?: string;
  /** Free text e.g. “2 adults, 1 child”. */
  occupancy?: string;
};

/**
 * Confirmation gate before commit_booking may run.
 * `awaitingConfirm` true after all slots filled until caller answers summary prompt.
 */
export type B2BBookingConfirmationState = {
  awaitingConfirm: boolean;
  /** Set true only after explicit yes (voice or trusted client). */
  confirmed: boolean;
};

/** Structured failure for analytics — maps from booking engine / validation layers. */
export type B2BCallSessionFailureCode =
  | 'no_available_resource'
  | 'insufficient_credits'
  | 'invalid_input'
  | 'tenant_not_found'
  | 'tenant_suspended'
  | 'internal_error';

export type BusinessCallSession = {
  id: string;
  tenantId: string;
  locationId: string;
  /** Provider call SID (Twilio, etc.). */
  externalCallId: string;
  /** Called number (DID) — tenant routing. */
  inboundNumberE164: string;
  /** Caller E.164 — voice pipeline field (alias: primary human-readable “phoneNumber” in API docs). */
  phoneNumber?: string;
  status: B2BCallSessionStatus;
  /** Dedup: one externalCallId max one session. */
  idempotencyKey: string;
  intent?: B2BCallSessionIntent;
  /** Mirrors final / last detected intent (kept in sync with `intent` for traceability). */
  detectedIntent?: B2BCallSessionIntent;
  transcriptUri?: string;
  /** Progressive STT / dialogue text (optional concatenation in pipeline). */
  transcript?: string;
  /** Last structured extraction from AI. */
  extractedPayload?: Record<string, unknown>;
  bookingId?: string;
  orderId?: string;
  /** Billing: set when a successful booking is committed (usage debit). */
  billingEventId?: string;
  /** Billing: set when a successful order commit triggers usage debit (wholesale usually unset until staff confirms). */
  orderBillingEventId?: string;
  errorCode?: string;
  outcome?: 'success' | 'fail';
  failureReason?: string;
  failureCode?: B2BCallSessionFailureCode;
  /** Turn-taking for real-time voice (see services/b2b/ai/callResponseGenerator). */
  voiceDialogueState?: B2BVoiceDialogueState;
  /** Booking slot-filling (voice). */
  bookingSlotState?: B2BBookingSlotState;
  bookingConfirmation?: B2BBookingConfirmationState;
  /** Snapshot handoff for this call (booking/order success paths may also persist on domain docs). */
  staffHandoffSummary?: string;
  startedAt: FirestoreTimestamp;
  endedAt?: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type B2BBillingEventType =
  | 'subscription_invoice'
  | 'usage_successful_booking'
  | 'usage_successful_order'
  | 'adjustment';

export type BusinessBillingEvent = {
  id: string;
  tenantId: string;
  type: B2BBillingEventType;
  creditsDelta: number;
  /** Positive = debit tenant wallet (usage). */
  idempotencyKey: string;
  referenceType?: 'booking' | 'order' | 'call_session' | 'subscription';
  referenceId?: string;
  pricingGroup?: B2BPricingGroup;
  createdAt: FirestoreTimestamp;
  metadata?: Record<string, unknown>;
};

export type B2BStaffRole = 'owner' | 'manager' | 'staff' | 'read_only';

export type BusinessStaffAccount = {
  id: string;
  tenantId: string;
  email: string;
  role: B2BStaffRole;
  firebaseAuthUid?: string;
  locationIds?: string[];
  active: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

/** Resolved context after phone index lookup — loaded by Cloud Function. */
export type B2BInboundRouteResolution = {
  tenantId: string;
  locationId: string;
  inboundNumberE164: string;
};
