/**
 * groqRetry.js — Shared error classification and retry helper for every
 * Groq API call in this app (aiService.js, resumeService.js).
 *
 * WHY THIS EXISTS: retry logic previously lived separately in each service
 * and retried EVERY failure blindly, including client errors (400 malformed
 * request, 401 bad API key, 403 permission denied, 413 payload too large)
 * that will fail identically no matter how many times you retry with the
 * same payload — wasting time and, for 413s specifically, actively making
 * things worse by repeatedly hitting the same rate-limit ceiling. This
 * centralizes the "should we retry this?" decision so both services use
 * consistent, correct logic.
 */
import logger from './logger.js';

// Groq's SDK (groq-sdk/error.js) attaches a numeric `.status` to real API
// errors (APIError and subclasses). Errors with NO `.status` at all are
// either: our own timeout wrapper, a network-level connection error, a
// JSON.parse failure on the model's output, or a schema-validation failure
// on the model's output — all of which are worth retrying, since a retry
// either recovers from a transient network blip OR gets a fresh (and
// possibly valid, given LLM output is stochastic) generation attempt.
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 409, 413, 422]);

export function isRetryableGroqError(error) {
    const status = error?.status;
    if (typeof status === 'number') {
        if (NON_RETRYABLE_STATUSES.has(status)) return false;
        if (RETRYABLE_STATUSES.has(status)) return true;
        // Any other unexpected status code: be conservative and don't retry,
        // since it's neither a known transient failure nor a known
        // permanent one, and requirement #4/#5 explicitly ask to reduce
        // excessive/unnecessary retries.
        return false;
    }
    // No status at all: timeout, network error, JSON parse failure, or an
    // AI-output validation failure — all retryable per the reasoning above.
    return true;
}

/**
 * Extracts a Retry-After value (in ms) from a Groq API error, if present.
 * Returns null if not available or not parseable.
 */
export function getRetryAfterMs(error) {
    try {
        const headers = error?.headers;
        if (!headers) return null;
        let raw = null;
        if (typeof headers.get === 'function') {
            raw = headers.get('retry-after');
        } else {
            raw = headers['retry-after'] || headers['Retry-After'];
        }
        if (!raw) return null;
        const seconds = parseInt(raw, 10);
        if (!isNaN(seconds) && seconds > 0) {
            // Cap at 15s: a Retry-After longer than that isn't worth waiting
            // for within a single HTTP request's budget — better to fail
            // fast into the fallback than block the user for a long time.
            return Math.min(seconds * 1000, 15000);
        }
    } catch (_err) {
        // Malformed header — ignore and fall back to standard backoff
    }
    return null;
}

/**
 * Runs `createFn()` (a function that returns a fresh Promise each call —
 * important so retries actually make a NEW request, not re-await an
 * already-settled one) with a per-attempt timeout, retrying only on
 * classified-retryable failures, up to `maxAttempts` total attempts, with
 * exponential backoff (or Retry-After if the API provided one).
 */
export async function callGroqWithRetry(createFn, { timeoutMs, label, maxAttempts = 2 }) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let timer;
        try {
            logger.info(`${label}: attempt ${attempt}/${maxAttempts}`);
            const timeout = new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
            });
            const result = await Promise.race([createFn(), timeout]);
            clearTimeout(timer);
            return result;
        } catch (error) {
            clearTimeout(timer);
            lastError = error;
            const retryable = isRetryableGroqError(error);
            logger.warn(`${label} attempt ${attempt}/${maxAttempts} failed (status=${error?.status ?? 'n/a'}, retryable=${retryable}): ${error.message}`);

            if (!retryable) {
                // Fail fast — retrying a 400/401/403/413 with the same
                // payload will just produce the same error again.
                throw error;
            }
            if (attempt < maxAttempts) {
                const retryAfter = getRetryAfterMs(error);
                const backoffMs = retryAfter ?? Math.min(3000 * attempt, 8000);
                logger.info(`${label}: retrying in ${backoffMs}ms${retryAfter ? ' (server Retry-After)' : ''}`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
        }
    }
    throw lastError;
}

/**
 * Tries a sequence of MODELS (not repeated attempts on the same one) for a
 * single logical call, one attempt each. This exists specifically for the
 * case where the SAME model, retried with the SAME payload, hits the SAME
 * wall twice in a row — e.g. two consecutive attempts both timing out at
 * exactly the configured limit, which means the model is genuinely slow
 * under current load right now, not experiencing a one-off network blip.
 * Retrying identically doesn't fix that; a different model has a genuinely
 * different queue/capacity and a real chance of actually succeeding.
 *
 * `createFnForModel(model)` must return a fresh Promise each call.
 */
export async function callGroqWithModelFallback(models, createFnForModel, { timeoutMs, label }) {
    let lastError;
    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        try {
            return await callGroqWithRetry(
                () => createFnForModel(model),
                { timeoutMs, label: `${label} (${model})`, maxAttempts: 1 }
            );
        } catch (error) {
            lastError = error;
            if (!isRetryableGroqError(error)) {
                // A 400/401/403/413 is a problem with OUR request, not this
                // particular model — a different model will fail the same way.
                throw error;
            }
            if (i < models.length - 1) {
                logger.warn(`${label}: model "${model}" failed, trying next model ("${models[i + 1]}"): ${error.message}`);
            }
        }
    }
    throw lastError;
}
