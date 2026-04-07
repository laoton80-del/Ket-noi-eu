export type HolidayItem = {
  key: string;
  name: string;
  month: number;
  day: number;
  country: string;
  tags: Array<'family' | 'administrative' | 'travel' | 'closure'>;
};

/** Fixed-date holiday seed for VN (kept lightweight for local product actions). */
export const VN_HOLIDAYS: HolidayItem[] = [
  { key: 'vn-new-year', name: 'Tết Dương lịch', month: 1, day: 1, country: 'VN', tags: ['family', 'closure'] },
  { key: 'vn-liberation', name: 'Ngày Giải phóng', month: 4, day: 30, country: 'VN', tags: ['administrative', 'closure'] },
  { key: 'vn-labor-day', name: 'Quốc tế Lao động', month: 5, day: 1, country: 'VN', tags: ['administrative', 'closure'] },
  { key: 'vn-national-day', name: 'Quốc khánh', month: 9, day: 2, country: 'VN', tags: ['administrative', 'closure'] },
];
