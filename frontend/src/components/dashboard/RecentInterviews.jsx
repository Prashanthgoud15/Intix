import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, FileText } from 'lucide-react';

const RecentInterviews = ({ reports, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Recent Interviews</h2>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                            <div className="space-y-2 w-1/2">
                                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                            </div>
                            <div className="h-8 bg-slate-700 rounded w-20"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-400" />
                    Recent Interviews
                </h2>
                {reports?.length > 0 && (
                    <button
                        onClick={() => navigate('/history')}
                        className="text-sm text-primary-400 hover:text-primary-300 font-medium"
                    >
                        View all
                    </button>
                )}
            </div>

            {!reports || reports.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-white font-medium mb-2">No interviews yet</h3>
                    <p className="text-sm text-slate-400 mb-6 max-w-xs">
                        Start your first interview to see your results here.
                    </p>
                    <button
                        onClick={() => navigate('/interview')}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Start Interview
                    </button>
                </div>
            ) : (
                <div className="space-y-3 flex-1">
                    {reports.map((report) => (
                        <div
                            key={report._id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/50 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
                        >
                            <div className="mb-3 sm:mb-0">
                                <h3 className="font-semibold text-white text-base mb-1">
                                    {report.jobRole || 'General Interview'}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(report.createdAt).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {report.sessionMetrics?.questionsAnswered || 0} answered
                                        {report.sessionMetrics?.questionsSkipped > 0 && ` · ${report.sessionMetrics.questionsSkipped} skipped`}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                <div className="text-left sm:text-right">
                                    <div className="text-xs text-slate-400 mb-0.5">Overall Score</div>
                                    <div className="font-bold text-white">
                                        {report.sessionMetrics?.overallScore != null
                                            ? `${report.sessionMetrics.overallScore}%`
                                            : 'N/A'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/report/${report._id}`)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-md border border-slate-600 transition-colors"
                                >
                                    View Report
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentInterviews;
