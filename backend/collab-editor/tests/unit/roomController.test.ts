// Mock dependencies
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {},
}));

const mockRoomService = {
  create: jest.fn(),
  getRooms: jest.fn(),
  getRoomMessages: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../src/services/room.service', () => ({
  RoomService: mockRoomService,
}));

import { Request, Response } from 'express';
import { createRoom, getRooms, getRoomMessages, deleteRoom } from '../../src/controllers/roomController';

const mockReq = (overrides: any = {}): Partial<Request> => ({
  params: {},
  body: {},
  query: {},
  ...overrides,
});

const mockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('RoomController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create room and return it', async () => {
      const room = { id: 'r-1', name: 'Discussion' };
      mockRoomService.create.mockResolvedValue(room);

      const req = mockReq({
        params: { bookClubId: 'club-1' },
        body: { name: 'Discussion' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await createRoom(req as any, res);

      expect(mockRoomService.create).toHaveBeenCalledWith('club-1', 'user-1', { name: 'Discussion' });
      expect(res.json).toHaveBeenCalledWith({ room, message: 'Room created successfully' });
    });

    it('should return 400 for missing room name', async () => {
      mockRoomService.create.mockRejectedValue(new Error('Room name is required'));

      const req = mockReq({
        params: { bookClubId: 'club-1' },
        body: {},
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await createRoom(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Room name is required' });
    });

    it('should return 404 for non-existent book club', async () => {
      mockRoomService.create.mockRejectedValue(new Error('Book club not found'));

      const req = mockReq({
        params: { bookClubId: 'bad' },
        body: { name: 'Test' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await createRoom(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for non-member', async () => {
      mockRoomService.create.mockRejectedValue(new Error('You must be a member to create rooms'));

      const req = mockReq({
        params: { bookClubId: 'club-1' },
        body: { name: 'Test' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await createRoom(req as any, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 500 for unknown errors', async () => {
      mockRoomService.create.mockRejectedValue(new Error('DB exploded'));

      const req = mockReq({
        params: { bookClubId: 'club-1' },
        body: { name: 'Test' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await createRoom(req as any, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getRooms', () => {
    it('should return rooms', async () => {
      const rooms = [{ id: 'r-1', name: 'general' }];
      mockRoomService.getRooms.mockResolvedValue(rooms);

      const req = mockReq({ params: { bookClubId: 'club-1' } }) as Request;
      const res = mockRes() as Response;

      await getRooms(req, res);

      expect(res.json).toHaveBeenCalledWith({ rooms });
    });

    it('should return 500 on error', async () => {
      mockRoomService.getRooms.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ params: { bookClubId: 'club-1' } }) as Request;
      const res = mockRes() as Response;

      await getRooms(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch rooms' });
    });
  });

  describe('getRoomMessages', () => {
    it('should return messages', async () => {
      const messages = [{ id: 'm-1', content: 'Hello' }];
      mockRoomService.getRoomMessages.mockResolvedValue(messages);

      const req = mockReq({ params: { roomId: 'r-1' } }) as Request;
      const res = mockRes() as Response;

      await getRoomMessages(req, res);

      expect(res.json).toHaveBeenCalledWith({ messages });
    });

    it('should return 500 on error', async () => {
      mockRoomService.getRoomMessages.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ params: { roomId: 'r-1' } }) as Request;
      const res = mockRes() as Response;

      await getRoomMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch messages' });
    });
  });

  describe('deleteRoom', () => {
    it('should delete room', async () => {
      mockRoomService.delete.mockResolvedValue(undefined);

      const req = mockReq({
        params: { bookClubId: 'club-1', roomId: 'r-1' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await deleteRoom(req as any, res);

      expect(mockRoomService.delete).toHaveBeenCalledWith('club-1', 'r-1', 'user-1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Room deleted successfully' });
    });

    it('should return 404 for book club not found', async () => {
      mockRoomService.delete.mockRejectedValue(new Error('Book club not found'));

      const req = mockReq({
        params: { bookClubId: 'bad', roomId: 'r-1' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await deleteRoom(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 for room not found', async () => {
      mockRoomService.delete.mockRejectedValue(new Error('Room not found'));

      const req = mockReq({
        params: { bookClubId: 'club-1', roomId: 'bad' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await deleteRoom(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for non-creator', async () => {
      mockRoomService.delete.mockRejectedValue(new Error('Only the book club creator can delete rooms'));

      const req = mockReq({
        params: { bookClubId: 'club-1', roomId: 'r-1' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await deleteRoom(req as any, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 for last room', async () => {
      mockRoomService.delete.mockRejectedValue(new Error('Cannot delete the last room'));

      const req = mockReq({
        params: { bookClubId: 'club-1', roomId: 'r-1' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await deleteRoom(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for general room', async () => {
      mockRoomService.delete.mockRejectedValue(new Error('Cannot delete the general room'));

      const req = mockReq({
        params: { bookClubId: 'club-1', roomId: 'r-1' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await deleteRoom(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
