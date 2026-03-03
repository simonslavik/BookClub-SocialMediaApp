// Mock dependencies
const mockPrisma = {
  bookClub: {
    findUnique: jest.fn(),
  },
};

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

const mockBookClubService = {
  discoverClubs: jest.fn(),
  getClubPreview: jest.fn(),
  getClub: jest.fn(),
  createClub: jest.fn(),
  joinClub: jest.fn(),
  requestToJoin: jest.fn(),
  getPendingRequests: jest.fn(),
  approveRequest: jest.fn(),
  rejectRequest: jest.fn(),
  leaveClub: jest.fn(),
  getShareableInvite: jest.fn(),
  deleteInvite: jest.fn(),
  joinByInvite: jest.fn(),
  removeMember: jest.fn(),
  updateMemberRole: jest.fn(),
  updateClub: jest.fn(),
  deleteClub: jest.fn(),
  getMembership: jest.fn(),
};

// The new BookClubController imports from bookclub.service (actual filename is lowercase)
jest.mock('../../src/services/bookclub.service', () => ({
  BookClubService: mockBookClubService,
}));

// Mock global fetch for discoverClubs
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

import { Request, Response } from 'express';
import { BookClubController } from '../../src/controllers/bookClub.controller';

const mockReq = (overrides: any = {}): Partial<Request> => ({
  params: {},
  body: {},
  query: {},
  headers: {},
  ...overrides,
});

const mockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('BookClubController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('discoverClubs', () => {
    it('should return clubs with current books', async () => {
      const clubs = [{ id: 'c-1', name: 'Readers' }, { id: 'c-2', name: 'Writers' }];
      mockBookClubService.discoverClubs.mockResolvedValue(clubs);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          currentBooks: [{ bookClubId: 'c-1', currentBook: { title: 'Dune' } }],
        }),
      });

      const req = mockReq({ user: { userId: 'user-1' }, query: {} });
      const res = mockRes();

      await BookClubController.discoverClubs(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { id: 'c-1', name: 'Readers', currentBook: { title: 'Dune' } },
          { id: 'c-2', name: 'Writers', currentBook: null },
        ],
      });
    });

    it('should work without auth (optional)', async () => {
      mockBookClubService.discoverClubs.mockResolvedValue([]);
      mockFetch.mockResolvedValue({ ok: false });

      const req = mockReq({ query: {} });
      const res = mockRes();

      await BookClubController.discoverClubs(req as any, res as any);

      expect(mockBookClubService.discoverClubs).toHaveBeenCalledWith(undefined, undefined);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should pass category filter', async () => {
      mockBookClubService.discoverClubs.mockResolvedValue([]);

      const req = mockReq({ user: { userId: 'user-1' }, query: { category: 'Fiction' } });
      const res = mockRes();

      await BookClubController.discoverClubs(req as any, res as any);

      expect(mockBookClubService.discoverClubs).toHaveBeenCalledWith('user-1', 'Fiction');
    });

    it('should handle fetch failure gracefully', async () => {
      const clubs = [{ id: 'c-1', name: 'Readers' }];
      mockBookClubService.discoverClubs.mockResolvedValue(clubs);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const req = mockReq({ query: {} });
      const res = mockRes();

      await BookClubController.discoverClubs(req as any, res as any);

      // Should still return clubs, just without currentBook enhancement
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 'c-1', name: 'Readers', currentBook: null }],
      });
    });

    it('should return 500 on service error', async () => {
      mockBookClubService.discoverClubs.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ query: {} });
      const res = mockRes();

      await BookClubController.discoverClubs(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getClubPreview', () => {
    it('should return club preview', async () => {
      const preview = { id: 'c-1', name: 'Readers', isMember: false };
      mockBookClubService.getClubPreview.mockResolvedValue(preview);

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'user-1' }, headers: {} });
      const res = mockRes();

      await BookClubController.getClubPreview(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: preview });
    });

    it('should return 404 for CLUB_NOT_FOUND', async () => {
      mockBookClubService.getClubPreview.mockRejectedValue(new Error('CLUB_NOT_FOUND'));

      const req = mockReq({ params: { id: 'bad' }, headers: {} });
      const res = mockRes();

      await BookClubController.getClubPreview(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 for other errors', async () => {
      mockBookClubService.getClubPreview.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ params: { id: 'c-1' }, headers: {} });
      const res = mockRes();

      await BookClubController.getClubPreview(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getClub', () => {
    it('should return club details', async () => {
      const club = { id: 'c-1', name: 'Readers', members: [] };
      mockBookClubService.getClub.mockResolvedValue(club);

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.getClub(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: club });
    });

    it('should return 404 for CLUB_NOT_FOUND', async () => {
      mockBookClubService.getClub.mockRejectedValue(new Error('CLUB_NOT_FOUND'));

      const req = mockReq({ params: { id: 'bad' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.getClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for ACCESS_DENIED', async () => {
      mockBookClubService.getClub.mockRejectedValue(new Error('ACCESS_DENIED'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'outsider' } });
      const res = mockRes();

      await BookClubController.getClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('createClub', () => {
    it('should create club and return 201', async () => {
      const club = { id: 'c-1', name: 'New Club' };
      mockBookClubService.createClub.mockResolvedValue(club);

      const req = mockReq({
        user: { userId: 'user-1' },
        body: { name: 'New Club', visibility: 'PUBLIC' },
      });
      const res = mockRes();

      await BookClubController.createClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: club });
    });

    it('should return 500 on error', async () => {
      mockBookClubService.createClub.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ user: { userId: 'user-1' }, body: { name: 'X' } });
      const res = mockRes();

      await BookClubController.createClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('joinClub', () => {
    it('should join club successfully', async () => {
      const member = { userId: 'user-1', role: 'MEMBER' };
      mockBookClubService.joinClub.mockResolvedValue(member);

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.joinClub(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: member });
    });

    it('should return 404 for CLUB_NOT_FOUND', async () => {
      mockBookClubService.joinClub.mockRejectedValue(new Error('CLUB_NOT_FOUND'));

      const req = mockReq({ params: { id: 'bad' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.joinClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for ALREADY_MEMBER', async () => {
      mockBookClubService.joinClub.mockRejectedValue(new Error('ALREADY_MEMBER'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.joinClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 for BANNED_FROM_CLUB', async () => {
      mockBookClubService.joinClub.mockRejectedValue(new Error('BANNED_FROM_CLUB'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'banned' } });
      const res = mockRes();

      await BookClubController.joinClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 for REQUIRES_APPROVAL', async () => {
      mockBookClubService.joinClub.mockRejectedValue(new Error('REQUIRES_APPROVAL'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.joinClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('requestToJoin', () => {
    it('should create join request', async () => {
      const request = { id: 'req-1', status: 'PENDING' };
      mockBookClubService.requestToJoin.mockResolvedValue(request);

      const req = mockReq({
        params: { id: 'c-1' },
        user: { userId: 'user-1' },
        body: { message: 'Let me in!' },
      });
      const res = mockRes();

      await BookClubController.requestToJoin(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: request });
    });

    it('should return 404 for CLUB_NOT_FOUND', async () => {
      mockBookClubService.requestToJoin.mockRejectedValue(new Error('CLUB_NOT_FOUND'));

      const req = mockReq({ params: { id: 'bad' }, user: { userId: 'user-1' }, body: {} });
      const res = mockRes();

      await BookClubController.requestToJoin(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for REQUEST_ALREADY_PENDING', async () => {
      mockBookClubService.requestToJoin.mockRejectedValue(new Error('REQUEST_ALREADY_PENDING'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'user-1' }, body: {} });
      const res = mockRes();

      await BookClubController.requestToJoin(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for INVITE_ONLY_CLUB', async () => {
      mockBookClubService.requestToJoin.mockRejectedValue(new Error('INVITE_ONLY_CLUB'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'user-1' }, body: {} });
      const res = mockRes();

      await BookClubController.requestToJoin(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getPendingRequests', () => {
    it('should return pending requests', async () => {
      const requests = [{ id: 'req-1', status: 'PENDING' }];
      mockBookClubService.getPendingRequests.mockResolvedValue(requests);

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'admin-1' } });
      const res = mockRes();

      await BookClubController.getPendingRequests(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: requests });
    });

    it('should return 403 for INSUFFICIENT_PERMISSIONS', async () => {
      mockBookClubService.getPendingRequests.mockRejectedValue(new Error('INSUFFICIENT_PERMISSIONS'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'member' } });
      const res = mockRes();

      await BookClubController.getPendingRequests(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('approveRequest', () => {
    it('should approve request', async () => {
      const result = { id: 'req-1', status: 'APPROVED' };
      mockBookClubService.approveRequest.mockResolvedValue(result);

      const req = mockReq({ params: { id: 'c-1', requestId: 'req-1' }, user: { userId: 'admin' } });
      const res = mockRes();

      await BookClubController.approveRequest(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should return 404 for REQUEST_NOT_FOUND', async () => {
      mockBookClubService.approveRequest.mockRejectedValue(new Error('REQUEST_NOT_FOUND'));

      const req = mockReq({ params: { id: 'c-1', requestId: 'bad' }, user: { userId: 'admin' } });
      const res = mockRes();

      await BookClubController.approveRequest(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for REQUEST_ALREADY_REVIEWED', async () => {
      mockBookClubService.approveRequest.mockRejectedValue(new Error('REQUEST_ALREADY_REVIEWED'));

      const req = mockReq({ params: { id: 'c-1', requestId: 'req-1' }, user: { userId: 'admin' } });
      const res = mockRes();

      await BookClubController.approveRequest(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 for INSUFFICIENT_PERMISSIONS', async () => {
      mockBookClubService.approveRequest.mockRejectedValue(new Error('INSUFFICIENT_PERMISSIONS'));

      const req = mockReq({ params: { id: 'c-1', requestId: 'req-1' }, user: { userId: 'member' } });
      const res = mockRes();

      await BookClubController.approveRequest(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('rejectRequest', () => {
    it('should reject request', async () => {
      const result = { id: 'req-1', status: 'REJECTED' };
      mockBookClubService.rejectRequest.mockResolvedValue(result);

      const req = mockReq({ params: { id: 'c-1', requestId: 'req-1' }, user: { userId: 'admin' } });
      const res = mockRes();

      await BookClubController.rejectRequest(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should return 403 for INSUFFICIENT_PERMISSIONS', async () => {
      mockBookClubService.rejectRequest.mockRejectedValue(new Error('INSUFFICIENT_PERMISSIONS'));

      const req = mockReq({ params: { id: 'c-1', requestId: 'req-1' }, user: { userId: 'member' } });
      const res = mockRes();

      await BookClubController.rejectRequest(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('leaveClub', () => {
    it('should leave club', async () => {
      const result = { message: 'Left club' };
      mockBookClubService.leaveClub.mockResolvedValue(result);

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.leaveClub(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should return 400 for NOT_A_MEMBER', async () => {
      mockBookClubService.leaveClub.mockRejectedValue(new Error('NOT_A_MEMBER'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'outsider' } });
      const res = mockRes();

      await BookClubController.leaveClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for OWNER_MUST_TRANSFER_OWNERSHIP', async () => {
      mockBookClubService.leaveClub.mockRejectedValue(new Error('OWNER_MUST_TRANSFER_OWNERSHIP'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'owner' } });
      const res = mockRes();

      await BookClubController.leaveClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getShareableInvite', () => {
    it('should return invite', async () => {
      const invite = { id: 'inv-1', code: 'ABC123' };
      mockBookClubService.getShareableInvite.mockResolvedValue(invite);

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'member' } });
      const res = mockRes();

      await BookClubController.getShareableInvite(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: invite });
    });

    it('should return 404 if no invite found', async () => {
      mockBookClubService.getShareableInvite.mockResolvedValue(null);

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'member' } });
      const res = mockRes();

      await BookClubController.getShareableInvite(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for INSUFFICIENT_PERMISSIONS', async () => {
      mockBookClubService.getShareableInvite.mockRejectedValue(new Error('INSUFFICIENT_PERMISSIONS'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'outsider' } });
      const res = mockRes();

      await BookClubController.getShareableInvite(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteInvite', () => {
    it('should delete invite', async () => {
      mockBookClubService.deleteInvite.mockResolvedValue({ message: 'Deleted' });

      const req = mockReq({ params: { id: 'c-1', inviteId: 'inv-1' }, user: { userId: 'admin' } });
      const res = mockRes();

      await BookClubController.deleteInvite(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 for INVITE_NOT_FOUND', async () => {
      mockBookClubService.deleteInvite.mockRejectedValue(new Error('INVITE_NOT_FOUND'));

      const req = mockReq({ params: { id: 'c-1', inviteId: 'bad' }, user: { userId: 'admin' } });
      const res = mockRes();

      await BookClubController.deleteInvite(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for INSUFFICIENT_PERMISSIONS', async () => {
      mockBookClubService.deleteInvite.mockRejectedValue(new Error('INSUFFICIENT_PERMISSIONS'));

      const req = mockReq({ params: { id: 'c-1', inviteId: 'inv-1' }, user: { userId: 'member' } });
      const res = mockRes();

      await BookClubController.deleteInvite(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('joinByInvite', () => {
    it('should join via invite code', async () => {
      const result = { userId: 'user-1', role: 'MEMBER' };
      mockBookClubService.joinByInvite.mockResolvedValue(result);

      const req = mockReq({ params: { code: 'ABC123' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.joinByInvite(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should return 404 for INVALID_INVITE', async () => {
      mockBookClubService.joinByInvite.mockRejectedValue(new Error('INVALID_INVITE'));

      const req = mockReq({ params: { code: 'BAD' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.joinByInvite(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for INVITE_EXPIRED', async () => {
      mockBookClubService.joinByInvite.mockRejectedValue(new Error('INVITE_EXPIRED'));

      const req = mockReq({ params: { code: 'OLD' }, user: { userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.joinByInvite(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for ALREADY_MEMBER', async () => {
      mockBookClubService.joinByInvite.mockRejectedValue(new Error('ALREADY_MEMBER'));

      const req = mockReq({ params: { code: 'ABC' }, user: { userId: 'member' } });
      const res = mockRes();

      await BookClubController.joinByInvite(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 for BANNED_FROM_CLUB', async () => {
      mockBookClubService.joinByInvite.mockRejectedValue(new Error('BANNED_FROM_CLUB'));

      const req = mockReq({ params: { code: 'ABC' }, user: { userId: 'banned' } });
      const res = mockRes();

      await BookClubController.joinByInvite(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('removeMember', () => {
    it('should remove member', async () => {
      mockBookClubService.removeMember.mockResolvedValue({ message: 'Removed' });

      const req = mockReq({
        params: { id: 'c-1', userId: 'target-user' },
        user: { userId: 'admin' },
      });
      const res = mockRes();

      await BookClubController.removeMember(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 for CANNOT_REMOVE_OWNER', async () => {
      mockBookClubService.removeMember.mockRejectedValue(new Error('CANNOT_REMOVE_OWNER'));

      const req = mockReq({
        params: { id: 'c-1', userId: 'owner' },
        user: { userId: 'admin' },
      });
      const res = mockRes();

      await BookClubController.removeMember(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 for INSUFFICIENT_PERMISSIONS', async () => {
      mockBookClubService.removeMember.mockRejectedValue(new Error('INSUFFICIENT_PERMISSIONS'));

      const req = mockReq({
        params: { id: 'c-1', userId: 'target' },
        user: { userId: 'member' },
      });
      const res = mockRes();

      await BookClubController.removeMember(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateMemberRole', () => {
    it('should update role', async () => {
      const result = { userId: 'target', role: 'ADMIN' };
      mockBookClubService.updateMemberRole.mockResolvedValue(result);

      const req = mockReq({
        params: { id: 'c-1', userId: 'target' },
        user: { userId: 'owner' },
        body: { role: 'ADMIN' },
      });
      const res = mockRes();

      await BookClubController.updateMemberRole(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should return 400 for CANNOT_CHANGE_OWNER_ROLE', async () => {
      mockBookClubService.updateMemberRole.mockRejectedValue(new Error('CANNOT_CHANGE_OWNER_ROLE'));

      const req = mockReq({
        params: { id: 'c-1', userId: 'owner' },
        user: { userId: 'owner' },
        body: { role: 'MEMBER' },
      });
      const res = mockRes();

      await BookClubController.updateMemberRole(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 for INSUFFICIENT_PERMISSIONS', async () => {
      mockBookClubService.updateMemberRole.mockRejectedValue(new Error('INSUFFICIENT_PERMISSIONS'));

      const req = mockReq({
        params: { id: 'c-1', userId: 'target' },
        user: { userId: 'member' },
        body: { role: 'ADMIN' },
      });
      const res = mockRes();

      await BookClubController.updateMemberRole(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateClub', () => {
    it('should update club settings', async () => {
      const club = { id: 'c-1', name: 'Updated' };
      mockBookClubService.updateClub.mockResolvedValue(club);

      const req = mockReq({
        params: { id: 'c-1' },
        user: { userId: 'admin' },
        body: { name: 'Updated' },
      });
      const res = mockRes();

      await BookClubController.updateClub(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: club });
    });

    it('should return 403 for INSUFFICIENT_PERMISSIONS', async () => {
      mockBookClubService.updateClub.mockRejectedValue(new Error('INSUFFICIENT_PERMISSIONS'));

      const req = mockReq({
        params: { id: 'c-1' },
        user: { userId: 'member' },
        body: { name: 'Updated' },
      });
      const res = mockRes();

      await BookClubController.updateClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteClub', () => {
    it('should delete club', async () => {
      mockBookClubService.deleteClub.mockResolvedValue({ message: 'Deleted' });

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'owner' } });
      const res = mockRes();

      await BookClubController.deleteClub(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 403 for INSUFFICIENT_PERMISSIONS', async () => {
      mockBookClubService.deleteClub.mockRejectedValue(new Error('INSUFFICIENT_PERMISSIONS'));

      const req = mockReq({ params: { id: 'c-1' }, user: { userId: 'member' } });
      const res = mockRes();

      await BookClubController.deleteClub(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('verifyMemberRole', () => {
    it('should return OWNER role for creator', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ creatorId: 'user-1' });

      const req = mockReq({ params: { id: 'c-1', userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.verifyMemberRole(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        role: 'OWNER',
        status: 'ACTIVE',
      });
    });

    it('should return membership role for non-creator', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ creatorId: 'other-user' });
      mockBookClubService.getMembership.mockResolvedValue({ role: 'MEMBER', status: 'ACTIVE' });

      const req = mockReq({ params: { id: 'c-1', userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.verifyMemberRole(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        role: 'MEMBER',
        status: 'ACTIVE',
      });
    });

    it('should return 404 if book club not found', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { id: 'bad', userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.verifyMemberRole(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if not a member', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ creatorId: 'other' });
      mockBookClubService.getMembership.mockResolvedValue(null);

      const req = mockReq({ params: { id: 'c-1', userId: 'outsider' } });
      const res = mockRes();

      await BookClubController.verifyMemberRole(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      mockPrisma.bookClub.findUnique.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ params: { id: 'c-1', userId: 'user-1' } });
      const res = mockRes();

      await BookClubController.verifyMemberRole(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
