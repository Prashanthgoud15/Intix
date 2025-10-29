"""
Resume Analysis Service using Gemini
Extracts candidate information and generates personalized interview questions
"""
import google.generativeai as genai
from typing import Dict, Any, List
import json


class ResumeAnalyzer:
    """
    Analyzes resumes and generates personalized interview questions
    """
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
    def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        """
        Analyze resume and extract key information
        
        Args:
            resume_text: Text content of the resume
            
        Returns:
            Dictionary with candidate profile and interview plan
        """
        try:
            prompt = f"""Analyze this resume and extract key information for conducting a professional interview.

Resume:
{resume_text}

Return ONLY a JSON object with this structure (no markdown, no extra text):
{{
    "candidate_name": "Full name or 'Candidate' if not found",
    "current_role": "Current job title or 'Not specified'",
    "experience_years": number (estimate from dates),
    "key_skills": ["skill1", "skill2", "skill3", ...],
    "projects": [
        {{"name": "project name", "description": "brief description", "technologies": ["tech1", "tech2"]}},
        ...
    ],
    "education": [
        {{"degree": "degree name", "institution": "school name", "year": "graduation year"}},
        ...
    ],
    "strengths": ["strength1", "strength2", ...],
    "interview_focus_areas": ["area1", "area2", "area3"]
}}

Be thorough but concise. Extract all relevant technical and professional details."""

            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean markdown formatting
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            profile = json.loads(result_text)
            
            print(f"✅ Resume analyzed for: {profile.get('candidate_name', 'Candidate')}")
            print(f"   Experience: {profile.get('experience_years', 0)} years")
            print(f"   Key skills: {', '.join(profile.get('key_skills', [])[:5])}")
            
            return profile
            
        except Exception as e:
            print(f"Error analyzing resume: {e}")
            return {
                "candidate_name": "Candidate",
                "current_role": "Not specified",
                "experience_years": 0,
                "key_skills": [],
                "projects": [],
                "education": [],
                "strengths": [],
                "interview_focus_areas": ["General technical skills", "Problem solving", "Communication"]
            }
    
    def generate_interview_plan(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate a progressive interview question plan (basic to advanced)
        
        Args:
            profile: Candidate profile from resume analysis
            
        Returns:
            List of questions with difficulty progression
        """
        try:
            candidate_name = profile.get('candidate_name', 'Candidate')
            current_role = profile.get('current_role', 'Not specified')
            experience_years = profile.get('experience_years', 0)
            key_skills = profile.get('key_skills', [])
            projects = profile.get('projects', [])
            focus_areas = profile.get('interview_focus_areas', [])
            
            prompt = f"""Create a professional interview question plan for this candidate.

Candidate Profile:
- Name: {candidate_name}
- Current Role: {current_role}
- Experience: {experience_years} years
- Key Skills: {', '.join(key_skills[:10])}
- Projects: {len(projects)} major projects
- Focus Areas: {', '.join(focus_areas)}

Generate 10 interview questions following this progression:

1-2: WARM-UP (Basic/Introductory)
- "Tell me about yourself" style questions
- General background and motivation
- Easy, conversational tone

3-5: INTERMEDIATE (Experience-based)
- Questions about their specific projects and technologies
- Real scenarios from their resume
- STAR method applicable

6-8: ADVANCED (Technical/Problem-solving)
- Deep technical questions based on their skills
- Complex problem-solving scenarios
- System design or architecture questions

9-10: EXPERT (Leadership/Strategic)
- Challenging scenarios requiring strategic thinking
- Leadership and decision-making
- Future-oriented questions

Return ONLY a JSON array (no markdown):
[
    {{
        "question_number": 1,
        "difficulty": "basic",
        "category": "Introduction",
        "question": "The actual question text",
        "context": "Why this question is relevant to their resume",
        "tips": ["tip1", "tip2"]
    }},
    ...
]

Make questions highly personalized to their resume. Reference their actual projects, skills, and experience."""

            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean markdown formatting
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            questions = json.loads(result_text)
            
            print(f"✅ Generated {len(questions)} personalized questions")
            print(f"   Progression: Basic → Intermediate → Advanced → Expert")
            
            return questions
            
        except Exception as e:
            print(f"Error generating interview plan: {e}")
            # Fallback to generic questions
            return self._get_fallback_questions()
    
    def _get_fallback_questions(self) -> List[Dict[str, Any]]:
        """Fallback questions if resume analysis fails"""
        return [
            {
                "question_number": 1,
                "difficulty": "basic",
                "category": "Introduction",
                "question": "Tell me about yourself and your background.",
                "context": "Opening question to understand the candidate",
                "tips": ["Keep it concise (2-3 minutes)", "Focus on professional journey", "End with why you're here"]
            },
            {
                "question_number": 2,
                "difficulty": "basic",
                "category": "Motivation",
                "question": "What interests you most about this role?",
                "context": "Understanding candidate motivation",
                "tips": ["Show genuine interest", "Connect to your skills", "Be specific"]
            },
            {
                "question_number": 3,
                "difficulty": "medium",
                "category": "Experience",
                "question": "Describe a challenging project you've worked on recently.",
                "context": "Assessing problem-solving and technical skills",
                "tips": ["Use STAR method", "Highlight your specific contributions", "Explain the impact"]
            }
        ]
    
    def get_next_question(self, 
                         interview_plan: List[Dict[str, Any]], 
                         current_index: int,
                         previous_answers: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Get the next question from the interview plan
        
        Args:
            interview_plan: Full list of questions
            current_index: Current question index
            previous_answers: Optional list of previous answers for context
            
        Returns:
            Next question with metadata
        """
        if current_index >= len(interview_plan):
            return None
        
        question = interview_plan[current_index]
        
        # Add progression indicator
        total_questions = len(interview_plan)
        question['progress'] = {
            'current': current_index + 1,
            'total': total_questions,
            'percentage': int((current_index + 1) / total_questions * 100)
        }
        
        return question
