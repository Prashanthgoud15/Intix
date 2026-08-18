import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { formatScore } from '../utils/helpers';
import { Play, AlertCircle, FileText, ChevronRight, TrendingUp, CheckCircle2, AlertTriangle, ArrowRight, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [recentReports, setRecentReports] = useState([]);
    const [resumes, setResumes] = useState([]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [analyticsRes, historyRes, resumesRes] = await Promise.allSettled([
                apiService.getAnalytics(),
                apiService.getHistory(1, 5),
                apiService.getMyResumes()
            ]);

            if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value);
            if (historyRes.status === 'fulfilled') setRecentReports(historyRes.value.reports || []);
            if (resumesRes.status === 'fulfilled') setResumes(resumesRes.value || []);

        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setError('Unable to load your dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (error) {
        return (
            <EmptyState
                icon={AlertCircle}
                title="Unable to load dashboard"
                description={error}
                actionLabel="Retry"
                onAction={fetchDashboardData}
            />
        );
    }

    const latestResume = resumes && resumes.length > 0 ? resumes[0] : null;
    const latestReport = recentReports.length > 0 ? recentReports[0] : null;

    // Prepare trend data
    const trendData = analytics?.trend?.map((point, index) => ({
        session: `#${index + 1}`,
        score: point.overallScore != null ? +point.overallScore.toFixed(1) : null,
    })) || [];

    const validScores = analytics?.trend?.map(t => t.overallScore).filter(s => s != null) || [];
    const bestScore = validScores.length > 0 ? Math.max(...validScores) : null;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Top Section: Greeting & Next Step */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Greeting */}
                <section className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="relative z-10">
                        <h1 className="text-2xl font-semibold text-white mb-2">
                            Good morning, {user?.name?.split(' ')[0] || 'User'}
                        </h1>
                        <p className="text-slate-400 mb-6">
                            Ready for your next interview?
                        </p>
                        <div className="flex items-center gap-4">
                            <Button
                                size="md"
                                icon={Play}
                                onClick={() => navigate('/interview/setup')}
                            >
                                Start New Interview
                            </Button>
                            <button
                                onClick={() => navigate('/history')}
                                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                View History
                            </button>
                        </div>
                    </div>
                </section>

                {/* Next Step Experience */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary-500 uppercase tracking-wider mb-4">
                        <Target className="w-4 h-4" /> Next Step
                    </div>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    ) : latestReport && latestReport.finalFeedback?.areasForImprovement?.length > 0 ? (
                        <div>
                            <p className="text-sm text-slate-300 leading-relaxed mb-6">
                                Your last interview showed that <span className="text-white font-medium">{latestReport.finalFeedback.areasForImprovement[0].toLowerCase()}</span> is your biggest improvement area.
                            </p>
                            <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/interview/setup')}>
                                Practice Again
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-slate-300 leading-relaxed mb-6">
                                Start your first interview and we'll build your performance profile.
                            </p>
                            <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/interview/setup')}>
                                Start Interview
                            </Button>
                        </div>
                    )}
                </section>
            </div>

            {/* Quick Performance */}
            <section>
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="text-3xl font-semibold text-white mb-1">
                                {analytics?.hasData ? analytics.totalInterviews : '0'}
                            </div>
                            <div className="text-sm text-slate-400">Total Interviews</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="text-3xl font-semibold text-white mb-1">
                                {analytics?.hasData ? analytics.totalInterviews : '0'}
                            </div>
                            <div className="text-sm text-slate-400">Completed</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="text-3xl font-semibold text-white mb-1">
                                {formatScore(analytics?.overallAverages?.score)}
                            </div>
                            <div className="text-sm text-slate-400">Average Score</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none"></div>
                            <div className="text-3xl font-semibold text-white mb-1 relative z-10">
                                {formatScore(bestScore)}
                            </div>
                            <div className="text-sm text-slate-400">Best Score</div>
                        </div>
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Trend & Feedback */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Trend */}
                    <section>
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Performance Trend
                        </h2>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-[300px]">
                            {loading ? (
                                <Skeleton className="w-full h-full" />
                            ) : trendData.length >= 2 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis
                                            dataKey="session"
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={[0, 100]}
                                            ticks={[0, 25, 50, 75, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                                            itemStyle={{ color: '#06b6d4' }}
                                            formatter={(value) => [`${value}%`, 'Score']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#06b6d4"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }}
                                            activeDot={{ r: 6, fill: '#22d3ee' }}
                                            connectNulls={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                                    <TrendingUp className="w-8 h-8 text-slate-600 mb-3" />
                                    <p className="text-slate-400 mb-4 text-sm">Complete at least 2 interviews to see<br />how your performance changes over time.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Latest Feedback */}
                    <section>
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                            Latest Feedback
                        </h2>
                        {loading ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <Skeleton className="h-6 w-32 mb-4" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ) : latestReport && latestReport.finalFeedback ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" /> Strong areas
                                        </h3>
                                        <ul className="space-y-2">
                                            {latestReport.finalFeedback.strengths?.slice(0, 3).map((item, i) => (
                                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                    <span className="text-emerald-500/50 mt-0.5">•</span>
                                                    <span className="line-clamp-2">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Focus next
                                        </h3>
                                        <ul className="space-y-2">
                                            {latestReport.finalFeedback.areasForImprovement?.slice(0, 3).map((item, i) => (
                                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                    <span className="text-amber-500/50 mt-0.5">•</span>
                                                    <span className="line-clamp-2">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-800">
                                    <button onClick={() => navigate(`/report/${latestReport._id}`)} className="text-sm font-medium text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors">
                                        View Full Report <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
                                No feedback available yet.
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column: Recent Interviews & Resume */}
                <div className="space-y-8">
                    {/* Recent Interviews */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                Recent Interviews
                            </h2>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                            </div>
                        ) : recentReports.length === 0 ? (
                            <div className="py-8 text-center border border-slate-800 bg-slate-900 rounded-xl">
                                <p className="text-slate-400 text-sm">No interviews completed yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentReports.map(report => (
                                    <div
                                        key={report._id}
                                        onClick={() => navigate(`/report/${report._id}`)}
                                        className="group flex items-center justify-between p-4 bg-slate-900 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors border border-slate-800"
                                    >
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                                                {report.jobRole || 'General Interview'}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                <span className="mx-1.5">·</span>
                                                {report.sessionMetrics?.questionsAnswered || 0} answered
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="font-semibold text-white text-sm">
                                                    {formatScore(report.sessionMetrics?.overallScore)}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Resume Status */}
                    <section>
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                            Resume
                        </h2>
                        {loading ? (
                            <Skeleton className="h-32 w-full" />
                        ) : latestResume ? (
                            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                                        <FileText className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-200">Resume uploaded</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Updated {new Date(latestResume.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mb-4">
                                    Used for personalized interview preparation.
                                </p>
                                <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/resume')}>
                                    Manage Resume
                                </Button>
                            </div>
                        ) : (
                            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 text-center">
                                <h3 className="text-sm font-medium text-slate-200 mb-1">No resume uploaded</h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    Upload a PDF to enable personalized interviews.
                                </p>
                                <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/resume')}>
                                    Upload Resume
                                </Button>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
