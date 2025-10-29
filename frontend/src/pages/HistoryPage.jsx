import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  ChevronRight,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import apiService from '../services/api';
import { formatTimestamp } from '../utils/helpers';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await apiService.getSessionHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  const hasSessions = history && history.sessions && history.sessions.length > 0;

  // Prepare trend data
  const trendData = hasSessions
    ? history.sessions.map((session, index) => ({
        session: `#${index + 1}`,
        confidence: session.overall_confidence,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <Home className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Session History</h1>
              <p className="text-slate-600">Track your progress over time</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/interview')}
            className="btn-primary"
          >
            New Interview
          </button>
        </motion.div>

        {!hasSessions ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center py-16"
          >
            <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Sessions Yet</h2>
            <p className="text-slate-600 mb-6">
              Start your first interview to see your progress here
            </p>
            <button
              onClick={() => navigate('/interview')}
              className="btn-primary"
            >
              Start First Interview
            </button>
          </motion.div>
        ) : (
          <>
            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <div className="card text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {history.total_sessions}
                </div>
                <div className="text-slate-600">Total Sessions</div>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold text-accent-600 mb-2">
                  {history.average_confidence.toFixed(1)}%
                </div>
                <div className="text-slate-600">Average Confidence</div>
              </div>
              <div className="card text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className={`w-8 h-8 ${history.improvement_trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <div className={`text-4xl font-bold ${history.improvement_trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {history.improvement_trend >= 0 ? '+' : ''}{history.improvement_trend.toFixed(1)}%
                  </div>
                </div>
                <div className="text-slate-600">Improvement Trend</div>
              </div>
            </motion.div>

            {/* Progress Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card mb-8"
            >
              <h2 className="text-2xl font-bold mb-6 text-slate-800">Progress Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="session" tick={{ fill: '#475569' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ fill: '#0ea5e9', r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Session List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-slate-800">All Sessions</h2>
              <div className="space-y-4">
                {history.sessions.map((session, index) => (
                  <motion.div
                    key={session.session_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    className="card cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg">
                            #{history.sessions.length - index}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-lg font-semibold text-slate-800">
                                {formatTimestamp(session.timestamp)}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                session.overall_confidence >= 80
                                  ? 'bg-green-100 text-green-700'
                                  : session.overall_confidence >= 60
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : session.overall_confidence >= 40
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {session.overall_confidence.toFixed(1)}% Confidence
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {Math.floor(session.duration / 60)}m {Math.floor(session.duration % 60)}s
                              </span>
                              <span className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                {session.questions_answered} Questions
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Eye Contact</div>
                            <div className="text-lg font-bold text-slate-800">
                              {session.key_metrics.eye_contact.toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Posture</div>
                            <div className="text-lg font-bold text-slate-800">
                              {session.key_metrics.posture.toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Speech</div>
                            <div className="text-lg font-bold text-slate-800">
                              {session.key_metrics.speech_clarity.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
