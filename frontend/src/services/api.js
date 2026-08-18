import axios from 'axios';

// ─── Base Configuration ───────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 60000;

// Token storage helpers (localStorage)
const getAccessToken = () => localStorage.getItem('intix_access_token');
const getRefreshToken = () => localStorage.getItem('intix_refresh_token');
const setTokens = (access, refresh) => {
  localStorage.setItem('intix_access_token', access);
  if (refresh) localStorage.setItem('intix_refresh_token', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('intix_access_token');
  localStorage.removeItem('intix_refresh_token');
};

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT automatically
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (import.meta.env.VITE_DEBUG) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh expired access tokens
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.VITE_DEBUG) {
      console.log(`[API] ←`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we have a refresh token — try to re-auth
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refresh = getRefreshToken();
      if (refresh) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: refresh });
          // BUG FIX: this was reading `data.data.accessToken`, but the
          // actual response shape (see ApiResponse.js + auth.controller.js's
          // refresh handler) nests tokens one level deeper as
          // `data.data.tokens.accessToken`. The old path was always
          // `undefined` — meaning every single refresh stored the literal
          // string "undefined" as the access token, which then made the
          // retried request fail immediately with an "Invalid token" error
          // (not "expired" — a malformed token fails differently). This is
          // almost certainly the real root cause of a 401 retry-storm
          // pattern seen in earlier testing that was only partially
          // mitigated before (by reducing how often refresh triggers at
          // all), never actually fixed at the source until now.
          const newAccessToken = data.data.tokens.accessToken;
          const newRefreshToken = data.data.tokens.refreshToken;
          // Also store the rotated refresh token instead of discarding it —
          // previously always kept the old one via `setTokens(token, null)`.
          setTokens(newAccessToken, newRefreshToken);
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearTokens();
          window.dispatchEvent(new Event('auth:logout'));
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    // User-friendly error messages
    if (error.response?.status === 429) {
      error.message = 'Too many requests. Please try again later.';
    } else if (error.response?.status === 500) {
      error.message = 'Server error. Please try again or contact support.';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please check your connection.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your internet connection.';
    }

    return Promise.reject(error);
  }
);

// ─── Auth Services ────────────────────────────────────────────────────────────
export const authService = {
  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
    return data.data.user;
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
    return data.data.user;
  },

  logout: async () => {
    // Best-effort: call the backend so the session is actually invalidated
    // server-side (see authService.logout / User.tokenVersion on the
    // backend) — but don't let a network failure block local logout. The
    // user should always be able to clear their own session locally even
    // if the backend call fails for some reason.
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout call failed (continuing with local logout):', err.message);
    }
    clearTokens();
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  },

  isLoggedIn: () => !!getAccessToken(),
};

// ─── AI Services (Legacy - Removed) ──────────────────────────────────────────

// ─── Resume Services ──────────────────────────────────────────────────────────
export const resumeService = {
  analyzeResume: async (file, jobRole = 'General') => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_role', jobRole);
    // Generous timeout: this single request does PDF extraction + TWO
    // sequential Groq calls, EACH now trying a fallback MODEL (not a
    // same-model retry) if the first one is slow: analysis up to 2 models x
    // 20s ≈ 40s worst case; plan generation up to 2 models x 25s ≈ 50s worst
    // case. Worst-case total is ~90s server-side, so this needs real margin
    // beyond that — a too-tight frontend timeout here previously fired
    // before the backend's own fallback logic even finished, masking a
    // slower-but-successful response as a hard failure. Deliberately generous
    // this time rather than cutting it close again.
    const { data } = await api.post('/resumes/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 130000,
    });
    return data.data.profile;
  },

  getMyResumes: async () => {
    const { data } = await api.get('/resumes');
    return data.data.profiles;
  },

  getResumeById: async (id) => {
    const { data } = await api.get(`/resumes/${id}`);
    return data.data.profile;
  },
};

