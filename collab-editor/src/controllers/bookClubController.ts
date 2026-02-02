import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInviteCode } from '../utils/inviteCodeGenerator.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Helper type for active bookclubs
interface ActiveClient {
  id: string;
  userId: string;
  username: string;
}

interface ActiveBookClub {
  clients: Map<string, any>;
}

let activeBookClubs: Map<string, ActiveBookClub>;

export const setActiveBookClubs = (clubs: Map<string, ActiveBookClub>) => {
  activeBookClubs = clubs;
};

// Create new bookclub
export const createBookClub = async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, isPublic } = req.body;
    const userId = req.user!.userId;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Book club name is required' });
    }
    
    // Generate unique invite code
    let code = generateInviteCode();
    let existing = await prisma.bookClubInvite.findUnique({ where: { code } });
    while (existing) {
      code = generateInviteCode();
      existing = await prisma.bookClubInvite.findUnique({ where: { code } });
    }
    
    const bookClub = await prisma.bookClub.create({
      data: {
        name: name.trim(),
        category: category || 'General',
        isPublic: isPublic !== false,
        members: [userId],
        creatorId: userId,
        rooms: {
          create: {
            name: 'general'
          }
        },
        invites: {
          create: {
            code,
            createdBy: userId,
            expiresAt: null,
            maxUses: null
          }
        }
      },
      include: { rooms: true, invites: true }
    });
    
    console.log(`✨ Book club created by user ${userId}: ${bookClub.id} with permanent invite: ${code}`);
    res.json({ bookClubId: bookClub.id, message: 'Book club created successfully', bookClub });
  } catch (error) {
    console.error('Error creating book club:', error);
    res.status(500).json({ error: 'Failed to create book club' });
  }
};

// Get bookclub info
export const getBookClub = async (req: Request, res: Response) => {
  try {
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: req.params.bookClubId },
      include: { 
        rooms: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    const activeClub = activeBookClubs?.get(req.params.bookClubId);
    
    // Fetch full user details for all members from user-service
    let members = bookClub.members; // Keep original member IDs as fallback
    if (bookClub.members && bookClub.members.length > 0) {
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
        const response = await fetch(`${userServiceUrl}/users/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: bookClub.members })
        });
        
        if (response.ok) {
          const data: any = await response.json();
          if (data.users && data.users.length > 0) {
            members = data.users;
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch user details from user-service:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }
    
    res.json({
      ...bookClub,
      members,
      connectedUsers: activeClub 
        ? Array.from(activeClub.clients.values())
            .filter((c: any) => !c.isDMConnection) // Exclude DM connections
            .reduce((acc: any[], c: any) => {
              // Only add if this userId hasn't been added yet
              if (!acc.find(user => user.userId === c.userId)) {
                acc.push({
                  id: c.id,
                  username: c.username,
                  userId: c.userId
                });
              }
              return acc;
            }, [])
        : []
    });
  } catch (error) {
    console.error('Error fetching book club:', error);
    res.status(500).json({ error: 'Failed to fetch book club' });
  }
};

// Update bookclub
export const updateBookClub = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const { name, isPublic } = req.body;
    const userId = req.user!.userId;
    
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    if (bookClub.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the book club creator can update the book club' });
    }
    
    const updatedBookClub = await prisma.bookClub.update({
      where: { id: bookClubId },
      data: {
        name: name !== undefined ? name.trim() : bookClub.name,
        isPublic: isPublic !== undefined ? isPublic : bookClub.isPublic
      }
    });
    
    console.log(`✏️ Book club ${bookClubId} updated by user ${userId}`);
    res.json({ message: 'Book club updated successfully', bookClub: updatedBookClub });
  } catch (error) {
    console.error('Error updating book club:', error);
    res.status(500).json({ error: 'Failed to update book club' });
  }
};

// Get all bookclubs
export const getAllBookClubs = async (req: Request, res: Response) => {
  try {
    const { mine } = req.query;
    const authReq = req as AuthRequest;
    
    // If 'mine' query param is set and user is authenticated, return only user's bookclubs
    const where = mine === 'true' && authReq.user 
      ? { members: { has: authReq.user.userId } }
      : { isPublic: true };
    
    const bookClubs = await prisma.bookClub.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    // Collect all unique user IDs from all bookclubs
    const allUserIds = new Set<string>();
    bookClubs.forEach(club => {
      club.members.forEach(memberId => allUserIds.add(memberId));
    });

    // Fetch full user details for all members from user-service
    let userDetailsMap = new Map<string, any>();
    if (allUserIds.size > 0) {
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
        const response = await fetch(`${userServiceUrl}/users/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: Array.from(allUserIds) })
        });
        
        if (response.ok) {
          const data: any = await response.json();
          if (data.users && data.users.length > 0) {
            data.users.forEach((user: any) => {
              userDetailsMap.set(user.id, user);
            });
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch user details from user-service:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }
    
    // Fetch current books for all bookclubs from books-service
    const currentBooksMap = new Map<string, any>();
    try {
      const booksServiceUrl = process.env.BOOKS_SERVICE_URL || 'http://localhost:3002';
      const currentBookPromises = bookClubs.map(async (club) => {
        try {
          const response = await fetch(`${booksServiceUrl}/v1/bookclub/${club.id}/books?status=current`);
          if (response.ok) {
            const data: any = await response.json();
            if (data.success && data.data && data.data.length > 0) {
              currentBooksMap.set(club.id, data.data[0]);
            }
          }
        } catch (err) {
          console.error(`Error fetching current book for bookclub ${club.id}:`, err);
        }
      });
      await Promise.all(currentBookPromises);
    } catch (error) {
      console.error('Error fetching current books:', error);
    }
    
    // Add active user count, member details, and current book to each bookclub
    const bookClubsWithUserCount = bookClubs.map(club => {
      const activeClub = activeBookClubs?.get(club.id);
      
      // Count unique users (not connections) - filter out DM connections and count unique userIds
      let uniqueActiveUsers = 0;
      if (activeClub) {
        const uniqueUserIds = new Set<string>();
        activeClub.clients.forEach(client => {
          if (!client.isDMConnection && client.userId) {
            uniqueUserIds.add(client.userId);
          }
        });
        uniqueActiveUsers = uniqueUserIds.size;
      }
      
      // Map member IDs to full user objects
      const memberDetails = club.members
        .map(memberId => userDetailsMap.get(memberId))
        .filter(user => user !== undefined);
      
      return {
        ...club,
        members: memberDetails.length > 0 ? memberDetails : club.members,
        activeUsers: uniqueActiveUsers,
        currentBook: currentBooksMap.get(club.id) || null
      };
    });
    
    res.json({ bookClubs: bookClubsWithUserCount });
  } catch (error) {
    console.error('Error fetching book clubs:', error);
    res.status(500).json({ error: 'Failed to fetch book clubs' });
  }
};

