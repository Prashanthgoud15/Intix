# 📁 Project Structure - Intix AI Interview Coach

## 🗂️ Root Directory

```
Intix/
├── 📄 README.md                    # Main project documentation
├── 📄 QUICK_START.md               # 5-minute quick start guide
├── 📄 DEPLOYMENT_GUIDE.md          # Production deployment guide
├── 📄 PROJECT_STRUCTURE.md         # This file
│
├── 🚀 start-all.bat                # Start both servers (ONE CLICK!)
├── 🔧 start-backend.bat            # Start backend only
├── 🔧 start-frontend.bat           # Start frontend only
├── 📦 package.json                 # Root package config
├── 🙈 .gitignore                   # Git ignore rules
│
├── 📂 backend/                     # Python FastAPI backend
├── 📂 frontend/                    # React + Vite frontend
└── 📂 docs/                        # Technical documentation
```

---

## 🎯 Essential Files (Root)

### Documentation
- **README.md** - Start here! Main project overview
- **QUICK_START.md** - Get running in 5 minutes
- **DEPLOYMENT_GUIDE.md** - Deploy to production (Render + Netlify)

### Scripts
- **start-all.bat** - ⭐ **USE THIS!** Starts both backend and frontend
- **start-backend.bat** - Backend only (for debugging)
- **start-frontend.bat** - Frontend only (for debugging)

---

## 🔧 Backend Structure

```
backend/
├── main.py                         # FastAPI application entry point
├── requirements.txt                # Python dependencies
├── .env                            # Environment variables (GEMINI_API_KEY)
├── .env.example                    # Example environment file
│
├── models/
│   └── schemas.py                  # Pydantic models for API
│
├── services/
│   ├── vision_analyzer.py          # MediaPipe computer vision
│   ├── gemini_speech_analyzer.py   # Gemini audio transcription
│   ├── gemini_service.py           # Gemini Q&A and feedback
│   ├── resume_analyzer.py          # Resume parsing & questions
│   └── ai_service.py               # Legacy AI service
│
├── utils/
│   ├── helpers.py                  # Helper functions
│   └── scoring.py                  # Confidence scoring logic
│
└── venv/                           # Python virtual environment
```

### Key Backend Files
- **main.py** - All API endpoints, CORS, startup
- **gemini_service.py** - Question generation, answer evaluation
- **resume_analyzer.py** - Resume-based interview questions
- **vision_analyzer.py** - Real-time body language analysis

---

## 🎨 Frontend Structure

```
frontend/
├── index.html                      # HTML entry point
├── package.json                    # Node dependencies
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS config
├── .env                            # Environment variables (VITE_API_URL)
├── .env.example                    # Example environment file
│
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Main app component
│   ├── index.css                   # Global styles
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx         # Home page with features
│   │   ├── InterviewDashboard.jsx  # Main interview interface
│   │   ├── ReportPage.jsx          # Performance report
│   │   └── HistoryPage.jsx         # Session history
│   │
│   ├── components/
│   │   └── ResumeUpload.jsx        # Resume upload modal
│   │
│   ├── services/
│   │   └── api.js                  # API service layer
│   │
│   └── utils/
│       └── helpers.js              # Utility functions
│
├── public/                         # Static assets
└── dist/                           # Production build (generated)
```

### Key Frontend Files
- **InterviewDashboard.jsx** - Main interview UI (video, questions, metrics)
- **ResumeUpload.jsx** - Resume upload with drag-and-drop
- **ReportPage.jsx** - Performance report with charts
- **api.js** - All backend API calls

---

## 📚 Documentation Folder

```
docs/
├── README.md                       # Documentation index
│
├── Features/
│   ├── RESUME_BASED_INTERVIEW.md   # Resume feature docs
│   ├── SHARE_REPORT_FEATURE.md     # Share functionality
│   └── SESSION_ENDING_MODAL.md     # Loading modal
│
├── Technical/
│   ├── API_DOCUMENTATION.md        # API endpoints
│   ├── PROJECT_SUMMARY.md          # Complete overview
│   └── SETUP_GUIDE.md              # Detailed setup
│
├── Fixes/
│   ├── FIXES_SUMMARY.md            # All fixes
│   ├── GEMINI_FILE_STATE_FIX.md    # File upload fix
│   └── CORS_FIX.md                 # CORS configuration
│
└── Updates/
    ├── GEMINI_ONLY_MIGRATION.md    # OpenAI → Gemini
    ├── BRANDING_UPDATE.md          # Rebranding to Intix
    └── LANDING_PAGE_UPDATES.md     # UI updates
```

