/** Top-level taxonomy bucket for AI Receptionist industry selection. */
export type IndustryGroupId =
  | 'beautyWellness'
  | 'foodRetail'
  | 'stayTravel'
  | 'homeLocalServices'
  | 'professionalServices'
  | 'educationCommunity'
  | 'healthSchedulingOnly';

/** Stable slug per vertical (camelCase). */
export type IndustryId =
  | 'nailSalon'
  | 'spaMassage'
  | 'hairBarber'
  | 'lashBrow'
  | 'waxing'
  | 'aestheticsConsultation'
  | 'restaurantTakeaway'
  | 'groceryAsianMarket'
  | 'bakery'
  | 'specialtyRetail'
  | 'hotelMotel'
  | 'homestayShortStay'
  | 'guesthouse'
  | 'travelTourDesk'
  | 'handyman'
  | 'electricalPlumbing'
  | 'hvac'
  | 'cleaning'
  | 'movingDeliveryHelper'
  | 'autoRepair'
  | 'accountingTax'
  | 'legalScheduling'
  | 'insuranceBroker'
  | 'immigrationScheduling'
  | 'languageSchoolTutoring'
  | 'daycareAfterSchool'
  | 'communityClasses'
  | 'drivingSchool'
  | 'clinicGpScheduling'
  | 'dentistScheduling'
  | 'physioScheduling';

export type BookingMode =
  | 'appointment_staff'
  | 'appointment_job_visit'
  | 'room_night'
  | 'order_takeout'
  | 'lead_capture_only';

export type IndustryRiskLevel = 'low' | 'medium' | 'high' | 'regulated';

export type ConfirmationPolicy = 'merchantConfirm' | 'autoConfirmIfRulesPass' | 'intakeOnly';

export interface IndustryDefinition {
  readonly id: IndustryId;
  readonly groupId: IndustryGroupId;
  /** i18n key — `aiReceptionist.industry.<id>` */
  readonly nameKey: string;
}

/**
 * Industry-aware playbook for Lễ Tân AI (documentation + demo intake).
 * No runtime DB / payment / booking mutation — policy layer consumes this later.
 */
export interface AiReceptionistIndustryPlaybook {
  readonly industryId: IndustryId;
  readonly bookingMode: BookingMode;
  readonly requiredIntakeFields: readonly string[];
  readonly optionalIntakeFields: readonly string[];
  readonly riskLevel: IndustryRiskLevel;
  /** Conceptual tool / action names — not executed in P0 UI. */
  readonly allowedActions: readonly string[];
  readonly blockedActions: readonly string[];
  readonly handoffRules: readonly string[];
  readonly confirmationPolicy: ConfirmationPolicy;
  /** i18n key for disclaimer copy shown in setup + demo. */
  readonly disclaimerKey: string;
  /** Short English hint for generic demo transcript interpolation. */
  readonly demoHintService: string;
}
