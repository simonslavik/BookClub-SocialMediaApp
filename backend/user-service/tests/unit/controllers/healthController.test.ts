import { jest } from '@jest/globals';
import { Request, Response } from 'express';

// Mock dependencies before imports
jest.mock('../../../src/utils/logger.js', () => {
  const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  return { __esModule: true, default: mockLogger, logger: mockLogger, logError: jest.fn() };
});

const mockPrisma = {
  $queryRaw: jest.fn(),
};

jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import { healthCheck, readinessCheck, livenessCheck } from '../../../src/controllers/healthController.js';

describe('HealthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => jest.clearAllMocks());

  // ─── healthCheck ──────────────────────────────
  describe('healthCheck', () => {
    it('should return healthy status when database is connected', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      await healthCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          service: 'user-service',
          database: 'connected',
        })
      );
    });

    it('should return unhealthy status when database is disconnected', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      await healthCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          service: 'user-service',
          database: 'disconnected',
        })
      );
    });
  });

  // ─── readinessCheck ──────────────────────────────
  describe('readinessCheck', () => {
    it('should return ready when database is ok', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      await readinessCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ready',
          checks: { database: 'ok' },
        })
      );
    });

    it('should return not ready when database fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB down'));

      await readinessCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'not ready',
          checks: { database: 'failed' },
        })
      );
    });
  });

  // ─── livenessCheck ──────────────────────────────
  describe('livenessCheck', () => {
    it('should return alive status', () => {
      livenessCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'alive',
        })
      );
    });

    it('should include uptime', () => {
      livenessCheck(mockReq as Request, mockRes as Response);

      const jsonCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall).toHaveProperty('uptime');
      expect(typeof jsonCall.uptime).toBe('number');
    });
  });
});
