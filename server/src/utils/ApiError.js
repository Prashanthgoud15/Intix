/**
 * ApiError.js — Custom error class for all API errors.
 * Every thrown ApiError results in a consistent JSON error shape
 * without leaking internal stack traces to the client.
 */
class ApiError extends Error {
    /**
     * @param {number} statusCode  HTTP status code (4xx / 5xx)
     * @param {string} message     Human-readable error message
     * @param {Array}  errors      Optional array of field-level validation errors
     * @param {string} stack       Optional stack trace override (for testing)
     */
    constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
