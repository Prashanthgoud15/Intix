from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class QuestionDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class JobRole(str, Enum):
    SOFTWARE_ENGINEER = "Software Engineer"
    DATA_SCIENTIST = "Data Scientist"
    PRODUCT_MANAGER = "Product Manager"
    DESIGNER = "Designer"
    MARKETING = "Marketing"
    SALES = "Sales"
    GENERAL = "General"


class GenerateQuestionRequest(BaseModel):
    job_role: JobRole = JobRole.GENERAL
    difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM
    previous_questions: List[str] = Field(default_factory=list)
    session_id: Optional[str] = None  # For resume-based interviews


class GenerateQuestionResponse(BaseModel):
    question: str
    category: str
    difficulty: str
    tips: List[str]
    context: Optional[str] = None  # Why this question is relevant (for resume-based)


class TranscribeAudioRequest(BaseModel):
    audio_base64: str
    format: str = "webm"


class TranscribeAudioResponse(BaseModel):
    text: str
    duration: float
    word_count: int
    words_per_minute: float


class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    job_role: str = "General"


class EvaluateAnswerResponse(BaseModel):
    score: float  # 0-100
    clarity_score: float
    relevance_score: float
    completeness_score: float
    feedback: str
    strengths: List[str]
    improvements: List[str]


class AnalyzeFrameRequest(BaseModel):
    frame_base64: str
    timestamp: float


class EyeContactMetrics(BaseModel):
    is_looking_at_camera: bool
    gaze_score: float  # 0-1
    looking_away_duration: float


class PostureMetrics(BaseModel):
    is_upright: bool
    posture_score: float  # 0-1
    slouch_detected: bool
    shoulder_alignment: float


class GestureMetrics(BaseModel):
    hand_detected: bool
    gesture_count: int
    fidgeting_score: float  # 0-1 (higher = more fidgeting)
    hand_positions: List[str]


class ExpressionMetrics(BaseModel):
    confidence_level: float  # 0-1
    smile_detected: bool
    expression_type: str  # neutral, happy, concerned, etc.
    engagement_score: float


class AnalyzeFrameResponse(BaseModel):
    eye_contact: EyeContactMetrics
    posture: PostureMetrics
    gestures: GestureMetrics
    expressions: ExpressionMetrics
    overall_confidence: float  # 0-100
    timestamp: float


class FillerWord(BaseModel):
    word: str
    count: int
    timestamps: List[float]


class SpeechMetrics(BaseModel):
    total_words: int
    filler_words: List[FillerWord]
    total_filler_count: int
    speech_pace: float  # words per minute
    clarity_score: float
    pauses_count: int


class SessionMetrics(BaseModel):
    eye_contact_percentage: float
    posture_score: float
    expression_confidence: float
    gesture_score: float
    speech_clarity_score: float
    filler_word_count: int
    speech_pace: float
    overall_confidence: float


class EndSessionRequest(BaseModel):
    session_id: str
    total_duration: float
    frames_analyzed: int
    questions_answered: int
    transcriptions: List[str]
    frame_metrics: List[Dict[str, Any]]


class EndSessionResponse(BaseModel):
    session_id: str
    timestamp: datetime
    duration: float
    metrics: SessionMetrics
    detailed_feedback: str
    strengths: List[str]
    areas_for_improvement: List[str]
    recommendations: List[str]


class SessionSummary(BaseModel):
    session_id: str
    timestamp: datetime
    duration: float
    overall_confidence: float
    questions_answered: int
    key_metrics: Dict[str, float]


class SessionHistoryResponse(BaseModel):
    sessions: List[SessionSummary]
    total_sessions: int
    average_confidence: float
    improvement_trend: float  # percentage change
