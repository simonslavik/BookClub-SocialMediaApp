import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

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

    console.log(`📎 File uploaded: ${req.file.originalname} by user ${req.user!.userId}`);
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
    console.error('Error uploading chat file:', error);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
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
    
    console.log(`🗑️  Chat file deleted: ${file.originalName}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
