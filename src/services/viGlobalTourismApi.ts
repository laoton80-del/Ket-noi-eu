import { restApiFetchJson, type ApiRequestResult } from './apiClient';

export type TourismDiscoverBusiness = Readonly<{
  id: string;
  name: string;
  category: string;
  locationLat: number;
  locationLng: number;
  description: string;
  isTopAd: boolean;
  tourismServices: ReadonlyArray<
    Readonly<{
      id: string;
      title: string;
      priceVIG: number;
      description: string;
    }>
  >;
}>;

export type TourismDiscoverPayload = Readonly<{
  stays: readonly TourismDiscoverBusiness[];
  tours: readonly TourismDiscoverBusiness[];
  gastronomy: readonly TourismDiscoverBusiness[];
  localFixers: readonly TourismDiscoverBusiness[];
}>;

export type PostTourismBookBody = Readonly<{
  businessId: string;
  serviceId: string;
  startDate: string;
  endDate: string;
  guestCount: number;
}>;

export type TourismBookResponse = Readonly<{
  booking: Readonly<{
    id: string;
    userId: string;
    businessId: string;
    serviceId: string;
    startDate: string;
    endDate: string;
    guestCount: number;
    status: string;
    providerFeeVIG: number;
    touristFeeVIG: number;
    totalPaidVIG: number;
    netProviderEarningsVIG: number;
  }>;
}>;

/** Public discovery feed for the inbound hub (no JWT required). */
export async function fetchTourismDiscover(): Promise<ApiRequestResult<TourismDiscoverPayload>> {
  return restApiFetchJson<TourismDiscoverPayload>('/api/tourism/discover', {
    method: 'GET',
    skipAuth: true,
  });
}

/** Creates a tourism booking and atomically locks VIG on the tourist wallet. */
export async function postTourismBook(
  body: PostTourismBookBody
): Promise<ApiRequestResult<TourismBookResponse>> {
  return restApiFetchJson<TourismBookResponse>('/api/tourism/book', { method: 'POST', body });
}
