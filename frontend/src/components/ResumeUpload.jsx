import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const ResumeUpload = ({ onResumeAnalyzed, onSkip }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('http://localhost:8000/api/analyze-resume', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }

      const data = await response.json();
      console.log('Resume analyzed:', data);
      
      // Pass the analyzed data to parent
      onResumeAnalyzed(data);
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Your Resume
          </h2>
          <p className="text-gray-600">
            Get personalized interview questions based on your experience and skills
          </p>
        </div>

        {/* Upload Area */}
        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
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
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-400 mt-4">
              Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
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
            onClick={onSkip}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={isUploading}
          >
            Skip for Now
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Start Interview
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Pro Tip:</strong> Upload your resume to get tailored questions about your projects, 
            skills, and experience. The AI will ask progressively challenging questions from basic to advanced!
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResumeUpload;
