"""
AI Service for GPT-4 integration
Handles question generation and answer evaluation
"""
from openai import OpenAI
from typing import List, Dict, Any
import json


class AIService:
    """
    Handles OpenAI GPT-4 interactions for interview questions and evaluation
    """
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"
    
    def generate_interview_question(
        self,
        job_role: str = "General",
        difficulty: str = "medium",
        previous_questions: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate an interview question using GPT-4
        
        Args:
            job_role: Target job role
            difficulty: Question difficulty (easy, medium, hard)
            previous_questions: List of previously asked questions to avoid repetition
            
        Returns:
            Dictionary with question, category, difficulty, and tips
        """
        previous_questions = previous_questions or []
        
        system_prompt = """You are an expert interview coach and hiring manager. 
Generate realistic, relevant interview questions that assess both technical skills and soft skills.
Return your response as a JSON object with the following structure:
{
    "question": "The interview question",
    "category": "Category (e.g., Technical, Behavioral, Problem-Solving)",
    "difficulty": "easy/medium/hard",
    "tips": ["tip1", "tip2", "tip3"]
}"""
        
        user_prompt = f"""Generate a {difficulty} difficulty interview question for a {job_role} position.

Previous questions asked (avoid similar topics):
{json.dumps(previous_questions, indent=2) if previous_questions else "None"}

Requirements:
- Make it realistic and commonly asked in actual interviews
- Ensure it's different from previous questions
- Include 3 helpful tips for answering
- For behavioral questions, use the STAR method framework
- For technical questions, focus on practical scenarios"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.8,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                'question': result.get('question', 'Tell me about yourself.'),
                'category': result.get('category', 'General'),
                'difficulty': result.get('difficulty', difficulty),
                'tips': result.get('tips', [
                    'Take your time to think',
                    'Structure your answer clearly',
                    'Use specific examples'
                ])
            }
        
        except Exception as e:
            print(f"Error generating question: {e}")
            # Fallback question
            return {
                'question': 'Tell me about a challenging project you worked on and how you overcame obstacles.',
                'category': 'Behavioral',
                'difficulty': difficulty,
                'tips': [
                    'Use the STAR method (Situation, Task, Action, Result)',
                    'Be specific about your role and contributions',
                    'Highlight what you learned from the experience'
                ]
            }
    
    def evaluate_answer(
        self,
        question: str,
        answer: str,
        job_role: str = "General"
    ) -> Dict[str, Any]:
        """
        Evaluate an interview answer using GPT-4
        
        Args:
            question: The interview question
            answer: The candidate's answer
            job_role: Target job role for context
            
        Returns:
            Dictionary with scores, feedback, strengths, and improvements
        """
        system_prompt = """You are an expert interview evaluator and career coach.
Evaluate interview answers objectively and provide constructive feedback.
Return your response as a JSON object with the following structure:
{
    "score": 85,
    "clarity_score": 90,
    "relevance_score": 85,
    "completeness_score": 80,
    "feedback": "Overall feedback paragraph",
    "strengths": ["strength1", "strength2", "strength3"],
    "improvements": ["improvement1", "improvement2"]
}

Scoring criteria (0-100):
- Clarity: How well-structured and understandable is the answer?
- Relevance: How well does it address the question?
- Completeness: Does it cover all important aspects?
- Overall: Weighted average of the above"""
        
        user_prompt = f"""Evaluate this interview answer for a {job_role} position.

Question: {question}

Answer: {answer}

Provide:
1. Scores (0-100) for clarity, relevance, and completeness
2. An overall score (weighted average)
3. Constructive feedback (2-3 sentences)
4. 2-3 key strengths
5. 1-2 areas for improvement

Be honest but encouraging. Focus on actionable feedback."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                'score': float(result.get('score', 70)),
                'clarity_score': float(result.get('clarity_score', 70)),
                'relevance_score': float(result.get('relevance_score', 70)),
                'completeness_score': float(result.get('completeness_score', 70)),
                'feedback': result.get('feedback', 'Good effort. Keep practicing!'),
                'strengths': result.get('strengths', ['Clear communication']),
                'improvements': result.get('improvements', ['Add more specific examples'])
            }
        
        except Exception as e:
            print(f"Error evaluating answer: {e}")
            return {
                'score': 70.0,
                'clarity_score': 70.0,
                'relevance_score': 70.0,
                'completeness_score': 70.0,
                'feedback': 'Unable to evaluate at this time. Please try again.',
                'strengths': ['Attempted to answer the question'],
                'improvements': ['Try to be more specific']
            }
    
    def generate_session_feedback(
        self,
        metrics: Dict[str, float],
        transcriptions: List[str],
        questions: List[str]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive feedback for the entire session
        
        Args:
            metrics: Session performance metrics
            transcriptions: List of transcribed answers
            questions: List of questions asked
            
        Returns:
            Dictionary with detailed feedback and recommendations
        """
        system_prompt = """You are an expert interview coach providing comprehensive session feedback.
Analyze the candidate's overall performance and provide actionable recommendations.
Return your response as a JSON object with:
{
    "detailed_feedback": "2-3 paragraph comprehensive analysis",
    "strengths": ["strength1", "strength2", "strength3"],
    "areas_for_improvement": ["area1", "area2", "area3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}"""
        
        user_prompt = f"""Provide comprehensive feedback for this interview session.

Performance Metrics:
- Eye Contact: {metrics.get('eye_contact_percentage', 0):.1f}%
- Posture Score: {metrics.get('posture_score', 0):.1f}/100
- Expression Confidence: {metrics.get('expression_confidence', 0):.1f}/100
- Gesture Score: {metrics.get('gesture_score', 0):.1f}/100
- Speech Clarity: {metrics.get('speech_clarity_score', 0):.1f}/100
- Filler Words: {metrics.get('filler_word_count', 0)} occurrences
- Speech Pace: {metrics.get('speech_pace', 0):.1f} WPM
- Overall Confidence: {metrics.get('overall_confidence', 0):.1f}/100

Number of Questions Answered: {len(questions)}

Sample Answers:
{json.dumps(transcriptions[:3], indent=2) if transcriptions else "No transcriptions available"}

Provide:
1. Detailed feedback analyzing their performance
2. Top 3 strengths
3. Top 3 areas for improvement
4. 3 specific, actionable recommendations

Be encouraging but honest. Focus on growth and improvement."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                'detailed_feedback': result.get(
                    'detailed_feedback',
                    'You showed good effort in this interview session. Keep practicing!'
                ),
                'strengths': result.get('strengths', [
                    'Completed the interview session',
                    'Attempted all questions',
                    'Showed engagement'
                ]),
                'areas_for_improvement': result.get('areas_for_improvement', [
                    'Work on maintaining eye contact',
                    'Reduce filler words',
                    'Improve posture'
                ]),
                'recommendations': result.get('recommendations', [
                    'Practice mock interviews regularly',
                    'Record yourself to identify areas for improvement',
                    'Research common interview questions'
                ])
            }
        
        except Exception as e:
            print(f"Error generating session feedback: {e}")
            return {
                'detailed_feedback': 'Thank you for completing this interview session. Continue practicing to improve your skills.',
                'strengths': [
                    'Completed the session',
                    'Engaged with the questions',
                    'Showed willingness to improve'
                ],
                'areas_for_improvement': [
                    'Maintain better eye contact',
                    'Work on posture',
                    'Reduce filler words'
                ],
                'recommendations': [
                    'Practice regularly with mock interviews',
                    'Review your performance metrics',
                    'Focus on one improvement area at a time'
                ]
            }
