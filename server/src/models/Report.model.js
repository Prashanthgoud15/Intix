import mongoose from 'mongoose';

const questionSummarySchema = new mongoose.Schema({
    questionNumber: Number,
    phase: String,
    category: String,
    question: String,
    answerText: String,
    score: Number,
    feedback: String,
    overallConfidence: Number,
    wordsPerMinute: Number,
    fillerWordCount: Number,
});

const reportSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        interview: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Interview',
            required: true,
            unique: true, // One report per interview
        },
        resumeProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ResumeProfile',
        },
        jobRole: { type: String },

        // Aggregated metrics for the entire session.
        // NOTE: these are intentionally nullable with NO numeric default.
        // null means "not measured" (e.g. camera off, all questions skipped).
        // A Number default of 0 here would make "not measured" indistinguishable
        // from "measured, and it was zero" — silently fabricating data.
        sessionMetrics: {
            // The single authoritative composite score for the session (see
            // scoringService.calculateSessionOverallScore). null means
            // "insufficient data" (e.g. zero questions were attempted) — not
            // 0, which would falsely imply a measured, terrible performance.
            overallScore: { type: Number, default: null },
            // Average of evaluation.score across attempted questions —
            // reflects verbal answer quality specifically (skips count as 0).
            averageAnswerScore: { type: Number, default: null },
            averageConfidence: { type: Number, default: null },
            averageEyeContact: { type: Number, default: null },
            averagePosture: { type: Number, default: null },
            averageGesture: { type: Number, default: null },
            averageSpeechClarity: { type: Number, default: null },
            averageWpm: { type: Number, default: null },
            totalFillerWords: { type: Number, default: 0 },
            fillerWordBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
            questionsAnswered: { type: Number, default: 0 },
            questionsSkipped: { type: Number, default: 0 },
            totalQuestions: { type: Number, default: 0 },
            durationSeconds: { type: Number, default: 0 },
        },

        // Per-question breakdown (snapshot)
        questionSummaries: [questionSummarySchema],

        // Final AI feedback
        finalFeedback: {
            detailedFeedback: String,
            resumeFitScore: Number,
            resumeFitAnalysis: String,
            strengths: [String],
            areasForImprovement: [String],
            recommendations: [String],
            isFallback: { type: Boolean, default: false },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for history and analytics queries
reportSchema.index({ user: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
