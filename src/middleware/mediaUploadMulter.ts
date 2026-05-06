import multer from 'multer';

import { MAX_MEDIA_UPLOAD_BYTES } from '../constants/mediaUploadLimits';

const imageMime = /^image\//i;

export const mediaImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MEDIA_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (imageMime.test(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('unsupported_media_type'));
  },
});
