import Groq from 'groq-sdk';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { callGroqWithRetry, isRetryableGroqError } from '../utils/groqRetry.js';
import {
    generateQuestionPrompt,
    generateQuestionSystemPrompt,
    evaluateAnswerPrompt,
    evaluateAnswerSystemPrompt,
    sessionFeedbackPrompt,
    sessionFeedbackSystemPrompt,
} from '../prompts/interview.prompts.js';
import {
    questionGenOutputSchema,
    evaluateAnswerOutputSchema,
    sessionFeedbackOutputSchema,
    validateAiOutput,
} from '../validators/aiOutput.validators.js';

class AiService {
    constructor() {
        this.client = new Groq({ apiKey: env.GROQ_API_KEY });
        this.model = 'openai/gpt-oss-20b'; // Switched from 70b due to rate limits
        this.fastModel = 'openai/gpt-oss-20b';
        // Used as a second attempt (different model) before giving up and
        // falling back to static content — the 8b-instant model is fast but
        // more prone to malformed JSON on complex prompts, which was silently
        // triggering the static fallbacks far more often than an outage would.
        this.secondaryModel = 'openai/gpt-oss-120b';

        // Diverse fallback questions to avoid repeating same question
        this.fallbackQuestions = [
            {
                question: 'Tell me about a time when you had to debug a complex issue. Walk me through your approach.',
                category: 'Technical Problem-Solving',
                difficulty: 'medium',
                tips: ['Explain your debugging methodology', 'Use specific tools and techniques', 'Discuss what you learned'],
            },
            {
                question: 'Describe a project where you had to work with a difficult team member. How did you handle it?',
                category: 'Behavioral',
                difficulty: 'medium',
                tips: ['Use the STAR method', 'Focus on your actions and outcomes', 'Emphasize communication'],
            },
            {
                question: "What's the most complex feature you've implemented? Explain the trade-offs you made.",
                category: 'Technical Experience',
                difficulty: 'hard',
                tips: ['Discuss architecture decisions', 'Explain performance considerations', 'Talk about scalability'],
            },
            {
                question: 'How do you stay updated with new technologies and best practices in your field?',
                category: 'Professional Development',
                difficulty: 'easy',
                tips: ['Mention specific resources', 'Show genuine interest', 'Discuss practical applications'],
            },
            {
                question: "Describe your most significant technical achievement and why you're proud of it.",
                category: 'Technical Achievement',
                difficulty: 'medium',
                tips: ['Be specific about your contribution', 'Explain the impact', 'Discuss technical challenges'],
            },
        ];
    }

