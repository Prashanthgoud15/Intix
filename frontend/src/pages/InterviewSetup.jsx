import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Mic, Upload, FileText, CheckCircle, Loader2, AlertCircle, Briefcase, Settings2, Target, Play } from 'lucide-react';
import Button from '../components/ui/Button';
import apiService from '../services/api';

const JOB_ROLES = {
    "SOFTWARE & DEVELOPMENT": [
        "Frontend Developer", "Backend Developer", "Full Stack Developer",
        "Software Engineer", "Mobile App Developer", "Game Developer"
    ],
    "DATA & AI": [
        "Data Scientist", "Data Analyst", "Data Engineer",
        "Machine Learning Engineer", "AI Engineer"
    ],
    "CLOUD & INFRASTRUCTURE": [
        "DevOps Engineer", "Cloud Engineer", "Cloud Architect", "Solutions Architect"
    ],
    "SECURITY & QUALITY": [
        "Cybersecurity Engineer", "QA / Test Engineer"
    ],
    "PRODUCT & DESIGN": [
        "Product Manager", "UI/UX Designer", "Business Analyst"
    ],
    "OTHER": [
        "General"
    ]
};

const InterviewSetup = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);

    const [step, setStep] = useState(1); // 1: Config, 2: Hardware Check

    // Config State
    const [selectedRole, setSelectedRole] = useState('General');
    const [difficulty, setDifficulty] = useState('Medium');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [error, setError] = useState(null);
    const [resumeSessionId, setResumeSessionId] = useState(null);

    // Hardware State
    const [cameraReady, setCameraReady] = useState(false);
    const [micReady, setMicReady] = useState(false);
    const [hardwareError, setHardwareError] = useState(null);
    const [stream, setStream] = useState(null);

    // Handle File Upload
    const handleFile = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        if (selectedFile.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }
        setFile(selectedFile);
        setError(null);
    };

    const handleContinueToHardware = async () => {
        if (file) {
            setIsUploading(true);
            setUploadStatus('Analyzing Resume...');
            try {
                const response = await apiService.analyzeResume(file, selectedRole);
                // analyzeResume returns the profile directly, its ID is _id
                setResumeSessionId(response._id);
                setStep(2);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to process resume');
            } finally {
                setIsUploading(false);
            }
        } else {
            setStep(2);
        }
    };

    // Hardware Check
    useEffect(() => {
        if (step === 2) {
            const initMedia = async () => {
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                    setCameraReady(true);
                    setMicReady(true);
                } catch (err) {
                    console.error("Media access error:", err);
                    setHardwareError("Could not access camera or microphone. Please check permissions.");
                }
            };
            initMedia();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [step]);

    const handleStartInterview = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        // Navigate to dashboard with state
        navigate('/interview', {
            state: {
                role: selectedRole,
                difficulty,
                resumeSessionId
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
            <div className="max-w-3xl w-full">

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Interview Setup</h1>
                    <p className="text-slate-400">Configure your session and check your equipment.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    {step === 1 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

                            {/* Role Selection */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                                    <Briefcase className="w-4 h-4 text-primary-500" /> Target Role
                                </label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                                >
                                    {Object.entries(JOB_ROLES).map(([category, roles]) => (
                                        <optgroup key={category} label={category}>
                                            {roles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                                    <Target className="w-4 h-4 text-primary-500" /> Difficulty
                                </label>
                                <div className="flex gap-4">
                                    {['Easy', 'Medium', 'Hard'].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setDifficulty(level)}
                                            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${difficulty === level
                                                ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Resume Upload */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                                    <FileText className="w-4 h-4 text-primary-500" /> Resume (Optional)
                                </label>
                                <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-950/50 hover:bg-slate-950 transition-colors relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFile}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                                            <p className="text-slate-200 font-medium">{file.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">Click to change file</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-8 h-8 text-slate-600 mb-3" />
                                            <p className="text-slate-300 font-medium mb-1">Upload your resume</p>
                                            <p className="text-xs text-slate-500">PDF up to 5MB. Used to personalize questions.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <Button
                                    onClick={handleContinueToHardware}
                                    disabled={isUploading}
                                    className="w-full sm:w-auto px-8"
                                >
                                    {isUploading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> {uploadStatus}
                                        </span>
                                    ) : (
                                        'Continue to Hardware Check'
                                    )}
                                </Button>
                            </div>

                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Video Preview */}
                                <div className="space-y-4">
                                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative">
                                        {stream ? (
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover transform scale-x-[-1]"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Checks */}
                                <div className="flex flex-col justify-center space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${cameraReady ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                                    <Video className="w-5 h-5" />
                                                </div>
                                                <span className="font-medium text-slate-200">Camera</span>
                                            </div>
                                            {cameraReady ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />}
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${micReady ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                                    <Mic className="w-5 h-5" />
                                                </div>
                                                <span className="font-medium text-slate-200">Microphone</span>
                                            </div>
                                            {micReady ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />}
                                        </div>
                                    </div>

                                    {hardwareError && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <p>{hardwareError}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 flex items-center justify-between border-t border-slate-800">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                >
                                    Back to Settings
                                </button>
                                <Button
                                    onClick={handleStartInterview}
                                    disabled={!cameraReady || !micReady}
                                    icon={Play}
                                    className="px-8"
                                >
                                    Start Interview
                                </Button>
                            </div>

                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterviewSetup;
