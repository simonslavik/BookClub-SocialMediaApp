import multer, { MulterError } from 'multer';
import path from 'path';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Use memory storage — files are uploaded to Cloudinary, not saved to disk
export const bookClubImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Wraps a multer middleware so its errors return proper HTTP status codes
// (413 for too-large, 400 for everything else) instead of bubbling up as 500s.
export const wrapMulter = (
  middleware: RequestHandler,
  maxSizeLabel: string = '5MB',
): RequestHandler => (req: Request, res: Response, next: NextFunction) => {
  middleware(req, res, (err: any) => {
    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `Image is too large. Max size is ${maxSizeLabel}.` });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message || 'Invalid file upload.' });
    }
    next();
  });
};

export const chatFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip|mp4|mp3/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
