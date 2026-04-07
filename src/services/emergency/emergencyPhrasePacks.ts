import type { CountryDefaultLanguage } from '../../config/countryPacks';
import { resolveCountryPack } from '../../config/countryPacks';

export type EmergencyType = 'ambulance' | 'police' | 'fire' | 'general112';

/** Phrase table languages — aligned with `CountryDefaultLanguage` where packs exist. */
export type EmergencyLang = 'vi' | 'en' | 'de' | 'cs' | 'fr' | 'pl' | 'sk';

export type EmergencyPhrasePack = {
  title: string;
  localText: string;
  vietnameseText: string;
  cannotSpeakText: string;
};

function resolveLang(country?: string): EmergencyLang {
  const lang: CountryDefaultLanguage = resolveCountryPack(country).defaultLanguage;
  if (lang === 'de') return 'de';
  if (lang === 'cs') return 'cs';
  if (lang === 'vi') return 'vi';
  if (lang === 'fr') return 'fr';
  if (lang === 'pl') return 'pl';
  if (lang === 'sk') return 'sk';
  return 'en';
}

const byType: Record<EmergencyType, Record<EmergencyLang, Omit<EmergencyPhrasePack, 'cannotSpeakText'>>> = {
  ambulance: {
    en: {
      title: 'Ambulance',
      localText: 'I need an ambulance. My location is: {location}.',
      vietnameseText: 'Tôi cần xe cứu thương. Vị trí của tôi là: {location}.',
    },
    de: {
      title: 'Krankenwagen',
      localText: 'Ich brauche einen Krankenwagen. Mein Standort ist: {location}.',
      vietnameseText: 'Tôi cần xe cứu thương. Vị trí của tôi là: {location}.',
    },
    cs: {
      title: 'Záchranka',
      localText: 'Potřebuji sanitku. Moje poloha je: {location}.',
      vietnameseText: 'Tôi cần xe cứu thương. Vị trí của tôi là: {location}.',
    },
    vi: {
      title: 'Cấp cứu',
      localText: 'Tôi cần xe cứu thương. Vị trí của tôi là: {location}.',
      vietnameseText: 'Tôi cần xe cứu thương. Vị trí của tôi là: {location}.',
    },
    fr: {
      title: 'Ambulance',
      localText: "J'ai besoin d'une ambulance. Ma position est : {location}.",
      vietnameseText: 'Tôi cần xe cứu thương. Vị trí của tôi là: {location}.',
    },
    pl: {
      title: 'Karetka',
      localText: 'Potrzebuję karetki. Moja lokalizacja to: {location}.',
      vietnameseText: 'Tôi cần xe cứu thương. Vị trí của tôi là: {location}.',
    },
    sk: {
      title: 'Záchranka',
      localText: 'Potrebujem záchranku. Moja poloha je: {location}.',
      vietnameseText: 'Tôi cần xe cứu thương. Vị trí của tôi là: {location}.',
    },
  },
  police: {
    en: {
      title: 'Police',
      localText: 'I need the police. My location is: {location}.',
      vietnameseText: 'Tôi cần cảnh sát. Vị trí của tôi là: {location}.',
    },
    de: {
      title: 'Polizei',
      localText: 'Ich brauche die Polizei. Mein Standort ist: {location}.',
      vietnameseText: 'Tôi cần cảnh sát. Vị trí của tôi là: {location}.',
    },
    cs: {
      title: 'Policie',
      localText: 'Potřebuji policii. Moje poloha je: {location}.',
      vietnameseText: 'Tôi cần cảnh sát. Vị trí của tôi là: {location}.',
    },
    vi: {
      title: 'Cảnh sát',
      localText: 'Tôi cần cảnh sát. Vị trí của tôi là: {location}.',
      vietnameseText: 'Tôi cần cảnh sát. Vị trí của tôi là: {location}.',
    },
    fr: {
      title: 'Police',
      localText: "J'ai besoin de la police. Ma position est : {location}.",
      vietnameseText: 'Tôi cần cảnh sát. Vị trí của tôi là: {location}.',
    },
    pl: {
      title: 'Policja',
      localText: 'Potrzebuję policji. Moja lokalizacja to: {location}.',
      vietnameseText: 'Tôi cần cảnh sát. Vị trí của tôi là: {location}.',
    },
    sk: {
      title: 'Polícia',
      localText: 'Potrebujem políciu. Moja poloha je: {location}.',
      vietnameseText: 'Tôi cần cảnh sát. Vị trí của tôi là: {location}.',
    },
  },
  fire: {
    en: {
      title: 'Fire',
      localText: 'There is a fire. My location is: {location}.',
      vietnameseText: 'Có cháy. Vị trí của tôi là: {location}.',
    },
    de: {
      title: 'Feuer',
      localText: 'Es gibt einen Brand. Mein Standort ist: {location}.',
      vietnameseText: 'Có cháy. Vị trí của tôi là: {location}.',
    },
    cs: {
      title: 'Požár',
      localText: 'Hoří. Moje poloha je: {location}.',
      vietnameseText: 'Có cháy. Vị trí của tôi là: {location}.',
    },
    vi: {
      title: 'Cháy nổ',
      localText: 'Có cháy. Vị trí của tôi là: {location}.',
      vietnameseText: 'Có cháy. Vị trí của tôi là: {location}.',
    },
    fr: {
      title: 'Incendie',
      localText: "Il y a un incendie. Ma position est : {location}.",
      vietnameseText: 'Có cháy. Vị trí của tôi là: {location}.',
    },
    pl: {
      title: 'Pożar',
      localText: 'Jest pożar. Moja lokalizacja to: {location}.',
      vietnameseText: 'Có cháy. Vị trí của tôi là: {location}.',
    },
    sk: {
      title: 'Požiar',
      localText: 'Horí. Moja poloha je: {location}.',
      vietnameseText: 'Có cháy. Vị trí của tôi là: {location}.',
    },
  },
  general112: {
    en: {
      title: '112 Emergency',
      localText: 'I need emergency help. My location is: {location}.',
      vietnameseText: 'Tôi cần hỗ trợ khẩn cấp. Vị trí của tôi là: {location}.',
    },
    de: {
      title: 'Notruf 112',
      localText: 'Ich brauche Hilfe im Notfall. Mein Standort ist: {location}.',
      vietnameseText: 'Tôi cần hỗ trợ khẩn cấp. Vị trí của tôi là: {location}.',
    },
    cs: {
      title: 'Tísňová linka 112',
      localText: 'Potřebuji naléhavou pomoc. Moje poloha je: {location}.',
      vietnameseText: 'Tôi cần hỗ trợ khẩn cấp. Vị trí của tôi là: {location}.',
    },
    vi: {
      title: 'Khẩn cấp 112',
      localText: 'Tôi cần hỗ trợ khẩn cấp. Vị trí của tôi là: {location}.',
      vietnameseText: 'Tôi cần hỗ trợ khẩn cấp. Vị trí của tôi là: {location}.',
    },
    fr: {
      title: 'Urgence 112',
      localText: "J'ai besoin d'aide d'urgence. Ma position est : {location}.",
      vietnameseText: 'Tôi cần hỗ trợ khẩn cấp. Vị trí của tôi là: {location}.',
    },
    pl: {
      title: 'Numer alarmowy 112',
      localText: 'Potrzebuję pomocy alarmowej. Moja lokalizacja to: {location}.',
      vietnameseText: 'Tôi cần hỗ trợ khẩn cấp. Vị trí của tôi là: {location}.',
    },
    sk: {
      title: 'Linka 112',
      localText: 'Potrebujem naliehavú pomoc. Moja poloha je: {location}.',
      vietnameseText: 'Tôi cần hỗ trợ khẩn cấp. Vị trí của tôi là: {location}.',
    },
  },
};

export function getEmergencyPhrasePack(input: {
  type: EmergencyType;
  country?: string;
  locationLabel?: string;
}): EmergencyPhrasePack {
  const lang = resolveLang(input.country);
  const base = byType[input.type][lang];
  const location = input.locationLabel?.trim() || 'unknown';
  const localText = base.localText.replace('{location}', location);
  const vietnameseText = base.vietnameseText.replace('{location}', location);
  return {
    title: base.title,
    localText,
    vietnameseText,
    cannotSpeakText: `${base.title}. ${localText}`,
  };
}
