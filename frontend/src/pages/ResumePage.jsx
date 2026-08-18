import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeService } from '../services/api';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { FileText, Upload, AlertCircle, CheckCircle2, FileUp } from 'lucide-react';

const ResumePage = () => {
    const navigate = useNavigate();
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    const loadResumes = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await resumeService.getMyResumes();
            setResumes(data || []);
        } catch (err) {
            console.error('Error loading resumes:', err);
            setError('Unable to load your resume data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResumes();
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file.');
            return;
        }

        setUploading(true);
        try {
            await resumeService.analyzeResume(file);
            await loadResumes(); // Reload to get the new resume
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload resume. Please try again.');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    if (error) {
        return (
            <EmptyState
                icon={AlertCircle}
                title="Unable to load resume"
                description={error}
                actionLabel="Retry"
                onAction={loadResumes}
            />
        );
    }

    const latestResume = resumes.length > 0 ? resumes[0] : null;

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-semibold text-white mb-1">Your Resume</h1>
                <p className="text-slate-400 text-sm">Manage your resume for personalized interview preparation.</p>
            </div>

            {loading ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <Skeleton className="h-4 w-full max-w-md mb-8" />
                    <Skeleton className="h-12 w-32" />
                </div>
            ) : !latestResume ? (
                <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileUp className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-medium text-white mb-2">Upload a PDF resume</h2>
                    <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                        We use your resume to generate personalized, highly relevant interview questions tailored to your experience.
                    </p>

                    <div className="relative inline-block">
                        <Button variant="primary" icon={Upload} disabled={uploading}>
                            {uploading ? 'Uploading & Analyzing...' : 'Upload Resume'}
                        </Button>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                                    <FileText className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-medium text-white">Active Resume</h2>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        Updated {new Date(latestResume.createdAt).toLocaleDateString('en-US', {
                                            month: 'long', day: 'numeric', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="relative">
                                <Button variant="outline" size="sm" disabled={uploading}>
                                    {uploading ? 'Replacing...' : 'Replace Resume'}
                                </Button>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-950/50 rounded-lg p-6 border border-slate-800/50">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                Extracted Profile
                            </h3>
                            <div className="space-y-4">
                                {latestResume.skills && latestResume.skills.length > 0 && (
                                    <div>
                                        <div className="text-xs text-slate-500 mb-2">Key Skills</div>
                                        <div className="flex flex-wrap gap-2">
                                            {latestResume.skills.slice(0, 10).map((skill, i) => (
                                                <span key={i} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs font-medium border border-slate-700">
                                                    {skill}
                                                </span>
                                            ))}
                                            {latestResume.skills.length > 10 && (
                                                <span className="px-2.5 py-1 bg-slate-800/50 text-slate-500 rounded text-xs font-medium border border-slate-700/50">
                                                    +{latestResume.skills.length - 10} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {latestResume.experience && latestResume.experience.length > 0 && (
                                    <div>
                                        <div className="text-xs text-slate-500 mb-2">Recent Experience</div>
                                        <ul className="space-y-2">
                                            {latestResume.experience.slice(0, 2).map((exp, i) => (
                                                <li key={i} className="text-sm text-slate-300">
                                                    <span className="font-medium text-slate-200">{exp.role || exp.title}</span>
                                                    {exp.company && <span className="text-slate-500"> at {exp.company}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button variant="primary" onClick={() => navigate('/interview/setup')}>
                            Start Interview with this Resume
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumePage;
