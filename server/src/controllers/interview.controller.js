import Interview from '../models/Interview.model.js';
import ResumeProfile from '../models/ResumeProfile.model.js';
import mongoose from 'mongoose';
import aiService from '../services/aiService.js';
import speechService from '../services/speechService.js';
import scoringService from '../services/scoringService.js';
import reportService from '../services/reportService.js';
import { getQuestionBankForRole } from '../prompts/questionBanks.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpStatus } from '../constants/index.js';
import logger from '../utils/logger.js';

class InterviewController {
    /**
     * @desc    Start a new interview session
     * @route   POST /api/v1/interviews
     * @access  Private
     */
    startInterview = asyncHandler(async (req, res) => {
        const { job_role, difficulty, resume_id } = req.body;
        const userId = req.user._id;

        let questions = [];
        let resumeProfile = null;

        // If a resume is provided, use its generated interview plan
        if (resume_id) {
            resumeProfile = await ResumeProfile.findOne({ _id: resume_id, user: userId });
            if (!resumeProfile) {
                throw new ApiError(HttpStatus.NOT_FOUND, 'Resume profile not found');
            }

            if (resumeProfile.interviewPlan && Array.isArray(resumeProfile.interviewPlan)) {
                questions = resumeProfile.interviewPlan.map(q => ({
                    questionNumber: q.question_number,
                    phase: q.phase,
                    difficulty: q.difficulty,
                    category: q.category,
                    question: q.question,
                    context: q.context,
                    tips: q.tips,
                    // Was missing entirely here — the whole pipeline up to
                    // this point (AI generation, Zod validation) correctly
                    // carried projectTag through, but this one mapping step
                    // silently dropped it right before saving to the actual
                    // Interview document the rest of the app uses. Resume
                    // deep-dive questions lost their project association
                    // even though everything upstream had it correct.
                    projectTag: q.projectTag || '',
                }));
            }
        }

        // No resume: use the hand-authored, role-specific 16-question bank
        // instead of generating questions one-at-a-time via Groq during the
        // session. This was the source of the "got stuck, too many errors"
        // no-resume experience — the whole interview flow depended on 16
        // sequential AI calls succeeding mid-session, and the model defaulted
        // to generic system-design questions far too often instead of real
        // language/CS-fundamentals questions. The question bank guarantees
        // real structure, real DSA/language-specific content, and zero AI
        // dependency for the question flow itself (evaluation/feedback still
        // use Groq, just not question selection).
        if (questions.length === 0) {
            const bank = getQuestionBankForRole(job_role);
            questions = bank.map(q => ({
                questionNumber: q.question_number,
                phase: q.phase,
                difficulty: q.difficulty,
                category: q.category,
                question: q.question,
                tips: q.tips,
            }));
        }

        const interview = await Interview.create({
            user: userId,
            resumeProfile: resume_id || null,
            jobRole: job_role || 'General',
            difficulty: difficulty || 'medium',
            questions,
        });

        res.status(HttpStatus.CREATED).json(
            new ApiResponse(
                HttpStatus.CREATED,
                { interview },
                'Interview session started'
            )
        );
    });

    /**
     * @desc    Get the next unanswered question in the fixed session plan
     * @route   GET /api/v1/interviews/:id/next-question
     * @access  Private
     */
    getNextQuestion = asyncHandler(async (req, res) => {
        const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });

