// Mock dependencies
const mockPrisma = {
  bookClubMember: {
    findMany: jest.fn(),
  },
};

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

const mockBookClubService = {
  createClub: jest.fn(),
  getClub: jest.fn(),
  getClubPreview: jest.fn(),
  updateClub: jest.fn(),
  discoverClubs: jest.fn(),
  checkPermission: jest.fn(),
};

jest.mock('../../src/services/bookclub.service', () => ({
  BookClubService: mockBookClubService,
}));

import { Request, Response } from 'express';
import {
  createBookClub,
  getBookClub,
  updateBookClub,
  getAllBookClubs,
  getMyBookClubs,
  uploadBookClubImage,
  deleteBookClubImage,
} from '../../src/controllers/bookClubController';

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

describe('bookClubController (legacy)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBookClub', () => {
    it('should create book club', async () => {
      const club = { id: 'c-1', name: 'Readers' };
      mockBookClubService.createClub.mockResolvedValue(club);

      const req = mockReq({
        body: { name: 'Readers', category: 'Fiction', isPublic: true, description: 'A club' },
        user: { userId: 'user-1' },
      });
      const res = mockRes();

      await createBookClub(req as any, res as any);

      expect(mockBookClubService.createClub).toHaveBeenCalledWith('user-1', {
        name: 'Readers',
        category: 'Fiction',
        description: 'A club',
        visibility: 'PUBLIC',
        requiresApproval: false,
      });
      expect(res.json).toHaveBeenCalledWith({
        bookClubId: 'c-1',
        message: 'Book club created successfully',
        bookClub: club,
      });
    });

    it('should default isPublic=false to PRIVATE visibility', async () => {
      const club = { id: 'c-1', name: 'Secret' };
      mockBookClubService.createClub.mockResolvedValue(club);

      const req = mockReq({
        body: { name: 'Secret', isPublic: false },
        user: { userId: 'user-1' },
      });
      const res = mockRes();

      await createBookClub(req as any, res as any);

      expect(mockBookClubService.createClub).toHaveBeenCalledWith('user-1', expect.objectContaining({
        visibility: 'PRIVATE',
      }));
    });

    it('should return 400 for missing name', async () => {
      mockBookClubService.createClub.mockRejectedValue(new Error('Book club name is required'));

      const req = mockReq({ body: {}, user: { userId: 'user-1' } });
      const res = mockRes();

      await createBookClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 for other errors', async () => {
      mockBookClubService.createClub.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ body: { name: 'Test' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await createBookClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getBookClub', () => {
    it('should return full club for authenticated member', async () => {
      const club = { id: 'c-1', name: 'Readers', members: [] };
      mockBookClubService.getClub.mockResolvedValue(club);

      const req = mockReq({ params: { bookClubId: 'c-1' }, user: { userId: 'member-1' } });
      const res = mockRes();

      await getBookClub(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(club);
    });

    it('should return preview for non-member', async () => {
      mockBookClubService.getClub.mockRejectedValue(new Error('ACCESS_DENIED'));
      const preview = { id: 'c-1', name: 'Readers', isMember: false };
      mockBookClubService.getClubPreview.mockResolvedValue(preview);

      const req = mockReq({ params: { bookClubId: 'c-1' }, user: { userId: 'outsider' } });
      const res = mockRes();

      await getBookClub(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(preview);
    });

    it('should return preview for unauthenticated user', async () => {
      const preview = { id: 'c-1', name: 'Readers' };
      mockBookClubService.getClubPreview.mockResolvedValue(preview);

      const req = mockReq({ params: { bookClubId: 'c-1' } });
      const res = mockRes();

      await getBookClub(req as any, res as any);

      expect(mockBookClubService.getClubPreview).toHaveBeenCalledWith('c-1');
      expect(res.json).toHaveBeenCalledWith(preview);
    });

    it('should return 404 for not found', async () => {
      mockBookClubService.getClubPreview.mockRejectedValue(new Error('Book club not found'));

      const req = mockReq({ params: { bookClubId: 'bad' } });
      const res = mockRes();

      await getBookClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateBookClub', () => {
    it('should update book club', async () => {
      const updated = { id: 'c-1', name: 'Updated' };
      mockBookClubService.updateClub.mockResolvedValue(updated);

      const req = mockReq({
        params: { bookClubId: 'c-1' },
        body: { name: 'Updated', isPublic: false },
        user: { userId: 'admin' },
      });
      const res = mockRes();

      await updateBookClub(req as any, res as any);

      expect(mockBookClubService.updateClub).toHaveBeenCalledWith('c-1', 'admin', expect.objectContaining({
        name: 'Updated',
        visibility: 'PRIVATE',
      }));
      expect(res.json).toHaveBeenCalledWith({
        message: 'Book club updated successfully',
        bookClub: updated,
      });
    });

    it('should return 404 for not found', async () => {
      mockBookClubService.updateClub.mockRejectedValue(new Error('Book club not found'));

      const req = mockReq({
        params: { bookClubId: 'bad' },
        body: { name: 'X' },
        user: { userId: 'user-1' },
      });
      const res = mockRes();

      await updateBookClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for permission error', async () => {
      mockBookClubService.updateClub.mockRejectedValue(new Error('Insufficient permission'));

      const req = mockReq({
        params: { bookClubId: 'c-1' },
        body: { name: 'X' },
        user: { userId: 'member' },
      });
      const res = mockRes();

      await updateBookClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getAllBookClubs', () => {
    it('should return user bookclubs when mine=true', async () => {
      const memberships = [
        { bookClub: { id: 'c-1', name: 'Club 1' } },
        { bookClub: { id: 'c-2', name: 'Club 2' } },
      ];
      mockPrisma.bookClubMember.findMany.mockResolvedValue(memberships);

      const req = mockReq({
        query: { mine: 'true' },
        user: { userId: 'user-1' },
      });
      const res = mockRes();

      await getAllBookClubs(req as any, res as any);

      expect(mockPrisma.bookClubMember.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'ACTIVE' },
        include: { bookClub: true },
        orderBy: { joinedAt: 'desc' },
      });
      expect(res.json).toHaveBeenCalledWith({
        bookClubs: [{ id: 'c-1', name: 'Club 1' }, { id: 'c-2', name: 'Club 2' }],
      });
    });

    it('should return discovered clubs by default', async () => {
      const clubs = [{ id: 'c-1', name: 'Public Club' }];
      mockBookClubService.discoverClubs.mockResolvedValue(clubs);

      const req = mockReq({ query: {}, user: { userId: 'user-1' } });
      const res = mockRes();

      await getAllBookClubs(req as any, res as any);

      expect(mockBookClubService.discoverClubs).toHaveBeenCalledWith('user-1');
      expect(res.json).toHaveBeenCalledWith({ bookClubs: clubs });
    });

    it('should handle unauthenticated discovery', async () => {
      const clubs = [{ id: 'c-1', name: 'Public Club' }];
      mockBookClubService.discoverClubs.mockResolvedValue(clubs);

      const req = mockReq({ query: {} });
      const res = mockRes();

      await getAllBookClubs(req as any, res as any);

      expect(mockBookClubService.discoverClubs).toHaveBeenCalledWith(undefined);
    });

    it('should return 500 on error', async () => {
      mockBookClubService.discoverClubs.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ query: {} });
      const res = mockRes();

      await getAllBookClubs(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMyBookClubs', () => {
    it('should return user memberships', async () => {
      const memberships = [{ bookClub: { id: 'c-1', name: 'My Club' } }];
      mockPrisma.bookClubMember.findMany.mockResolvedValue(memberships);

      const req = mockReq({ user: { userId: 'user-1' } });
      const res = mockRes();

      await getMyBookClubs(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ bookClubs: [{ id: 'c-1', name: 'My Club' }] });
    });

    it('should return 500 on error', async () => {
      mockPrisma.bookClubMember.findMany.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ user: { userId: 'user-1' } });
      const res = mockRes();

      await getMyBookClubs(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('uploadBookClubImage', () => {
    it('should upload image', async () => {
      mockBookClubService.checkPermission.mockResolvedValue(true);
      mockBookClubService.updateClub.mockResolvedValue({});

      const req = mockReq({
        params: { id: 'c-1' },
        user: { userId: 'admin' },
        file: { filename: 'photo.jpg' },
      });
      const res = mockRes();

      await uploadBookClubImage(req as any, res as any);

      expect(mockBookClubService.updateClub).toHaveBeenCalledWith('c-1', 'admin', {
        imageUrl: '/uploads/bookclub-images/photo.jpg',
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Image uploaded successfully',
        imageUrl: '/uploads/bookclub-images/photo.jpg',
      });
    });

    it('should return 400 if no file', async () => {
      const req = mockReq({
        params: { id: 'c-1' },
        user: { userId: 'admin' },
      });
      const res = mockRes();

      await uploadBookClubImage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No image file provided' });
    });

    it('should return 403 if not admin', async () => {
      mockBookClubService.checkPermission.mockResolvedValue(false);

      const req = mockReq({
        params: { id: 'c-1' },
        user: { userId: 'member' },
        file: { filename: 'photo.jpg' },
      });
      const res = mockRes();

      await uploadBookClubImage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteBookClubImage', () => {
    it('should delete image', async () => {
      mockBookClubService.checkPermission.mockResolvedValue(true);
      mockBookClubService.updateClub.mockResolvedValue({});

      const req = mockReq({
        params: { id: 'c-1' },
        user: { userId: 'admin' },
      });
      const res = mockRes();

      await deleteBookClubImage(req as any, res as any);

      expect(mockBookClubService.updateClub).toHaveBeenCalledWith('c-1', 'admin', { imageUrl: null });
      expect(res.json).toHaveBeenCalledWith({ message: 'Image deleted successfully' });
    });

    it('should return 403 if not admin', async () => {
      mockBookClubService.checkPermission.mockResolvedValue(false);

      const req = mockReq({
        params: { id: 'c-1' },
        user: { userId: 'member' },
      });
      const res = mockRes();

      await deleteBookClubImage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 500 on error', async () => {
      mockBookClubService.checkPermission.mockRejectedValue(new Error('DB error'));

      const req = mockReq({
        params: { id: 'c-1' },
        user: { userId: 'admin' },
      });
      const res = mockRes();

      await deleteBookClubImage(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
