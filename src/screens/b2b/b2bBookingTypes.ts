/** Shared B2B salon booking dashboard model (UI + Leona routing). */

export type ServiceTagId = 'manicure' | 'gel_x' | 'pedicure';

export type WaitlistStatus = 'confirmed' | 'waiting';

export type WaitlistEntry = Readonly<{
  id: string;
  clientName: string;
  status: WaitlistStatus;
  tags: readonly ServiceTagId[];
  priceLabel: string;
}>;

export type TimelineBlock = Readonly<{
  id: string;
  techIndex: 0 | 1 | 2;
  clientName: string;
  status: WaitlistStatus;
  tag: ServiceTagId;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}>;
