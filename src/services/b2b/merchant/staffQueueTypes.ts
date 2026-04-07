import type { BusinessBooking, BusinessOrder } from '../../../domain/b2b/models';

/**
 * One row in the merchant/staff operational queue (bookings + orders).
 * Populated from Firestore (dev client read) or HTTPS `b2bStaffQueueSnapshot` (admin read, claim-scoped).
 */
export type LiveStaffQueueRow = {
  id: string;
  source: 'booking' | 'order';
  updatedAtLabel: string;
  customerLabel: string;
  headline: string;
  operationalLine: string;
  escalationHint?: string;
  staffHandoffSummary: string;
  b2bVertical?: BusinessBooking['b2bVertical'];
  /** Truth UX — booking domain */
  bookingStatus?: BusinessBooking['status'];
  isInquiryOnly?: boolean;
  /** Truth UX — order domain */
  orderStatus?: BusinessOrder['status'];
  wholesaleQualification?: BusinessOrder['wholesaleQualification'];
  /** How this row reached the client (avoid silent demo/live confusion). */
  queueDataSource?: 'firestore_client_dev' | 'functions_https';
};
