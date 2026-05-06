import { Router } from 'express';

import * as WalletController from '../controllers/WalletController';
import { authMiddleware } from '../middleware/authMiddleware';
import { walletTransferRateLimitMiddleware } from '../middleware/walletTransferRateLimit';

export const walletRouter = Router();

walletRouter.use(authMiddleware);

walletRouter.get('/balance', (req, res, next) => {
  void WalletController.getBalance(req, res).catch(next);
});

walletRouter.post(
  '/transfer',
  walletTransferRateLimitMiddleware,
  (req, res, next) => {
    void WalletController.postTransfer(req, res).catch(next);
  }
);
