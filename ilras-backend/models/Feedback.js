const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    instructorName: {
        type: String,
        required: true
    },
    courseName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timeAgo: {
        type: String,
        required: true
    },
    stars: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 5
    },
    userId: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
