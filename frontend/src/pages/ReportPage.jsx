import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Download,
  RefreshCw,
  TrendingUp,
  Eye,
  User,
  MessageSquare,
  Activity,
  Award,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Share2,
  Twitter,
  Linkedin,
  Link,
  Check
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { jsPDF } from 'jspdf';
import { formatTimestamp, getConfidenceColor, getConfidenceBgColor } from '../utils/helpers';
import { useState } from 'react';

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const report = location.state?.report;

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Report Data</h2>
          <p className="text-slate-600 mb-6">Please complete an interview session first.</p>
          <button
            onClick={() => navigate('/interview')}
            className="btn-primary"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  const { metrics, detailed_feedback, strengths, areas_for_improvement, recommendations, timestamp, duration } = report;

  // Prepare chart data
  const radarData = [
    { metric: 'Eye Contact', value: metrics.eye_contact_percentage, fullMark: 100 },
    { metric: 'Posture', value: metrics.posture_score, fullMark: 100 },
    { metric: 'Expression', value: metrics.expression_confidence, fullMark: 100 },
    { metric: 'Gestures', value: metrics.gesture_score, fullMark: 100 },
    { metric: 'Speech', value: metrics.speech_clarity_score, fullMark: 100 },
  ];

  const barData = [
    { name: 'Eye Contact', score: metrics.eye_contact_percentage },
    { name: 'Posture', score: metrics.posture_score },
    { name: 'Expression', score: metrics.expression_confidence },
    { name: 'Gestures', score: metrics.gesture_score },
    { name: 'Speech', score: metrics.speech_clarity_score },
  ];

  // Download PDF Report
  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(24);
    doc.setTextColor(14, 165, 233);
    doc.text('Intix — Your Personal AI Interview Coach', margin, yPos);
    yPos += 10;

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Performance Report', margin, yPos);
    yPos += 15;

    // Session Info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${formatTimestamp(timestamp)}`, margin, yPos);
    yPos += 6;
    doc.text(`Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`, margin, yPos);
    yPos += 10;

    // Overall Score
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Overall Confidence Score', margin, yPos);
    yPos += 8;

    doc.setFontSize(32);
    doc.setTextColor(14, 165, 233);
    doc.text(`${metrics.overall_confidence.toFixed(1)}%`, margin, yPos);
    yPos += 15;

    // Metrics
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Performance Metrics', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    const metricsData = [
      ['Eye Contact', `${metrics.eye_contact_percentage.toFixed(1)}%`],
      ['Posture', `${metrics.posture_score.toFixed(1)}%`],
      ['Expression Confidence', `${metrics.expression_confidence.toFixed(1)}%`],
      ['Gesture Score', `${metrics.gesture_score.toFixed(1)}%`],
      ['Speech Clarity', `${metrics.speech_clarity_score.toFixed(1)}%`],
      ['Filler Words', `${metrics.filler_word_count}`],
      ['Speech Pace', `${metrics.speech_pace.toFixed(0)} WPM`],
    ];

    metricsData.forEach(([label, value]) => {
      doc.text(`${label}:`, margin, yPos);
      doc.text(value, margin + 80, yPos);
      yPos += 6;
    });

    yPos += 10;

    // Feedback
    doc.setFontSize(14);
    doc.text('Detailed Feedback', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    const feedbackLines = doc.splitTextToSize(detailed_feedback, pageWidth - 2 * margin);
    feedbackLines.forEach(line => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });

    yPos += 10;

    // Strengths
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94);
    doc.text('Strengths', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    strengths.forEach((strength, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(`${index + 1}. ${strength}`, pageWidth - 2 * margin);
      lines.forEach(line => {
        doc.text(line, margin, yPos);
        yPos += 6;
      });
    });

    yPos += 10;

    // Areas for Improvement
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(239, 68, 68);
    doc.text('Areas for Improvement', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    areas_for_improvement.forEach((area, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(`${index + 1}. ${area}`, pageWidth - 2 * margin);
      lines.forEach(line => {
        doc.text(line, margin, yPos);
        yPos += 6;
      });
    });

    yPos += 10;

    // Recommendations
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(14, 165, 233);
    doc.text('Recommendations', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    recommendations.forEach((rec, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - 2 * margin);
      lines.forEach(line => {
        doc.text(line, margin, yPos);
        yPos += 6;
      });
    });

    // Save PDF
    doc.save(`interview-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Share functions
  const shareToTwitter = () => {
    const text = `Just completed my AI interview practice session! 🎯\n\nOverall Score: ${overallScore.toFixed(1)}%\n\nPractice with Intix - Your Personal AI Interview Coach`;
    const url = window.location.origin;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToLinkedIn = () => {
    const url = window.location.origin;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    setShowShareMenu(false);
  };

  const copyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 2000);
  };

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
              <h1 className="text-3xl font-bold text-slate-800">Performance Report</h1>
              <p className="text-slate-600">{formatTimestamp(timestamp)}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadPDF}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            
            {/* Share Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="btn-secondary flex items-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
              
              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-10"
                >
                  <button
                    onClick={shareToTwitter}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-blue-400" />
                    <span>Share on Twitter</span>
                  </button>
                  <button
                    onClick={shareToLinkedIn}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-blue-600" />
                    <span>Share on LinkedIn</span>
                  </button>
                  <button
                    onClick={copyLink}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="text-green-600">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link className="w-5 h-5 text-slate-500" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
            
            <button
              onClick={() => navigate('/interview')}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </motion.div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card mb-8 bg-gradient-to-br from-primary-500 to-accent-500 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Overall Confidence Score</h2>
              <p className="text-white/80">
                Duration: {Math.floor(duration / 60)}m {Math.floor(duration % 60)}s
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {metrics.overall_confidence.toFixed(1)}%
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Award className="w-6 h-6" />
                <span className="text-lg">
                  {metrics.overall_confidence >= 80 ? 'Excellent' : 
                   metrics.overall_confidence >= 60 ? 'Good' : 
                   metrics.overall_confidence >= 40 ? 'Fair' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-xl font-bold mb-4 text-slate-800">Performance Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                <Radar
                  name="Your Score"
                  dataKey="value"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h3 className="text-xl font-bold mb-4 text-slate-800">Detailed Scores</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="score" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Eye Contact', value: metrics.eye_contact_percentage, icon: <Eye className="w-5 h-5" />, color: 'blue' },
            { label: 'Posture', value: metrics.posture_score, icon: <User className="w-5 h-5" />, color: 'green' },
            { label: 'Speech Clarity', value: metrics.speech_clarity_score, icon: <MessageSquare className="w-5 h-5" />, color: 'purple' },
            { label: 'Gestures', value: metrics.gesture_score, icon: <Activity className="w-5 h-5" />, color: 'orange' },
          ].map((metric, index) => (
            <div key={index} className="metric-card">
              <div className={`w-10 h-10 rounded-lg bg-${metric.color}-100 flex items-center justify-center text-${metric.color}-600 mb-3`}>
                {metric.icon}
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">
                {metric.value.toFixed(0)}%
              </div>
              <div className="text-sm text-slate-600">{metric.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Additional Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="card text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">
              {metrics.filler_word_count}
            </div>
            <div className="text-slate-600">Filler Words</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-accent-600 mb-2">
              {metrics.speech_pace.toFixed(0)}
            </div>
            <div className="text-slate-600">Words Per Minute</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {metrics.expression_confidence.toFixed(0)}%
            </div>
            <div className="text-slate-600">Expression Confidence</div>
          </div>
        </motion.div>

        {/* Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card mb-8"
        >
          <h3 className="text-2xl font-bold mb-4 text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" />
            Detailed Feedback
          </h3>
          <p className="text-slate-700 leading-relaxed text-lg">
            {detailed_feedback}
          </p>
        </motion.div>

        {/* Strengths and Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
          >
            <h3 className="text-xl font-bold mb-4 text-green-800 flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Strengths
            </h3>
            <ul className="space-y-3">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-slate-700 leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Areas for Improvement */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="card bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200"
          >
            <h3 className="text-xl font-bold mb-4 text-orange-800 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {areas_for_improvement.map((area, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-slate-700 leading-relaxed">{area}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card bg-gradient-to-br from-primary-50 to-accent-50 border-2 border-primary-200 mb-8"
        >
          <h3 className="text-2xl font-bold mb-4 text-primary-800 flex items-center gap-2">
            <Lightbulb className="w-6 h-6" />
            Recommendations
          </h3>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <span className="text-slate-700 leading-relaxed text-lg">{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex justify-center gap-4"
        >
          <button
            onClick={() => navigate('/history')}
            className="btn-secondary"
          >
            View History
          </button>
          <button
            onClick={() => navigate('/interview')}
            className="btn-primary"
          >
            Start New Interview
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ReportPage;
