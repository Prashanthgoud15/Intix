"""
Speech Analysis using Google Gemini API
Handles transcription and speech metrics without OpenAI
"""
import base64
import tempfile
import os
import time
from typing import Dict, Any
import google.generativeai as genai
from utils.scoring import detect_filler_words, calculate_speech_pace


class GeminiSpeechAnalyzer:
    """
    Analyzes speech using Google Gemini API
    """
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
    def transcribe_audio(self, audio_base64: str, audio_format: str = "webm") -> Dict[str, Any]:
        """
        Transcribe audio using Gemini API
        
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
                # Upload audio file to Gemini
                print(f"Uploading audio file to Gemini: {temp_audio_path}")
                audio_file = genai.upload_file(temp_audio_path)
                
                # Wait for file to be processed (ACTIVE state)
                print(f"Waiting for file to be processed... State: {audio_file.state.name}")
                max_wait = 30  # Maximum 30 seconds
                start_time = time.time()
                
                while audio_file.state.name != "ACTIVE":
                    if time.time() - start_time > max_wait:
                        raise Exception(f"File processing timeout. State: {audio_file.state.name}")
                    
                    time.sleep(1)
                    audio_file = genai.get_file(audio_file.name)
                    print(f"File state: {audio_file.state.name}")
                
                print(f"✅ File is ACTIVE and ready for transcription")
                
                # Transcribe using Gemini
                prompt = """Transcribe this audio recording accurately. 
                
Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
    "text": "the complete transcription",
    "duration_seconds": estimated duration in seconds (number),
    "word_count": number of words spoken
}"""
                
                response = self.model.generate_content([prompt, audio_file])
                result_text = response.text.strip()
                
                # Remove markdown code blocks if present
                if result_text.startswith('```json'):
                    result_text = result_text[7:]
                if result_text.startswith('```'):
                    result_text = result_text[3:]
                if result_text.endswith('```'):
                    result_text = result_text[:-3]
                result_text = result_text.strip()
                
                import json
                result = json.loads(result_text)
                
                # Extract data
                text = result.get('text', '')
                duration = float(result.get('duration_seconds', 0))
                word_count = result.get('word_count', len(text.split()))
                
                # Calculate metrics
                words_per_minute = calculate_speech_pace(word_count, duration)
                
                # Detect filler words
                filler_analysis = detect_filler_words(text)
                
                print(f"Gemini transcription successful: {word_count} words, {duration}s, {words_per_minute} WPM")
                
                # Clean up uploaded file from Gemini
                try:
                    genai.delete_file(audio_file.name)
                    print(f"✅ Cleaned up Gemini file: {audio_file.name}")
                except Exception as cleanup_error:
                    print(f"Warning: Could not delete Gemini file: {cleanup_error}")
                
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
            print(f"Error transcribing audio with Gemini: {e}")
            # Fallback: estimate from audio size
            try:
                audio_data = base64.b64decode(audio_base64.split(',')[1] if ',' in audio_base64 else audio_base64)
                estimated_duration = len(audio_data) / 16000  # Rough estimate
                
                return {
                    'text': '[Audio transcription unavailable - please speak your answer]',
                    'duration': estimated_duration,
                    'word_count': 0,
                    'words_per_minute': 0.0,
                    'filler_words': {},
                    'total_filler_count': 0,
                    'filler_percentage': 0.0,
                    'error': str(e)
                }
            except:
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
