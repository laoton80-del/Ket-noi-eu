import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import * as MediaUploadController from '../controllers/MediaUploadController';
import { authMiddleware } from '../middleware/authMiddleware';
import { mediaImageUpload } from '../middleware/mediaUploadMulter';
import { jsonFail } from '../utils/apiEnvelope';

export const mediaRouter = Router();

function handleMulterImage(req: Request, res: Response, next: NextFunction): void {
  mediaImageUpload.single('image')(req, res, (err: unknown) => {
    if (!err) {
      void MediaUploadController.postMerchantImage(req, res).catch(next);
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        jsonFail(res, 'Media exceeds maximum size (2MB)', 413);
        return;
      }
      jsonFail(res, 'Invalid upload', 400);
      return;
    }
    if (err instanceof Error && err.message === 'unsupported_media_type') {
      jsonFail(res, 'Only image uploads are allowed', 415);
      return;
    }
    next(err);
  });
}

mediaRouter.post('/image', authMiddleware, handleMulterImage);
