# Troubleshooting Live Metrics & Session Stats

## Issue: Live Metrics and Session Stats Not Updating

### Root Causes Identified:
1. **Initial metrics were hardcoded** - Changed to start at 0
2. **Missing error handling** - Added comprehensive console logging
3. **Backend connectivity issues** - Need to verify backend is running
4. **Frame analysis not starting properly** - Fixed initialization

### Fixes Applied:

#### 1. Enhanced Error Handling
- Added console.log statements throughout the analysis pipeline
- Added error details logging for API failures
- Added visual "Analyzing" indicator when frame analysis is active

#### 2. Fixed Initial Metrics
Changed from:
```javascript
const [metrics, setMetrics] = useState({
  eyeContact: 75,  // Hardcoded
  posture: 70,     // Hardcoded
  confidence: 72,  // Hardcoded
  ...
});
```

To:
```javascript
const [metrics, setMetrics] = useState({
  eyeContact: 0,   // Will update from API
  posture: 0,      // Will update from API
  confidence: 0,   // Will update from API
  ...
});
```

#### 3. Improved Frame Analysis
- Added `isAnalyzing` state to track analysis status
- Increased interval from 2s to 3s to reduce server load
- Added frame capture validation
- Added detailed logging for debugging

### How to Test:

#### Step 1: Verify Backend is Running
```powershell
cd d:\PROJECTS\AAI\backend
.\venv\Scripts\activate
python main.py
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

#### Step 2: Verify Frontend is Running
```powershell
cd d:\PROJECTS\AAI\frontend
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

#### Step 3: Check Browser Console
1. Open the application in browser (http://localhost:5173)
2. Open Developer Tools (F12)
3. Go to Console tab
4. Click "Start Interview"

You should see:
```
Starting frame analysis...
Analyzing frame at 0s...
Frame analysis result: {eye_contact: {...}, posture: {...}, ...}
```

#### Step 4: Verify API Connectivity
Open http://localhost:8000/docs in browser to see the API documentation.

### Common Issues:

#### Issue 1: Backend Not Running
**Symptom**: Console shows network errors like "ERR_CONNECTION_REFUSED"
**Solution**: 
```powershell
cd d:\PROJECTS\AAI\backend
.\venv\Scripts\activate
python main.py
```

#### Issue 2: Missing OpenAI API Key
**Symptom**: Backend starts but API calls fail with 401 errors
**Solution**: Create `backend/.env` file with:
```
OPENAI_API_KEY=your_key_here
```

#### Issue 3: CORS Errors
**Symptom**: Console shows CORS policy errors
**Solution**: Verify backend CORS settings allow http://localhost:5173

#### Issue 4: Camera/Microphone Not Accessible
**Symptom**: Black screen or permission denied
**Solution**: Grant browser permissions for camera and microphone

#### Issue 5: Metrics Still Showing 0
**Symptom**: Metrics remain at 0 even after starting session
**Possible Causes**:
- Backend not processing frames correctly
- MediaPipe dependencies missing
- Frame capture failing

**Debug Steps**:
1. Check browser console for errors
2. Check backend terminal for Python errors
3. Verify MediaPipe is installed: `pip show mediapipe`

### Expected Behavior After Fixes:

1. **On Session Start**:
   - Console logs "Starting frame analysis..."
   - "Analyzing" indicator appears on video overlay
   - Metrics start at 0%

2. **During Session** (every 3 seconds):
   - Console logs "Analyzing frame at Xs..."
   - Console logs frame analysis results
   - Metrics update with real values (not stuck at 75%, 70%, 72%)
   - Eye Contact, Posture, and Gestures bars animate to new values

3. **When Recording Answer**:
   - Red "Recording" indicator shows
   - After stopping, audio is transcribed
   - Session Stats update:
     - Questions count increments
     - Filler Words count updates
     - Speech Pace shows WPM

4. **Visual Indicators**:
   - Eye Contact and Posture badges on video show real-time values
   - Overall Confidence meter updates smoothly
   - Live Metrics panel shows animated progress bars

### Testing Checklist:

- [ ] Backend server is running on port 8000
- [ ] Frontend server is running on port 5173
- [ ] Browser console shows no CORS errors
- [ ] Camera and microphone permissions granted
- [ ] "Start Interview" button clicked
- [ ] "Analyzing" indicator appears
- [ ] Console shows frame analysis logs every 3 seconds
- [ ] Metrics update from 0 to actual values
- [ ] Recording answer updates Session Stats
- [ ] No red errors in console

### Next Steps if Still Not Working:

1. **Check Backend Logs**: Look for Python errors in the terminal
2. **Verify Dependencies**: Ensure all packages are installed
3. **Test API Directly**: Use http://localhost:8000/docs to test endpoints
4. **Check Network Tab**: Look for failed API requests in browser DevTools
5. **Verify MediaPipe**: Test vision_analyzer.py independently

### Contact Points:

If issues persist, check:
- Backend terminal for Python errors
- Browser console for JavaScript errors
- Network tab for failed API requests
- Backend logs for MediaPipe initialization errors
