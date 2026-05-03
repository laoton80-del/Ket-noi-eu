import { Router } from 'express';

import * as UserGdprController from '../controllers/UserGdprController';
import * as UserPersonaController from '../controllers/UserPersonaController';
import * as UserPushController from '../controllers/UserPushController';
import { authMiddleware } from '../middleware/authMiddleware';

export const userRouter = Router();

userRouter.use(authMiddleware);

userRouter.patch('/push-token', (req, res, next) => {
  void UserPushController.patchPushToken(req, res).catch(next);
});

userRouter.patch('/persona', (req, res, next) => {
  void UserPersonaController.patchPersona(req, res).catch(next);
});

userRouter.post('/gdpr/erase', (req, res, next) => {
  void UserGdprController.postGdprErase(req, res).catch(next);
});
