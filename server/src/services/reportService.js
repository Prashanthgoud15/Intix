import Report from '../models/Report.model.js';
import Interview from '../models/Interview.model.js';
import logger from '../utils/logger.js';

class ReportService {
    /**
     * Generate and persist a Report from a completed Interview document.
     * This is called automatically by interview.controller.js when `endInterview` is called.
     */
    async generateFromInterview(interview) {
        // Guard: don't create duplicate reports
        const existing = await Report.findOne({ interview: interview._id });
        if (existing) {
            logger.info(`Report already exists for interview ${interview._id}`);
            return existing;
        }

        const answeredQuestions = interview.questions.filter(q => q.answerText && q.answerText !== '[SKIPPED]');

        // Build per-question summaries for the report
        const questionSummaries = answeredQuestions.map(q => ({
            questionNumber: q.questionNumber,
            phase: q.phase,
            category: q.category,
            question: q.question,
            answerText: q.answerText,
            score: q.evaluation?.score,
            feedback: q.evaluation?.feedback,
            strengths: q.evaluation?.strengths || [],
            areasForImprovement: q.evaluation?.areasForImprovement || [],
            overallConfidence: q.metrics?.overallConfidence,
            wordsPerMinute: q.metrics?.wordsPerMinute,
            fillerWordCount: q.metrics?.fillerWordCount,
        }));

        // Prefer the authoritative score computed in interview.controller's
        // endInterview (which properly weighs answer quality, confidence,
        // speech clarity, and completion rate together — see
        // scoringService.calculateSessionOverallScore). Only fall back to a
        // simple answer-score average here for older interview documents
        // that predate this field.
        const scores = answeredQuestions
            .map(q => q.evaluation?.score)
            .filter(s => s != null);
        const fallbackAverageScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : null;
        const overallScore = interview.sessionMetrics?.overallScore ?? fallbackAverageScore;
        const averageAnswerScore = interview.sessionMetrics?.averageAnswerScore ?? fallbackAverageScore;

        // Duration from interview start to completion
        const durationSeconds = interview.completedAt && interview.startedAt
            ? Math.round((new Date(interview.completedAt) - new Date(interview.startedAt)) / 1000)
            : 0;

        const report = await Report.create({
            user: interview.user,
            interview: interview._id,
            resumeProfile: interview.resumeProfile || null,
            jobRole: interview.jobRole,
            sessionMetrics: {
                overallScore,
                averageAnswerScore,
                // Preserve null (= "not measured") instead of coercing to 0
                // (= "measured, and it was zero") — these mean very different
                // things and the report/frontend must be able to tell them apart.
                averageConfidence: interview.sessionMetrics?.averageConfidence ?? null,
                averageEyeContact: interview.sessionMetrics?.averageEyeContact ?? null,
                averagePosture: interview.sessionMetrics?.averagePosture ?? null,
                averageGesture: interview.sessionMetrics?.averageGesture ?? null,
                averageSpeechClarity: interview.sessionMetrics?.averageSpeechClarity ?? null,
                averageWpm: interview.sessionMetrics?.averageWpm ?? null,
                totalFillerWords: interview.sessionMetrics?.totalFillerWords ?? null,
                fillerWordBreakdown: interview.sessionMetrics?.fillerWordBreakdown ?? {},
                questionsAnswered: answeredQuestions.length,
                questionsSkipped: interview.questions.filter(q => q.answerText === '[SKIPPED]').length,
                totalQuestions: interview.questions.length,
                durationSeconds,
            },
            questionSummaries,
            finalFeedback: interview.finalFeedback || {},
        });

        logger.info(`Report ${report._id} created for interview ${interview._id}`);
        return report;
    }

    /**
     * Get all reports for a user, sorted by newest first.
     * Returns a lean list without the heavy questionSummaries array.
     */
    async getHistoryForUser(userId, limit = 20, page = 1) {
        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            Report.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-questionSummaries') // Exclude heavy field for list view
                .lean(),
            Report.countDocuments({ user: userId }),
        ]);

        return {
            reports,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get a single full report (with questionSummaries) by its ID.
     * Ensures the report belongs to the requesting user.
     */
    async getReportById(reportId, userId) {
        const report = await Report.findOne({ _id: reportId, user: userId })
            .populate('interview', 'startedAt completedAt status')
            .lean();
        return report;
    }

    /**
     * Get analytics trends across a user's reports — useful for a dashboard.
     */
    async getAnalyticsForUser(userId) {
        const reports = await Report.find({ user: userId })
            .sort({ createdAt: 1 }) // Ascending for trend calculation
            .select('sessionMetrics jobRole createdAt')
            .lean();

        if (reports.length === 0) {
            return { hasData: false };
        }

        // Null-safe average: only averages over reports where THIS SPECIFIC
        // metric is a real, measured number — a report with a null score
        // (e.g. every question was skipped, or the camera was never on for
        // confidence specifically) is excluded from that metric's average
        // entirely, not counted as a real 0. This matters a lot in
        // practice: "|| 0" here used to silently drag every average down
        // whenever even one report had incomplete data, which is a very
        // normal thing to happen (partial sessions, camera-off testing,
        // etc.) — not an edge case.
        const avgOf = (getter) => {
            const values = reports.map(getter).filter(v => v !== null && v !== undefined);
            if (values.length === 0) return null;
            return +(values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1);
        };

        const totalFillerWords = reports.reduce((sum, r) => sum + (r.sessionMetrics?.totalFillerWords || 0), 0);

        // Score trend (per report, for a line chart) — nulls preserved
        // deliberately (not coerced to 0) so the chart can render a real
        // gap for a session with no measured score, instead of a
        // misleading dip to zero that looks like a genuinely bad score.
        const trend = reports.map(r => ({
            date: r.createdAt,
            jobRole: r.jobRole,
            overallScore: r.sessionMetrics?.overallScore ?? null,
            averageConfidence: r.sessionMetrics?.averageConfidence ?? null,
        }));

        // Best performing role — averaged per role using the same
        // null-safe logic, so a role with one no-data session doesn't get
        // unfairly dragged down relative to a role with all-real sessions.
        const roleMap = {};
        for (const r of reports) {
            const score = r.sessionMetrics?.overallScore;
            if (score === null || score === undefined) continue; // exclude, don't count as 0
            if (!roleMap[r.jobRole]) roleMap[r.jobRole] = { total: 0, count: 0 };
            roleMap[r.jobRole].total += score;
            roleMap[r.jobRole].count += 1;
        }
        const bestRole = Object.entries(roleMap)
            .map(([role, d]) => ({ role, avg: d.total / d.count }))
            .sort((a, b) => b.avg - a.avg)[0]?.role || null;

        return {
            hasData: true,
            totalInterviews: reports.length,
            overallAverages: {
                score: avgOf(r => r.sessionMetrics?.overallScore ?? null),
                confidence: avgOf(r => r.sessionMetrics?.averageConfidence ?? null),
                wpm: avgOf(r => r.sessionMetrics?.averageWpm ?? null),
                // Filler words are a real, meaningful 0 when actually
                // measured as zero (clean speech) — unlike the score/
                // confidence/wpm fields, there's no "not measured" case
                // here worth distinguishing, so a plain sum/average is fine.
                fillerWords: +(totalFillerWords / reports.length).toFixed(1),
            },
            bestRole,
            trend,
        };
    }
}

export default new ReportService();
