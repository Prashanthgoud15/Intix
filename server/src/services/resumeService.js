import pdfParse from 'pdf-parse';
import Groq from 'groq-sdk';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import ResumeProfile from '../models/ResumeProfile.model.js';
import { callGroqWithModelFallback } from '../utils/groqRetry.js';
import {
    resumeProfileOutputSchema,
    validateInterviewPlan,
    validateAiOutput,
} from '../validators/aiOutput.validators.js';

class ResumeService {
    constructor() {
        this.client = new Groq({ apiKey: env.GROQ_API_KEY });
        this.model = 'openai/gpt-oss-20b'; // Switched from 70b due to rate limits
        // Used as a fallback model, not a same-model retry — see
        // groqRetry.js's callGroqWithModelFallback for why. Two consecutive
        // same-model attempts both timing out at the exact configured limit
        // meant the model was genuinely slow under current load, which a
        // same-model retry can't fix but a different model's separate
        // queue/capacity might.
        this.secondaryModel = 'openai/gpt-oss-120b';
    }


    _cleanJsonResponse(text) {
        let cleanText = text.trim();

        // Strip markdown code fences if present
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();

        // The 8B model frequently prepends conversational text before the
        // actual JSON (e.g. "Here's the resume analysis:" or "Sure, here is
        // the JSON:"), which broke JSON.parse even after fence-stripping
        // above — this was the exact cause of resume analysis failing with
        // "Unexpected token 'H', 'Here's the'... is not valid JSON".
        // Fix: locate the first real JSON opening bracket and the matching
        // final closing bracket, and parse only that slice, ignoring any
        // prose the model added before or after it.
        const firstBrace = cleanText.indexOf('{');
        const firstBracket = cleanText.indexOf('[');
        let start = -1;
        if (firstBrace === -1) start = firstBracket;
        else if (firstBracket === -1) start = firstBrace;
        else start = Math.min(firstBrace, firstBracket);

        if (start > 0) {
            const openChar = cleanText[start];
            const closeChar = openChar === '{' ? '}' : ']';
            const end = cleanText.lastIndexOf(closeChar);
            if (end > start) {
                cleanText = cleanText.substring(start, end + 1);
            }
        }

        // Trailing commas before a closing bracket/brace (e.g. `"tip3",]`)
        // are a common, well-understood LLM mistake and safe to fix with a
        // simple regex — unlike other malformations (an unescaped quote or
        // control character breaking a string mid-value), there's no
        // ambiguity about what a trailing comma should become. This doesn't
        // attempt to fix every possible malformation; it's a cheap, safe
        // improvement on top of the real fix, which is that a parse failure
        // now correctly triggers trying a second model (see
        // generateInterviewPlan / analyzeResumeText).
        cleanText = cleanText.replace(/,(\s*[}\]])/g, '$1');

        return cleanText.trim();
    }

    /**
     * Extract text from a PDF buffer
     */
    async extractTextFromPdf(pdfBuffer) {
        try {
            const data = await pdfParse(pdfBuffer);
            return data.text;
        } catch (error) {
            logger.error(`PDF parsing failed: ${error.message}`);
            throw new Error('Failed to extract text from PDF. Please ensure it is a valid PDF file.');
        }
    }

    /**
     * Analyze resume text using Groq
     */
    async analyzeResumeText(resumeText) {
        // Cap the raw resume text before it goes into the prompt. An
        // uncapped 2-page resume can easily run 1500-2500+ tokens on its
        // own, which combined with the instruction text and a generous
        // max_tokens reservation can exceed Groq's free-tier TPM limit
        // (6000 tokens/minute) — this is exactly what caused a 413
        // "Request too large" error during real testing. Most of the
        // useful signal (name, skills, recent projects) is front-loaded in
        // a resume anyway, so a ~6000 character cap (~1500 tokens) is a
        // safe, generous limit that still covers a full 1-2 page resume.
        const MAX_RESUME_CHARS = 6000;
        const truncated = resumeText.length > MAX_RESUME_CHARS;
        const cappedText = truncated ? resumeText.slice(0, MAX_RESUME_CHARS) : resumeText;
        if (truncated) {
            logger.warn(`Resume text truncated from ${resumeText.length} to ${MAX_RESUME_CHARS} characters before sending to Groq (TPM budget protection).`);
        }

        const prompt = `You are an expert resume analyzer preparing for a technical interview. 
Analyze this resume THOROUGHLY and extract ALL relevant details that an interviewer would want to know.

RESUME TEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cappedText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXTRACTION INSTRUCTIONS:
1. Extract EVERY project mentioned - don't miss any
2. For each project, capture: name, description, technologies used, achievements, and challenges
3. List ALL technical skills mentioned (programming languages, frameworks, tools, platforms)
4. Note specific achievements with metrics if available (e.g., "improved performance by 40%")
5. Identify the candidate's experience level and domain expertise

Return ONLY a JSON object (no markdown, no extra text):
{
    "candidate_name": "Full name from resume, or 'Candidate' if not found",
    "current_role": "Most recent job title or 'Not specified'",
    "experience_years": <number>,
    "key_skills": [
        "skill1", "skill2", "skill3"
    ],
    "projects": [
        {
            "name": "Exact project name from resume",
            "description": "What the project does/did (1-2 sentences)",
            "technologies": ["tech1", "tech2", "tech3"],
            "achievements": "Key accomplishments or impact (if mentioned)",
            "challenges": "Technical challenges solved (if mentioned)"
        }
    ],
    "education": [
        {
            "degree": "Degree name",
            "institution": "University/College name",
            "year": "Graduation year or 'Expected YYYY'"
        }
    ],
    "certifications": ["Certification 1", "Certification 2"],
    "achievements": ["Notable achievement 1", "Notable achievement 2"],
    "strengths": ["Technical strength 1", "Technical strength 2"],
    "interview_focus_areas": [
        "Focus area 1",
        "Focus area 2",
        "Focus area 3"
    ]
}

IMPORTANT: Be THOROUGH. Extract as much detail as possible.`;

        try {
            // Same fix as generateInterviewPlan below: parse + validate
            // happen INSIDE this factory, so a malformed response from the
            // primary model correctly triggers trying the secondary model,
            // instead of the parse failure only being discovered after
            // model-fallback already considered the call "successful."
            const result = await callGroqWithModelFallback(
                [this.model, this.secondaryModel],
                async (model) => {
                    const response = await this.client.chat.completions.create({
                        model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.6,
                        // Trimmed from 4096: the output here is one
                        // structured profile object, not a large document —
                        // this doesn't need a huge completion budget, and
                        // Groq's free-tier TPM limit counts prompt +
                        // max_tokens together, so an oversized reservation
                        // here eats into the budget for no benefit.
                        max_tokens: 3000,
                    });
                    const cleanText = this._cleanJsonResponse(response.choices[0].message.content);
                    const parsed = JSON.parse(cleanText);
                    // Validated, not just parsed — a syntactically valid
                    // JSON blob missing "projects" entirely, or with a
                    // garbage experience_years value, is just as unusable as
                    // invalid JSON, and now fails the same way (caught
                    // below, thrown onward — see the comment there on why
                    // this no longer falls back to a fake profile).
                    return validateAiOutput(resumeProfileOutputSchema, parsed, 'Resume analysis output');
                },
                {
                    // One attempt per model (not 2 attempts on the same
                    // model): if this model is genuinely slow right now, a
                    // same-model retry hits the identical wall. Trying the
                    // 70b model next has a real chance since it runs on
                    // separate capacity. 20s per model — generous enough for
                    // a normal response, without letting one slow model
                    // consume the whole request budget.
                    timeoutMs: 20000,
                    label: 'Resume analysis',
                }
            );

            logger.info(`Resume analysis succeeded: ${result.projects.length} project(s), ${result.key_skills.length} skill(s) extracted for "${result.candidate_name}"`);
            return result;
        } catch (error) {
            // CHANGED: this used to catch the failure here and silently
            // return a fake generic profile ("Candidate", no skills, no
            // projects), letting the rest of the pipeline continue as if
            // the resume had actually been read. That is explicitly the
            // "fake successful AI result" behavior this app must not do —
            // a user who uploaded a real resume would see a session that
            // *looked* personalized but wasn't, with no indication anything
            // had gone wrong. Instead: rethrow. The caller (processResume)
            // no longer catches this either, so it propagates all the way
            // to resume.controller.js as a real error, which the existing
            // frontend UI already handles correctly (shows "Failed to
            // analyze resume — please try again", with "Skip Resume" as an
            // explicit way to continue without personalization). The user
            // now gets an honest signal instead of a silently degraded
            // session.
            logger.error(`Resume analysis failed after retries: ${error.message}`);
            throw new Error(`Resume analysis failed: ${error.message}`);
        }
    }

    /**
     * Generate an interview plan based on the analyzed profile
     */
    /**
     * Builds a lean, capped-size version of the analyzed profile to inject
     * into the plan-generation prompt — this is the core fix for the 413
     * "Request too large" error. The full profile object can carry long
     * project descriptions, achievements, and challenges for every project;
     * none of that verbosity is needed for the LLM to write good questions,
     * it just needs to know WHAT was built and WITH WHAT. Trimming this
     * aggressively (max 3 projects, short descriptions, capped skill/cert
     * lists) keeps prompt size small and predictable regardless of how
     * detailed the original resume was.
     */
    _buildCompactProfile(profile) {
        const truncate = (str, maxLen) => {
            if (!str) return '';
            const s = String(str);
            return s.length > maxLen ? s.slice(0, maxLen).trim() + '…' : s;
        };

        return {
            name: profile.candidate_name || 'Candidate',
            role: profile.current_role || 'Not specified',
            experience_years: profile.experience_years || 0,
            skills: (profile.key_skills || []).slice(0, 10),
            projects: (profile.projects || []).slice(0, 3).map(p => ({
                name: p.name || 'Unnamed',
                stack: (p.technologies || []).slice(0, 5),
                description: truncate(p.description, 100),
            })),
            education: (profile.education || []).slice(0, 1).map(e => `${e.degree || ''} - ${e.institution || ''}`.trim()),
            certifications: (profile.certifications || []).slice(0, 5),
        };
    }

    async generateInterviewPlan(profile, jobRole = 'General') {
        const compact = this._buildCompactProfile(profile);
        const hasProjects = compact.projects.length > 0;

        const systemPrompt = `You are a REAL interviewer conducting a structured technical interview for a ${jobRole} position.
You have thoroughly read the candidate's resume. You will generate questions that feel EXACTLY like a real interview.
You must return ONLY a valid JSON array of exactly 16 questions, no other text.`;

        const resumeDiveInstructions = hasProjects
            ? `MUST reference SPECIFIC project names from the resume below. Ask about implementation details, architecture decisions, and challenges. Use phrases like "I see you built [PROJECT NAME]..." Ask HOW specific features work internally, and about trade-offs made.`
            : `Ask about their past work experience, what they built, technical decisions made, and their most impactful contribution.`;

        // Compact JSON profile instead of a long hand-formatted block — this
        // is the main token-size fix. A resume with 5+ detailed projects
        // used to inflate this section significantly; now it's capped
        // regardless of how much detail the original resume/analysis had.
        const prompt = `Generate a COMPLETE REALISTIC INTERVIEW for a ${jobRole} position.

CANDIDATE PROFILE (compact):
${JSON.stringify(compact)}

Generate EXACTLY 16 questions following this EXACT STRUCTURE:

PHASE 1 — WARM-UP / INTRODUCTION (Q1-2): Generic, role-aware. Q1: "Tell me about yourself". Q2: motivation for ${jobRole}.

PHASE 2 — RESUME / PROJECT DEEP-DIVE (Q3-5): ${resumeDiveInstructions} Include a "projectTag" field with the project name being discussed.

PHASE 3 — TECHNICAL / ROLE-SPECIFIC (Q6-10): Use the candidate's actual skills listed above (e.g. "Java" -> ask ArrayList vs LinkedList; "Python" -> ask about GIL, list vs tuple; "React" -> ask about hooks, virtual DOM). Most of these 5 should be concrete language/CS fundamentals grounded in their actual skills — NOT abstract system design. At most ONE can be a small applied/scenario question.

PHASE 4 — BEHAVIORAL (Q11-13): STAR-format only (conflict, failure, teamwork, leadership). phase="behavioral".

PHASE 5 — HR / CULTURE FIT (Q14-15): Career goals, why this role, strengths/weaknesses. phase="hr", separate from behavioral.

PHASE 6 — CLOSING (Q16): e.g. "any questions for us?"

RULES:
- Q6-10 MUST be specific to ${jobRole}
- Q3-5 MUST reference actual resume content if projects exist
- No question repeats in meaning
- Keep each "question" to 1-2 sentences, said like a real interviewer — no lengthy preamble or bundled sub-questions. Setup/context goes in "context", not the question.

JSON format per question:
[{"question_number":1,"phase":"warm_up","difficulty":"basic","category":"Introduction","projectTag":"","question":"...","context":"...","tips":["t1","t2","t3"]}]

Valid phases: "warm_up","resume_deep_dive","technical","behavioral","hr","closing"
Valid difficulties: "basic","medium","hard","expert"
`;

        try {
            // IMPORTANT: parsing and validation happen INSIDE this factory
            // function, not after callGroqWithModelFallback returns. This
            // was the actual gap causing a real failure: the primary model
            // returned malformed JSON (a genuine LLM bug — an unescaped
            // character breaking array syntax), which threw at JSON.parse
            // — but that parse step used to happen AFTER the model-fallback
            // call had already "succeeded" (the HTTP request itself was
            // fine), so the secondary model was never even attempted. Now a
            // parse or validation failure is treated as a failure of THAT
            // model's attempt, which correctly triggers trying the next
            // model before giving up to the static fallback.
            const plan = await callGroqWithModelFallback(
                [this.model, this.secondaryModel],
                async (model) => {
                    const response = await this.client.chat.completions.create({
                        model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.6,
                        // Reduced from 4500: real content need is roughly
                        // 1600-2200 tokens for 16 questions with tips
                        // (verified by estimate, not just guessed) — 3600
                        // keeps healthy headroom while asking the model to
                        // generate less, which also helps actual response
                        // time, not just TPM budget.
                        max_tokens: 3600,
                    });
                    const cleanText = this._cleanJsonResponse(response.choices[0].message.content);
                    const parsed = JSON.parse(cleanText);
                    // Validated against the full schema: exactly checks
                    // question_number is 1-16, phase/difficulty are real
                    // enum values, and — critically — rejects duplicate
                    // question_numbers or duplicate question text, which a
                    // bare Array.isArray + length check would have let
                    // straight through.
                    return validateInterviewPlan(parsed);
                },
                {
                    // CHANGED FROM same-model-retry to model-fallback: two
                    // consecutive attempts on the SAME model both timed out
                    // at exactly the same configured limit in real testing —
                    // that pattern means the model was genuinely slow under
                    // current load right now, not a one-off blip a same-model
                    // retry could fix. 25s per model (up from 18s, since this
                    // response is larger than the resume-analysis call), then
                    // falls through to the 70b model on separate capacity if
                    // the fast model is struggling, before finally falling
                    // back to the static question bank.
                    timeoutMs: 25000,
                    label: 'Interview plan generation',
                }
            );

            logger.info(`Interview plan generated successfully: ${plan.length} questions for "${jobRole}"`);
            return this._enforceOpeningQuestion(plan, jobRole);
        } catch (error) {
            // Same reasoning as the resume-analysis fallback above: make this
            // impossible to miss in the logs. If you see this line, the
            // session used the generic static question bank, not real
            // resume-derived content, regardless of what the UI showed.
            logger.error(`⚠️  INTERVIEW PLAN GENERATION FELL BACK TO STATIC GENERIC QUESTIONS — resume content will NOT be reflected in this session. Cause: ${error.message}`);
            return this._getFallbackQuestions(jobRole);
        }
    }

    /**
     * Guarantees the session always opens with a real "Tell me about
     * yourself" question, regardless of what the model actually returned.
     * The prompt already instructs this explicitly, but the 8B model doesn't
     * reliably follow it — this makes it deterministic instead of hoping.
     */
    _enforceOpeningQuestion(plan, jobRole) {
        if (!Array.isArray(plan) || plan.length === 0) {
            return this._getFallbackQuestions(jobRole);
        }
        plan[0] = {
            ...plan[0],
            question_number: 1,
            phase: 'warm_up',
            difficulty: 'basic',
            category: 'Introduction',
            projectTag: '',
            question: 'Tell me about yourself — your background, experience, and what brings you here today.',
        };
        return plan;
    }

    _getFallbackQuestions(jobRole = 'General') {
        return [
            {
                question_number: 1, phase: 'warm_up', difficulty: 'basic', category: 'Introduction', projectTag: '',
                question: 'Tell me about yourself — your background, experience, and what brings you here today.',
                context: 'Opening question', tips: ['Keep it 2-3 minutes', 'Focus on professional journey', 'End with why you are here']
            },
            {
                question_number: 2, phase: 'warm_up', difficulty: 'basic', category: 'Motivation', projectTag: '',
                question: `What interests you about the ${jobRole} role specifically?`,
                context: 'Understanding motivation', tips: ['Show genuine interest', 'Connect your skills', 'Be specific']
            },
            {
                question_number: 3, phase: 'resume_deep_dive', difficulty: 'medium', category: 'Project Experience', projectTag: 'Past Project',
                question: 'Tell me about the most complex project you have worked on. Walk me through the architecture.',
                context: 'Technical depth', tips: ['Explain your role', 'Cover tech stack', 'Discuss challenges']
            },
            {
                question_number: 4, phase: 'resume_deep_dive', difficulty: 'hard', category: 'Problem Solving', projectTag: 'Past Project',
                question: 'Describe a bug or performance issue in that project that took a long time to solve. How did you debug it?',
                context: 'Debugging skills', tips: ['Walk through your process', 'Mention tools', 'Explain root cause']
            },
            {
                question_number: 5, phase: 'resume_deep_dive', difficulty: 'medium', category: 'Architecture', projectTag: 'Past Project',
                question: 'What trade-offs did you have to make when building that system?',
                context: 'Decision making', tips: ['Discuss alternatives', 'Explain why you chose your approach']
            },
            {
                question_number: 6, phase: 'technical', difficulty: 'medium', category: `${jobRole} Technical`, projectTag: '',
                question: `What are the most important skills and technologies a ${jobRole} should master today?`,
                context: 'Domain check', tips: ['Cover fundamentals and modern tools', 'Explain why each matters']
            },
            {
                question_number: 7, phase: 'technical', difficulty: 'medium', category: `${jobRole} Technical`, projectTag: '',
                question: `Walk me through how you would approach building a new feature from scratch as a ${jobRole}.`,
                context: 'Process', tips: ['Cover planning to deployment', 'Mention testing', 'Discuss collaboration']
            },
            {
                question_number: 8, phase: 'technical', difficulty: 'medium', category: `${jobRole} Technical`, projectTag: '',
                question: 'Explain a technical concept you recently learned and how you applied it.',
                context: 'Continuous learning', tips: ['Be specific', 'Show practical application']
            },
            {
                question_number: 9, phase: 'technical', difficulty: 'hard', category: 'System Design', projectTag: '',
                question: 'Design a scalable system for a startup expecting rapid growth. What architecture would you propose?',
                context: 'Architecture', tips: ['Start with requirements', 'Discuss components', 'Address scalability']
            },
            {
                question_number: 10, phase: 'technical', difficulty: 'expert', category: 'Strategic', projectTag: '',
                question: 'What is a technology or architectural decision you have seen go wrong? What would you do differently?',
                context: 'Judgment', tips: ['Be specific', 'Show reasoning', 'Demonstrate learning']
            },
            {
                question_number: 11, phase: 'behavioral', difficulty: 'medium', category: 'Teamwork', projectTag: '',
                question: 'Tell me about a time you had a disagreement with a colleague. How did you resolve it?',
                context: 'Conflict resolution', tips: ['Use STAR method', 'Stay professional', 'Focus on resolution']
            },
            {
                question_number: 12, phase: 'behavioral', difficulty: 'medium', category: 'Pressure', projectTag: '',
                question: 'Describe a situation where you had to deliver under a tight deadline or failed to meet one. What was the outcome?',
                context: 'Handling pressure', tips: ['Show prioritization', 'Highlight the result', 'Discuss lessons learned']
            },
            {
                question_number: 13, phase: 'behavioral', difficulty: 'medium', category: 'Leadership', projectTag: '',
                question: 'Tell me about a time you took the initiative to improve a process or lead a project without being asked.',
                context: 'Leadership and initiative', tips: ['Use STAR method', 'Focus on your specific actions', 'Highlight the positive impact']
            },
            {
                question_number: 14, phase: 'hr', difficulty: 'basic', category: 'Self-assessment', projectTag: '',
                question: 'What would you say are your top 3 strengths and one area you are actively improving?',
                context: 'Self-awareness', tips: ['Be honest', 'Give examples', 'Show growth mindset']
            },
            {
                question_number: 15, phase: 'hr', difficulty: 'basic', category: 'Career Goals', projectTag: '',
                question: 'Where do you see yourself professionally in the next 3-5 years?',
                context: 'Career vision', tips: ['Align with the role', 'Show ambition', 'Connect to company growth']
            },
            {
                question_number: 16, phase: 'closing', difficulty: 'basic', category: 'Closing', projectTag: '',
                question: 'Do you have any questions for us about the role or the company?',
                context: 'Closing', tips: ['Ask about team culture', 'Ask about tech stack', 'Show enthusiasm']
            }
        ];
    }

    /**
     * Process the entire resume flow: extract -> analyze -> generate plan -> save to DB
     */
    async processResume(userId, pdfBuffer, jobRole) {
        // 1. Extract text
        const rawText = await this.extractTextFromPdf(pdfBuffer);

        if (rawText.trim().length < 100) {
            logger.error(`⚠️  RESUME EXTRACTION LOOKS BROKEN — only ${rawText.trim().length} characters extracted from the PDF. This is almost certainly a scanned/image-only PDF or a parsing failure.`);
            throw new Error('Could not extract enough text from this PDF. Please ensure it is a text-based PDF, not a scanned image.');
        }

        // 2. Analyze text to get profile
        const profileData = await this.analyzeResumeText(rawText);

        // 3. Generate interview plan based on profile
        const interviewPlan = await this.generateInterviewPlan(profileData, jobRole);

        // 4. Save to database
        const resumeProfile = await ResumeProfile.create({
            user: userId,
            jobRole,
            candidateName: profileData.candidate_name,
            currentRole: profileData.current_role,
            experienceYears: profileData.experience_years,
            keySkills: profileData.key_skills,
            projects: profileData.projects,
            education: profileData.education,
            certifications: profileData.certifications,
            achievements: profileData.achievements,
            strengths: profileData.strengths,
            interviewFocusAreas: profileData.interview_focus_areas,
            rawText,
            interviewPlan,
        });

        return resumeProfile;
    }
}

export default new ResumeService();
