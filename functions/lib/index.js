"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  aiProxy: () => aiProxy,
  b2bInboundVoiceWebhook: () => b2bInboundVoiceWebhook,
  b2bOrderStaffOps: () => b2bOrderStaffOps,
  b2bStaffQueueSnapshot: () => b2bStaffQueueSnapshot,
  b2bVoiceOrchestrationHook: () => b2bVoiceOrchestrationHook,
  walletOps: () => walletOps
});
module.exports = __toCommonJS(index_exports);

// src/firebaseInit.ts
var import_app = require("firebase-admin/app");
var import_firestore3 = require("firebase-admin/firestore");

// ../src/services/b2b/engines/bookingEngine.ts
var createBookingTransactionImpl = null;
function registerCreateBookingTransaction(impl) {
  createBookingTransactionImpl = impl;
}
async function createBookingTransaction(db2, cmd) {
  if (createBookingTransactionImpl) return createBookingTransactionImpl(db2, cmd);
  return { ok: false, code: "not_implemented", message: "Register createBookingTransaction via registerCreateBookingTransaction (e.g. Cloud Functions init)" };
}

// ../src/services/b2b/engines/orderEngine.ts
var createOrderTransactionImpl = null;
function registerCreateOrderTransaction(impl) {
  createOrderTransactionImpl = impl;
}
async function createOrderTransaction(db2, cmd) {
  if (createOrderTransactionImpl) return createOrderTransactionImpl(db2, cmd);
  return {
    ok: false,
    code: "not_implemented",
    message: "Register createOrderTransaction via registerCreateOrderTransaction (e.g. Cloud Functions init)"
  };
}

// src/b2b/booking/createBookingTransactionAdmin.ts
var import_firestore = require("firebase-admin/firestore");
var import_v2 = require("firebase-functions/v2");

// ../src/domain/b2b/collections.ts
var B2B_ROOT = {
  tenants: "b2b_tenants",
  locations: "locations",
  services: "business_services",
  resources: "business_resources",
  bookings: "business_bookings",
  orders: "business_orders",
  callSessions: "business_call_sessions",
  billingEvents: "business_billing_events",
  staff: "business_staff_accounts",
  /** Maps E.164 inbound number → tenant + location (written only by backend). */
  phoneRouteIndex: "b2b_phone_routes"
};
function tenantDocPath(tenantId) {
  return `${B2B_ROOT.tenants}/${tenantId}`;
}
function tenantSubcollection(tenantId, name) {
  return `${tenantDocPath(tenantId)}/${name}`;
}
function resourcesCollectionPath(tenantId) {
  return tenantSubcollection(tenantId, B2B_ROOT.resources);
}
function bookingsCollectionPath(tenantId) {
  return tenantSubcollection(tenantId, B2B_ROOT.bookings);
}
function ordersCollectionPath(tenantId) {
  return tenantSubcollection(tenantId, B2B_ROOT.orders);
}
function callSessionsCollectionPath(tenantId) {
  return tenantSubcollection(tenantId, B2B_ROOT.callSessions);
}
function billingEventsCollectionPath(tenantId) {
  return tenantSubcollection(tenantId, B2B_ROOT.billingEvents);
}
function phoneRouteDocPath(e164) {
  const key = e164.replace(/[^\d+]/g, "");
  return `${B2B_ROOT.phoneRouteIndex}/${key}`;
}

