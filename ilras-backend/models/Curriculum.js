const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema({
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    courseCode: { type: String, required: true },
    courseName: { type: String, required: true },
    type: { type: String, enum: ['Core', 'Elective'], required: true },
    credits: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Curriculum', curriculumSchema);
