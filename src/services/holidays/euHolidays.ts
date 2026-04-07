import type { HolidayItem } from './vnHolidays';

type CountryCode = 'CZ' | 'SK' | 'PL' | 'DE' | 'FR' | 'UK' | 'GB';

/** Lightweight fixed-date public holiday seed by country. */
const HOLIDAYS_BY_COUNTRY: Record<CountryCode, HolidayItem[]> = {
  CZ: [
    { key: 'cz-new-year', name: 'Nový rok', month: 1, day: 1, country: 'CZ', tags: ['closure'] },
    { key: 'cz-labor-day', name: 'Svátek práce', month: 5, day: 1, country: 'CZ', tags: ['closure'] },
    { key: 'cz-statehood', name: 'Den české státnosti', month: 9, day: 28, country: 'CZ', tags: ['administrative', 'closure'] },
  ],
  SK: [
    { key: 'sk-new-year', name: 'Nový rok', month: 1, day: 1, country: 'SK', tags: ['closure'] },
    { key: 'sk-labor-day', name: 'Sviatok práce', month: 5, day: 1, country: 'SK', tags: ['closure'] },
    { key: 'sk-constitution', name: 'Deň ústavy', month: 9, day: 1, country: 'SK', tags: ['administrative', 'closure'] },
  ],
  PL: [
    { key: 'pl-new-year', name: 'Nowy Rok', month: 1, day: 1, country: 'PL', tags: ['closure'] },
    { key: 'pl-labor-day', name: 'Święto Pracy', month: 5, day: 1, country: 'PL', tags: ['closure'] },
    { key: 'pl-independence', name: 'Narodowe Święto Niepodległości', month: 11, day: 11, country: 'PL', tags: ['administrative', 'closure'] },
  ],
  DE: [
    { key: 'de-new-year', name: 'Neujahr', month: 1, day: 1, country: 'DE', tags: ['closure'] },
    { key: 'de-labor-day', name: 'Tag der Arbeit', month: 5, day: 1, country: 'DE', tags: ['closure'] },
    { key: 'de-unity', name: 'Tag der Deutschen Einheit', month: 10, day: 3, country: 'DE', tags: ['administrative', 'closure'] },
  ],
  FR: [
    { key: 'fr-new-year', name: "Jour de l'An", month: 1, day: 1, country: 'FR', tags: ['closure'] },
    { key: 'fr-labor-day', name: 'Fête du Travail', month: 5, day: 1, country: 'FR', tags: ['closure'] },
    { key: 'fr-bastille', name: 'Fête nationale', month: 7, day: 14, country: 'FR', tags: ['administrative', 'closure'] },
  ],
  UK: [
    { key: 'uk-new-year', name: "New Year's Day", month: 1, day: 1, country: 'UK', tags: ['closure'] },
    { key: 'uk-labor-day', name: 'Early May Bank Holiday', month: 5, day: 1, country: 'UK', tags: ['closure'] },
    { key: 'uk-boxing-day', name: 'Boxing Day', month: 12, day: 26, country: 'UK', tags: ['family', 'closure'] },
  ],
  GB: [
    { key: 'gb-new-year', name: "New Year's Day", month: 1, day: 1, country: 'GB', tags: ['closure'] },
    { key: 'gb-labor-day', name: 'Early May Bank Holiday', month: 5, day: 1, country: 'GB', tags: ['closure'] },
    { key: 'gb-boxing-day', name: 'Boxing Day', month: 12, day: 26, country: 'GB', tags: ['family', 'closure'] },
  ],
};

export function getEuHolidaySeed(countryCode: string): HolidayItem[] {
  const k = (countryCode || 'CZ').toUpperCase() as CountryCode;
  return HOLIDAYS_BY_COUNTRY[k] ?? HOLIDAYS_BY_COUNTRY.CZ;
}