// ../src/config/countryPacks/packs.ts
var EU_EMERGENCY = { primaryNumber: "112", fallbackNumbers: ["112"] };
var EU_DOC_HINT = "Gi\u1EA5y t\u1EDD li\xEAn quan \u0111\u1ECBnh c\u01B0, visa v\xE0 lao \u0111\u1ED9ng t\u1EA1i EU/khu v\u1EF1c ch\xE2u \xC2u; \u01B0u ti\xEAn tr\xEDch xu\u1EA5t ng\xE0y h\u1EBFt h\u1EA1n ch\xEDnh x\xE1c.";
var COUNTRY_PACKS = {
  CZ: {
    countryCode: "CZ",
    regionCode: "EU-CENTRAL",
    locale: "cs-CZ",
    pricingTier: "T1",
    currencyCode: "CZK",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "cs",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  SK: {
    countryCode: "SK",
    regionCode: "EU-CENTRAL",
    locale: "sk-SK",
    pricingTier: "T1",
    currencyCode: "EUR",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "sk",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  PL: {
    countryCode: "PL",
    regionCode: "EU-CENTRAL",
    locale: "pl-PL",
    pricingTier: "T1",
    currencyCode: "PLN",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "pl",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  DE: {
    countryCode: "DE",
    regionCode: "EU-WEST",
    locale: "de-DE",
    pricingTier: "T2",
    currencyCode: "EUR",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "de",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  FR: {
    countryCode: "FR",
    regionCode: "EU-WEST",
    locale: "fr-FR",
    pricingTier: "T2",
    currencyCode: "EUR",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "fr",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  UK: {
    countryCode: "UK",
    regionCode: "EU-WEST",
    locale: "en-GB",
    pricingTier: "T2",
    currencyCode: "GBP",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "en",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  GB: {
    countryCode: "GB",
    regionCode: "EU-WEST",
    locale: "en-GB",
    pricingTier: "T2",
    currencyCode: "GBP",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "en",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  CH: {
    countryCode: "CH",
    regionCode: "EU-WEST",
    locale: "de-CH",
    pricingTier: "T2",
    currencyCode: "CHF",
    emergencyConfig: EU_EMERGENCY,
    holidayPack: "eu",
    defaultLanguage: "de",
    legalFlowConfig: {
      defaultScenario: "government",
      visaRenewalEnabled: true,
      documentJurisdictionHint: EU_DOC_HINT
    }
  },
  VN: {
    countryCode: "VN",
    regionCode: "SEA",
    locale: "vi-VN",
    pricingTier: "T2",
    currencyCode: "EUR",
    emergencyConfig: { primaryNumber: "115", fallbackNumbers: ["113", "114"] },
    holidayPack: "vn",
    defaultLanguage: "vi",
    legalFlowConfig: {
      defaultScenario: "general",
      visaRenewalEnabled: false,
      documentJurisdictionHint: "Gi\u1EA5y t\u1EDD Vi\u1EC7t Nam ho\u1EB7c gi\u1EA5y t\u1EDD h\u1ED9 chi\u1EBFu/visa li\xEAn quan nh\u1EADp c\u1EA3nh VN."
    }
  }
};
var GLOBAL_UNLISTED_COUNTRY_PACK = {
  countryCode: "ZZ",
  regionCode: "GLOBAL-UNLISTED",
  locale: "en-GB",
  pricingTier: "T2",
  currencyCode: "EUR",
  emergencyConfig: EU_EMERGENCY,
  holidayPack: "global",
  defaultLanguage: "en",
  legalFlowConfig: {
    defaultScenario: "general",
    visaRenewalEnabled: false,
    documentJurisdictionHint: "Gi\u1EA5y t\u1EDD c\xF3 th\u1EC3 \u0111a qu\u1ED1c gia; tr\xEDch xu\u1EA5t ng\xE0y h\u1EBFt h\u1EA1n ch\xEDnh x\xE1c, kh\xF4ng gi\u1EA3 \u0111\u1ECBnh m\u1ED9t khu v\u1EF1c ph\xE1p l\xFD duy nh\u1EA5t."
  }
};

// ../src/config/countryPacks/pricingByTier.ts
var OUTBOUND_CALL_CREDITS_BY_TIER = {
  T1: 99,
  T2: 199,
  T3: 249,
  T4: 349
};
var LETAN_BOOKING_CREDITS_BY_TIER = {
  T1: 29,
  T2: 99,
  T3: 99,
  T4: 129
};

// ../src/config/countryPacks/index.ts
function normalizeCountryCodeOrSentinel(countryCode) {
  const trimmed = countryCode?.trim() ?? "";
  if (!trimmed) return "ZZ";
  const normalized = trimmed.toUpperCase();
  return normalized.length === 2 ? normalized : "ZZ";
}
function resolveCountryPack(countryCode) {
  const normalized = normalizeCountryCodeOrSentinel(countryCode);
  if (normalized === "ZZ") {
    return GLOBAL_UNLISTED_COUNTRY_PACK;
  }
  return COUNTRY_PACKS[normalized] ?? GLOBAL_UNLISTED_COUNTRY_PACK;
}
function pricingTierForUsageDebits(countryCode) {
  const trimmed = countryCode?.trim() ?? "";
  if (!trimmed) {
    return GLOBAL_UNLISTED_COUNTRY_PACK.pricingTier;
  }
  const normalized = trimmed.toUpperCase();
  if (normalized.length !== 2) {
    return GLOBAL_UNLISTED_COUNTRY_PACK.pricingTier;
  }
  const row = COUNTRY_PACKS[normalized];
  if (row) return row.pricingTier;
  return GLOBAL_UNLISTED_COUNTRY_PACK.pricingTier;
}

// ../src/services/b2b/billing/b2bUsagePricing.ts
function creditsPerSuccessfulInboundForTier(tier) {
  return LETAN_BOOKING_CREDITS_BY_TIER[tier];
}
function creditsPerSuccessfulInbound(group) {
  return creditsPerSuccessfulInboundForTier(pricingGroupToTier(group));
}
function pricingGroupToTier(group) {
  return group === "group1" ? "T1" : "T2";
}

// ../src/services/b2b/billing/b2bBillingService.ts
function buildUsageBillingEventPayload(input) {
  const credits = creditsPerSuccessfulInbound(input.pricingGroup);
  return {
    tenantId: input.tenantId,
    type: input.type,
    creditsDelta: -Math.abs(credits),
    idempotencyKey: input.idempotencyKey,
    referenceType: input.type === "usage_successful_booking" ? "booking" : "order",
    referenceId: input.reference.id,
    pricingGroup: input.pricingGroup,
    metadata: {
      source: "inbound_ai_receptionist",
      ...input.reference.b2bVertical ? { b2bVertical: input.reference.b2bVertical } : {},
      ..."isInquiryOnly" in input.reference && input.reference.isInquiryOnly === true ? { billingNote: "inquiry_only_not_debited_here" } : {},
      ...input.type === "usage_successful_order" && "orderSegment" in input.reference && input.reference.orderSegment ? { orderSegment: input.reference.orderSegment } : {},
      ...input.type === "usage_successful_order" && "wholesaleQualification" in input.reference && input.reference.wholesaleQualification ? { wholesaleQualification: input.reference.wholesaleQualification } : {}
    }
  };
}

// ../src/services/b2b/engines/bookingEngineCore.ts
var BOOKING_NON_BLOCKING_STATUSES = ["canceled", "failed"];
function isBlockingBookingStatus(status) {
  return !BOOKING_NON_BLOCKING_STATUSES.includes(status);
}
function intervalsOverlapHalfOpen(startMs, endMs, bStartMs, bEndMs) {
  return endMs > bStartMs && startMs < bEndMs;
}
function bookingConflictsWithWindow(b, startMs, endMs, resourceIds) {
  if (!isBlockingBookingStatus(b.status)) return false;
  const touchesResource = b.resourceIds.some((r) => resourceIds.has(r));
  if (!touchesResource) return false;
  return intervalsOverlapHalfOpen(startMs, endMs, b.startsAtMs, b.endsAtMs);
}
function anyConflict(candidates, startMs, endMs, resourceIds) {
  return candidates.find((b) => bookingConflictsWithWindow(b, startMs, endMs, resourceIds));
}
function pickFirstFreeResource(candidateOrder, existing, windowStartMs, windowEndMs, partySize, resourceCapacity) {
  for (const rid of candidateOrder) {
    const cap = resourceCapacity(rid);
    if (partySize != null && cap != null && partySize > cap) continue;
    const conflict = anyConflict(existing, windowStartMs, windowEndMs, /* @__PURE__ */ new Set([rid]));
    if (!conflict) return [String(rid)];
  }
  return void 0;
}

// ../src/domain/b2b/b2bVerticalBridge.ts
function requiredBookingSlotKeys(bt) {
  if (bt === "hospitality_stay") {
    return ["stayCheckIn", "stayCheckOut", "occupancy", "name"];
  }
  return ["service", "time", "name"];
}

// ../src/services/b2b/merchant/merchantHandoffSummary.ts
function verticalLabel(bt) {
  if (!bt) return "Unknown vertical";
  switch (bt) {
    case "hospitality_stay":
      return "Hospitality \xB7 stay request";
    case "grocery_wholesale":
      return "Grocery \xB7 wholesale (\u0111\u1ED5 h\xE0ng)";
    case "grocery_retail":
      return "Grocery \xB7 retail";
    case "potraviny":
      return "Grocery \xB7 retail (legacy businessType; migrate to grocery_retail)";
    case "nails":
      return "Nails";
    case "restaurant":
      return "Restaurant";
    default:
      return bt;
  }
}
function buildBookingHandoffSummary(booking) {
  const bt = booking.b2bVertical;
  const inquiry = booking.isInquiryOnly === true || bt === "hospitality_stay" && booking.status === "pending_confirm";
  const stayParts = [
    booking.stayCheckInDate && `Check-in: ${booking.stayCheckInDate}`,
    booking.stayCheckOutDate && `Check-out: ${booking.stayCheckOutDate}`,
    booking.adults != null && `Adults: ${booking.adults}`,
    booking.children != null && `Children: ${booking.children}`,
    booking.roomUnitLabel && `Room/unit: ${booking.roomUnitLabel}`
  ].filter(Boolean);
  const lines = [
    `Vertical: ${verticalLabel(bt)}`,
    `Status: ${booking.status}`,
    inquiry ? "Type: inquiry / awaiting staff confirmation (not a final sale)." : "Type: committed booking record.",
    `Customer: ${booking.customerName ?? "\u2014"} \xB7 ${booking.customerPhoneE164 ?? "\u2014"}`,
    `Resources: ${booking.resourceIds.join(", ") || "\u2014"}`,
    `Services: ${booking.serviceIds.join(", ") || "\u2014"}`,
    ...stayParts,
    booking.partySize != null ? `Party size: ${booking.partySize}` : "",
    booking.notes ? `Notes: ${booking.notes}` : ""
  ].filter(Boolean);
  return {
    title: inquiry ? "Stay / booking \u2014 inquiry" : "Stay / booking \u2014 update",
    lines,
    escalation: inquiry ? "staff_callback" : "none",
    billableNote: inquiry ? "No usage debit until policy marks billable confirm." : "Debit only if matching billing event exists on server."
  };
}
function buildOrderHandoffSummary(order) {
  const seg = order.orderSegment ?? (order.b2bVertical === "grocery_wholesale" ? "wholesale" : "retail");
  const qual = order.wholesaleQualification ?? "needs_clarification";
  const wholesale = seg === "wholesale";
  const lineSummaries = order.lines.map((l, i) => {
    const flag = l.needsClarification ? " [CLARIFY]" : "";
    return `${i + 1}. ${l.name} \xD7 ${l.quantity}${flag}`;
  });
  const clar = order.lineClarifications?.length ? order.lineClarifications.map((c) => `Line ${c.lineIndex + 1}: ${c.vi ?? c.en ?? c.cs ?? "?"}`).join(" | ") : "";
  const lines = [
    `Vertical: ${verticalLabel(order.b2bVertical)} \xB7 segment: ${seg}`,
    `Fulfillment: ${order.fulfillment}`,
    `Status: ${order.status}`,
    wholesale ? `Wholesale stage: ${qual} (confirmed_for_fulfillment = OK to treat as firm).` : "",
    `Customer: ${order.customerName ?? "\u2014"} \xB7 ${order.customerPhoneE164 ?? "\u2014"}`,
    order.deliveryAddress ? `Address: ${order.deliveryAddress}` : "",
    order.palletOrVolumeHint ? `Volume hint: ${order.palletOrVolumeHint}` : "",
    "Lines:",
    ...lineSummaries,
    clar ? `Open questions: ${clar}` : ""
  ].filter(Boolean);
  let escalation = "none";
  if (wholesale && qual !== "confirmed_for_fulfillment") escalation = "clarification_required";
  if (order.lines.some((l) => l.needsClarification)) escalation = "clarification_required";
  return {
    title: wholesale ? "Wholesale order \u2014 intake" : "Retail order \u2014 intake",
    lines,
    escalation,
    billableNote: wholesale && qual !== "confirmed_for_fulfillment" ? "Do not debit usage until wholesale is qualified and confirmed for fulfillment." : "Debit only after server posts usage_successful_order."
  };
}
function formatHandoffBlock(block) {
  return [block.title, "", ...block.lines, "", `Escalation: ${block.escalation}`, `Billing: ${block.billableNote}`].join(
    "\n"
  );
}

// ../src/services/b2b/reliability/idempotency.ts
function bookingIdempotencyKey(callSessionId, provisionalSlotDigest) {
  return `booking:${callSessionId}:${provisionalSlotDigest}`;
}
function orderIdempotencyKey(callSessionId, cartDigest) {
  return `order:${callSessionId}:${cartDigest}`;
}
function callSessionIdempotencyKey(provider, externalCallId) {
  return `call:${provider}:${externalCallId}`;
}
function billingUsageIdempotencyKey(kind, entityId) {
  return `billing:usage:${kind}:${entityId}`;
}

// src/b2b/booking/createBookingTransactionAdmin.ts
function docToBooking(id, d) {
  return {
    id,
    tenantId: String(d.tenantId ?? ""),
    locationId: String(d.locationId ?? ""),
    status: d.status,
    customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : void 0,
    customerName: d.customerName ? String(d.customerName) : void 0,
    serviceIds: Array.isArray(d.serviceIds) ? d.serviceIds : [],
    resourceIds: Array.isArray(d.resourceIds) ? d.resourceIds : [],
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    idempotencyKey: String(d.idempotencyKey ?? ""),
    sourceCallSessionId: d.sourceCallSessionId ? String(d.sourceCallSessionId) : void 0,
    notes: d.notes ? String(d.notes) : void 0,
    partySize: typeof d.partySize === "number" ? d.partySize : void 0,
    b2bVertical: d.b2bVertical,
    stayCheckInDate: d.stayCheckInDate ? String(d.stayCheckInDate) : void 0,
    stayCheckOutDate: d.stayCheckOutDate ? String(d.stayCheckOutDate) : void 0,
    adults: typeof d.adults === "number" ? d.adults : void 0,
    children: typeof d.children === "number" ? d.children : void 0,
    roomUnitLabel: d.roomUnitLabel ? String(d.roomUnitLabel) : void 0,
    isInquiryOnly: d.isInquiryOnly === true,
    staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : void 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}
function toOverlapLike(id, d, startMs, endMs) {
  const status = d.status;
  const startsAt = d.startsAt;
  const endsAt = d.endsAt;
  if (!startsAt?.toMillis || !endsAt?.toMillis) return null;
  const startsAtMs = startsAt.toMillis();
  const endsAtMs = endsAt.toMillis();
  if (!intervalsOverlapHalfOpen(startMs, endMs, startsAtMs, endsAtMs)) return null;
  if (!isBlockingBookingStatus(status)) return null;
  const resourceIds = Array.isArray(d.resourceIds) ? d.resourceIds : [];
  return { id, startsAtMs, endsAtMs, resourceIds, status };
}
function snapToOverlappers(snap, windowStart, windowEnd) {
  const out = [];
  for (const doc of snap.docs) {
    const row = toOverlapLike(doc.id, doc.data(), windowStart, windowEnd);
    if (row) out.push(row);
  }
  return out;
}
async function loadResourceCaps(tx, db2, tenantId, ids) {
  const map = /* @__PURE__ */ new Map();
  for (const rid of ids) {
    const ref = db2.doc(`${resourcesCollectionPath(tenantId)}/${rid}`);
    const s = await tx.get(ref);
    if (!s.exists) continue;
    const d = s.data();
    map.set(rid, {
      locationId: String(d.locationId ?? ""),
      active: Boolean(d.active ?? true),
      capacity: typeof d.capacity === "number" ? d.capacity : 1
    });
  }
  return map;
}
async function createBookingTransactionAdmin(db2, cmd) {
  if (cmd.endsAtMs <= cmd.startsAtMs) {
    return { ok: false, code: "invalid_window", message: "endsAtMs must be after startsAtMs" };
  }
  const tenantRef = db2.doc(tenantDocPath(cmd.tenantId));
  const bookingsPath = bookingsCollectionPath(cmd.tenantId);
  const bookingsCol = db2.collection(bookingsPath);
  const billingCol = db2.collection(billingEventsCollectionPath(cmd.tenantId));
  try {
    const outcome = await db2.runTransaction(async (tx) => {
      const tenantSnap = await tx.get(tenantRef);
      if (!tenantSnap.exists) {
        return { outcome: "fail", code: "tenant_not_found", message: "Tenant doc missing" };
      }
      const tenant = tenantSnap.data();
      if (tenant.status === "suspended") {
        return { outcome: "fail", code: "tenant_suspended", message: "AI reception disabled for tenant" };
      }
      const idemQ = bookingsCol.where("idempotencyKey", "==", cmd.idempotencyKey).limit(1);
      const idemSnap = await tx.get(idemQ);
      if (!idemSnap.empty) {
        const doc = idemSnap.docs[0];
        const existingBooking = docToBooking(doc.id, doc.data());
        const billingIdem = billingUsageIdempotencyKey("booking", existingBooking.id);
        const billQ = billingCol.where("idempotencyKey", "==", billingIdem).limit(1);
        const billSnap = await tx.get(billQ);
        const billingEventId = billSnap.empty ? void 0 : billSnap.docs[0].id;
        return { outcome: "success", booking: existingBooking, billingEventId };
      }
      const pricingGroup = tenant.billing?.pricingGroup ?? "group2";
      const credits = creditsPerSuccessfulInbound(pricingGroup);
      const billable = cmd.billable !== false;
      const balance = tenant.billing?.walletCreditsBalance ?? 0;
      if (billable && balance < credits) {
        return {
          outcome: "fail",
          code: "insufficient_credits",
          message: `Need ${credits} credits, balance ${balance}`
        };
      }
      let finalResourceIds = [...cmd.resourceIds];
      const stayInquiryProvisional = !billable && (cmd.businessType === "hospitality_stay" || cmd.treatAsStayInquiry === true);
      if (finalResourceIds.length === 0) {
        const candidates = cmd.resourceCandidateIds ?? [];
        if (candidates.length === 0) {
          if (stayInquiryProvisional) {
            finalResourceIds = [];
          } else {
            return {
              outcome: "fail",
              code: "invalid_resource",
              message: "resourceIds or resourceCandidateIds required"
            };
          }
        } else {
          const capMap = await loadResourceCaps(tx, db2, cmd.tenantId, candidates);
          const resourceCapacity = (rid) => capMap.get(rid)?.capacity;
          const merged = [];
          for (const rid of candidates) {
            const meta = capMap.get(rid);
            if (!meta || !meta.active || meta.locationId !== cmd.locationId) continue;
            const q = bookingsCol.where("locationId", "==", cmd.locationId).where("resourceIds", "array-contains", rid).where("startsAt", "<", import_firestore.Timestamp.fromMillis(cmd.endsAtMs));
            const os = await tx.get(q);
            merged.push(...snapToOverlappers(os, cmd.startsAtMs, cmd.endsAtMs));
          }
          const dedupe = dedupeOverlappers(merged);
          const picked = pickFirstFreeResource(
            candidates,
            dedupe,
            cmd.startsAtMs,
            cmd.endsAtMs,
            cmd.partySize,
            resourceCapacity
          );
          if (!picked) {
            return { outcome: "fail", code: "overlap", message: "No free resource in candidates" };
          }
          finalResourceIds = picked;
        }
      }
      if (finalResourceIds.length > 0) {
        const capMapAssigned = await loadResourceCaps(tx, db2, cmd.tenantId, finalResourceIds);
        for (const rid of finalResourceIds) {
          const meta = capMapAssigned.get(rid);
          if (!meta || !meta.active || meta.locationId !== cmd.locationId) {
            return { outcome: "fail", code: "invalid_resource", message: `Resource ${rid} not usable at location` };
          }
          if (cmd.businessType === "restaurant" && cmd.partySize != null && cmd.partySize > meta.capacity) {
            return {
              outcome: "fail",
              code: "party_size",
              message: `Party ${cmd.partySize} exceeds resource capacity ${meta.capacity}`
            };
          }
        }
        const overlappersAcc = [];
        for (const rid of finalResourceIds) {
          const q = bookingsCol.where("locationId", "==", cmd.locationId).where("resourceIds", "array-contains", rid).where("startsAt", "<", import_firestore.Timestamp.fromMillis(cmd.endsAtMs));
          const os = await tx.get(q);
          overlappersAcc.push(...snapToOverlappers(os, cmd.startsAtMs, cmd.endsAtMs));
        }
        const unique = dedupeOverlappers(overlappersAcc);
        const conflict = anyConflict(unique, cmd.startsAtMs, cmd.endsAtMs, new Set(finalResourceIds));
        if (conflict) {
          return { outcome: "fail", code: "overlap", message: `Resource held by booking ${conflict.id}` };
        }
      }
      const bookingRef = bookingsCol.doc();
      const billingRef = billingCol.doc();
      const now = import_firestore.FieldValue.serverTimestamp();
      const bookingId = bookingRef.id;
      const startsAtTs = import_firestore.Timestamp.fromMillis(cmd.startsAtMs);
      const endsAtTs = import_firestore.Timestamp.fromMillis(cmd.endsAtMs);
      const bookingStatus = billable ? "confirmed" : "pending_confirm";
      const bookingStub = {
        id: bookingId,
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: bookingStatus,
        customerPhoneE164: cmd.customerPhoneE164,
        customerName: cmd.customerName,
        serviceIds: cmd.serviceIds,
        resourceIds: finalResourceIds,
        startsAt: startsAtTs,
        endsAt: endsAtTs,
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId,
        notes: cmd.notes,
        partySize: cmd.partySize,
        b2bVertical: cmd.businessType,
        stayCheckInDate: cmd.stayCheckInDate,
        stayCheckOutDate: cmd.stayCheckOutDate,
        adults: cmd.adults,
        children: cmd.children,
        roomUnitLabel: cmd.roomUnitLabel,
        isInquiryOnly: cmd.isInquiryOnly === true || !billable,
        createdAt: now,
        updatedAt: now
      };
      const staffHandoffSummary = cmd.staffHandoffSummary ?? formatHandoffBlock(buildBookingHandoffSummary(bookingStub));
      const bookingRow = {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: bookingStatus,
        customerPhoneE164: cmd.customerPhoneE164 ?? null,
        customerName: cmd.customerName ?? null,
        serviceIds: cmd.serviceIds,
        resourceIds: finalResourceIds,
        startsAt: startsAtTs,
        endsAt: endsAtTs,
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId ?? null,
        notes: cmd.notes ?? null,
        partySize: cmd.partySize ?? null,
        b2bVertical: cmd.businessType,
        stayCheckInDate: cmd.stayCheckInDate ?? null,
        stayCheckOutDate: cmd.stayCheckOutDate ?? null,
        adults: cmd.adults ?? null,
        children: cmd.children ?? null,
        roomUnitLabel: cmd.roomUnitLabel ?? null,
        isInquiryOnly: cmd.isInquiryOnly === true || !billable,
        staffHandoffSummary,
        createdAt: now,
        updatedAt: now
      };
      tx.set(bookingRef, bookingRow);
      Object.assign(bookingStub, { staffHandoffSummary });
      if (billable) {
        const billingPayload = buildUsageBillingEventPayload({
          tenantId: cmd.tenantId,
          pricingGroup,
          type: "usage_successful_booking",
          idempotencyKey: billingUsageIdempotencyKey("booking", bookingId),
          reference: bookingStub
        });
        tx.set(billingRef, {
          ...billingPayload,
          id: billingRef.id,
          createdAt: now
        });
        tx.update(tenantRef, {
          "billing.walletCreditsBalance": import_firestore.FieldValue.increment(-credits),
          updatedAt: now
        });
      }
      return { outcome: "success", booking: bookingStub, billingEventId: billable ? billingRef.id : void 0 };
    });
    if (outcome.outcome === "fail") {
      return { ok: false, code: outcome.code, message: outcome.message };
    }
    const fresh = await db2.collection(bookingsPath).doc(outcome.booking.id).get();
    if (fresh.exists) {
      import_v2.logger.info("[b2bBooking] transaction_ok", {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        bookingId: fresh.id,
        billingEventId: outcome.billingEventId,
        idempotencyKey: cmd.idempotencyKey
      });
      return {
        ok: true,
        booking: docToBooking(fresh.id, fresh.data()),
        billingEventId: outcome.billingEventId
      };
    }
    import_v2.logger.info("[b2bBooking] transaction_ok", {
      tenantId: cmd.tenantId,
      locationId: cmd.locationId,
      bookingId: outcome.booking.id,
      billingEventId: outcome.billingEventId,
      idempotencyKey: cmd.idempotencyKey
    });
    return { ok: true, booking: outcome.booking, billingEventId: outcome.billingEventId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: "transaction_aborted", message: msg };
  }
}
function dedupeOverlappers(rows) {
  const byId = /* @__PURE__ */ new Map();
  for (const r of rows) byId.set(r.id, r);
  return [...byId.values()];
}

// src/b2b/order/createOrderTransactionAdmin.ts
var import_firestore2 = require("firebase-admin/firestore");
var import_v22 = require("firebase-functions/v2");

// src/b2b/order/orderDocMappers.ts
function docToOrder(id, d) {
  return {
    id,
    tenantId: String(d.tenantId ?? ""),
    locationId: String(d.locationId ?? ""),
    status: d.status,
    lines: Array.isArray(d.lines) ? d.lines : [],
    customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : void 0,
    customerName: d.customerName ? String(d.customerName) : void 0,
    fulfillment: d.fulfillment ?? "pickup",
    windowStart: d.windowStart,
    windowEnd: d.windowEnd,
    idempotencyKey: String(d.idempotencyKey ?? ""),
    sourceCallSessionId: d.sourceCallSessionId ? String(d.sourceCallSessionId) : void 0,
    deliveryAddress: d.deliveryAddress ? String(d.deliveryAddress) : void 0,
    b2bVertical: d.b2bVertical,
    orderSegment: d.orderSegment,
    wholesaleQualification: d.wholesaleQualification,
    lineClarifications: Array.isArray(d.lineClarifications) ? d.lineClarifications : void 0,
    palletOrVolumeHint: d.palletOrVolumeHint ? String(d.palletOrVolumeHint) : void 0,
    staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : void 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}

// src/b2b/order/createOrderTransactionAdmin.ts
async function createOrderTransactionAdmin(db2, cmd) {
  if (!cmd.lines?.length) {
    return { ok: false, code: "invalid_lines", message: "At least one order line required" };
  }
  if (cmd.windowEndMs <= cmd.windowStartMs) {
    return { ok: false, code: "invalid_window", message: "windowEndMs must be after windowStartMs" };
  }
  const tenantRef = db2.doc(tenantDocPath(cmd.tenantId));
  const ordersPath = ordersCollectionPath(cmd.tenantId);
  const ordersCol = db2.collection(ordersPath);
  const billingCol = db2.collection(billingEventsCollectionPath(cmd.tenantId));
  try {
    const outcome = await db2.runTransaction(async (tx) => {
      const tenantSnap = await tx.get(tenantRef);
      if (!tenantSnap.exists) {
        return { outcome: "fail", code: "tenant_not_found", message: "Tenant doc missing" };
      }
      const tenant = tenantSnap.data();
      if (tenant.status === "suspended") {
        return { outcome: "fail", code: "tenant_suspended", message: "AI reception disabled for tenant" };
      }
      const idemQ = ordersCol.where("idempotencyKey", "==", cmd.idempotencyKey).limit(1);
      const idemSnap = await tx.get(idemQ);
      if (!idemSnap.empty) {
        const doc = idemSnap.docs[0];
        const existing = docToOrder(doc.id, doc.data());
        const billingIdem = billingUsageIdempotencyKey("order", existing.id);
        const billQ = billingCol.where("idempotencyKey", "==", billingIdem).limit(1);
        const billSnap = await tx.get(billQ);
        const billingEventId = billSnap.empty ? void 0 : billSnap.docs[0].id;
        return { outcome: "success", order: existing, billingEventId };
      }
      const pricingGroup = tenant.billing?.pricingGroup ?? "group2";
      const credits = creditsPerSuccessfulInbound(pricingGroup);
      const balance = tenant.billing?.walletCreditsBalance ?? 0;
      const orderSegment = cmd.orderSegment ?? (cmd.businessType === "grocery_wholesale" ? "wholesale" : "retail");
      const wholesale = orderSegment === "wholesale" || cmd.businessType === "grocery_wholesale";
      const wholesaleQualification = wholesale ? cmd.wholesaleQualification ?? "needs_clarification" : cmd.wholesaleQualification;
      const billWanted = cmd.billable === true;
      const debitAllowed = billWanted && (!wholesale || wholesaleQualification === "confirmed_for_fulfillment");
      if (debitAllowed && balance < credits) {
        return {
          outcome: "fail",
          code: "insufficient_credits",
          message: `Need ${credits} credits, balance ${balance}`
        };
      }
      const orderRef = ordersCol.doc();
      const billingRef = billingCol.doc();
      const now = import_firestore2.FieldValue.serverTimestamp();
      const orderId = orderRef.id;
      const windowStartTs = import_firestore2.Timestamp.fromMillis(cmd.windowStartMs);
      const windowEndTs = import_firestore2.Timestamp.fromMillis(cmd.windowEndMs);
      const orderStatus = debitAllowed ? "confirmed" : "pending_confirm";
      const b2bVertical = cmd.b2bVertical ?? cmd.businessType;
      const orderStub = {
        id: orderId,
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: orderStatus,
        lines: cmd.lines,
        customerPhoneE164: cmd.customerPhoneE164,
        customerName: cmd.customerName,
        fulfillment: cmd.fulfillment,
        windowStart: windowStartTs,
        windowEnd: windowEndTs,
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId,
        deliveryAddress: cmd.deliveryAddress,
        b2bVertical,
        orderSegment,
        wholesaleQualification,
        lineClarifications: cmd.lineClarifications,
        palletOrVolumeHint: cmd.palletOrVolumeHint,
        createdAt: now,
        updatedAt: now
      };
      const staffHandoffSummary = cmd.staffHandoffSummary ?? formatHandoffBlock(buildOrderHandoffSummary(orderStub));
      Object.assign(orderStub, { staffHandoffSummary });
      const orderRow = {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: orderStatus,
        lines: cmd.lines,
        customerPhoneE164: cmd.customerPhoneE164 ?? null,
        customerName: cmd.customerName ?? null,
        fulfillment: cmd.fulfillment,
        windowStart: windowStartTs,
        windowEnd: windowEndTs,
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId ?? null,
        deliveryAddress: cmd.deliveryAddress ?? null,
        b2bVertical,
        orderSegment,
        wholesaleQualification: wholesaleQualification ?? null,
        lineClarifications: cmd.lineClarifications ?? null,
        palletOrVolumeHint: cmd.palletOrVolumeHint ?? null,
        staffHandoffSummary,
        createdAt: now,
        updatedAt: now
      };
      tx.set(orderRef, orderRow);
      if (debitAllowed) {
        const billingPayload = buildUsageBillingEventPayload({
          tenantId: cmd.tenantId,
          pricingGroup,
          type: "usage_successful_order",
          idempotencyKey: billingUsageIdempotencyKey("order", orderId),
          reference: orderStub
        });
        tx.set(billingRef, {
          ...billingPayload,
          id: billingRef.id,
          createdAt: now
        });
        tx.update(tenantRef, {
          "billing.walletCreditsBalance": import_firestore2.FieldValue.increment(-credits),
          updatedAt: now
        });
      }
      return { outcome: "success", order: orderStub, billingEventId: debitAllowed ? billingRef.id : void 0 };
    });
    if (outcome.outcome === "fail") {
      return { ok: false, code: outcome.code, message: outcome.message };
    }
    const fresh = await db2.collection(ordersPath).doc(outcome.order.id).get();
    if (fresh.exists) {
      import_v22.logger.info("[b2bOrder] transaction_ok", {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        orderId: fresh.id,
        billingEventId: outcome.billingEventId,
        idempotencyKey: cmd.idempotencyKey
      });
      return {
        ok: true,
        order: docToOrder(fresh.id, fresh.data()),
        billingEventId: outcome.billingEventId
      };
    }
    return { ok: true, order: outcome.order, billingEventId: outcome.billingEventId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: "transaction_aborted", message: msg };
  }
}

// src/firebaseInit.ts
(0, import_app.initializeApp)();
registerCreateBookingTransaction((db2, cmd) => {
  const fs = db2 ?? (0, import_firestore3.getFirestore)();
  return createBookingTransactionAdmin(fs, cmd);
});
registerCreateOrderTransaction((db2, cmd) => {
  const fs = db2 ?? (0, import_firestore3.getFirestore)();
  return createOrderTransactionAdmin(fs, cmd);
});

// src/index.ts
var import_firestore7 = require("firebase-admin/firestore");
var import_v29 = require("firebase-functions/v2");
var import_https2 = require("firebase-functions/v2/https");
var import_firestore8 = require("firebase-admin/firestore");

// ../src/services/b2b/ai/receptionistOrchestrator.ts
async function resolveTenantByPhone(db2, repos, input) {
  return repos.phoneRoute.getByInboundE164(db2, input.inboundNumberE164);
}
async function commitBooking(db2, _repos, cmd) {
  return createBookingTransaction(db2, cmd);
}
async function commitOrder(db2, _repos, cmd) {
  return createOrderTransaction(db2, cmd);
}

// src/appCheckGate.ts
var import_app_check = require("firebase-admin/app-check");
var import_v23 = require("firebase-functions/v2");
async function verifyAppCheckForRequest(req, context) {
  const enforce = process.env.FIREBASE_APP_CHECK_ENFORCE?.trim() === "1";
  const token = String(req.header("X-Firebase-AppCheck") ?? req.header("x-firebase-appcheck") ?? "").trim();
  if (!token) {
    if (enforce) {
      import_v23.logger.error(`[${context}] app_check_missing_enforced`, {
        trust_gate: "app_check",
        context,
        enforce: true,
        doc: "docs/G5_PLATFORM_TRUST.md"
      });
      return { ok: false, status: 401, error: "app_check_token_required" };
    }
    return { ok: true };
  }
  try {
    await (0, import_app_check.getAppCheck)().verifyToken(token);
    if (!enforce) {
      import_v23.logger.info(`[${context}] app_check_ok_optional`, { trust_gate: "app_check", context, enforce: false });
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "verify_failed";
    if (enforce) {
      import_v23.logger.warn(`[${context}] app_check_invalid`, { message: msg });
      return { ok: false, status: 401, error: "app_check_invalid" };
    }
    import_v23.logger.warn(`[${context}] app_check_invalid_optional`, { message: msg });
    return { ok: true };
  }
}

// src/trustRuntimeDiagnostics.ts
var import_v24 = require("firebase-functions/v2");
var logged = false;
function logRuntimeTrustPostureOnce() {
  if (logged) return;
  logged = true;
  const appCheckEnforced = process.env.FIREBASE_APP_CHECK_ENFORCE?.trim() === "1";
  const appCheckNativeExpected = process.env.FIREBASE_APP_CHECK_NATIVE_EXPECTED?.trim() === "1";
  const aiProxyAuthRequired = process.env.AI_PROXY_REQUIRE_AUTH?.trim() !== "0";
  const receiptEnforced = process.env.WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT?.trim() === "1";
  const trustProfile = (process.env.RUNTIME_TRUST_PROFILE ?? "pilot_default").trim() || "pilot_default";
  import_v24.logger.info("[trust_runtime] cold_start_posture", {
    trust_profile: trustProfile,
    app_check_enforced: appCheckEnforced,
    app_check_native_expected: appCheckNativeExpected,
    ai_proxy_auth_required: aiProxyAuthRequired,
    wallet_topup_receipt_enforced: receiptEnforced,
    wallet_topup_receipt_require_wallet_uid: process.env.WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID?.trim() === "1",
    wallet_topup_receipt_require_credits_grant: process.env.WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT?.trim() === "1"
  });
  if (appCheckEnforced) {
    if (appCheckNativeExpected) {
      import_v24.logger.info("[trust_runtime] app_check_enforce_with_native_expected", {
        reminder: "FIREBASE_APP_CHECK_ENFORCE=1 and FIREBASE_APP_CHECK_NATIVE_EXPECTED=1: operators assert iOS/Android clients send X-Firebase-AppCheck (M1: @react-native-firebase/app-check). Revoke NATIVE_EXPECTED if store builds regress. Web uses EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY. See docs/G5_PLATFORM_TRUST.md"
      });
    } else {
      const webOnlyAck = process.env.FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT?.trim() === "1";
      if (webOnlyAck) {
        import_v24.logger.warn("[trust_runtime] app_check_enforce_WEB_ONLY_ACK", {
          reminder: "FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1: operators assert this deployment is never hit by native/Expo Go without tokens (401 on gated HTTPS when enforce=1). If native traffic shares this URL, fix routing or set FIREBASE_APP_CHECK_NATIVE_EXPECTED=1 after M1 verification. docs/G5_PLATFORM_TRUST.md"
        });
      } else {
        import_v24.logger.error("[trust_runtime] app_check_enforce_WITHOUT_native_expected_UNSAFE_DEFAULT", {
          reminder: "FIREBASE_APP_CHECK_ENFORCE=1 without FIREBASE_APP_CHECK_NATIVE_EXPECTED=1: native dev-client/store builds that lack a valid App Check token will get 401 on aiProxy/walletOps/b2bStaffQueueSnapshot. Expo Go cannot send native App Check. After verifying native tokens E2E, set FIREBASE_APP_CHECK_NATIVE_EXPECTED=1. For deliberately web-only enforced backends, set FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1 (see docs/G5_PLATFORM_TRUST.md)."
        });
      }
    }
  }
}

// src/b2b/order/processOrderStaffOpsRequest.ts
var import_firestore4 = require("firebase-admin/firestore");
var import_v25 = require("firebase-functions/v2");
async function processOrderStaffOpsRequest(db2, body) {
  if (body.action !== "set_wholesale_qualification") {
    return { ok: false, error: "unsupported_action" };
  }
  const tenantId = body.tenantId?.trim();
  const orderId = body.orderId?.trim();
  if (!tenantId || !orderId) {
    return { ok: false, error: "missing_tenantId_or_orderId" };
  }
  const orderRef = db2.doc(`${ordersCollectionPath(tenantId)}/${orderId}`);
  const tenantRef = db2.doc(tenantDocPath(tenantId));
  const billingCol = db2.collection(billingEventsCollectionPath(tenantId));
  try {
    const out = await db2.runTransaction(async (tx) => {
      const [orderSnap, tenantSnap] = await Promise.all([tx.get(orderRef), tx.get(tenantRef)]);
      if (!tenantSnap.exists) {
        return { kind: "fail", error: "tenant_not_found" };
      }
      if (!orderSnap.exists) {
        return { kind: "fail", error: "order_not_found" };
      }
      const tenant = tenantSnap.data();
      if (tenant.status === "suspended") {
        return { kind: "fail", error: "tenant_suspended" };
      }
      const row = docToOrder(orderId, orderSnap.data());
      const wholesale = row.orderSegment === "wholesale" || row.b2bVertical === "grocery_wholesale";
      if (!wholesale) {
        return { kind: "fail", error: "order_not_wholesale_segment" };
      }
      const next = body.wholesaleQualification;
      const debitWanted = next === "confirmed_for_fulfillment" && body.requestUsageDebit !== false;
      const pricingGroup = tenant.billing?.pricingGroup ?? "group2";
      const credits = creditsPerSuccessfulInbound(pricingGroup);
      const balance = tenant.billing?.walletCreditsBalance ?? 0;
      const billingIdem = billingUsageIdempotencyKey("order", orderId);
      const billQ = billingCol.where("idempotencyKey", "==", billingIdem).limit(1);
      const billSnap = await tx.get(billQ);
      const alreadyBilled = !billSnap.empty;
      if (debitWanted && !alreadyBilled && balance < credits) {
        return { kind: "fail", error: "insufficient_credits" };
      }
      const now = import_firestore4.FieldValue.serverTimestamp();
      const newStatus = next === "confirmed_for_fulfillment" ? "confirmed" : row.status === "draft" ? "pending_confirm" : row.status;
      const updated = {
        ...row,
        wholesaleQualification: next,
        status: newStatus,
        updatedAt: now
      };
      const staffHandoffSummary = formatHandoffBlock(buildOrderHandoffSummary(updated));
      tx.update(orderRef, {
        wholesaleQualification: next,
        status: newStatus,
        staffHandoffSummary,
        updatedAt: now
      });
      let billingEventId;
      if (debitWanted && !alreadyBilled) {
        const billingRef = billingCol.doc();
        const billingPayload = buildUsageBillingEventPayload({
          tenantId,
          pricingGroup,
          type: "usage_successful_order",
          idempotencyKey: billingIdem,
          reference: { ...updated, id: orderId }
        });
        tx.set(billingRef, {
          ...billingPayload,
          id: billingRef.id,
          createdAt: now
        });
        tx.update(tenantRef, {
          "billing.walletCreditsBalance": import_firestore4.FieldValue.increment(-credits),
          updatedAt: now
        });
        billingEventId = billingRef.id;
      } else if (alreadyBilled) {
        billingEventId = billSnap.docs[0].id;
      }
      return { kind: "ok", wholesaleQualification: next, billingEventId };
    });
    if (out.kind === "fail") {
      return { ok: false, error: out.error };
    }
    import_v25.logger.info("[b2bOrderStaff] qualification_updated", {
      tenantId,
      orderId,
      wholesaleQualification: out.wholesaleQualification,
      billingEventId: out.billingEventId
    });
    return {
      ok: true,
      orderId,
      wholesaleQualification: out.wholesaleQualification,
      billingEventId: out.billingEventId
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

// src/b2b/voice/processVoiceOrchestrationRequest.ts
var import_v27 = require("firebase-functions/v2");

// ../src/services/b2b/ai/bookingToCallSessionFailure.ts
function mapBookingCodeToCallFailure(code, message) {
  const msg = message ?? code;
  switch (code) {
    case "overlap":
      return { outcome: "fail", failureCode: "no_available_resource", failureReason: msg };
    case "insufficient_credits":
      return { outcome: "fail", failureCode: "insufficient_credits", failureReason: msg };
    case "invalid_resource":
    case "invalid_window":
    case "party_size":
    case "not_implemented":
      return { outcome: "fail", failureCode: "invalid_input", failureReason: msg };
    case "tenant_not_found":
      return { outcome: "fail", failureCode: "tenant_not_found", failureReason: msg };
    case "tenant_suspended":
      return { outcome: "fail", failureCode: "tenant_suspended", failureReason: msg };
    default:
      return { outcome: "fail", failureCode: "internal_error", failureReason: msg };
  }
}
function mapOrderCodeToCallFailure(code, message) {
  const msg = message ?? code;
  switch (code) {
    case "insufficient_credits":
      return { outcome: "fail", failureCode: "insufficient_credits", failureReason: msg };
    case "invalid_lines":
    case "invalid_window":
    case "not_implemented":
      return { outcome: "fail", failureCode: "invalid_input", failureReason: msg };
    case "tenant_not_found":
      return { outcome: "fail", failureCode: "tenant_not_found", failureReason: msg };
    case "tenant_suspended":
      return { outcome: "fail", failureCode: "tenant_suspended", failureReason: msg };
    default:
      return { outcome: "fail", failureCode: "internal_error", failureReason: msg };
  }
}

// ../src/services/b2b/ai/bookingSlotExtraction.ts
function stripRolePrefix(line) {
  return line.replace(/^\s*Caller:\s*/i, "").replace(/^\s*Assistant:\s*/i, "").trim();
}
function mergeField(prev, next) {
  if (next != null && String(next).trim().length > 0) return String(next).trim();
  return prev;
}
function mergeSlotState(prev, patch) {
  return {
    service: mergeField(prev.service, patch.service),
    time: mergeField(prev.time, patch.time),
    name: mergeField(prev.name, patch.name),
    stayCheckIn: mergeField(prev.stayCheckIn, patch.stayCheckIn),
    stayCheckOut: mergeField(prev.stayCheckOut, patch.stayCheckOut),
    occupancy: mergeField(prev.occupancy, patch.occupancy)
  };
}
function slotValue(s, key) {
  switch (key) {
    case "service":
      return s.service;
    case "time":
      return s.time;
    case "name":
      return s.name;
    case "stayCheckIn":
      return s.stayCheckIn;
    case "stayCheckOut":
      return s.stayCheckOut;
    case "occupancy":
      return s.occupancy;
  }
}
function missingBookingSlots(bt, s) {
  return requiredBookingSlotKeys(bt).filter((k) => !String(slotValue(s, k) ?? "").trim());
}
function allBookingSlotsFilled(bt, s) {
  return missingBookingSlots(bt, s).length === 0;
}
function extractSlotsFromUtterance(raw) {
  const text = stripRolePrefix(raw).trim();
  if (!text) return {};
  const out = {};
  const namePatterns = [
    /(?:my name is|i'?m\s+called|i am|call me|tên\s*(?:là|of|is))\s*[:\-]?\s*([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s'.-]{1,48})/iu,
    /(?:jmenuji se|jméno je)\s+([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s'.-]{1,48})/iu
  ];
  for (const re of namePatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      out.name = m[1].trim();
      break;
    }
  }
  const timePatterns = [
    /\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/i,
    /\b(\d{1,2}\s*(?:am|pm))\b/i,
    /\b(?:tomorrow|today|tonight|mai|hôm nay|ngày mai)\b[^.!?]*(?:\d{1,2}\s*(?:giờ|h|:))?\s*/iu,
    /\b(?:lúc|at|@)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|giờ)?)\b/iu,
    /\b(?:morning|afternoon|evening|chiều|sáng|tối)\b/iu
  ];
  for (const re of timePatterns) {
    const m = text.match(re);
    if (m?.[0]) {
      out.time = m[0].replace(/\s+/g, " ").trim();
      break;
    }
  }
  if (!out.time && /\b\d{1,2}:\d{2}\b/.test(text)) {
    const m = text.match(/\b\d{1,2}:\d{2}\b/);
    if (m) out.time = m[0];
  }
  const servicePatterns = [
    /(?:book|booking|đặt|appointment|reservation|service)\s+(?:for|a|an|the)?\s*([^.!?\n]{2,60})/iu,
    /(?:mani|manicure|gel|nails|pedicure|haircut|massage|facial|table|party|chỗ|dịch vụ)\s*[a-zA-ZÀ-ỹ0-9\s]*/iu
  ];
  for (const re of servicePatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const cand = m[1].trim();
      if (cand.length >= 2 && !/^\d+$/.test(cand)) {
        out.service = cand.replace(/\s+/g, " ");
        break;
      }
    }
  }
  if (!out.service) {
    const m2 = text.match(
      /\b(manicure|pedicure|gel|nails|haircut|massage|facial|table|appointment)\b/i
    );
    if (m2?.[1]) out.service = m2[1];
  }
  const isoRange = text.match(
    /\b(20\d{2}-\d{2}-\d{2})\b.*\b(20\d{2}-\d{2}-\d{2})\b/
  );
  if (isoRange) {
    out.stayCheckIn = out.stayCheckIn ?? isoRange[1];
    out.stayCheckOut = out.stayCheckOut ?? isoRange[2];
  }
  const stayIn = text.match(/\b(?:check[-\s]?in|nhận\s*phòng|ở\s*từ)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|[^\n,.]{3,40})/iu) ?? text.match(/\b(?:từ\s*ngày|from)\s+(\d{1,2}[./]\d{1,2}|[^\n,.]{3,36})/iu);
  if (stayIn?.[1]) out.stayCheckIn = out.stayCheckIn ?? stayIn[1].trim();
  const stayOut = text.match(/\b(?:check[-\s]?out|trả\s*phòng|đến\s*ngày|until)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|[^\n,.]{3,40})/iu);
  if (stayOut?.[1]) out.stayCheckOut = out.stayCheckOut ?? stayOut[1].trim();
  const occ = text.match(
    /\b(\d+\s*(?:adults?|người lớn|trẻ em|children|kids?)[^\n,.]{0,40})/iu
  ) ?? text.match(/\b(\d+\s*(?:khách|guests?))\b/iu);
  if (occ?.[1]) out.occupancy = occ[1].replace(/\s+/g, " ").trim();
  return out;
}
function parseConfirmationUtterance(raw) {
  const t = stripRolePrefix(raw).trim().toLowerCase();
  if (!t) return "unknown";
  if (/^(yes|yeah|yep|ok|okay|correct|right|sure|đúng|vâng|dạ|ừ|oke|jasně|ano)$/iu.test(t) || /\b(đúng rồi|chính xác|xác nhận|potvrzuji)\b/iu.test(t)) {
    return "yes";
  }
  if (/^(no|nope|nah|wrong|cancel|không|ne)$/iu.test(t) || /\b(chưa đúng|sai rồi|không phải)\b/iu.test(t)) {
    return "no";
  }
  return "unknown";
}

// ../src/services/b2b/ai/bookingSlotVoice.ts
function normalizeSpoken(text) {
  return text.replace(/\s+/g, " ").replace(/\*/g, "").trim();
}
function isVi(lang) {
  return (lang ?? "").toLowerCase().startsWith("vi");
}
function promptForMissingBookingSlot(slot, lang) {
  if (isVi(lang)) {
    switch (slot) {
      case "service":
        return "B\u1EA1n mu\u1ED1n \u0111\u1EB7t d\u1ECBch v\u1EE5 ho\u1EB7c lo\u1EA1i ph\xF2ng g\xEC \u1EA1?";
      case "time":
        return "B\u1EA1n mu\u1ED1n \u0111\u1EB7t v\xE0o l\xFAc n\xE0o?";
      case "name":
        return "Cho t\xF4i xin t\xEAn li\xEAn h\u1EC7 \u0111\u1EC3 ghi nh\u1EADn nh\xE9?";
      case "stayCheckIn":
        return "B\u1EA1n nh\u1EADn ph\xF2ng t\u1EEB ng\xE0y n\xE0o?";
      case "stayCheckOut":
        return "B\u1EA1n tr\u1EA3 ph\xF2ng ng\xE0y n\xE0o?";
      case "occupancy":
        return "B\u1EA1n \u0111i m\u1EA5y ng\u01B0\u1EDDi (ng\u01B0\u1EDDi l\u1EDBn / tr\u1EBB em)?";
      default:
        return "";
    }
  }
  switch (slot) {
    case "service":
      return "Which service or room type would you like?";
    case "time":
      return "What day and time work for you?";
    case "name":
      return "What name should I use for this request?";
    case "stayCheckIn":
      return "What is your check-in date?";
    case "stayCheckOut":
      return "What is your check-out date?";
    case "occupancy":
      return "How many guests (adults and children)?";
    default:
      return "";
  }
}
function buildBookingConfirmationSummary(slots, lang, businessType) {
  if (businessType === "hospitality_stay") {
    const inD = slots.stayCheckIn ?? "";
    const outD = slots.stayCheckOut ?? "";
    const occ = slots.occupancy ?? "";
    const n2 = slots.name ?? "";
    if (isVi(lang)) {
      return normalizeSpoken(
        `Ghi nh\u1EADn y\xEAu c\u1EA7u \u1EDF: nh\u1EADn ${inD}, tr\u1EA3 ${outD}, ${occ}, li\xEAn h\u1EC7 ${n2}. \u0110\xFAng th\xF4ng tin ch\u01B0a? (L\u1EC5 t\xE2n s\u1EBD x\xE1c nh\u1EADn ph\xF2ng v\xE0 gi\xE1.)`
      );
    }
    return normalizeSpoken(
      `I have a stay request: check-in ${inD}, check-out ${outD}, guests ${occ}, contact ${n2}. Is that correct? Staff will confirm room and rate.`
    );
  }
  const s = slots.service ?? "";
  const t = slots.time ?? "";
  const n = slots.name ? isVi(lang) ? `, t\xEAn ${slots.name}` : `, under the name ${slots.name}` : "";
  if (isVi(lang)) {
    return normalizeSpoken(`B\u1EA1n mu\u1ED1n \u0111\u1EB7t ${s} l\xFAc ${t}${n}, \u0111\xFAng kh\xF4ng?`);
  }
  const namePart = slots.name ? `, under the name ${slots.name}` : "";
  return normalizeSpoken(`You'd like to book ${s} at ${t}${namePart}. Is that correct?`);
}
function acknowledgmentAfterConfirm(lang) {
  return isVi(lang) ? "C\u1EA3m \u01A1n b\u1EA1n. B\u1EA1n c\xF3 th\u1EC3 x\xE1c nh\u1EADn \u0111\u1EB7t ch\u1ED7 tr\xEAn m\xE0n h\xECnh ho\u1EB7c t\xF4i s\u1EBD chuy\u1EC3n ti\u1EBFp." : "Thank you. You can confirm the booking on your side, or I will proceed when you are ready.";
}
function acknowledgmentAfterConfirmForBusinessType(lang, businessType) {
  if (businessType === "hospitality_stay") {
    return isVi(lang) ? "C\u1EA3m \u01A1n b\u1EA1n. T\xF4i \u0111\xE3 ghi nh\u1EADn y\xEAu c\u1EA7u l\u01B0u tr\xFA \u0111\u1EC3 l\u1EC5 t\xE2n x\xE1c nh\u1EADn ph\xF2ng v\xE0 gi\xE1 \u2014 \u0111\xE2y ch\u01B0a ph\u1EA3i x\xE1c nh\u1EADn cu\u1ED1i c\xF9ng hay \u0111\xE3 thanh to\xE1n." : "Thank you. I have recorded your stay request for staff to confirm room and rate \u2014 this is not a final reservation or payment confirmation yet.";
  }
  return acknowledgmentAfterConfirm(lang);
}
function followUpWhenClosing(lang) {
  return isVi(lang) ? "B\u1EA1n c\u1EA7n h\u1ED7 tr\u1EE3 th\xEAm g\xEC kh\xF4ng \u1EA1?" : "Anything else I can help with?";
}
function generateBookingVoiceResponse(input) {
  const lang = input.defaultLanguage;
  const ttsVoiceId = input.ttsVoiceId;
  const userLine = input.latestUserInput.trim();
  const base = input.session.voiceDialogueState ?? { phase: "greeting", turnCount: 0 };
  const slots = input.session.bookingSlotState ?? {};
  const conf = input.session.bookingConfirmation ?? { awaitingConfirm: false, confirmed: false };
  const bt = input.businessType;
  if (!userLine && conf.awaitingConfirm && allBookingSlotsFilled(bt, slots)) {
    const line = normalizeSpoken(
      isVi(lang) ? "M\xECnh ch\u01B0a nghe r\xF5. B\u1EA1n n\xF3i \u0111\xFAng hay kh\xF4ng \u1EA1?" : "I didn't catch that. Was that a yes or a no?"
    );
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: "booking_confirm",
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: false,
      audioEncoding: "none"
    };
  }
  if (!userLine) {
    return null;
  }
  if (conf.confirmed) {
    if (base.phase === "closing") {
      const line2 = normalizeSpoken(followUpWhenClosing(lang));
      return {
        spokenText: line2,
        voiceDialogueState: { ...base, phase: "closing", turnCount: base.turnCount + 1, lastQuestionAsked: line2 },
        tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
        advancedPhase: true,
        audioEncoding: "none"
      };
    }
    const line = normalizeSpoken(acknowledgmentAfterConfirmForBusinessType(lang, bt));
    return {
      spokenText: line,
      voiceDialogueState: { ...base, phase: "closing", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (conf.awaitingConfirm && allBookingSlotsFilled(bt, slots)) {
    const askedSummary = /\b(đúng không|phải không)\b/i.test(base.lastQuestionAsked ?? "") || /\bis that correct\b/i.test(base.lastQuestionAsked ?? "");
    const unclear = !userLine || userLine && parseConfirmationUtterance(userLine) === "unknown" && askedSummary;
    if (askedSummary && unclear) {
      const line2 = normalizeSpoken(
        isVi(lang) ? "B\u1EA1n vui l\xF2ng n\xF3i \u0111\xFAng ho\u1EB7c kh\xF4ng \u0111\u1EC3 t\xF4i x\xE1c nh\u1EADn nh\xE9." : "Please say yes or no so I can confirm."
      );
      return {
        spokenText: line2,
        voiceDialogueState: {
          ...base,
          phase: "booking_confirm",
          turnCount: base.turnCount + 1,
          lastQuestionAsked: line2
        },
        tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
        advancedPhase: false,
        audioEncoding: "none"
      };
    }
    const line = normalizeSpoken(buildBookingConfirmationSummary(slots, lang, bt));
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: "booking_confirm",
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  const miss = missingBookingSlots(bt, slots);
  if (miss.length > 0) {
    const line = normalizeSpoken(promptForMissingBookingSlot(miss[0], lang));
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: "booking_slot_fill",
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (allBookingSlotsFilled(bt, slots) && !conf.awaitingConfirm && !conf.confirmed) {
    const line = normalizeSpoken(buildBookingConfirmationSummary(slots, lang, bt));
    return {
      spokenText: line,
      voiceDialogueState: {
        ...base,
        phase: "booking_confirm",
        turnCount: base.turnCount + 1,
        lastQuestionAsked: line
      },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  return null;
}

// ../src/services/selling/detectOpportunity.ts
var BOOKING_KEYWORDS = [
  "\u0111\u1EB7t l\u1ECBch",
  "dat lich",
  "book",
  "booking",
  "h\u1EB9n",
  "hen",
  "appointment",
  "gia h\u1EA1n",
  "renew"
];
var LANGUAGE_CONFUSION_KEYWORDS = [
  "kh\xF4ng hi\u1EC3u",
  "khong hieu",
  "kh\xF4ng hi\u1EC3u ti\u1EBFng",
  "d\u1ECBch",
  "dich",
  "translate",
  "i dont understand",
  "i do not understand",
  "don't understand"
];
var SERVICE_SEARCH_KEYWORDS = [
  "t\xECm",
  "tim",
  "t\xECm ti\u1EC7m",
  "tim tiem",
  "t\xECm qu\xE1n",
  "tim quan",
  "g\u1EA7n",
  "gan",
  "nearby",
  "near me",
  "d\u1ECBch v\u1EE5",
  "dich vu"
];
function normalize(text) {
  return text.trim().toLowerCase();
}
function includesAny(source, words) {
  return words.some((word) => source.includes(word));
}
function detectOpportunity(input) {
  const raw = normalize(input.userInput);
  if (includesAny(raw, LANGUAGE_CONFUSION_KEYWORDS) || input.context.scenario === "language_confusion" || input.intent === "language_confusion") {
    return "interpreter";
  }
  const isBookingIntent = input.intent === "booking" || includesAny(raw, BOOKING_KEYWORDS);
  if (isBookingIntent) return "booking_call";
  const isCallAssistIntent = input.intent === "service_search" || includesAny(raw, SERVICE_SEARCH_KEYWORDS);
  if (isCallAssistIntent) return "call_assist";
  return null;
}

// ../src/services/interpreterSessionConstants.ts
var INTERPRETER_SESSION_CREDITS = 25;

// ../src/services/PaymentsService.ts
var PAYMENTS_API_BASE = process.env.EXPO_PUBLIC_PAYMENTS_API_BASE?.trim() ?? "";
function normalizeCountry(input) {
  return resolveCountryPack(input).countryCode;
}
function formatMoney(amount) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount);
}
function calculateCallCreditPrice(userCountry) {
  const country = normalizeCountry(userCountry);
  const tier = pricingTierForUsageDebits(country);
  const creditsPerCall = OUTBOUND_CALL_CREDITS_BY_TIER[tier];
  return {
    country,
    creditsPerCall,
    basePerCallCzk: creditsPerCall,
    localAmount: creditsPerCall,
    currencyCode: "CREDITS",
    amountLabel: `${formatMoney(creditsPerCall)} Credits/cu\u1ED9c`
  };
}
function calculateLeTanBookingPrice(userCountry) {
  const country = normalizeCountry(userCountry);
  const tier = pricingTierForUsageDebits(country);
  const creditsPerBooking = LETAN_BOOKING_CREDITS_BY_TIER[tier];
  return {
    country,
    creditsPerBooking,
    localAmount: creditsPerBooking,
    currencyCode: "CREDITS",
    amountLabel: `${creditsPerBooking} Credits/l\u01B0\u1EE3t`
  };
}

// ../src/services/selling/generateSellCTA.ts
function snippet(input) {
  const s = input.trim().replace(/\s+/g, " ");
  return s.length > 42 ? `${s.slice(0, 42)}...` : s;
}
function actionToPrefill(action, userInput) {
  const s = snippet(userInput);
  switch (action) {
    case "leona_booking":
      return { prefillRequest: `G\u1ECDi h\u1ED7 tr\u1EE3 theo nhu c\u1EA7u c\u1EE7a t\xF4i: "${s}". T\u1EADp trung \u0111\u1EB7t l\u1ECBch / x\xE1c nh\u1EADn l\u1ECBch ngay.` };
    case "start_interpreter":
      return {};
    case "leTan_assist":
      return { proactiveQuestion: `H\u1ED7 tr\u1EE3 cu\u1ED9c g\u1ECDi/ch\u1ED1t l\u1ECBch nhanh: "${s}".` };
    default:
      return {};
  }
}
function generateSellCTA(opportunity, input) {
  if (!opportunity) return null;
  const safeInput = input ?? {
    userInput: "",
    intent: null,
    context: {}
  };
  const userCountry = safeInput.context.userCountry;
  const bookingCost = calculateCallCreditPrice(userCountry).localAmount;
  const interpreterCost = INTERPRETER_SESSION_CREDITS;
  const leTanCost = calculateLeTanBookingPrice(userCountry).localAmount;
  switch (opportunity) {
    case "booking_call": {
      const action = "leona_booking";
      const { prefillRequest } = actionToPrefill(action, safeInput.userInput);
      return {
        action,
        creditsCost: bookingCost,
        message: `Mu\u1ED1n m\xECnh g\u1ECDi Leona \u0111\u1EB7t l\u1ECBch / gia h\u1EA1n ngay kh\xF4ng? (C\u1EA7n ${bookingCost} Credits)
Ti\u1EBFp theo: n\u1EBFu c\u1EA7n, m\xECnh gi\xFAp b\u1EA1n s\u1EAFp l\u1ECBch gi\u1EA5y t\u1EDD theo \u0111\xFAng m\u1ED1c.`,
        resume: { route: "LeonaCall", params: { prefillRequest, autoSubmit: true } }
      };
    }
    case "interpreter": {
      const action = "start_interpreter";
      return {
        action,
        creditsCost: interpreterCost,
        message: `M\xECnh m\u1EDF phi\xEAn d\u1ECBch ngay \u0111\u1EC3 b\u1EA1n n\xF3i tr\xF4i ch\u1EA3y h\u01A1n. (C\u1EA7n ${interpreterCost} Credits/phi\xEAn)
Ti\u1EBFp theo: n\u1EBFu b\u1EA1n mu\u1ED1n g\u1ECDi \u0111\u1EB7t l\u1ECBch, m\xECnh g\u1EE3i \xFD chuy\u1EC3n sang Leona.`,
        resume: { route: "LiveInterpreter", params: { guidedEntry: true, scenario: "general" } }
      };
    }
    case "call_assist": {
      const action = "leTan_assist";
      const { proactiveQuestion } = actionToPrefill(action, safeInput.userInput);
      return {
        action,
        creditsCost: leTanCost,
        message: `M\xECnh c\xF3 th\u1EC3 chuy\u1EC3n b\u1EA1n sang L\u1EC5 t\xE2n \u0111\u1EC3 h\u1ED7 tr\u1EE3 ch\u1ED1t nhanh. (C\u1EA7n ${leTanCost} Credits/l\u01B0\u1EE3t m\xF4 ph\u1ECFng)
Ti\u1EBFp theo: sau khi ch\u1ED1t, n\u1EBFu c\u1EA7n x\xE1c nh\u1EADn cu\u1ED9c g\u1ECDi th\u1EADt, m\xECnh \u0111\u1EC1 xu\u1EA5t Leona.`,
        resume: {
          route: "Tabs",
          params: {
            screen: "LeTan",
            params: { proactiveQuestion, autoSimulate: true }
          }
        }
      };
    }
    default:
      return null;
  }
}

// ../src/services/selling/sellEngine.ts
function maybeGenerateSellCTA(input) {
  const opportunity = detectOpportunity(input);
  const cta = opportunity ? generateSellCTA(opportunity, input) : null;
  return { opportunity: opportunity ?? null, cta };
}

// ../src/services/b2b/ai/callResponseGenerator.ts
var customGenerator = null;
function normalizeSpoken2(text) {
  return text.replace(/\s+/g, " ").replace(/\*/g, "").trim();
}
function inferIntentFromUtterance(raw) {
  const t = raw.toLowerCase();
  if (/\b(hotel|room|suite|stay|overnight|check[-\s]?in|check[-\s]?out|phòng|khách sạn|nhận phòng|trả phòng|đêm)\b/i.test(
    t
  )) {
    return "stay_booking";
  }
  if (/\b(wholesale|pallet|đổ hàng|bán sỉ|sỉ\b|nguyên cont|bulk)\b/i.test(t)) {
    return "wholesale_order";
  }
  if (/\b(book|booking|appointment|reservation|reserve|table|slot|đặt|đặt chỗ|objednat|rezerv)\b/i.test(t))
    return "booking";
  if (/\b(order|pickup|delivery|takeaway|objednáv|giao|mang)\b/i.test(t)) return "order";
  if (/\b(transfer|human|speak to|manager|operátor)\b/i.test(t)) return "transfer";
  if (/\b(what|when|where|hours|open|price|faq|help|question)\b/i.test(t)) return "faq";
  return null;
}
function effectiveIntent(session, latestUserInput) {
  const fromSession = session.detectedIntent ?? session.intent;
  if (fromSession && fromSession !== "unknown") return fromSession;
  const inferred = inferIntentFromUtterance(latestUserInput);
  return inferred ?? "unknown";
}
function nextPhaseForIntent(intent) {
  switch (intent) {
    case "booking":
    case "stay_booking":
      return "booking_collect";
    case "order":
    case "wholesale_order":
      return "order_collect";
    case "faq":
      return "faq";
    case "transfer":
      return "confirm_handoff";
    default:
      return "intent_clarify";
  }
}
function clarificationResponse(state, languageHint) {
  const lang = languageHint?.slice(0, 2);
  const line = lang === "vi" ? "Xin l\u1ED7i, t\xF4i kh\xF4ng nghe r\xF5. B\u1EA1n n\xF3i l\u1EA1i gi\xFAp t\xF4i m\u1ED9t l\u1EA7n \u0111\u01B0\u1EE3c kh\xF4ng?" : lang === "cs" ? "Promi\u0148te, nerozum\u011Bl jsem. Zopakujte to pros\xEDm jednou?" : "Sorry, I didn't quite catch that. Could you say that again, please?";
  return {
    spokenText: normalizeSpoken2(line),
    voiceDialogueState: {
      ...state,
      turnCount: state.turnCount + 1,
      lastQuestionAsked: line
    },
    tts: { synthesizeFromText: true, language: languageHint },
    advancedPhase: false,
    audioEncoding: "none"
  };
}
function bookingSlotQuestion(businessType) {
  switch (businessType) {
    case "hospitality_stay":
      return "What are your check-in and check-out dates, how many guests, and the name for the reservation request?";
    case "restaurant":
      return "What day, time, and party size should I book?";
    case "nails":
      return "What service and time work best for you?";
    case "grocery_retail":
    case "potraviny":
      return "What time works for pickup or delivery, and what should we prepare?";
    case "grocery_wholesale":
      return "For a wholesale request, what products and approximate volumes do you need, and pickup or delivery?";
    default:
      return "What time would you like, and is there anything we should prepare in advance?";
  }
}
function maybeAppendSellCta(line, latestUserInput, intent) {
  const out = maybeGenerateSellCTA({
    userInput: latestUserInput,
    intent,
    context: {}
  });
  if (!out.cta) return line;
  return normalizeSpoken2(`${line} ${out.cta.message.split("\n")[0] ?? ""}`);
}
function defaultGenerateCallResponse(input) {
  const { session, latestUserInput, tenantDisplayName, businessType } = input;
  const lang = input.defaultLanguage;
  const ttsVoiceId = input.ttsVoiceId;
  const base = session.voiceDialogueState ?? { phase: "greeting", turnCount: 0 };
  const userLine = latestUserInput.trim();
  const intent = effectiveIntent(session, userLine);
  let phase = base.phase;
  if (intent === "booking" || intent === "stay_booking") {
    const bookingVoice = generateBookingVoiceResponse(input);
    if (bookingVoice) return bookingVoice;
  }
  if (!userLine) {
    if (base.phase === "greeting" && base.turnCount === 0) {
      const line = normalizeSpoken2(
        `Thanks for calling ${tenantDisplayName}. Do you need a booking, retail or wholesale order, a hotel stay request, or something else?`
      );
      return {
        spokenText: line,
        voiceDialogueState: { phase: "intent_clarify", turnCount: 1, lastQuestionAsked: line },
        tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
        advancedPhase: true,
        audioEncoding: "none"
      };
    }
    return clarificationResponse(base, lang);
  }
  if (phase === "greeting") {
    phase = intent === "unknown" ? "intent_clarify" : nextPhaseForIntent(intent);
  }
  if (intent === "unknown") {
    const baseLine = normalizeSpoken2(
      `Are you looking to book a visit, hotel stay, retail or wholesale order, ask a question, or speak with someone at ${tenantDisplayName}?`
    );
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "intent_clarify", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (intent === "booking" || intent === "stay_booking") {
    const baseLine = normalizeSpoken2(bookingSlotQuestion(businessType));
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "booking_slot_fill", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (intent === "order") {
    const baseLine = businessType === "grocery_wholesale" ? normalizeSpoken2(
      "For wholesale: pickup or delivery, line items with quantities or pallets, and any special handling? I will record this as a request for staff to confirm before it is final."
    ) : normalizeSpoken2("Would you like pickup or delivery, and what should I put on the order?");
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "order_collect", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (intent === "wholesale_order") {
    const baseLine = normalizeSpoken2(
      "I will take a wholesale order request: please list products, quantities or pallets, pickup or delivery window, and contact name. Staff must confirm stock and price \u2014 this is not a final order until they respond."
    );
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "order_collect", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (intent === "faq") {
    const baseLine = normalizeSpoken2(`What would you like to know about ${tenantDisplayName}?`);
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "faq", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  if (intent === "transfer") {
    const baseLine = normalizeSpoken2("Connecting you with the team. Please hold for a moment.");
    const line = maybeAppendSellCta(baseLine, userLine, intent);
    return {
      spokenText: line,
      voiceDialogueState: { phase: "confirm_handoff", turnCount: base.turnCount + 1, lastQuestionAsked: line },
      tts: { synthesizeFromText: true, language: lang, voiceId: ttsVoiceId },
      advancedPhase: true,
      audioEncoding: "none"
    };
  }
  return clarificationResponse(base, lang);
}
function generateCallResponse(input) {
  if (customGenerator) return customGenerator(input);
  return defaultGenerateCallResponse(input);
}

// ../src/services/b2b/ai/voiceOrderCommit.ts
function parseVoiceOrderCommitLines(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const lines = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") return null;
    const o = row;
    const name = o.name;
    const quantity = o.quantity;
    if (typeof name !== "string" || !name.trim()) return null;
    const q = typeof quantity === "number" && Number.isFinite(quantity) ? quantity : typeof quantity === "string" ? parseInt(quantity, 10) : NaN;
    if (!Number.isFinite(q) || q <= 0) return null;
    lines.push({
      name: name.trim(),
      quantity: Math.floor(q),
      needsClarification: o.needsClarification === true,
      notes: typeof o.notes === "string" ? o.notes : void 0,
      sku: typeof o.sku === "string" ? o.sku : void 0
    });
  }
  return lines;
}
function parseVoiceOrderLineClarifications(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return void 0;
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object") continue;
    const o = row;
    const lineIndex = typeof o.lineIndex === "number" && Number.isFinite(o.lineIndex) ? o.lineIndex : typeof o.lineIndex === "string" ? parseInt(o.lineIndex, 10) : i;
    if (!Number.isFinite(lineIndex)) continue;
    out.push({
      lineIndex: Math.max(0, Math.floor(lineIndex)),
      vi: typeof o.vi === "string" ? o.vi : void 0,
      en: typeof o.en === "string" ? o.en : void 0,
      cs: typeof o.cs === "string" ? o.cs : void 0
    });
  }
  return out.length ? out : void 0;
}

// ../src/services/b2b/hospitality/stayCommitMapping.ts
function normalizeStayDateInput(raw) {
  if (!raw) return void 0;
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }
  return t.length > 0 ? t.slice(0, 80) : void 0;
}
function parseOccupancyGuestCounts(occupancy) {
  if (!occupancy?.trim()) return {};
  const adults = occupancy.match(/(\d+)\s*(?:adults?|người\s*lớn|khách(?:\s*lớn)?)/iu) ?? occupancy.match(/\b(\d+)\s*(?:x\s*)?(?:người|người\s*đi)\b/iu);
  const children = occupancy.match(/(\d+)\s*(?:children|kids?|trẻ|trẻ\s*em)/iu) ?? occupancy.match(/(\d+)\s*(?:trẻ)/iu);
  const out = {};
  if (adults?.[1]) {
    const n = parseInt(adults[1], 10);
    if (Number.isFinite(n)) out.adults = n;
  }
  if (children?.[1]) {
    const n = parseInt(children[1], 10);
    if (Number.isFinite(n)) out.children = n;
  }
  return out;
}
function buildHospitalityStayInquiryNotes(existing) {
  const tag = "[Hospitality \xB7 voice inquiry] Recorded as reservation request / inquiry only \u2014 not billed; staff must confirm room, rate, and guarantee before treating as a firm booking.";
  if (!existing?.trim()) return tag;
  return `${existing.trim()}

${tag}`;
}

// ../src/services/voice/voicePersonaRegistry.ts
function extendedToneToCatalogTone(tone) {
  switch (tone) {
    case "formal":
    case "urgent":
      return "formal";
    case "reassuring":
    case "friendly":
      return "friendly";
    case "neutral":
    default:
      return "neutral";
  }
}
function scenarioBaseTone(scenario) {
  switch (scenario) {
    case "doctor":
    case "government":
      return "formal";
    case "nails":
    case "restaurant":
      return "friendly";
    case "potraviny":
    case "grocery_wholesale":
    case "work":
      return "neutral";
    case "hospitality_stay":
      return "formal";
    case "leona_outbound":
      return "formal";
    case "b2b_receptionist":
    case "general":
    case "live_interpreter":
      return "friendly";
    default:
      return "friendly";
  }
}
function businessWarmthAdjust(bt) {
  if (!bt) return null;
  if (bt === "nails" || bt === "restaurant") return "friendly";
  if (bt === "potraviny" || bt === "grocery_retail" || bt === "grocery_wholesale") return "neutral";
  if (bt === "hospitality_stay") return "formal";
  return null;
}
function buildPersonaKey(mode, scenario, businessType, tone) {
  const vertical = businessType ?? "generic";
  return `${mode}.${vertical}.${scenario}.${tone}`;
}
function defaultsForModeAndTone(mode, tone) {
  const formalLike = tone === "formal" || tone === "urgent";
  const warm = tone === "reassuring" || tone === "friendly";
  let base = {
    speakingRate: formalLike ? 0.98 : warm ? 1.02 : 1,
    pitchStyle: warm ? "warm" : formalLike ? "neutral" : "neutral",
    fillerStyle: formalLike ? "minimal" : warm ? "natural" : "natural",
    hesitationStyle: formalLike ? "light" : warm ? "moderate" : "light"
  };
  switch (mode) {
    case "leona_outbound":
      base = { ...base, speakingRate: 0.97, fillerStyle: "minimal", hesitationStyle: "light" };
      break;
    case "b2b_inbound":
      base = { ...base, fillerStyle: warm ? "natural" : "minimal" };
      break;
    case "live_interpreter":
      base = { ...base, speakingRate: 1, hesitationStyle: "light", fillerStyle: "minimal" };
      break;
    case "call_assist":
      base = { ...base, speakingRate: 0.99, fillerStyle: "natural" };
      break;
    case "chau_loan":
      base = { ...base, speakingRate: 1.01, fillerStyle: "natural" };
      break;
    default:
      break;
  }
  return base;
}
function resolveEffectiveTone(mode, scenario, businessType, tenantPreferred) {
  if (tenantPreferred) return tenantPreferred;
  let tone = scenarioBaseTone(scenario);
  const biz = businessWarmthAdjust(businessType);
  if (biz) {
    if (scenario === "general" || scenario === "b2b_receptionist" || scenario === "live_interpreter") {
      tone = biz;
    }
  }
  if (mode === "leona_outbound" && scenario === "leona_outbound") {
    tone = "formal";
  }
  return tone;
}

// ../src/services/voicePersona/voiceCatalog.ts
function envVoice(key, fallback) {
  const raw = process.env[key]?.trim()?.toLowerCase();
  if (raw === "nova" || raw === "alloy" || raw === "shimmer") return raw;
  return fallback;
}
function getVoiceCatalog() {
  return {
    provider: "openai_tts",
    matrix: {
      "female:friendly:vi": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_VI", "shimmer"),
      "male:friendly:vi": envVoice("EXPO_PUBLIC_VOICE_MALE_FRIENDLY_VI", "alloy"),
      "female:formal:vi": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FORMAL_VI", "nova"),
      "male:formal:vi": envVoice("EXPO_PUBLIC_VOICE_MALE_FORMAL_VI", "alloy"),
      "female:neutral:vi": envVoice("EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_VI", "shimmer"),
      "male:neutral:vi": envVoice("EXPO_PUBLIC_VOICE_MALE_NEUTRAL_VI", "alloy"),
      "female:friendly:en": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_EN", "shimmer"),
      "male:friendly:en": envVoice("EXPO_PUBLIC_VOICE_MALE_FRIENDLY_EN", "alloy"),
      "female:formal:en": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FORMAL_EN", "nova"),
      "male:formal:en": envVoice("EXPO_PUBLIC_VOICE_MALE_FORMAL_EN", "alloy"),
      "female:neutral:en": envVoice("EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_EN", "shimmer"),
      "male:neutral:en": envVoice("EXPO_PUBLIC_VOICE_MALE_NEUTRAL_EN", "alloy"),
      "female:friendly:cs": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_CS", "shimmer"),
      "male:friendly:cs": envVoice("EXPO_PUBLIC_VOICE_MALE_FRIENDLY_CS", "alloy"),
      "female:formal:cs": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FORMAL_CS", "nova"),
      "male:formal:cs": envVoice("EXPO_PUBLIC_VOICE_MALE_FORMAL_CS", "alloy"),
      "female:neutral:cs": envVoice("EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_CS", "shimmer"),
      "male:neutral:cs": envVoice("EXPO_PUBLIC_VOICE_MALE_NEUTRAL_CS", "alloy"),
      "female:friendly:de": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_DE", "shimmer"),
      "male:friendly:de": envVoice("EXPO_PUBLIC_VOICE_MALE_FRIENDLY_DE", "alloy"),
      "female:formal:de": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FORMAL_DE", "nova"),
      "male:formal:de": envVoice("EXPO_PUBLIC_VOICE_MALE_FORMAL_DE", "alloy"),
      "female:neutral:de": envVoice("EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_DE", "shimmer"),
      "male:neutral:de": envVoice("EXPO_PUBLIC_VOICE_MALE_NEUTRAL_DE", "alloy"),
      "female:friendly:other": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_OTHER", "shimmer"),
      "male:friendly:other": envVoice("EXPO_PUBLIC_VOICE_MALE_FRIENDLY_OTHER", "alloy"),
      "female:formal:other": envVoice("EXPO_PUBLIC_VOICE_FEMALE_FORMAL_OTHER", "nova"),
      "male:formal:other": envVoice("EXPO_PUBLIC_VOICE_MALE_FORMAL_OTHER", "alloy"),
      "female:neutral:other": envVoice("EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_OTHER", "shimmer"),
      "male:neutral:other": envVoice("EXPO_PUBLIC_VOICE_MALE_NEUTRAL_OTHER", "alloy")
    },
    fallback: envVoice("EXPO_PUBLIC_VOICE_FALLBACK", "alloy")
  };
}
function languageToBucket(language) {
  const base = language.trim().toLowerCase().split(/[-_]/)[0] ?? "en";
  if (base === "vi") return "vi";
  if (base === "en") return "en";
  if (base === "cs" || base === "sk") return "cs";
  if (base === "de") return "de";
  return "other";
}
function lookupVoiceIdInCatalog(gender, tone, bucket, catalog = getVoiceCatalog()) {
  const key = `${gender}:${tone}:${bucket}`;
  const hit = catalog.matrix[key];
  if (hit) return hit;
  const fallbackKey = `${gender}:${tone}:en`;
  const hitEn = catalog.matrix[fallbackKey];
  if (hitEn) return hitEn;
  return catalog.fallback;
}

// ../src/services/voicePersona/resolveVoiceProfile.ts
function resolveAssistantGender(userGender) {
  if (userGender === "male") return "male";
  if (userGender === "female") return "female";
  return "female";
}

// ../src/services/voice/resolveVoicePersona.ts
function normalizeLanguageTag(raw, tenantDefault) {
  const t = raw.trim();
  if (t) return t;
  return tenantDefault?.trim() || "en";
}
function resolveVoicePersona(input) {
  const lang = normalizeLanguageTag(input.language, input.tenantConfig?.defaultLanguage);
  const tenant = input.tenantConfig;
  const tone = resolveEffectiveTone(
    input.mode,
    input.scenario,
    input.businessType,
    tenant?.preferredTone
  );
  const personaKey = tenant?.personaKeyOverride ?? buildPersonaKey(input.mode, input.scenario, input.businessType, tone);
  const gender = input.assistantVoiceGenderOverride ?? resolveAssistantGender(input.userGender);
  const catalogTone = extendedToneToCatalogTone(tone);
  const bucket = languageToBucket(lang);
  const catalog = getVoiceCatalog();
  const voiceId = tenant?.voiceIdOverride?.trim() || lookupVoiceIdInCatalog(gender, catalogTone, bucket, catalog);
  const d = defaultsForModeAndTone(input.mode, tone);
  return {
    personaKey,
    gender,
    language: lang,
    tone,
    voiceId,
    speakingRate: tenant?.speakingRateOverride ?? d.speakingRate,
    pitchStyle: tenant?.pitchStyleOverride ?? d.pitchStyle,
    fillerStyle: tenant?.fillerStyleOverride ?? d.fillerStyle,
    hesitationStyle: tenant?.hesitationStyleOverride ?? d.hesitationStyle
  };
}

// ../src/services/voice/realismTypes.ts
function b2bPhaseToDialoguePhase(phase) {
  switch (phase) {
    case "greeting":
      return "greeting";
    case "intent_clarify":
      return "clarify";
    case "booking_collect":
    case "order_collect":
    case "booking_slot_fill":
    case "faq":
      return "collect";
    case "booking_confirm":
    case "confirm_handoff":
      return "confirm";
    case "closing":
      return "close";
    default:
      return "collect";
  }
}

// ../src/services/voice/realismLanguagePacks.ts
var packs = {
  vi: {
    id: "vi",
    fillers: ["\xE0", "\u1EEBm", "\u0111\u1EC3 t\xF4i xem", "m\u1ED9t ch\xFAt nh\xE9"],
    hesitation: ["\u1EEBm\u2026", "\xE0\u2026", "\u0111\u1EC3 t\xF4i\u2026"],
    softening: ["xin l\u1ED7i nh\xE9", "b\u1EA1n ch\u1EDD ch\xFAt", "\u0111\u1EC3 m\xECnh ki\u1EC3m tra"],
    formalityNote: "deferential",
    clausePause: "\u2026 "
  },
  de: {
    id: "de",
    fillers: ["\xE4h", "also", "genau", "einen Moment"],
    hesitation: ["\xE4h\u2026", "also\u2026", "moment\u2026"],
    softening: ["einen Moment bitte", "kurz", "sorry"],
    formalityNote: "standard",
    clausePause: " \u2014 "
  },
  cs: {
    id: "cs",
    fillers: ["ehm", "tak", "jo", "chvilku"],
    hesitation: ["ehm\u2026", "tak\u2026", "moment\u2026"],
    softening: ["chvilku pros\xEDm", "jen kr\xE1tce", "pardon"],
    formalityNote: "compact",
    clausePause: " \u2026 "
  },
  en: {
    id: "en",
    fillers: ["uh", "hmm", "well", "let me check"],
    hesitation: ["uh\u2026", "hmm\u2026", "one moment\u2026"],
    softening: ["sorry", "one sec", "just a moment"],
    formalityNote: "standard",
    clausePause: " \u2026 "
  }
};
function languageToPackId(language) {
  const base = language.trim().toLowerCase().split(/[-_]/)[0] ?? "en";
  if (base === "vi") return "vi";
  if (base === "de") return "de";
  if (base === "cs" || base === "sk") return "cs";
  return "en";
}
function getRealismLanguagePack(language) {
  return packs[languageToPackId(language)];
}
function phaseFillerWeight(phase) {
  switch (phase) {
    case "clarify":
    case "fallback":
      return "hesitation";
    case "confirm":
    case "close":
      return "softening";
    default:
      return "fillers";
  }
}

// ../src/services/voice/humanizeSpokenResponse.ts
function stableHash(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(31, h) + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
function pickDeterministic(arr, seed) {
  if (arr.length === 0) throw new Error("empty_pick");
  return arr[seed % arr.length];
}
function pickLive(arr, rng) {
  if (arr.length === 0) throw new Error("empty_pick");
  return arr[Math.floor(rng() * arr.length)];
}
function makeRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = s * 16807 % 2147483647;
    return (s - 1) / 2147483646;
  };
}
function sentencesOf(text) {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}
function maybeShorten(text, phase, realismLevel) {
  if (realismLevel === "off" || realismLevel === "low") return { text, shortened: false };
  if (phase !== "clarify" && phase !== "fallback") return { text, shortened: false };
  const s = sentencesOf(text);
  if (s.length <= 2 || text.length < 200) return { text, shortened: false };
  return { text: s.slice(0, 2).join(" "), shortened: true };
}
function insertMicroPauses(text, language, maxMarkers) {
  const pack = getRealismLanguagePack(language);
  if (maxMarkers <= 0 || text.length < 140) return { text, count: 0 };
  const parts = text.split(", ");
  if (parts.length < 3) return { text, count: 0 };
  const head = parts.slice(0, 2).join(", ");
  const tail = parts.slice(2).join(", ");
  return { text: `${head}${pack.clausePause}${tail}`, count: 1 };
}
function humanizeSpokenResponse(input) {
  const raw = input.rawText.replace(/\s+/g, " ").trim();
  if (!raw) {
    return {
      spokenText: "",
      humanizationMeta: {
        appliedFiller: false,
        appliedDelayMs: 0,
        appliedChunks: 0,
        pauseMarkersInserted: 0
      }
    };
  }
  if (input.realismLevel === "off") {
    return {
      spokenText: raw,
      humanizationMeta: {
        appliedFiller: false,
        appliedDelayMs: 0,
        appliedChunks: sentencesOf(raw).length,
        pauseMarkersInserted: 0
      }
    };
  }
  const seedBase = input.deterministicSeed ?? `${input.dialoguePhase}|${input.tone}|${input.language}|${raw}`;
  const seed = stableHash(seedBase);
  const rng = input.engineMode === "deterministic" ? makeRng(seed) : () => Math.random();
  const pack = getRealismLanguagePack(input.language);
  const slot = phaseFillerWeight(input.dialoguePhase);
  const pool = slot === "hesitation" ? pack.hesitation : slot === "softening" ? pack.softening : pack.fillers;
  let spoken = raw;
  let appliedFiller = false;
  let pauseMarkersInserted = 0;
  const short = maybeShorten(spoken, input.dialoguePhase, input.realismLevel);
  spoken = short.text;
  const maxPause = input.realismLevel === "high" ? 2 : input.realismLevel === "medium" ? 1 : 0;
  const paused = insertMicroPauses(spoken, input.language, maxPause);
  spoken = paused.text;
  pauseMarkersInserted = paused.count;
  const shouldLeadFiller = input.realismLevel !== "low" && input.dialoguePhase !== "confirm" && input.tone !== "formal" && input.tone !== "urgent";
  if (shouldLeadFiller && pool.length > 0) {
    const filler = input.engineMode === "deterministic" ? pickDeterministic(pool, seed) : pickLive(pool, rng);
    if (!spoken.toLowerCase().startsWith(filler.toLowerCase().slice(0, 3))) {
      spoken = `${filler} ${spoken}`.replace(/\s+/g, " ").trim();
      appliedFiller = true;
    }
  }
  let delayMs = 0;
  if (input.dialoguePhase === "clarify" || input.dialoguePhase === "fallback") {
    delayMs = input.engineMode === "deterministic" ? 120 + seed % 80 : 120 + Math.floor(rng() * 120);
  } else if (input.dialoguePhase === "greeting") {
    delayMs = input.engineMode === "deterministic" ? 40 + seed % 40 : 40 + Math.floor(rng() * 60);
  }
  const chunks = sentencesOf(spoken).length || 1;
  return {
    spokenText: spoken,
    humanizationMeta: {
      appliedFiller,
      appliedDelayMs: delayMs,
      appliedChunks: chunks,
      pauseMarkersInserted
    }
  };
}

// ../src/services/voice/realismEnv.ts
function getVoiceRealismEngineConfig() {
  const m = (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_VOICE_REALISM_MODE ? process.env.EXPO_PUBLIC_VOICE_REALISM_MODE : "live").toLowerCase();
  const mode = m === "deterministic" ? "deterministic" : "live";
  const raw = (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_VOICE_REALISM_LEVEL ? process.env.EXPO_PUBLIC_VOICE_REALISM_LEVEL : "medium").toLowerCase();
  const level = raw === "off" || raw === "low" || raw === "medium" || raw === "high" ? raw : "medium";
  return { mode, level };
}

// src/b2b/voice/callSessionAdmin.ts
var import_firestore5 = require("firebase-admin/firestore");
var import_v26 = require("firebase-functions/v2");

// ../src/services/b2b/ai/bookingSlotSessionApply.ts
var defaultConf = () => ({
  awaitingConfirm: false,
  confirmed: false
});
function isBookingLikeIntent(i) {
  return i === "booking" || i === "stay_booking";
}
function transitionBookingSlotState(input) {
  const intent = input.detectedIntent ?? input.intent;
  if (!isBookingLikeIntent(intent)) return null;
  const slots = { ...input.bookingSlotState ?? {} };
  const bt = input.businessType;
  let conf = input.bookingConfirmation ? { ...input.bookingConfirmation } : defaultConf();
  if (conf.awaitingConfirm && !conf.confirmed) {
    const ans = parseConfirmationUtterance(input.latestUserInput);
    if (ans === "yes") {
      return {
        bookingSlotState: slots,
        bookingConfirmation: { awaitingConfirm: false, confirmed: true },
        voicePhase: "booking_confirm"
      };
    }
    if (ans === "no") {
      return {
        bookingSlotState: slots,
        bookingConfirmation: { awaitingConfirm: false, confirmed: false },
        voicePhase: "booking_slot_fill"
      };
    }
    return {
      bookingSlotState: slots,
      bookingConfirmation: conf,
      voicePhase: "booking_confirm"
    };
  }
  if (conf.confirmed) {
    return {
      bookingSlotState: slots,
      bookingConfirmation: conf,
      voicePhase: "closing"
    };
  }
  const extracted = extractSlotsFromUtterance(input.latestUserInput);
  const mergedSlots = mergeSlotState(slots, extracted);
  if (!allBookingSlotsFilled(bt, mergedSlots)) {
    return {
      bookingSlotState: mergedSlots,
      bookingConfirmation: { ...conf, awaitingConfirm: false, confirmed: false },
      voicePhase: "booking_slot_fill"
    };
  }
  return {
    bookingSlotState: mergedSlots,
    bookingConfirmation: { awaitingConfirm: true, confirmed: false },
    voicePhase: "booking_confirm"
  };
}

// src/b2b/voice/callSessionAdmin.ts
var TRANSCRIPT_SEP = "\n";
function stableSessionDocId(provider, externalCallId) {
  const raw = `${provider}:${externalCallId}`.toLowerCase();
  return raw.replace(/[^a-z0-9:_-]/g, "_").slice(0, 120);
}
function sessionCol(db2, tenantId) {
  return db2.collection(callSessionsCollectionPath(tenantId));
}
function docToSession(id, d) {
  return {
    id,
    tenantId: String(d.tenantId ?? ""),
    locationId: String(d.locationId ?? ""),
    externalCallId: String(d.externalCallId ?? ""),
    inboundNumberE164: String(d.inboundNumberE164 ?? ""),
    phoneNumber: d.phoneNumber ? String(d.phoneNumber) : void 0,
    status: d.status,
    idempotencyKey: String(d.idempotencyKey ?? ""),
    intent: d.intent,
    detectedIntent: d.detectedIntent,
    transcriptUri: d.transcriptUri ? String(d.transcriptUri) : void 0,
    transcript: d.transcript ? String(d.transcript) : void 0,
    extractedPayload: d.extractedPayload,
    bookingId: d.bookingId ? String(d.bookingId) : void 0,
    orderId: d.orderId ? String(d.orderId) : void 0,
    billingEventId: d.billingEventId ? String(d.billingEventId) : void 0,
    orderBillingEventId: d.orderBillingEventId ? String(d.orderBillingEventId) : void 0,
    errorCode: d.errorCode ? String(d.errorCode) : void 0,
    outcome: d.outcome,
    failureReason: d.failureReason ? String(d.failureReason) : void 0,
    failureCode: d.failureCode,
    voiceDialogueState: d.voiceDialogueState ?? void 0,
    bookingSlotState: d.bookingSlotState,
    bookingConfirmation: d.bookingConfirmation,
    staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : void 0,
    startedAt: d.startedAt,
    endedAt: d.endedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}
async function getCallSessionById(db2, tenantId, sessionId) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return docToSession(snap.id, snap.data());
}
async function findSessionByExternalCallId(db2, tenantId, externalCallId) {
  const q = sessionCol(db2, tenantId).where("externalCallId", "==", externalCallId).limit(1);
  const snap = await q.get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, data: docToSession(doc.id, doc.data()) };
}
async function ensureCallSession(db2, input) {
  const provider = input.provider ?? "twilio";
  const ref = sessionCol(db2, input.tenantId).doc(stableSessionDocId(provider, input.externalCallId));
  const idem = callSessionIdempotencyKey(provider, input.externalCallId);
  const now = import_firestore5.FieldValue.serverTimestamp();
  const status = input.initialStatus ?? "ringing";
  return db2.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      import_v26.logger.info("[callSession] idempotent_existing", {
        tenantId: input.tenantId,
        sessionDocId: ref.id,
        externalCallId: input.externalCallId,
        provider
      });
      return { sessionId: ref.id, created: false };
    }
    import_v26.logger.info("[callSession] created", {
      tenantId: input.tenantId,
      sessionDocId: ref.id,
      externalCallId: input.externalCallId,
      provider
    });
    tx.set(ref, {
      tenantId: input.tenantId,
      locationId: input.locationId,
      externalCallId: input.externalCallId,
      inboundNumberE164: input.inboundNumberE164,
      phoneNumber: input.callerPhoneE164 ?? null,
      status,
      idempotencyKey: idem,
      voiceDialogueState: { phase: "greeting", turnCount: 0 },
      startedAt: now,
      createdAt: now,
      updatedAt: now
    });
    return { sessionId: ref.id, created: true };
  });
}
async function appendTranscriptChunk(db2, tenantId, sessionId, chunk) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  await db2.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = snap.get("transcript") ?? "";
    const next = cur ? `${cur}${TRANSCRIPT_SEP}${chunk}` : chunk;
    tx.update(ref, { transcript: next, updatedAt: import_firestore5.FieldValue.serverTimestamp() });
  });
}
async function persistVoiceAssistantTurn(db2, tenantId, sessionId, voice) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  await db2.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = snap.get("transcript") ?? "";
    const line = `Assistant: ${voice.spokenText}`;
    const next = cur ? `${cur}${TRANSCRIPT_SEP}${line}` : line;
    tx.update(ref, {
      transcript: next,
      voiceDialogueState: voice.voiceDialogueState,
      updatedAt: import_firestore5.FieldValue.serverTimestamp()
    });
  });
}
async function applyBookingSlotTransitionFromUtterance(db2, tenantId, sessionId, latestUserInput) {
  const session = await getCallSessionById(db2, tenantId, sessionId);
  if (!session) return;
  const tenant = await loadTenant(db2, tenantId);
  const businessType = tenant?.businessType ?? "restaurant";
  const tr = transitionBookingSlotState({
    intent: session.intent,
    detectedIntent: session.detectedIntent,
    latestUserInput,
    bookingSlotState: session.bookingSlotState,
    bookingConfirmation: session.bookingConfirmation,
    businessType
  });
  if (!tr) return;
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  const prev = session.voiceDialogueState ?? { turnCount: 0, phase: "greeting" };
  await ref.update({
    bookingSlotState: tr.bookingSlotState,
    bookingConfirmation: tr.bookingConfirmation,
    voiceDialogueState: {
      ...prev,
      phase: tr.voicePhase
    },
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  });
}
async function updateCallSessionIntent(db2, tenantId, sessionId, detectedIntent, extractedPayload) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  const snap = await ref.get();
  const patch = {
    intent: detectedIntent,
    detectedIntent,
    status: "collecting",
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  };
  if (extractedPayload != null) patch.extractedPayload = extractedPayload;
  if (detectedIntent === "booking" || detectedIntent === "stay_booking") {
    if (!snap.get("bookingSlotState")) patch.bookingSlotState = {};
    if (!snap.get("bookingConfirmation")) {
      patch.bookingConfirmation = { awaitingConfirm: false, confirmed: false };
    }
  }
  await ref.update(patch);
}
async function markCallSessionBookingSuccess(db2, tenantId, sessionId, bookingId, billingEventId, options) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  const patch = {
    bookingId,
    outcome: "success",
    status: "completed",
    billingEventId: billingEventId ?? null,
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  };
  if (options?.staffHandoffSummary) {
    patch.staffHandoffSummary = options.staffHandoffSummary;
  }
  await ref.update(patch);
}
async function markCallSessionOrderSuccess(db2, tenantId, sessionId, orderId, orderBillingEventId, options) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  const patch = {
    orderId,
    outcome: "success",
    status: "completed",
    orderBillingEventId: orderBillingEventId ?? null,
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  };
  if (options?.staffHandoffSummary) {
    patch.staffHandoffSummary = options.staffHandoffSummary;
  }
  await ref.update(patch);
}
async function markCallSessionBookingFailure(db2, tenantId, sessionId, failureCode, failureReason) {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  await ref.update({
    outcome: "fail",
    failureCode,
    failureReason,
    status: "error",
    errorCode: failureCode,
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  });
}
async function finalizeCallSession(db2, tenantId, sessionId, status = "completed") {
  const ref = sessionCol(db2, tenantId).doc(sessionId);
  await ref.update({
    status,
    endedAt: import_firestore5.FieldValue.serverTimestamp(),
    updatedAt: import_firestore5.FieldValue.serverTimestamp()
  });
}
async function loadTenant(db2, tenantId) {
  const snap = await db2.doc(tenantDocPath(tenantId)).get();
  if (!snap.exists) return null;
  return snap.data();
}

