# Intix

### Your Personal AI Interview Coach

> **Practice. Analyze. Improve.**

Intix is an AI-powered interview coaching platform that helps candidates practice realistic interviews, analyze their speech and presentation, and receive actionable feedback to improve their performance.

---

## 🎯 Why Intix?

Candidates can practice interview questions, but often don't know:
- whether their answers are strong
- whether they speak too quickly
- how often they use filler words
- whether they appear confident
- what they should improve

**Intix turns interview practice into measurable feedback.**

```text
Practice → Analyze → Improve → Practice Again
```

---

## ✨ Features

- **Resume-Driven Questions:** Upload a PDF resume to generate a personalized 15-question interview plan tailored to your experience and target role.
- **Real-Time Voice Interaction:** Answer naturally using your microphone with lightning-fast transcription.
- **Live Body Language Tracking:** Client-side computer vision monitors eye contact, posture, and gestures in real-time.
- **Intelligent Feedback:** Receive constructive, objective evaluations on clarity, relevance, and completeness.
- **Comprehensive Reports:** Get a detailed breakdown of your performance, including confidence scores, filler word analysis, and a downloadable PDF report.

---

## 🧠 AI & Analysis

Intix combines multiple AI models to provide a holistic evaluation:

- **Speech-to-Text:** Groq's Whisper model transcribes spoken answers instantly.
- **Answer Evaluation:** Groq's LLM (Llama 3) analyzes the transcribed text against the question and your resume to score relevance and provide feedback.
- **Speech Metrics:** Custom algorithms detect filler words (um, uh, like) and calculate speech pace (Words Per Minute).
- **Visual Analysis:** MediaPipe runs entirely in the browser to track facial landmarks and body pose, calculating eye contact and posture scores without sending video data to the server.

---

## ⚙️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js 20, Express 5 |
| **Database** | MongoDB Atlas, Mongoose |
| **AI & ML** | Groq SDK (Llama 3 / Whisper), MediaPipe |
| **Security** | JWT Auth, Rate Limiting, XSS Protection |

---

## 👨‍💻 Author

**Prashanth Goud**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Prashanthgoud15)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/prashanthgoud15)
