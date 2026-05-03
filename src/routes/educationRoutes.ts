import { Router } from 'express';

import * as EducationController from '../controllers/EducationController';
import { authMiddleware } from '../middleware/authMiddleware';

export const educationRouter = Router();

educationRouter.use(authMiddleware);

educationRouter.post('/complete-lesson', (req, res, next) => {
  void EducationController.postCompleteLesson(req, res).catch(next);
});

educationRouter.post('/piggy-bank', (req, res, next) => {
  void EducationController.postCreatePiggyBank(req, res).catch(next);
});
