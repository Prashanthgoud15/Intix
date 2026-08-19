# Intix — Your Personal AI Interview Coach

<div align="center">
  <p><strong>Master your next interview with real-time AI feedback on your answers, body language, and speech pace.</strong></p>
</div>

---

## 🎯 The Problem & The Solution

**The Problem:** Preparing for interviews is stressful. Candidates often struggle to get objective, constructive feedback on their performance before the actual interview. Practicing in front of a mirror or recording yourself doesn't provide actionable insights on *what* to improve.

**The Solution:** **Intix** is a full-stack AI-powered interview coaching platform that simulates a real interview environment. It analyzes your resume to generate tailored questions, listens to your answers, and uses computer vision to track your body language. After the session, you receive a comprehensive, actionable report detailing your strengths, areas for improvement, and specific metrics like speech pace and eye contact.

---

## ✨ Key Features

- **📄 Resume-Driven Interviews:** Upload your PDF resume, and Intix will generate a personalized 15-question interview plan based on your experience and the target job role.
- **🎙️ Real-Time Voice Interaction:** Answer questions naturally using your microphone. Intix uses Groq's Whisper model for lightning-fast transcription.
- **👁️ Body Language Analysis:** Client-side computer vision (MediaPipe) tracks your eye contact, posture, and gestures in real-time, completely privately.
- **🧠 Intelligent Feedback:** Groq's LLM evaluates your answers for clarity, relevance, and completeness, providing constructive feedback just like a real interviewer.
- **📊 Comprehensive Reports:** Get a detailed breakdown of your performance, including a confidence score, filler word analysis, and a downloadable PDF report.

---

## 🛠️ Tech Stack

Built with a modern, scalable, and high-performance stack:

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js 20, Express 5
- **Database:** MongoDB Atlas, Mongoose
- **AI & ML:** Groq SDK (Llama 3 / Whisper), MediaPipe (Computer Vision)
- **Authentication:** Custom JWT (Access & Refresh tokens) with strict security measures
- **Deployment:** Vercel (Frontend), Render (Backend)

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- MongoDB Atlas cluster (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repository
```bash
git clone https://github.com/Prashanthgoud15/Intix-v2.git
cd Intix-v2
```

### 2. Set up the Backend (Server)
```bash
cd server
cp env.example .env      # Fill in your MONGODB_URI, GROQ_API_KEY, and JWT secrets
npm install
npm run dev              # Starts on http://localhost:5000
```

### 3. Set up the Frontend
```bash
cd frontend
cp env.example .env      # Ensure VITE_API_URL=http://localhost:5000/api/v1
npm install
npm run dev              # Starts on http://localhost:5173
```

---

## 🌐 Deployment

### Backend (Render)
1. Push your code to GitHub.
2. Go to [Render](https://render.com) → **New Web Service** → Connect your repository.
3. Render will auto-detect the `render.yaml` file and configure the service.
4. Add your secret environment variables (`MONGODB_URI`, `GROQ_API_KEY`, etc.) in the Render dashboard.

### Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) → **Add New Project** → Import your repository.
2. Set the Root Directory to `frontend`.
3. The `vercel.json` file is pre-configured for SPA routing.
4. Add `VITE_API_URL` pointing to your Render backend URL in the Environment Variables.
5. Deploy!

---

## 🔒 Security Highlights

Intix is built with production-grade security in mind:
- **Strict Rate Limiting:** Prevents abuse of AI endpoints and authentication routes.
- **Robust JWT Auth:** Implements short-lived access tokens and database-backed refresh tokens with server-side invalidation on logout.
- **Data Sanitization:** Protects against NoSQL injection and XSS attacks.
- **Secure File Handling:** Validates PDF uploads in-memory without saving sensitive files to disk.