// src/b2b/voice/processVoiceOrchestrationRequest.ts
async function requireTrustedTenantFromInboundDid(db2, repos, body) {
  const to = body.to?.trim();
  if (!to) return badRequest("missing_to", "invalid_input");
  const route = await resolveTenantByPhone(db2, repos, { inboundNumberE164: to });
  if (!route) return badRequest("tenant_not_found", "tenant_not_found");
  if (body.tenantId && body.tenantId !== route.tenantId) {
    import_v27.logger.warn("[b2bVoice] tenant_claim_mismatch", {
      claimedTenantId: body.tenantId,
      resolvedTenantId: route.tenantId,
      externalCallId: body.externalCallId,
      inboundDid: to
    });
    return badRequest("tenant_mismatch", "invalid_input");
  }
  return { tenantId: route.tenantId };
}
function adminPhoneRouteRepo(db2) {
  return {
    async getByInboundE164(_db, e164) {
      const snap = await db2.doc(phoneRouteDocPath(e164)).get();
      if (!snap.exists) return null;
      const d = snap.data();
      if (!d?.tenantId || !d?.locationId) return null;
      return {
        tenantId: String(d.tenantId),
        locationId: String(d.locationId),
        inboundNumberE164: String(d.inboundNumberE164 ?? e164)
      };
    }
  };
}
var noopRepos = {};
function businessTypeToVoiceScenario(bt) {
  switch (bt) {
    case "nails":
      return "nails";
    case "restaurant":
      return "restaurant";
    case "potraviny":
    case "grocery_retail":
      return "potraviny";
    case "grocery_wholesale":
      return "grocery_wholesale";
    case "hospitality_stay":
      return "hospitality_stay";
    default:
      return "b2b_receptionist";
  }
}
function badRequest(msg, failureCode) {
  if (failureCode) return { ok: false, error: msg, failureCode };
  return { ok: false, error: msg };
}
async function runVoiceTurn(db2, sid, latestUserInput, skipVoice) {
  if (skipVoice) return {};
  const tenant = await loadTenant(db2, sid.tenantId);
  if (!tenant) return {};
  const session = await getCallSessionById(db2, sid.tenantId, sid.sessionId);
  if (!session) return {};
  const vp = resolveVoicePersona({
    mode: "b2b_inbound",
    scenario: businessTypeToVoiceScenario(tenant.businessType),
    language: tenant.ai?.defaultLanguage ?? "vi",
    userGender: "unknown",
    businessType: tenant.businessType,
    tenantConfig: { defaultLanguage: tenant.ai?.defaultLanguage }
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
      bookingConfirmation: session.bookingConfirmation
    },
    latestUserInput,
    tenantDisplayName: tenant.name,
    businessType: tenant.businessType,
    defaultLanguage: tenant.ai?.defaultLanguage,
    ttsVoiceId: vp.voiceId
  });
  const { mode, level } = getVoiceRealismEngineConfig();
  const phase = session.voiceDialogueState?.phase ?? "greeting";
  const humanized = humanizeSpokenResponse({
    rawText: voice.spokenText,
    language: tenant.ai?.defaultLanguage ?? "vi",
    tone: vp.tone,
    dialoguePhase: b2bPhaseToDialoguePhase(phase),
    realismLevel: level,
    engineMode: mode
  });
  const voiceForPersist = { ...voice, spokenText: humanized.spokenText };
  await persistVoiceAssistantTurn(db2, sid.tenantId, sid.sessionId, voiceForPersist);
  return {
    voiceResponse: {
      spokenText: humanized.spokenText,
      voiceDialogueState: voice.voiceDialogueState,
      tts: voice.tts,
      audioEncoding: voice.audioEncoding,
      audioBase64: voice.audioBase64
    }
  };
}
async function processVoiceOrchestrationRequest(db2, body) {
  const action = body?.action;
  if (action !== "ensure_session" && action !== "append_transcript" && action !== "set_intent" && action !== "commit_booking" && action !== "commit_order" && action !== "finalize_session") {
    return badRequest("invalid_action", "invalid_input");
  }
  if (!body.externalCallId || typeof body.externalCallId !== "string") {
    return badRequest("missing_externalCallId", "invalid_input");
  }
  const repos = { phoneRoute: adminPhoneRouteRepo(db2) };
  const resolveSid = async (tenantId) => {
    const sessionIdFromBody = body.sessionId;
    if (sessionIdFromBody) {
      const sref = db2.doc(`${callSessionsCollectionPath(tenantId)}/${sessionIdFromBody}`);
      const snap = await sref.get();
      if (!snap.exists) return null;
      if (String(snap.get("externalCallId") ?? "") !== body.externalCallId) return null;
      return { tenantId, sessionId: sessionIdFromBody };
    }
    const hit = await findSessionByExternalCallId(db2, tenantId, body.externalCallId);
    if (!hit) return null;
    return { tenantId, sessionId: hit.id };
  };
  switch (body.action) {
    case "ensure_session": {
      const to = body.to?.trim();
      if (!to) return badRequest("missing_to", "invalid_input");
      const route = await resolveTenantByPhone(db2, repos, { inboundNumberE164: to });
      if (!route) return badRequest("tenant_not_found", "tenant_not_found");
      if (body.tenantId && body.tenantId !== route.tenantId) {
        import_v27.logger.warn("[b2bVoice] tenant_claim_mismatch", {
          claimedTenantId: body.tenantId,
          resolvedTenantId: route.tenantId,
          externalCallId: body.externalCallId,
          inboundDid: to
        });
        return badRequest("tenant_mismatch", "invalid_input");
      }
      const { sessionId } = await ensureCallSession(db2, {
        tenantId: route.tenantId,
        locationId: route.locationId,
        externalCallId: body.externalCallId,
        provider: body.provider,
        inboundNumberE164: to,
        callerPhoneE164: body.from?.trim(),
        initialStatus: "greeting"
      });
      return {
        ok: true,
        sessionId,
        action: body.action,
        tenantId: route.tenantId
      };
    }
    case "append_transcript": {
      const trusted = await requireTrustedTenantFromInboundDid(db2, repos, body);
      if (!("tenantId" in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== "string" || !tenantId) return badRequest("tenant_context_invalid", "invalid_input");
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest("session_not_found", "invalid_input");
      import_v27.logger.info("[b2bVoice] append_transcript", { tenantId: sid.tenantId, sessionId: sid.sessionId, externalCallId: body.externalCallId });
      const chunk = body.transcriptChunk?.trim();
      if (!chunk) return badRequest("missing_transcriptChunk", "invalid_input");
      const line = chunk.startsWith("Caller:") || chunk.startsWith("Assistant:") ? chunk : `Caller: ${chunk}`;
      await appendTranscriptChunk(db2, sid.tenantId, sid.sessionId, line);
      await applyBookingSlotTransitionFromUtterance(db2, sid.tenantId, sid.sessionId, chunk);
      const voicePart = await runVoiceTurn(db2, sid, chunk, body.skipVoiceResponse);
      return { ok: true, sessionId: sid.sessionId, action: body.action, ...voicePart };
    }
    case "set_intent": {
      const trusted = await requireTrustedTenantFromInboundDid(db2, repos, body);
      if (!("tenantId" in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== "string" || !tenantId) return badRequest("tenant_context_invalid", "invalid_input");
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest("session_not_found", "invalid_input");
      import_v27.logger.info("[b2bVoice] set_intent", { tenantId: sid.tenantId, sessionId: sid.sessionId, externalCallId: body.externalCallId });
      const intent = body.detectedIntent;
      if (!intent) return badRequest("missing_detectedIntent", "invalid_input");
      await updateCallSessionIntent(db2, sid.tenantId, sid.sessionId, intent, body.extractedPayload);
      const latest = body.latestUserInput?.trim() ?? "";
      const voicePart = await runVoiceTurn(db2, sid, latest, body.skipVoiceResponse);
      return { ok: true, sessionId: sid.sessionId, action: body.action, ...voicePart };
    }
    case "commit_booking": {
      const trusted = await requireTrustedTenantFromInboundDid(db2, repos, body);
      if (!("tenantId" in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== "string" || !tenantId) return badRequest("tenant_context_invalid", "invalid_input");
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest("session_not_found", "invalid_input");
      import_v27.logger.info("[b2bVoice] commit_booking_attempt", {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        externalCallId: body.externalCallId
      });
      if (body.confirmed !== true) {
        return badRequest("commit_requires_confirmed_true", "invalid_input");
      }
      const slotDigest = body.slotDigest?.trim();
      if (!slotDigest) return badRequest("missing_slotDigest", "invalid_input");
      if (body.startsAtMs == null || body.endsAtMs == null) {
        return badRequest("missing_startsAtMs_or_endsAtMs", "invalid_input");
      }
      const tenant = await loadTenant(db2, sid.tenantId);
      if (!tenant) return badRequest("tenant_not_found", "tenant_not_found");
      const sessionRef = db2.doc(`${callSessionsCollectionPath(sid.tenantId)}/${sid.sessionId}`);
      const sessionSnap = await sessionRef.get();
      if (!sessionSnap.exists) return badRequest("session_not_found", "invalid_input");
      const bookingConf = sessionSnap.get("bookingConfirmation");
      if (!bookingConf?.confirmed) {
        return badRequest("booking_not_confirmed", "invalid_input");
      }
      if (String(sessionSnap.get("outcome") ?? "") === "success" && sessionSnap.get("bookingId")) {
        return {
          ok: true,
          sessionId: sid.sessionId,
          action: body.action,
          bookingId: String(sessionSnap.get("bookingId")),
          billingEventId: sessionSnap.get("billingEventId") ? String(sessionSnap.get("billingEventId")) : void 0,
          outcome: "success"
        };
      }
      const locationId = body.locationId ?? String(sessionSnap.get("locationId") ?? "");
      if (!locationId) return badRequest("missing_locationId", "invalid_input");
      const slotState = sessionSnap.get("bookingSlotState");
      const sessionIntent = String(sessionSnap.get("detectedIntent") ?? sessionSnap.get("intent") ?? "");
      const stayIntent = sessionIntent === "stay_booking";
      const stayInquiryFlow = tenant.businessType === "hospitality_stay" || stayIntent;
      const occ = parseOccupancyGuestCounts(slotState?.occupancy);
      const stayIn = normalizeStayDateInput(slotState?.stayCheckIn);
      const stayOut = normalizeStayDateInput(slotState?.stayCheckOut);
      const roomOrService = typeof body.extractedPayload?.roomUnitLabel === "string" ? String(body.extractedPayload.roomUnitLabel) : slotState?.service?.trim();
      let notes = typeof body.extractedPayload?.notes === "string" ? String(body.extractedPayload.notes) : void 0;
      if (stayInquiryFlow) {
        notes = buildHospitalityStayInquiryNotes(notes);
      }
      const cmd = {
        tenantId: sid.tenantId,
        locationId,
        businessType: tenant.businessType,
        serviceIds: body.serviceIds ?? [],
        resourceIds: body.resourceIds ?? [],
        resourceCandidateIds: body.resourceCandidateIds,
        startsAtMs: Number(body.startsAtMs),
        endsAtMs: Number(body.endsAtMs),
        customerPhoneE164: body.from ?? (sessionSnap.get("phoneNumber") ? String(sessionSnap.get("phoneNumber")) : void 0),
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
        ...stayInquiryFlow ? {
          billable: false,
          isInquiryOnly: true,
          treatAsStayInquiry: tenant.businessType !== "hospitality_stay" && stayIntent
        } : {}
      };
      const result = await commitBooking(db2, noopRepos, cmd);
      if (!result.ok) {
        const mapped = mapBookingCodeToCallFailure(result.code, result.message);
        await markCallSessionBookingFailure(
          db2,
          sid.tenantId,
          sid.sessionId,
          mapped.failureCode,
          mapped.failureReason
        );
        return {
          ok: false,
          error: mapped.failureReason,
          failureCode: mapped.failureCode,
          sessionId: sid.sessionId
        };
      }
      await markCallSessionBookingSuccess(db2, sid.tenantId, sid.sessionId, result.booking.id, result.billingEventId, {
        staffHandoffSummary: result.booking.staffHandoffSummary
      });
      import_v27.logger.info("[b2bVoice] commit_booking_success", {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        bookingId: result.booking.id,
        billingEventId: result.billingEventId,
        externalCallId: body.externalCallId
      });
      return {
        ok: true,
        sessionId: sid.sessionId,
        action: body.action,
        bookingId: result.booking.id,
        billingEventId: result.billingEventId,
        outcome: "success"
      };
    }
    case "commit_order": {
      const trusted = await requireTrustedTenantFromInboundDid(db2, repos, body);
      if (!("tenantId" in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== "string" || !tenantId) return badRequest("tenant_context_invalid", "invalid_input");
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest("session_not_found", "invalid_input");
      import_v27.logger.info("[b2bVoice] commit_order_attempt", {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        externalCallId: body.externalCallId
      });
      if (body.confirmed !== true) {
        return badRequest("commit_order_requires_confirmed_true", "invalid_input");
      }
      const orderDigest = body.orderDigest?.trim();
      if (!orderDigest) return badRequest("missing_orderDigest", "invalid_input");
      if (body.windowStartMs == null || body.windowEndMs == null) {
        return badRequest("missing_window_bounds", "invalid_input");
      }
      const lines = parseVoiceOrderCommitLines(body.lines);
      if (!lines) return badRequest("invalid_order_lines", "invalid_input");
      const tenant = await loadTenant(db2, sid.tenantId);
      if (!tenant) return badRequest("tenant_not_found", "tenant_not_found");
      const sessionRef = db2.doc(`${callSessionsCollectionPath(sid.tenantId)}/${sid.sessionId}`);
      const sessionSnap = await sessionRef.get();
      if (!sessionSnap.exists) return badRequest("session_not_found", "invalid_input");
      if (String(sessionSnap.get("outcome") ?? "") === "success" && sessionSnap.get("orderId")) {
        return {
          ok: true,
          sessionId: sid.sessionId,
          action: body.action,
          orderId: String(sessionSnap.get("orderId")),
          orderBillingEventId: sessionSnap.get("orderBillingEventId") ? String(sessionSnap.get("orderBillingEventId")) : void 0,
          outcome: "success"
        };
      }
      const locationId = body.locationId ?? String(sessionSnap.get("locationId") ?? "");
      if (!locationId) return badRequest("missing_locationId", "invalid_input");
      const fulfillment = body.fulfillment === "delivery" ? "delivery" : "pickup";
      const lineClarifications = parseVoiceOrderLineClarifications(body.lineClarifications);
      const palletOrVolumeHint = typeof body.palletOrVolumeHint === "string" ? body.palletOrVolumeHint.trim() : void 0;
      const ocmd = {
        tenantId: sid.tenantId,
        locationId,
        businessType: tenant.businessType,
        lines,
        fulfillment,
        windowStartMs: Number(body.windowStartMs),
        windowEndMs: Number(body.windowEndMs),
        customerPhoneE164: body.from ?? (sessionSnap.get("phoneNumber") ? String(sessionSnap.get("phoneNumber")) : void 0),
        customerName: typeof body.customerName === "string" ? body.customerName : sessionSnap.get("bookingSlotState")?.name,
        deliveryAddress: typeof body.extractedPayload?.deliveryAddress === "string" ? String(body.extractedPayload.deliveryAddress) : void 0,
        idempotencyKey: orderIdempotencyKey(sid.sessionId, orderDigest),
        sourceCallSessionId: sid.sessionId,
        lineClarifications,
        palletOrVolumeHint,
        /** Voice intake: never debit until wholesale staff confirmation path or explicit billable create. */
        billable: false
      };
      const oresult = await commitOrder(db2, noopRepos, ocmd);
      if (!oresult.ok) {
        const mapped = mapOrderCodeToCallFailure(oresult.code, oresult.message);
        await markCallSessionBookingFailure(
          db2,
          sid.tenantId,
          sid.sessionId,
          mapped.failureCode,
          mapped.failureReason
        );
        return {
          ok: false,
          error: mapped.failureReason,
          failureCode: mapped.failureCode,
          sessionId: sid.sessionId
        };
      }
      await markCallSessionOrderSuccess(
        db2,
        sid.tenantId,
        sid.sessionId,
        oresult.order.id,
        oresult.billingEventId,
        { staffHandoffSummary: oresult.order.staffHandoffSummary }
      );
      import_v27.logger.info("[b2bVoice] commit_order_success", {
        tenantId: sid.tenantId,
        sessionId: sid.sessionId,
        orderId: oresult.order.id,
        orderBillingEventId: oresult.billingEventId,
        externalCallId: body.externalCallId
      });
      return {
        ok: true,
        sessionId: sid.sessionId,
        action: body.action,
        orderId: oresult.order.id,
        orderBillingEventId: oresult.billingEventId,
        outcome: "success"
      };
    }
    case "finalize_session": {
      const trusted = await requireTrustedTenantFromInboundDid(db2, repos, body);
      if (!("tenantId" in trusted)) return trusted;
      const tenantId = trusted.tenantId;
      if (typeof tenantId !== "string" || !tenantId) return badRequest("tenant_context_invalid", "invalid_input");
      const sid = await resolveSid(tenantId);
      if (!sid) return badRequest("session_not_found", "invalid_input");
      import_v27.logger.info("[b2bVoice] finalize_session", { tenantId: sid.tenantId, sessionId: sid.sessionId, externalCallId: body.externalCallId });
      await finalizeCallSession(db2, sid.tenantId, sid.sessionId);
      return { ok: true, sessionId: sid.sessionId, action: body.action };
    }
    default:
      return badRequest("unknown_action", "invalid_input");
  }
}

// src/aiProxyRateLimit.ts
var buckets = /* @__PURE__ */ new Map();
var PRUNE_EVERY = 500;
var pruneCounter = 0;
function takeAiProxyRateSlot(uid, maxPerWindow, windowMs) {
  if (maxPerWindow <= 0) return true;
  const now = Date.now();
  const cur = buckets.get(uid);
  if (!cur || now - cur.windowStart >= windowMs) {
    buckets.set(uid, { windowStart: now, count: 1 });
    pruneCounter += 1;
    if (pruneCounter >= PRUNE_EVERY) {
      pruneCounter = 0;
      for (const [k, v] of buckets) {
        if (now - v.windowStart > windowMs * 3) buckets.delete(k);
      }
    }
    return true;
  }
  if (cur.count >= maxPerWindow) return false;
  cur.count += 1;
  return true;
}

// src/aiProxyValidation.ts
var AI_PROXY_MAX_BODY_BYTES = 6 * 1024 * 1024;
var CHAT_MAX_MESSAGES = 48;
var CHAT_MAX_TOTAL_TEXT_CHARS = 2e5;
var CHAT_MAX_SINGLE_STRING = 1e5;
var CHAT_MAX_IMAGE_DATA_URL_CHARS = 45e5;
var CHAT_MAX_IMAGE_PARTS = 8;
var STT_MAX_BASE64_CHARS = 12e6;
var TTS_MAX_CHARS = 4096;
var ALLOWED_TTS_VOICES = /* @__PURE__ */ new Set(["nova", "alloy", "shimmer"]);
var ALLOWED_STT_MIME = /* @__PURE__ */ new Set([
  "audio/mp4",
  "audio/m4a",
  "audio/mpeg",
  "audio/webm",
  "audio/wav",
  "audio/x-m4a",
  "video/mp4"
]);
function validateImageParts(content) {
  if (typeof content === "string" || !Array.isArray(content)) return { ok: true };
  let images = 0;
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const p = part;
    if (p.type !== "image_url") continue;
    images += 1;
    if (images > CHAT_MAX_IMAGE_PARTS) return { ok: false, error: "chat_too_many_images" };
    const url = p.image_url?.url;
    if (typeof url !== "string" || url.length === 0) return { ok: false, error: "chat_invalid_image_url" };
    if (url.length > CHAT_MAX_IMAGE_DATA_URL_CHARS) return { ok: false, error: "chat_image_payload_too_large" };
    const lower = url.slice(0, 32).toLowerCase();
    if (!lower.startsWith("data:image/") && !lower.startsWith("https://") && !lower.startsWith("http://")) {
      return { ok: false, error: "chat_image_url_not_allowed" };
    }
  }
  return { ok: true };
}
function parseAndValidateChatPayload(body) {
  const raw = body.messages;
  if (!Array.isArray(raw)) return { ok: false, error: "chat_messages_required" };
  if (raw.length === 0 || raw.length > CHAT_MAX_MESSAGES) return { ok: false, error: "chat_messages_count_invalid" };
  const messages = [];
  let totalText = 0;
  for (const m of raw) {
    if (!m || typeof m !== "object") return { ok: false, error: "chat_message_invalid" };
    const role = m.role;
    if (role !== "system" && role !== "user" && role !== "assistant") {
      return { ok: false, error: "chat_role_invalid" };
    }
    const content = m.content;
    if (content === void 0) return { ok: false, error: "chat_content_missing" };
    if (typeof content === "string") {
      if (content.length > CHAT_MAX_SINGLE_STRING) return { ok: false, error: "chat_content_too_long" };
      totalText += content.length;
    } else if (Array.isArray(content)) {
      const img = validateImageParts(content);
      if (!img.ok) return img;
      for (const part of content) {
        if (!part || typeof part !== "object") return { ok: false, error: "chat_part_invalid" };
        const p = part;
        if (p.type === "text") {
          if (typeof p.text !== "string") return { ok: false, error: "chat_text_part_invalid" };
          totalText += p.text.length;
        } else if (p.type === "image_url") {
        } else {
          return { ok: false, error: "chat_part_type_not_allowed" };
        }
      }
    } else {
      return { ok: false, error: "chat_content_type_invalid" };
    }
    messages.push({ role, content });
  }
  if (totalText > CHAT_MAX_TOTAL_TEXT_CHARS) return { ok: false, error: "chat_total_text_too_large" };
  let temperature = typeof body.temperature === "number" ? body.temperature : 0.6;
  if (!Number.isFinite(temperature)) temperature = 0.6;
  temperature = Math.min(2, Math.max(0, temperature));
  let maxTokens = typeof body.maxTokens === "number" ? body.maxTokens : 240;
  if (!Number.isFinite(maxTokens)) maxTokens = 240;
  maxTokens = Math.min(8192, Math.max(1, Math.floor(maxTokens)));
  return { ok: true, messages, temperature, maxTokens };
}
function validateSttPayload(body) {
  const base64Audio = typeof body.base64Audio === "string" ? body.base64Audio : "";
  if (!base64Audio) return { ok: false, error: "stt_audio_missing" };
  if (base64Audio.length > STT_MAX_BASE64_CHARS) return { ok: false, error: "stt_audio_too_large" };
  const mimeRaw = typeof body.mime === "string" && body.mime.trim() ? body.mime.trim() : "audio/mp4";
  const mime = mimeRaw.split(";")[0].trim().toLowerCase();
  if (!ALLOWED_STT_MIME.has(mime)) return { ok: false, error: "stt_mime_not_allowed" };
  return { ok: true, base64Audio, mime: mimeRaw };
}
function validateTtsPayload(body) {
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) return { ok: false, error: "tts_text_missing" };
  if (text.length > TTS_MAX_CHARS) return { ok: false, error: "tts_text_too_long" };
  const v = String(body.voice ?? "nova");
  if (!ALLOWED_TTS_VOICES.has(v)) return { ok: false, error: "tts_voice_invalid" };
  return { ok: true, text, voice: v };
}
function requestBodyByteLength(req) {
  const raw = req.rawBody;
  if (Buffer.isBuffer(raw)) return raw.length;
  if (typeof raw === "string") return Buffer.byteLength(raw, "utf8");
  return 0;
}

// src/payments/paymentReceiptModel.ts
var PAYMENT_RECEIPTS_COLLECTION = "platform_payment_receipts";
function paymentReceiptDocPath(paymentEventId) {
  const safe = paymentEventId.trim().replace(/\//g, "_");
  return `${PAYMENT_RECEIPTS_COLLECTION}/${safe}`;
}

// src/security.ts
var import_node_crypto = require("node:crypto");
var REPLAY_WINDOW_MS = 5 * 60 * 1e3;
function sig(secret, ts, body) {
  return (0, import_node_crypto.createHmac)("sha256", secret).update(`${ts}.${body}`).digest("hex");
}
function verifySignedRequest(req, secret) {
  const ts = String(req.header("x-ketnoi-ts") ?? "");
  const incoming = String(req.header("x-ketnoi-signature") ?? "");
  if (!ts || !incoming) return { ok: false, reason: "missing_signature_headers" };
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, reason: "invalid_timestamp" };
  if (Math.abs(Date.now() - tsNum) > REPLAY_WINDOW_MS) return { ok: false, reason: "replay_window_exceeded" };
  const bodyRaw = typeof req.rawBody === "string" ? req.rawBody : Buffer.from(req.rawBody ?? "").toString("utf8");
  const expected = sig(secret, ts, bodyRaw);
  const a = Buffer.from(expected);
  const b = Buffer.from(incoming);
  if (a.length !== b.length) return { ok: false, reason: "signature_mismatch" };
  if (!(0, import_node_crypto.timingSafeEqual)(a, b)) return { ok: false, reason: "signature_mismatch" };
  return { ok: true };
}

// src/openaiProxy.ts
var OPENAI_BASE = "https://api.openai.com/v1";
var OPENAI_KEY = process.env.OPENAI_API_KEY?.trim() ?? "";
function authHeaders() {
  if (!OPENAI_KEY) throw new Error("openai_key_missing");
  return { Authorization: `Bearer ${OPENAI_KEY}` };
}
async function proxyChat(messages, temperature = 0.6, maxTokens = 240) {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature, max_tokens: maxTokens, messages })
  });
  if (!res.ok) throw new Error(`openai_chat_${res.status}`);
  return await res.json();
}
async function proxyStt(base64Audio, mime = "audio/mp4") {
  const binary = Buffer.from(base64Audio, "base64");
  const form = new FormData();
  form.append("model", "whisper-1");
  form.append("file", new File([binary], "recording.m4a", { type: mime }));
  const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: form
  });
  if (!res.ok) throw new Error(`openai_stt_${res.status}`);
  return await res.json();
}
async function proxyTts(text, voice) {
  const res = await fetch(`${OPENAI_BASE}/audio/speech`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1", input: text.slice(0, 4096), voice, response_format: "mp3" })
  });
  if (!res.ok) throw new Error(`openai_tts_${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr).toString("base64");
}

// src/walletAuth.ts
var import_auth = require("firebase-admin/auth");
async function requireFirebaseBearerUser(req) {
  const raw = String(req.header("authorization") ?? req.header("Authorization") ?? "");
  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "missing_bearer_token" };
  try {
    const decoded = await (0, import_auth.getAuth)().verifyIdToken(token);
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, status: 401, error: "invalid_id_token" };
  }
}
async function requireFirebaseBearerUserDecoded(req) {
  const raw = String(req.header("authorization") ?? req.header("Authorization") ?? "");
  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "missing_bearer_token" };
  try {
    const decoded = await (0, import_auth.getAuth)().verifyIdToken(token);
    return { ok: true, uid: decoded.uid, decoded };
  } catch {
    return { ok: false, status: 401, error: "invalid_id_token" };
  }
}

// src/b2b/staff/b2bStaffQueueSnapshot.ts
var import_firestore6 = require("firebase-admin/firestore");
var import_v28 = require("firebase-functions/v2");
var import_https = require("firebase-functions/v2/https");

// ../src/services/b2b/merchant/staffQueueLabels.ts
function operationalLineForBooking(b) {
  const stay = b.b2bVertical === "hospitality_stay";
  if (b.isInquiryOnly === true || stay && b.status === "pending_confirm") {
    return stay ? "L\u01B0u tr\xFA \xB7 ghi nh\u1EADn y\xEAu c\u1EA7u (inquiry) \u2014 kh\xF4ng ph\u1EA3i x\xE1c nh\u1EADn ph\xF2ng/gi\xE1 cu\u1ED1i; ch\u01B0a debit usage tr\xEAn lu\u1ED3ng inquiry." : "Ghi nh\u1EADn / ch\u1EDD x\xE1c nh\u1EADn \u2014 ki\u1EC3m tra billing event tr\u01B0\u1EDBc khi coi l\xE0 \u0111\xE3 t\xEDnh ph\xED.";
  }
  if (b.status === "pending_confirm") return "Ch\u1EDD x\xE1c nh\u1EADn n\u1ED9i b\u1ED9.";
  if (b.status === "confirmed") return "\u0110\xE3 x\xE1c nh\u1EADn \u2014 ki\u1EC3m tra ledger n\u1EBFu c\u1EA7n bi\u1EBFt \u0111\xE3 debit usage hay ch\u01B0a.";
  return `Tr\u1EA1ng th\xE1i: ${b.status}`;
}
function operationalLineForOrder(o) {
  const wholesale = o.orderSegment === "wholesale" || o.b2bVertical === "grocery_wholesale";
  if (!wholesale) {
    if (o.status === "pending_confirm") return "\u0110\u01A1n retail \xB7 ch\u1EDD x\xE1c nh\u1EADn \u2014 ch\u01B0a ch\u1EAFc \u0111\xE3 debit.";
    return `\u0110\u01A1n retail \xB7 ${o.status}`;
  }
  const q = o.wholesaleQualification ?? "needs_clarification";
  if (q === "needs_clarification") return "\u0110\u1ED5 h\xE0ng \xB7 c\u1EA7n l\xE0m r\xF5 d\xF2ng h\xE0ng \u2014 ch\u01B0a debit usage (giai \u0111o\u1EA1n intake).";
  if (q === "qualified_pending_confirm")
    return "\u0110\u1ED5 h\xE0ng \xB7 \u0111\u1EE7 \u0111i\u1EC1u ki\u1EC7n s\u01A1 b\u1ED9 \u2014 ch\u1EDD x\xE1c nh\u1EADn fulfillment; ch\u01B0a ch\u1EAFc \u0111\xE3 debit.";
  if (q === "confirmed_for_fulfillment")
    return "\u0110\u1ED5 h\xE0ng \xB7 \u0111\xE3 x\xE1c nh\u1EADn fulfillment \u2014 ki\u1EC3m tra billing event cho usage debit.";
  return `\u0110\u1ED5 h\xE0ng \xB7 ${q}`;
}
function escalationHintFromHandoffBlock(text) {
  const m = text.match(/Escalation:\s*([^\n]+)/);
  if (!m) return void 0;
  const v = m[1].trim();
  if (v === "none") return void 0;
  return v.replace(/_/g, " ");
}

// ../src/services/b2b/merchant/staffQueueRowMapping.ts
function timestampLabel(v) {
  if (v && typeof v === "object" && "toDate" in v && typeof v.toDate === "function") {
    try {
      return v.toDate().toLocaleString();
    } catch {
      return "\u2014";
    }
  }
  return "\u2014";
}
function docToBookingLite(id, d) {
  try {
    return {
      id,
      tenantId: String(d.tenantId ?? ""),
      locationId: String(d.locationId ?? ""),
      status: d.status,
      customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : void 0,
      customerName: d.customerName ? String(d.customerName) : void 0,
      serviceIds: Array.isArray(d.serviceIds) ? d.serviceIds : [],
      resourceIds: Array.isArray(d.resourceIds) ? d.resourceIds : [],
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      idempotencyKey: String(d.idempotencyKey ?? ""),
      sourceCallSessionId: d.sourceCallSessionId ? String(d.sourceCallSessionId) : void 0,
      notes: d.notes ? String(d.notes) : void 0,
      partySize: typeof d.partySize === "number" ? d.partySize : void 0,
      b2bVertical: d.b2bVertical,
      stayCheckInDate: d.stayCheckInDate ? String(d.stayCheckInDate) : void 0,
      stayCheckOutDate: d.stayCheckOutDate ? String(d.stayCheckOutDate) : void 0,
      adults: typeof d.adults === "number" ? d.adults : void 0,
      children: typeof d.children === "number" ? d.children : void 0,
      roomUnitLabel: d.roomUnitLabel ? String(d.roomUnitLabel) : void 0,
      isInquiryOnly: d.isInquiryOnly === true,
      staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : void 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    };
  } catch {
    return null;
  }
}
function docToOrderLite(id, d) {
  try {
    return {
      id,
      tenantId: String(d.tenantId ?? ""),
      locationId: String(d.locationId ?? ""),
      status: d.status,
      lines: Array.isArray(d.lines) ? d.lines : [],
      customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : void 0,
      customerName: d.customerName ? String(d.customerName) : void 0,
      fulfillment: d.fulfillment ?? "pickup",
      windowStart: d.windowStart,
      windowEnd: d.windowEnd,
      idempotencyKey: String(d.idempotencyKey ?? ""),
      sourceCallSessionId: d.sourceCallSessionId ? String(d.sourceCallSessionId) : void 0,
      deliveryAddress: d.deliveryAddress ? String(d.deliveryAddress) : void 0,
      b2bVertical: d.b2bVertical,
      orderSegment: d.orderSegment,
      wholesaleQualification: d.wholesaleQualification,
      lineClarifications: Array.isArray(d.lineClarifications) ? d.lineClarifications : void 0,
      palletOrVolumeHint: d.palletOrVolumeHint ? String(d.palletOrVolumeHint) : void 0,
      staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : void 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    };
  } catch {
    return null;
  }
}
function liveStaffQueueRowFromBookingDoc(docId, d, queueDataSource) {
  const b = docToBookingLite(docId, d);
  if (!b) return null;
  const handoff = b.staffHandoffSummary?.trim() || "(Ch\u01B0a c\xF3 staffHandoffSummary tr\xEAn document \u2014 ki\u1EC3m tra phi\xEAn b\u1EA3n backend.)";
  const op = operationalLineForBooking(b);
  return {
    id: docId,
    source: "booking",
    updatedAtLabel: timestampLabel(d.updatedAt ?? d.createdAt),
    customerLabel: b.customerName ?? b.customerPhoneE164 ?? "\u2014",
    headline: b.b2bVertical === "hospitality_stay" ? `L\u01B0u tr\xFA \xB7 ${b.stayCheckInDate ?? "?"} \u2192 ${b.stayCheckOutDate ?? "?"}` : `Booking \xB7 ${b.status}`,
    operationalLine: op,
    escalationHint: escalationHintFromHandoffBlock(handoff),
    staffHandoffSummary: handoff,
    b2bVertical: b.b2bVertical,
    bookingStatus: b.status,
    isInquiryOnly: b.isInquiryOnly === true,
    queueDataSource
  };
}
function liveStaffQueueRowFromOrderDoc(docId, d, queueDataSource) {
  const o = docToOrderLite(docId, d);
  if (!o) return null;
  const handoff = o.staffHandoffSummary?.trim() || "(Ch\u01B0a c\xF3 staffHandoffSummary tr\xEAn document.)";
  const lineHint = o.lines[0] ? `${o.lines[0].name} \xD7 ${o.lines[0].quantity}` : "\u0110\u01A1n h\xE0ng";
  return {
    id: docId,
    source: "order",
    updatedAtLabel: timestampLabel(d.updatedAt ?? d.createdAt),
    customerLabel: o.customerName ?? o.customerPhoneE164 ?? "\u2014",
    headline: `\u0110\u01A1n \xB7 ${lineHint}`,
    operationalLine: operationalLineForOrder(o),
    escalationHint: escalationHintFromHandoffBlock(handoff),
    staffHandoffSummary: handoff,
    b2bVertical: o.b2bVertical,
    orderStatus: o.status,
    wholesaleQualification: o.wholesaleQualification,
    queueDataSource
  };
}

// src/b2b/staff/b2bStaffQueueSnapshot.ts
var B2B_TENANT_CLAIM = "b2bTenantId";
function parseLimit(raw, fallback) {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 40);
}
async function handle(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  const ac = await verifyAppCheckForRequest(req, "b2bStaffQueue");
  if (!ac.ok) {
    import_v28.logger.warn("[b2b_staff_queue_snapshot] denied", {
      trust_surface: "b2b_staff_queue_snapshot",
      gate: "app_check",
      status: ac.status,
      error: ac.error
    });
    res.status(ac.status).json({ ok: false, error: ac.error });
    return;
  }
  const auth = await requireFirebaseBearerUserDecoded(req);
  if (!auth.ok) {
    import_v28.logger.warn("[b2b_staff_queue_snapshot] denied", {
      trust_surface: "b2b_staff_queue_snapshot",
      gate: "firebase_bearer",
      status: auth.status,
      error: auth.error
    });
    res.status(auth.status).json({ ok: false, error: auth.error });
    return;
  }
  const claimRaw = auth.decoded[B2B_TENANT_CLAIM];
  const tenantId = typeof claimRaw === "string" ? claimRaw.trim() : "";
  if (!tenantId) {
    import_v28.logger.warn("[b2b_staff_queue_snapshot] denied", {
      trust_surface: "b2b_staff_queue_snapshot",
      gate: "b2b_tenant_claim",
      error: "b2b_tenant_claim_missing"
    });
    res.status(403).json({ ok: false, error: "b2b_tenant_claim_missing" });
    return;
  }
  const lim = parseLimit(typeof req.query?.limit === "string" ? req.query.limit : void 0, 12);
  const db2 = (0, import_firestore6.getFirestore)();
  const rows = [];
  const errs = [];
  try {
    const bSnap = await db2.collection(B2B_ROOT.tenants).doc(tenantId).collection(B2B_ROOT.bookings).orderBy("createdAt", "desc").limit(lim).get();
    for (const doc of bSnap.docs) {
      const row = liveStaffQueueRowFromBookingDoc(doc.id, doc.data(), "functions_https");
      if (row) rows.push(row);
    }
  } catch (e) {
    errs.push(`business_bookings: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    const oSnap = await db2.collection(B2B_ROOT.tenants).doc(tenantId).collection(B2B_ROOT.orders).orderBy("createdAt", "desc").limit(lim).get();
    for (const doc of oSnap.docs) {
      const row = liveStaffQueueRowFromOrderDoc(doc.id, doc.data(), "functions_https");
      if (row) rows.push(row);
    }
  } catch (e) {
    errs.push(`business_orders: ${e instanceof Error ? e.message : String(e)}`);
  }
  rows.sort((a, b) => b.updatedAtLabel.localeCompare(a.updatedAtLabel));
  const sliced = rows.slice(0, lim * 2);
  import_v28.logger.info("[b2b_staff_queue_snapshot] ok", {
    trust_surface: "b2b_staff_queue_snapshot",
    firebaseUid: auth.uid,
    tenantId,
    rowCount: sliced.length,
    errors: errs.length ? errs : void 0
  });
  if (errs.length && sliced.length === 0) {
    res.status(200).json({
      ok: true,
      rows: [],
      partialWarning: errs.join(" | "),
      error: null
    });
    return;
  }
  res.status(200).json({
    ok: true,
    rows: sliced,
    partialWarning: errs.length ? `M\u1ED9t ph\u1EA7n l\u1ED7i: ${errs.join(" | ")}` : null
  });
}
var b2bStaffQueueSnapshot = (0, import_https.onRequest)(
  {
    region: "europe-west1",
    cors: true,
    timeoutSeconds: 60,
    memory: "256MiB"
  },
  async (req, res) => {
    try {
      await handle(req, res);
    } catch (e) {
      import_v28.logger.error("[b2b_staff_queue_snapshot] unhandled", {
        trust_surface: "b2b_staff_queue_snapshot",
        message: e instanceof Error ? e.message : String(e)
      });
      res.status(500).json({ ok: false, error: "internal" });
    }
  }
);

