import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { HttpStatus } from '../constants/index.js';
import env from '../config/env.js';

class AuthService {
    /**
     * Generate Access and Refresh Tokens
     */
    generateTokens(user) {
        const payload = {
            id: user._id,
            role: user.role,
            // See User.model.js — this is what makes logout actually
            // invalidate the refresh token server-side.
            tokenVersion: user.tokenVersion,
        };

        const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
            expiresIn: env.JWT_ACCESS_EXPIRY,
        });

        const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
            expiresIn: env.JWT_REFRESH_EXPIRY,
        });

        return { accessToken, refreshToken };
    }

    /**
     * Register a new user
     */
    async register(userData) {
        const { email, name, password } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError(HttpStatus.CONFLICT, 'Email is already registered');
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
        });

        const tokens = this.generateTokens(user);

        return {
            user,
            tokens,
        };
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Find user and explicitly select password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid email or password');
        }

        if (!user.isActive) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'Account has been deactivated');
        }

        // Check password
        const isMatch = await user.isPasswordMatch(password);
        if (!isMatch) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid email or password');
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save({ validateBeforeSave: false });

        const tokens = this.generateTokens(user);

        return {
            user,
            tokens,
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(token) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

            // Check if user still exists and is active
            const user = await User.findById(decoded.id);
            if (!user) {
                throw new ApiError(HttpStatus.UNAUTHORIZED, 'User no longer exists');
            }

            if (!user.isActive) {
                throw new ApiError(HttpStatus.FORBIDDEN, 'Account has been deactivated');
            }

            // Reject a refresh token from a session that has been logged
            // out — logout() increments tokenVersion, so any token minted
            // before that no longer matches and is rejected here, even
            // though it's still cryptographically valid and unexpired.
            if (decoded.tokenVersion !== user.tokenVersion) {
                throw new ApiError(HttpStatus.UNAUTHORIZED, 'Session has been logged out. Please login again.');
            }

            // Generate new tokens
            const tokens = this.generateTokens(user);

            return {
                user,
                tokens,
            };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new ApiError(HttpStatus.UNAUTHORIZED, 'Refresh token expired. Please login again.');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid refresh token');
            }
            throw error;
        }
    }

    /**
     * Logout — invalidates the user's current refresh token (and any
     * others minted before this point) by bumping tokenVersion. Safe to
     * call more than once: a second call just increments again, which is
     * harmless since the effect ("nothing before this point works") is the
     * same either way.
     */
    async logout(userId) {
        const user = await User.findById(userId);
        if (!user) {
            // Nothing to invalidate — logging out a user that doesn't exist
            // (or was already deleted) isn't an error the caller needs to
            // handle differently from a normal logout.
            return;
        }
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save({ validateBeforeSave: false });
    }
}

export default new AuthService();
