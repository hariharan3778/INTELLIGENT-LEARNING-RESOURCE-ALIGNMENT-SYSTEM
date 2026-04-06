const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    hours: {
        type: Number,
        required: true,
        default: 0
    },
    userId: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
