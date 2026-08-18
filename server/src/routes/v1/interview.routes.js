import { Router } from 'express';
import multer from 'multer';
import interviewController from '../../controllers/interview.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { aiLimiter } from '../../middlewares/rateLimiter.js';
import env from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { HttpStatus } from '../../constants/index.js';

const router = Router();

// Configure Multer for memory storage (audio uploads)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        // Was hardcoded to 25MB regardless of the MAX_AUDIO_SIZE_MB env var
        // that already exists and is documented in env.example/render.yaml —
        // meaning changing that setting had no actual effect.
        fileSize: env.MAX_AUDIO_SIZE_MB * 1024 * 1024,
    },
    // This previously had NO file-type validation at all — any file could
    // be uploaded as "audio" (an image, an executable, arbitrary binary
    // data) and would be forwarded straight to Groq's Whisper API as if it
    // were real audio, relying entirely on the frontend's own (bypassable)
    // assumption that it only ever sends audio/webm. Server-side validation
    // must not depend on what the client claims to be sending.
    fileFilter: (req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith('audio/')) {
            return cb(null, true);
        }
        cb(new ApiError(HttpStatus.BAD_REQUEST, `Invalid audio file type: ${file.mimetype}. Only audio files are accepted.`));
    },
});

// All interview routes require authentication
router.use(protect);

// Start a new interview
router.post('/', interviewController.startInterview);

// Get next question
router.get('/:id/next-question', interviewController.getNextQuestion);

// Submit answer (can include audio file and CV metrics)
// We apply the AI rate limiter here because it calls Groq for evaluation and transcription
router.post(
    '/:id/answer',
    aiLimiter,
    upload.single('audio'),
    interviewController.submitAnswer
);

// End interview and generate final report
router.post('/:id/end', aiLimiter, interviewController.endInterview);

export default router;
