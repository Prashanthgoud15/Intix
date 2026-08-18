import resumeService from '../services/resumeService.js';
import ResumeProfile from '../models/ResumeProfile.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpStatus } from '../constants/index.js';

class ResumeController {
    /**
     * @desc    Upload and analyze a resume
     * @route   POST /api/v1/resumes/analyze
     * @access  Private
     */
    analyzeResume = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Please upload a resume PDF');
        }

        const { job_role } = req.body;
        const userId = req.user._id;

        // Process the resume (extract text, analyze with Groq, generate plan, save to DB)
        let profile;
        try {
            profile = await resumeService.processResume(userId, req.file.buffer, job_role);
        } catch (error) {
            // Resume analysis failing must surface as a clear, recoverable
            // error — not a fake success. resumeService no longer silently
            // falls back to a generic empty candidate profile on failure
            // (it throws instead); this is where that throw becomes a real,
            // actionable HTTP response. 502 (not 500): we, the server,
            // successfully received the request but failed to get a valid
            // response from an upstream AI service — the frontend already
            // has both a "try again" path and a "Skip Resume" button for
            // exactly this situation.
            throw new ApiError(
                HttpStatus.BAD_GATEWAY,
                'We could not analyze your resume right now (AI service issue). Please try again, or continue without resume upload for a role-based interview.'
            );
        }

        res.status(HttpStatus.CREATED).json(
            new ApiResponse(
                HttpStatus.CREATED,
                { profile },
                'Resume analyzed and interview plan generated successfully'
            )
        );
    });

    /**
     * @desc    Get all resume profiles for the current user
     * @route   GET /api/v1/resumes
     * @access  Private
     */
    getMyResumes = asyncHandler(async (req, res) => {
        const profiles = await ResumeProfile.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select('-interviewPlan'); // Exclude the heavy plan array for the list view

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                { profiles },
                'Resumes retrieved successfully'
            )
        );
    });

    /**
     * @desc    Get a specific resume profile by ID
     * @route   GET /api/v1/resumes/:id
     * @access  Private
     */
    getResumeById = asyncHandler(async (req, res) => {
        const profile = await ResumeProfile.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!profile) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Resume profile not found');
        }

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                { profile },
                'Resume profile retrieved successfully'
            )
        );
    });
}

export default new ResumeController();
