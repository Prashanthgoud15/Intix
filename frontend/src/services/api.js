import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Service
export const apiService = {
  // Generate interview question
  generateQuestion: async (jobRole = 'General', difficulty = 'medium', previousQuestions = [], sessionId = null) => {
    try {
      const response = await api.post('/api/generate-question', {
        job_role: jobRole,
        difficulty: difficulty,
        previous_questions: previousQuestions,
        session_id: sessionId,
      });
      return response.data;
    } catch (error) {
      console.error('Error generating question:', error);
      throw error;
    }
  },

  // Transcribe audio
  transcribeAudio: async (audioBase64, format = 'webm') => {
    try {
      const response = await api.post('/api/transcribe-audio', {
        audio_base64: audioBase64,
        format: format,
      });
      return response.data;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  },

  // Evaluate answer
  evaluateAnswer: async (question, answer, jobRole = 'General') => {
    try {
      const response = await api.post('/api/evaluate-answer', {
        question: question,
        answer: answer,
        job_role: jobRole,
      });
      return response.data;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      throw error;
    }
  },

  // Analyze video frame
  analyzeFrame: async (frameBase64, timestamp) => {
    try {
      const response = await api.post('/api/analyze-frame', {
        frame_base64: frameBase64,
        timestamp: timestamp,
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing frame:', error);
      throw error;
    }
  },

  // End session
  endSession: async (sessionData) => {
    try {
      const response = await api.post('/api/session/end', sessionData);
      return response.data;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  // Get session history
  getSessionHistory: async () => {
    try {
      const response = await api.get('/api/sessions/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  },
};

export default apiService;
