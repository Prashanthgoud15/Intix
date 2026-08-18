import { useNavigate } from 'react-router-dom';
import { Lightbulb, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

const LatestInsight = ({ latestReport, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-full animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    <div className="h-3 bg-slate-700 rounded w-full"></div>
                    <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-700 rounded w-4/6"></div>
                </div>
            </div>
        );
    }

    const feedback = latestReport?.finalFeedback;
    const hasInsights = feedback && (feedback.strengths?.length > 0 || feedback.areasForImprovement?.length > 0);

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                Latest Insight
            </h2>

            {!hasInsights ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                    <p className="text-sm text-slate-400 mb-4">
                        No insights available yet. Complete an interview to get personalized feedback.
                    </p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                        {feedback.strengths?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Strong Areas
                                </h3>
                                <ul className="space-y-1">
                                    {feedback.strengths.slice(0, 2).map((strength, idx) => (
                                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                            <span className="text-slate-500 mt-0.5">•</span>
                                            <span className="line-clamp-2">{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {feedback.areasForImprovement?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Focus Next
                                </h3>
                                <ul className="space-y-1">
                                    {feedback.areasForImprovement.slice(0, 2).map((area, idx) => (
                                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                            <span className="text-slate-500 mt-0.5">•</span>
                                            <span className="line-clamp-2">{area}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate(`/report/${latestReport._id}`)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-slate-900/50 hover:bg-slate-700 text-sm font-medium text-white rounded-lg border border-slate-700 transition-colors"
                    >
                        View Full Report
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default LatestInsight;
