import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { BookSuggestionsService } from '../services/bookSuggestions.service';

/**
 * Get all pending suggestions for a bookclub
 */
export const getSuggestions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubId = req.params.bookClubId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await BookSuggestionsService.getSuggestions(
      bookClubId,
      req.user!.userId,
      page,
      limit
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * Suggest a book
 */
export const createSuggestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubId = req.params.bookClubId as string;
    const { googleBooksId, reason } = req.body;

    const suggestion = await BookSuggestionsService.suggestBook(
      bookClubId,
      req.user!.userId,
      googleBooksId,
      reason
    );

    res.json({
      success: true,
      data: {
        ...suggestion,
        suggestedBy: {
          id: req.user!.userId,
          name: req.user!.name || 'User',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vote on a suggestion
 */
export const voteSuggestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const suggestionId = req.params.suggestionId as string;
    const { voteType } = req.body;

    const result = await BookSuggestionsService.vote(
      suggestionId,
      req.user!.userId,
      voteType
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept suggestion and make it current book
 */
export const acceptSuggestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubId = req.params.bookClubId as string;
    const suggestionId = req.params.suggestionId as string;
    const { startDate, endDate } = req.body;

    const bookClubBook = await BookSuggestionsService.acceptSuggestion(
      bookClubId,
      suggestionId,
      req.user!.userId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({ success: true, data: bookClubBook });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a suggestion
 */
export const deleteSuggestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const suggestionId = req.params.suggestionId as string;

    await BookSuggestionsService.deleteSuggestion(suggestionId, req.user!.userId);
    res.json({ success: true, message: 'Suggestion deleted successfully' });
  } catch (error) {
    next(error);
  }
};
