import { Router } from 'express';

import * as AuthController from '../controllers/AuthController';
import { validateBody } from '../middleware/validateBody';
import {
  postEmailOtpRequestBodySchema,
  postEmailOtpVerifyBodySchema,
  postLoginBodySchema,
} from '../validation/authSchema';

export const authRouter = Router();

authRouter.post('/login', validateBody(postLoginBodySchema), (req, res, next) => {
  void AuthController.postLogin(req, res).catch(next);
});

authRouter.post('/email/otp/request', validateBody(postEmailOtpRequestBodySchema), (req, res, next) => {
  void AuthController.postEmailOtpRequest(req, res).catch(next);
});

authRouter.post('/email/otp/verify', validateBody(postEmailOtpVerifyBodySchema), (req, res, next) => {
  void AuthController.postEmailOtpVerify(req, res).catch(next);
});
