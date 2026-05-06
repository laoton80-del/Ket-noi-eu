import type { IndustryDefinition, IndustryGroupId, IndustryId } from './industryTypes';

const DEF = (id: IndustryId, groupId: IndustryGroupId): IndustryDefinition => ({
  id,
  groupId,
  nameKey: `aiReceptionist.industry.${id}`,
});

/**
 * Canonical industry catalog — single source of truth for grouping + ids.
 */
export const INDUSTRY_DEFINITIONS: readonly IndustryDefinition[] = [
  DEF('nailSalon', 'beautyWellness'),
  DEF('spaMassage', 'beautyWellness'),
  DEF('hairBarber', 'beautyWellness'),
  DEF('lashBrow', 'beautyWellness'),
  DEF('waxing', 'beautyWellness'),
  DEF('aestheticsConsultation', 'beautyWellness'),
  DEF('restaurantTakeaway', 'foodRetail'),
  DEF('groceryAsianMarket', 'foodRetail'),
  DEF('bakery', 'foodRetail'),
  DEF('specialtyRetail', 'foodRetail'),
  DEF('hotelMotel', 'stayTravel'),
  DEF('homestayShortStay', 'stayTravel'),
  DEF('guesthouse', 'stayTravel'),
  DEF('travelTourDesk', 'stayTravel'),
  DEF('handyman', 'homeLocalServices'),
  DEF('electricalPlumbing', 'homeLocalServices'),
  DEF('hvac', 'homeLocalServices'),
  DEF('cleaning', 'homeLocalServices'),
  DEF('movingDeliveryHelper', 'homeLocalServices'),
  DEF('autoRepair', 'homeLocalServices'),
  DEF('accountingTax', 'professionalServices'),
  DEF('legalScheduling', 'professionalServices'),
  DEF('insuranceBroker', 'professionalServices'),
  DEF('immigrationScheduling', 'professionalServices'),
  DEF('languageSchoolTutoring', 'educationCommunity'),
  DEF('daycareAfterSchool', 'educationCommunity'),
  DEF('communityClasses', 'educationCommunity'),
  DEF('drivingSchool', 'educationCommunity'),
  DEF('clinicGpScheduling', 'healthSchedulingOnly'),
  DEF('dentistScheduling', 'healthSchedulingOnly'),
  DEF('physioScheduling', 'healthSchedulingOnly'),
] as const;

export const INDUSTRY_GROUP_ORDER: readonly IndustryGroupId[] = [
  'beautyWellness',
  'foodRetail',
  'stayTravel',
  'homeLocalServices',
  'professionalServices',
  'educationCommunity',
  'healthSchedulingOnly',
] as const;

export const INDUSTRY_IDS: readonly IndustryId[] = INDUSTRY_DEFINITIONS.map((d) => d.id);

const BY_ID: ReadonlyMap<IndustryId, IndustryDefinition> = new Map(
  INDUSTRY_DEFINITIONS.map((d) => [d.id, d])
);

export function isIndustryId(value: string): value is IndustryId {
  return BY_ID.has(value as IndustryId);
}

export function getIndustryDefinition(id: IndustryId): IndustryDefinition {
  const found = BY_ID.get(id);
  if (!found) {
    throw new Error(`Unknown industry id: ${id}`);
  }
  return found;
}

export function listIndustriesByGroup(groupId: IndustryGroupId): readonly IndustryDefinition[] {
  return INDUSTRY_DEFINITIONS.filter((d) => d.groupId === groupId);
}

export function industryGroupNameKey(groupId: IndustryGroupId): string {
  return `aiReceptionist.industryGroups.${groupId}`;
}
