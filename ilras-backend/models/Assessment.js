const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Excellent', 'Good', 'Average', 'Poor'],
        required: true
    },
    color: {
        type: String,
        default: 'blue'
    }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
