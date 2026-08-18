/**
 * errorHandler.js — Centralized error-handling middleware.
 * Must be registered LAST in app.js (after all routes).
 *
 * Handles:
 *  - ApiError instances (from controllers / services)
 *  - Mongoose ValidationError → 400
 *  - Mongoose CastError (bad ObjectId) → 400
 *  - Mongoose duplicate key → 409
 *  - JWT errors → 401
 *  - Zod validation errors → 422
 *  - Everything else → 500 (stack never leaks in production)
 */
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || [];

    // ── ApiError (our own) ───────────────────────────────────
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    }

    // ── Mongoose Validation Error ────────────────────────────
    else if (err instanceof mongoose.Error.ValidationError) {
        statusCode = 400;
        message = 'Validation error';
        errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    }

    // ── Mongoose Bad ObjectId ────────────────────────────────
    else if (err instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = `Invalid value for field '${err.path}'`;
    }

    // ── Mongoose Duplicate Key ───────────────────────────────
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `Duplicate value for '${field}'. Please use a different value.`;
    }

    // ── JWT Errors ───────────────────────────────────────────
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired. Please log in again.';
    }

    // ── Zod Validation Errors ────────────────────────────────
    else if (err instanceof ZodError) {
        statusCode = 422;
        message = 'Request validation failed';
        errors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
    }

    // ── CORS Error ───────────────────────────────────────────
    else if (err.message && err.message.startsWith('CORS:')) {
        statusCode = 403;
        message = 'CORS: origin not allowed';
    }

    // Log the error (include stack in dev, omit in prod)
    const logPayload = {
        statusCode,
        message,
        method: req.method,
        url: req.originalUrl,
        requestId: req.headers['x-request-id'] || req.id,
    };
    if (statusCode >= 500) {
        logger.error({ ...logPayload, stack: err.stack });
    } else {
        logger.warn(logPayload);
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
        // Only expose stack in development
        ...(env.isDev && statusCode >= 500 ? { stack: err.stack } : {}),
    });
};

export { errorHandler };
