/**
 * Demo B2B-linked Vietnamese / diaspora restaurant rows for Travel "Cravings Radar".
 * Coordinates are approximate city anchors; distance is recomputed from live GPS in `travelCravingsRadar`.
 */

import type { B2BBusinessType } from '../domain/b2b/models';

export type B2bVietRestaurantGeoRow = Readonly<{
  id: string;
  name: string;
  cityLabel: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  rating: number;
  b2bTenantId: string;
  b2bLocationId: string;
  businessType: Extract<B2BBusinessType, 'restaurant'>;
  taglineVi: string;
}>;

export const B2B_VIET_RESTAURANT_GEO: readonly B2bVietRestaurantGeoRow[] = [
  {
    id: 'b2b-rest-prague-pho',
    name: 'Phở Việt Praha',
    cityLabel: 'Praha · Staré Město',
    countryCode: 'CZ',
    latitude: 50.088,
    longitude: 14.4208,
    rating: 4.9,
    b2bTenantId: 'tenant-pho-prague',
    b2bLocationId: 'loc-prague-pho-1',
    businessType: 'restaurant',
    taglineVi: 'Nước dùng ninh 12h — thịt tái, gầu, gân.',
  },
  {
    id: 'b2b-rest-berlin-songque',
    name: 'Sông Quê Berlin',
    cityLabel: 'Berlin · Mitte',
    countryCode: 'DE',
    latitude: 52.5244,
    longitude: 13.4105,
    rating: 4.7,
    b2bTenantId: 'tenant-songque-berlin',
    b2bLocationId: 'loc-berlin-sq-1',
    businessType: 'restaurant',
    taglineVi: 'Bún chả Hà Nội & nem rán kiểu nhà.',
  },
  {
    id: 'b2b-rest-paris-13',
    name: 'Quán Phở Paris 13',
    cityLabel: 'Paris · 13e',
    countryCode: 'FR',
    latitude: 48.822,
    longitude: 2.3655,
    rating: 4.8,
    b2bTenantId: 'tenant-pho-paris-13',
    b2bLocationId: 'loc-paris-13-1',
    businessType: 'restaurant',
    taglineVi: 'Phở gà ta, bánh cuốn nóng hổi.',
  },
  {
    id: 'b2b-rest-vienna-dong',
    name: 'Đông Dương Vienna',
    cityLabel: 'Wien · Innere Stadt',
    countryCode: 'AT',
    latitude: 48.2082,
    longitude: 16.3738,
    rating: 4.6,
    b2bTenantId: 'tenant-dongduong-vie',
    b2bLocationId: 'loc-vie-dd-1',
    businessType: 'restaurant',
    taglineVi: 'Cơm tấm sườn nướng & chả trứng hấp dẫn.',
  },
  {
    id: 'b2b-rest-warsaw-mekong',
    name: 'Mekong Bistro Warszawa',
    cityLabel: 'Warszawa · Śródmieście',
    countryCode: 'PL',
    latitude: 52.2319,
    longitude: 21.0067,
    rating: 4.5,
    b2bTenantId: 'tenant-mekong-pl',
    b2bLocationId: 'loc-waw-mekong-1',
    businessType: 'restaurant',
    taglineVi: 'Bánh mì Sài Gòn giòn rụm, sữa đậu nành.',
  },
  {
    id: 'b2b-rest-budapest-saigon',
    name: 'Saigon Corner Budapest',
    cityLabel: 'Budapest · District V',
    countryCode: 'HU',
    latitude: 47.4979,
    longitude: 19.0402,
    rating: 4.55,
    b2bTenantId: 'tenant-saigoncorner-hu',
    b2bLocationId: 'loc-bud-sg-1',
    businessType: 'restaurant',
    taglineVi: 'Bún bò Huế cay nồng, chả giò chấm mắm me.',
  },
  {
    id: 'b2b-rest-brussels-lotus',
    name: 'Lotus Kitchen Brussels',
    cityLabel: 'Bruxelles · Ixelles',
    countryCode: 'BE',
    latitude: 50.8245,
    longitude: 4.3676,
    rating: 4.65,
    b2bTenantId: 'tenant-lotus-be',
    b2bLocationId: 'loc-bru-lotus-1',
    businessType: 'restaurant',
    taglineVi: 'Gỏi cuốn tôm thịt & chè ba màu.',
  },
  {
    id: 'b2b-rest-amsterdam-canal',
    name: 'Canal Phở Amsterdam',
    cityLabel: 'Amsterdam · Centrum',
    countryCode: 'NL',
    latitude: 52.3676,
    longitude: 4.9041,
    rating: 4.7,
    b2bTenantId: 'tenant-canalpho-nl',
    b2bLocationId: 'loc-ams-cp-1',
    businessType: 'restaurant',
    taglineVi: 'Phở chay nấm & gỏi ngó sen tôm.',
  },
  {
    id: 'b2b-rest-munich-bamboo',
    name: 'Bamboo House München',
    cityLabel: 'München · Maxvorstadt',
    countryCode: 'DE',
    latitude: 48.1374,
    longitude: 11.5755,
    rating: 4.72,
    b2bTenantId: 'tenant-bamboo-muc',
    b2bLocationId: 'loc-muc-bh-1',
    businessType: 'restaurant',
    taglineVi: 'Bún riêu cua & nem nướng Nha Trang.',
  },
  {
    id: 'b2b-rest-london-shoreditch',
    name: 'Việt Kitchen Shoreditch',
    cityLabel: 'London · E1',
    countryCode: 'GB',
    latitude: 51.5246,
    longitude: -0.0772,
    rating: 4.85,
    b2bTenantId: 'tenant-vietkitchen-uk',
    b2bLocationId: 'loc-lon-vk-1',
    businessType: 'restaurant',
    taglineVi: 'Bánh xèo miền Tây & nước mía tươi.',
  },
];
