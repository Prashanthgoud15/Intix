/**
 * aiOutput.validators.js — Validates every JSON response that comes back
 * from Groq before the app trusts it. LLM output is untrusted input: the
 * model can return a missing field, a string where a number was expected,
 * a score of 150, or a difficulty value that isn't one of ours. None of
 * that should reach the database or the UI as if it were valid data — a
 * validation failure here is treated exactly like a parse failure (it
 * throws, which triggers the existing retry/fallback path in aiService.js
 * and resumeService.js), not silently coerced into something plausible.
 *
 * IMPORTANT DISTINCTION baked into this file: a field being TOO LONG (e.g.
 * a resume listing 35 skills across several categorized sections) is NOT
 * the same kind of problem as a field being the WRONG SHAPE (a missing
 * required field, an invalid enum value, a duplicate question number).
 * The former is normal, legitimate content that just needs bounding for
 * prompt-size/DB-size reasons — it should be gracefully TRUNCATED, not
 * rejected. The latter indicates the model's output doesn't actually match
 * what we asked for, and should fail validation. An earlier version of this
 * file used `.max(N)` (which REJECTS) for simple list fields, which meant a
 * real, correctly-analyzed resume with slightly more skills than expected
 * failed validation entirely and threw away a perfectly good analysis —
 * exactly the "false failure" this whole reliability effort exists to
 * eliminate. Only counts that indicate genuinely broken generation (e.g.
 * an interview plan with fewer than 10 questions) still reject outright.
 */
import { z } from 'zod';
import { DifficultyLevels } from '../constants/index.js';

const DIFFICULTY_VALUES = Object.values(DifficultyLevels);

// Clamps a value into [min, max] AFTER confirming it's a finite number —
// used as a Zod .transform() so an out-of-range score (e.g. the model
// returning 150 for a 0-100 score) is corrected rather than rejected
// outright, since the rest of the field is otherwise usable.
const clampedScore = (min = 0, max = 100) =>
    z.coerce.number().finite().transform(val => Math.min(max, Math.max(min, val)));

const nullableClampedScore = (min = 0, max = 100) =>
    z.union([z.null(), z.coerce.number().finite().transform(val => Math.min(max, Math.max(min, val)))]);

// A list field that gets TRUNCATED (not rejected) if the model returns more
// items than expected — see the file-level comment above for why.
const boundedArray = (itemSchema, maxLen) =>
    z.array(itemSchema).default([]).transform(arr => arr.slice(0, maxLen));

export const questionGenOutputSchema = z.object({
    question: z.string().trim().min(5, 'question is too short to be real'),
    category: z.string().trim().min(1).default('General'),
    difficulty: z.enum(DIFFICULTY_VALUES).optional(),
    tips: boundedArray(z.string(), 6),
});

export const evaluateAnswerOutputSchema = z.object({
    score: clampedScore(),
    clarity_score: clampedScore(),
    relevance_score: clampedScore(),
    completeness_score: clampedScore(),
    feedback: z.string().trim().min(1).default('Response received.'),
    strengths: boundedArray(z.string(), 10),
    areas_for_improvement: boundedArray(z.string(), 10),
});

export const sessionFeedbackOutputSchema = z.object({
    detailed_feedback: z.string().trim().min(1),
    resume_fit_score: nullableClampedScore().optional(),
    resume_fit_analysis: z.string().trim().optional().default(''),
    strengths: boundedArray(z.string(), 10),
    areas_for_improvement: boundedArray(z.string(), 10),
    recommendations: boundedArray(z.string(), 10),
});

// ── Resume analysis / interview plan (resumeService.js) ──────────────────

const projectItemSchema = z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().optional().default(''),
    technologies: boundedArray(z.string(), 15),
    achievements: z.union([z.string(), z.null()]).optional(),
    challenges: z.union([z.string(), z.null()]).optional(),
});

const educationItemSchema = z.object({
    degree: z.string().trim().optional().default(''),
    institution: z.string().trim().optional().default(''),
    year: z.union([z.string(), z.number(), z.null()]).optional(),
});

