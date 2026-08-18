/**
 * rateLimiter.js — Rate-limiting middleware instances.
 * Three tiers: global, auth (tight), AI (per-call cost).
 */
import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';
import { HttpStatus } from '../constants/index.js';
import env from '../config/env.js';

const makeHandler = (label) => (req, res, next) => {
    next(
        new ApiError(
            HttpStatus.TOO_MANY_REQUESTS,
            `Too many requests (${label}). Please try again later.`
        )
    );
};

/** Applied to ALL routes */
export const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: makeHandler('global'),
    skip: (req) => req.path === '/api/v1/health', // never rate-limit health checks
});

/** Applied to auth routes only (register / login / refresh) */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: makeHandler('auth'),
    skip: () => env.isDev, // Skip auth rate limiting in development to prevent hot-reload lockouts
});

/** Applied to AI routes (expensive Groq calls) */
export const aiLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AI_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: makeHandler('ai'),
});