// src/index.ts
var db = (0, import_firestore7.getFirestore)();
var B2B_WEBHOOK_SECRET = process.env.B2B_WEBHOOK_SECRET?.trim() ?? "";
async function receiptAllowsTopup(fs, paymentEventId, walletUid, creditsAmount) {
  if (process.env.WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT?.trim() !== "1") {
    return { ok: true };
  }
  const snap = await fs.doc(paymentReceiptDocPath(paymentEventId)).get();
  if (!snap.exists) return { ok: false, error: "payment_receipt_missing" };
  const r = snap.data();
  if (r.status !== "paid") return { ok: false, error: "payment_receipt_not_paid" };
  if (process.env.WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID?.trim() === "1") {
    if (!r.walletUid || typeof r.walletUid !== "string") {
      return { ok: false, error: "payment_receipt_wallet_uid_required" };
    }
  }
  if (r.walletUid && r.walletUid !== walletUid) return { ok: false, error: "payment_receipt_wallet_mismatch" };
  const grant = r.creditsToGrant;
  const strictCredits = process.env.WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT?.trim() === "1";
  if (strictCredits) {
    if (typeof grant !== "number" || !Number.isFinite(grant) || grant <= 0) {
      return { ok: false, error: "payment_receipt_credits_grant_required" };
    }
    if (grant !== creditsAmount) return { ok: false, error: "payment_receipt_amount_mismatch" };
  } else if (typeof grant === "number" && grant !== creditsAmount) {
    return { ok: false, error: "payment_receipt_amount_mismatch" };
  }
  return { ok: true };
}
var AI_PROXY_REQUIRE_AUTH = process.env.AI_PROXY_REQUIRE_AUTH?.trim() !== "0";
var AI_PROXY_MAX_RPM = Math.max(0, Number.parseInt(process.env.AI_PROXY_MAX_RPM ?? "120", 10) || 120);
var AI_PROXY_RATE_WINDOW_MS = Math.max(1e4, Number.parseInt(process.env.AI_PROXY_RATE_WINDOW_MS ?? "60000", 10) || 6e4);
logRuntimeTrustPostureOnce();
function adminPhoneRouteRepo2() {
  return {
    async getByInboundE164(_db, e164) {
      const snap = await db.doc(phoneRouteDocPath(e164)).get();
      if (!snap.exists) return null;
      const d = snap.data();
      if (!d?.tenantId || !d?.locationId) return null;
      return {
        tenantId: String(d.tenantId),
        locationId: String(d.locationId),
        inboundNumberE164: String(d.inboundNumberE164 ?? e164)
      };
    }
  };
}
var reposStub = {
  phoneRoute: adminPhoneRouteRepo2()
};
var b2bInboundVoiceWebhook = (0, import_https2.onRequest)(
  {
    region: "europe-west1",
    cors: false,
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (req, res) => {
    if (!B2B_WEBHOOK_SECRET) {
      res.status(500).json({ ok: false, error: "missing_webhook_secret" });
      return;
    }
    const verified = verifySignedRequest(req, B2B_WEBHOOK_SECRET);
    if (!verified.ok) {
      res.status(401).json({ ok: false, error: verified.reason ?? "unauthorized" });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    if (body.action && body.externalCallId) {
      const result = await processVoiceOrchestrationRequest(db, body);
      res.status(result.ok ? 200 : 400).json(result);
      return;
    }
    res.status(501).json({
      error: "not_implemented",
      hint: "POST JSON { action, externalCallId, ... } for pipeline, or implement Twilio/form parser \u2192 processVoiceOrchestrationRequest."
    });
  }
);
var b2bVoiceOrchestrationHook = (0, import_https2.onRequest)(
  {
    region: "europe-west1",
    timeoutSeconds: 120,
    memory: "512MiB"
  },
  async (req, res) => {
    if (!B2B_WEBHOOK_SECRET) {
      res.status(500).json({ ok: false, error: "missing_webhook_secret" });
      return;
    }
    const verified = verifySignedRequest(req, B2B_WEBHOOK_SECRET);
    if (!verified.ok) {
      res.status(401).json({ ok: false, error: verified.reason ?? "unauthorized" });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const raw = typeof req.body === "object" && req.body !== null ? req.body : {};
    if (!raw.action || !raw.externalCallId) {
      const to = String(raw.to ?? req.query?.to ?? "");
      if (!to) {
        res.status(400).json({ ok: false, error: "missing_action_or_externalCallId_and_to" });
        return;
      }
      const route = await resolveTenantByPhone(db, reposStub, { inboundNumberE164: to });
      if (!route) {
        res.status(404).json({ ok: false, error: "tenant_not_found", failureCode: "tenant_not_found" });
        return;
      }
      res.status(200).json({ ok: true, tenantId: route.tenantId, locationId: route.locationId });
      return;
    }
    const result = await processVoiceOrchestrationRequest(db, raw);
    const status = result.ok ? 200 : result.failureCode === "tenant_not_found" ? 404 : 400;
    res.status(status).json(result);
  }
);
var b2bOrderStaffOps = (0, import_https2.onRequest)(
  {
    region: "europe-west1",
    timeoutSeconds: 60,
    memory: "256MiB"
  },
  async (req, res) => {
    if (!B2B_WEBHOOK_SECRET) {
      res.status(500).json({ ok: false, error: "missing_webhook_secret" });
      return;
    }
    const verified = verifySignedRequest(req, B2B_WEBHOOK_SECRET);
    if (!verified.ok) {
      res.status(401).json({ ok: false, error: verified.reason ?? "unauthorized" });
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const raw = typeof req.body === "object" && req.body !== null ? req.body : {};
    if (raw.action !== "set_wholesale_qualification" || typeof raw.tenantId !== "string" || typeof raw.orderId !== "string" || !raw.wholesaleQualification) {
      res.status(400).json({ ok: false, error: "invalid_staff_ops_body" });
      return;
    }
    const result = await processOrderStaffOpsRequest(db, raw);
    res.status(result.ok ? 200 : 400).json(result);
  }
);
var aiProxy = (0, import_https2.onRequest)(
  { region: "europe-west1", cors: true, timeoutSeconds: 120, memory: "1GiB" },
  async (req, res) => {
    if (req.method !== "POST") return void res.status(405).send("Method Not Allowed");
    try {
      const byteLen = requestBodyByteLength(req);
      if (byteLen > AI_PROXY_MAX_BODY_BYTES) {
        import_v29.logger.warn("[aiProxy] body_too_large", { byteLen, max: AI_PROXY_MAX_BODY_BYTES });
        return void res.status(413).json({ ok: false, error: "payload_too_large" });
      }
      const acAi = await verifyAppCheckForRequest(req, "aiProxy");
      if (!acAi.ok) {
        import_v29.logger.warn("[aiProxy] denied", { trust_surface: "ai_proxy", gate: "app_check", status: acAi.status, error: acAi.error });
        return void res.status(acAi.status).json({ ok: false, error: acAi.error });
      }
      let uid = "anonymous";
      if (AI_PROXY_REQUIRE_AUTH) {
        const auth = await requireFirebaseBearerUser(req);
        if (!auth.ok) {
          import_v29.logger.warn("[aiProxy] denied", { trust_surface: "ai_proxy", gate: "firebase_bearer", status: auth.status, error: auth.error });
          return void res.status(auth.status).json({ ok: false, error: auth.error });
        }
        uid = auth.uid;
      }
      if (AI_PROXY_MAX_RPM > 0 && uid !== "anonymous") {
        const allowed = takeAiProxyRateSlot(uid, AI_PROXY_MAX_RPM, AI_PROXY_RATE_WINDOW_MS);
        if (!allowed) {
          import_v29.logger.warn("[aiProxy] rate_limited", { firebaseUid: uid });
          return void res.status(429).json({ ok: false, error: "rate_limited" });
        }
      }
      const body = typeof req.body === "object" && req.body !== null ? req.body : {};
      const op = String(body.op ?? "");
      if (op === "chat") {
        const parsed = parseAndValidateChatPayload(body);
        if (!parsed.ok) {
          return void res.status(400).json({ ok: false, error: parsed.error });
        }
        const out = await proxyChat(parsed.messages, parsed.temperature, parsed.maxTokens);
        return void res.status(200).json(out);
      }
      if (op === "stt") {
        const parsed = validateSttPayload(body);
        if (!parsed.ok) return void res.status(400).json({ ok: false, error: parsed.error });
        const out = await proxyStt(parsed.base64Audio, parsed.mime);
        return void res.status(200).json(out);
      }
      if (op === "tts") {
        const parsed = validateTtsPayload(body);
        if (!parsed.ok) return void res.status(400).json({ ok: false, error: parsed.error });
        const audioBase64 = await proxyTts(parsed.text, parsed.voice);
        return void res.status(200).json({ audioBase64 });
      }
      return void res.status(400).json({ ok: false, error: "unknown_op" });
    } catch (e) {
      import_v29.logger.error("[aiProxy] error", e instanceof Error ? e : void 0);
      return void res.status(500).json({ ok: false, error: "proxy_error" });
    }
  }
);
var walletOps = (0, import_https2.onRequest)(
  { region: "europe-west1", cors: true, timeoutSeconds: 60, memory: "256MiB" },
  async (req, res) => {
    if (req.method !== "POST") return void res.status(405).send("Method Not Allowed");
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    if (Object.prototype.hasOwnProperty.call(body, "userId")) {
      return void res.status(400).json({ ok: false, error: "userId_in_body_not_allowed" });
    }
    const acWallet = await verifyAppCheckForRequest(req, "walletOps");
    if (!acWallet.ok) {
      import_v29.logger.warn("[walletOps] denied", { trust_surface: "wallet_ops", gate: "app_check", status: acWallet.status, error: acWallet.error });
      return void res.status(acWallet.status).json({ ok: false, error: acWallet.error });
    }
    const who = await requireFirebaseBearerUser(req);
    if (!who.ok) {
      import_v29.logger.warn("[walletOps] denied", { trust_surface: "wallet_ops", gate: "firebase_bearer", status: who.status, error: who.error });
      return void res.status(who.status).json({ ok: false, error: who.error });
    }
    const userId = who.uid;
    const op = String(body.op ?? "");
    import_v29.logger.info("[walletOps] request", { trust_surface: "wallet_ops", firebaseUid: userId, op });
    const ref = db.collection("wallets").doc(userId);
    if (op === "get") {
      const snap = await ref.get();
      const d = snap.data();
      return void res.status(200).json({
        ok: true,
        credits: typeof d?.credits === "number" ? d.credits : 0,
        lifetimeSpent: typeof d?.lifetimeSpent === "number" ? d.lifetimeSpent : 0
      });
    }
    if (op === "topup") {
      const amount = Number(body.amount ?? 0);
      const paymentEventId = String(body.paymentEventId ?? "").trim().replace(/\//g, "_");
      if (!paymentEventId) return void res.status(400).json({ ok: false, error: "payment_event_id_required" });
      if (!Number.isFinite(amount) || amount <= 0) return void res.status(400).json({ ok: false, error: "invalid_amount" });
      if (paymentEventId.length > 900) return void res.status(400).json({ ok: false, error: "payment_event_id_too_long" });
      const pre = await receiptAllowsTopup(db, paymentEventId, userId, amount);
      if (!pre.ok) {
        import_v29.logger.warn("[walletOps] topup_receipt_denied", { firebaseUid: userId, paymentEventId, error: pre.error });
        return void res.status(409).json({ ok: false, error: pre.error });
      }
      const ledgerRef = ref.collection("verifiedTopups").doc(paymentEventId);
      const result = await db.runTransaction(async (tx) => {
        const led = await tx.get(ledgerRef);
        if (led.exists) {
          const st = String(led.data()?.status ?? "");
          if (st === "applied") return { ok: true, duplicate: true };
        }
        const snap = await tx.get(ref);
        const d = snap.data() ?? {};
        const nextCredits = (d.credits ?? 0) + amount;
        tx.set(
          ref,
          { credits: nextCredits, lifetimeSpent: d.lifetimeSpent ?? 0, updatedAt: import_firestore8.FieldValue.serverTimestamp() },
          { merge: true }
        );
        tx.set(ledgerRef, {
          status: "applied",
          creditsGranted: amount,
          createdAt: import_firestore8.FieldValue.serverTimestamp()
        });
        return { ok: true, duplicate: false };
      });
      import_v29.logger.info("[walletOps] topup", {
        firebaseUid: userId,
        paymentEventId,
        amount,
        duplicate: result.duplicate === true
      });
      return void res.status(200).json({ ok: true, duplicate: result.duplicate === true });
    }
    if (op === "chargeTrustedService") {
      const amount = Number(body.amount ?? 0);
      const idempotencyKey = String(body.idempotencyKey ?? "").trim().replace(/\//g, "_");
      const serviceKind = String(body.serviceKind ?? "").trim();
      const allowed = /* @__PURE__ */ new Set(["leona_outbound", "letan_booking"]);
      if (!allowed.has(serviceKind)) return void res.status(400).json({ ok: false, error: "invalid_service_kind" });
      if (!Number.isFinite(amount) || amount <= 0 || !idempotencyKey) {
        return void res.status(400).json({ ok: false, error: "invalid_charge_trusted" });
      }
      if (idempotencyKey.length > 900) return void res.status(400).json({ ok: false, error: "idempotency_key_too_long" });
      const chargeRef = ref.collection("trustedServiceCharges").doc(idempotencyKey);
      const result = await db.runTransaction(async (tx) => {
        const ch = await tx.get(chargeRef);
        if (ch.exists && String(ch.data()?.status ?? "") === "applied") {
          return { ok: true, duplicate: true };
        }
        const snap = await tx.get(ref);
        const d = snap.data() ?? {};
        const credits = d.credits ?? 0;
        if (credits < amount) return { ok: false, error: "insufficient_credits" };
        const spent = d.lifetimeSpent ?? 0;
        tx.set(
          ref,
          { credits: credits - amount, lifetimeSpent: spent + amount, updatedAt: import_firestore8.FieldValue.serverTimestamp() },
          { merge: true }
        );
        tx.set(chargeRef, {
          status: "applied",
          serviceKind,
          amount,
          createdAt: import_firestore8.FieldValue.serverTimestamp()
        });
        return { ok: true, duplicate: false };
      });
      if (!result.ok) return void res.status(400).json(result);
      import_v29.logger.info("[walletOps] chargeTrustedService", {
        firebaseUid: userId,
        serviceKind,
        amount,
        idempotencyKey,
        duplicate: result.duplicate === true
      });
      return void res.status(200).json({ ok: true, duplicate: result.duplicate === true });
    }
    if (op === "reserve") {
      const amount = Number(body.amount ?? 0);
      const key = String(body.idempotencyKey ?? "");
      if (!Number.isFinite(amount) || amount <= 0 || !key) return void res.status(400).json({ ok: false, error: "invalid_reserve" });
      const holdRef = ref.collection("holds").doc(key);
      const result = await db.runTransaction(async (tx) => {
        const hold = await tx.get(holdRef);
        if (hold.exists) return { ok: true, holdId: key };
        const snap = await tx.get(ref);
        const d = snap.data() ?? {};
        const credits = d.credits ?? 0;
        if (credits < amount) return { ok: false, error: "insufficient_credits" };
        tx.set(ref, { credits: credits - amount, lifetimeSpent: d.lifetimeSpent ?? 0, updatedAt: import_firestore8.FieldValue.serverTimestamp() }, { merge: true });
        tx.set(holdRef, { amount, status: "reserved", createdAt: import_firestore8.FieldValue.serverTimestamp() });
        return { ok: true, holdId: key };
      });
      return void res.status(result.ok ? 200 : 400).json(result);
    }
    if (op === "commit" || op === "rollback") {
      const key = String(body.idempotencyKey ?? "");
      if (!key) return void res.status(400).json({ ok: false, error: "missing_hold_key" });
      const holdRef = ref.collection("holds").doc(key);
      const result = await db.runTransaction(async (tx) => {
        const hold = await tx.get(holdRef);
        if (!hold.exists) return { ok: false, error: "hold_not_found" };
        const h = hold.data();
        if (h.status === "committed" && op === "commit") return { ok: true };
        if (h.status === "rolled_back" && op === "rollback") return { ok: true };
        if (op === "rollback") {
          const snap = await tx.get(ref);
          const d = snap.data() ?? {};
          tx.set(ref, { credits: (d.credits ?? 0) + (h.amount ?? 0), updatedAt: import_firestore8.FieldValue.serverTimestamp() }, { merge: true });
          tx.set(holdRef, { status: "rolled_back", updatedAt: import_firestore8.FieldValue.serverTimestamp() }, { merge: true });
          return { ok: true };
        }
        tx.set(holdRef, { status: "committed", updatedAt: import_firestore8.FieldValue.serverTimestamp() }, { merge: true });
        return { ok: true };
      });
      return void res.status(result.ok ? 200 : 400).json(result);
    }
    import_v29.logger.warn("[walletOps] unknown_op", { trust_surface: "wallet_ops", firebaseUid: userId, op });
    return void res.status(400).json({ ok: false, error: "unknown_wallet_op" });
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  aiProxy,
  b2bInboundVoiceWebhook,
  b2bOrderStaffOps,
  b2bStaffQueueSnapshot,
  b2bVoiceOrchestrationHook,
  walletOps
});
