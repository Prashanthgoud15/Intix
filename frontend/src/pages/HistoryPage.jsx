import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/api';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { formatScore } from '../utils/helpers';
import { FileText, AlertCircle, Search, Filter } from 'lucide-react';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const historyData = await reportService.getHistory(1, 50); // Load more for history page
      setReports(historyData.reports || []);
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Unable to load your interview history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Unable to load history"
        description={error}
        actionLabel="Retry"
        onAction={loadHistory}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">History</h1>
          <p className="text-slate-400 text-sm">Your interview sessions and results.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 w-full sm:w-64 transition-all"
            />
          </div>
          <Button variant="outline" icon={Filter} className="hidden sm:flex">
            Filter
          </Button>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/80">
                <th className="px-6 py-4 font-medium">Interview Role</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Score</th>
                <th className="px-6 py-4 font-medium text-center">Answered</th>
                <th className="px-6 py-4 font-medium text-center">Skipped</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 flex justify-end"><Skeleton className="h-5 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="px-6 py-4 flex justify-end"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                    <p>No interviews found.</p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">
                        {report.jobRole || 'General Interview'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-white">
                        {formatScore(report.sessionMetrics?.overallScore)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-400">
                      {report.sessionMetrics?.questionsAnswered || 0}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-400">
                      {report.sessionMetrics?.questionsSkipped || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/report/${report._id}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      >
                        View Report
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
