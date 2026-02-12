const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student'
    },
    profilePicture: {
        type: String,
        default: ''
    },
    bio: {
        type: String // Teacher bio
    },
    // New Fields for Sprint 6
    phone: { type: String },
    village: { type: String }, // Student
    educationLevel: { type: String }, // Student
    qualification: { type: String }, // Teacher
    subjectExpertise: { type: String }, // Teacher
    teachingExperience: { type: Number }, // Teacher
    idProof: { type: String }, // Teacher (URL)
    reasonForJoining: { type: String }, // Teacher

    status: {
        type: String,
        enum: ['active', 'inactive', 'pending', 'rejected'],
        default: 'active'
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // Streak Tracking
    streaks: {
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        lastLoginDate: { type: Date }
    },

    // Progress Tracking
    progress: [{
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
        quizScores: [{
            quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
            score: { type: Number },
            date: { type: Date, default: Date.now }
        }]
    }],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
