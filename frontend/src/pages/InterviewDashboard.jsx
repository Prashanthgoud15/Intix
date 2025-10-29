import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Play,
  Square,
  SkipForward,
  Home,
  Loader2,
  Eye,
  User,
  MessageSquare,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import apiService from '../services/api';
import { captureVideoFrame, blobToBase64, generateSessionId, formatDuration } from '../utils/helpers';
import ResumeUpload from '../components/ResumeUpload';

const InterviewDashboard = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const frameIntervalRef = useRef(null);

  // State management
  const [stream, setStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showResumeUpload, setShowResumeUpload] = useState(true);
  const [resumeSessionId, setResumeSessionId] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  
  // Session data
  const [sessionId] = useState(generateSessionId());
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  // Real-time metrics
  const [metrics, setMetrics] = useState({
    eyeContact: 0,
    posture: 0,
    confidence: 0,
    fillerWords: 0,
    speechPace: 0,
    gestureScore: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);

  const [frameMetrics, setFrameMetrics] = useState([]);
  const [transcriptions, setTranscriptions] = useState([]);

  // Initialize camera and microphone
  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Please grant camera and microphone permissions to continue.');
      }
    };

    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, []);

  // Session timer
  useEffect(() => {
    let interval;
    if (sessionStarted) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // Handle resume analyzed
  const handleResumeAnalyzed = (data) => {
    console.log('Resume analyzed:', data);
    setResumeSessionId(data.session_id);
    setCandidateProfile(data.profile);
    setShowResumeUpload(false);
    // Auto-start session after resume upload
    setTimeout(() => startSession(), 500);
  };

  // Handle skip resume
  const handleSkipResume = () => {
    setShowResumeUpload(false);
  };

  // Start session and load first question
  const startSession = async () => {
    setSessionStarted(true);
    await loadNextQuestion();
    startFrameAnalysis();
  };

  // Load next question
  const loadNextQuestion = async () => {
    setIsLoadingQuestion(true);
    try {
      const previousQuestions = questionHistory.map(q => q.question);
      console.log('Loading next question. Previous questions:', previousQuestions.length);
      console.log('Previous questions list:', previousQuestions);
      
      const response = await apiService.generateQuestion('General', 'medium', previousQuestions, resumeSessionId);
      console.log('New question received:', response);
      
      setCurrentQuestion(response);
      setQuestionHistory(prev => {
        const updated = [...prev, response];
        console.log('Question history updated, total questions:', updated.length);
        return updated;
      });
    } catch (error) {
      console.error('Error loading question:', error);
      console.error('Error details:', error.response?.data || error.message);
      setCurrentQuestion({
        question: 'Tell me about a challenging project you worked on recently.',
        category: 'Behavioral',
        difficulty: 'medium',
        tips: ['Use the STAR method', 'Be specific', 'Highlight your contributions']
      });
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Start recording answer
  const startRecording = () => {
    if (!stream) return;

    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await processRecording(audioBlob);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  // Stop recording answer
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process recorded answer
  const processRecording = async (audioBlob) => {
    try {
      console.log('Processing audio recording...', audioBlob.size, 'bytes');
      
      // Increment questions answered immediately
      setQuestionsAnswered(prev => {
        const newCount = prev + 1;
        console.log('Questions answered updated to:', newCount);
        return newCount;
      });
      
      const audioBase64 = await blobToBase64(audioBlob);
      console.log('Audio converted to base64, length:', audioBase64.length);
      
      const transcription = await apiService.transcribeAudio(audioBase64, 'webm');
      console.log('Transcription result:', transcription);
      
      setTranscriptions(prev => [...prev, transcription.text]);
      
      // Count filler words
      const fillerWordMatches = transcription.text.match(/\b(um|uh|like|you know|so|basically|actually)\b/gi) || [];
      const fillerWordCount = fillerWordMatches.length;
      console.log('Filler words detected:', fillerWordCount, fillerWordMatches);
      
      // Update metrics based on transcription
      setMetrics(prev => ({
        ...prev,
        speechPace: transcription.words_per_minute || 0,
        fillerWords: prev.fillerWords + fillerWordCount
      }));

      console.log(`Session stats - Questions: ${questionsAnswered + 1}, Filler words: ${fillerWordCount}, Speech pace: ${transcription.words_per_minute || 0} WPM`);
    } catch (error) {
      console.error('Error processing recording:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Still increment question count even if transcription fails
      setQuestionsAnswered(prev => prev + 1);
    }
  };

  // Start frame analysis
  const startFrameAnalysis = () => {
    console.log('Starting frame analysis...');
    setIsAnalyzing(true);
    
    // Function to analyze a single frame
    const analyzeFrame = async () => {
      if (videoRef.current) {
        try {
          const frameBase64 = captureVideoFrame(videoRef.current);
          
          if (!frameBase64) {
            console.warn('Failed to capture video frame');
            return;
          }
          
          const timestamp = sessionDuration;
          console.log(`Analyzing frame at ${timestamp}s...`);
          
          const analysis = await apiService.analyzeFrame(frameBase64, timestamp);
          console.log('Frame analysis result:', analysis);
          
          // Update real-time metrics
          setMetrics(prev => ({
            ...prev,
            eyeContact: Math.round(analysis.eye_contact.gaze_score * 100),
            posture: Math.round(analysis.posture.posture_score * 100),
            confidence: Math.round(analysis.overall_confidence),
            gestureScore: Math.round((1 - analysis.gestures.fidgeting_score) * 100)
          }));

          // Store frame metrics for final report
          setFrameMetrics(prev => [...prev, {
            eye_contact: analysis.eye_contact,
            posture: analysis.posture,
            gestures: analysis.gestures,
            expressions: analysis.expressions,
            timestamp: analysis.timestamp
          }]);
        } catch (error) {
          console.error('Error analyzing frame:', error);
          console.error('Error details:', error.response?.data || error.message);
        }
      }
    };
    
    // Analyze first frame immediately
    setTimeout(() => analyzeFrame(), 1000);
    
    // Then analyze every 3 seconds
    frameIntervalRef.current = setInterval(analyzeFrame, 3000);
  };

  // End session and navigate to report
  const endSession = async () => {
    console.log('Ending session...');
    console.log('Session data:', {
      sessionId,
      sessionDuration,
      questionsAnswered,
      frameMetricsCount: frameMetrics.length,
      transcriptionsCount: transcriptions.length
    });
    
    setIsEndingSession(true);
    setIsAnalyzing(false);
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (isRecording) {
      stopRecording();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      // Ensure we have at least some frame metrics
      if (frameMetrics.length === 0) {
        console.warn('No frame metrics collected, using default values');
        // Add a default frame metric to prevent backend errors
        frameMetrics.push({
          eye_contact: { is_looking_at_camera: true, gaze_score: 0.75, looking_away_duration: 0 },
          posture: { is_upright: true, posture_score: 0.7, slouch_detected: false, shoulder_alignment: 0.8 },
          gestures: { hand_detected: false, gesture_count: 0, fidgeting_score: 0.2, hand_positions: [] },
          expressions: { confidence_level: 0.7, smile_detected: false, expression_type: 'neutral', engagement_score: 0.7 },
          timestamp: 0
        });
      }

      const sessionData = {
        session_id: sessionId,
        total_duration: sessionDuration,
        frames_analyzed: frameMetrics.length,
        questions_answered: questionsAnswered,
        transcriptions: transcriptions,
        frame_metrics: frameMetrics
      };

      console.log('Sending session data to backend:', sessionData);
      const report = await apiService.endSession(sessionData);
      console.log('Report generated successfully:', report);
      
      // Navigate to report page with data
      navigate('/report', { state: { report } });
    } catch (error) {
      console.error('Error ending session:', error);
      console.error('Error details:', error.response?.data || error.message);
      setIsEndingSession(false);
      
      // Show more specific error message
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
      alert(`Error generating report: ${errorMsg}\n\nCheck console for details.`);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  // Next question
  const nextQuestion = async () => {
    if (isRecording) {
      stopRecording();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    await loadNextQuestion();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Home className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Interview Session</h1>
              <p className="text-slate-400 text-sm">
                Duration: {formatDuration(sessionDuration)} | Questions: {questionsAnswered}
              </p>
            </div>
          </div>
          
          {sessionStarted && (
            <button
              onClick={endSession}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              End Session
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Question */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Current Question
            </h2>
            
            {isLoadingQuestion ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
              </div>
            ) : currentQuestion ? (
              <div className="space-y-4">
                <p className="text-white font-medium leading-relaxed">
                  {currentQuestion.question}
                </p>
                
                <div className="pt-4 border-t border-white/20">
                  <p className="text-xs text-slate-400 mb-2">Tips:</p>
                  <ul className="space-y-1">
                    {currentQuestion.tips?.map((tip, index) => (
                      <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-primary-400">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded">
                    {currentQuestion.category}
                  </span>
                  <span className="px-2 py-1 bg-accent-500/20 text-accent-300 rounded">
                    {currentQuestion.difficulty}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400">Click "Start Interview" to begin</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-sm font-semibold mb-3 text-slate-300">Session Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Questions</span>
                <span className="font-semibold">{questionsAnswered}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Filler Words</span>
                <span className="font-semibold">{metrics.fillerWords}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Speech Pace</span>
                <span className="font-semibold">{metrics.speechPace.toFixed(0)} WPM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Video Feed */}
        <div className="lg:col-span-6 space-y-4">
          {/* Video Container */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Overlay Metrics */}
            {sessionStarted && (
              <div className="absolute top-4 left-4 right-4 flex justify-between">
                <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold">{metrics.eyeContact}%</span>
                </div>
                <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold">{metrics.posture}%</span>
                </div>
                {isAnalyzing && (
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                    <span className="text-xs">Analyzing</span>
                  </div>
                )}
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-red-600 px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm font-semibold">Recording</span>
                </div>
              </div>
            )}

            {/* Confidence Meter */}
            {sessionStarted && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-sm p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Confidence Score</span>
                    <span className="text-2xl font-bold">{metrics.confidence}%</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full confidence-gradient"
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics.confidence}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* No video overlay */}
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                <VideoOff className="w-16 h-16 text-slate-600" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-center gap-4">
              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              {/* Audio Toggle */}
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-colors ${
                  isAudioEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {/* Start/Stop Session */}
              {!sessionStarted ? (
                <button
                  onClick={startSession}
                  className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <Play className="w-5 h-5" />
                  Start Interview
                </button>
              ) : (
                <>
                  {/* Record Answer */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-8 py-4 rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105 ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-5 h-5" />
                        Stop Answer
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Record Answer
                      </>
                    )}
                  </button>

                  {/* Next Question */}
                  <button
                    onClick={nextQuestion}
                    disabled={isRecording}
                    className="p-4 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Real-time Metrics */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Live Metrics
            </h2>

            <div className="space-y-4">
              {/* Eye Contact */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Eye Contact</span>
                  <span className="text-sm font-bold">{metrics.eyeContact}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.eyeContact}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Posture */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Posture</span>
                  <span className="text-sm font-bold">{metrics.posture}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.posture}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Gestures */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Gestures</span>
                  <span className="text-sm font-bold">{metrics.gestureScore}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.gestureScore}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Overall Confidence */}
              <div className="pt-4 border-t border-white/20">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-200">Overall Confidence</span>
                  <span className="text-2xl font-bold text-primary-400">{metrics.confidence}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-primary-500/20 to-accent-500/20 backdrop-blur-md rounded-xl p-6 border border-primary-400/30">
            <h3 className="text-sm font-bold mb-3 text-primary-300">💡 Quick Tips</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-400">•</span>
                Maintain eye contact with the camera
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400">•</span>
                Sit up straight and avoid slouching
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400">•</span>
                Speak clearly at a moderate pace
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400">•</span>
                Minimize filler words (um, uh, like)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Resume Upload Modal */}
      <AnimatePresence>
        {showResumeUpload && (
          <ResumeUpload
            onResumeAnalyzed={handleResumeAnalyzed}
            onSkip={handleSkipResume}
          />
        )}
      </AnimatePresence>

      {/* Session Ending Modal */}
      <AnimatePresence>
        {isEndingSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-primary-500/20 shadow-2xl"
            >
              <div className="text-center">
                {/* Animated Loader */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary-400 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  Ending Session
                </h3>

                {/* Message */}
                <p className="text-slate-300 mb-2">
                  Please wait while we generate your report...
                </p>
                
                {/* Progress Steps */}
                <div className="mt-6 space-y-2 text-sm text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                    <span>Analyzing your performance</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-100" />
                    <span>Calculating metrics</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-200" />
                    <span>Generating insights</span>
                  </div>
                </div>

                {/* Info */}
                <p className="text-xs text-slate-500 mt-6">
                  This may take a few seconds...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewDashboard;
