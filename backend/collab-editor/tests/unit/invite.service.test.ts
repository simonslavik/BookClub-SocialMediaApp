// Mock dependencies before importing
const mockPrisma = {
  bookClub: {
    findUnique: jest.fn(),
  },
  bookClubMember: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  bookClubInvite: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

const mockInviteRepo = {
  findByCode: jest.fn(),
  findByBookClub: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  incrementUses: jest.fn(),
};

jest.mock('../../src/repositories/invite.repository', () => ({
  InviteRepository: mockInviteRepo,
}));

jest.mock('../../src/utils/inviteCodeGenerator', () => ({
  generateInviteCode: jest.fn().mockReturnValue('TESTCODE'),
}));

import { InviteService } from '../../src/services/invite.service';

describe('InviteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInvite', () => {
    it('should throw if book club not found', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue(null);

      await expect(InviteService.getInvite('club-1', 'user-1')).rejects.toThrow('Book club not found');
    });

    it('should throw if user is not a member', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', creatorId: 'other-user' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(InviteService.getInvite('club-1', 'user-1')).rejects.toThrow(
        'Only book club members can view invite'
      );
    });

    it('should allow creator to view invite', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', creatorId: 'user-1' });
      const invite = { id: 'inv-1', code: 'ABC12345' };
      mockPrisma.bookClubInvite.findFirst.mockResolvedValue(invite);

      const result = await InviteService.getInvite('club-1', 'user-1');
      expect(result).toEqual(invite);
    });

    it('should allow active member to view invite', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', creatorId: 'other-user' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ status: 'ACTIVE' });
      const invite = { id: 'inv-1', code: 'ABC12345' };
      mockPrisma.bookClubInvite.findFirst.mockResolvedValue(invite);

      const result = await InviteService.getInvite('club-1', 'user-1');
      expect(result).toEqual(invite);
    });

    it('should create new invite if none exists', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', creatorId: 'user-1', name: 'Test' });
      mockPrisma.bookClubInvite.findFirst.mockResolvedValue(null);
      mockInviteRepo.findByCode.mockResolvedValue(null);
      const newInvite = { id: 'inv-new', code: 'TESTCODE' };
      mockInviteRepo.create.mockResolvedValue(newInvite);

      const result = await InviteService.getInvite('club-1', 'user-1');
      expect(result).toEqual(newInvite);
      expect(mockInviteRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ bookClubId: 'club-1', code: 'TESTCODE' })
      );
    });
  });

  describe('joinViaInvite', () => {
    it('should throw for invalid invite code', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue(null);

      await expect(InviteService.joinViaInvite('BADCODE1', 'user-1')).rejects.toThrow(
        'Invalid invite code'
      );
    });

    it('should throw for expired invite', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        code: 'ABC12345',
        bookClubId: 'club-1',
        bookClub: { id: 'club-1', creatorId: 'creator', name: 'Test' },
        expiresAt: new Date('2020-01-01'),
        maxUses: null,
        currentUses: 0,
      });

      await expect(InviteService.joinViaInvite('ABC12345', 'user-1')).rejects.toThrow(
        'This invite has expired'
      );
    });

    it('should throw for maxed out invite', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        code: 'ABC12345',
        bookClubId: 'club-1',
        bookClub: { id: 'club-1', creatorId: 'creator', name: 'Test' },
        expiresAt: null,
        maxUses: 3,
        currentUses: 3,
      });

      await expect(InviteService.joinViaInvite('ABC12345', 'user-1')).rejects.toThrow(
        'This invite has reached its maximum uses'
      );
    });

    it('should throw if already a member', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        code: 'ABC12345',
        bookClubId: 'club-1',
        bookClub: { id: 'club-1', creatorId: 'creator', name: 'Test' },
        expiresAt: null,
        maxUses: null,
        currentUses: 0,
      });
      mockPrisma.bookClubMember.findFirst.mockResolvedValue({ userId: 'user-1' });

      await expect(InviteService.joinViaInvite('ABC12345', 'user-1')).rejects.toThrow(
        'You are already a member of this book club'
      );
    });

    it('should throw if user is the creator', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        code: 'ABC12345',
        bookClubId: 'club-1',
        bookClub: { id: 'club-1', creatorId: 'user-1', name: 'Test' },
        expiresAt: null,
        maxUses: null,
        currentUses: 0,
      });
      mockPrisma.bookClubMember.findFirst.mockResolvedValue(null);

      await expect(InviteService.joinViaInvite('ABC12345', 'user-1')).rejects.toThrow(
        'You are already a member of this book club'
      );
    });

    it('should add user as member and increment uses', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        code: 'ABC12345',
        bookClubId: 'club-1',
        bookClub: { id: 'club-1', creatorId: 'creator', name: 'Test Club' },
        expiresAt: null,
        maxUses: null,
        currentUses: 0,
      });
      mockPrisma.bookClubMember.findFirst.mockResolvedValue(null);
      mockPrisma.bookClubMember.create.mockResolvedValue({});
      mockInviteRepo.incrementUses.mockResolvedValue({});

      const result = await InviteService.joinViaInvite('ABC12345', 'user-1');
      expect(result).toEqual({ id: 'club-1', creatorId: 'creator', name: 'Test Club' });
      expect(mockPrisma.bookClubMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bookClubId: 'club-1',
          userId: 'user-1',
          role: 'MEMBER',
          status: 'ACTIVE',
        }),
      });
      expect(mockInviteRepo.incrementUses).toHaveBeenCalledWith('inv-1');
    });
  });

  describe('create', () => {
    it('should throw if book club not found', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue(null);

      await expect(
        InviteService.create('club-1', 'user-1', {})
      ).rejects.toThrow('Book club not found');
    });

    it('should throw if user is not a member', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', creatorId: 'other' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(
        InviteService.create('club-1', 'user-1', {})
      ).rejects.toThrow('Only book club members can create invites');
    });

    it('should create invite for valid member', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', creatorId: 'user-1', name: 'Test' });
      mockInviteRepo.findByCode.mockResolvedValue(null);
      const invite = { id: 'inv-1', code: 'TESTCODE' };
      mockInviteRepo.create.mockResolvedValue(invite);

      const result = await InviteService.create('club-1', 'user-1', { maxUses: 10 });
      expect(result).toEqual(invite);
    });
  });

  describe('getAllInvites', () => {
    it('should throw if book club not found', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue(null);

      await expect(InviteService.getAllInvites('club-1', 'user-1')).rejects.toThrow(
        'Book club not found'
      );
    });

    it('should throw if user is not the creator', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', creatorId: 'other-user' });

      await expect(InviteService.getAllInvites('club-1', 'user-1')).rejects.toThrow(
        'Only the book club creator can view all invites'
      );
    });

    it('should return invites for the creator', async () => {
      mockPrisma.bookClub.findUnique.mockResolvedValue({ id: 'club-1', creatorId: 'user-1' });
      const invites = [{ id: 'inv-1' }, { id: 'inv-2' }];
      mockInviteRepo.findByBookClub.mockResolvedValue(invites);

      const result = await InviteService.getAllInvites('club-1', 'user-1');
      expect(result).toEqual(invites);
    });
  });

  describe('delete', () => {
    it('should throw if invite not found', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue(null);

      await expect(InviteService.delete('inv-1', 'user-1')).rejects.toThrow('Invite not found');
    });

    it('should throw if not creator or invite owner', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        createdBy: 'other-user',
        bookClub: { creatorId: 'club-creator' },
      });

      await expect(InviteService.delete('inv-1', 'user-1')).rejects.toThrow(
        'Only the creator or invite owner can delete this invite'
      );
    });

    it('should allow club creator to delete invite', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        createdBy: 'other-user',
        bookClub: { creatorId: 'user-1' },
      });
      mockInviteRepo.delete.mockResolvedValue(undefined);

      await InviteService.delete('inv-1', 'user-1');
      expect(mockInviteRepo.delete).toHaveBeenCalledWith('inv-1');
    });

    it('should allow invite creator to delete their own invite', async () => {
      mockPrisma.bookClubInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        createdBy: 'user-1',
        bookClub: { creatorId: 'club-creator' },
      });
      mockInviteRepo.delete.mockResolvedValue(undefined);

      await InviteService.delete('inv-1', 'user-1');
      expect(mockInviteRepo.delete).toHaveBeenCalledWith('inv-1');
    });
  });
});
