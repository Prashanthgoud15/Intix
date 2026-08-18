/**
 * asyncHandler.js — Wraps async route handlers so unhandled promise
 * rejections are forwarded to Express's centralized error handler
 * rather than crashing the process.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export { asyncHandler };
