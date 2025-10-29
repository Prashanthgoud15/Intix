# ⚡ Quick Start Guide

Get up and running in 5 minutes!

## 🔧 Recent Fixes (Live Metrics & Session Stats)

**What was fixed:**
- ✅ Live Metrics now update in real-time (Eye Contact, Posture, Gestures)
- ✅ Session Stats now track Questions, Filler Words, and Speech Pace
- ✅ Added visual "Analyzing" indicator during frame analysis
- ✅ Improved error handling and console logging
- ✅ Fixed initial metrics starting at hardcoded values

**To verify the fixes work:**
1. Open browser console (F12) after starting the app
2. Look for "Starting frame analysis..." when you click "Start Interview"
3. Metrics should update every 3 seconds with real values

## Step 1: Get OpenAI API Key (2 min)

1. Visit https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

## Step 2: Configure Backend (1 min)

1. Open `backend/.env.example`
2. Copy it to `backend/.env`
3. Replace `your_openai_api_key_here` with your actual API key

```env
OPENAI_API_KEY=sk-your-actual-key-here
```

## Step 3: Start Backend (1 min)

**Windows:**
```bash
cd d:/PROJECTS/AAI
start-backend.bat
```

Wait for: `Server starting on http://0.0.0.0:8000`

## Step 4: Start Frontend (1 min)

Open a **NEW terminal window**:

**Windows:**
```bash
cd d:/PROJECTS/AAI
start-frontend.bat
```

Wait for: `Local: http://localhost:5173`

## Step 5: Open Application

Go to: **http://localhost:5173**

---

## First Interview Session

1. Click **"Start Interview"** on the landing page
2. Allow camera and microphone access when prompted
3. Click **"Start Interview"** button in the dashboard
4. Wait for AI to generate a question
5. Click **"Record Answer"** and speak your response
6. Click **"Stop Answer"** when done
7. Click **"Next Question"** for more questions
8. Click **"End Session"** to see your report

---

## Troubleshooting

### Backend won't start?
- Check if Python 3.9+ is installed: `python --version`
- Make sure you added your OpenAI API key to `backend/.env`

### Frontend won't start?
- Check if Node.js 18+ is installed: `node --version`
- Try: `cd frontend && npm install`

### Camera not working?
- Grant browser permissions
- Use Chrome or Edge browser
- Access via `localhost` (not IP address)

### API errors?
- Verify your OpenAI API key is correct
- Check if you have API credits: https://platform.openai.com/usage
- Make sure backend is running on port 8000

---

## What's Next?

- Complete multiple sessions to track progress
- View your history at `/history`
- Download PDF reports
- Practice different interview types

**Need help?** See `SETUP_GUIDE.md` for detailed instructions.
