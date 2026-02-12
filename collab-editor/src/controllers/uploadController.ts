import { Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload chat file
export const uploadChatFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/chat-files/${req.file.filename}`;
    
    // Save file metadata to database
    const chatFile = await prisma.chatFile.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        uploadedBy: req.user!.userId
      }
    });

    logger.info('FILE_UPLOADED', { originalName: req.file.originalname, userId: req.user!.userId });
    res.json({ 
      success: true, 
      data: {
        id: chatFile.id,
        url: fileUrl,
        filename: chatFile.originalName,
        mimetype: chatFile.mimetype,
        size: chatFile.size
      }
    });
  } catch (error) {
    logger.error('ERROR_UPLOAD_FILE', { error: error instanceof Error ? error.message : 'Unknown error' });
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore cleanup errors
      }
    }
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

// Delete chat file
export const deleteChatFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.userId;
    
    const file = await prisma.chatFile.findUnique({
      where: { id: fileId }
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if user owns the file
    if (file.uploadedBy !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Delete from filesystem
    const filePath = path.join(__dirname, '../..', file.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    await prisma.chatFile.delete({
      where: { id: fileId }
    });
    
    logger.info('FILE_DELETED', { originalName: file.originalName });
    res.json({ success: true });
  } catch (error) {
    logger.error('ERROR_DELETE_FILE', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
