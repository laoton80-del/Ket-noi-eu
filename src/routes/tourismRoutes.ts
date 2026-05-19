import { Router } from 'express';

import * as TourismController from '../controllers/TourismController';
import { authMiddleware } from '../middleware/authMiddleware';

export const tourismRouter = Router();

tourismRouter.get('/discover', (req, res, next) => {
  void TourismController.getDiscover(req, res).catch(next);
});

tourismRouter.post('/quote', authMiddleware, (req, res, next) => {
  void TourismController.postQuote(req, res).catch(next);
});

tourismRouter.post('/book', authMiddleware, (req, res, next) => {
  void TourismController.postBook(req, res).catch(next);
});

tourismRouter.get('/wrap/:bookingId', authMiddleware, (req, res, next) => {
  void TourismController.getViralWrap(req, res).catch(next);
});

tourismRouter.get('/bookings/merchant', authMiddleware, (req, res, next) => {
  void TourismController.getMerchantBookings(req, res).catch(next);
});

tourismRouter.post('/bookings/:bookingId/cancel', authMiddleware, (req, res, next) => {
  void TourismController.postCancelBooking(req, res).catch(next);
});

tourismRouter.post('/bookings/:bookingId/confirm', authMiddleware, (req, res, next) => {
  void TourismController.postConfirmBooking(req, res).catch(next);
});

tourismRouter.post('/bookings/:bookingId/complete', authMiddleware, (req, res, next) => {
  void TourismController.postCompleteBooking(req, res).catch(next);
});
