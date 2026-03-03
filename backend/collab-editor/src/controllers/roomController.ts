import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { RoomService } from '../services/room.service.js';
import logger from '../utils/logger.js';

// Create a new room
export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const { name, description, type, memberIds } = req.body;
    const userId = req.user!.userId;
    
    const room = await RoomService.create(bookClubId, userId, { name, description, type, memberIds });
    
    res.json({ room, message: 'Room created successfully' });
  } catch (error: any) {
    logger.error('ERROR_CREATE_ROOM', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Room name is required') statusCode = 400;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message === 'You must be a member to create rooms') statusCode = 403;
    if (error.message === 'Only moderators and above can create rooms') statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to create room' });
  }
};

// Get all visible rooms in a bookclub
export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const userId = req.user!.userId;
    
    const rooms = await RoomService.getVisibleRooms(bookClubId, userId);
    
    res.json({ rooms });
  } catch (error: any) {
    logger.error('ERROR_FETCH_ROOMS', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

// Get messages in a specific room
export const getRoomMessages = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    
    const messages = await RoomService.getRoomMessages(roomId);
    
    res.json({ messages });
  } catch (error: any) {
    logger.error('ERROR_FETCH_MESSAGES', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Update a room
export const updateRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId, roomId } = req.params;
    const userId = req.user!.userId;
    const { name, description, type } = req.body;
    
    const room = await RoomService.update(bookClubId, roomId, userId, { name, description, type });
    
    res.json({ room, message: 'Room updated successfully' });
  } catch (error: any) {
    logger.error('ERROR_UPDATE_ROOM', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Room not found') statusCode = 404;
    if (error.message.includes('permission') || error.message.includes('Insufficient')) statusCode = 403;
    if (error.message.includes('Cannot change')) statusCode = 400;
    res.status(statusCode).json({ error: error.message || 'Failed to update room' });
  }
};

// Delete a room
export const deleteRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId, roomId } = req.params;
    const userId = req.user!.userId;
    
    await RoomService.delete(bookClubId, roomId, userId);
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error: any) {
    logger.error('ERROR_DELETE_ROOM', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Book club not found' || error.message === 'Room not found') statusCode = 404;
    if (error.message.includes('permission') || error.message.includes('Only')) statusCode = 403;
    if (error.message.includes('Cannot delete')) statusCode = 400;
    res.status(statusCode).json({ error: error.message || 'Failed to delete room' });
  }
};

// Add members to a private room
export const addRoomMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId, roomId } = req.params;
    const userId = req.user!.userId;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    await RoomService.addMembers(bookClubId, roomId, userId, userIds);
    res.json({ message: 'Members added successfully' });
  } catch (error: any) {
    logger.error('ERROR_ADD_ROOM_MEMBERS', { error: error.message });
    let statusCode = 500;
    if (error.message.includes('permission') || error.message.includes('Insufficient')) statusCode = 403;
    if (error.message === 'Room not found') statusCode = 404;
    if (error.message.includes('private')) statusCode = 400;
    res.status(statusCode).json({ error: error.message || 'Failed to add members' });
  }
};

// Remove a member from a private room
export const removeRoomMember = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId, roomId, userId: targetUserId } = req.params;
    const userId = req.user!.userId;

    await RoomService.removeMember(bookClubId, roomId, userId, targetUserId);
    res.json({ message: 'Member removed successfully' });
  } catch (error: any) {
    logger.error('ERROR_REMOVE_ROOM_MEMBER', { error: error.message });
    let statusCode = 500;
    if (error.message.includes('permission') || error.message.includes('Insufficient')) statusCode = 403;
    if (error.message === 'Room not found') statusCode = 404;
    res.status(statusCode).json({ error: error.message || 'Failed to remove member' });
  }
};

// Get members of a room
export const getRoomMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const members = await RoomService.getRoomMembers(roomId);
    res.json({ members });
  } catch (error: any) {
    logger.error('ERROR_FETCH_ROOM_MEMBERS', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch room members' });
  }
};
