import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import * as suggestionsController from '../controllers/bookSuggestionsController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Suggestion routes
router.get('/:bookClubId/suggestions', suggestionsController.getSuggestions);
router.post('/:bookClubId/suggestions', suggestionsController.createSuggestion);
router.post('/:bookClubId/suggestions/:suggestionId/vote', suggestionsController.voteSuggestion);
router.post('/:bookClubId/suggestions/:suggestionId/accept', suggestionsController.acceptSuggestion);
router.delete('/:bookClubId/suggestions/:suggestionId', suggestionsController.deleteSuggestion);

export default router;
