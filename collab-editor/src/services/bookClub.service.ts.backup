import { BookClubRepository } from '../repositories/bookClub.repository.js';
import { InviteRepository } from '../repositories/invite.repository.js';
import { generateInviteCode } from '../utils/inviteCodeGenerator.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CreateBookClubDto {
  name: string;
  category?: string;
  isPublic?: boolean;
}

interface UpdateBookClubDto {
  name?: string;
  isPublic?: boolean;
}

interface ActiveClient {
  id: string;
  userId: string;
  username: string;
  isDMConnection?: boolean;
}

interface ActiveBookClub {
  clients: Map<string, ActiveClient>;
}

export class BookClubService {
  private static activeBookClubs: Map<string, ActiveBookClub>;

  /**
   * Set active book clubs reference (from WebSocket)
   */
  static setActiveBookClubs(clubs: Map<string, ActiveBookClub>) {
    this.activeBookClubs = clubs;
  }

  /**
   * Generate unique invite code
   */
  private static async generateUniqueInviteCode(): Promise<string> {
    let code = generateInviteCode();
    let existing = await InviteRepository.findByCode(code);
    
    while (existing) {
      code = generateInviteCode();
      existing = await InviteRepository.findByCode(code);
    }
    
    return code;
  }

  /**
   * Create a new book club
   */
  static async create(userId: string, data: CreateBookClubDto) {
    if (!data.name || data.name.trim() === '') {
      throw new BadRequestError('Book club name is required');
    }

    const inviteCode = await this.generateUniqueInviteCode();
    
    const bookClub = await BookClubRepository.create({
      name: data.name.trim(),
      category: data.category || 'General',
      isPublic: data.isPublic !== false,
      creatorId: userId,
      inviteCode
    });

    console.log(`✨ Book club created by user ${userId}: ${bookClub.id} with permanent invite: ${inviteCode}`);
    
    return bookClub;
  }

  /**
   * Get book club with member details and connected users
   */
  static async getById(bookClubId: string) {
    const bookClub = await BookClubRepository.findById(bookClubId, true);
    
    if (!bookClub) {
      throw new NotFoundError('Book club not found');
    }

    // Fetch full user details for members
    const members = await this.fetchUserDetails(bookClub.members);
    
    // Get connected users
    const connectedUsers = this.getConnectedUsers(bookClubId);
    
    return {
      ...bookClub,
      members,
      connectedUsers
    };
  }

  /**
   * Update book club
   */
  static async update(bookClubId: string, userId: string, data: UpdateBookClubDto) {
    const bookClub = await BookClubRepository.findById(bookClubId);
    
    if (!bookClub) {
      throw new NotFoundError('Book club not found');
    }

    if (bookClub.creatorId !== userId) {
      throw new ForbiddenError('Only the book club creator can update the book club');
    }

    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.isPublic !== undefined) {
      updateData.isPublic = data.isPublic;
    }
    
    const updatedBookClub = await BookClubRepository.update(bookClubId, updateData);
    
    console.log(`✏️ Book club ${bookClubId} updated by user ${userId}`);
    
