export const generateQuestionPrompt = (jobRole, difficulty, avoidTopics, currentPhase = 'technical', performanceScore = null) => {
    let phaseInstructions = '';

    switch (currentPhase) {
        case 'intro':
            phaseInstructions = 'Generate a Warm-up / Introduction question. Generic, role-aware, not resume-specific. (e.g. "Tell me about yourself" or motivation for the role).';
            break;
        case 'technical':
            phaseInstructions = `Generate a Technical / Role-specific question for a ${jobRole}.

Infer the core programming language(s), frameworks, and CS fundamentals most
associated with a ${jobRole} role from the title itself (e.g. "Java Backend
Developer" -> Java/Spring; "Python Developer" -> Python; "Full Stack
Developer" -> JavaScript/React/Node; "Frontend Developer" -> JS/CSS/React).

Rotate across these question TYPES rather than defaulting to one:
- Language/CS fundamentals (majority of technical questions should be this
  type): e.g. "What's the difference between ArrayList and LinkedList in
  Java, and when would you use each?", "Explain Python's GIL and how it
  affects multithreading", "How does JavaScript's event loop handle async
  code?", "What's the time complexity of a HashMap lookup and why?"
- Applied/practical: a small, concrete coding or debugging scenario in that
  language — NOT a full system design problem.
- Occasionally (not the default): a lightweight, scoped system-design
  question — only if the role is genuinely senior/architect-level, and even
  then keep it small in scope, not a sprawling "design Twitter" prompt.

Do NOT make every technical question a large-scale system design question —
that was over-represented before and doesn't reflect what a real interview
for this role actually asks.`;
            break;
        case 'behavioral':
            phaseInstructions = 'Generate a Behavioral question. Use STAR-format only (conflict, failure, teamwork, leadership).';
            break;
        case 'hr':
            phaseInstructions = 'Generate an HR / Culture Fit question. Career goals, why this role, strengths/weaknesses.';
            break;
        case 'closing':
            phaseInstructions = 'Generate a Closing question. e.g. "any questions for us?" or final wrap-up.';
            break;
        default:
            phaseInstructions = `Generate a Technical question for a ${jobRole}.`;
    }

    let difficultyAdjustment = '';
    if (performanceScore !== null) {
        if (performanceScore >= 80) {
            difficultyAdjustment = 'The candidate answered the last question very well. Make this question slightly MORE challenging.';
        } else if (performanceScore < 50) {
            difficultyAdjustment = 'The candidate struggled with the last question. Make this question slightly MORE accessible/fundamental.';
        }
    }

    return `Generate a ${difficulty} difficulty interview question for a ${jobRole} position.

PHASE INSTRUCTIONS:
${phaseInstructions}

${difficultyAdjustment}

Recently asked questions (avoid these topics):
${avoidTopics}

CRITICAL REQUIREMENTS:
1. Question must be DIFFERENT from previously asked questions
2. Must be realistic for FAANG/top-tier interviews
3. Include 3 specific, actionable tips for answering
4. Response MUST be valid JSON - no extra text
5. Keep the question itself to 1-2 sentences, exactly how a real interviewer
   would actually say it out loud in conversation — no lengthy preamble, no
   multiple sub-questions bundled together

Return this JSON structure only:
{
    "question": "The complete question text (1-2 sentences, concise)",
    "category": "Category (Technical, Behavioral, System Design, Problem-Solving, etc)",
    "difficulty": "${difficulty}",
    "tips": ["Specific tip 1", "Specific tip 2", "Specific tip 3"]
}`;
};

export const generateQuestionSystemPrompt = `You are an experienced senior engineering manager at a top tech company.
Generate realistic interview questions that test genuine understanding, not surface-level knowledge.
You must return ONLY a valid JSON object, no other text.
The response MUST be valid, parseable JSON.`;

export const evaluateAnswerPrompt = (jobRole, question, answer) => {
    return `Evaluate this interview answer.

Position: ${jobRole}
Question: ${question}
Answer: ${answer}

Respond with ONLY this JSON:
{
    "score": <0-100>,
    "clarity_score": <0-100>,
    "relevance_score": <0-100>,
    "completeness_score": <0-100>,
    "feedback": "2-3 sentences of specific critique",
    "strengths": ["strength1", "strength2"],
    "areas_for_improvement": ["area1", "area2"]
}`;
};

export const evaluateAnswerSystemPrompt = `You are a STRICT Senior Engineering Manager at a top-tier tech company.
Evaluate this answer with the same rigor used in real hiring decisions.

SCORING GUIDELINES:
- 90-100: Exceptionally detailed, technically precise, demonstrates deep expertise (RARE)
- 70-89: Good answer with specific examples, some depth
- 50-69: Average - addresses question but lacks specific examples
- 30-49: Below expectations - vague or generic
- 0-29: Poor - doesn't address the question

Do NOT inflate scores. Generic answers should score 35-45, not 75.

You MUST return ONLY valid JSON.`;

export const sessionFeedbackPrompt = (metricsSummary, transcriptions, isResumeBased) => {
    return `Generate comprehensive interview feedback based on this session.

Metrics:
${metricsSummary}

Transcriptions (Q&A):
${transcriptions.join('\n\n')}

Context: ${isResumeBased ? 'Resume-based interview' : 'General interview'}

CRITICAL REQUIREMENTS:
1. EVIDENCE-LINKING: Every single strength, weakness, and recommendation MUST cite a specific question number (e.g., "On Q4 when asked about React hooks, you..."). Do not make generic claims.
2. RESUME FIT: If this is a resume-based interview, evaluate how well their answers aligned with their claimed resume skills.
3. SKIPPED QUESTIONS: If the candidate skipped questions (indicated by "[SKIPPED]"), explicitly mention this as an area for improvement. If the entire session was skipped or has no meaningful answers, state "Not enough data to evaluate" in the detailed feedback and do not hallucinate strengths.
4. NULL METRICS: If metrics are null or 0, it means the camera/microphone was off or no data was captured. Do not invent feedback about eye contact or posture if the data is missing.
5. NEVER cite a "[SKIPPED]" question as a strength — a skip has no content to praise. If you don't have 3 genuine, evidence-backed strengths, return fewer than 3 rather than padding the list with a vague or generic-sounding one just to fill it. The same applies to areas_for_improvement and recommendations — quality and honesty over hitting a target count.
6. Do not use generic filler phrases with no specific content behind them (e.g. "good communication skills", "showed strong potential", "demonstrated solid understanding") unless immediately followed by the specific evidence from the transcript that actually supports the claim.

Respond with ONLY this JSON structure:
{
    "detailed_feedback": "2-3 sentences of overall assessment",
    "resume_fit_score": ${isResumeBased ? '<0-100>' : 'null'},
    "resume_fit_analysis": "${isResumeBased ? '1-2 sentences explaining the fit score' : ''}",
    "strengths": ["strength1 (citing Q#)", "strength2 (citing Q#)", "strength3 (citing Q#)"],
    "areas_for_improvement": ["area1 (citing Q#)", "area2 (citing Q#)", "area3 (citing Q#)"],
    "recommendations": ["actionable step 1 (tied to an area of improvement)", "actionable step 2", "actionable step 3"]
}`;
};

export const sessionFeedbackSystemPrompt = `You are an expert interview coach providing constructive, specific, evidence-based feedback.
You MUST link every piece of feedback to a specific question number from the transcript.
Return ONLY valid JSON.`;
