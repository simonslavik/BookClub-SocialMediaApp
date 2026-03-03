// Mock dependencies before importing
const mockPrisma = {
  bookClubMember: {
    findUnique: jest.fn(),
  },
};

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

const mockRoomRepo = {
  findById: jest.fn(),
  findByBookClub: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  getMessages: jest.fn(),
};

jest.mock('../../src/repositories/room.repository', () => ({
  RoomRepository: mockRoomRepo,
}));

const mockBookClubRepo = {
  findById: jest.fn(),
};

jest.mock('../../src/repositories/bookClub.repository', () => ({
  BookClubRepository: mockBookClubRepo,
}));

import { RoomService } from '../../src/services/room.service';

describe('RoomService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw if room name is empty', async () => {
      await expect(
        RoomService.create('club-1', 'user-1', { name: '' })
      ).rejects.toThrow('Room name is required');
    });

    it('should throw if room name is only whitespace', async () => {
      await expect(
        RoomService.create('club-1', 'user-1', { name: '   ' })
      ).rejects.toThrow('Room name is required');
    });

    it('should throw if book club not found', async () => {
      mockBookClubRepo.findById.mockResolvedValue(null);

      await expect(
        RoomService.create('club-1', 'user-1', { name: 'discussion' })
      ).rejects.toThrow('Book club not found');
    });

    it('should throw if user is not a member', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(
        RoomService.create('club-1', 'user-1', { name: 'discussion' })
      ).rejects.toThrow('You must be a member to create rooms');
    });

    it('should throw if membership is not ACTIVE', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ status: 'LEFT' });

      await expect(
        RoomService.create('club-1', 'user-1', { name: 'discussion' })
      ).rejects.toThrow('You must be a member to create rooms');
    });

    it('should create room for active member', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ status: 'ACTIVE' });
      const room = { id: 'r-1', name: 'discussion', bookClubId: 'club-1' };
      mockRoomRepo.create.mockResolvedValue(room);

      const result = await RoomService.create('club-1', 'user-1', { name: '  discussion  ' });
      expect(result).toEqual(room);
      expect(mockRoomRepo.create).toHaveBeenCalledWith({
        name: 'discussion',
        bookClubId: 'club-1',
      });
    });
  });

  describe('getRooms', () => {
    it('should return rooms for book club', async () => {
      const rooms = [{ id: 'r-1', name: 'general' }, { id: 'r-2', name: 'discussion' }];
      mockRoomRepo.findByBookClub.mockResolvedValue(rooms);

      const result = await RoomService.getRooms('club-1');
      expect(result).toEqual(rooms);
    });
  });

  describe('getRoomMessages', () => {
    it('should return messages with default limit', async () => {
      const messages = [{ id: 'm-1', content: 'Hello' }];
      mockRoomRepo.getMessages.mockResolvedValue(messages);

      const result = await RoomService.getRoomMessages('r-1');
      expect(result).toEqual(messages);
      expect(mockRoomRepo.getMessages).toHaveBeenCalledWith('r-1', 100);
    });

    it('should accept custom limit', async () => {
      mockRoomRepo.getMessages.mockResolvedValue([]);

      await RoomService.getRoomMessages('r-1', 50);
      expect(mockRoomRepo.getMessages).toHaveBeenCalledWith('r-1', 50);
    });
  });

  describe('delete', () => {
    it('should throw if book club not found', async () => {
      mockBookClubRepo.findById.mockResolvedValue(null);

      await expect(RoomService.delete('club-1', 'r-1', 'user-1')).rejects.toThrow(
        'Book club not found'
      );
    });

    it('should throw if user is not the creator', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1', creatorId: 'other-user' });

      await expect(RoomService.delete('club-1', 'r-1', 'user-1')).rejects.toThrow(
        'Only the book club creator can delete rooms'
      );
    });

    it('should throw if room not found', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1', creatorId: 'user-1' });
      mockRoomRepo.findById.mockResolvedValue(null);

      await expect(RoomService.delete('club-1', 'r-1', 'user-1')).rejects.toThrow(
        'Room not found'
      );
    });

    it('should throw if trying to delete general room', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1', creatorId: 'user-1' });
      mockRoomRepo.findById.mockResolvedValue({ id: 'r-1', name: 'general' });

      await expect(RoomService.delete('club-1', 'r-1', 'user-1')).rejects.toThrow(
        'Cannot delete the general room'
      );
    });

    it('should throw if trying to delete the last room', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1', creatorId: 'user-1' });
      mockRoomRepo.findById.mockResolvedValue({ id: 'r-1', name: 'discussion' });
      mockRoomRepo.findByBookClub.mockResolvedValue([{ id: 'r-1' }]);

      await expect(RoomService.delete('club-1', 'r-1', 'user-1')).rejects.toThrow(
        'Cannot delete the last room'
      );
    });

    it('should delete room when valid', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1', creatorId: 'user-1' });
      mockRoomRepo.findById.mockResolvedValue({ id: 'r-1', name: 'discussion' });
      mockRoomRepo.findByBookClub.mockResolvedValue([{ id: 'r-1' }, { id: 'r-2' }]);
      mockRoomRepo.delete.mockResolvedValue(undefined);

      await RoomService.delete('club-1', 'r-1', 'user-1');
      expect(mockRoomRepo.delete).toHaveBeenCalledWith('r-1');
    });
  });
});
