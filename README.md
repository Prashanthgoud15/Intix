# Intix
### Your Personal AI Interview Coach

Intix is an AI-powered interview coaching platform that helps candidates practice realistic interviews, analyze their speech and presentation, and receive actionable feedback to improve their performance.

> Practice. Analyze. Improve.

---

## 🎯 Why Intix?

Most interview preparation platforms focus on questions and answers, but candidates often don't know:
- whether their answers are strong
- whether they speak too quickly
- how many filler words they use
- whether they appear confident
- what they should improve

**Intix turns interview practice into measurable feedback.**

---

## ✨ Key Features

- 🤖 **Personalized AI Interviews**
- 📄 **Resume Integration**
- 🎙️ **Speech Analysis**
- 👁️ **Visual / Presentation Analysis**
- 📊 **Question-level & Overall Scoring**
- 🧠 **AI Feedback**
- 📈 **Performance History & Trends**
- 📑 **Structured PDF Reports**
- 🗣️ **Filler-word analysis**

---

## 🔄 How It Works

```text
Resume + Target Role
        ↓
    AI Interview
        ↓
Answer + Speech + Visual Analysis
        ↓
   Performance Score
        ↓
      AI Feedback
        ↓
   Detailed Report
        ↓
Improve & Practice Again
```

Intix provides a complete feedback loop, from resume parsing to a final actionable report.

---

## 🧠 AI & Analysis

**AI Interview Generation**
Role-aware interview questions with optional resume context.

**Answer Evaluation**
Groq's `gpt-oss-20b` model evaluates the candidate's answer for relevance, completeness, and clarity.

**Speech Analysis**
- Speech-to-text via `whisper-large-v3-turbo`
- Speech pace / WPM
- Filler-word detection
- Speech-related metrics

**Computer Vision**
MediaPipe runs entirely in the browser to track facial landmarks and body pose, calculating:
- Eye contact
- Posture
- Movement / gesture-related analysis

---

## 📊 Reports & Progress

Users receive a comprehensive breakdown of their performance:
- Overall interview score
- Question-level scores
- Answered / skipped counts
- Speech metrics
- Filler-word analysis
- Confidence / visual metrics
- Strengths
- Areas to improve
- Question-by-question feedback
- Recommendations
- Downloadable PDF report

Users can also track their **Interview history**, **Performance trends**, and view **Previous reports**.

---

## ⚙️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, React Router |
| **UI / Motion** | Framer Motion |
| **Charts** | Recharts |
| **Backend** | Node.js, Express |
| **Database** | MongoDB, Mongoose |
| **AI** | Groq (`gpt-oss-20b`, `whisper-large-v3-turbo`) |
| **Speech** | Custom implemented speech pipeline |
| **Computer Vision** | MediaPipe |
| **Validation** | Zod |
| **Authentication** | JWT, bcrypt |
| **Security** | Helmet, CORS, rate limiting, Mongo sanitization |

---

## 🏗️ Architecture

```text
                    INTIX
                      │
          ┌───────────┴───────────┐
          │                       │
     React Frontend          Node.js API
        Vercel                  Render
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                 MongoDB         Groq       Analysis
                  Atlas                        Services
```

The frontend handles the UI and client-side computer vision, while the Node.js backend manages authentication, data persistence, and orchestrates the AI and speech analysis services.

---

## 🔐 Security

- JWT authentication
- Password hashing
- Protected API routes
- User ownership checks
- Zod request validation
- Rate limiting
- Helmet security headers
- CORS
- MongoDB sanitization
- Server-side file validation
- File-size restrictions
- Environment-based secrets
- Centralized error handling

---

## 💡 What Makes Intix Different?

Most interview tools focus mainly on generating questions.

Intix combines:
Personalization + AI Interview + Answer Evaluation + Speech Analysis + Visual Analysis + Performance Tracking + Actionable Feedback

The goal isn't just to finish an interview. It's to understand how you performed and know what to improve next.

---

## 👨‍💻 Author

**Prashanth Goud**

Computer Science Student · Full-Stack Developer · AI Enthusiast

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat-square&logo=github&logoColor=white)](https://github.com/Prashanthgoud15)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/prashanth-goud-372485294/)
[![Email](https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:goudprashanth691@gmail.com)
