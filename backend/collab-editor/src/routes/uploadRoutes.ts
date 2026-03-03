import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { chatFileUpload } from '../config/multer.js';
import {
  uploadChatFile,
  deleteChatFile
} from '../controllers/uploadController.js';

const router = Router();

// Upload chat file
router.post('/chat-file', authMiddleware, chatFileUpload.single('file'), uploadChatFile);

// Delete chat file
router.delete('/chat-files/:fileId', authMiddleware, deleteChatFile);

export default router;
