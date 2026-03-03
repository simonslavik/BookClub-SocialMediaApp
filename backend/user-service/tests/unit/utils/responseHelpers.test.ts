import { jest } from '@jest/globals';
import { Response } from 'express';
import {
  HttpStatus,
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendServerError,
  sendPaginated,
} from '../../../src/utils/responseHelpers.js';

describe('Response Helpers', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('HttpStatus', () => {
    it('should have correct status codes', () => {
      expect(HttpStatus.OK).toBe(200);
      expect(HttpStatus.CREATED).toBe(201);
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.UNAUTHORIZED).toBe(401);
      expect(HttpStatus.FORBIDDEN).toBe(403);
      expect(HttpStatus.NOT_FOUND).toBe(404);
      expect(HttpStatus.CONFLICT).toBe(409);
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe('sendSuccess', () => {
    it('should send 200 with data', () => {
      sendSuccess(mockRes as Response, { id: 1 }, 'Done');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Done',
        data: { id: 1 },
      });
    });

    it('should send 200 without data', () => {
      sendSuccess(mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
      });
    });
  });

  describe('sendCreated', () => {
    it('should send 201 with data', () => {
      sendCreated(mockRes as Response, { id: 1 }, 'Created');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created',
        data: { id: 1 },
      });
    });

    it('should use default message', () => {
      sendCreated(mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource created successfully',
      });
    });
  });

  describe('sendBadRequest', () => {
    it('should send 400 with message', () => {
      sendBadRequest(mockRes as Response, 'Invalid input');
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input',
      });
    });

    it('should use default message', () => {
      sendBadRequest(mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad request',
      });
    });
  });

  describe('sendUnauthorized', () => {
    it('should send 401', () => {
      sendUnauthorized(mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized',
      });
    });
  });

  describe('sendForbidden', () => {
    it('should send 403', () => {
      sendForbidden(mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden',
      });
    });
  });

  describe('sendNotFound', () => {
    it('should send 404 with resource name', () => {
      sendNotFound(mockRes as Response, 'User');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should use default resource name', () => {
      sendNotFound(mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
      });
    });
  });

  describe('sendConflict', () => {
    it('should send 409 with message', () => {
      sendConflict(mockRes as Response, 'Already exists');
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Already exists',
      });
    });
  });

  describe('sendServerError', () => {
    it('should send 500', () => {
      sendServerError(mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('sendPaginated', () => {
    it('should send paginated response', () => {
      sendPaginated(mockRes as Response, [1, 2, 3], 1, 10, 25);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [1, 2, 3],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasMore: true,
          hasPrevious: false,
        },
      });
    });

    it('should calculate last page correctly', () => {
      sendPaginated(mockRes as Response, [1], 3, 10, 25);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            page: 3,
            totalPages: 3,
            hasMore: false,
            hasPrevious: true,
          }),
        })
      );
    });

    it('should handle single page', () => {
      sendPaginated(mockRes as Response, [1, 2], 1, 10, 2);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            totalPages: 1,
            hasMore: false,
            hasPrevious: false,
          }),
        })
      );
    });
  });
});
