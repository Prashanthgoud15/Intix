import { ZodError } from 'zod';

/**
 * Generic validation middleware using Zod schemas.
 * Validates req.body, req.query, and req.params against the provided schema.
 */
export const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
            file: req.file,
            files: req.files,
        });
        return next();
    } catch (error) {
        if (error instanceof ZodError) {
            // Pass to centralized error handler
            return next(error);
        }
        return next(error);
    }
};
