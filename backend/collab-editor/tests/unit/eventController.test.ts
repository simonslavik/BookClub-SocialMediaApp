// Mock dependencies
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {},
}));

const mockEventService = {
  getEvents: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../src/services/event.service', () => ({
  EventService: mockEventService,
}));

import { Request, Response } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../src/controllers/eventController';

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

describe('EventController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should return events for a book club', async () => {
      const events = [{ id: 'e-1', title: 'Discussion' }];
      mockEventService.getEvents.mockResolvedValue(events);

      const req = mockReq({ params: { bookClubId: 'club-1' } }) as Request;
      const res = mockRes() as Response;

      await getEvents(req, res);

      expect(res.json).toHaveBeenCalledWith({ events });
    });

    it('should return 404 if book club not found', async () => {
      mockEventService.getEvents.mockRejectedValue(new Error('Book club not found'));

      const req = mockReq({ params: { bookClubId: 'bad-id' } }) as Request;
      const res = mockRes() as Response;

      await getEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 for unknown errors', async () => {
      mockEventService.getEvents.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ params: { bookClubId: 'club-1' } }) as Request;
      const res = mockRes() as Response;

      await getEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createEvent', () => {
    it('should create event and return it', async () => {
      const event = { id: 'e-1', title: 'Discussion' };
      mockEventService.create.mockResolvedValue(event);

      const req = mockReq({
        params: { bookClubId: 'club-1' },
        body: { title: 'Discussion', eventDate: '2026-03-01' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await createEvent(req as any, res);

      expect(res.json).toHaveBeenCalledWith({ event, message: 'Event created successfully' });
    });

    it('should return 400 for validation errors', async () => {
      mockEventService.create.mockRejectedValue(new Error('Title and event date are required'));

      const req = mockReq({
        params: { bookClubId: 'club-1' },
        body: {},
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await createEvent(req as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 for non-member', async () => {
      mockEventService.create.mockRejectedValue(new Error('You must be a member to create events'));

      const req = mockReq({
        params: { bookClubId: 'club-1' },
        body: { title: 'Test', eventDate: '2026-03-01' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await createEvent(req as any, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateEvent', () => {
    it('should update event', async () => {
      const updated = { id: 'e-1', title: 'Updated' };
      mockEventService.update.mockResolvedValue(updated);

      const req = mockReq({
        params: { eventId: 'e-1' },
        body: { title: 'Updated' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await updateEvent(req as any, res);

      expect(res.json).toHaveBeenCalledWith({ event: updated, message: 'Event updated successfully' });
    });

    it('should return 404 for non-existent event', async () => {
      mockEventService.update.mockRejectedValue(new Error('Event not found'));

      const req = mockReq({
        params: { eventId: 'bad-id' },
        body: { title: 'Updated' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await updateEvent(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if not event creator', async () => {
      mockEventService.update.mockRejectedValue(new Error('Only the event creator can update it'));

      const req = mockReq({
        params: { eventId: 'e-1' },
        body: { title: 'Updated' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await updateEvent(req as any, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteEvent', () => {
    it('should delete event', async () => {
      mockEventService.delete.mockResolvedValue(undefined);

      const req = mockReq({
        params: { eventId: 'e-1' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await deleteEvent(req as any, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Event deleted successfully' });
    });

    it('should return 404 for non-existent event', async () => {
      mockEventService.delete.mockRejectedValue(new Error('Event not found'));

      const req = mockReq({
        params: { eventId: 'bad-id' },
        user: { userId: 'user-1' },
      }) as Request;
      const res = mockRes() as Response;

      await deleteEvent(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