    return updatedBookClub;
  }

  /**
   * Get all book clubs with filters
   */
  static async getAll(userId?: string, onlyMine = false) {
    let bookClubs;
    
    if (onlyMine && userId) {
      bookClubs = await BookClubRepository.findByMember(userId);
    } else {
      bookClubs = await BookClubRepository.findPublic();
    }

    // Collect all unique user IDs
    const allUserIds = new Set<string>();
    bookClubs.forEach(club => {
      club.members.forEach(memberId => allUserIds.add(memberId));
    });

    // Fetch user details
    const userDetailsMap = await this.fetchUserDetailsMap(Array.from(allUserIds));
    
    // Fetch current books from books-service
    const currentBooksMap = await this.fetchCurrentBooks(bookClubs.map(c => c.id));
    
    // Enrich book clubs with details
    return bookClubs.map(club => {
      const memberDetails = club.members
        .map(memberId => userDetailsMap.get(memberId))
        .filter(user => user !== undefined);
      
      return {
        ...club,
        members: memberDetails.length > 0 ? memberDetails : club.members,
        activeUsers: this.getActiveUserCount(club.id),
        currentBook: currentBooksMap.get(club.id) || null
      };
    });
  }

  /**
   * Get user's created book clubs
   */
  static async getMyBookClubs(userId: string) {
    const bookClubs = await BookClubRepository.findByCreator(userId);
    
    // Fetch current books
    const currentBooksMap = await this.fetchCurrentBooks(bookClubs.map(c => c.id));
    
    return bookClubs.map(club => ({
      ...club,
      activeUsers: this.getActiveUserCount(club.id),
      memberCount: club.members.length,
      currentBook: currentBooksMap.get(club.id) || null
    }));
  }

  /**
   * Upload book club image
   */
  static async uploadImage(bookClubId: string, userId: string, file: Express.Multer.File) {
    const bookClub = await BookClubRepository.findById(bookClubId);
    
    if (!bookClub) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      throw new Error('Book club not found');
    }
    
    if (bookClub.creatorId !== userId) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      throw new Error('Only the book club creator can upload images');
    }
    
    // Delete old image if exists
    if (bookClub.imageUrl) {
      this.deleteImageFile(bookClub.imageUrl);
    }
    
    // Update with new image URL
    const imageUrl = `/uploads/bookclub-images/${file.filename}`;
    const updatedBookClub = await BookClubRepository.update(bookClubId, { imageUrl });
    
    console.log(`📷 Image uploaded for book club ${bookClubId}`);
    
    return updatedBookClub.imageUrl;
  }

  /**
   * Delete book club image
   */
  static async deleteImage(bookClubId: string, userId: string) {
    const bookClub = await BookClubRepository.findById(bookClubId);
    
    if (!bookClub) {
      throw new NotFoundError('Book club not found');
    }

    if (bookClub.creatorId !== userId) {
      throw new ForbiddenError('Only the book club creator can delete images');
    }

    if (!bookClub.imageUrl) {
      throw new BadRequestError('Book club has no image to delete');
    }
    
    // Delete image file
    this.deleteImageFile(bookClub.imageUrl);
    
    // Update bookclub to remove image URL
    await BookClubRepository.update(bookClubId, { imageUrl: null });
    
    console.log(`🗑️  Image deleted for book club ${bookClubId}`);
  }

  /**
   * Delete image file from disk
   */
  private static deleteImageFile(imageUrl: string) {
    const imagePath = path.join(__dirname, '../..', imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  /**
   * Fetch user details from user-service
   */
  private static async fetchUserDetails(userIds: string[]): Promise<any[]> {
    if (!userIds || userIds.length === 0) {
      return userIds; // Return original IDs as fallback
    }

    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${userServiceUrl}/users/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      
      if (response.ok) {
        const data: any = await response.json();
        return data.users && data.users.length > 0 ? data.users : userIds;
      } else {
        console.error('Failed to fetch user details:', response.status);
        return userIds;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      return userIds;
    }
  }

  /**
   * Fetch user details and return as a Map
   */
  private static async fetchUserDetailsMap(userIds: string[]): Promise<Map<string, any>> {
    const userDetailsMap = new Map<string, any>();
    
    if (!userIds || userIds.length === 0) {
      return userDetailsMap;
    }

    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${userServiceUrl}/users/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      
      if (response.ok) {
        const data: any = await response.json();
        if (data.users && data.users.length > 0) {
          data.users.forEach((user: any) => {
            userDetailsMap.set(user.id, user);
          });
        }
      } else {
        console.error('Failed to fetch user details:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
    
    return userDetailsMap;
  }

  /**
   * Fetch current books from books-service
   */
  private static async fetchCurrentBooks(bookClubIds: string[]): Promise<Map<string, any>> {
    const currentBooksMap = new Map<string, any>();
    
    if (!bookClubIds || bookClubIds.length === 0) {
      return currentBooksMap;
    }

    try {
      const booksServiceUrl = process.env.BOOKS_SERVICE_URL || 'http://localhost:3002';
      
      const promises = bookClubIds.map(async (clubId) => {
        try {
          const response = await fetch(`${booksServiceUrl}/v1/bookclub/${clubId}/books?status=current`);
          if (response.ok) {
            const data: any = await response.json();
            if (data.success && data.data && data.data.length > 0) {
              currentBooksMap.set(clubId, data.data[0]);
            }
          }
        } catch (err) {
          console.error(`Error fetching current book for bookclub ${clubId}:`, err);
        }
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching current books:', error);
    }
    
    return currentBooksMap;
  }

  /**
   * Get connected users for a book club
   */
  private static getConnectedUsers(bookClubId: string): any[] {
    const activeClub = this.activeBookClubs?.get(bookClubId);
    
    if (!activeClub) {
      return [];
    }
    
    return Array.from(activeClub.clients.values())
      .filter((c: ActiveClient) => !c.isDMConnection)
      .reduce((acc: any[], c: ActiveClient) => {
        // Only add if this userId hasn't been added yet
        if (!acc.find(user => user.userId === c.userId)) {
          acc.push({
            id: c.id,
            username: c.username,
            userId: c.userId
          });
        }
        return acc;
      }, []);
  }

  /**
   * Get active user count for a book club
   */
  private static getActiveUserCount(bookClubId: string): number {
    const activeClub = this.activeBookClubs?.get(bookClubId);
    
    if (!activeClub) {
      return 0;
    }
    
    const uniqueUserIds = new Set<string>();
    activeClub.clients.forEach(client => {
      if (!client.isDMConnection && client.userId) {
        uniqueUserIds.add(client.userId);
      }
    });
    
    return uniqueUserIds.size;
  }
}
