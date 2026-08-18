import mongoose from 'mongoose';
import { JobRoles, DifficultyLevels } from '../constants/index.js';

const questionSchema = new mongoose.Schema({
    questionNumber: { type: Number, required: true },
    phase: { type: String },
    difficulty: { type: String },
    category: { type: String },
    projectTag: { type: String }, // For resume deep-dive questions
    question: { type: String, required: true },
    context: { type: String },
    tips: [{ type: String }],

    // Populated during the interview
    answerAudioUrl: { type: String }, // Optional, if we store audio
    answerText: { type: String },
    evaluation: {
        score: { type: Number },
        performanceScore: { type: Number }, // Lightweight signal for adaptive difficulty
        clarityScore: { type: Number },
        relevanceScore: { type: Number },
        completenessScore: { type: Number },
        feedback: { type: String },
        strengths: [{ type: String }],
        areasForImprovement: [{ type: String }],
        // True if the AI evaluation call failed and this is placeholder
        // content, not a real assessment of the candidate's answer.
        isFallback: { type: Boolean, default: false },
    },

    // Computer Vision & Speech metrics for this specific question
    metrics: {
        eyeContactPercentage: { type: Number },
        postureScore: { type: Number },
        speechClarityScore: { type: Number },
        gestureScore: { type: Number },
        expressionConfidence: { type: Number },
        overallConfidence: { type: Number },
        wordsPerMinute: { type: Number },
        fillerWordCount: { type: Number },
        // Which specific filler words were used and how many times, e.g.
        // { um: 3, like: 2 } — previously only the total count was kept,
        // so the report could say "7 filler words" but never which ones.
        fillerWordBreakdown: { type: mongoose.Schema.Types.Mixed },
    },
});

const interviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        resumeProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ResumeProfile',
            // Optional: can be a general interview without a resume
        },
        jobRole: {
            type: String,
            enum: JobRoles,
            default: 'General',
        },
        difficulty: {
            type: String,
            enum: Object.values(DifficultyLevels),
            default: DifficultyLevels.MEDIUM,
        },
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'abandoned'],
            default: 'in_progress',
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
        },

        // Track the current phase for dynamic mode state machine
        currentPhase: {
            type: String,
            default: 'intro',
        },

        // The sequence of questions (generated upfront or dynamically)
        questions: [questionSchema],

        // Aggregated metrics for the entire session
        sessionMetrics: {
            // The single authoritative composite score for the session — see
            // scoringService.calculateSessionOverallScore for the documented
            // weighting (answer quality 55%, confidence 20%, speech clarity
            // 15%, completion rate 10%).
            overallScore: { type: Number },
            // Average of evaluation.score across all attempted questions
            // (skips correctly count as 0, they are not excluded).
            averageAnswerScore: { type: Number },
            averageConfidence: { type: Number },
            averageEyeContact: { type: Number },
            averagePosture: { type: Number },
            averageGesture: { type: Number },
            averageSpeechClarity: { type: Number },
            totalFillerWords: { type: Number },
            // { word: count } across the whole session, e.g. {um: 6, like: 4}
            fillerWordBreakdown: { type: mongoose.Schema.Types.Mixed },
            averageWpm: { type: Number },
        },

        // Final feedback generated at the end of the session
        finalFeedback: {
            detailedFeedback: { type: String },
            // These two were previously missing from the schema, so Mongoose's
            // default strict mode silently dropped them on save even though
            // the AI service generated real values for them — resume-fit score
            // was computed but never actually persisted.
            resumeFitScore: { type: Number },
            resumeFitAnalysis: { type: String },
            strengths: [{ type: String }],
            areasForImprovement: [{ type: String }],
            recommendations: [{ type: String }],
            // True if the session-feedback AI call failed and this is
            // placeholder text, not a real analysis of the transcript.
            isFallback: { type: Boolean, default: false },
        },
    },
    {
        timestamps: true,
    }
);

// Index for fetching user's interview history
interviewSchema.index({ user: 1, createdAt: -1 });

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;
