import authService from '../services/authService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpStatus } from '../constants/index.js';

class AuthController {
    /**
     * @desc    Register a new user
     * @route   POST /api/v1/auth/register
     * @access  Public
     */
    register = asyncHandler(async (req, res) => {
        const { user, tokens } = await authService.register(req.body);

        res.status(HttpStatus.CREATED).json(
            new ApiResponse(
                HttpStatus.CREATED,
                { user, tokens },
                'User registered successfully'
            )
        );
    });

    /**
     * @desc    Login user
     * @route   POST /api/v1/auth/login
     * @access  Public
     */
    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const { user, tokens } = await authService.login(email, password);

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                { user, tokens },
                'Login successful'
            )
        );
    });

    /**
     * @desc    Refresh access token
     * @route   POST /api/v1/auth/refresh
     * @access  Public
     */
    refresh = asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        const { user, tokens } = await authService.refreshToken(refreshToken);

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                { user, tokens },
                'Token refreshed successfully'
            )
        );
    });

    /**
     * @desc    Get current logged in user
     * @route   GET /api/v1/auth/me
     * @access  Private
     */
    getMe = asyncHandler(async (req, res) => {
        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                { user: req.user },
                'User profile retrieved successfully'
            )
        );
    });

    /**
     * @desc    Logout — invalidates the current session's refresh token
     *          server-side (see authService.logout / User.tokenVersion)
     * @route   POST /api/v1/auth/logout
     * @access  Private
     */
    logout = asyncHandler(async (req, res) => {
        await authService.logout(req.user._id);

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                null,
                'Logged out successfully'
            )
        );
    });
}

export default new AuthController();
