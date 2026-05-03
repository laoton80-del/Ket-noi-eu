import { Router } from 'express';

import * as PaymentController from '../controllers/PaymentController';
import { authMiddleware } from '../middleware/authMiddleware';

export const payRouter = Router();

payRouter.use(authMiddleware);

payRouter.post('/qr-merchant', (req, res, next) => {
  void PaymentController.postQrMerchant(req, res).catch(next);
});

payRouter.get('/merchant-ledger', (req, res, next) => {
  void PaymentController.getMerchantLedger(req, res).catch(next);
});

payRouter.get('/viet-qr', (req, res, next) => {
  void PaymentController.getMerchantVietQr(req, res).catch(next);
});
