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

const mockEventRepo = {
  findByBookClub: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../src/repositories/event.repository', () => ({
  EventRepository: mockEventRepo,
}));

const mockBookClubRepo = {
  findById: jest.fn(),
};

jest.mock('../../src/repositories/bookClub.repository', () => ({
  BookClubRepository: mockBookClubRepo,
}));

import { EventService } from '../../src/services/event.service';

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should throw if book club not found', async () => {
      mockBookClubRepo.findById.mockResolvedValue(null);

      await expect(EventService.getEvents('club-1')).rejects.toThrow('Book club not found');
    });

    it('should return events for valid book club', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1' });
      const events = [
        { id: 'e-1', title: 'Discussion' },
        { id: 'e-2', title: 'Reading Session' },
      ];
      mockEventRepo.findByBookClub.mockResolvedValue(events);

      const result = await EventService.getEvents('club-1');
      expect(result).toEqual(events);
      expect(mockEventRepo.findByBookClub).toHaveBeenCalledWith('club-1');
    });
  });

  describe('create', () => {
    it('should throw if title is missing', async () => {
      await expect(
        EventService.create('club-1', 'user-1', { title: '', eventDate: '2026-03-01' })
      ).rejects.toThrow('Title and event date are required');
    });

    it('should throw if eventDate is missing', async () => {
      await expect(
        EventService.create('club-1', 'user-1', { title: 'Test', eventDate: '' })
      ).rejects.toThrow('Title and event date are required');
    });

    it('should throw if book club not found', async () => {
      mockBookClubRepo.findById.mockResolvedValue(null);

      await expect(
        EventService.create('club-1', 'user-1', { title: 'Test', eventDate: '2026-03-01' })
      ).rejects.toThrow('Book club not found');
    });

    it('should throw if user is not a member', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue(null);

      await expect(
        EventService.create('club-1', 'user-1', { title: 'Test', eventDate: '2026-03-01' })
      ).rejects.toThrow('You must be a member to create events');
    });

    it('should create event for valid member', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ userId: 'user-1' });
      const event = { id: 'e-1', title: 'Book Discussion', eventType: 'meeting' };
      mockEventRepo.create.mockResolvedValue(event);

      const result = await EventService.create('club-1', 'user-1', {
        title: 'Book Discussion',
        eventDate: '2026-03-01T10:00:00Z',
        description: 'Discuss chapter 5',
      });

      expect(result).toEqual(event);
      expect(mockEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Book Discussion',
          bookClubId: 'club-1',
          createdBy: 'user-1',
          eventType: 'meeting',
        })
      );
    });

    it('should trim title and description', async () => {
      mockBookClubRepo.findById.mockResolvedValue({ id: 'club-1' });
      mockPrisma.bookClubMember.findUnique.mockResolvedValue({ userId: 'user-1' });
      mockEventRepo.create.mockResolvedValue({ id: 'e-1', title: 'Trimmed' });

      await EventService.create('club-1', 'user-1', {
        title: '  Trimmed  ',
        eventDate: '2026-03-01',
        description: '  Some desc  ',
      });

      expect(mockEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Trimmed',
          description: 'Some desc',
        })
      );
    });
  });

  describe('update', () => {
    it('should throw if event not found', async () => {
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(
        EventService.update('e-1', 'user-1', { title: 'Updated' })
      ).rejects.toThrow('Event not found');
    });

    it('should throw if not the event creator', async () => {
      mockEventRepo.findById.mockResolvedValue({ id: 'e-1', createdBy: 'other-user' });

      await expect(
        EventService.update('e-1', 'user-1', { title: 'Updated' })
      ).rejects.toThrow('Only the event creator can update it');
    });

    it('should update event for the creator', async () => {
      mockEventRepo.findById.mockResolvedValue({ id: 'e-1', createdBy: 'user-1' });
      const updated = { id: 'e-1', title: 'Updated Title' };
      mockEventRepo.update.mockResolvedValue(updated);

      const result = await EventService.update('e-1', 'user-1', { title: '  Updated Title  ' });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should throw if event not found', async () => {
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(EventService.delete('e-1', 'user-1')).rejects.toThrow('Event not found');
    });

    it('should throw if not the event creator', async () => {
      mockEventRepo.findById.mockResolvedValue({ id: 'e-1', createdBy: 'other-user', title: 'Test' });

      await expect(EventService.delete('e-1', 'user-1')).rejects.toThrow(
        'Only the event creator can delete it'
      );
    });

    it('should delete event for the creator', async () => {
      mockEventRepo.findById.mockResolvedValue({ id: 'e-1', createdBy: 'user-1', title: 'Test' });
      mockEventRepo.delete.mockResolvedValue(undefined);

      await EventService.delete('e-1', 'user-1');
      expect(mockEventRepo.delete).toHaveBeenCalledWith('e-1');
    });
  });
});
