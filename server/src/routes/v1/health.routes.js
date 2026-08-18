/**
 * health.routes.js — GET /api/v1/health
 * Never rate-limited. Used by uptime monitors and load-balancer health checks.
 */
import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HttpStatus } from '../../constants/index.js';
import env from '../../config/env.js';

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     description: Returns server status, MongoDB connectivity, uptime, and environment.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *       503:
 *         description: Server or DB is degraded
 */
router.get('/', (_req, res) => {
    const dbState = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    const isHealthy = dbState === 1;

    const payload = {
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: env.NODE_ENV,
        services: {
            database: dbStatus,
            groq: env.GROQ_API_KEY ? 'configured' : 'missing',
        },
        version: '1.0.0',
    };

    res
        .status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
        .json(new ApiResponse(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE, payload, isHealthy ? 'Healthy' : 'Degraded'));
});

export default router;
