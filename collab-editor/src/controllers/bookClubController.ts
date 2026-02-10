import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { BookClubService } from '../services/bookClub.service.js';
import { BookClubRole } from '@prisma/client';

// Helper type for active bookclubs
interface ActiveClient {
  id: string;
  userId: string;
  username: string;
}

interface ActiveBookClub {
  clients: Map<string, any>;
}

export const setActiveBookClubs = (clubs: Map<string, ActiveBookClub>) => {
  BookClubService.setActiveBookClubs(clubs);
};

// Create new bookclub (legacy endpoint)
export const createBookClub = async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, isPublic, description } = req.body;
    const userId = req.user!.userId;
    
    const bookClub = await BookClubService.createClub(userId, {
      name,
      category: category || 'General',
      description: description || '',
      visibility: isPublic ? 'PUBLIC' : 'PRIVATE',
      requiresApproval: false,
    });
    
    res.json({ bookClubId: bookClub.id, message: 'Book club created successfully', bookClub });
  } catch (error: any) {
    console.error('Error creating book club:', error);
    const statusCode = error.message === 'Book club name is required' ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to create book club' });
  }
};

// Get bookclub info (legacy endpoint)
export const getBookClub = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const bookClubId = req.params.bookClubId;
    
    // Try to get full club data if user is a member, otherwise preview
    let bookClub;
    if (userId) {
      try {
        bookClub = await BookClubService.getClub(bookClubId, userId);
      } catch (error) {
        // If not a member, get preview
        bookClub = await BookClubService.getClubPreview(bookClubId, userId);
      }
    } else {
      bookClub = await BookClubService.getClubPreview(bookClubId);
    }
    
    res.json(bookClub);
  } catch (error: any) {
    console.error('Error fetching book club:', error);
    const statusCode = error.message === 'Book club not found' ? 404 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to fetch book club' });
  }
};

// Update bookclub (legacy endpoint)
export const updateBookClub = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const { name, isPublic, description, category } = req.body;
    const userId = req.user!.userId;
    
    const settings: any = {};
    if (name !== undefined) settings.name = name;
    if (description !== undefined) settings.description = description;
    if (category !== undefined) settings.category = category;
    if (isPublic !== undefined) settings.visibility = isPublic ? 'PUBLIC' : 'PRIVATE';
    
    const updatedBookClub = await BookClubService.updateClubSettings(bookClubId, userId, settings);
    
    res.json({ message: 'Book club updated successfully', bookClub: updatedBookClub });
  } catch (error: any) {
    console.error('Error updating book club:', error);
    let statusCode = 500;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message.includes('permission')) statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to update book club' });
  }
};

// Get all bookclubs (legacy endpoint)
export const getAllBookClubs = async (req: Request, res: Response) => {
  try {
    const { mine } = req.query;
    const authReq = req as AuthRequest;
    
    const userId = authReq.user?.userId;
    
    if (mine === 'true' && userId) {
      // Get user's bookclubs
      const members = await BookClubService.getUserBookClubs(userId);
      const bookClubs = members.map(m => m.bookClub);
      return res.json({ bookClubs });
    }
    
    // Discover all visible clubs
    const clubs = await BookClubService.discoverClubs(userId);
    res.json({ bookClubs: clubs });
  } catch (error: any) {
    console.error('Error fetching book clubs:', error);
    res.status(500).json({ error: 'Failed to fetch book clubs' });
  }
};

// Get my bookclubs (legacy endpoint)
export const getMyBookClubs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const members = await BookClubService.getUserBookClubs(userId);
    const bookClubs = members.map(m => m.bookClub);
    
    res.json({ bookClubs });
  } catch (error: any) {
    console.error('Error fetching user bookclubs:', error);
    res.status(500).json({ error: 'Failed to fetch user bookclubs' });
  }
};

// Upload bookclub image (legacy endpoint)
export const uploadBookClubImage = async (req: AuthRequest, res: Response) => {
  try {
    const bookClubId = req.params.id;
    const userId = req.user!.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Check permission and update image
    const hasPermission = await BookClubService.checkPermission(bookClubId, userId, BookClubRole.ADMIN);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Only admins can change the bookclub image' });
    }
    
    const imageUrl = `/uploads/bookclub-images/${req.file.filename}`;
    await BookClubService.updateClub(bookClubId, userId, { imageUrl });
    
    res.json({ message: 'Image uploaded successfully', imageUrl });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    let statusCode = 500;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message.includes('permission')) statusCode = 403;
    if (error.message === 'No image file provided') statusCode = 400;
    res.status(statusCode).json({ error: error.message || 'Failed to upload image' });
  }
};

// Delete bookclub image (legacy endpoint)
export const deleteBookClubImage = async (req: AuthRequest, res: Response) => {
  try {
    const bookClubId = req.params.id;
    const userId = req.user!.userId;
    
    const hasPermission = await BookClubService.checkPermission(bookClubId, userId, BookClubRole.ADMIN);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Only admins can delete the bookclub image' });
    }
    await BookClubService.updateClub(bookClubId, userId, { imageUrl: null });
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    let statusCode = 500;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message.includes('permission')) statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to delete image' });
  }
};
