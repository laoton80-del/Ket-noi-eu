export type MerchantCategory = 'Nails' | 'Restaurant' | 'Legal' | 'Translation';

export interface Merchant {
  id: string;
  name: string;
  category: MerchantCategory;
  rating: number;
  isAiActive: boolean;
}

export const B2B2C_MERCHANTS: Merchant[] = [
  {
    id: 'm_nail_prague_lotus',
    name: 'Lotus Nail Studio Praha',
    category: 'Nails',
    rating: 4.8,
    isAiActive: true,
  },
  {
    id: 'm_legal_brno_hanhphuc',
    name: 'Hanh Phuc Legal Desk Brno',
    category: 'Legal',
    rating: 4.7,
    isAiActive: true,
  },
  {
    id: 'm_rest_berlin_songque',
    name: 'Song Que Dining Berlin',
    category: 'Restaurant',
    rating: 4.6,
    isAiActive: false,
  },
  {
    id: 'm_trans_vienna_vietbridge',
    name: 'VietBridge Translation Vienna',
    category: 'Translation',
    rating: 4.9,
    isAiActive: true,
  },
];
