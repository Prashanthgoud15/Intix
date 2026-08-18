import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, Loader2, AlertCircle, Briefcase } from 'lucide-react';
import apiService from '../services/api';

const JOB_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Data Scientist",
  "DevOps Engineer",
  "Mobile Developer",
  "Product Manager",
  "UI/UX Designer",
  "QA Engineer",
  "Data Engineer",
  "ML Engineer",
  "Cloud Architect",
  "General"
];

const ResumeUpload = ({ onResumeAnalyzed, onSkip }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  // Progressive status message during upload — this can legitimately take
  // up to ~90s server-side now (it tries a fallback AI model if the first
  // is slow, rather than failing fast), so a single static "Analyzing..."
  // with no further feedback made it look frozen. This just reassures the
  // person it's still genuinely working, not stuck.
  const [uploadStatus, setUploadStatus] = useState('Analyzing Resume...');

  useEffect(() => {
    if (!isUploading) {
      setUploadStatus('Analyzing Resume...');
      return;
    }
    const timers = [
      setTimeout(() => setUploadStatus('Reading your projects and skills...'), 8000),
      setTimeout(() => setUploadStatus('Still working — building your personalized questions...'), 25000),
      setTimeout(() => setUploadStatus('Almost there, this resume is taking a bit longer than usual...'), 50000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isUploading]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    // PDF only, matching the backend exactly. This previously claimed to
    // accept DOC/DOCX/TXT too, but the backend only ever supported PDF —
    // and even its "text/plain" allowance was silently broken, since the
    // extraction step uses pdf-parse, which can't process a raw text file.
    // Standardizing both sides to PDF-only (rather than half-implementing
    // DOC/DOCX parsing) avoids advertising support that doesn't actually work.
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file. Other formats are not supported.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedRole) {
      setError('Please select a job role to get role-specific questions');
      return;
    }

    // No resume uploaded: start role-based interview directly.
    if (!file) {
      handleSkip();
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('job_role', selectedRole);

      const profile = await apiService.analyzeResume(file, selectedRole);
      console.log('Resume analyzed:', profile);

      // profile is the saved ResumeProfile document — its _id is what links
      // this resume's generated interview plan to the interview session.
      onResumeAnalyzed({
        session_id: profile._id,
        profile,
        job_role: selectedRole,
      });
    } catch (err) {
      console.error('Error uploading resume:', err);
      // Surface the backend's actual message when available — it's now a
      // specific, actionable message (e.g. "AI service issue, try again or
      // skip resume upload"), not just a generic string. Only fall back to
      // a generic message for failures that never reached the backend at
      // all (e.g. a network timeout with no response).
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    if (!selectedRole) {
      setError('Please select a job role before starting');
      return;
    }
    onSkip(selectedRole);
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Setup
          </h2>
          <p className="text-gray-600">
            Select your target role and upload your resume for personalized questions
          </p>
        </div>

        {/* Job Role Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary-500" />
            Target Job Role <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedRole}
            onChange={(e) => { setSelectedRole(e.target.value); setError(null); }}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all text-base font-medium appearance-none cursor-pointer"
          >
            <option value="" disabled>Choose your target role...</option>
            {JOB_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          {selectedRole && (
            <p className="mt-2 text-sm text-primary-600">
              ✅ Questions will be tailored for <strong>{selectedRole}</strong> interviews
            </p>
          )}
        </div>

        {/* Upload Area */}
        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag and drop your resume here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 cursor-pointer transition-colors">
              <Upload className="w-5 h-5" />
              Browse Files
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-400 mt-4">
              Supported format: PDF only (Max 5MB)
            </p>
          </div>
        ) : (
          <div className="border-2 border-green-200 bg-green-50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                disabled={isUploading}
              >
                <X className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleSkip}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={isUploading}
          >
            Skip Resume
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedRole}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadStatus}
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {file ? 'Analyze & Start' : 'Start Without Resume'}
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>🎯 How it works:</strong> Your interview will follow a real structure — 
            starting with warm-up questions, then role-specific technical, HR behavioral, 
            resume deep-dive, coding challenges, and a closing question. Just like a real interview!
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResumeUpload;
