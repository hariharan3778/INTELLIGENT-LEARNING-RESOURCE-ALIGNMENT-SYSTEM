const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: { type: String, enum: ['alert', 'mail'], required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    userId: { type: String, required: true }
});

module.exports = mongoose.model('Notification', notificationSchema);
