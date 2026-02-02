import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

// Create a new room
export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const { name } = req.body;
    const userId = req.user!.userId;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    // Check if user is a member of the bookclub
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    if (!bookClub.members.includes(userId)) {
      return res.status(403).json({ error: 'You must be a member to create rooms' });
    }
    
    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        bookClubId
      }
    });
    
    console.log(`📁 Room created in book club ${bookClubId}: ${room.name}`);
    res.json({ room, message: 'Room created successfully' });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

// Get all rooms in a bookclub
export const getRooms = async (req: Request, res: Response) => {
  try {
    const { bookClubId } = req.params;
    
    const rooms = await prisma.room.findMany({
      where: { bookClubId },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

// Get messages in a specific room
export const getRoomMessages = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    
    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        attachments: true
      }
    });
    
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Delete a room
export const deleteRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId, roomId } = req.params;
    const userId = req.user!.userId;
    
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    // Only creator can delete rooms
    if (bookClub.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the book club creator can delete rooms' });
    }
    
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Prevent deletion of the last room
    const roomCount = await prisma.room.count({
      where: { bookClubId }
    });
    
    if (roomCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last room in a book club' });
    }
    
    await prisma.room.delete({
      where: { id: roomId }
    });
    
    console.log(`🗑️  Room ${roomId} deleted from book club ${bookClubId}`);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
};
