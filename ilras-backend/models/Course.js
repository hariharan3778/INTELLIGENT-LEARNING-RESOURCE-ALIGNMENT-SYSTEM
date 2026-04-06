const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    instructor: {
        type: String,
        required: true
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    progress: {
        type: Number,
        default: 0
    },
    thumbnail: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        required: true
    },
    semester: {
        type: String, // e.g., "SEM 1", "SEM 2"
        default: "SEM 1"
    }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
