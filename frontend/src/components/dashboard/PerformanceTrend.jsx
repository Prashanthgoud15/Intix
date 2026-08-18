import { TrendingUp } from 'lucide-react';

const PerformanceTrend = ({ analytics, loading }) => {
    if (loading) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-64 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/3 mb-8"></div>
                <div className="h-32 bg-slate-700 rounded w-full"></div>
            </div>
        );
    }

    const trendData = analytics?.scoreTrend || [];
    const hasEnoughData = trendData.length >= 2;

    // Simple SVG line chart calculation
    const renderChart = () => {
        if (!hasEnoughData) return null;

        const width = 100;
        const height = 40;
        const padding = 5;

        // Find min and max scores to scale the chart
        const scores = trendData.map(d => d.score).filter(s => s != null);
        if (scores.length < 2) return null;

        const minScore = Math.max(0, Math.min(...scores) - 10);
        const maxScore = Math.min(100, Math.max(...scores) + 10);
        const range = maxScore - minScore || 1; // Prevent division by zero

        // Generate points
        const points = trendData
            .filter(d => d.score != null)
            .map((d, i, arr) => {
                const x = padding + (i / (arr.length - 1)) * (width - 2 * padding);
                const y = height - padding - ((d.score - minScore) / range) * (height - 2 * padding);
                return `${x},${y}`;
            })
            .join(' ');

        return (
            <div className="relative w-full h-32 mt-4">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

                    {/* Line */}
                    <polyline
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                    />

                    {/* Points */}
                    {trendData.filter(d => d.score != null).map((d, i, arr) => {
                        const x = padding + (i / (arr.length - 1)) * (width - 2 * padding);
                        const y = height - padding - ((d.score - minScore) / range) * (height - 2 * padding);
                        return (
                            <circle key={i} cx={x} cy={y} r="1.5" fill="#3b82f6" className="drop-shadow-md" />
                        );
                    })}

                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        );
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Performance Trend
            </h2>

            {!hasEnoughData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                        <TrendingUp className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400 max-w-[200px]">
                        Complete more interviews to see your performance trend over time.
                    </p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-slate-400">Your overall score progression</p>
                    <div className="flex-1 flex items-end">
                        {renderChart()}
                    </div>
                </>
            )}
        </div>
    );
};

export default PerformanceTrend;
