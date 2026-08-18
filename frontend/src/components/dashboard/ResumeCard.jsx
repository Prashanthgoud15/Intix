import { useNavigate } from 'react-router-dom';
import { FileText, Upload, CheckCircle2 } from 'lucide-react';

const ResumeCard = ({ resumes, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-slate-700 rounded w-full"></div>
            </div>
        );
    }

    const latestResume = resumes && resumes.length > 0 ? resumes[0] : null;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-emerald-400" />
                Resume Profile
            </h2>

            {latestResume ? (
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium text-white">Resume Active</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">
                            Last updated: {new Date(latestResume.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/interview')}
                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white rounded-lg transition-colors border border-slate-600"
                    >
                        Update Resume
                    </button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-between">
                    <p className="text-sm text-slate-400 mb-4">
                        Upload your resume to enable personalized interview preparation.
                    </p>
                    <button
                        onClick={() => navigate('/interview')}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-medium rounded-lg transition-colors border border-emerald-500/30"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Resume
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResumeCard;
