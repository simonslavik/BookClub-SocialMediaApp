// Mock Prisma before importing anything that uses it
const mockPrisma = {
  bookClubMember: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  bookClub: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  membershipRequest: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  bookClubInvite: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import { BookClubService } from '../../src/services/bookclub.service';

describe('BookClubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPermission', () => {
    it('should return false if user is not a member', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      const result = await BookClubService.checkPermission('club-1', 'user-1');
      expect(result).toBe(false);
    });

    it('should return true for MEMBER when requiring MEMBER', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({
        role: 'MEMBER',
        status: 'ACTIVE',
      });

      const result = await BookClubService.checkPermission('club-1', 'user-1', 'MEMBER' as any);
      expect(result).toBe(true);
    });

    it('should return true for OWNER when requiring ADMIN', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({
        role: 'OWNER',
        status: 'ACTIVE',
      });

      const result = await BookClubService.checkPermission('club-1', 'user-1', 'ADMIN' as any);
      expect(result).toBe(true);
    });

    it('should return false for MEMBER when requiring ADMIN', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({
        role: 'MEMBER',
        status: 'ACTIVE',
      });

      const result = await BookClubService.checkPermission('club-1', 'user-1', 'ADMIN' as any);
      expect(result).toBe(false);
    });

    it('should return true for MODERATOR when requiring MODERATOR', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({
        role: 'MODERATOR',
        status: 'ACTIVE',
      });

      const result = await BookClubService.checkPermission('club-1', 'user-1', 'MODERATOR' as any);
      expect(result).toBe(true);
    });

    it('should return false for MODERATOR when requiring ADMIN', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({
        role: 'MODERATOR',
        status: 'ACTIVE',
      });

      const result = await BookClubService.checkPermission('club-1', 'user-1', 'ADMIN' as any);
      expect(result).toBe(false);
    });
  });

  describe('getMembership', () => {
    it('should return membership if found', async () => {
      const membership = { id: 'm-1', userId: 'user-1', bookClubId: 'club-1', role: 'MEMBER' };
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(membership);

      const result = await BookClubService.getMembership('club-1', 'user-1');
      expect(result).toEqual(membership);
    });

    it('should return null if no membership', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      const result = await BookClubService.getMembership('club-1', 'user-1');
      expect(result).toBeNull();
    });
  });

  describe('getClub', () => {
    it('should throw ACCESS_DENIED if user has no permission', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(BookClubService.getClub('club-1', 'user-1')).rejects.toThrow('ACCESS_DENIED');
    });

    it('should throw CLUB_NOT_FOUND if club does not exist', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({
        role: 'MEMBER',
        status: 'ACTIVE',
      });
      mockPrisma.bookClub.findUnique.mockResolvedValue(null);

      await expect(BookClubService.getClub('club-1', 'user-1')).rejects.toThrow('CLUB_NOT_FOUND');
    });

    it('should return club with includes for valid member', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({
        role: 'MEMBER',
        status: 'ACTIVE',
      });
      const club = {
        id: 'club-1',
        name: 'Test Club',
        members: [],
        rooms: [],
        events: [],
      };
      mockPrisma.bookClub.findUnique.mockResolvedValue(club);

      const result = await BookClubService.getClub('club-1', 'user-1');
      expect(result).toEqual(club);
    });
  });

  describe('createClub', () => {
    it('should create a club with OWNER membership and default room', async () => {
      const club = {
        id: 'club-new',
        name: 'New Club',
        creatorId: 'user-1',
        members: [{ userId: 'user-1', role: 'OWNER' }],
        rooms: [{ name: 'general' }],
        invites: [{ code: 'abc12345' }],
      };
      mockPrisma.bookClub.create.mockResolvedValue(club);

      const result = await BookClubService.createClub('user-1', {
        name: 'New Club',
        visibility: 'PUBLIC' as any,
      });

      expect(result.name).toBe('New Club');
      expect(mockPrisma.bookClub.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creatorId: 'user-1',
            members: expect.objectContaining({
              create: expect.objectContaining({ role: 'OWNER' }),
            }),
            rooms: expect.objectContaining({
              create: expect.objectContaining({ name: 'general' }),
            }),
          }),
        })
      );
    });
  });

  describe('joinClub', () => {
    it('should throw CLUB_NOT_FOUND if club does not exist', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue(null);

      await expect(BookClubService.joinClub('club-1', 'user-1')).rejects.toThrow('CLUB_NOT_FOUND');
    });

    it('should throw ALREADY_MEMBER if already active', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', visibility: 'PUBLIC' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ status: 'ACTIVE' });

      await expect(BookClubService.joinClub('club-1', 'user-1')).rejects.toThrow('ALREADY_MEMBER');
    });

    it('should throw BANNED_FROM_CLUB if user is banned', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', visibility: 'PUBLIC' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ status: 'BANNED' });

      await expect(BookClubService.joinClub('club-1', 'user-1')).rejects.toThrow('BANNED_FROM_CLUB');
    });

    it('should throw REQUIRES_APPROVAL for non-public clubs', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', visibility: 'PRIVATE' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(BookClubService.joinClub('club-1', 'user-1')).rejects.toThrow('REQUIRES_APPROVAL');
    });

    it('should upsert member and update lastActiveAt for public club', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', visibility: 'PUBLIC' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);
      const member = { id: 'm-1', userId: 'user-1', role: 'MEMBER', status: 'ACTIVE' };
      mockPrisma.bookClubMember.upsert.mockResolvedValue(member);
      mockPrisma.bookClub.update.mockResolvedValue({});

      const result = await BookClubService.joinClub('club-1', 'user-1');
      expect(result).toEqual(member);
      expect(mockPrisma.bookClub.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'club-1' },
          data: expect.objectContaining({ lastActiveAt: expect.any(Date) }),
        })
      );
    });
  });

  describe('requestToJoin', () => {
    it('should throw CLUB_NOT_FOUND if club does not exist', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue(null);

      await expect(BookClubService.requestToJoin('club-1', 'user-1')).rejects.toThrow('CLUB_NOT_FOUND');
    });

    it('should throw PUBLIC_CLUB_NO_REQUEST_NEEDED for public club', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', visibility: 'PUBLIC' });

      await expect(BookClubService.requestToJoin('club-1', 'user-1')).rejects.toThrow('PUBLIC_CLUB_NO_REQUEST_NEEDED');
    });

    it('should throw INVITE_ONLY_CLUB for invite-only club', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', visibility: 'INVITE_ONLY' });

      await expect(BookClubService.requestToJoin('club-1', 'user-1')).rejects.toThrow('INVITE_ONLY_CLUB');
    });

    it('should throw REQUEST_ALREADY_PENDING if pending request exists', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', visibility: 'PRIVATE' });
      mockPrisma.membershipRequest.findUnique.mockResolvedValue({ status: 'PENDING' });

      await expect(BookClubService.requestToJoin('club-1', 'user-1')).rejects.toThrow('REQUEST_ALREADY_PENDING');
    });

    it('should create request for private club', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', visibility: 'PRIVATE' });
      mockPrisma.membershipRequest.findUnique.mockResolvedValue(null);
      const request = { id: 'r-1', status: 'PENDING', userId: 'user-1' };
      mockPrisma.membershipRequest.upsert.mockResolvedValue(request);

      const result = await BookClubService.requestToJoin('club-1', 'user-1', 'Please let me in');
      expect(result).toEqual(request);
    });
  });

  describe('approveRequest', () => {
    it('should throw INSUFFICIENT_PERMISSIONS if not admin', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(
        BookClubService.approveRequest('club-1', 'req-1', 'user-1')
      ).rejects.toThrow('INSUFFICIENT_PERMISSIONS');
    });

    it('should throw REQUEST_NOT_FOUND if request does not exist', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'ACTIVE' });
      mockPrisma.membershipRequest.findUnique.mockResolvedValue(null);

      await expect(
        BookClubService.approveRequest('club-1', 'req-1', 'admin-1')
      ).rejects.toThrow('REQUEST_NOT_FOUND');
    });

    it('should throw REQUEST_ALREADY_REVIEWED if not pending', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'ACTIVE' });
      mockPrisma.membershipRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        bookClubId: 'club-1',
        status: 'APPROVED',
        userId: 'user-2',
      });

      await expect(
        BookClubService.approveRequest('club-1', 'req-1', 'admin-1')
      ).rejects.toThrow('REQUEST_ALREADY_REVIEWED');
    });

    it('should approve request and create member', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'ACTIVE' });
      mockPrisma.membershipRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        bookClubId: 'club-1',
        status: 'PENDING',
        userId: 'user-2',
      });
      const member = { id: 'm-1', userId: 'user-2', role: 'MEMBER' };
      const updatedReq = { id: 'req-1', status: 'APPROVED' };
      mockPrisma.$transaction.mockResolvedValue([member, updatedReq]);
      mockPrisma.bookClub.update.mockResolvedValue({});

      const result = await BookClubService.approveRequest('club-1', 'req-1', 'admin-1');
      expect(result.member).toEqual(member);
      expect(result.request).toEqual(updatedReq);
    });
  });

  describe('rejectRequest', () => {
    it('should throw INSUFFICIENT_PERMISSIONS if not admin', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(
        BookClubService.rejectRequest('club-1', 'req-1', 'user-1')
      ).rejects.toThrow('INSUFFICIENT_PERMISSIONS');
    });

    it('should reject pending request', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ role: 'OWNER', status: 'ACTIVE' });
      mockPrisma.membershipRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        bookClubId: 'club-1',
        status: 'PENDING',
        userId: 'user-2',
      });
      const updatedReq = { id: 'req-1', status: 'REJECTED' };
      mockPrisma.membershipRequest.update.mockResolvedValue(updatedReq);

      const result = await BookClubService.rejectRequest('club-1', 'req-1', 'owner-1');
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('leaveClub', () => {
    it('should throw NOT_A_MEMBER if not active member', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(BookClubService.leaveClub('club-1', 'user-1')).rejects.toThrow('NOT_A_MEMBER');
    });

    it('should throw OWNER_MUST_TRANSFER_OWNERSHIP if owner and other members exist', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({
        id: 'm-1',
        role: 'OWNER',
        status: 'ACTIVE',
      });
      mockPrisma.bookClubMember.count.mockResolvedValue(3);

      await expect(BookClubService.leaveClub('club-1', 'user-1')).rejects.toThrow('OWNER_MUST_TRANSFER_OWNERSHIP');
    });

    it('should allow owner to leave if they are the only member', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({
        id: 'm-1',
        role: 'OWNER',
        status: 'ACTIVE',
      });
      mockPrisma.bookClubMember.count.mockResolvedValue(1);
      mockPrisma.bookClubMember.update.mockResolvedValue({});

      const result = await BookClubService.leaveClub('club-1', 'user-1');
      expect(result.success).toBe(true);
    });

    it('should allow regular member to leave', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({
        id: 'm-1',
        role: 'MEMBER',
        status: 'ACTIVE',
      });
      mockPrisma.bookClubMember.update.mockResolvedValue({});

      const result = await BookClubService.leaveClub('club-1', 'user-1');
      expect(result.success).toBe(true);
      expect(mockPrisma.bookClubMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'LEFT' },
        })
      );
    });
  });

  describe('removeMember', () => {
    it('should throw INSUFFICIENT_PERMISSIONS if not admin', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(
        BookClubService.removeMember('club-1', 'target-1', 'user-1')
      ).rejects.toThrow('INSUFFICIENT_PERMISSIONS');
    });

    it('should throw CANNOT_REMOVE_OWNER', async () => {
      // First call: checkPermission for remover (returns ADMIN)
      // Second call: getMembership for target (returns OWNER)
      mockPrisma.bookClubMember.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN', status: 'ACTIVE' })
        .mockResolvedValueOnce({ id: 'm-target', role: 'OWNER', status: 'ACTIVE' });

      await expect(
        BookClubService.removeMember('club-1', 'owner-1', 'admin-1')
      ).rejects.toThrow('CANNOT_REMOVE_OWNER');
    });

    it('should remove regular member', async () => {
      mockPrisma.bookClubMember.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN', status: 'ACTIVE' })
        .mockResolvedValueOnce({ id: 'm-target', role: 'MEMBER', status: 'ACTIVE' });
      mockPrisma.bookClubMember.update.mockResolvedValue({});

      const result = await BookClubService.removeMember('club-1', 'target-1', 'admin-1');
      expect(result.success).toBe(true);
    });
  });

  describe('updateMemberRole', () => {
    it('should throw INSUFFICIENT_PERMISSIONS if not owner', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(
        BookClubService.updateMemberRole('club-1', 'target-1', 'ADMIN' as any, 'user-1')
      ).rejects.toThrow('INSUFFICIENT_PERMISSIONS');
    });

    it('should throw CANNOT_CHANGE_OWNER_ROLE when targeting owner', async () => {
      mockPrisma.bookClubMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER', status: 'ACTIVE' })
        .mockResolvedValueOnce({ id: 'm-target', role: 'OWNER', status: 'ACTIVE' });

      await expect(
        BookClubService.updateMemberRole('club-1', 'owner-1', 'ADMIN' as any, 'owner-2')
      ).rejects.toThrow('CANNOT_CHANGE_OWNER_ROLE');
    });

    it('should throw CANNOT_CHANGE_OWNER_ROLE when setting to OWNER', async () => {
      mockPrisma.bookClubMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER', status: 'ACTIVE' })
        .mockResolvedValueOnce({ id: 'm-target', role: 'MEMBER', status: 'ACTIVE' });

      await expect(
        BookClubService.updateMemberRole('club-1', 'target-1', 'OWNER' as any, 'owner-1')
      ).rejects.toThrow('CANNOT_CHANGE_OWNER_ROLE');
    });

    it('should update role for valid request', async () => {
      mockPrisma.bookClubMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER', status: 'ACTIVE' })
        .mockResolvedValueOnce({ id: 'm-target', role: 'MEMBER', status: 'ACTIVE' });
      const updated = { id: 'm-target', role: 'ADMIN' };
      mockPrisma.bookClubMember.update.mockResolvedValue(updated);

      const result = await BookClubService.updateMemberRole('club-1', 'target-1', 'ADMIN' as any, 'owner-1');
      expect(result.role).toBe('ADMIN');
    });
  });

  describe('updateClub', () => {
    it('should throw INSUFFICIENT_PERMISSIONS if not admin', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(
        BookClubService.updateClub('club-1', 'user-1', { name: 'New Name' })
      ).rejects.toThrow('INSUFFICIENT_PERMISSIONS');
    });

    it('should update club settings', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'ACTIVE' });
      const updated = { id: 'club-1', name: 'New Name' };
      mockPrisma.bookClub.update.mockResolvedValue(updated);

      const result = await BookClubService.updateClub('club-1', 'admin-1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });
  });

  describe('deleteClub', () => {
    it('should throw INSUFFICIENT_PERMISSIONS if not owner', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'ACTIVE' });

      await expect(BookClubService.deleteClub('club-1', 'admin-1')).rejects.toThrow('INSUFFICIENT_PERMISSIONS');
    });

    it('should delete club for owner', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ role: 'OWNER', status: 'ACTIVE' });
      mockPrisma.bookClub.delete.mockResolvedValue({});

      const result = await BookClubService.deleteClub('club-1', 'owner-1');
      expect(result.success).toBe(true);
    });
  });

  describe('joinByInvite', () => {
    it('should throw INVALID_INVITE for non-existent invite', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue(null);

      await expect(BookClubService.joinByInvite('BADCODE1', 'user-1')).rejects.toThrow('INVALID_INVITE');
    });

    it('should throw INVITE_EXPIRED for expired invite', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        code: 'ABC12345',
        bookClubId: 'club-1',
        bookClub: { id: 'club-1' },
        expiresAt: new Date('2020-01-01'),
        maxUses: null,
        currentUses: 0,
      });

      await expect(BookClubService.joinByInvite('ABC12345', 'user-1')).rejects.toThrow('INVITE_EXPIRED');
    });

    it('should throw INVITE_MAX_USES_REACHED when maxed out', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        code: 'ABC12345',
        bookClubId: 'club-1',
        bookClub: { id: 'club-1' },
        expiresAt: null,
        maxUses: 5,
        currentUses: 5,
      });

      await expect(BookClubService.joinByInvite('ABC12345', 'user-1')).rejects.toThrow('INVITE_MAX_USES_REACHED');
    });

    it('should throw ALREADY_MEMBER if already active', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        code: 'ABC12345',
        bookClubId: 'club-1',
        bookClub: { id: 'club-1' },
        createdBy: 'creator',
        expiresAt: null,
        maxUses: null,
        currentUses: 0,
      });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ status: 'ACTIVE' });

      await expect(BookClubService.joinByInvite('ABC12345', 'user-1')).rejects.toThrow('ALREADY_MEMBER');
    });

    it('should join successfully via invite', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        code: 'ABC12345',
        bookClubId: 'club-1',
        bookClub: { id: 'club-1', name: 'Test Club' },
        createdBy: 'creator',
        expiresAt: null,
        maxUses: null,
        currentUses: 0,
      });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);
      const member = { id: 'm-1', userId: 'user-1', role: 'MEMBER' };
      mockPrisma.$transaction.mockResolvedValue([member, {}]);
      mockPrisma.bookClub.update.mockResolvedValue({});

      const result = await BookClubService.joinByInvite('ABC12345', 'user-1');
      expect(result.member).toEqual(member);
      expect(result.club).toEqual({ id: 'club-1', name: 'Test Club' });
    });
  });

  describe('getShareableInvite', () => {
    it('should throw INSUFFICIENT_PERMISSIONS if not member', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(BookClubService.getShareableInvite('club-1', 'user-1')).rejects.toThrow('INSUFFICIENT_PERMISSIONS');
    });

    it('should return invite for member', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ role: 'MEMBER', status: 'ACTIVE' });
      const invite = { id: 'inv-1', code: 'ABC12345' };
      mockPrisma.bookClubInvite.findFirst.mockResolvedValue(invite);

      const result = await BookClubService.getShareableInvite('club-1', 'user-1');
      expect(result).toEqual(invite);
    });
  });

  describe('deleteInvite', () => {
    it('should throw INSUFFICIENT_PERMISSIONS if not admin', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(
        BookClubService.deleteInvite('club-1', 'inv-1', 'user-1')
      ).rejects.toThrow('INSUFFICIENT_PERMISSIONS');
    });

    it('should throw INVITE_NOT_FOUND for non-existent invite', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'ACTIVE' });
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue(null);

      await expect(
        BookClubService.deleteInvite('club-1', 'inv-1', 'admin-1')
      ).rejects.toThrow('INVITE_NOT_FOUND');
    });

    it('should delete valid invite', async () => {
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'ACTIVE' });
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({ id: 'inv-1', bookClubId: 'club-1' });
      mockPrisma.bookClubInvite.delete.mockResolvedValue({});

      const result = await BookClubService.deleteInvite('club-1', 'inv-1', 'admin-1');
      expect(result.success).toBe(true);
    });
  });
});
