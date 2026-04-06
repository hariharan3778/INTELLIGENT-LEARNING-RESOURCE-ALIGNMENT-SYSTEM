const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // No two users can have the same email
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'], // Only these 3 roles are allowed
    default: 'student',
  },
  picture: {
    type: String, // URL to their Google profile pic
  },
  googleId: {
    type: String, // Unique ID from Google
    required: false,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  password: {
    type: String,
    required: false, // Required for manual auth, not for Google auth
  },
  loginOtp: { 
    type: String, 
    select: false 
  },
  loginOtpExpire: { 
    type: Date, 
    select: false 
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  savedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  timetable: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    title: String,
    day: String,
    start: String,
    duration: Number,
    type: String, // 'Lecture', 'Lab', 'Seminar'
    color: String // Tailwind gradient class
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  certificatesEarned: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
});

module.exports = mongoose.model('User', UserSchema);