import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import apiService from '../services/api';
import { generateSessionId, formatDuration } from '../utils/helpers';
import useClientCV from '../hooks/useClientCV';

const InterviewDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  // Holds the in-flight promise for the audio-processing pipeline
  // (transcription -> evaluation -> persistence) for the CURRENT recording,
  // or null when nothing is in flight. endSession awaits this instead of
  // guessing with a fixed setTimeout — real evaluation can legitimately take
  // 10-20+ seconds (Groq call + retry), and a fixed 1s delay was nowhere
  // close to enough, risking the last answer being lost or the session
  // finalizing on an incomplete state if the user ended right after
  // recording.
  const processingPromiseRef = useRef(null);
  const audioChunksRef = useRef([]);
  // eslint-disable-next-line no-unused-vars
  const frameIntervalRef = useRef(null);


  // State management
  const [stream, setStream] = useState(null);
  // Mirrors `stream` but as a ref — needed because the camera-init effect's
  // cleanup function (below) is a closure created on first render, when
  // `stream` was still null (setStream(mediaStream) only happens later,
  // after the async getUserMedia() call resolves). That cleanup closure can
  // never see the real stream through the `stream` state variable — it's
  // permanently frozen at "null" no matter what actually happens
  // afterward. This is especially damaging under React StrictMode (enabled
  // in main.jsx), which deliberately mounts -> unmounts -> re-mounts once
  // in development specifically to surface bugs exactly like this one: the
  // first stream leaks completely uncleaned, and only the second
  // (re-mounted) stream ever gets properly tracked and stopped — meaning
  // the camera can stay on even after the interview correctly "ends" from
  // the app's own point of view. A ref sidesteps this because .current is
  // always read fresh at cleanup time, not captured by value.
  const streamRef = useRef(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Read state from InterviewSetup
  const setupState = location.state || {};
  // eslint-disable-next-line no-unused-vars
  const [resumeSessionId, setResumeSessionId] = useState(setupState.resumeSessionId || null);
  // eslint-disable-next-line no-unused-vars
  const [selectedRole, setSelectedRole] = useState(setupState.role || 'General');
  // eslint-disable-next-line no-unused-vars
  const [difficulty, setDifficulty] = useState(setupState.difficulty || 'Medium');
  // eslint-disable-next-line no-unused-vars
  const [candidateProfile, setCandidateProfile] = useState(null);

  // Session data
  const [sessionId] = useState(generateSessionId());
  const [interviewId, setInterviewId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [questionHistory, setQuestionHistory] = useState([]);

  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [questionLoadError, setQuestionLoadError] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  // Real-time metrics
  const [isEndingSession, setIsEndingSession] = useState(false);



  // eslint-disable-next-line no-unused-vars
  const [transcriptions, setTranscriptions] = useState([]);

  // Phase 9: Advanced Analytics & Strict Flow Enforcement
  // eslint-disable-next-line no-unused-vars
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [answerDuration, setAnswerDuration] = useState(0);
  const [showPacingNudge, setShowPacingNudge] = useState(false);

  // Use the new client-side CV hook
  const { metrics, frameMetrics, frameMetricsRef, resetFrameMetrics } = useClientCV(videoRef, isRecording);

  // Initialize camera and microphone
  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        streamRef.current = mediaStream;
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
      // Reads streamRef.current fresh at cleanup time (not a captured
      // closure value) — this is what actually stops the real stream
      // regardless of when cleanup fires or how many times this effect's
      // setup ran, fixing the StrictMode double-mount leak described above.
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Session timer
  useEffect(() => {
    let interval;
    if (sessionStarted && !isEndingSession) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted, isEndingSession]);

  // Answer duration timer (Pacing Nudges)
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setAnswerDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration === 120) { // 2 minutes
            setShowPacingNudge(true);
          }
          return newDuration;
        });
      }, 1000);
    } else {
      setAnswerDuration(0);
      setShowPacingNudge(false);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Question Auto-Skip Timer
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null);

  useEffect(() => {
    if (currentQuestion && !isEndingSession) {
      const isAdvanced = currentQuestion.difficulty === 'hard' || currentQuestion.difficulty === 'expert' || currentQuestion.phase === 'advanced_technical';
      setQuestionTimeLeft(isAdvanced ? 240 : 120); // 4 mins or 2 mins
    }
  }, [currentQuestion, isEndingSession]);

  useEffect(() => {
    let interval;
    if (questionTimeLeft !== null && questionTimeLeft > 0 && !isEndingSession) {
      interval = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSkip();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionTimeLeft, isEndingSession, isRecording]);

  const [isSkipping, setIsSkipping] = useState(false);
  const [skipError, setSkipError] = useState(null);

  const handleAutoSkip = async () => {
    console.log("Time's up! Auto-skipping question.");
    if (isRecording) {
      stopRecording();
      // processRecording will be triggered by onstop and will load the next question
    } else {
      await skipCurrentQuestion();
    }
  };

  const skipCurrentQuestion = async () => {
    // Guard against a retry-storm: if a skip is already in flight for this
    // question (auto-skip timer + a manual click, or the timer firing twice
    // in edge cases), don't fire a second identical request — this was
    // previously generating dozens of duplicate skip calls per question when
    // the first one failed (e.g. an auth hiccup), which just made recovery
    // harder and flooded the console/network tab.
    if (isSkipping) return;
    setIsSkipping(true);
    setSkipError(null);
    try {
      console.log('Skipping question:', currentQuestion._id);
      // A skip has no real answer — do not attach accumulated CV frames to it,
      // otherwise a skipped question can still show eye-contact/posture scores
      // inherited from earlier questions in the session.
      await apiService.submitAnswer(
        interviewId,
        currentQuestion._id,
        '[SKIPPED]',
        null,
        [],
        0
      );
      setQuestionsAnswered(prev => prev + 1);
      await loadNextQuestion();
    } catch (err) {
      console.error("Error skipping question:", err);
      // Surface this instead of failing silently — a silent failure left the
      // UI looking "stuck" on the same question with no explanation, which
      // is what led to repeated manual skip-button mashing in testing.
      setSkipError('Could not skip this question — please check your connection and try again.');
    } finally {
      resetFrameMetrics();
      setIsSkipping(false);
    }
  };

  // Tab-switch detection (Page Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && sessionStarted && !isEndingSession) {
        setTabSwitches(prev => prev + 1);
        setShowTabWarning(true);
        setTimeout(() => setShowTabWarning(false), 5000);
        console.warn('Tab switch detected during active interview session.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionStarted, isEndingSession]);

  // Start session and load first question
  const startSession = async () => {
    setSessionStarted(true);
    resetFrameMetrics();
    await loadNextQuestion();
  };

  // Load next question
  const loadNextQuestion = async () => {
    setIsLoadingQuestion(true);
    setQuestionLoadError(null);
    try {
      let currentInterviewId = interviewId;

      // Start interview if we don't have one
      if (!currentInterviewId) {
        const profileId = resumeSessionId;
        console.log(`Starting new interview for role: ${selectedRole} with profile: ${profileId}`);
        const interview = await apiService.startInterview(selectedRole, difficulty.toLowerCase(), profileId);
        currentInterviewId = interview._id;
        setInterviewId(currentInterviewId);
      }

      console.log('Fetching next question for interview:', currentInterviewId);
      const response = await apiService.getNextQuestion(currentInterviewId);

      if (response.completed) {
        console.log('Interview completed naturally');
        endSession();
        return;
      }

      console.log('New question received:', response.question);
      setCurrentQuestion(response.question);
    } catch (error) {
      console.error('Error loading question:', error);
      console.error('Error details:', error.response?.data || error.message);
      // CHANGED: this used to silently fabricate a hardcoded fake question
      // here ("Tell me about a challenging project...") with no real
      // backend _id. If the user then answered it, submitAnswer would send
      // `undefined` as the question_id — the backend can't match that to
      // any real question, cascading into a corrupted interview flow. A
      // failure here must be visible and recoverable, not papered over with
      // fake content — currentQuestion is deliberately left untouched
      // (still null, or still whatever the last REAL question was) and the
      // UI shows a real error with a Retry button instead.
      setQuestionLoadError(
        error.response?.data?.message || 'Could not load the next question. Please check your connection and try again.'
      );
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
      // Track the in-flight processing promise so endSession can actually
      // wait for it to finish (transcription + evaluation + persistence),
      // instead of guessing with a fixed delay. This is what
      // processingPromiseRef exists for — see the comment on endSession.
      processingPromiseRef.current = processRecording(audioBlob);
      await processingPromiseRef.current;
      processingPromiseRef.current = null;
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
    setIsProcessingAnswer(true);
    try {
      console.log('Processing audio recording...', audioBlob.size, 'bytes');

      // Submit answer to backend
      // IMPORTANT: read frameMetricsRef.current here, NOT the `frameMetrics`
      // state variable. This function is called from MediaRecorder's onstop
      // handler, which was bound back when recording STARTED — the
      // `frameMetrics` closure it captured is frozen at that moment (almost
      // always empty, since it was just reset for this question). The ref
      // always reflects the truly current, fully-accumulated frame data
      // collected during the whole answer. This was the root cause of
      // eye-contact/posture/gesture/confidence showing N/A or an
      // inconsistent small number in the report even though the live
      // on-screen widget looked correct the whole time.
      const result = await apiService.submitAnswer(
        interviewId,
        currentQuestion._id,
        null, // textAnswer is null for audio
        audioBlob,
        frameMetricsRef.current,
        answerDuration || 60
      );

      console.log('Answer evaluated:', result);

      // Only increment AFTER the backend confirms the answer was actually
      // saved. Previously this incremented immediately at the start of this
      // function, before the network call even began — if submitAnswer then
      // failed, the count was already wrong (overcounted) with no way to
      // tell from the UI that the answer hadn't actually been persisted.
      setQuestionsAnswered(prev => {
        const newCount = prev + 1;
        console.log('Questions answered updated to:', newCount);
        return newCount;
      });

      // Update metrics from backend response
      if (result && result.metrics) {
        const wpm = result.metrics.wordsPerMinute || 0;
        const fillerCount = result.metrics.fillerWordCount || 0;
        console.log(`Session stats - WPM: ${wpm}, Filler words: ${fillerCount}`);
      }

      // Automatically load the next question after a successful answer
      await loadNextQuestion();
    } catch (error) {
      console.error('Error processing recording:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      // Clear CV frame buffer so the NEXT question starts with a clean window.
      // Without this, every answer's eye-contact/posture score is diluted by
      // (or entirely inherited from) frames captured during earlier questions.
      resetFrameMetrics();
      setIsProcessingAnswer(false);
    }
  };

  // Start frame analysis (Now handled by useClientCV hook)

  // Stop camera and microphone
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  /**
   * Waits for any in-flight recording processing (stop -> transcribe ->
   * evaluate -> persist) to actually finish, rather than guessing with a
   * fixed delay. MediaRecorder's stop() -> onstop is itself asynchronous but
   * fires quickly (a browser tick or two), so this briefly polls for
   * processingPromiseRef to be populated, then awaits the REAL promise for
   * however long the pipeline actually takes.
   */
  const waitForRecordingToFinish = async () => {
    for (let i = 0; i < 20 && !processingPromiseRef.current; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (processingPromiseRef.current) {
      await processingPromiseRef.current;
    }
  };

  // End session and navigate to report
  const endSession = async () => {
    console.log('Ending session...');

    setIsEndingSession(true);

    // Stop recording if active, and ACTUALLY WAIT for the full pipeline
    // (transcription -> evaluation -> persistence) to complete — not a fixed
    // 1s guess. Real evaluation can legitimately take 10-20+ seconds (Groq
    // call with retry), so the old fixed delay risked finalizing the
    // interview before the last answer was actually saved, silently losing
    // it or leaving the session in an incomplete state.
    if (isRecording) {
      stopRecording();
      await waitForRecordingToFinish();
    }

    // ✅ STOP CAMERA immediately
    stopCamera();

    try {
      // Send actual frame metrics — do NOT inject fake data
      const targetId = interviewId || resumeSessionId || sessionId;
      const sessionData = {
        interview_id: targetId,
        session_id: resumeSessionId || sessionId,
        total_duration: sessionDuration,
        frames_analyzed: frameMetrics.length,
        questions_answered: questionsAnswered,
        frame_metrics: frameMetrics
      };

      console.log('Sending session data to backend:', {
        ...sessionData,
        frame_metrics: `${frameMetrics.length} frames`
      });

      const report = await apiService.endSession(sessionData);
      console.log('Report generated successfully:', report);

      // Navigate to the report's real URL (not just in-memory state) — this
      // is what makes a browser refresh on the report page actually work,
      // and what makes the report linkable/shareable at all.
      navigate(`/report/${report._id}`, { state: { report } });
    } catch (error) {
      console.error('Error ending session:', error);
      setIsEndingSession(false);

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
      // processRecording will be triggered by onstop and will load the next question
    } else {
      // If they click next without recording, it's a skip
      await skipCurrentQuestion();
    }
  };

  return (
    <div className="relative overflow-hidden pb-12">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Tab Switch Warning */}
      <AnimatePresence>
        {showTabWarning && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-red-500"
          >
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-bold">Warning: Tab Switch Detected</p>
              <p className="text-sm text-red-100">Please keep the interview tab active.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip/Answer Submission Error */}
      <AnimatePresence>
        {skipError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-red-500"
          >
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold">{skipError}</p>
            </div>
            <button
              onClick={() => skipCurrentQuestion()}
              disabled={isSkipping}
              className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm font-semibold disabled:opacity-50"
            >
              {isSkipping ? 'Retrying…' : 'Retry'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pacing Nudge */}
      <AnimatePresence>
        {showPacingNudge && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-slate-950 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-yellow-400"
          >
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-bold">Pacing Suggestion</p>
              <p className="text-sm text-yellow-900">You&apos;ve been speaking for over 2 minutes. Try to wrap up your answer.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
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
                  {questionTimeLeft !== null && (
                    <span className={`ml-4 font-mono ${questionTimeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
                      Time left: {formatDuration(questionTimeLeft)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {sessionStarted && (
              <button
                onClick={endSession}
                disabled={isProcessingAnswer}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                End Session
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Panel - Question */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Current Question
            </h2>

            {isLoadingQuestion ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
              </div>
            ) : questionLoadError ? (
              <div className="space-y-4 py-4">
                <div className="flex items-start gap-2 text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{questionLoadError}</p>
                </div>
                <button
                  onClick={() => loadNextQuestion()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
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

                <div className="flex flex-wrap gap-2 text-xs">
                  {currentQuestion.phase && (
                    <span className={`px-2 py-1 rounded font-semibold ${currentQuestion.phase === 'warm_up' ? 'bg-green-500/20 text-green-300' :
                      currentQuestion.phase === 'role_technical' ? 'bg-blue-500/20 text-blue-300' :
                        currentQuestion.phase === 'hr_behavioral' ? 'bg-yellow-500/20 text-yellow-300' :
                          currentQuestion.phase === 'resume_deep_dive' ? 'bg-purple-500/20 text-purple-300' :
                            currentQuestion.phase === 'coding_aptitude' ? 'bg-red-500/20 text-red-300' :
                              currentQuestion.phase === 'advanced_technical' ? 'bg-orange-500/20 text-orange-300' :
                                currentQuestion.phase === 'closing_hr' ? 'bg-teal-500/20 text-teal-300' :
                                  'bg-slate-500/20 text-slate-300'
                      }`}>
                      {currentQuestion.phase === 'warm_up' ? '🟢 Warm-up' :
                        currentQuestion.phase === 'role_technical' ? '🔵 Technical' :
                          currentQuestion.phase === 'hr_behavioral' ? '🟡 HR' :
                            currentQuestion.phase === 'resume_deep_dive' ? '🟣 Resume' :
                              currentQuestion.phase === 'coding_aptitude' ? '🔴 Coding' :
                                currentQuestion.phase === 'advanced_technical' ? '🟠 Advanced' :
                                  currentQuestion.phase === 'closing_hr' ? '🔵 Closing' :
                                    currentQuestion.category}
                    </span>
                  )}
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
                <p className="text-slate-400">Click &quot;Start Interview&quot; to begin</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h3 className="text-sm font-semibold mb-3 text-slate-300">Session Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Questions</span>
                <span className="font-semibold">{questionsAnswered}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Filler Words</span>
                <span className="font-semibold">Analyzed post-session</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Speech Pace</span>
                <span className="font-semibold">Analyzed post-session</span>
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
                <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-lg flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold">{metrics ? `${metrics.eyeContact}%` : '--'}</span>
                </div>
                <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-lg flex items-center gap-2">
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold">{metrics ? `${metrics.posture}%` : '--'}</span>
                </div>
                <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold">{metrics ? `${metrics.gestureScore}%` : '--'}</span>
                </div>
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
                <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Confidence Score</span>
                    <span className="text-2xl font-bold">{metrics ? `${metrics.confidence}%` : '--'}</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full confidence-gradient"
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics ? metrics.confidence : 0}%` }}
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
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-center gap-4">
              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${isVideoEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              {/* Audio Toggle */}
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-colors ${isAudioEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {/* Start/Stop Session */}
              {!sessionStarted ? (
                <button
                  onClick={startSession}
                  className="px-8 py-4 bg-primary-600 hover:bg-primary-500 rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <Play className="w-5 h-5" />
                  Start Interview
                </button>
              ) : (
                <>
                  {/* Record Answer */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!currentQuestion || isProcessingAnswer}
                    className={`px-8 py-4 rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${isRecording
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
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
                    disabled={isRecording || isSkipping || !currentQuestion || isProcessingAnswer}
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
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Live Metrics
            </h2>

            <div className="space-y-4">
              {/* Eye Contact */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Eye Contact</span>
                  <span className="text-sm font-bold">{metrics ? `${metrics.eyeContact}%` : '--'}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics ? metrics.eyeContact : 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Posture */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Posture</span>
                  <span className="text-sm font-bold">{metrics ? `${metrics.posture}%` : '--'}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics ? metrics.posture : 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Movement Control */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">Movement Control</span>
                  <span className="text-sm font-bold">{metrics ? `${metrics.gestureScore}%` : '--'}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics ? metrics.gestureScore : 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Overall Confidence */}
              <div className="pt-4 border-t border-white/20">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-200">Overall Confidence</span>
                  <span className="text-2xl font-bold text-primary-400">{metrics ? `${metrics.confidence}%` : '--'}</span>
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