export const resumeProfileOutputSchema = z.object({
    candidate_name: z.string().trim().min(1).default('Candidate'),
    current_role: z.string().trim().optional().default('Not specified'),
    experience_years: z.coerce.number().finite().min(0).max(60).default(0),
    // Bounded to 40 (up from a hard-reject 30): real resumes with
    // categorized skill sections (languages / frameworks / tools / cloud)
    // legitimately list this many — this was the exact field that rejected
    // a real, valid resume analysis in testing.
    key_skills: boundedArray(z.string(), 40),
    projects: boundedArray(projectItemSchema, 20),
    education: boundedArray(educationItemSchema, 10),
    certifications: boundedArray(z.string(), 20),
    strengths: boundedArray(z.string(), 10),
    interview_focus_areas: boundedArray(z.string(), 10),
});

const VALID_PLAN_PHASES = ['warm_up', 'resume_deep_dive', 'technical', 'behavioral', 'hr', 'closing'];

export const interviewPlanQuestionSchema = z.object({
    question_number: z.coerce.number().int().min(1).max(16),
    phase: z.enum(VALID_PLAN_PHASES),
    difficulty: z.enum(DIFFICULTY_VALUES),
    category: z.string().trim().min(1).default('General'),
    // projectTag must survive this validation step intact — it was
    // previously getting silently dropped between the AI plan and the
    // Interview document; validating (not stripping) it here is part of
    // making sure it doesn't disappear again.
    projectTag: z.string().optional().default(''),
    question: z.string().trim().min(5),
    context: z.string().optional().default(''),
    tips: boundedArray(z.string(), 6),
});

/**
 * Validates the interview plan array as a whole. Unlike the simple list
 * fields above, the TOTAL question count genuinely signals whether
 * generation worked: too few (<10) means the model gave up partway through
 * and can't be padded back to something usable. Too many is truncated
 * (not rejected) to the first 20, on the reasoning that if the model
 * over-generated, the first N are still usable content, and rejecting the
 * whole plan over it would throw away otherwise-good questions for no
 * benefit. Duplicate detection runs AFTER truncation, on the set that will
 * actually be used.
 */
export function validateInterviewPlan(rawPlan) {
    if (!Array.isArray(rawPlan)) {
        throw new Error('Interview plan output failed validation: response is not an array');
    }
    if (rawPlan.length < 10) {
        throw new Error(`Interview plan output failed validation: only ${rawPlan.length} questions returned, expected ~16`);
    }

    const truncated = rawPlan.slice(0, 20);

    const validatedItems = truncated.map((item, i) => {
        const result = interviewPlanQuestionSchema.safeParse(item);
        if (!result.success) {
            const issues = result.error.issues.map(iss => `${iss.path.join('.')}: ${iss.message}`).join('; ');
            throw new Error(`Interview plan output failed validation: question at index ${i} is invalid — ${issues}`);
        }
        return result.data;
    });

    const numbers = validatedItems.map(q => q.question_number);
    const dupNumbers = numbers.filter((n, i) => numbers.indexOf(n) !== i);
    if (dupNumbers.length > 0) {
        throw new Error(`Interview plan output failed validation: duplicate question_number(s): ${[...new Set(dupNumbers)].join(', ')}`);
    }

    const seenText = new Set();
    for (const q of validatedItems) {
        const key = q.question.trim().toLowerCase();
        if (seenText.has(key)) {
            throw new Error(`Interview plan output failed validation: duplicate question text — "${q.question.slice(0, 60)}..."`);
        }
        seenText.add(key);
    }

    return validatedItems;
}

/**
 * Runs a Zod schema against parsed AI JSON output and throws a clear error
 * on failure — callers should treat this exactly like a JSON.parse failure
 * (i.e. it should trigger the same retry/fallback path), not catch it
 * separately, since "the model returned syntactically valid JSON that
 * doesn't match what we asked for" is just as unusable as invalid JSON.
 */
export function validateAiOutput(schema, data, label) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`${label} failed validation: ${issues}`);
    }
    return result.data;
}
