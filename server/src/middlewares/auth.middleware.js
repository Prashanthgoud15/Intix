import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { HttpStatus } from '../constants/index.js';
import User from '../models/User.model.js';
import env from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Middleware to protect routes.
 * Verifies JWT token from Authorization header and attaches user to req.
 */
export const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new ApiError(
            HttpStatus.UNAUTHORIZED,
            'Not authorized to access this route. Please provide a token.'
        );
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

        // Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'The user belonging to this token no longer exists.'
            );
        }

        // Check if user is active
        if (!user.isActive) {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                'Your account has been deactivated.'
            );
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Token expired. Please refresh your token.'
            );
        }
        throw new ApiError(
            HttpStatus.UNAUTHORIZED,
            'Not authorized to access this route. Invalid token.'
        );
    }
});

/**
 * Middleware to restrict access to specific roles.
 * Must be used AFTER the protect middleware.
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError(
                    HttpStatus.FORBIDDEN,
                    `User role '${req.user.role}' is not authorized to access this route`
                )
            );
        }
        next();
    };
};
