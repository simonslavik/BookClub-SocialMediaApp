import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger, logError } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profile-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage,
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


// Add or update profile image (requires authentication)
export const addProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profileImage: true }
    });
    
    if (!user) {
      // Delete uploaded file if user doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete old image if exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '../..', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Update user with new image URL
    const imageUrl = `/uploads/profile-images/${req.file.filename}`;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: imageUrl }
    });
    
    logger.info({
      type: 'PROFILE_IMAGE_UPLOADED',
      userId,
      imageUrl
    });
    res.json({ message: 'Profile image uploaded successfully', imageUrl: updatedUser.profileImage });
  } catch (error) {
    logError(error, 'Error uploading profile image', { userId: req.user?.userId });
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
};


export const deleteProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profileImage: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.profileImage) {
      return res.status(400).json({ error: 'No profile image to delete' });
    }
    
    // Delete image file
    const imagePath = path.join(__dirname, '../..', user.profileImage);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // Update user to remove profile image URL
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: null }
    });
    
    logger.info({
      type: 'PROFILE_IMAGE_DELETED',
      userId
    });
    res.json({ message: 'Profile image deleted successfully' });
  } catch (error) {
    logError(error, 'Error deleting profile image', { userId: req.user?.userId });
    res.status(500).json({ error: 'Failed to delete profile image' });
  }
};
