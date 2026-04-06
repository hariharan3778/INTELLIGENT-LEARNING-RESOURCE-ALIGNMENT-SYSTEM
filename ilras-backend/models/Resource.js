const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        default: "",
    },
    fileUrl: {
        type: String,
        default: "",
    },
    fileType: {
        type: String,
        default: "unknown",
    },
    youtubeLink: {
        type: String,
        default: "",
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: false // Optional if they upload globally, but we'll enforce it for course-specific ones
    },
    subject: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        required: true,
    },
    dateAdded: {
        type: String, // Storing as formatted string (YYYY-MM-DD) for simplicity on the frontend, or use Date
        default: () => {
            const date = new Date();
            return date.toISOString().split('T')[0]; // "2024-02-10"
        }
    },
    facultyId: {
        type: String,
        // Can be changed to obj id if linking tightly to User model, 
        // string used for simplicity unless strict relational checks are needed.
        default: 'placeholder-faculty-id'
    }
});

module.exports = mongoose.model('Resource', ResourceSchema);