// Get my bookclubs
export const getMyBookClubs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const bookClubs = await prisma.bookClub.findMany({
      where: { creatorId: userId },
      orderBy: { updatedAt: 'desc' }
    });
    
    // Add active user count and member count to each bookclub
    const bookClubsWithUserCount = bookClubs.map(club => {
      const activeClub = activeBookClubs?.get(club.id);
      
      // Count unique users (not connections) - filter out DM connections and count unique userIds
      let uniqueActiveUsers = 0;
      if (activeClub) {
        const uniqueUserIds = new Set<string>();
        activeClub.clients.forEach(client => {
          if (!client.isDMConnection && client.userId) {
            uniqueUserIds.add(client.userId);
          }
        });
        uniqueActiveUsers = uniqueUserIds.size;
      }
      
      return {
        ...club,
        activeUsers: uniqueActiveUsers,
        memberCount: club.members.length
      };
    });

    // Fetch current books for each bookclub from books-service
    const currentBooksPromises = bookClubsWithUserCount.map(async (club) => {
      try {
        const response = await fetch(`${process.env.BOOKS_SERVICE_URL}/v1/bookclub/${club.id}/books?status=current`);
        if (response.ok) {
          const data: any = await response.json();
          return { bookClubId: club.id, currentBook: data.data?.[0] || null };
        }
      } catch (error) {
        console.error(`Error fetching current book for bookclub ${club.id}:`, error);
      }
      return { bookClubId: club.id, currentBook: null };
    });

    const currentBooksResults = await Promise.all(currentBooksPromises);
    const currentBooksMap = new Map(currentBooksResults.map(r => [r.bookClubId, r.currentBook]));

    // Add current book to each bookclub
    const bookClubsWithCurrentBook = bookClubsWithUserCount.map(club => ({
      ...club,
      currentBook: currentBooksMap.get(club.id) || null
    }));
    
    res.json({ bookClubs: bookClubsWithCurrentBook });
  } catch (error) {
    console.error('Error fetching user bookclubs:', error);
    res.status(500).json({ error: 'Failed to fetch user bookclubs' });
  }
};

// Upload bookclub image
export const uploadBookClubImage = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const userId = req.user!.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      // Delete uploaded file if bookclub doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    if (bookClub.creatorId !== userId) {
      // Delete uploaded file if user is not the creator
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Only the book club creator can upload images' });
    }
    
    // Delete old image if exists
    if (bookClub.imageUrl) {
      const oldImagePath = path.join(__dirname, '../..', bookClub.imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Update bookclub with new image URL
    const imageUrl = `/uploads/bookclub-images/${req.file.filename}`;
    const updatedBookClub = await prisma.bookClub.update({
      where: { id: bookClubId },
      data: { imageUrl }
    });
    
    console.log(`📷 Image uploaded for book club ${bookClubId}`);
    res.json({ message: 'Image uploaded successfully', imageUrl: updatedBookClub.imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

// Delete bookclub image
export const deleteBookClubImage = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const userId = req.user!.userId;
    
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    if (bookClub.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the book club creator can delete images' });
    }
    
    if (!bookClub.imageUrl) {
      return res.status(400).json({ error: 'Book club has no image to delete' });
    }
    
    // Delete image file
    const imagePath = path.join(__dirname, '../..', bookClub.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // Update bookclub to remove image URL
    await prisma.bookClub.update({
      where: { id: bookClubId },
      data: { imageUrl: null }
    });
    
    console.log(`🗑️  Image deleted for book club ${bookClubId}`);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};
