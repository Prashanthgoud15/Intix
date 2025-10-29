# 📚 API Documentation

## Base URL
```
http://localhost:8000
```

## Interactive Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Endpoints

### 1. Health Check

**GET** `/api/health`

Check if all services are running properly.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "vision_analyzer": "active",
    "speech_analyzer": "active",
    "ai_service": "active"
  },
  "openai_configured": true
}
```

---

### 2. Generate Interview Question

**POST** `/api/generate-question`

Generate an AI-powered interview question.

**Request Body:**
```json
{
  "job_role": "Software Engineer",
  "difficulty": "medium",
  "previous_questions": []
}
```

**Parameters:**
- `job_role`: String - Target job role (Software Engineer, Data Scientist, etc.)
- `difficulty`: String - Question difficulty (easy, medium, hard)
- `previous_questions`: Array - List of previously asked questions to avoid repetition

**Response:**
```json
{
  "question": "Tell me about a time when you had to debug a complex production issue.",
  "category": "Technical",
  "difficulty": "medium",
  "tips": [
    "Use the STAR method",
    "Explain your debugging process",
    "Highlight the impact of your solution"
  ]
}
```

---

### 3. Transcribe Audio

**POST** `/api/transcribe-audio`

Transcribe audio using OpenAI Whisper API.

**Request Body:**
```json
{
  "audio_base64": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC...",
  "format": "webm"
}
```

**Parameters:**
- `audio_base64`: String - Base64 encoded audio data
- `format`: String - Audio format (webm, mp3, wav, etc.)

**Response:**
```json
{
  "text": "I worked on a challenging project where...",
  "duration": 45.5,
  "word_count": 120,
  "words_per_minute": 158.2
}
```

---

### 4. Evaluate Answer

**POST** `/api/evaluate-answer`

Evaluate an interview answer using GPT-4.

**Request Body:**
```json
{
  "question": "Tell me about yourself.",
  "answer": "I'm a software engineer with 5 years of experience...",
  "job_role": "Software Engineer"
}
```

**Response:**
```json
{
  "score": 85.0,
  "clarity_score": 90.0,
  "relevance_score": 85.0,
  "completeness_score": 80.0,
  "feedback": "Great answer! You provided a clear overview...",
  "strengths": [
    "Clear structure",
    "Relevant experience",
    "Specific examples"
  ],
  "improvements": [
    "Could mention more technical skills",
    "Add quantifiable achievements"
  ]
}
```

---

### 5. Analyze Video Frame

**POST** `/api/analyze-frame`

Analyze a video frame for eye contact, posture, gestures, and expressions.

**Request Body:**
```json
{
  "frame_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "timestamp": 12.5
}
```

**Parameters:**
- `frame_base64`: String - Base64 encoded image frame
- `timestamp`: Float - Timestamp in seconds

**Response:**
```json
{
  "eye_contact": {
    "is_looking_at_camera": true,
    "gaze_score": 0.85,
    "looking_away_duration": 0.0
  },
  "posture": {
    "is_upright": true,
    "posture_score": 0.78,
    "slouch_detected": false,
    "shoulder_alignment": 0.92
  },
  "gestures": {
    "hand_detected": true,
    "gesture_count": 2,
    "fidgeting_score": 0.15,
    "hand_positions": ["raised", "raised"]
  },
  "expressions": {
    "confidence_level": 0.82,
    "smile_detected": true,
    "expression_type": "happy",
    "engagement_score": 0.88
  },
  "overall_confidence": 82.5,
  "timestamp": 12.5
}
```

---

### 6. End Session

**POST** `/api/session/end`

End an interview session and generate a comprehensive report.

**Request Body:**
```json
{
  "session_id": "session_1234567890_abc123",
  "total_duration": 300.5,
  "frames_analyzed": 150,
  "questions_answered": 5,
  "transcriptions": [
    "I worked on a project...",
    "My biggest strength is..."
  ],
  "frame_metrics": [
    {
      "eye_contact": {...},
      "posture": {...},
      "gestures": {...},
      "expressions": {...},
      "timestamp": 10.0
    }
  ]
}
```

**Response:**
```json
{
  "session_id": "session_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "duration": 300.5,
  "metrics": {
    "eye_contact_percentage": 82.5,
    "posture_score": 78.3,
    "expression_confidence": 85.2,
    "gesture_score": 72.8,
    "speech_clarity_score": 88.5,
    "filler_word_count": 12,
    "speech_pace": 145.2,
    "overall_confidence": 81.5
  },
  "detailed_feedback": "You demonstrated strong interview skills...",
  "strengths": [
    "Excellent eye contact throughout",
    "Clear and articulate responses",
    "Good posture and body language"
  ],
  "areas_for_improvement": [
    "Reduce filler words (um, uh)",
    "Maintain consistent posture",
    "Provide more specific examples"
  ],
  "recommendations": [
    "Practice answering common questions",
    "Record yourself to identify habits",
    "Focus on the STAR method"
  ]
}
```

---

### 7. Get Session History

**GET** `/api/sessions/history`

Retrieve all previous interview sessions.

**Response:**
```json
{
  "sessions": [
    {
      "session_id": "session_123",
      "timestamp": "2024-01-15T10:30:00Z",
      "duration": 300.5,
      "overall_confidence": 81.5,
      "questions_answered": 5,
      "key_metrics": {
        "eye_contact": 82.5,
        "posture": 78.3,
        "speech_clarity": 88.5
      }
    }
  ],
  "total_sessions": 10,
  "average_confidence": 78.2,
  "improvement_trend": 12.5
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service not configured (e.g., missing API key)

---

## Rate Limiting

The API uses OpenAI's services, which have rate limits:

- **GPT-4o-mini**: 500 requests per minute
- **Whisper**: 50 requests per minute

For production use, implement proper rate limiting and caching.

---

## Authentication

Currently, the API does not require authentication. For production deployment:

1. Implement JWT or API key authentication
2. Add user management
3. Store sessions in a database
4. Implement proper CORS policies

---

## Data Privacy

- All video frames are processed in real-time and not stored
- Audio transcriptions are sent to OpenAI Whisper API
- Session data is stored temporarily in memory
- No personal data is permanently stored without user consent

---

## WebSocket Support (Future)

For real-time streaming analysis, WebSocket support can be added:

```javascript
ws://localhost:8000/ws/analyze-stream
```

This would allow continuous frame analysis without polling.

---

## SDK Examples

### Python
```python
import requests

# Generate question
response = requests.post(
    'http://localhost:8000/api/generate-question',
    json={
        'job_role': 'Software Engineer',
        'difficulty': 'medium',
        'previous_questions': []
    }
)
question = response.json()
```

### JavaScript
```javascript
// Generate question
const response = await fetch('http://localhost:8000/api/generate-question', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_role: 'Software Engineer',
    difficulty: 'medium',
    previous_questions: []
  })
});
const question = await response.json();
```

---

## Support

For API issues or questions:
- Check the interactive docs at `/docs`
- Review error messages in the response
- Check backend logs for detailed error information
