import { Router } from 'express';
import multer from 'multer';
import resumeController from '../../controllers/resume.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { analyzeResumeSchema } from '../../validators/resume.validators.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { aiLimiter } from '../../middlewares/rateLimiter.js';
import { ApiError } from '../../utils/ApiError.js';
import { HttpStatus, AllowedResumeTypes } from '../../constants/index.js';
import env from '../../config/env.js';

const router = Router();

// Configure Multer for memory storage (we process the buffer directly)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (AllowedResumeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new ApiError(
                    HttpStatus.BAD_REQUEST,
                    `Invalid file type. Allowed types: ${AllowedResumeTypes.join(', ')}`
                )
            );
        }
    },
});

// All resume routes require authentication
router.use(protect);

router.post(
    '/analyze',
    aiLimiter,
    upload.single('resume'),
    // We validate the body and the file presence
    validate(analyzeResumeSchema),
    resumeController.analyzeResume
);

router.get('/', resumeController.getMyResumes);
router.get('/:id', resumeController.getResumeById);

export default router;
