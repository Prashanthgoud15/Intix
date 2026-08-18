import mongoose from 'mongoose';
import { JobRoles } from '../constants/index.js';

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    technologies: [{ type: String }],
    achievements: { type: String },
    challenges: { type: String },
});

const educationSchema = new mongoose.Schema({
    degree: { type: String },
    institution: { type: String },
    year: { type: String },
});

const resumeProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        jobRole: {
            type: String,
            enum: JobRoles,
            required: true,
        },
        candidateName: {
            type: String,
            default: 'Candidate',
        },
        currentRole: {
            type: String,
            default: 'Not specified',
        },
        experienceYears: {
            type: Number,
            default: 0,
        },
        keySkills: [{ type: String }],
        projects: [projectSchema],
        education: [educationSchema],
        certifications: [{ type: String }],
        achievements: [{ type: String }],
        strengths: [{ type: String }],
        interviewFocusAreas: [{ type: String }],

        // The raw text extracted from the PDF
        rawText: {
            type: String,
            select: false, // Don't return raw text by default to save bandwidth
        },

        // The generated interview plan (15 questions)
        interviewPlan: {
            type: mongoose.Schema.Types.Mixed, // Array of question objects
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries by user
resumeProfileSchema.index({ user: 1, createdAt: -1 });

const ResumeProfile = mongoose.model('ResumeProfile', resumeProfileSchema);

export default ResumeProfile;
