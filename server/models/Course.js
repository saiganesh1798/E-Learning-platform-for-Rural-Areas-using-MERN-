const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    thumbnail: {
        type: String // URL to image
    },
    price: {
        type: Number,
        default: 0 // Free by default for rural focus, or low cost
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lessons: [{ // Simplified reference for now, detailed model later
        title: String,
        url: String,
        type: { type: String, enum: ['video', 'document', 'quiz'] },
        interactiveQuizzes: [{
            timestamp: Number,
            question: String,
            options: [String],
            correctOptionIndex: Number,
            explanation: String
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Course', CourseSchema);
