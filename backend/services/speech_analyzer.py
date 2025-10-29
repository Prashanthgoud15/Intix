"""
Speech Analysis using OpenAI Whisper API
Handles transcription and speech metrics
"""
import base64
import tempfile
import os
from typing import Dict, Any
from openai import OpenAI
from utils.scoring import detect_filler_words, calculate_speech_pace


class SpeechAnalyzer:
    """
    Analyzes speech using OpenAI Whisper API
    """
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
    
    def transcribe_audio(self, audio_base64: str, audio_format: str = "webm") -> Dict[str, Any]:
        """
        Transcribe audio using Whisper API
        
        Args:
            audio_base64: Base64 encoded audio data
            audio_format: Audio format (webm, mp3, wav, etc.)
            
        Returns:
            Dictionary with transcription and metrics
        """
        try:
            # Decode base64 audio
            if ',' in audio_base64:
                audio_base64 = audio_base64.split(',')[1]
            
            audio_data = base64.b64decode(audio_base64)
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=f'.{audio_format}'
            ) as temp_audio:
                temp_audio.write(audio_data)
                temp_audio_path = temp_audio.name
            
            try:
                # Transcribe using Whisper
                with open(temp_audio_path, 'rb') as audio_file:
                    transcript = self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="verbose_json"
                    )
                
                # Extract text and duration
                text = transcript.text
                duration = transcript.duration if hasattr(transcript, 'duration') else 0.0
                
                # Calculate metrics
                words = text.split()
                word_count = len(words)
                words_per_minute = calculate_speech_pace(word_count, duration)
                
                # Detect filler words
                filler_analysis = detect_filler_words(text)
                
                return {
                    'text': text,
                    'duration': duration,
                    'word_count': word_count,
                    'words_per_minute': words_per_minute,
                    'filler_words': filler_analysis['filler_words'],
                    'total_filler_count': filler_analysis['total_filler_count'],
                    'filler_percentage': filler_analysis['filler_percentage']
                }
            
            finally:
                # Clean up temporary file
                if os.path.exists(temp_audio_path):
                    os.unlink(temp_audio_path)
        
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return {
                'text': '',
                'duration': 0.0,
                'word_count': 0,
                'words_per_minute': 0.0,
                'filler_words': {},
                'total_filler_count': 0,
                'filler_percentage': 0.0,
                'error': str(e)
            }
    
    def analyze_speech_patterns(self, transcriptions: list) -> Dict[str, Any]:
        """
        Analyze speech patterns across multiple transcriptions
        
        Args:
            transcriptions: List of transcription results
            
        Returns:
            Aggregated speech metrics
        """
        if not transcriptions:
            return {
                'total_words': 0,
                'average_wpm': 0.0,
                'total_filler_count': 0,
                'filler_percentage': 0.0,
                'clarity_score': 50.0
            }
        
        total_words = sum(t.get('word_count', 0) for t in transcriptions)
        total_duration = sum(t.get('duration', 0) for t in transcriptions)
        total_filler_count = sum(t.get('total_filler_count', 0) for t in transcriptions)
        
        average_wpm = calculate_speech_pace(total_words, total_duration)
        filler_percentage = (total_filler_count / total_words * 100) if total_words > 0 else 0
        
        # Calculate clarity score
        # Ideal WPM: 120-160, penalize for filler words
        optimal_wpm = 140
        wpm_score = 100 - min(50, abs(average_wpm - optimal_wpm) / 2)
        filler_penalty = filler_percentage * 2
        clarity_score = max(0, min(100, wpm_score - filler_penalty))
        
        return {
            'total_words': total_words,
            'average_wpm': average_wpm,
            'total_filler_count': total_filler_count,
            'filler_percentage': filler_percentage,
            'clarity_score': clarity_score
        }
