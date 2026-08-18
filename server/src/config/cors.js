/**
 * cors.js — CORS configuration.
 * Origin allowlist is read from CORS_ORIGIN env var (comma-separated).
 */
import env from './env.js';

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, Postman, same-origin SSR)
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGIN.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: origin '${origin}' not in allowlist`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining', 'X-Response-Time'],
    maxAge: 600, // 10 min preflight cache
};

export default corsOptions;
