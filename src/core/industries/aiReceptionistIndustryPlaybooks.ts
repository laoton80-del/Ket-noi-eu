import type { AiReceptionistIndustryPlaybook, BookingMode, IndustryId, IndustryRiskLevel } from './industryTypes';

function pb(
  industryId: IndustryId,
  partial: Omit<AiReceptionistIndustryPlaybook, 'industryId'>
): AiReceptionistIndustryPlaybook {
  return { industryId, ...partial };
}

const STANDARD_HANDOFF = [
  'complaint',
  'refund_request',
  'legal_keyword',
  'medical_emergency',
  'payment_dispute',
] as const;

const BEAUTY_FNB_HANDOFF = ['complaint', 'allergy_concern', 'refund_request', 'payment_dispute'] as const;

function beautyFoodPlaybook(
  industryId: IndustryId,
  bookingMode: BookingMode,
  risk: IndustryRiskLevel,
  demoHintService: string,
  required: readonly string[],
  optional: readonly string[],
  disclaimerKey: string
): AiReceptionistIndustryPlaybook {
  return pb(industryId, {
    bookingMode,
    requiredIntakeFields: required,
    optionalIntakeFields: optional,
    riskLevel: risk,
    allowedActions: ['capture_intake_draft', 'check_open_hours', 'propose_slot', 'send_sms_confirmation_link'],
    blockedActions: ['capture_payment', 'finalize_booking_without_confirm', 'modify_inventory', 'legal_advice', 'medical_advice'],
    handoffRules: [...BEAUTY_FNB_HANDOFF],
    confirmationPolicy: 'merchantConfirm',
    disclaimerKey,
    demoHintService,
  });
}

function stayPlaybook(
  industryId: IndustryId,
  bookingMode: BookingMode,
  demoHintService: string
): AiReceptionistIndustryPlaybook {
  return pb(industryId, {
    bookingMode,
    requiredIntakeFields: ['guestName', 'phone', 'checkIn', 'checkOut', 'partySize'],
    optionalIntakeFields: ['specialRequests', 'languagePreference'],
    riskLevel: 'medium',
    allowedActions: ['capture_lead_draft', 'check_availability_text', 'send_email_summary'],
    blockedActions: ['capture_payment', 'guarantee_room', 'modify_pms_inventory', 'legal_advice', 'medical_advice'],
    handoffRules: ['complaint', 'cancellation_policy_dispute', 'payment_dispute', 'overbooking_risk'],
    confirmationPolicy: 'merchantConfirm',
    disclaimerKey: 'aiReceptionist.disclaimers.stayTravelLeadOrConfirm',
    demoHintService,
  });
}

function homeServicePlaybook(industryId: IndustryId, demoHintService: string): AiReceptionistIndustryPlaybook {
  return pb(industryId, {
    bookingMode: 'appointment_job_visit',
    requiredIntakeFields: ['callerName', 'phone', 'addressOrArea', 'issueSummary', 'preferredWindow'],
    optionalIntakeFields: ['photosDescription', 'languagePreference'],
    riskLevel: 'medium',
    allowedActions: ['capture_intake_draft', 'propose_estimate_visit', 'send_sms_link'],
    blockedActions: ['capture_payment', 'quote_fixed_price_without_visit', 'modify_inventory', 'legal_advice', 'medical_advice'],
    handoffRules: ['safety_emergency', 'structural_damage', 'price_dispute', 'complaint'],
    confirmationPolicy: 'merchantConfirm',
    disclaimerKey: 'aiReceptionist.disclaimers.homeServicesEstimate',
    demoHintService,
  });
}

function professionalSchedulingPlaybook(industryId: IndustryId, demoHintService: string): AiReceptionistIndustryPlaybook {
  return pb(industryId, {
    bookingMode: 'appointment_staff',
    requiredIntakeFields: ['callerName', 'phone', 'preferredDateTime', 'topicSummary'],
    optionalIntakeFields: ['languagePreference', 'documentChecklistAck'],
    riskLevel: 'regulated',
    allowedActions: ['capture_intake_draft', 'send_appointment_link', 'collect_required_forms_list'],
    blockedActions: [
      'legal_advice_final',
      'tax_advice_final',
      'policy_binding_quote',
      'capture_payment',
      'modify_inventory',
      'medical_advice',
    ],
    handoffRules: [...STANDARD_HANDOFF, 'binding_advice_request', 'representation_request'],
    confirmationPolicy: 'intakeOnly',
    disclaimerKey: 'aiReceptionist.disclaimers.professionalSchedulingOnly',
    demoHintService,
  });
}

