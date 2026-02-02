import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../services/user.service.js';
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
        }
        else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
        }
    }
});
// Add or update profile image (requires authentication)
export const addProfileImage = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        const imageUrl = `/uploads/profile-images/${req.file.filename}`;
        try {
            const updatedUser = await UserService.updateProfileImage(userId, imageUrl);
            logger.info({
                type: 'PROFILE_IMAGE_UPLOADED',
                userId,
                imageUrl
            });
            res.json({ message: 'Profile image uploaded successfully', imageUrl: updatedUser.profileImage });
        }
        catch (error) {
            // Clean up uploaded file if service fails
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            if (error.message === 'USER_NOT_FOUND') {
                return res.status(404).json({ error: 'User not found' });
            }
            throw error;
        }
    }
    catch (error) {
        logError(error, 'Error uploading profile image', { userId: req.user?.userId });
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload profile image' });
    }
};
export const deleteProfileImage = async (req, res) => {
    try {
        const userId = req.user.userId;
        await UserService.deleteProfileImage(userId);
        logger.info({
            type: 'PROFILE_IMAGE_DELETED',
            userId
        });
        res.json({ message: 'Profile image deleted successfully' });
    }
    catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ error: 'User not found' });
        }
        if (error.message === 'NO_PROFILE_IMAGE') {
            return res.status(400).json({ error: 'No profile image to delete' });
        }
        logError(error, 'Error deleting profile image', { userId: req.user?.userId });
        res.status(500).json({ error: 'Failed to delete profile image' });
    }
};
//# sourceMappingURL=profileImageController.js.map