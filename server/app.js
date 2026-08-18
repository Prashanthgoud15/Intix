/**
 * app.js — Express application.
 * Middleware is applied in strict security-first order.
 * No feature logic lives here — routes only.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import swaggerUi from 'swagger-ui-express';

import corsOptions from './src/config/cors.js';
import swaggerSpec from './src/config/swagger.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import morganMiddleware from './src/middlewares/logger.js';
import { globalLimiter } from './src/middlewares/rateLimiter.js';
import v1Router from './src/routes/index.js';
import { ApiError } from './src/utils/ApiError.js';
import { HttpStatus } from './src/constants/index.js';

const app = express();

// ── 1. Security headers ────────────────────────────────────────────────────
app.use(helmet());

// ── 2. CORS ────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // pre-flight for all routes

// ── 3. Request ID (before logging so it appears in every log line) ─────────
app.use((req, _res, next) => {
    req.id = req.headers['x-request-id'] || uuidv4();
    next();
});

// ── 4. HTTP request logging ────────────────────────────────────────────────
app.use(morganMiddleware);

// ── 5. Body parsing ────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ── 6. NoSQL injection prevention ─────────────────────────────────────────
app.use(mongoSanitize());

// ── 7. Global rate limiter ────────────────────────────────────────────────
app.use(globalLimiter);

// ── 8. API routes ──────────────────────────────────────────────────────────
app.use('/api/v1', v1Router);

// ── 8b. Swagger UI — disabled in production ────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'Intix API Docs',
        swaggerOptions: { persistAuthorization: true },
    }));
    app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
}

// ── 9. 404 handler (unmatched routes) ─────────────────────────────────────
app.use((req, _res, next) => {
    next(new ApiError(HttpStatus.NOT_FOUND, `Route '${req.method} ${req.originalUrl}' not found`));
});

// ── 10. Centralized error handler (must be last) ──────────────────────────
app.use(errorHandler);

export default app;
