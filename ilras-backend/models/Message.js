const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: String, // Or ObjectId if linking to a strict User schema
        required: true
    },
    receiverId: {
        type: String,
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: false
    },
    content: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