function educationPlaybook(industryId: IndustryId, demoHintService: string): AiReceptionistIndustryPlaybook {
  return pb(industryId, {
    bookingMode: 'appointment_staff',
    requiredIntakeFields: ['studentOrParentName', 'phone', 'learnerAgeBand', 'preferredSlot'],
    optionalIntakeFields: ['languagePreference', 'goalsSummary'],
    riskLevel: 'low',
    allowedActions: ['capture_intake_draft', 'suggest_class_slots', 'send_info_pack_link'],
    blockedActions: ['guarantee_enrollment', 'capture_payment', 'modify_inventory', 'legal_advice', 'medical_advice'],
    handoffRules: ['child_safeguarding_signal', 'complaint', 'refund_request'],
    confirmationPolicy: 'merchantConfirm',
    disclaimerKey: 'aiReceptionist.disclaimers.educationScheduling',
    demoHintService,
  });
}

function healthSchedulingPlaybook(industryId: IndustryId, demoHintService: string): AiReceptionistIndustryPlaybook {
  return pb(industryId, {
    bookingMode: 'appointment_staff',
    requiredIntakeFields: ['patientName', 'phone', 'preferredDateTime', 'reasonForVisitSchedulingOnly'],
    optionalIntakeFields: ['insuranceMemberId', 'languagePreference'],
    riskLevel: 'regulated',
    allowedActions: ['capture_intake_draft', 'suggest_slot', 'send_portal_link'],
    blockedActions: [
      'diagnosis',
      'triage_symptoms',
      'prescribe',
      'capture_payment',
      'modify_inventory',
      'legal_advice',
      'medical_advice',
    ],
    handoffRules: [...STANDARD_HANDOFF, 'symptom_interpretation', 'urgent_care_redirect'],
    confirmationPolicy: 'intakeOnly',
    disclaimerKey: 'aiReceptionist.disclaimers.healthSchedulingOnly',
    demoHintService,
  });
}

/**
 * Playbooks keyed by `IndustryId` — required for typed navigation across the catalog.
 */
