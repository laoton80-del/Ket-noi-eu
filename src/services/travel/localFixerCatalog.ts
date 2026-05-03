import type { Iso4217Code } from '../../config/globalLocalization';

export type LocalFixerProfile = Readonly<{
  id: string;
  displayName: string;
  headlineVi: string;
  cityLabel: string;
  countryCode: string;
  skillsVi: readonly string[];
  /** Hourly anchor in EUR (B2C display converted via `regionMoneyFromEur`). */
  hourlyRateEur: number;
  rating: number;
  jobsCompleted: number;
  responseMinutes: number;
}>;

export const LOCAL_FIXER_PROFILES: readonly LocalFixerProfile[] = [
  {
    id: 'fixer-tuan-paris',
    displayName: 'Tuấn',
    headlineVi: 'Du học sinh Paris — Lái xe & Phiên dịch',
    cityLabel: 'Paris, FR',
    countryCode: 'FR',
    skillsVi: ['Lái xe sân bay', 'Phiên dịch y tế', 'Shopping điện thoại'],
    hourlyRateEur: 32,
    rating: 4.95,
    jobsCompleted: 128,
    responseMinutes: 12,
  },
  {
    id: 'fixer-lan-berlin',
    displayName: 'Lan',
    headlineVi: 'Chuyên gia săn hàng hiệu Berlin',
    cityLabel: 'Berlin, DE',
    countryCode: 'DE',
    skillsVi: ['Outlet & VAT refund', 'Tiếng Đức-Việt', 'Booking showroom'],
    hourlyRateEur: 45,
    rating: 4.88,
    jobsCompleted: 84,
    responseMinutes: 25,
  },
  {
    id: 'fixer-minh-prague',
    displayName: 'Minh Khôi',
    headlineVi: 'Sinh viên Y Praha — Hỗ trợ bệnh viện & thuốc',
    cityLabel: 'Praha, CZ',
    countryCode: 'CZ',
    skillsVi: ['Phiên dịch bệnh viện', 'Mua thuốc', 'GrabFood đồ Việt'],
    hourlyRateEur: 28,
    rating: 4.92,
    jobsCompleted: 201,
    responseMinutes: 8,
  },
  {
    id: 'fixer-huong-vienna',
    displayName: 'Hương',
    headlineVi: 'HR kiều bào Wien — Nhà & hợp đồng thuê',
    cityLabel: 'Wien, AT',
    countryCode: 'AT',
    skillsVi: ['Xem nhà', 'Đọc hợp đồng tiếng Đức', 'Đăng ký cư trú'],
    hourlyRateEur: 38,
    rating: 4.79,
    jobsCompleted: 56,
    responseMinutes: 40,
  },
];
