/**
 * routes/index.js — Mounts all versioned routers under /api/v1.
 * Each phase adds its own router import here.
 */
import { Router } from 'express';
import healthRouter from './v1/health.routes.js';
import authRouter from './v1/auth.routes.js';
import aiRouter from './v1/ai.routes.js';
import resumeRouter from './v1/resume.routes.js';
import interviewRouter from './v1/interview.routes.js';
import reportRouter from './v1/report.routes.js';

// Phase 7+: frontend migration routes

const router = Router();

// ── v1 routes ───────────────────────────────────────────────────────────────
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/ai', aiRouter);
router.use('/resumes', resumeRouter);
router.use('/interviews', interviewRouter);
router.use('/reports', reportRouter);

// Phase 7: frontend migration

export default router;