export const AI_RECEPTIONIST_PLAYBOOKS: Readonly<Record<IndustryId, AiReceptionistIndustryPlaybook>> = {
  nailSalon: beautyFoodPlaybook(
    'nailSalon',
    'appointment_staff',
    'low',
    'Gel manicure + nail art',
    ['customerName', 'phone', 'serviceType', 'preferredSlot'],
    ['partySize', 'languagePreference'],
    'aiReceptionist.disclaimers.defaultLite'
  ),
  spaMassage: beautyFoodPlaybook(
    'spaMassage',
    'appointment_staff',
    'low',
    'Deep tissue massage 60 min',
    ['customerName', 'phone', 'serviceType', 'preferredSlot'],
    ['partySize', 'languagePreference'],
    'aiReceptionist.disclaimers.defaultLite'
  ),
  hairBarber: beautyFoodPlaybook(
    'hairBarber',
    'appointment_staff',
    'low',
    'Haircut + beard trim',
    ['customerName', 'phone', 'serviceType', 'preferredSlot'],
    ['languagePreference'],
    'aiReceptionist.disclaimers.defaultLite'
  ),
  lashBrow: beautyFoodPlaybook(
    'lashBrow',
    'appointment_staff',
    'low',
    'Lash refill appointment',
    ['customerName', 'phone', 'serviceType', 'preferredSlot'],
    ['allergyNote'],
    'aiReceptionist.disclaimers.defaultLite'
  ),
  waxing: beautyFoodPlaybook(
    'waxing',
    'appointment_staff',
    'medium',
    'Full leg waxing',
    ['customerName', 'phone', 'serviceType', 'preferredSlot'],
    ['skinSensitivityNote'],
    'aiReceptionist.disclaimers.defaultLite'
  ),
  aestheticsConsultation: beautyFoodPlaybook(
    'aestheticsConsultation',
    'lead_capture_only',
    'high',
    'Aesthetic consultation (no treatment booking via AI)',
    ['customerName', 'phone', 'consultationGoal'],
    ['languagePreference'],
    'aiReceptionist.disclaimers.aestheticsConsultationOnly'
  ),
  restaurantTakeaway: beautyFoodPlaybook(
    'restaurantTakeaway',
    'order_takeout',
    'medium',
    'Table for 4 — Saturday dinner',
    ['customerName', 'phone', 'partySize', 'preferredSlot'],
    ['dietaryNotes', 'languagePreference'],
    'aiReceptionist.disclaimers.defaultLite'
  ),
  groceryAsianMarket: beautyFoodPlaybook(
    'groceryAsianMarket',
    'lead_capture_only',
    'low',
    'Special order pickup slot',
    ['customerName', 'phone', 'itemSummary'],
    ['languagePreference'],
    'aiReceptionist.disclaimers.retailLead'
  ),
  bakery: beautyFoodPlaybook(
    'bakery',
    'order_takeout',
    'low',
    'Custom cake pickup',
    ['customerName', 'phone', 'pickupWindow', 'orderSummary'],
    ['languagePreference'],
    'aiReceptionist.disclaimers.defaultLite'
  ),
  specialtyRetail: beautyFoodPlaybook(
    'specialtyRetail',
    'lead_capture_only',
    'low',
    'In-store appointment for fitting',
    ['customerName', 'phone', 'productInterest', 'preferredSlot'],
    ['languagePreference'],
    'aiReceptionist.disclaimers.retailLead'
  ),
  hotelMotel: stayPlaybook('hotelMotel', 'room_night', 'Double room — 2 nights'),
  homestayShortStay: stayPlaybook('homestayShortStay', 'room_night', 'Homestay — long weekend'),
  guesthouse: stayPlaybook('guesthouse', 'room_night', 'Guesthouse twin room'),
  travelTourDesk: stayPlaybook('travelTourDesk', 'lead_capture_only', 'City tour inquiry'),
  handyman: homeServicePlaybook('handyman', 'Handyman repair visit'),
  electricalPlumbing: homeServicePlaybook('electricalPlumbing', 'Electrical safety inspection visit'),
  hvac: homeServicePlaybook('hvac', 'HVAC maintenance slot'),
  cleaning: homeServicePlaybook('cleaning', 'Deep cleaning appointment'),
  movingDeliveryHelper: homeServicePlaybook('movingDeliveryHelper', 'Moving help — 2 crew'),
  autoRepair: homeServicePlaybook('autoRepair', 'Brake inspection appointment'),
  accountingTax: professionalSchedulingPlaybook('accountingTax', 'Tax intake appointment'),
  legalScheduling: professionalSchedulingPlaybook('legalScheduling', 'Legal consultation scheduling'),
  insuranceBroker: professionalSchedulingPlaybook('insuranceBroker', 'Insurance broker appointment'),
  immigrationScheduling: professionalSchedulingPlaybook('immigrationScheduling', 'Immigration intake appointment'),
  languageSchoolTutoring: educationPlaybook('languageSchoolTutoring', 'Vietnamese tutoring trial class'),
  daycareAfterSchool: educationPlaybook('daycareAfterSchool', 'After-school care slot'),
  communityClasses: educationPlaybook('communityClasses', 'Weekend community workshop'),
  drivingSchool: educationPlaybook('drivingSchool', 'Driving lesson booking'),
  clinicGpScheduling: healthSchedulingPlaybook('clinicGpScheduling', 'GP appointment slot'),
  dentistScheduling: healthSchedulingPlaybook('dentistScheduling', 'Dental cleaning slot'),
  physioScheduling: healthSchedulingPlaybook('physioScheduling', 'Physiotherapy session slot'),
};

export function getAiReceptionistPlaybook(id: IndustryId): AiReceptionistIndustryPlaybook {
  return AI_RECEPTIONIST_PLAYBOOKS[id];
}
