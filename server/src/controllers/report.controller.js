import reportService from '../services/reportService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpStatus } from '../constants/index.js';

class ReportController {
    /**
     * @desc    Get all reports for the current user (paginated history)
     * @route   GET /api/v1/reports
     * @access  Private
     */
    getHistory = asyncHandler(async (req, res) => {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);

        const { reports, pagination } = await reportService.getHistoryForUser(
            req.user._id,
            limit,
            page
        );

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                { reports, pagination },
                'Interview history retrieved successfully'
            )
        );
    });

    /**
     * @desc    Get a single detailed report
     * @route   GET /api/v1/reports/:id
     * @access  Private
     */
    getReportById = asyncHandler(async (req, res) => {
        const report = await reportService.getReportById(req.params.id, req.user._id);

        if (!report) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Report not found');
        }

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                { report },
                'Report retrieved successfully'
            )
        );
    });

    /**
     * @desc    Get analytics / trends for the current user
     * @route   GET /api/v1/reports/analytics
     * @access  Private
     */
    getAnalytics = asyncHandler(async (req, res) => {
        const analytics = await reportService.getAnalyticsForUser(req.user._id);

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                { analytics },
                'Analytics retrieved successfully'
            )
        );
    });
}

export default new ReportController();
