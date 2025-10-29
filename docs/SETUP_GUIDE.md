# 🚀 REAL AI Interview Coach Pro - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

## Quick Start (Windows)

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (you'll need it in step 3)

### 2. Clone or Download the Project

```bash
cd d:/PROJECTS/AAI
```

### 3. Configure Backend

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

3. Open `.env` in a text editor and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

### 4. Start the Backend Server

**Option A: Using the batch file (Recommended)**
```bash
cd d:/PROJECTS/AAI
start-backend.bat
```

**Option B: Manual setup**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

The backend will start on **http://localhost:8000**

### 5. Start the Frontend

Open a **new terminal window** and run:

**Option A: Using the batch file (Recommended)**
```bash
cd d:/PROJECTS/AAI
start-frontend.bat
```

**Option B: Manual setup**
```bash
cd frontend
npm install
npm run dev
```

The frontend will start on **http://localhost:5173**

### 6. Access the Application

Open your browser and go to: **http://localhost:5173**

---

## Manual Setup (Detailed)

### Backend Setup

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   ```

2. **Activate Virtual Environment**
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` and add:
   ```
   OPENAI_API_KEY=sk-your-key-here
   HOST=0.0.0.0
   PORT=8000
   DEBUG=True
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

5. **Run the Server**
   ```bash
   python main.py
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   copy .env.example .env
   ```
   
   The `.env` should contain:
   ```
   VITE_API_URL=http://localhost:8000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## Troubleshooting

### Backend Issues

**Problem: "OPENAI_API_KEY not found"**
- Solution: Make sure you've created a `.env` file in the `backend` folder with your API key

**Problem: "Module not found" errors**
- Solution: Make sure you've activated the virtual environment and installed all dependencies:
  ```bash
  venv\Scripts\activate
  pip install -r requirements.txt
  ```

**Problem: "Port 8000 already in use"**
- Solution: Change the port in `backend/.env`:
  ```
  PORT=8001
  ```
  Also update `frontend/.env`:
  ```
  VITE_API_URL=http://localhost:8001
  ```

### Frontend Issues

**Problem: "Cannot connect to backend"**
- Solution: Make sure the backend server is running on http://localhost:8000
- Check that `frontend/.env` has the correct API URL

**Problem: "npm install fails"**
- Solution: Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

**Problem: Camera/Microphone not working**
- Solution: Grant browser permissions for camera and microphone
- Make sure you're accessing the app via `localhost` (not an IP address)
- Try using Chrome or Edge browser

### Common Issues

**Problem: "Slow frame analysis"**
- This is normal - MediaPipe analysis takes 1-2 seconds per frame
- The app analyzes frames every 2 seconds to balance performance and accuracy

**Problem: "Transcription fails"**
- Make sure your OpenAI API key has credits
- Check your internet connection
- Verify the API key is correct in `backend/.env`

---

## Testing the Installation

### 1. Test Backend

Open http://localhost:8000 in your browser. You should see:
```json
{
  "message": "REAL AI Interview Coach Pro API",
  "version": "1.0.0",
  "status": "active"
}
```

### 2. Test API Documentation

Open http://localhost:8000/docs to see the interactive API documentation.

### 3. Test Health Endpoint

Open http://localhost:8000/api/health to verify all services are running.

### 4. Test Frontend

Open http://localhost:5173 and you should see the landing page.

---

## Production Deployment

### Backend (FastAPI)

1. Set `DEBUG=False` in `.env`
2. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

### Frontend (React)

1. Build the production bundle:
   ```bash
   cd frontend
   npm run build
   ```

2. Serve the `dist` folder using a web server (Nginx, Apache, or a CDN)

---

## System Requirements

### Minimum Requirements
- **CPU**: Dual-core processor
- **RAM**: 4GB
- **Storage**: 2GB free space
- **Internet**: Stable connection for API calls

### Recommended Requirements
- **CPU**: Quad-core processor or better
- **RAM**: 8GB or more
- **Storage**: 5GB free space
- **Webcam**: 720p or higher
- **Microphone**: Built-in or external

---

## Browser Compatibility

- ✅ Chrome 90+ (Recommended)
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ Opera 76+

**Note**: Camera and microphone access requires HTTPS in production or localhost in development.

---

## API Costs

The application uses OpenAI APIs:

- **GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Whisper**: ~$0.006 per minute of audio

**Estimated cost per interview session**: $0.05 - $0.15

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation at http://localhost:8000/docs
3. Check the browser console for error messages

---

## Next Steps

Once everything is running:

1. Click "Start Interview" on the landing page
2. Grant camera and microphone permissions
3. Click "Start Interview" button in the dashboard
4. Answer the AI-generated questions
5. Review your performance report

**Happy interviewing! 🎉**
