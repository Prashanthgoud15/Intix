<div align="center">
  
  # ✦ INTIX ✦
  
  [![Typing SVG](https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=22&pause=1000&color=007ACC&center=true&vCenter=true&width=400&lines=Your+Personal+AI+Interview+Coach;Practice.+Analyze.+Improve.)](https://git.io/typing-svg)

  <p align="center">
    An AI-powered interview coaching platform that helps candidates practice realistic interviews, analyze their speech and presentation, and receive actionable feedback to improve their performance.
  </p>
</div>

---

## 🎯 Why Intix?

Most interview preparation platforms focus on providing a list of questions, leaving candidates in the dark about their actual performance. You might know *what* to say, but do you know *how* you're saying it?

**Intix turns interview practice into measurable, actionable feedback.**

---

## ✨ Key Features

<table>
  <tr>
    <td>🤖 <b>Personalized AI Interviews</b><br/>Role-aware questions tailored to your resume.</td>
    <td>🎙️ <b>Speech Analysis</b><br/>Real-time transcription and pace tracking.</td>
  </tr>
  <tr>
    <td>👁️ <b>Visual Analysis</b><br/>Client-side tracking of eye contact and posture.</td>
    <td>🧠 <b>Intelligent Feedback</b><br/>Objective scoring on clarity and relevance.</td>
  </tr>
  <tr>
    <td>📈 <b>Performance Trends</b><br/>Track your improvement across multiple sessions.</td>
    <td>📑 <b>Structured Reports</b><br/>Downloadable PDFs with detailed metrics.</td>
  </tr>
</table>

---

## 🔄 How It Works

```mermaid
graph LR
    A[📄 Resume] --> B(🤖 AI Interview)
    B --> C{Analysis}
    C -->|🎙️ Speech| D[Pace & Fillers]
    C -->|👁️ Vision| E[Posture & Eyes]
    C -->|🧠 LLM| F[Answer Quality]
    D --> G((📊 Final Report))
    E --> G
    F --> G
    G -.->|Practice Again| A
    
    style A fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style B fill:#0f172a,stroke:#818cf8,stroke-width:2px,color:#fff
    style C fill:#1e293b,stroke:#94a3b8,stroke-width:2px,color:#fff
    style D fill:#0f172a,stroke:#34d399,stroke-width:2px,color:#fff
    style E fill:#0f172a,stroke:#fbbf24,stroke-width:2px,color:#fff
    style F fill:#0f172a,stroke:#f472b6,stroke-width:2px,color:#fff
    style G fill:#0f172a,stroke:#2dd4bf,stroke-width:3px,color:#fff
```

---

## 🧠 AI & Analysis Engine

<details open>
<summary><b>💬 Answer Evaluation</b></summary>
Groq's <code>gpt-oss-20b</code> model evaluates the candidate's answer for relevance, completeness, and clarity against the target job role.
</details>

<details open>
<summary><b>🎙️ Speech Pipeline</b></summary>
Powered by <code>whisper-large-v3-turbo</code> for instant speech-to-text, combined with custom algorithms to detect filler words and calculate Words Per Minute (WPM).
</details>

<details open>
<summary><b>👁️ Computer Vision</b></summary>
MediaPipe runs entirely in the browser (100% private) to track facial landmarks and body pose, calculating eye contact consistency and posture stability.
</details>

---

## 📊 Reports & Progress Dashboard

Instead of just a score, Intix provides a comprehensive breakdown of your performance.

<table>
  <tr>
    <td width="50%">
      <b>🎯 Scoring & Metrics</b><br/>
      • Overall Interview Score<br/>
      • Question-level Breakdown<br/>
      • Answered vs. Skipped Ratio
    </td>
    <td width="50%">
      <b>🗣️ Speech & Vision</b><br/>
      • Words Per Minute (Pace)<br/>
      • Filler Word Count (um, uh, like)<br/>
      • Confidence & Eye Contact %
    </td>
  </tr>
  <tr>
    <td width="50%">
      <b>💡 Actionable Feedback</b><br/>
      • Identified Strengths<br/>
      • Areas for Improvement<br/>
      • Question-by-Question Tips
    </td>
    <td width="50%">
      <b>📈 Tracking & Export</b><br/>
      • Historical Performance Trends<br/>
      • Previous Session Archive<br/>
      • Downloadable PDF Reports
    </td>
  </tr>
</table>

---

## ⚙️ Tech Stack

**Frontend:**  
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

**Backend & Database:**  
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

**AI & Analysis:**  
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-00A67E?style=for-the-badge&logo=mediapipe&logoColor=white)

---

## 🏗️ Architecture

```mermaid
graph TD
    UI[React Frontend<br/><i>Vercel</i>] <-->|REST API| API[Node.js API<br/><i>Render</i>]
    API <-->|Data| DB[(MongoDB Atlas)]
    API <-->|LLM & Speech| Groq[Groq API]
    UI -.->|Client-side CV| MP[MediaPipe]
    
    style UI fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style API fill:#0f172a,stroke:#22c55e,stroke-width:2px,color:#fff
    style DB fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
    style Groq fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#fff
    style MP fill:#0f172a,stroke:#0ea5e9,stroke-width:2px,color:#fff
```

---

## 🔐 Security

`JWT Auth` `Password Hashing` `Protected Routes` `User Isolation` `Zod Validation` `Rate Limiting` `Helmet Headers` `CORS` `Mongo Sanitization` `In-Memory File Validation`

---

## 💡 What Makes Intix Different?

| Traditional Interview Prep | The Intix Experience |
| :--- | :--- |
| ❌ Static lists of generic questions | ✅ Dynamic questions based on **your resume** |
| ❌ No feedback on delivery | ✅ Real-time **speech pace and filler word** tracking |
| ❌ Blind to body language | ✅ Live **eye contact and posture** analysis |
| ❌ Subjective self-evaluation | ✅ Objective **AI-driven scoring** and feedback |

The goal isn't just to finish an interview. It's to understand exactly how you performed and know precisely what to improve next.

---

### 🎯 Built For

🎓 **Students**
Prepare for campus placements and technical interviews.

💼 **Job Seekers**
Practice role-specific interviews before applying.

🚀 **Developers**
Improve technical communication and presentation.

---

### Ready to practice smarter?

**Practice once. Understand your performance. Come back stronger.**

`Practice → Analyze → Improve`

---

<div align="center">
  
  ### 👨‍💻 Built by Prashanth Goud
  <p>Computer Science Student · Full-Stack Developer · AI Enthusiast</p>

  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Prashanthgoud15)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/prashanth-goud-372485294/)
  [![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:goudprashanth691@gmail.com)

</div>