// ─── Interview Services ───────────────────────────────────────────────────────
export const interviewService = {
  startInterview: async (jobRole = 'General', difficulty = 'medium', resumeId = null) => {
    const { data } = await api.post('/interviews', {
      job_role: jobRole,
      difficulty,
      resume_id: resumeId,
    });
    return data.data.interview;
  },

  getNextQuestion: async (interviewId) => {
    const { data } = await api.get(`/interviews/${interviewId}/next-question`);
    return data.data;
  },

  submitAnswer: async (interviewId, questionId, textAnswer, audioBlob = null, frameMetrics = [], durationSeconds = 60) => {
    if (audioBlob) {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.webm');
      formData.append('question_id', questionId);
      formData.append('frame_metrics', JSON.stringify(frameMetrics));
      formData.append('duration_seconds', durationSeconds);
      const { data } = await api.post(`/interviews/${interviewId}/answer`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return data.data.question;
    }
    const { data } = await api.post(`/interviews/${interviewId}/answer`, {
      question_id: questionId,
      text_answer: textAnswer,
      frame_metrics: frameMetrics,
      duration_seconds: durationSeconds,
    }, { timeout: 60000 });
    return data.data.question;
  },

  endInterview: async (interviewId) => {
    // Ending a session now runs an extra Mongo write beyond the AI feedback
    // call it already made, so give it more headroom than the 30s default —
    // this was previously timing out silently in some cases, cutting off
    // before the actual report document was returned.
    const { data } = await api.post(`/interviews/${interviewId}/end`, {}, { timeout: 45000 });
    // Return the persisted Report document (has durationSeconds, properly
    // aggregated sessionMetrics, etc.) — NOT the raw Interview object, which
    // has neither of those and was causing the report page to show
    // "Duration: 0" and every metric as N/A even on a normal session.
    return data.data.report || data.data.interview;
  },
};

// ─── Report Services ──────────────────────────────────────────────────────────
export const reportService = {
  getHistory: async (page = 1, limit = 10) => {
    const { data } = await api.get('/reports', { params: { page, limit } });
    return data.data;
  },

  getReportById: async (id) => {
    const { data } = await api.get(`/reports/${id}`);
    return data.data.report;
  },

  getAnalytics: async () => {
    const { data } = await api.get('/reports/analytics');
    return data.data.analytics;
  },
};

// ─── Health ───────────────────────────────────────────────────────────────────
export const healthCheck = async () => {
  const { data } = await api.get('/health');
  return data;
};

// Legacy default export for backward compat — wraps new services
const apiService = {
  // Auth
  logout: authService.logout,
  getMe: authService.getMe,
  // AI (Legacy - Removed)
  generateQuestion: async () => { throw new Error('Legacy endpoint removed'); },
  evaluateAnswer: async () => { throw new Error('Legacy endpoint removed'); },
  // Resume
  analyzeResume: resumeService.analyzeResume,
  getMyResumes: resumeService.getMyResumes,
  getResumeById: resumeService.getResumeById,
  // Interview
  startInterview: interviewService.startInterview,
  getNextQuestion: interviewService.getNextQuestion,
  submitAnswer: interviewService.submitAnswer,
  endSession: async (sessionData) => {
    // Map old session-end calls to the new interview end endpoint
    const id = sessionData.interview_id || sessionData.session_id;
    if (id) {
      return interviewService.endInterview(id);
    }
    // Graceful no-op if called without a valid interview_id
    console.warn('[API] endSession called without interview_id — skipping server call');
    return null;
  },
  getSessionHistory: reportService.getHistory,
  getHistory: reportService.getHistory,
  getReportById: reportService.getReportById,
  getAnalytics: reportService.getAnalytics,
  healthCheck,
  // analyzeFrame is now client-side (see useClientCV hook) — stubbed to no-op
  analyzeFrame: async () => null,
  // transcribeAudio now goes through submitAnswer — stub for compatibility
  transcribeAudio: async () => ({ text: '', words_per_minute: 0, word_count: 0, total_filler_count: 0 }),
};

export default apiService;
