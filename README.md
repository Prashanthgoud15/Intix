# Intix — AI Interview Coach

> **Intix** is a full-stack AI-powered interview coaching platform. Upload your resume, receive a tailored 15-question interview plan, conduct a mock interview with real-time CV analysis, and get a detailed performance report — all in one place.

---

## Architecture

```
Intix/
├── backend/          ← Legacy Python (FastAPI) — kept for reference, not deployed
├── frontend/         ← React + Vite + Tailwind CSS
│   └── src/
│       ├── context/  ← AuthContext (JWT + auto-refresh)
│       ├── hooks/    ← useClientCV (client-side CV analysis)
│       ├── pages/    ← LandingPage, LoginPage, RegisterPage, InterviewDashboard, HistoryPage, ReportPage
│       └── services/ ← api.js (axios + authService, interviewService, reportService, …)
└── server/           ← Node.js / Express / MongoDB — production backend
    └── src/
        ├── config/       ← env validation, DB, CORS, Swagger
        ├── constants/    ← roles, difficulty levels, HTTP codes
        ├── controllers/  ← auth, ai, resume, interview, report
        ├── middlewares/  ← JWT auth, error handler, rate limiters, Morgan logger
        ├── models/       ← User, ResumeProfile, Interview, Report
        ├── prompts/      ← Groq LLM prompts
        ├── routes/       ← /api/v1 router
        ├── services/     ← authService, aiService, resumeService, speechService, scoringService, reportService
        └── validators/   ← Zod schemas
```

### Key Tech Stack

| Layer | Tech |
|---|---|
| API Server | Node.js 20 + Express 5 |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (access 15m + refresh 7d) |
| AI | Groq SDK — openai/gpt-oss-120b + Whisper |
| PDF Parsing | pdf-parse (in-memory) |
| Validation | Zod |
| Frontend | React 18 + Vite + Tailwind CSS |
| Deploy | Render.com (server) + Vercel (frontend) |

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- MongoDB Atlas cluster (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repo

```bash
git clone https://github.com/Prashanthgoud15/Intix-v2.git
cd Intix-v2
```

### 2. Set up the server

```bash
cd server
cp env.example .env      # Then fill in your values (see table below)
npm install
npm run dev              # Starts on http://localhost:5000
```

### 3. Set up the frontend

```bash
cd frontend
cp env.example .env      # Set VITE_API_URL=http://localhost:5000/api/v1
npm install
npm run dev              # Starts on http://localhost:5173
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Example | Description |
|---|---|---|---|
| `PORT` | No | `5000` | HTTP port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `MONGODB_URI` | **Yes** | `mongodb+srv://…` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | **Yes** | `secret123…` | 32+ char random string |
| `JWT_REFRESH_SECRET` | **Yes** | `secret456…` | 32+ char random string |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token TTL |
| `GROQ_API_KEY` | **Yes** | `gsk_…` | Groq API key |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Comma-separated allowed origins |
| `MAX_FILE_SIZE_MB` | No | `10` | Max resume upload size |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api/v1` | Backend API base URL |
| `VITE_API_TIMEOUT` | `30000` | Request timeout (ms) |
| `VITE_DEBUG` | `false` | Enable verbose API logs |

---

## API Reference

Interactive docs available at **`http://localhost:5000/api-docs`** when the server is running.

### Endpoints Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | — | Server health check |
| `POST` | `/api/v1/auth/register` | — | Create account |
| `POST` | `/api/v1/auth/login` | — | Login + receive JWT pair |
| `POST` | `/api/v1/auth/refresh` | — | Exchange refresh → access token |
| `GET` | `/api/v1/auth/me` | 🔒 | Get current user |
| `POST` | `/api/v1/ai/generate-question` | 🔒 | Generate interview question |
| `POST` | `/api/v1/ai/evaluate-answer` | 🔒 | Evaluate a text answer |
| `POST` | `/api/v1/resumes/analyze` | 🔒 | Upload PDF + get profile + interview plan |
| `GET` | `/api/v1/resumes` | 🔒 | List user's resume profiles |
| `GET` | `/api/v1/resumes/:id` | 🔒 | Get single resume profile |
| `POST` | `/api/v1/interviews` | 🔒 | Start interview session |
| `GET` | `/api/v1/interviews/:id/next-question` | 🔒 | Get next question |
| `POST` | `/api/v1/interviews/:id/answer` | 🔒 | Submit answer (text or audio blob) |
| `POST` | `/api/v1/interviews/:id/end` | 🔒 | End session + generate feedback + auto-report |
| `GET` | `/api/v1/reports` | 🔒 | Paginated interview history |
| `GET` | `/api/v1/reports/analytics` | 🔒 | Score trends + best role |
| `GET` | `/api/v1/reports/:id` | 🔒 | Full report detail |

---

## Deployment

### Server → Render.com

The `server/render.yaml` is pre-configured:

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New Web Service** → **Connect repo**
3. Render auto-detects `render.yaml` and creates the service
4. Add secret env vars in the Render dashboard (marked `sync: false`)

### Frontend → Vercel

The `frontend/vercel.json` is pre-configured with the necessary SPA rewrite rules.

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → **Import repo**
3. Framework Preset: **Vite**
4. Root Directory: **frontend**
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Add `VITE_API_URL=https://your-render-service.onrender.com/api/v1` in Environment Variables.
8. Deploy!

---

## Interview Flow (End-to-End)

```
User registers / logs in
    → JWTs stored in localStorage
    → ProtectedRoute guards /interview, /report, /history

User uploads resume (or skips)
    → POST /resumes/analyze (pdf-parse → Groq → ResumeProfile saved)
    → ResumeProfile._id stored in state

Interview starts
    → POST /interviews (uses resume plan if available)
    → GET /interviews/:id/next-question (served from DB)
    → User records answer → audio blob sent to POST /interviews/:id/answer
        → Groq Whisper transcribes audio
        → Groq LLM evaluates answer (score, clarity, relevance, feedback)
        → useClientCV sends frame_metrics alongside
        → scoringService calculates confidence
    → Repeat for each question

User ends interview
    → POST /interviews/:id/end
        → Session averages computed
        → Groq generates final feedback (strengths, recommendations)
        → Report auto-generated (fire-and-forget)
    → Navigate to /report

History page
    → GET /reports + GET /reports/analytics
    → Line chart shows score trends over time
```

---

## License

MIT
