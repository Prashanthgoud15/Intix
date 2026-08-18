import { Target, Award, CheckCircle, TrendingUp } from 'lucide-react';

const PerformanceOverview = ({ analytics, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
                        <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-slate-700 rounded w-1/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    const hasData = analytics?.hasData;

    const stats = [
        {
            label: 'Total Interviews',
            value: hasData ? analytics.totalInterviews : 'N/A',
            icon: <Target className="w-5 h-5 text-blue-400" />,
        },
        {
            label: 'Completed Interviews',
            value: hasData ? analytics.totalInterviews : 'N/A', // Assuming all in history are completed
            icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
        },
        {
            label: 'Average Score',
            value: hasData && analytics.averageOverallScore ? `${analytics.averageOverallScore}%` : 'N/A',
            icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
        },
        {
            label: 'Best Score',
            value: hasData && analytics.bestScore ? `${analytics.bestScore}%` : 'N/A',
            icon: <Award className="w-5 h-5 text-amber-400" />,
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        {stat.icon}
                        <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-auto">
                        {stat.value}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PerformanceOverview;
