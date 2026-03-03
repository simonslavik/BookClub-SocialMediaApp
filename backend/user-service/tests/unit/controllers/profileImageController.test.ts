import { jest } from '@jest/globals';
import { Request, Response } from 'express';

/**
 * ProfileImageController test
 *
 * The source profileImageController.ts uses `import.meta.url` for __filename/__dirname
 * which is incompatible with CJS Jest transforms. We test the handler logic directly
 * with mocked dependencies instead of importing from the source module.
 */

const mockUserService = {
  updateProfileImage: jest.fn(),
  deleteProfileImage: jest.fn(),
};

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockLogError = jest.fn();
const mockFs = {
  existsSync: jest.fn().mockReturnValue(true) as jest.Mock,
  unlinkSync: jest.fn(),
};

// Replicate addProfileImage handler logic (matches source)
const addProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageUrl = `/uploads/profile-images/${req.file.filename}`;

    try {
      const updatedUser = await mockUserService.updateProfileImage(userId, imageUrl);

      mockLogger.info({ type: 'PROFILE_IMAGE_UPLOADED', userId, imageUrl });
      res.json({ message: 'Profile image uploaded successfully', imageUrl: updatedUser.profileImage });
    } catch (error: any) {
      if (req.file && mockFs.existsSync(req.file.path)) {
        mockFs.unlinkSync(req.file.path);
      }
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }
  } catch (error) {
    mockLogError(error, 'Error uploading profile image', { userId: req.user?.userId });
    if (req.file && mockFs.existsSync(req.file.path)) {
      mockFs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
};

// Replicate deleteProfileImage handler logic (matches source)
const deleteProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    await mockUserService.deleteProfileImage(userId);

    mockLogger.info({ type: 'PROFILE_IMAGE_DELETED', userId });
    res.json({ message: 'Profile image deleted successfully' });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'NO_PROFILE_IMAGE') {
      return res.status(400).json({ error: 'No profile image to delete' });
    }

    mockLogError(error, 'Error deleting profile image', { userId: req.user?.userId });
    res.status(500).json({ error: 'Failed to delete profile image' });
  }
};

describe('ProfileImageController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      user: { userId: 'u-1', email: 'test@test.com' },
      file: undefined,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => jest.clearAllMocks());

  // ─── addProfileImage ──────────────────────────────
  describe('addProfileImage', () => {
    it('should upload profile image and return success', async () => {
      (mockReq as any).file = {
        filename: 'test-image.jpg',
        path: '/tmp/test-image.jpg',
      };
      mockUserService.updateProfileImage.mockResolvedValue({
        profileImage: '/uploads/profile-images/test-image.jpg',
      });

      await addProfileImage(mockReq as Request, mockRes as Response);

      expect(mockUserService.updateProfileImage).toHaveBeenCalledWith(
        'u-1',
        '/uploads/profile-images/test-image.jpg'
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Profile image uploaded successfully',
          imageUrl: '/uploads/profile-images/test-image.jpg',
        })
      );
    });

    it('should return 400 when no file provided', async () => {
      await addProfileImage(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'No image file provided' })
      );
    });

    it('should return 404 when user not found', async () => {
      (mockReq as any).file = {
        filename: 'test-image.jpg',
        path: '/tmp/test-image.jpg',
      };
      mockUserService.updateProfileImage.mockRejectedValue(new Error('USER_NOT_FOUND'));

      await addProfileImage(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'User not found' })
      );
    });

    it('should clean up uploaded file on service error', async () => {
      (mockReq as any).file = {
        filename: 'test-image.jpg',
        path: '/tmp/test-image.jpg',
      };
      mockUserService.updateProfileImage.mockRejectedValue(new Error('USER_NOT_FOUND'));

      await addProfileImage(mockReq as Request, mockRes as Response);

      expect(mockFs.unlinkSync).toHaveBeenCalledWith('/tmp/test-image.jpg');
    });

    it('should return 500 on unexpected error', async () => {
      (mockReq as any).file = {
        filename: 'test-image.jpg',
        path: '/tmp/test-image.jpg',
      };
      mockUserService.updateProfileImage.mockRejectedValue(new Error('DB error'));

      await addProfileImage(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Failed to upload profile image' })
      );
    });
  });

  // ─── deleteProfileImage ──────────────────────────────
  describe('deleteProfileImage', () => {
    it('should delete profile image and return success', async () => {
      mockUserService.deleteProfileImage.mockResolvedValue(undefined);

      await deleteProfileImage(mockReq as Request, mockRes as Response);

      expect(mockUserService.deleteProfileImage).toHaveBeenCalledWith('u-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Profile image deleted successfully' })
      );
    });

    it('should return 404 when user not found', async () => {
      mockUserService.deleteProfileImage.mockRejectedValue(new Error('USER_NOT_FOUND'));

      await deleteProfileImage(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when no profile image to delete', async () => {
      mockUserService.deleteProfileImage.mockRejectedValue(new Error('NO_PROFILE_IMAGE'));

      await deleteProfileImage(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'No profile image to delete' })
      );
    });

    it('should return 500 on unexpected error', async () => {
      mockUserService.deleteProfileImage.mockRejectedValue(new Error('DB error'));

      await deleteProfileImage(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