        if (!interview) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Interview not found');
        }

        if (interview.status !== 'in_progress') {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Interview is not in progress');
        }

        // The full question set (either the resume-derived plan or the
        // role-based question bank — see startInterview) is always built
        // upfront now, so this is just a lookup, not a generation step. No
        // AI call happens here anymore, which removes an entire class of
        // mid-session failure that previously could stall the interview.
        const nextQuestion = interview.questions.find(q => !q.answerText);

        if (!nextQuestion) {
            return res.status(HttpStatus.OK).json(
                new ApiResponse(HttpStatus.OK, { completed: true }, 'All questions answered')
            );
        }

        res.status(HttpStatus.OK).json(
            new ApiResponse(HttpStatus.OK, { question: nextQuestion, completed: false }, 'Next question retrieved')
        );
    });

    /**
     * @desc    Submit an answer (audio or text) and evaluate it
     * @route   POST /api/v1/interviews/:id/answer
     * @access  Private
     */
    submitAnswer = asyncHandler(async (req, res) => {
        const { question_id, text_answer, duration_seconds } = req.body;

        // frame_metrics arrives differently depending on how the request was
        // sent: a JSON body (text-only answers) delivers it as a real array
        // already; but the audio-recording path sends it via
        // multipart/form-data (needed to carry the audio Blob), and multer
        // parses ALL non-file fields as plain strings — so frame_metrics
        // there is the literal string "[{...},{...}]", not an array. This
        // was being silently treated as falsy-for-array-purposes, skipping
        // the entire camera-metrics computation for every voice-recorded
        // answer (virtually every real answer), which is exactly why eye
        // contact/posture/gestures/confidence showed N/A while speech
        // metrics — handled via the separate audio blob — worked fine.
        let frame_metrics = req.body.frame_metrics;
        if (typeof frame_metrics === 'string') {
            try {
                frame_metrics = JSON.parse(frame_metrics);
            } catch (err) {
                logger.warn(`Failed to parse frame_metrics JSON string: ${err.message}`);
                frame_metrics = [];
            }
        }
        if (!Array.isArray(frame_metrics)) {
            frame_metrics = [];
        }

        const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
        if (!interview) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Interview not found');
        }

        const question = interview.questions.id(question_id);
        if (!question) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Question not found in this interview');
        }

        if (question.answerText) {
            // Cheap, fast-fail rejection for the common case: a genuine
            // retry/double-submit hitting a question that already has a
            // real saved answer. Checked before any expensive work
            // (transcription, Groq evaluation) even starts.
            throw new ApiError(HttpStatus.CONFLICT, 'This question has already been answered');
        }

        // Atomically CLAIM this question before doing any expensive work.
        // This is what actually protects against two near-simultaneous
        // requests for the SAME question (e.g. a network-level retry racing
        // the original, or a double-click that slipped past the frontend's
        // own guard) — MongoDB's findOneAndUpdate with this filter can only
        // succeed for ONE of two racing requests, because after the first
        // one flips answerText away from empty, the second one's filter
        // condition ('questions.answerText' still empty) no longer matches
        // and it atomically fails to claim, rather than both proceeding
        // through evaluation and one silently clobbering the other's result.
        // question_id is cast to a real ObjectId explicitly rather than
        // relying on Mongoose's automatic query casting for a nested
        // $elemMatch + arrayFilters combination, which is worth being
        // explicit about rather than hoping it infers correctly.
        let questionObjectId;
        try {
            questionObjectId = new mongoose.Types.ObjectId(question_id);
        } catch (err) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid question ID');
        }

        const claimed = await Interview.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id,
                questions: { $elemMatch: { _id: questionObjectId, answerText: { $in: [null, ''] } } },
            },
            { $set: { 'questions.$[q].answerText': '[PROCESSING]' } },
            { arrayFilters: [{ 'q._id': questionObjectId }] }
        );

        if (!claimed) {
            // Lost the race — another request already claimed (or fully
            // answered) this question between our check above and now.
            throw new ApiError(HttpStatus.CONFLICT, 'This question has already been answered');
        }

        // CRITICAL: everything from here on is wrapped so that if ANYTHING
        // throws (a failed transcription, a Groq evaluation error, a save
        // failure), the claim above gets released — resetting answerText
        // back to empty — before the error propagates. Without this, a
        // single failure here would leave the question permanently stuck
        // at '[PROCESSING]' forever: every future attempt (including a
        // plain skip) would immediately hit the "already answered" check
        // and fail identically, with no way to recover except manual DB
        // intervention. This was a real bug found via a live repro: a
        // question got stuck this way and every subsequent skip attempt
        // failed in a loop.
        try {
            let answerText = text_answer;
            let wordsArray = [];

            // If audio file is provided, transcribe it
            if (req.file) {
                const transcription = await speechService.transcribeAudio(req.file.buffer, req.file.mimetype);
                answerText = transcription.text;
                wordsArray = transcription.words || [];
            }

            // Filter out common Whisper silence hallucinations. Whisper frequently
            // produces short stock phrases when fed silence or near-silence audio
            // (this is a well-known model behavior, not specific to this app) —
            // the previous version only matched a handful of exact strings, which
            // let most hallucinated phrases through as if they were real answers.
            const lowerAnswer = answerText ? answerText.toLowerCase().trim() : '';
            const hallucinationPatterns = [
                /^thank(s| you)( for watching)?[.!]?$/,
                /^(please )?(like,? )?subscribe( to (the|my) channel)?[.!]?$/,
                /^bye([- ]?bye)?[.!]?$/,
                /^(see you|goodbye)( next time)?[.!]?$/,
                /^\.+$/, // just dots
                /^\[?(music|silence|blank_audio|no audio)\]?$/,
                /^(um+|uh+|hmm+)[.,!?]?$/, // a single stray filler with nothing else
            ];
            const isHallucination = hallucinationPatterns.some(re => re.test(lowerAnswer));

            // Also treat near-empty content as a skip: a handful of words for a
            // multi-second recording is far more likely to be a Whisper artifact
            // than a genuine (if brief) answer.
            const isTooShortToBeReal = wordsArray.length > 0 && wordsArray.length < 3 && (duration_seconds || 0) > 5;

            if (isHallucination || isTooShortToBeReal) {
                answerText = '[SKIPPED]';
                wordsArray = [];
            }

            if (!answerText || answerText.trim() === '') {
                answerText = '[SKIPPED]';
            }

            // 1. Evaluate the answer content using Groq
            let evaluation = {};
            if (answerText === '[SKIPPED]') {
                evaluation = {
                    score: 0,
                    clarity_score: 0,
                    relevance_score: 0,
                    completeness_score: 0,
                    feedback: 'The candidate skipped this question or did not provide a discernible answer.',
                    strengths: [],
                    areas_for_improvement: ['No answer provided.'],
                };
            } else {
                evaluation = await aiService.evaluateAnswer(
                    question.question,
                    answerText,
                    interview.jobRole
                );
            }

            // 2. Calculate speech metrics (filler words, pace)
            let speechMetrics = { total_words: 0, total_filler_count: 0, true_speaking_time_seconds: 0 };
            let wpm = null;
            let speechClarity = null;

            if (answerText !== '[SKIPPED]') {
                speechMetrics = scoringService.detectFillerWords(answerText, wordsArray);
                wpm = scoringService.calculateSpeechPace(speechMetrics.total_words, duration_seconds || 60, speechMetrics.true_speaking_time_seconds);
                speechClarity = scoringService.calculateSpeechClarityScore(wpm, speechMetrics.total_filler_count, speechMetrics.total_words);
            }

            // 3. Aggregate frame metrics (CV) if provided
            // IMPORTANT: if this question was skipped (or Whisper-hallucinated
            // silence detected as such), do NOT compute any per-question metrics
            // from whatever camera frames happened to be captured. Previously,
            // a silent person who was simply sitting still and facing the camera
            // could still score ~90%+ on eye-contact/posture/expression, and
            // since speech_clarity's weight was just excluded and the rest
            // renormalized to 100%, that alone could produce a misleadingly high
            // "Confidence" score for a question with NO real answer at all. A
            // skip must mean "no data for this question," full stop.
            let cvMetrics = {};
            let overallConfidence = null;

            if (answerText !== '[SKIPPED]' && frame_metrics && Array.isArray(frame_metrics)) {
                cvMetrics = scoringService.aggregateSessionMetrics(frame_metrics);

                // 4. Calculate overall confidence for this specific answer
                overallConfidence = scoringService.calculateOverallConfidence(
                    cvMetrics.eye_contact_percentage,
                    cvMetrics.posture_score,
                    speechClarity,
                    cvMetrics.gesture_score,
                    cvMetrics.expression_confidence
                );
            }

            // Update the question document
            question.answerText = answerText;
            question.evaluation = {
                score: evaluation.score,
                performanceScore: overallConfidence, // Save for adaptive difficulty
                clarityScore: evaluation.clarity_score,
                relevanceScore: evaluation.relevance_score,
                completenessScore: evaluation.completeness_score,
                feedback: evaluation.feedback,
                strengths: evaluation.strengths,
                areasForImprovement: evaluation.areas_for_improvement,
                isFallback: !!evaluation.is_fallback,
            };

            question.metrics = {
                eyeContactPercentage: cvMetrics.eye_contact_percentage,
                postureScore: cvMetrics.posture_score,
                gestureScore: cvMetrics.gesture_score,
                expressionConfidence: cvMetrics.expression_confidence,
                wordsPerMinute: wpm,
                fillerWordCount: speechMetrics.total_filler_count,
                fillerWordBreakdown: speechMetrics.filler_words || {},
                overallConfidence,
                speechClarityScore: speechClarity,
            };

            await interview.save();

            res.status(HttpStatus.OK).json(
                new ApiResponse(
                    HttpStatus.OK,
                    { question },
                    'Answer evaluated successfully'
                )
            );
        } catch (error) {
            // Release the claim so this question can be retried cleanly,
            // instead of being permanently stuck at '[PROCESSING]'.
            logger.error(`submitAnswer failed after claiming question ${question_id} — releasing claim so it can be retried: ${error.message}`);
            await Interview.updateOne(
                { _id: req.params.id, user: req.user._id },
                { $set: { 'questions.$[q].answerText': null } },
                { arrayFilters: [{ 'q._id': questionObjectId }] }
            ).catch(releaseErr => {
                // If even the release fails, log loudly — this is the one
                // scenario that could still leave a question stuck, and
                // needs to be visible for manual investigation rather than
                // silently swallowed.
                logger.error(`⚠️  FAILED TO RELEASE CLAIM on question ${question_id} — it may be stuck at '[PROCESSING]'. Release error: ${releaseErr.message}`);
            });
            throw error;
        }
    });

    /**
     * @desc    End the interview session and generate final feedback
     * @route   POST /api/v1/interviews/:id/end
     * @access  Private
     */
    endInterview = asyncHandler(async (req, res) => {
        const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
        if (!interview) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Interview not found');
        }

        if (interview.status === 'completed') {
            // Idempotent duplicate-call handling: return the EXISTING report,
            // not just the bare interview. reportService.generateFromInterview
            // already guards against creating a duplicate report (it looks up
            // by interview._id first and returns the existing one if found),
            // so this is safe to call again — it will not regenerate anything
            // or make a second AI call. Previously this path returned only
            // `{ interview }` with no `report` field, which meant a duplicate
            // end-interview call (e.g. a retried request, or a double-click)
            // would silently reintroduce the "Duration: 0 / metrics N/A" bug
            // on the frontend, since it depends on the real Report document.
            const existingReport = await reportService.generateFromInterview(interview);
            return res.status(HttpStatus.OK).json(
                new ApiResponse(HttpStatus.OK, { interview, report: existingReport }, 'Interview already completed')
            );
        }

        // Calculate session averages
        const answeredQuestions = interview.questions.filter(q => q.answerText && q.answerText !== '[SKIPPED]');

        if (answeredQuestions.length > 0) {
            // Average each metric only over questions that actually have a real
            // (non-null) value for it — a skipped question or a question where
            // CV/AI data wasn't available must NOT be averaged in as a 0, since
            // that silently drags every score down and misrepresents the
            // questions that genuinely were measured.
            const avg = (values) => {
                const real = values.filter(v => v !== null && v !== undefined);
                if (real.length === 0) return null;
                return real.reduce((a, b) => a + b, 0) / real.length;
            };

            const confidenceValues = answeredQuestions.map(q => q.metrics?.overallConfidence);
            const eyeValues = answeredQuestions.map(q => q.metrics?.eyeContactPercentage);
            const postureValues = answeredQuestions.map(q => q.metrics?.postureScore);
            const gestureValues = answeredQuestions.map(q => q.metrics?.gestureScore);
            const clarityValues = answeredQuestions.map(q => q.metrics?.speechClarityScore);
            const wpmValues = answeredQuestions.map(q => q.metrics?.wordsPerMinute);
            const scoreValues = answeredQuestions.map(q => q.evaluation?.score);
            const totalFillers = answeredQuestions.reduce((sum, q) => sum + (q.metrics?.fillerWordCount || 0), 0);

            // Merge every question's { word: count } breakdown into one
            // session-wide tally, e.g. { um: 6, like: 4, "you know": 2} —
            // this is what actually lets the report say which words were
            // used most, not just a bare total count.
            const fillerWordTotals = {};
            for (const q of answeredQuestions) {
                const breakdown = q.metrics?.fillerWordBreakdown;
                if (breakdown && typeof breakdown === 'object') {
                    for (const [word, count] of Object.entries(breakdown)) {
                        fillerWordTotals[word] = (fillerWordTotals[word] || 0) + count;
                    }
                }
            }

            const averageAnswerScore = avg(scoreValues);
            const averageConfidence = avg(confidenceValues);
            const averageSpeechClarity = avg(clarityValues);
            const skippedCountForScore = interview.questions.filter(q => q.answerText === '[SKIPPED]').length;
            const completionRate = interview.questions.length > 0
                ? ((interview.questions.length - skippedCountForScore) / interview.questions.length) * 100
                : null;

            // This is the ONE authoritative overall score for the session —
            // see scoringService.calculateSessionOverallScore for the
            // documented weighting. It replaces the old approach where the
            // frontend guessed at an "overall score" via a fallback chain
            // that could accidentally land on the non-verbal confidence
            // score alone (e.g. sitting silently but facing the camera could
            // show ~90%+ "confidence" with zero real answers given).
            const overallScore = scoringService.calculateSessionOverallScore(
                averageAnswerScore,
                averageConfidence,
                averageSpeechClarity,
                completionRate
            );

            interview.sessionMetrics = {
                overallScore,
                averageAnswerScore,
                averageConfidence,
                averageEyeContact: avg(eyeValues),
                averagePosture: avg(postureValues),
                averageGesture: avg(gestureValues),
                averageSpeechClarity,
                averageWpm: avg(wpmValues),
                totalFillerWords: totalFillers,
                fillerWordBreakdown: fillerWordTotals,
            };

            // Generate final feedback using Groq
            const skippedCount = answeredQuestions.filter(q => q.answerText === '[SKIPPED]').length;
            const transcriptions = answeredQuestions.map(q => `Q: ${q.question}\nA: ${q.answerText}`);
            const finalFeedback = await aiService.generateSessionFeedback(
                { ...interview.sessionMetrics, skipped_questions: skippedCount, total_questions: answeredQuestions.length },
                transcriptions,
                !!interview.resumeProfile
            );

            interview.finalFeedback = {
                detailedFeedback: finalFeedback.detailed_feedback,
                resumeFitScore: finalFeedback.resume_fit_score,
                resumeFitAnalysis: finalFeedback.resume_fit_analysis,
                strengths: finalFeedback.strengths,
                areasForImprovement: finalFeedback.areas_for_improvement,
                recommendations: finalFeedback.recommendations,
                isFallback: !!finalFeedback.is_fallback,
            };
        }

        interview.status = 'completed';
        interview.completedAt = new Date();
        await interview.save();

        // Await report generation and return the actual persisted Report
        // document (not the raw Interview object) — the frontend was
        // previously displaying the Interview object directly, which has no
        // `durationSeconds` field at all (that's only computed here, inside
        // the Report) and could show stale/undefined session metrics. This
        // was the cause of "Duration: 0" and "Eye Contact/Posture/etc: N/A"
        // on the report page even when the interview itself worked fine —
        // the Groq call for finalFeedback above already happened, so this
        // adds negligible extra time (just Mongo writes, no extra AI call).
        let report = null;
        try {
            report = await reportService.generateFromInterview(interview);
        } catch (err) {
            logger.error(`Failed to auto-generate report: ${err.message}`);
        }

        res.status(HttpStatus.OK).json(
            new ApiResponse(
                HttpStatus.OK,
                { interview, report },
                'Interview completed and feedback generated'
            )
        );
    });
}

export default new InterviewController();