---

## 🚀 Quick Commands

### Development
```bash
# Start everything (RECOMMENDED)
start-all.bat

# Or start individually
start-backend.bat
start-frontend.bat
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🌐 Deployment Structure

### Production Setup
```
Frontend (Netlify)
    ↓ API calls
Backend (Render)
    ↓ Uses
Gemini AI API
```

### Environment Variables

**Backend (.env)**
```env
GEMINI_API_KEY=your_key_here
ALLOWED_ORIGINS=https://your-frontend.netlify.app
```

**Frontend (.env)**
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## 📦 Dependencies

### Backend (Python)
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **google-generativeai** - Gemini AI
- **mediapipe** - Computer vision
- **opencv-python** - Video processing
- **PyPDF2** - Resume parsing

### Frontend (JavaScript)
- **React** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Charts
- **Lucide React** - Icons
- **jsPDF** - PDF generation

---

## 🔑 Key Features Location

### Resume Upload
- **Frontend**: `frontend/src/components/ResumeUpload.jsx`
- **Backend**: `backend/services/resume_analyzer.py`
- **API**: `POST /api/analyze-resume`

### Interview Session
- **Frontend**: `frontend/src/pages/InterviewDashboard.jsx`
- **Backend**: `backend/main.py` (multiple endpoints)
- **Vision**: `backend/services/vision_analyzer.py`
- **Speech**: `backend/services/gemini_speech_analyzer.py`

### Report Generation
- **Frontend**: `frontend/src/pages/ReportPage.jsx`
- **Backend**: `POST /api/session/end`
- **Share**: Social media integration in ReportPage

---

## 🎯 Development Workflow

1. **Start Development**
   ```bash
   start-all.bat
   ```

2. **Make Changes**
   - Frontend: Edit files in `frontend/src/`
   - Backend: Edit files in `backend/`
   - Auto-reload enabled for both!

3. **Test**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000/docs

4. **Deploy**
   - Push to GitHub
   - Auto-deploy on Render (backend) and Netlify (frontend)

---

## 📊 File Count Summary

```
Root Files:       7 files (clean!)
Backend Files:    ~20 files
Frontend Files:   ~25 files
Documentation:    ~20 files (in docs/)
Total:            ~72 files
```

---

## 🎨 Code Organization

### Backend Pattern
```
main.py → services/ → models/
   ↓         ↓          ↓
Routes   Business    Data
         Logic      Schemas
```

### Frontend Pattern
```
App.jsx → pages/ → components/ → services/
   ↓        ↓          ↓            ↓
Router   Views    Reusable    API Calls
                  UI Parts
```

---

## ✅ Clean Structure Benefits

### Root Directory
✅ Only essential files visible  
✅ Clear purpose for each file  
✅ Easy to navigate  
✅ Professional appearance  

### Documentation
✅ All docs in `docs/` folder  
✅ Organized by category  
✅ Easy to find information  
✅ Doesn't clutter root  

### Code
✅ Clear separation of concerns  
✅ Modular and maintainable  
✅ Easy to understand  
✅ Scalable architecture  

---

## 🎯 What to Look At

### For Users
1. **README.md** - Project overview
2. **QUICK_START.md** - Get started
3. **DEPLOYMENT_GUIDE.md** - Deploy it

### For Developers
1. **backend/main.py** - API endpoints
2. **frontend/src/pages/** - UI pages
3. **docs/** - Technical details

### For Contributors
1. **PROJECT_STRUCTURE.md** - This file
2. **docs/API_DOCUMENTATION.md** - API specs
3. **docs/PROJECT_SUMMARY.md** - Complete overview

---

## 🚀 Summary

**Root Directory**: Clean and organized  
**Backend**: Python FastAPI with Gemini AI  
**Frontend**: React with modern UI  
**Documentation**: Organized in docs/ folder  
**Deployment**: Separate backend/frontend (industry standard)  

**Everything you need is in the root. Everything else is in docs/.** ✨

---

**Need help? Check:**
- Quick start: `QUICK_START.md`
- Deployment: `DEPLOYMENT_GUIDE.md`
- Technical docs: `docs/README.md`
