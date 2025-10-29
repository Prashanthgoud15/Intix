# 🎯 Intix — Your Personal AI Interview Coach

A production-grade, AI-powered real-time interview preparation platform that uses computer vision, natural language processing, and Gemini AI to deliver honest, data-driven feedback on interview performance.

> **📚 Detailed Documentation:** See the [`docs/`](./docs) folder for technical documentation and development notes.

## 🚀 Features

- **Real-Time Computer Vision Analysis**: Eye contact, posture, gestures, and expressions tracking using MediaPipe
- **Speech Analysis**: Transcription, filler word detection, and pace analysis via Gemini AI
- **AI-Generated Questions**: Dynamic interview questions powered by Gemini 2.0 Flash
- **Resume-Based Interviews**: Upload your resume for personalized questions (basic to advanced)
- **Live Feedback**: Real-time confidence scoring and performance metrics
- **Comprehensive Reports**: Detailed session analysis with charts and PDF export
- **Session History**: Track progress over time with trend analysis

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS for styling
- Lucide React for icons
- Framer Motion for animations
- Recharts for data visualization
- WebRTC for camera/mic access
- jsPDF for report generation

### Backend
- FastAPI (Python)
- Google Gemini 2.0 Flash (100% Gemini-powered!)
- Google MediaPipe for computer vision
- OpenCV for video processing
- NumPy for numerical computations
- PyPDF2 for resume parsing

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Google Gemini API key (free tier available!)

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Frontend Setup

```bash
cd frontend
npm install
```

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
venv\Scripts\activate  # Windows
python main.py
```

Backend will run on `http://localhost:8000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🎨 Application Structure

```
AAI/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── services/
│   │   ├── vision_analyzer.py  # MediaPipe computer vision
│   │   ├── speech_analyzer.py  # Whisper transcription
│   │   └── ai_service.py       # OpenAI GPT integration
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   ├── utils/
│   │   └── scoring.py          # Confidence scoring logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   ├── utils/              # Utility functions
│   │   └── App.jsx             # Main app component
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 📊 Confidence Scoring Algorithm

The confidence score (0-100) is calculated using weighted metrics:

- **Eye Contact**: 30% - Tracks gaze direction and duration
- **Posture**: 25% - Analyzes body alignment and slouching
- **Speech Clarity**: 15% - Evaluates pace and articulation
- **Gestures**: 15% - Monitors hand movements and fidgeting
- **Expressions**: 15% - Assesses facial expressions and engagement

Penalties are applied dynamically:
- Looking away >3s: -5 points
- Slouching: -3 points
- Filler words: -2 points each
- Excessive fidgeting: -4 points

## 🔐 Privacy & Security

- All video/audio processing is done locally
- No media files are stored on servers
- Sessions are automatically deleted after report generation
- API keys are stored securely in environment variables

## 📱 Pages

1. **Landing Page**: Introduction and feature highlights
2. **Interview Dashboard**: Live interview session with real-time metrics
3. **Report Page**: Comprehensive performance analysis
4. **History Page**: Previous sessions and progress tracking

## 🎯 API Endpoints

- `POST /api/generate-question` - Generate interview questions
- `POST /api/transcribe-audio` - Convert speech to text
- `POST /api/evaluate-answer` - Evaluate answer quality
- `POST /api/analyze-frame` - Analyze video frame for metrics
- `POST /api/session/end` - Generate final report
- `GET /api/sessions/history` - Retrieve session history

## 🤝 Contributing

This is a production-grade prototype. Feel free to extend and customize for your needs.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🙏 Acknowledgments

- OpenAI for GPT-4 and Whisper API
- Google MediaPipe for computer vision capabilities
- The open-source community for amazing tools and libraries
