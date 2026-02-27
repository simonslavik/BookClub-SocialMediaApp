import prisma from '../config/database.js';
import { BookClubRole, MembershipStatus, ClubVisibility, RequestStatus } from '@prisma/client';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { hasMinRole } from '../utils/roles.js';

export class BookClubService {
  /**
   * Check if user has permission to perform action
   */
  static async checkPermission(
    bookClubId: string,
    userId: string,
    requiredRole: BookClubRole = BookClubRole.MEMBER
  ): Promise<boolean> {
    const member = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: { bookClubId, userId },
        status: MembershipStatus.ACTIVE
      }
    });

    if (!member) return false;

    return hasMinRole(member.role, requiredRole);
  }

  /**
   * Get user's membership in a club
   */
  static async getMembership(bookClubId: string, userId: string) {
    return await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: { bookClubId, userId }
      }
    });
  }

  /**
   * Get all clubs the user is a member of
   */
  static async getMyClubs(userId: string) {
    const memberships = await prisma.bookClubMember.findMany({
      where: { userId, status: MembershipStatus.ACTIVE },
      include: {
        bookClub: {
          include: {
            _count: {
              select: {
                members: {
                  where: { status: MembershipStatus.ACTIVE }
                }
              }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(m => ({
      ...m.bookClub,
      memberCount: m.bookClub._count.members,
      role: m.role,
      isMember: true
    }));
  }

  /**
   * Discover book clubs - Returns list based on visibility and user access
   */
  static async discoverClubs(userId?: string, category?: string) {
    const where: any = {
      OR: [
        { visibility: ClubVisibility.PUBLIC },
        { visibility: ClubVisibility.PRIVATE }
      ]
    };

    // If user is authenticated, also include INVITE_ONLY clubs they created or are members of
    if (userId) {
      where.OR.push({
        visibility: ClubVisibility.INVITE_ONLY,
        OR: [
          { creatorId: userId },
          { 
            members: {
              some: {
                userId: userId,
                status: MembershipStatus.ACTIVE
              }
            }
          }
        ]
      });
    }

    if (category) {
      where.category = category;
    }

    const clubs = await prisma.bookClub.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        category: true,
        visibility: true,
        creatorId: true,
        createdAt: true,
        members: {
          where: { status: MembershipStatus.ACTIVE },
          select: {
            id: true,
            userId: true
          }
        },
        _count: {
          select: {
            members: {
              where: { status: MembershipStatus.ACTIVE }
            }
          }
        }
      },
      orderBy: { lastActiveAt: 'desc' },
      take: 50
    });

    // Fetch user details from user-service for member avatars
    const allUserIds = [...new Set(clubs.flatMap(club => club.members.map(m => m.userId)))];
    let userMap = new Map<string, any>();
    
    if (allUserIds.length > 0) {
      try {
        // Fetch user details from user-service
        const userResponse = await fetch(`${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/users/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: allUserIds.slice(0, 100) }) // Limit to 100 users
        });
        
        if (userResponse.ok) {
          const userData: any = await userResponse.json();
          if (userData.success && Array.isArray(userData.users)) {
            userMap = new Map(userData.users.map((u: any) => [u.id, u]));
          }
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    }

    // Add membership status for each club if userId provided
    if (userId) {
      const memberships = await prisma.bookClubMember.findMany({
        where: {
          userId,
          bookClubId: { in: clubs.map(c => c.id) }
        }
      });

      const membershipMap = new Map(memberships.map(m => [m.bookClubId, m]));

      return clubs.map(club => ({
        ...club,
        memberCount: club._count.members,
        members: club.members.slice(0, 10).map(m => {
          const user = userMap.get(m.userId);
          return {
            id: user?.id || m.userId,
            username: user?.username || 'User',
            profileImage: user?.profileImage || null
          };
        }),
        activeUsers: 0, // This would need WebSocket tracking
        membership: membershipMap.get(club.id),
        isMember: membershipMap.get(club.id)?.status === MembershipStatus.ACTIVE
      }));
    }

    return clubs.map(club => ({
      ...club,
      memberCount: club._count.members,
      members: club.members.slice(0, 10).map(m => {
        const user = userMap.get(m.userId);
        return {
          id: user?.id || m.userId,
          username: user?.username || 'User',
          profileImage: user?.profileImage || null
        };
      }),
      activeUsers: 0 // This would need WebSocket tracking
    }));
  }

  /**
   * Get club preview (limited data for non-members)
   */
  static async getClubPreview(clubId: string, userId?: string) {
    const club = await prisma.bookClub.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        category: true,
        visibility: true,
        creatorId: true,
        createdAt: true,
        members: {
          where: { status: MembershipStatus.ACTIVE },
          select: {
            userId: true,
            role: true,
            joinedAt: true
          },
          take: 100
        },
        _count: {
          select: {
            members: { where: { status: MembershipStatus.ACTIVE } }
          }
        }
      }
    });

    if (!club) throw new Error('CLUB_NOT_FOUND');

    // Hide INVITE_ONLY clubs from non-members
    let membership = null;

    if (userId) {
      membership = await this.getMembership(clubId, userId);
    }

    if (club.visibility === ClubVisibility.INVITE_ONLY) {
      if (!userId || !membership || membership.status !== MembershipStatus.ACTIVE) {
        throw new Error('CLUB_NOT_FOUND');
      }
    }

    let pendingRequest = null;

    if (userId && (!membership || membership.status !== MembershipStatus.ACTIVE)) {
      pendingRequest = await prisma.membershipRequest.findUnique({
        where: {
          bookClubId_userId: { bookClubId: clubId, userId }
        }
      });
    }

    // Creator is always a member, even if not in membership table
    logger.info('CHECKING_MEMBERSHIP', { userId, creatorId: club.creatorId, isCreator: userId === club.creatorId, hasMembership: !!membership });
    const isMember = (userId === club.creatorId) || (membership?.status === MembershipStatus.ACTIVE);
    logger.info('IS_MEMBER_RESULT', { isMember });

    // Fetch user details for members
    // Always include creator in the list even if not in members table
    const memberUserIds = club.members.map(m => m.userId);
    const allUserIds = new Set([...memberUserIds, club.creatorId]);
    let membersWithDetails: any[] = [];

    logger.info('FETCHING_MEMBER_DETAILS', { 
      clubId, 
      memberUserIds, 
      creatorId: club.creatorId,
      allUserIds: Array.from(allUserIds),
      memberCount: club.members.length
    });

    if (allUserIds.size > 0) {
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
        const requestBody = { userIds: Array.from(allUserIds) };
        logger.info('CALLING_USER_SERVICE', { url: `${userServiceUrl}/users/batch`, requestBody });
        
        const response = await fetch(`${userServiceUrl}/users/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        logger.info('USER_SERVICE_RESPONSE', { status: response.status, ok: response.ok });

        if (response.ok) {
          const userData: any = await response.json();
          logger.info('USER_DATA_RECEIVED', { userCount: userData.users?.length, rawData: userData });
          const userMap: Map<string, any> = new Map(userData.users.map((u: any) => [u.id, u]));
          
          // Map existing members with their details
          membersWithDetails = club.members.map(member => {
            const user = userMap.get(member.userId);
            logger.info('MAPPING_MEMBER', { userId: member.userId, user, username: user?.username });
            return {
              id: member.userId,
              username: user?.username || 'Unknown User',
              profileImage: user?.profileImage || null,
              role: member.role,
              joinedAt: member.joinedAt
            };
          });
          
          // Add creator if not already in members list
          const creatorInMembers = membersWithDetails.some(m => m.id === club.creatorId);
          logger.info('CREATOR_CHECK', { creatorInMembers, membersWithDetailsCount: membersWithDetails.length });
          if (!creatorInMembers) {
            const creatorUser = userMap.get(club.creatorId);
            logger.info('ADDING_CREATOR', { found: !!creatorUser, creatorId: club.creatorId, creatorUser });
            if (creatorUser) {
              membersWithDetails.unshift({
                id: club.creatorId,
                username: creatorUser.username,
                profileImage: creatorUser.profileImage || null,
                role: BookClubRole.OWNER,
                joinedAt: club.createdAt
              });
            }
          }
          logger.info('FINAL_MEMBERS_LIST', { count: membersWithDetails.length, members: membersWithDetails });
        } else {
          logger.error('USER_SERVICE_ERROR', { status: response.status, statusText: response.statusText });
        }
      } catch (error) {
        logger.error('Failed to fetch user details for members', { error });
        // Fallback to basic member data without user details
        membersWithDetails = club.members.map(member => ({
          id: member.userId,
          username: 'User',
          profileImage: null,
          role: member.role,
          joinedAt: member.joinedAt
        }));
      }
    }

    return {
      ...club,
      members: membersWithDetails,
      memberCount: club._count.members,
      membership,
      isMember,
      hasPendingRequest: pendingRequest?.status === RequestStatus.PENDING,
      canJoin: !isMember && club.visibility === ClubVisibility.PUBLIC,
      canRequest: !isMember && club.visibility === ClubVisibility.PRIVATE && !pendingRequest
    };
  }

  /**
   * Get full club details (members only)
   */
  static async getClub(clubId: string, userId: string) {
    const hasAccess = await this.checkPermission(clubId, userId, BookClubRole.MEMBER);
    
    if (!hasAccess) {
      throw new Error('ACCESS_DENIED');
    }

    const club = await prisma.bookClub.findUnique({
      where: { id: clubId },
      include: {
        members: {
          where: { status: MembershipStatus.ACTIVE },
          select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true
          }
        },
        rooms: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            isDefault: true,
            createdAt: true,
            _count: { select: { members: true } },
            members: { where: { userId }, select: { id: true } }
          }
        },
        events: {
          where: {
            eventDate: { gte: new Date() }
          },
          orderBy: { eventDate: 'asc' },
          take: 10
        }
      }
    });

    if (!club) throw new Error('CLUB_NOT_FOUND');

    // Check if the user has a moderator+ role
    const userMembership = club.members.find(m => m.userId === userId);
    const canSeeAll = userMembership ? hasMinRole(userMembership.role, BookClubRole.MODERATOR) : false;

    // Add isMember flag to rooms
    const roomsWithAccess = club.rooms.map(room => ({
      ...room,
      isMember: (room as any).type !== 'PRIVATE' || canSeeAll || ((room as any).members?.length > 0),
      members: undefined // Remove raw members relation from response
    }));

    return { ...club, rooms: roomsWithAccess };
  }

  /**
   * Create a new book club
   */
  static async createClub(
    userId: string,
    data: {
      name: string;
      description?: string;
      imageUrl?: string;
      category?: string;
      visibility?: ClubVisibility;
      requiresApproval?: boolean;
    }
  ) {
    const club = await prisma.bookClub.create({
      data: {
        ...data,
        creatorId: userId,
        inviteCode: data.visibility === ClubVisibility.INVITE_ONLY 
          ? crypto.randomBytes(8).toString('hex')
          : null,
        members: {
          create: {
            userId,
            role: BookClubRole.OWNER,
            status: MembershipStatus.ACTIVE
          }
        },
        rooms: {
          create: {
            name: 'general'
          }
        },
        invites: {
          create: {
            code: crypto.randomBytes(8).toString('hex'),
            createdBy: userId,
            expiresAt: null,
            maxUses: null
          }
        }
      },
      include: {
        members: true,
        rooms: true,
        invites: true
      }
    });

    logger.info('BOOKCLUB_CREATED', { clubId: club.id, userId, visibility: data.visibility });

    return club;
  }

  /**
   * Join a public club instantly
   */
  static async joinClub(clubId: string, userId: string) {
    const club = await prisma.bookClub.findUnique({
      where: { id: clubId }
    });

    if (!club) throw new Error('CLUB_NOT_FOUND');

    const existing = await this.getMembership(clubId, userId);

    if (existing?.status === MembershipStatus.ACTIVE) {
      throw new Error('ALREADY_MEMBER');
    }

    if (existing?.status === MembershipStatus.BANNED) {
      throw new Error('BANNED_FROM_CLUB');
    }

    if (club.visibility !== ClubVisibility.PUBLIC) {
      throw new Error('REQUIRES_APPROVAL');
    }

    const member = await prisma.bookClubMember.upsert({
      where: { bookClubId_userId: { bookClubId: clubId, userId } },
      update: { status: MembershipStatus.ACTIVE },
      create: {
        bookClubId: clubId,
        userId,
        role: BookClubRole.MEMBER,
        status: MembershipStatus.ACTIVE
      }
    });

    await prisma.bookClub.update({
      where: { id: clubId },
      data: { lastActiveAt: new Date() }
    });

    logger.info('BOOKCLUB_JOINED', { clubId, userId });

    return member;
  }

  /**
   * Request to join a private club
   */
  static async requestToJoin(clubId: string, userId: string, message?: string) {
    const club = await prisma.bookClub.findUnique({
      where: { id: clubId }
    });

    if (!club) throw new Error('CLUB_NOT_FOUND');
    
    if (club.visibility === ClubVisibility.PUBLIC) {
      throw new Error('PUBLIC_CLUB_NO_REQUEST_NEEDED');
    }
    
    if (club.visibility === ClubVisibility.INVITE_ONLY) {
      throw new Error('INVITE_ONLY_CLUB');
    }

    const existingRequest = await prisma.membershipRequest.findUnique({
      where: {
        bookClubId_userId: { bookClubId: clubId, userId }
      }
    });

    if (existingRequest?.status === RequestStatus.PENDING) {
      throw new Error('REQUEST_ALREADY_PENDING');
    }

    const request = await prisma.membershipRequest.upsert({
      where: { bookClubId_userId: { bookClubId: clubId, userId } },
      update: { 
        status: RequestStatus.PENDING,
        message,
        reviewedBy: null,
        reviewedAt: null
      },
      create: {
        bookClubId: clubId,
        userId,
        message,
        status: RequestStatus.PENDING
      }
    });

    logger.info('MEMBERSHIP_REQUESTED', { clubId, userId });

    return request;
  }

  /**
   * Get pending requests (Admin/Owner only)
   */
  static async getPendingRequests(clubId: string, userId: string) {
    const hasPermission = await this.checkPermission(clubId, userId, BookClubRole.ADMIN);
    if (!hasPermission) throw new Error('INSUFFICIENT_PERMISSIONS');

    const requests = await prisma.membershipRequest.findMany({
      where: {
        bookClubId: clubId,
        status: RequestStatus.PENDING
      },
      orderBy: { createdAt: 'asc' }
    });

    // Fetch user details from user-service
    const userIds = [...new Set(requests.map(r => r.userId))];
    let userMap = new Map<string, any>();
    
    if (userIds.length > 0) {
      try {
        const userResponse = await fetch(`${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/users/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds })
        });
        
        if (userResponse.ok) {
          const userData: any = await userResponse.json();
          if (userData.success && Array.isArray(userData.users)) {
            userMap = new Map(userData.users.map((u: any) => [u.id, u]));
          }
        }
      } catch (error) {
        console.error('Failed to fetch user details for requests:', error);
      }
    }

    // Attach user details to requests
    return requests.map(request => {
      const user = userMap.get(request.userId);
      return {
        ...request,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture
        } : null
      };
    });
  }

  /**
   * Approve membership request (Admin/Owner only)
   */
  static async approveRequest(clubId: string, requestId: string, reviewerId: string) {
    const hasPermission = await this.checkPermission(clubId, reviewerId, BookClubRole.ADMIN);
    if (!hasPermission) throw new Error('INSUFFICIENT_PERMISSIONS');

    const request = await prisma.membershipRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || request.bookClubId !== clubId) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new Error('REQUEST_ALREADY_REVIEWED');
    }

    const [member, updatedRequest] = await prisma.$transaction([
      prisma.bookClubMember.upsert({
        where: { bookClubId_userId: { bookClubId: clubId, userId: request.userId } },
        update: { status: MembershipStatus.ACTIVE },
        create: {
          bookClubId: clubId,
          userId: request.userId,
          role: BookClubRole.MEMBER,
          status: MembershipStatus.ACTIVE
        }
      }),
      prisma.membershipRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.APPROVED,
          reviewedBy: reviewerId,
          reviewedAt: new Date()
        }
      })
    ]);

    await prisma.bookClub.update({
      where: { id: clubId },
      data: { lastActiveAt: new Date() }
    });

    logger.info('REQUEST_APPROVED', { clubId, requestId, userId: request.userId, reviewerId });

    return { member, request: updatedRequest };
  }

  /**
   * Reject membership request (Admin/Owner only)
   */
  static async rejectRequest(clubId: string, requestId: string, reviewerId: string) {
    const hasPermission = await this.checkPermission(clubId, reviewerId, BookClubRole.ADMIN);
    if (!hasPermission) throw new Error('INSUFFICIENT_PERMISSIONS');

    const request = await prisma.membershipRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || request.bookClubId !== clubId) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new Error('REQUEST_ALREADY_REVIEWED');
    }

    const updatedRequest = await prisma.membershipRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date()
      }
    });

    logger.info('REQUEST_REJECTED', { clubId, requestId, userId: request.userId, reviewerId });

    return updatedRequest;
  }

  /**
   * Leave a club
   */
  static async leaveClub(clubId: string, userId: string) {
    const member = await this.getMembership(clubId, userId);

    if (!member || member.status !== MembershipStatus.ACTIVE) {
      throw new Error('NOT_A_MEMBER');
    }

    if (member.role === BookClubRole.OWNER) {
      const memberCount = await prisma.bookClubMember.count({
        where: {
          bookClubId: clubId,
          status: MembershipStatus.ACTIVE
        }
      });

      if (memberCount > 1) {
        throw new Error('OWNER_MUST_TRANSFER_OWNERSHIP');
      }
    }

    await prisma.bookClubMember.update({
      where: { id: member.id },
      data: { status: MembershipStatus.LEFT }
    });

    logger.info('BOOKCLUB_LEFT', { clubId, userId });

    return { success: true };
  }

  /**
   * Get shareable invite for any member
   */
  static async getShareableInvite(clubId: string, userId: string) {
    // Check if user is a member
    const isMember = await this.checkPermission(clubId, userId, BookClubRole.MEMBER);
    if (!isMember) throw new Error('INSUFFICIENT_PERMISSIONS');

    // Get the permanent invite (created with bookclub)
    const invite = await prisma.bookClubInvite.findFirst({
      where: { 
        bookClubId: clubId,
        expiresAt: null,  // Only permanent invites
        maxUses: null     // With unlimited uses
      },
      orderBy: { createdAt: 'asc' }
    });

    return invite;
  }

  /**
   * Delete invite (Admin/Owner only)
   */
  static async deleteInvite(clubId: string, inviteId: string, userId: string) {
    const hasPermission = await this.checkPermission(clubId, userId, BookClubRole.ADMIN);
    if (!hasPermission) throw new Error('INSUFFICIENT_PERMISSIONS');

    const invite = await prisma.bookClubInvite.findUnique({
      where: { id: inviteId }
    });

    if (!invite || invite.bookClubId !== clubId) {
      throw new Error('INVITE_NOT_FOUND');
    }

    await prisma.bookClubInvite.delete({
      where: { id: inviteId }
    });

    logger.info('INVITE_DELETED', { clubId, inviteId, userId });

    return { success: true };
  }

  /**
   * Join club via invite code
   */
  static async joinByInvite(code: string, userId: string) {
    const invite = await prisma.bookClubInvite.findUnique({
      where: { code },
      include: { bookClub: true }
    });

    if (!invite) throw new Error('INVALID_INVITE');
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new Error('INVITE_EXPIRED');
    }
    if (invite.maxUses && invite.currentUses >= invite.maxUses) {
      throw new Error('INVITE_MAX_USES_REACHED');
    }

    const existing = await this.getMembership(invite.bookClubId, userId);

    if (existing?.status === MembershipStatus.ACTIVE) {
      throw new Error('ALREADY_MEMBER');
    }

    if (existing?.status === MembershipStatus.BANNED) {
      throw new Error('BANNED_FROM_CLUB');
    }

    const [member] = await prisma.$transaction([
      prisma.bookClubMember.upsert({
        where: { bookClubId_userId: { bookClubId: invite.bookClubId, userId } },
        update: { status: MembershipStatus.ACTIVE, invitedBy: invite.createdBy },
        create: {
          bookClubId: invite.bookClubId,
          userId,
          role: BookClubRole.MEMBER,
          status: MembershipStatus.ACTIVE,
          invitedBy: invite.createdBy
        }
      }),
      prisma.bookClubInvite.update({
        where: { id: invite.id },
        data: { currentUses: { increment: 1 } }
      })
    ]);

    await prisma.bookClub.update({
      where: { id: invite.bookClubId },
      data: { lastActiveAt: new Date() }
    });

    logger.info('JOINED_BY_INVITE', { clubId: invite.bookClubId, userId, code });

    return { member, club: invite.bookClub };
  }

  /**
   * Remove member (Admin/Owner only)
   */
  static async removeMember(clubId: string, targetUserId: string, removerId: string) {
    const hasPermission = await this.checkPermission(clubId, removerId, BookClubRole.ADMIN);
    if (!hasPermission) throw new Error('INSUFFICIENT_PERMISSIONS');

    const targetMember = await this.getMembership(clubId, targetUserId);
    if (!targetMember) throw new Error('MEMBER_NOT_FOUND');

    if (targetMember.role === BookClubRole.OWNER) {
      throw new Error('CANNOT_REMOVE_OWNER');
    }

    await prisma.bookClubMember.update({
      where: { id: targetMember.id },
      data: { status: MembershipStatus.LEFT }
    });

    logger.info('MEMBER_REMOVED', { clubId, targetUserId, removerId });

    return { success: true };
  }

  /**
   * Update member role (Owner only)
   */
  static async updateMemberRole(
    clubId: string,
    targetUserId: string,
    newRole: BookClubRole,
    updaterId: string
  ) {
    const hasPermission = await this.checkPermission(clubId, updaterId, BookClubRole.OWNER);
    if (!hasPermission) throw new Error('INSUFFICIENT_PERMISSIONS');

    const targetMember = await this.getMembership(clubId, targetUserId);
    if (!targetMember) throw new Error('MEMBER_NOT_FOUND');

    if (targetMember.role === BookClubRole.OWNER || newRole === BookClubRole.OWNER) {
      throw new Error('CANNOT_CHANGE_OWNER_ROLE');
    }

    const updatedMember = await prisma.bookClubMember.update({
      where: { id: targetMember.id },
      data: { role: newRole }
    });

    logger.info('ROLE_UPDATED', { clubId, targetUserId, newRole, updaterId });

    return updatedMember;
  }

  /**
   * Update club settings (Admin/Owner only)
   */
  static async updateClub(
    clubId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string | null;
      category?: string;
      visibility?: ClubVisibility;
      requiresApproval?: boolean;
    }
  ) {
    const hasPermission = await this.checkPermission(clubId, userId, BookClubRole.ADMIN);
    if (!hasPermission) throw new Error('INSUFFICIENT_PERMISSIONS');

    const club = await prisma.bookClub.update({
      where: { id: clubId },
      data
    });

    logger.info('BOOKCLUB_UPDATED', { clubId, userId });

    return club;
  }

  /**
   * Delete club (Owner only)
   */
  static async deleteClub(clubId: string, userId: string) {
    const hasPermission = await this.checkPermission(clubId, userId, BookClubRole.OWNER);
    if (!hasPermission) throw new Error('INSUFFICIENT_PERMISSIONS');

    await prisma.bookClub.delete({
      where: { id: clubId }
    });

    logger.info('BOOKCLUB_DELETED', { clubId, userId });

    return { success: true };
  }
}
