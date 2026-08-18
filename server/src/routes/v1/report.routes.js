import { Router } from 'express';
import reportController from '../../controllers/report.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// All report routes require authentication
router.use(protect);

// GET /api/v1/reports/analytics  — must be before /:id to avoid clash
router.get('/analytics', reportController.getAnalytics);

// GET /api/v1/reports             — paginated history list
router.get('/', reportController.getHistory);

// GET /api/v1/reports/:id         — full report detail
router.get('/:id', reportController.getReportById);

export default router;
