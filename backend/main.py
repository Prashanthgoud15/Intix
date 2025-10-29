"""
REAL AI Interview Coach Pro - Backend API
FastAPI application with MediaPipe, OpenCV, and OpenAI integration
"""
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
from datetime import datetime
import uuid
from typing import Dict, Any, List
import uvicorn

from models.schemas import (
    GenerateQuestionRequest, GenerateQuestionResponse,
    TranscribeAudioRequest, TranscribeAudioResponse,
    EvaluateAnswerRequest, EvaluateAnswerResponse,
    AnalyzeFrameRequest, AnalyzeFrameResponse,
    EndSessionRequest, EndSessionResponse,
    SessionHistoryResponse, SessionSummary,
    EyeContactMetrics, PostureMetrics, GestureMetrics, ExpressionMetrics,
    SessionMetrics
)
from services.vision_analyzer import VisionAnalyzer
from services.speech_analyzer import SpeechAnalyzer
from services.gemini_speech_analyzer import GeminiSpeechAnalyzer
from services.ai_service import AIService
from services.gemini_service import GeminiService
from services.resume_analyzer import ResumeAnalyzer
from utils.scoring import ConfidenceScorer

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Intix — Your Personal AI Interview Coach API",
    description="AI-powered interview preparation platform with real-time feedback",
    version="1.0.0"
)

# CORS middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
# Add support for all localhost and 127.0.0.1 origins (for development)
allowed_origins.extend([
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
])
# Allow all origins with 127.0.0.1 for browser preview proxies
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables")

vision_analyzer = VisionAnalyzer()
# Use Gemini for speech analysis (no OpenAI needed!)
speech_analyzer = GeminiSpeechAnalyzer(GEMINI_API_KEY) if GEMINI_API_KEY else None
# Use Gemini for AI service (questions and feedback)
ai_service = GeminiService(GEMINI_API_KEY) if GEMINI_API_KEY else None
# Use Gemini for resume analysis
resume_analyzer = ResumeAnalyzer(GEMINI_API_KEY) if GEMINI_API_KEY else None

print("✅ Using Gemini for ALL AI features (questions, feedback, transcription, resume analysis)")
print("✅ No OpenAI API key needed!")

# In-memory session storage (replace with database in production)
sessions_storage: Dict[str, Dict[str, Any]] = {}
session_history: List[Dict[str, Any]] = []
resume_profiles: Dict[str, Dict[str, Any]] = {}  # Store resume analysis by session


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Intix — Your Personal AI Interview Coach API",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "generate_question": "/api/generate-question",
            "transcribe_audio": "/api/transcribe-audio",
            "evaluate_answer": "/api/evaluate-answer",
            "analyze_frame": "/api/analyze-frame",
            "end_session": "/api/session/end",
            "session_history": "/api/sessions/history"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "vision_analyzer": "active (MediaPipe)",
            "speech_analyzer": "active (Gemini)" if speech_analyzer else "inactive",
            "ai_service": "active (Gemini)" if ai_service else "inactive",
            "resume_analyzer": "active (Gemini)" if resume_analyzer else "inactive"
        },
        "gemini_configured": bool(GEMINI_API_KEY),
        "openai_needed": False,
        "message": "100% Gemini-powered - No OpenAI required!"
    }


@app.post("/api/analyze-resume")
async def analyze_resume(resume: UploadFile = File(...)):
    """
    Analyze uploaded resume and generate personalized interview plan
    """
    if not resume_analyzer:
        raise HTTPException(status_code=503, detail="Resume analyzer not available")
    
    try:
        # Read file content
        content = await resume.read()
        
        # Extract text based on file type
        if resume.filename.endswith('.txt'):
            resume_text = content.decode('utf-8')
        elif resume.filename.endswith('.pdf'):
            # For PDF, we'll use a simple extraction (you can enhance this with PyPDF2)
            try:
                import PyPDF2
                import io
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                resume_text = ""
                for page in pdf_reader.pages:
                    resume_text += page.extract_text()
            except:
                # Fallback: send to Gemini directly
                resume_text = content.decode('utf-8', errors='ignore')
        else:
            # For DOC/DOCX, send raw content (Gemini can handle it)
            resume_text = content.decode('utf-8', errors='ignore')
        
        # Analyze resume
        profile = resume_analyzer.analyze_resume(resume_text)
        
        # Generate interview plan
        interview_plan = resume_analyzer.generate_interview_plan(profile)
        
        # Store in session (generate session ID)
        session_id = str(uuid.uuid4())
        resume_profiles[session_id] = {
            "profile": profile,
            "interview_plan": interview_plan,
            "current_question_index": 0
        }
        
        return {
            "success": True,
            "session_id": session_id,
            "profile": profile,
            "interview_plan": interview_plan,
            "total_questions": len(interview_plan)
        }
    
    except Exception as e:
        print(f"Error analyzing resume: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")


