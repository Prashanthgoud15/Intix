import { Router } from 'express';
import aiController from '../../controllers/ai.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
    generateQuestionSchema,
    evaluateAnswerSchema,
} from '../../validators/ai.validators.js';
import { aiLimiter } from '../../middlewares/rateLimiter.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// SECURITY FIX: this router previously had NO auth middleware at all —
// every other route file in this app applies `protect`, but this one was
// missed. That meant anyone, unauthenticated, could hit these endpoints and
// trigger real Groq API calls (cost + quota consumption) with zero login
// required. These endpoints also appear unused by the current frontend (the
// actual interview flow goes through the authenticated /interviews/* routes
// and the question-bank/resume-plan system instead) — kept rather than
// removed since that's a larger change than this fix calls for, but they
// must not be reachable without authentication.
router.use(protect);

// Apply AI rate limiter to all routes in this router
router.use(aiLimiter);

router.post(
    '/generate-question',
    validate(generateQuestionSchema),
    aiController.generateQuestion
);

router.post(
    '/evaluate-answer',
    validate(evaluateAnswerSchema),
    aiController.evaluateAnswer
);

export default router;
