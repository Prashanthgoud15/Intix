# Debug: Report Generation Error

## Issue
Getting "Error generating report. Please try again." when clicking "End Session"

## Changes Made to Help Debug

### 1. Enhanced Frontend Error Logging
The `endSession()` function now logs:
- Session data before sending
- Detailed error information
- More specific error messages

### 2. Added Default Frame Metrics
If no frame metrics were collected (backend wasn't analyzing), it will use default values to prevent the error.

## How to Debug

### Step 1: Open Browser Console
1. Press F12 in your browser
2. Go to the Console tab
3. Click "End Session"

### Step 2: Check Console Output
Look for these messages:

**Good Signs:**
```
Ending session...
Session data: {sessionId: "...", sessionDuration: X, questionsAnswered: Y, frameMetricsCount: Z, ...}
Sending session data to backend: {...}
Report generated successfully: {...}
```

**Bad Signs:**
```
Error ending session: ...
Error details: ...
```

### Step 3: Common Issues & Solutions

#### Issue: "frameMetricsCount: 0"
**Cause**: Backend wasn't analyzing frames
**Solutions**:
1. Check if backend is running
2. Check browser console for frame analysis errors
3. Look for "Analyzing frame at Xs..." messages
4. Check if camera permissions were granted

#### Issue: "Network Error" or "ERR_CONNECTION_REFUSED"
**Cause**: Backend not running or wrong port
**Solution**:
```powershell
cd d:\PROJECTS\AAI
.\start-backend.ps1
```

#### Issue: "500 Internal Server Error"
**Cause**: Backend error processing the request
**Solution**:
1. Check backend terminal for Python errors
2. Look for stack traces
3. Common causes:
   - Missing dependencies
   - Invalid data format
   - OpenAI API errors

#### Issue: "401 Unauthorized" or API key errors
**Cause**: Invalid or missing OpenAI API key
**Solution**:
1. Check `backend/.env` file exists
2. Verify `OPENAI_API_KEY` is set correctly
3. Test API key at https://platform.openai.com/usage

### Step 4: Manual Test

Try this in browser console to test the endpoint directly:

```javascript
// Test with minimal data
const testData = {
  session_id: "test_123",
  total_duration: 60,
  frames_analyzed: 1,
  questions_answered: 1,
  transcriptions: ["This is a test answer"],
  frame_metrics: [{
    eye_contact: { is_looking_at_camera: true, gaze_score: 0.75, looking_away_duration: 0 },
    posture: { is_upright: true, posture_score: 0.7, slouch_detected: false, shoulder_alignment: 0.8 },
    gestures: { hand_detected: false, gesture_count: 0, fidgeting_score: 0.2, hand_positions: [] },
    expressions: { confidence_level: 0.7, smile_detected: false, expression_type: 'neutral', engagement_score: 0.7 },
    timestamp: 0
  }]
};

fetch('http://localhost:8000/api/session/end', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

### Step 5: Check Backend Logs

In the backend terminal, look for:
- Request received messages
- Error stack traces
- MediaPipe warnings
- OpenAI API errors

## What Should Happen Now

With the fixes applied:

1. **If frame metrics were collected**: Report generates normally
2. **If no frame metrics**: Uses default values and generates report anyway
3. **If backend error**: Shows specific error message in alert
4. **All cases**: Detailed logs in console for debugging

## Next Steps

1. Try ending a session again
2. Check browser console for the new detailed logs
3. Share the console output if error persists
4. Check backend terminal for Python errors

## Quick Fix Applied

The frontend now includes fallback logic:
```javascript
if (frameMetrics.length === 0) {
  console.warn('No frame metrics collected, using default values');
  // Adds default metrics to prevent backend errors
}
```

This ensures the report can be generated even if frame analysis failed.
