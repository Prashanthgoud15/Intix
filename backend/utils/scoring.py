"""
Confidence scoring and metrics calculation utilities
"""
from typing import List, Dict, Any
import numpy as np


class ConfidenceScorer:
    """
    Calculates confidence scores based on weighted metrics
    
    Weights:
    - Eye Contact: 30%
    - Posture: 25%
    - Speech Clarity: 15%
    - Gestures: 15%
    - Expressions: 15%
    """
    
    WEIGHTS = {
        'eye_contact': 0.30,
        'posture': 0.25,
        'speech_clarity': 0.15,
        'gestures': 0.15,
        'expressions': 0.15
    }
    
    # Penalty thresholds
    LOOKING_AWAY_THRESHOLD = 3.0  # seconds
    LOOKING_AWAY_PENALTY = 5
    SLOUCH_PENALTY = 3
    FILLER_WORD_PENALTY = 2
    FIDGETING_PENALTY = 4
    
    @staticmethod
    def calculate_overall_confidence(
        eye_contact_score: float,
        posture_score: float,
        speech_clarity_score: float,
        gesture_score: float,
        expression_score: float
    ) -> float:
        """
        Calculate weighted overall confidence score (0-100)
        
        Args:
            eye_contact_score: 0-100
            posture_score: 0-100
            speech_clarity_score: 0-100
            gesture_score: 0-100
            expression_score: 0-100
            
        Returns:
            Overall confidence score (0-100)
        """
        scores = {
            'eye_contact': eye_contact_score,
            'posture': posture_score,
            'speech_clarity': speech_clarity_score,
            'gestures': gesture_score,
            'expressions': expression_score
        }
        
        weighted_sum = sum(
            scores[key] * ConfidenceScorer.WEIGHTS[key]
            for key in scores
        )
        
        return max(0, min(100, weighted_sum))
    
    @staticmethod
    def calculate_eye_contact_score(
        gaze_scores: List[float],
        looking_away_durations: List[float]
    ) -> float:
        """
        Calculate eye contact score based on gaze tracking
        
        Args:
            gaze_scores: List of gaze scores (0-1) from each frame
            looking_away_durations: List of durations looking away
            
        Returns:
            Eye contact score (0-100)
        """
        if not gaze_scores:
            return 50.0
        
        # Base score from average gaze
        base_score = np.mean(gaze_scores) * 100
        
        # Apply penalties for looking away
        penalty = 0
        for duration in looking_away_durations:
            if duration > ConfidenceScorer.LOOKING_AWAY_THRESHOLD:
                penalty += ConfidenceScorer.LOOKING_AWAY_PENALTY
        
        final_score = base_score - penalty
        return max(0, min(100, final_score))
    
    @staticmethod
    def calculate_posture_score(
        posture_scores: List[float],
        slouch_count: int
    ) -> float:
        """
        Calculate posture score
        
        Args:
            posture_scores: List of posture scores (0-1) from each frame
            slouch_count: Number of times slouching was detected
            
        Returns:
            Posture score (0-100)
        """
        if not posture_scores:
            return 50.0
        
        base_score = np.mean(posture_scores) * 100
        penalty = slouch_count * ConfidenceScorer.SLOUCH_PENALTY
        
        final_score = base_score - penalty
        return max(0, min(100, final_score))
    
    @staticmethod
    def calculate_speech_clarity_score(
        words_per_minute: float,
        filler_word_count: int,
        total_words: int
    ) -> float:
        """
        Calculate speech clarity score
        
        Args:
            words_per_minute: Speaking pace
            filler_word_count: Number of filler words
            total_words: Total words spoken
            
        Returns:
            Speech clarity score (0-100)
        """
        # Ideal WPM range: 120-160
        optimal_wpm = 140
        wpm_score = 100 - min(50, abs(words_per_minute - optimal_wpm) / 2)
        
        # Filler word penalty
        if total_words > 0:
            filler_ratio = filler_word_count / total_words
            filler_penalty = filler_ratio * 100
        else:
            filler_penalty = 0
        
        final_score = wpm_score - filler_penalty
        return max(0, min(100, final_score))
    
    @staticmethod
    def calculate_gesture_score(
        fidgeting_scores: List[float],
        gesture_counts: List[int]
    ) -> float:
        """
        Calculate gesture score (lower fidgeting = higher score)
        
        Args:
            fidgeting_scores: List of fidgeting scores (0-1) from each frame
            gesture_counts: List of gesture counts per frame
            
        Returns:
            Gesture score (0-100)
        """
        if not fidgeting_scores:
            return 75.0
        
        # Lower fidgeting is better
        avg_fidgeting = np.mean(fidgeting_scores)
        base_score = (1 - avg_fidgeting) * 100
        
        # Moderate gestures are good, excessive is bad
        avg_gestures = np.mean(gesture_counts) if gesture_counts else 0
        if avg_gestures > 5:  # Too many gestures
            penalty = (avg_gestures - 5) * 2
            base_score -= penalty
        
        return max(0, min(100, base_score))
    
    @staticmethod
    def calculate_expression_score(
        confidence_levels: List[float],
        engagement_scores: List[float]
    ) -> float:
        """
        Calculate expression score based on facial expressions
        
        Args:
            confidence_levels: List of confidence levels (0-1) from each frame
            engagement_scores: List of engagement scores (0-1) from each frame
            
        Returns:
            Expression score (0-100)
        """
        if not confidence_levels or not engagement_scores:
            return 60.0
        
        avg_confidence = np.mean(confidence_levels)
        avg_engagement = np.mean(engagement_scores)
        
        # Weighted combination
        score = (avg_confidence * 0.6 + avg_engagement * 0.4) * 100
        
        return max(0, min(100, score))
    
    @staticmethod
    def aggregate_session_metrics(frame_metrics: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Aggregate metrics from all frames in a session
        
        Args:
            frame_metrics: List of frame analysis results
            
        Returns:
            Aggregated metrics dictionary
        """
        if not frame_metrics:
            return {
                'eye_contact_percentage': 50.0,
                'posture_score': 50.0,
                'expression_confidence': 60.0,
                'gesture_score': 75.0,
                'overall_confidence': 58.75
            }
        
        # Extract metrics from frames
        gaze_scores = []
        looking_away_durations = []
        posture_scores = []
        slouch_count = 0
        fidgeting_scores = []
        gesture_counts = []
        confidence_levels = []
        engagement_scores = []
        
        for frame in frame_metrics:
            if 'eye_contact' in frame:
                gaze_scores.append(frame['eye_contact'].get('gaze_score', 0.5))
                looking_away_durations.append(
                    frame['eye_contact'].get('looking_away_duration', 0)
                )
            
            if 'posture' in frame:
                posture_scores.append(frame['posture'].get('posture_score', 0.5))
                if frame['posture'].get('slouch_detected', False):
                    slouch_count += 1
            
            if 'gestures' in frame:
                fidgeting_scores.append(frame['gestures'].get('fidgeting_score', 0.3))
                gesture_counts.append(frame['gestures'].get('gesture_count', 0))
            
            if 'expressions' in frame:
                confidence_levels.append(
                    frame['expressions'].get('confidence_level', 0.6)
                )
                engagement_scores.append(
                    frame['expressions'].get('engagement_score', 0.6)
                )
        
        # Calculate individual scores
        eye_contact_score = ConfidenceScorer.calculate_eye_contact_score(
            gaze_scores, looking_away_durations
        )
        posture_score = ConfidenceScorer.calculate_posture_score(
            posture_scores, slouch_count
        )
        gesture_score = ConfidenceScorer.calculate_gesture_score(
            fidgeting_scores, gesture_counts
        )
        expression_score = ConfidenceScorer.calculate_expression_score(
            confidence_levels, engagement_scores
        )
        
        return {
            'eye_contact_percentage': eye_contact_score,
            'posture_score': posture_score,
            'expression_confidence': expression_score,
            'gesture_score': gesture_score
        }


def detect_filler_words(text: str) -> Dict[str, Any]:
    """
    Detect filler words in transcribed text
    
    Args:
        text: Transcribed text
        
    Returns:
        Dictionary with filler word analysis
    """
    filler_words_list = [
        'um', 'uh', 'like', 'you know', 'so', 'actually', 
        'basically', 'literally', 'right', 'okay', 'well',
        'i mean', 'kind of', 'sort of'
    ]
    
    text_lower = text.lower()
    words = text_lower.split()
    
    filler_analysis = {}
    total_filler_count = 0
    
    for filler in filler_words_list:
        count = text_lower.count(filler)
        if count > 0:
            filler_analysis[filler] = count
            total_filler_count += count
    
    return {
        'filler_words': filler_analysis,
        'total_filler_count': total_filler_count,
        'total_words': len(words),
        'filler_percentage': (total_filler_count / len(words) * 100) if words else 0
    }


def calculate_speech_pace(word_count: int, duration_seconds: float) -> float:
    """
    Calculate words per minute
    
    Args:
        word_count: Number of words spoken
        duration_seconds: Duration in seconds
        
    Returns:
        Words per minute
    """
    if duration_seconds <= 0:
        return 0.0
    
    return (word_count / duration_seconds) * 60
