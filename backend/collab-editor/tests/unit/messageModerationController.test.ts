// Mock dependencies
const mockPrisma = {
  message: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

const mockBookClubService = {
  checkPermission: jest.fn(),
};

jest.mock('../../src/services/bookclub.service', () => ({
  BookClubService: mockBookClubService,
}));

import { Request, Response } from 'express';
import { MessageModerationController } from '../../src/controllers/messageModeration.controller';

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

describe('MessageModerationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteMessage', () => {
    const message = {
      id: 'msg-1',
      userId: 'author-1',
      content: 'Hello',
      room: { bookClubId: 'club-1' },
    };

    it('should return 404 if message not found', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { messageId: 'bad' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await MessageModerationController.deleteMessage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Message not found' });
    });

    it('should allow moderator to delete message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(message);
      mockBookClubService.checkPermission.mockResolvedValue(true);
      mockPrisma.message.update.mockResolvedValue({ ...message, deletedAt: new Date(), content: '[Message deleted]' });

      const req = mockReq({ params: { messageId: 'msg-1' }, user: { userId: 'mod-1' } });
      const res = mockRes();

      await MessageModerationController.deleteMessage(req as any, res as any);

      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: expect.objectContaining({
          deletedBy: 'mod-1',
          content: '[Message deleted]',
          isPinned: false,
        }),
      });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should allow user to delete own message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(message);
      mockBookClubService.checkPermission.mockResolvedValue(false); // Not moderator
      mockPrisma.message.update.mockResolvedValue({ ...message, deletedAt: new Date() });

      const req = mockReq({ params: { messageId: 'msg-1' }, user: { userId: 'author-1' } });
      const res = mockRes();

      await MessageModerationController.deleteMessage(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 403 if not moderator and not own message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(message);
      mockBookClubService.checkPermission.mockResolvedValue(false);

      const req = mockReq({ params: { messageId: 'msg-1' }, user: { userId: 'other-user' } });
      const res = mockRes();

      await MessageModerationController.deleteMessage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 500 on unexpected error', async () => {
      mockPrisma.message.findUnique.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ params: { messageId: 'msg-1' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await MessageModerationController.deleteMessage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('pinMessage', () => {
    const message = {
      id: 'msg-1',
      userId: 'author-1',
      content: 'Hello',
      deletedAt: null,
      room: { bookClubId: 'club-1' },
    };

    it('should return 404 if message not found', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { messageId: 'bad' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await MessageModerationController.pinMessage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if message is deleted', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({ ...message, deletedAt: new Date() });

      const req = mockReq({ params: { messageId: 'msg-1' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await MessageModerationController.pinMessage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Cannot pin deleted message' });
    });

    it('should return 403 if not moderator', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(message);
      mockBookClubService.checkPermission.mockResolvedValue(false);

      const req = mockReq({ params: { messageId: 'msg-1' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await MessageModerationController.pinMessage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should pin message for moderator', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(message);
      mockBookClubService.checkPermission.mockResolvedValue(true);
      mockPrisma.message.update.mockResolvedValue({ ...message, isPinned: true });

      const req = mockReq({ params: { messageId: 'msg-1' }, user: { userId: 'mod-1' } });
      const res = mockRes();

      await MessageModerationController.pinMessage(req as any, res as any);

      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: { isPinned: true },
      });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 500 on unexpected error', async () => {
      mockPrisma.message.findUnique.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ params: { messageId: 'msg-1' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await MessageModerationController.pinMessage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('unpinMessage', () => {
    const message = {
      id: 'msg-1',
      room: { bookClubId: 'club-1' },
    };

    it('should return 404 if message not found', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { messageId: 'bad' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await MessageModerationController.unpinMessage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if not moderator', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(message);
      mockBookClubService.checkPermission.mockResolvedValue(false);

      const req = mockReq({ params: { messageId: 'msg-1' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await MessageModerationController.unpinMessage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should unpin message for moderator', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(message);
      mockBookClubService.checkPermission.mockResolvedValue(true);
      mockPrisma.message.update.mockResolvedValue({ ...message, isPinned: false });

      const req = mockReq({ params: { messageId: 'msg-1' }, user: { userId: 'mod-1' } });
      const res = mockRes();

      await MessageModerationController.unpinMessage(req as any, res as any);

      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: { isPinned: false },
      });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getPinnedMessages', () => {
    it('should return pinned messages', async () => {
      const pinned = [
        { id: 'msg-1', content: 'Important', isPinned: true },
        { id: 'msg-2', content: 'Also important', isPinned: true },
      ];
      mockPrisma.message.findMany.mockResolvedValue(pinned);

      const req = mockReq({ params: { roomId: 'r-1' } });
      const res = mockRes();

      await MessageModerationController.getPinnedMessages(req as any, res as any);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { roomId: 'r-1', isPinned: true, deletedAt: null },
        include: { attachments: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: pinned });
    });

    it('should return empty array when no pinned messages', async () => {
      mockPrisma.message.findMany.mockResolvedValue([]);

      const req = mockReq({ params: { roomId: 'r-1' } });
      const res = mockRes();

      await MessageModerationController.getPinnedMessages(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should return 500 on error', async () => {
      mockPrisma.message.findMany.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ params: { roomId: 'r-1' } });
      const res = mockRes();

      await MessageModerationController.getPinnedMessages(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
