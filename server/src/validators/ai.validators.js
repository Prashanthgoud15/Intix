import { z } from 'zod';
import { JobRoles, DifficultyLevels } from '../constants/index.js';

export const generateQuestionSchema = z.object({
    body: z.object({
        job_role: z.enum(JobRoles, {
            errorMap: () => ({ message: 'Invalid job role' }),
        }).default('General'),
        difficulty: z.enum(Object.values(DifficultyLevels), {
            errorMap: () => ({ message: 'Invalid difficulty level' }),
        }).default(DifficultyLevels.MEDIUM),
        previous_questions: z.array(z.string()).optional().default([]),
        session_id: z.string().uuid('Invalid session ID').optional().nullable(),
    }),
});

export const evaluateAnswerSchema = z.object({
    body: z.object({
        job_role: z.enum(JobRoles, {
            errorMap: () => ({ message: 'Invalid job role' }),
        }).default('General'),
        question: z.string().min(5, 'Question must be at least 5 characters').max(5000, 'Question too long'),
        answer: z.string().min(1, 'Answer is required').max(5000, 'Answer too long'),
    }),
});