    _cleanJsonResponse(text) {
        let cleanText = text.trim();

        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();

        // See resumeService.js for why this exists: the 8B model often
        // prepends conversational text ("Here's the question:") before the
        // real JSON, which broke JSON.parse even after fence-stripping.
        // Extract just the JSON slice between the first opening bracket and
        // its matching final closing bracket, ignoring surrounding prose.
        const firstBrace = cleanText.indexOf('{');
        const firstBracket = cleanText.indexOf('[');
        let start = -1;
        if (firstBrace === -1) start = firstBracket;
        else if (firstBracket === -1) start = firstBrace;
        else start = Math.min(firstBrace, firstBracket);

        if (start > 0) {
            const openChar = cleanText[start];
            const closeChar = openChar === '{' ? '}' : ']';
            const end = cleanText.lastIndexOf(closeChar);
            if (end > start) {
                cleanText = cleanText.substring(start, end + 1);
            }
        }

        // See resumeService.js's identical fix for why: a trailing comma
        // before a closing bracket/brace is a common, unambiguous LLM
        // mistake, safe to correct with a regex.
        cleanText = cleanText.replace(/,(\s*[}\]])/g, '$1');

        return cleanText.trim();
    }

    async _callGroqWithRetry(prompt, systemPrompt = '', model = null, temperature = 0.7, maxTokens = 4096) {
        const targetModel = model || this.model;
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await callGroqWithRetry(
            () => this.client.chat.completions.create({
                model: targetModel,
                messages,
                temperature,
                max_tokens: maxTokens,
            }),
            {
                // 2 attempts per model (not 3): a small retry count per
                // requirement #4/#6, and error-type-aware classification
                // below means we no longer waste an attempt retrying a
                // 400/401/403/413 that will fail identically every time.
                maxAttempts: 2,
                timeoutMs: 15000,
                label: `Groq call (${targetModel})`,
            }
        );

        return response.choices[0]?.message?.content?.trim() || '';
    }

    /**
     * Try the primary model (with its own retries), and if that fully fails,
     * try once more on a different, stronger model before giving up. This
     * exists because most "AI failures" in this app were actually malformed
     * JSON from the fast 8b model on complex prompts, not real Groq outages —
     * a second attempt on a different model recovers most of those.
     *
     * NOTE: if the primary model failure was a non-retryable client error
     * (400/401/403/413 — e.g. a genuinely malformed request or an invalid
     * API key), retrying on a different model won't help either, since the
     * problem is with OUR request, not the model. Fail fast in that case
     * instead of wasting another round-trip.
     */
    async _callWithModelFallback(prompt, systemPrompt, temperature, maxTokens = 4096) {
        try {
            return await this._callGroqWithRetry(prompt, systemPrompt, this.model, temperature, maxTokens);
        } catch (primaryError) {
            if (!isRetryableGroqError(primaryError)) {
                logger.error(`Primary model failed with a non-retryable error (status=${primaryError?.status ?? 'n/a'}) — not trying secondary model: ${primaryError.message}`);
                throw primaryError;
            }
            logger.warn(`Primary model failed, trying secondary model: ${primaryError.message}`);
            return await this._callGroqWithRetry(prompt, systemPrompt, this.secondaryModel, temperature, maxTokens);
        }
    }

    _adjustQuestionDifficulty(question, targetDifficulty) {
        const adjusted = { ...question, difficulty: targetDifficulty };

        if (targetDifficulty === 'easy') {
            adjusted.tips = ['Take your time to think', 'Use simple, clear language', 'Give specific examples'];
        } else if (targetDifficulty === 'hard') {
            adjusted.tips = ['Think deeply about trade-offs', 'Consider edge cases and scalability', 'Mention architectural patterns'];
        }

        return adjusted;
    }

    async generateInterviewQuestion(jobRole = 'General', difficulty = 'medium', previousQuestions = [], currentPhase = 'technical', performanceScore = null) {
        const avoidTopics = previousQuestions.length > 0 ? previousQuestions.slice(-5).join(', ') : 'None yet';
        const prompt = generateQuestionPrompt(jobRole, difficulty, avoidTopics, currentPhase, performanceScore);
        const systemPrompt = generateQuestionSystemPrompt;

        try {
            // 500 tokens is plenty for a single question + category + tips —
            // the previous shared 4096 default was wasting TPM budget on
            // every call for no benefit (see resumeService.js's identical
            // fix for the same lesson learned the hard way via a real 413).
            const resultText = await this._callWithModelFallback(prompt, systemPrompt, 0.8, 500);
            const cleanText = this._cleanJsonResponse(resultText);
            const parsed = JSON.parse(cleanText);
            // Validated, not just parsed: a syntactically-valid JSON object
            // missing "question" or with a garbage "difficulty" value is
            // just as unusable as a parse failure, and is now treated the
            // same way (throws into the catch block below -> fallback pool).
            const result = validateAiOutput(questionGenOutputSchema, parsed, 'generateInterviewQuestion output');

            return {
                question: result.question,
                category: result.category,
                difficulty: result.difficulty || difficulty,
                tips: result.tips,
                is_fallback: false,
            };
        } catch (error) {
            logger.error(`Both models failed to generate a question for phase="${currentPhase}": ${error.message}. Using static fallback pool — this question will NOT match the requested phase.`);

            // Static fallback pool has no phase-specific content, so filter by
            // category as a best-effort match instead of picking fully at random.
            const phaseCategoryMap = {
                behavioral: 'Behavioral',
                technical: 'Technical',
            };
            const wantedCategory = phaseCategoryMap[currentPhase];
            const candidates = wantedCategory
                ? this.fallbackQuestions.filter(q => q.category.includes(wantedCategory))
                : this.fallbackQuestions;
            const pool = candidates.length > 0 ? candidates : this.fallbackQuestions;
            const fallback = pool[Math.floor(Math.random() * pool.length)];

            const adjusted = fallback.difficulty !== difficulty
                ? this._adjustQuestionDifficulty(fallback, difficulty)
                : { ...fallback };

            return { ...adjusted, is_fallback: true };
        }
    }

    async evaluateAnswer(question, answer, jobRole = 'General') {
        const prompt = evaluateAnswerPrompt(jobRole, question, answer);
        const systemPrompt = evaluateAnswerSystemPrompt;

        try {
            // 600 tokens: a JSON object with 4 scores, a feedback string,
            // and two short arrays — doesn't need a large budget.
            const resultText = await this._callWithModelFallback(prompt, systemPrompt, 0.3, 600);
            const cleanText = this._cleanJsonResponse(resultText);
            const parsed = JSON.parse(cleanText);
            // Validated + clamped: scores are coerced to numbers and clamped
            // to 0-100 here (see clampedScore in the validator) — the old
            // `parseInt(result.score)` had no range check at all, so a model
            // hallucinating "150" or a negative number would have been
            // persisted and skewed every downstream average.
            const result = validateAiOutput(evaluateAnswerOutputSchema, parsed, 'evaluateAnswer output');

            return {
                score: result.score,
                clarity_score: result.clarity_score,
                relevance_score: result.relevance_score,
                completeness_score: result.completeness_score,
                feedback: result.feedback,
                strengths: result.strengths,
                areas_for_improvement: result.areas_for_improvement,
                is_fallback: false,
            };
        } catch (error) {
            logger.error(`Answer evaluation failed on both models: ${error.message}`);
            // IMPORTANT: scores are null, not 50. A flat 50 silently presented
            // as if it were a real evaluation is exactly the "fake results
            // regardless of input" behavior this was fixed to stop. null lets
            // the report/report averaging correctly treat this as missing
            // data instead of a mediocre-but-real score.
            return {
                score: null,
                clarity_score: null,
                relevance_score: null,
                completeness_score: null,
                feedback: 'AI evaluation could not be completed for this answer (temporary AI service issue). This answer was not scored.',
                strengths: [],
                areas_for_improvement: [],
                is_fallback: true,
            };
        }
    }

    async generateSessionFeedback(metrics, transcriptions, isResumeBased = false) {
        // "N/A" (not "0.0%") when a metric is null — null means "not measured"
        // (camera off, no face detected, question skipped), and reporting it
        // as 0 would tell the AI (and eventually the user) that performance
        // was measured to be terrible, which is a different, false claim.
        const fmt = (val, suffix) => (val === null || val === undefined) ? 'N/A (not measured)' : `${val.toFixed(1)}${suffix}`;
        const metricsSummary = `
Eye Contact: ${fmt(metrics.averageEyeContact ?? metrics.eye_contact_percentage, '%')}
Posture: ${fmt(metrics.averagePosture ?? metrics.posture_score, '/100')}
Speech Clarity: ${fmt(metrics.averageSpeechClarity ?? metrics.speech_clarity_score, '/100')}
Overall Confidence: ${fmt(metrics.averageConfidence ?? metrics.overall_confidence, '%')}
Average Words Per Minute: ${fmt(metrics.averageWpm, ' wpm')}
Total Filler Words (session): ${metrics.totalFillerWords ?? metrics.total_filler_count ?? 'N/A'}
Questions Skipped: ${metrics.skipped_questions ?? 0} of ${metrics.total_questions ?? 'unknown'}
`;

        const prompt = sessionFeedbackPrompt(metricsSummary, transcriptions, isResumeBased);
        const systemPrompt = sessionFeedbackSystemPrompt;

        try {
            // 1500 tokens: this response is genuinely larger (a full written
            // paragraph plus 3 arrays), unlike the two calls above.
            const resultText = await this._callWithModelFallback(prompt, systemPrompt, 0.7, 1500);
            const cleanText = this._cleanJsonResponse(resultText);
            const parsed = JSON.parse(cleanText);
            const result = validateAiOutput(sessionFeedbackOutputSchema, parsed, 'generateSessionFeedback output');
            return { ...result, is_fallback: false };
        } catch (error) {
            logger.error(`Session feedback generation failed on both models: ${error.message}`);
            // Do NOT invent generic strengths/weaknesses like "Engaged throughout"
            // — that is fabricated content with no basis in the actual session
            // and was exactly why reports looked identical/fake regardless of
            // what really happened. Be explicit that generation failed instead.
            return {
                detailed_feedback: 'We were unable to generate your detailed AI report due to a temporary AI service issue. Your raw metrics and transcript below are real and unaffected — please try regenerating the report, or contact support if this persists.',
                resume_fit_score: null,
                resume_fit_analysis: '',
                strengths: [],
                areas_for_improvement: [],
                recommendations: [],
                is_fallback: true,
            };
        }
    }
}

export default new AiService();
