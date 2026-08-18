import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Roles } from '../constants/index.js';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Don't return password by default
        },
        role: {
            type: String,
            enum: Object.values(Roles),
            default: Roles.USER,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Incremented on logout (or could be used for "log out everywhere").
        // Included in every issued refresh token's payload; refreshToken()
        // rejects any token whose tokenVersion doesn't match the current
        // value, which is what actually makes logout invalidate the
        // session server-side instead of just clearing localStorage.
        // Deliberately NOT checked on every access-token-authenticated
        // request (only on refresh) — that would need a DB lookup per
        // request for marginal benefit, given access tokens are already
        // short-lived. This is a proportionate fix, not a full auth redesign.
        tokenVersion: {
            type: Number,
            default: 0,
        },
        lastLoginAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password validity
userSchema.methods.isPasswordMatch = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
