import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { reportService } from '../services/api';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { formatScore } from '../utils/helpers';
import { ArrowLeft, AlertCircle, Download, CheckCircle2, AlertTriangle, MessageSquare, BarChart2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { jsPDF } from 'jspdf';

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { reportId } = useParams();

  const [report, setReport] = useState(location.state?.report || null);
  const [loading, setLoading] = useState(!location.state?.report);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) {
        setError('No report specified.');
        setLoading(false);
        return;
      }
      try {
        const data = await reportService.getReportById(reportId);
        setReport(data);
      } catch (err) {
        console.error('Failed to fetch report:', err);
        if (!report) {
          setError(
            err.response?.status === 404
              ? "This report doesn't exist or you don't have access to it."
              : 'Failed to load report data.'
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  const handleDownloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    const metrics = report.sessionMetrics || {};
    const feedback = report.finalFeedback || {};
    const questions = report.questionSummaries || [];

    // Colors
    const colors = {
      primary: [14, 165, 233], // cyan-500
      textMain: [15, 23, 42], // slate-900
      textMuted: [100, 116, 139], // slate-500
      border: [226, 232, 240], // slate-200
      success: [16, 185, 129], // emerald-500
      warning: [245, 158, 11], // amber-500
      bgLight: [248, 250, 252], // slate-50
    };

    // Helper: Draw Header
    const drawHeader = (pageDoc) => {
      pageDoc.setFillColor(...colors.primary);
      pageDoc.circle(22, 22, 3, 'F');
      pageDoc.setFontSize(18);
      pageDoc.setFont('helvetica', 'bold');
      pageDoc.setTextColor(...colors.textMain);
      pageDoc.text('INTIX', 28, 24);

      pageDoc.setFontSize(10);
      pageDoc.setFont('helvetica', 'normal');
      pageDoc.setTextColor(...colors.textMuted);
      pageDoc.text('AI Interview Performance Report', 190, 24, { align: 'right' });

      pageDoc.setDrawColor(...colors.border);
      pageDoc.line(20, 32, 190, 32);
    };

    // --- PAGE 1: OVERVIEW ---
    drawHeader(doc);

    // Candidate Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textMain);
    doc.text('INTERVIEW SUMMARY', 20, 45);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text(`Role:`, 20, 55);
    doc.text(`Date:`, 20, 62);
    doc.text(`Interview ID:`, 20, 69);

    doc.setTextColor(...colors.textMain);
    doc.text(report.jobRole || 'General Interview', 50, 55);
    doc.text(new Date(report.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 50, 62);
    doc.text(report._id.substring(0, 8).toUpperCase(), 50, 69);

    // Overall Score Box
    doc.setFillColor(...colors.bgLight);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(130, 45, 60, 28, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(...colors.textMuted);
    doc.text('OVERALL SCORE', 160, 53, { align: 'center' });

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(formatScore(metrics.overallScore), 160, 66, { align: 'center' });

    // Performance Snapshot
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textMain);
    doc.text('PERFORMANCE SNAPSHOT', 20, 90);

    const drawMetric = (label, value, x, y) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textMuted);
      doc.text(label, x, y);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMain);
      doc.text(value, x + 60, y, { align: 'right' });

      doc.setDrawColor(...colors.border);
      doc.line(x, y + 3, x + 60, y + 3);
    };

    const formatVal = (val, suffix = '') => val != null ? `${val}${suffix}` : 'N/A';
    const formatPct = (val) => val != null ? `${Math.round(val)}%` : 'N/A';

    drawMetric('Answer Quality', formatPct(metrics.averageAnswerScore), 20, 105);
    drawMetric('Confidence', formatPct(metrics.averageConfidence), 20, 115);
    drawMetric('Eye Contact', formatPct(metrics.averageEyeContact), 20, 125);
    drawMetric('Posture', formatPct(metrics.averagePosture), 20, 135);
    drawMetric('Gestures', formatPct(metrics.averageGesture), 20, 145);

    drawMetric('Questions Answered', formatVal(metrics.questionsAnswered), 110, 105);
    drawMetric('Questions Skipped', formatVal(metrics.questionsSkipped), 110, 115);
    drawMetric('Speech Pace', formatVal(Math.round(metrics.averageWpm), ' WPM'), 110, 125);
    drawMetric('Filler Words', formatVal(metrics.totalFillerWords), 110, 135);

    // Speech Analysis
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textMain);
    doc.text('SPEECH ANALYSIS', 20, 165);

    doc.setFillColor(...colors.bgLight);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(20, 172, 170, 30, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text('Filler Words:', 25, 180);
    doc.text('Speech Pace:', 100, 180);
    doc.text('Detected Words:', 25, 192);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textMain);
    doc.text(formatVal(metrics.totalFillerWords), 50, 180);
    doc.text(formatVal(Math.round(metrics.averageWpm), ' WPM'), 125, 180);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (metrics.totalFillerWords === 0) {
      doc.setTextColor(...colors.success);
      doc.text('Excellent speech discipline. No filler words detected.', 55, 192);
    } else if (metrics.fillerWordBreakdown && Object.keys(metrics.fillerWordBreakdown).length > 0) {
      doc.setTextColor(...colors.textMain);
      const words = Object.keys(metrics.fillerWordBreakdown).join(' · ');
      doc.text(words, 55, 192);
    } else {
      doc.setTextColor(...colors.textMuted);
      doc.text('Details unavailable', 55, 192);
    }

    // --- PAGE 2: FEEDBACK ---
    doc.addPage();
    drawHeader(doc);

    let currentY = 45;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textMain);
    doc.text('PERFORMANCE ANALYSIS', 20, currentY);
    currentY += 15;

    // What went well
    doc.setFontSize(12);
    doc.setTextColor(...colors.success);
    doc.text('What went well', 20, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textMain);
    const strengths = feedback.strengths || [];
    if (strengths.length > 0) {
      strengths.forEach(s => {
        const lines = doc.splitTextToSize(`• ${s}`, 165);
        doc.text(lines, 25, currentY);
        currentY += lines.length * 5 + 2;
      });
    } else {
      doc.setTextColor(...colors.textMuted);
      doc.text('No specific strengths recorded.', 25, currentY);
      currentY += 7;
    }

    currentY += 8;

    // What to improve
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.warning);
    doc.text('What to improve', 20, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textMain);
    const improvements = feedback.areasForImprovement || [];
    if (improvements.length > 0) {
      improvements.forEach(i => {
        const lines = doc.splitTextToSize(`• ${i}`, 165);
        doc.text(lines, 25, currentY);
        currentY += lines.length * 5 + 2;
      });
    } else {
      doc.setTextColor(...colors.textMuted);
      doc.text('No specific areas for improvement recorded.', 25, currentY);
      currentY += 7;
    }

    // --- PAGE 3+: QUESTION BY QUESTION ---
    if (questions.length > 0) {
      doc.addPage();
      drawHeader(doc);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMain);
      doc.text('QUESTION-BY-QUESTION REVIEW', 20, 45);

      let qY = 60;

      questions.forEach((q, index) => {
        // Check if we need a new page
        if (qY > 240) {
          doc.addPage();
          drawHeader(doc);
          qY = 45;
        }

        // Question Box
        doc.setFillColor(...colors.bgLight);
        doc.setDrawColor(...colors.border);

        // Helper to clean text of non-breaking spaces and newlines that break jsPDF
        const cleanText = (text) => (text || '').replace(/\s+/g, ' ').trim();

        // Calculate box height based on content
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const qLines = doc.splitTextToSize(`Q${index + 1}: ${cleanText(q.question)}`, 140);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const aLines = doc.splitTextToSize(`Answer: ${cleanText(q.answerText) || '[Skipped]'}`, 160);

        const fLines = q.feedback ? doc.splitTextToSize(`Evaluation: ${cleanText(q.feedback)}`, 160) : [];

        const boxHeight = 15 + (qLines.length * 5) + (aLines.length * 5) + (fLines.length > 0 ? 5 + (fLines.length * 5) : 0);

        // If box doesn't fit on this page, move to next
        if (qY + boxHeight > 280) {
          doc.addPage();
          drawHeader(doc);
          qY = 45;
        }

        doc.roundedRect(20, qY, 170, boxHeight, 3, 3, 'FD');

        // Question Text
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.textMain);
        doc.text(qLines, 25, qY + 8);

        // Score Badge
        if (q.score != null) {
          doc.setFontSize(10);
          doc.setTextColor(...colors.primary);
          doc.text(`Score: ${q.score}/100`, 185, qY + 8, { align: 'right' });
        }

        let currentLineY = qY + 10 + (qLines.length * 5);

        // Answer Text
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textMuted);
        doc.text(aLines, 25, currentLineY);
        currentLineY += (aLines.length * 5) + 2;

        // Feedback Text
        if (fLines.length > 0) {
          doc.setTextColor(...colors.textMain);
          doc.text(fLines, 25, currentLineY);
        }

        qY += boxHeight + 10;
      });
    }

    const safeRole = (report.jobRole || 'General').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const dateStr = new Date(report.createdAt).toISOString().split('T')[0];
    doc.save(`Intix_Interview_Report_${safeRole}_${dateStr}.pdf`);
  };

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Report not found"
        description={error}
        actionLabel="Back to History"
        onAction={() => navigate('/history')}
      />
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-32 w-32 rounded-full mx-auto mt-8" />
        </div>
        <Skeleton className="h-64 w-full mt-12" />
      </div>
    );
  }

  if (!report) return null;

  const metrics = report.sessionMetrics || {};
  const feedback = report.finalFeedback || {};

  // Prepare Radar Chart Data
  const radarData = [
    { subject: 'Answer Quality', A: metrics.averageAnswerScore || 0, fullMark: 100 },
    { subject: 'Confidence', A: metrics.averageConfidence || 0, fullMark: 100 },
    { subject: 'Eye Contact', A: metrics.averageEyeContact || 0, fullMark: 100 },
    { subject: 'Posture', A: metrics.averagePosture || 0, fullMark: 100 },
    { subject: 'Gestures', A: metrics.averageGesture || 0, fullMark: 100 },
  ];

  // Prepare Question Scores Data
  const questionScoresData = report.questionSummaries?.map((q, i) => ({
    name: `Q${i + 1}`,
    score: q.score != null ? q.score : 0,
  })) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Interviews
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadPDF}>
            Download PDF
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/interview')}>
            Practice Again
          </Button>
        </div>
      </div>

      {/* Header & Overall Score */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 mb-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Interview Completed
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-white mb-2">
            {report.jobRole || 'General Interview'}
          </h1>
          <p className="text-slate-400">
            {new Date(report.createdAt).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
          <div className="flex items-center justify-center md:justify-start gap-6 mt-6">
            <div>
              <div className="text-xl font-semibold text-white">{metrics.questionsAnswered || 0}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Answered</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-white">{metrics.questionsSkipped || 0}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Skipped</div>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center justify-center w-48 h-48 rounded-full border-8 border-slate-800 bg-slate-900 shadow-2xl shadow-primary-500/10 relative">
          <div className="text-5xl font-bold text-white tracking-tighter">
            {formatScore(metrics.overallScore)}
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-2">
            Overall Score
          </div>
          {/* Decorative ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#0ea5e9" strokeWidth="8" strokeDasharray={`${(metrics.overallScore || 0) * 2.89} 289`} strokeLinecap="round" />
          </svg>
        </div>
      </section>

      {/* Performance Breakdown & Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Performance Breakdown
          </h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  formatter={(value) => [`${value}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Question Scores
          </h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questionScoresData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  cursor={{ fill: '#1e293b' }}
                  formatter={(value) => [`${value}/100`, 'Score']}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {questionScoresData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Speech Analysis */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Speech Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Filler Words</div>
            <div className="text-3xl font-semibold text-white">
              {metrics.totalFillerWords != null ? metrics.totalFillerWords : 'N/A'}
            </div>
            {metrics.totalFillerWords === 0 && (
              <div className="text-sm text-emerald-500 mt-2">Excellent speech discipline.</div>
            )}
            {metrics.totalFillerWords == null && (
              <div className="text-sm text-slate-500 mt-2">Not available for this session.</div>
            )}
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Speech Pace</div>
            <div className="text-3xl font-semibold text-white">
              {metrics.averageWpm != null ? `${Math.round(metrics.averageWpm)} WPM` : 'N/A'}
            </div>
            {metrics.averageWpm == null && (
              <div className="text-sm text-slate-500 mt-2">Not available for this session.</div>
            )}
          </div>
        </div>
        {metrics.totalFillerWords > 0 && metrics.fillerWordBreakdown && Object.keys(metrics.fillerWordBreakdown).length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Detected Filler Words</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(metrics.fillerWordBreakdown).map(word => (
                <span key={word} className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-sm">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
        {metrics.totalFillerWords > 0 && (!metrics.fillerWordBreakdown || Object.keys(metrics.fillerWordBreakdown).length === 0) && (
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Detected Filler Words</div>
            <div className="text-sm text-slate-400">Details unavailable</div>
          </div>
        )}
      </section>

      {/* Feedback Summary */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/30 border border-emerald-500/20 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> What went well
          </h2>
          <ul className="space-y-3">
            {feedback.strengths?.length > 0 ? (
              feedback.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">No specific strengths recorded.</li>
            )}
          </ul>
        </div>
        <div className="bg-slate-900/30 border border-amber-500/20 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> What to improve
          </h2>
          <ul className="space-y-3">
            {feedback.areasForImprovement?.length > 0 ? (
              feedback.areasForImprovement.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">No specific areas for improvement recorded.</li>
            )}
          </ul>
        </div>
      </section>

      {/* Question Analysis */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Question-by-question analysis
        </h2>
        <div className="space-y-6">
          {report.questionSummaries?.map((q, index) => (
            <div key={q._id || index} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <h3 className="text-lg font-medium text-white leading-snug">
                  <span className="text-slate-500 mr-2">Q{index + 1}.</span>
                  {q.question}
                </h3>
                {q.score != null && (
                  <div className={`shrink-0 px-3 py-1 rounded-md border text-sm font-medium ${q.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    q.score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    Score: {q.score}/100
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Answer</div>
                  <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                    {q.userAnswer || <span className="italic text-slate-500">Skipped or no answer provided.</span>}
                  </p>
                </div>

                {q.feedback && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">AI Feedback</div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {q.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ReportPage;
