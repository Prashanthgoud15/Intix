/**
 * constants/index.js — Application-wide constants.
 * Import these instead of hardcoding strings anywhere.
 */

export const Roles = Object.freeze({
    USER: 'user',
    ADMIN: 'admin',
});

export const DifficultyLevels = Object.freeze({
    BASIC: 'basic',
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    EXPERT: 'expert',
});

// All job roles the platform supports (mirrors the Python Enum)
// Job roles offered in the frontend's role dropdown (ResumeUpload.jsx).
// IMPORTANT: this list must stay in sync with that frontend list — a role
// selected in the UI that isn't an exact string match here gets rejected by
// Zod validation with a 422, even though it was a completely valid dropdown
// selection. This exact mismatch happened before ("Cloud Architect" here
// vs "Cloud Engineer" — two different strings), which blocked resume
// upload entirely for anyone who picked that role. If you add a role to the
// frontend dropdown, add the identical string here too.
export const JobRoles = Object.freeze([
    // SOFTWARE & DEVELOPMENT
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Software Engineer',
    'Mobile App Developer',
    'Game Developer',

    // DATA & AI
    'Data Scientist',
    'Data Analyst',
    'Data Engineer',
    'Machine Learning Engineer',
    'AI Engineer',

    // CLOUD & INFRASTRUCTURE
    'DevOps Engineer',
    'Cloud Engineer',
    'Cloud Architect',
    'Solutions Architect',

    // SECURITY & QUALITY
    'Cybersecurity Engineer',
    'QA / Test Engineer',

    // PRODUCT & DESIGN
    'Product Manager',
    'UI/UX Designer',
    'Business Analyst',

    // OTHER
    'General',

    // Legacy roles kept for backward compatibility
    'Mobile Developer',
    'QA Engineer',
    'ML Engineer',
    'Security Engineer',
    'System Design',
]);

// Interview phases (mirrors resume_analyzer.py)
export const InterviewPhases = Object.freeze({
    WARM_UP: 'warm_up',
    ROLE_TECHNICAL: 'role_technical',
    HR_BEHAVIORAL: 'hr_behavioral',
    RESUME_DEEP_DIVE: 'resume_deep_dive',
    CODING_APTITUDE: 'coding_aptitude',
    ADVANCED_TECHNICAL: 'advanced_technical',
    CLOSING_HR: 'closing_hr',
});

export const HttpStatus = Object.freeze({
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
});

// Audio formats accepted by Groq Whisper
export const AllowedAudioFormats = Object.freeze([
    'webm', 'mp3', 'mp4', 'wav', 'ogg', 'm4a', 'flac',
]);

// MIME types accepted for resume upload — PDF only. text/plain was
// previously allowed here too, but the extraction pipeline (pdf-parse) can
// only actually process real PDF binaries, so a .txt upload would pass this
// filter and then fail (or silently produce garbage) at extraction — an
// allowed-but-broken path. PDF-only matches what the app actually supports.
export const AllowedResumeTypes = Object.freeze([
    'application/pdf',
]);
