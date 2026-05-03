import { Router } from 'express';

import * as BookingController from '../controllers/BookingController';
import { authMiddleware } from '../middleware/authMiddleware';

export const bookingRouter = Router();

bookingRouter.use(authMiddleware);

bookingRouter.post('/', (req, res, next) => {
  void BookingController.postCreateBooking(req, res).catch(next);
});

bookingRouter.post('/complete-via-qr', (req, res, next) => {
  void BookingController.postCompleteBookingViaQr(req, res).catch(next);
});

bookingRouter.post('/cancel', (req, res, next) => {
  void BookingController.postCancelBooking(req, res).catch(next);
});

/** @deprecated Insecure without QR — returns 410; use POST /complete-via-qr. */
bookingRouter.post('/complete', (req, res, next) => {
  void BookingController.postCompleteBookingLegacy(req, res).catch(next);
});