@app.post("/api/generate-question", response_model=GenerateQuestionResponse)
async def generate_question(request: GenerateQuestionRequest):
    """
    Generate an interview question (resume-based if available, otherwise generic)
    """
    if not ai_service:
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GEMINI_API_KEY."
        )
    
    try:
        # Check if this session has a resume-based interview plan
        session_id = request.session_id if hasattr(request, 'session_id') else None
        
        if session_id and session_id in resume_profiles:
            # Use resume-based questions
            profile_data = resume_profiles[session_id]
            interview_plan = profile_data["interview_plan"]
            current_index = profile_data["current_question_index"]
            
            if current_index < len(interview_plan):
                question_data = interview_plan[current_index]
                
                # Increment for next time
                resume_profiles[session_id]["current_question_index"] = current_index + 1
                
                return GenerateQuestionResponse(
                    question=question_data["question"],
                    category=question_data["category"],
                    difficulty=question_data["difficulty"],
                    tips=question_data.get("tips", []),
                    context=question_data.get("context", "")
                )
        
        # Fallback to generic question generation
        result = ai_service.generate_interview_question(
            job_role=request.job_role.value,
            difficulty=request.difficulty.value,
            previous_questions=request.previous_questions
        )
        
        return GenerateQuestionResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating question: {str(e)}")


@app.post("/api/transcribe-audio", response_model=TranscribeAudioResponse)
async def transcribe_audio(request: TranscribeAudioRequest):
    """
    Transcribe audio using OpenAI Whisper API
    """
    if not speech_analyzer:
        raise HTTPException(
            status_code=503,
            detail="Speech analyzer not available. Please configure OPENAI_API_KEY."
        )
    
    try:
        result = speech_analyzer.transcribe_audio(
            audio_base64=request.audio_base64,
            audio_format=request.format
        )
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return TranscribeAudioResponse(
            text=result['text'],
            duration=result['duration'],
            word_count=result['word_count'],
            words_per_minute=result['words_per_minute']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")


@app.post("/api/evaluate-answer", response_model=EvaluateAnswerResponse)
async def evaluate_answer(request: EvaluateAnswerRequest):
    """
    Evaluate an interview answer using GPT-4
    """
    if not ai_service:
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure OPENAI_API_KEY."
        )
    
    try:
        result = ai_service.evaluate_answer(
            question=request.question,
            answer=request.answer,
            job_role=request.job_role
        )
        
        return EvaluateAnswerResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluating answer: {str(e)}")


