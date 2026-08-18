import { z } from 'zod';
import { JobRoles } from '../constants/index.js';

export const analyzeResumeSchema = z.object({
    body: z.object({
        job_role: z.enum(JobRoles, {
            errorMap: () => ({ message: 'Invalid job role' }),
        }).default('General'),
    }),
    // Note: File validation (size, type) is handled by Multer middleware,
    // but we can ensure a file was actually uploaded here.
    file: z.object({
        fieldname: z.string(),
        originalname: z.string(),
        mimetype: z.string(),
        size: z.number(),
    }, { required_error: 'Resume PDF file is required' }),
});
