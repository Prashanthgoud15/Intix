import aiService from '../services/aiService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpStatus } from '../constants/index.js';

class AiController {
    /**
     * @desc    [LEGACY] Generate an interview question
     * @route   POST /api/v1/ai/generate-question
     * @access  Public (for now, will be protected later if needed)
     */
    generateQuestion = asyncHandler(async (req, res) => {
        const { job_role, difficulty, previous_questions, session_id } = req.body;

        // TODO: Phase 4 - Check for resume-based questions in session if session_id is provided

        const result = await aiService.generateInterviewQuestion(
            job_role,
            difficulty,
            previous_questions
        );

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                {
                    question: result.question,
                    category: result.category,
                    difficulty: result.difficulty,
                    tips: result.tips,
                    context: '', // Will be populated for resume-based questions
                },
                'Question generated successfully'
            )
        );
    });

    /**
     * @desc    [LEGACY] Evaluate an interview answer
     * @route   POST /api/v1/ai/evaluate-answer
     * @access  Public
     */
    evaluateAnswer = asyncHandler(async (req, res) => {
        const { job_role, question, answer } = req.body;

        const result = await aiService.evaluateAnswer(question, answer, job_role);

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                result,
                'Answer evaluated successfully'
            )
        );
    });
}

export default new AiController();
