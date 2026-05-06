import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireBookClubRole } from '../middleware/bookclubRoleMiddleware';
import { validate } from '../middleware/validate';
import {
  bookClubIdParamSchema,
  suggestionIdParamSchema,
  createSuggestionSchema,
  voteSuggestionSchema,
  acceptSuggestionSchema,
} from '../utils/validation';
import * as suggestionsController from '../controllers/bookSuggestionsController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Suggestion routes
router.get(
  '/:bookClubId/suggestions',
  validate({ params: bookClubIdParamSchema }),
  suggestionsController.getSuggestions
);

router.post(
  '/:bookClubId/suggestions',
  validate({ params: bookClubIdParamSchema, body: createSuggestionSchema }),
  suggestionsController.createSuggestion
);

router.post(
  '/:bookClubId/suggestions/:suggestionId/vote',
  validate({ params: suggestionIdParamSchema, body: voteSuggestionSchema }),
  suggestionsController.voteSuggestion
);

// Accept suggestion requires MODERATOR role or higher
router.post(
  '/:bookClubId/suggestions/:suggestionId/accept',
  requireBookClubRole('MODERATOR'),
  validate({ params: suggestionIdParamSchema, body: acceptSuggestionSchema }),
  suggestionsController.acceptSuggestion
);

// Delete suggestion — the suggester can delete their own; OWNER/ADMIN/MODERATOR
// can delete anyone's. Member-level role gate fetches the role and stashes it
// on `req.bookClubRole`; the service-layer check then allows or rejects.
router.delete(
  '/:bookClubId/suggestions/:suggestionId',
  requireBookClubRole('MEMBER'),
  validate({ params: suggestionIdParamSchema }),
  suggestionsController.deleteSuggestion
);

export default router;
