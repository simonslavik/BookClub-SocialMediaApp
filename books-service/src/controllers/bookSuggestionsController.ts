import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/database';
import { GoogleBooksService } from '../../utils/googlebookapi';

/**
 * Get all suggestions for a bookclub
 */
export const getSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookClubId } = req.params;

    const suggestions = await prisma.bookSuggestion.findMany({
      where: {
        bookClubId: bookClubId as string,
        status: 'pending'
      },
      include: {
        book: true,
        votes: true
      },
      orderBy: [
        { upvotes: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const suggestionsWithUserVote = suggestions.map((s: any) => {
      const userVote = s.votes.find((v: any) => v.userId === req.user!.userId);

      return {
        ...s,
        userVote: userVote?.voteType || null,
        suggestedBy: {
          id: s.suggestedById,
          name: 'User'
        }
      };
    });

    res.json({ success: true, data: suggestionsWithUserVote });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Suggest a book
 */
export const createSuggestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookClubId } = req.params;
    const { googleBooksId, reason } = req.body;

    if (!googleBooksId) {
      res.status(400).json({ error: 'googleBooksId is required' });
      return;
    }

    const bookData = await GoogleBooksService.getBookById(googleBooksId);

    const book = await prisma.book.upsert({
      where: { googleBooksId },
      update: {},
      create: bookData
    });

    const existing = await prisma.bookSuggestion.findFirst({
      where: {
        bookClubId: bookClubId as string,
        bookId: book.id,
        status: 'pending'
      }
    });

    if (existing) {
      res.status(400).json({ error: 'This book has already been suggested' });
      return;
    }

    const suggestion = await prisma.bookSuggestion.create({
      data: {
        bookClubId: bookClubId as string,
        bookId: book.id,
        suggestedById: req.user!.userId,
        reason,
        status: 'pending',
        upvotes: 0,
        downvotes: 0
      },
      include: {
        book: true
      }
    });

    res.json({
      success: true,
      data: {
        ...suggestion,
        suggestedBy: {
          id: req.user!.userId,
          name: req.user!.name || 'User'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Vote on a suggestion
 */
export const voteSuggestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { suggestionId } = req.params;
    const { voteType } = req.body;

    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      res.status(400).json({ error: 'voteType must be either "upvote" or "downvote"' });
      return;
    }

    const vote = await prisma.bookSuggestionVote.upsert({
      where: {
        suggestionId_userId: {
          suggestionId: suggestionId as string,
          userId: req.user!.userId
        }
      },
      update: { voteType },
      create: {
        suggestionId: suggestionId as string,
        userId: req.user!.userId,
        voteType
      }
    });

    const voteCounts = await prisma.bookSuggestionVote.groupBy({
      by: ['voteType'],
      where: { suggestionId: suggestionId as string },
      _count: true
    });

    const upvotes = voteCounts.find((v: any) => v.voteType === 'upvote')?._count || 0;
    const downvotes = voteCounts.find((v: any) => v.voteType === 'downvote')?._count || 0;

    await prisma.bookSuggestion.update({
      where: { id: suggestionId as string },
      data: { upvotes, downvotes }
    });

    res.json({ success: true, data: vote });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Accept suggestion and make it current book
 */
export const acceptSuggestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookClubId, suggestionId } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'startDate and endDate are required' });
      return;
    }

    const suggestion = await prisma.bookSuggestion.findUnique({
      where: { id: suggestionId as string },
      include: { book: true }
    });

    if (!suggestion) {
      res.status(404).json({ error: 'Suggestion not found' });
      return;
    }

    await prisma.bookClubBook.updateMany({
      where: { bookClubId: bookClubId as string, status: 'current' },
      data: { status: 'completed' }
    });

    const bookClubBook = await prisma.bookClubBook.create({
      data: {
        bookClubId: bookClubId as string,
        bookId: suggestion.bookId,
        status: 'current',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        addedById: req.user!.userId
      },
      include: { book: true }
    });

    await prisma.bookSuggestion.update({
      where: { id: suggestionId as string },
      data: { status: 'accepted' }
    });

    res.json({ success: true, data: bookClubBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a suggestion
 */
export const deleteSuggestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { suggestionId } = req.params;

    const suggestion = await prisma.bookSuggestion.findUnique({
      where: { id: suggestionId as string }
    });

    if (!suggestion) {
      res.status(404).json({ error: 'Suggestion not found' });
      return;
    }

    if (suggestion.suggestedById !== req.user!.userId) {
      res.status(403).json({ error: 'You can only delete your own suggestions' });
      return;
    }

    await prisma.bookSuggestion.delete({
      where: { id: suggestionId as string }
    });

    res.json({ success: true, message: 'Suggestion deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
