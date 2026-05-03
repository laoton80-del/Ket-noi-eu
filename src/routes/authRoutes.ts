import { Router } from 'express';

import * as AuthController from '../controllers/AuthController';

export const authRouter = Router();

authRouter.post('/login', (req, res, next) => {
  void AuthController.postLogin(req, res).catch(next);
});

authRouter.post('/email/otp/request', (req, res, next) => {
  void AuthController.postEmailOtpRequest(req, res).catch(next);
});

authRouter.post('/email/otp/verify', (req, res, next) => {
  void AuthController.postEmailOtpVerify(req, res).catch(next);
});