@app.post("/api/analyze-frame", response_model=AnalyzeFrameResponse)
async def analyze_frame(request: AnalyzeFrameRequest):
    """
    Analyze a video frame for eye contact, posture, gestures, and expressions
    """
    try:
        result = vision_analyzer.analyze_frame(
            frame_base64=request.frame_base64,
            timestamp=request.timestamp
        )
        
        return AnalyzeFrameResponse(
            eye_contact=EyeContactMetrics(**result['eye_contact']),
            posture=PostureMetrics(**result['posture']),
            gestures=GestureMetrics(**result['gestures']),
            expressions=ExpressionMetrics(**result['expressions']),
            overall_confidence=result['overall_confidence'],
            timestamp=result['timestamp']
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing frame: {str(e)}")


@app.post("/api/session/end", response_model=EndSessionResponse)
async def end_session(request: EndSessionRequest):
    """
    End a session and generate comprehensive report
    """
    try:
        # Aggregate frame metrics
        aggregated_metrics = ConfidenceScorer.aggregate_session_metrics(
            request.frame_metrics
        )
        
        # Analyze speech patterns
        speech_metrics = {
            'speech_clarity_score': 75.0,
            'filler_word_count': 0,
            'speech_pace': 140.0
        }
        
        if speech_analyzer and request.transcriptions:
            transcription_results = []
            for text in request.transcriptions:
                # Simple analysis without re-transcribing
                words = text.split()
                word_count = len(words)
                # Estimate duration based on average speaking pace
                estimated_duration = word_count / 2.5  # ~150 WPM
                
                from utils.scoring import detect_filler_words, calculate_speech_pace
                filler_analysis = detect_filler_words(text)
                wpm = calculate_speech_pace(word_count, estimated_duration)
                
                transcription_results.append({
                    'word_count': word_count,
                    'duration': estimated_duration,
                    'total_filler_count': filler_analysis['total_filler_count'],
                    'words_per_minute': wpm
                })
            
            speech_analysis = speech_analyzer.analyze_speech_patterns(transcription_results)
            speech_metrics = {
                'speech_clarity_score': speech_analysis['clarity_score'],
                'filler_word_count': speech_analysis['total_filler_count'],
                'speech_pace': speech_analysis['average_wpm']
            }
        
        # Combine all metrics
        all_metrics = {**aggregated_metrics, **speech_metrics}
        
        # Calculate overall confidence
        overall_confidence = ConfidenceScorer.calculate_overall_confidence(
            eye_contact_score=all_metrics['eye_contact_percentage'],
            posture_score=all_metrics['posture_score'],
            speech_clarity_score=all_metrics['speech_clarity_score'],
            gesture_score=all_metrics['gesture_score'],
            expression_score=all_metrics['expression_confidence']
        )
        
        all_metrics['overall_confidence'] = overall_confidence
        
        # Generate AI feedback
        ai_feedback = {
            'detailed_feedback': 'Great job completing the interview session! Keep practicing to improve your confidence and delivery.',
            'strengths': [
                'Completed the full interview session',
                'Maintained good engagement throughout',
                'Showed willingness to improve'
            ],
            'areas_for_improvement': [
                'Work on maintaining consistent eye contact',
                'Practice reducing filler words',
                'Focus on posture and body language'
            ],
            'recommendations': [
                'Practice mock interviews regularly',
                'Record yourself to identify improvement areas',
                'Research common interview questions for your field'
            ]
        }
        
        if ai_service:
            try:
                ai_feedback = ai_service.generate_session_feedback(
                    metrics=all_metrics,
                    transcriptions=request.transcriptions,
                    questions=[]  # Could pass questions if stored
                )
            except Exception as e:
                print(f"Error generating AI feedback: {e}")
        
        # Create session metrics
        session_metrics = SessionMetrics(
            eye_contact_percentage=all_metrics['eye_contact_percentage'],
            posture_score=all_metrics['posture_score'],
            expression_confidence=all_metrics['expression_confidence'],
            gesture_score=all_metrics['gesture_score'],
            speech_clarity_score=all_metrics['speech_clarity_score'],
            filler_word_count=all_metrics['filler_word_count'],
            speech_pace=all_metrics['speech_pace'],
            overall_confidence=overall_confidence
        )
        
        # Store session in history
        session_summary = {
            'session_id': request.session_id,
            'timestamp': datetime.now(),
            'duration': request.total_duration,
            'overall_confidence': overall_confidence,
            'questions_answered': request.questions_answered,
            'key_metrics': {
                'eye_contact': all_metrics['eye_contact_percentage'],
                'posture': all_metrics['posture_score'],
                'speech_clarity': all_metrics['speech_clarity_score']
            }
        }
        session_history.append(session_summary)
        
        # Create response
        response = EndSessionResponse(
            session_id=request.session_id,
            timestamp=datetime.now(),
            duration=request.total_duration,
            metrics=session_metrics,
            detailed_feedback=ai_feedback['detailed_feedback'],
            strengths=ai_feedback['strengths'],
            areas_for_improvement=ai_feedback['areas_for_improvement'],
            recommendations=ai_feedback['recommendations']
        )
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ending session: {str(e)}")


@app.get("/api/sessions/history", response_model=SessionHistoryResponse)
async def get_session_history():
    """
    Get session history and progress trends
    """
    try:
        if not session_history:
            return SessionHistoryResponse(
                sessions=[],
                total_sessions=0,
                average_confidence=0.0,
                improvement_trend=0.0
            )
        
        # Convert to SessionSummary objects
        sessions = [
            SessionSummary(
                session_id=s['session_id'],
                timestamp=s['timestamp'],
                duration=s['duration'],
                overall_confidence=s['overall_confidence'],
                questions_answered=s['questions_answered'],
                key_metrics=s['key_metrics']
            )
            for s in session_history
        ]
        
        # Calculate statistics
        total_sessions = len(sessions)
        average_confidence = sum(s.overall_confidence for s in sessions) / total_sessions
        
        # Calculate improvement trend
        improvement_trend = 0.0
        if total_sessions >= 2:
            first_half = sessions[:total_sessions//2]
            second_half = sessions[total_sessions//2:]
            
            avg_first = sum(s.overall_confidence for s in first_half) / len(first_half)
            avg_second = sum(s.overall_confidence for s in second_half) / len(second_half)
            
            improvement_trend = ((avg_second - avg_first) / avg_first) * 100 if avg_first > 0 else 0
        
        return SessionHistoryResponse(
            sessions=sessions,
            total_sessions=total_sessions,
            average_confidence=average_confidence,
            improvement_trend=improvement_trend
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching session history: {str(e)}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    vision_analyzer.cleanup()


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    print(f"""
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║       REAL AI Interview Coach Pro - Backend Server          ║
    ║                                                              ║
    ║  🚀 Server starting on http://{host}:{port}              ║
    ║  📚 API Docs: http://{host}:{port}/docs                 ║
    ║  🔧 OpenAI Configured: {str(bool(OPENAI_API_KEY)).ljust(5)}                           ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
