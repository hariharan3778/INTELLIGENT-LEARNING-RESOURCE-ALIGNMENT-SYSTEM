const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const studentAuth = [auth, authorizeRoles('student', 'admin')];

// GET /api/dashboard/activity
router.get('/activity', studentAuth, async (req, res) => {
    try {
        const activity = await Activity.find({ userId: req.user._id });
        // Sort logic could go here, or we trust seed order
        res.json(activity);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/dashboard/feedback
router.get('/feedback', studentAuth, async (req, res) => {
    try {
        const feedback = await Feedback.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/dashboard/seed
router.post('/seed', studentAuth, async (req, res) => {
    try {
        // Clear existing for this user only
        await Activity.deleteMany({ userId: req.user._id });
        await Feedback.deleteMany({ userId: req.user._id });

        // Seed Activity
        const dummyActivity = [
            { day: 'Mon', hours: 3.5, userId: req.user._id },
            { day: 'Tue', hours: 5.0, userId: req.user._id },
            { day: 'Wed', hours: 2.0, userId: req.user._id },
            { day: 'Thu', hours: 6.5, userId: req.user._id },
            { day: 'Fri', hours: 4.0, userId: req.user._id },
            { day: 'Sat', hours: 7.0, userId: req.user._id },
            { day: 'Sun', hours: 5.5, userId: req.user._id }
        ];
        await Activity.insertMany(dummyActivity);

        // Seed Feedback
        const dummyFeedback = [
            {
                instructorName: "Dr. Emily Chen",
                courseName: "Advanced JavaScript",
                message: "Excellent work on your final project! Your implementation of async/await was spot on.",
                timeAgo: "2 hours ago",
                stars: 5,
                userId: req.user._id
            },
            {
                instructorName: "Prof. Michael Brooks",
                courseName: "Data Science",
                message: "Great progress on the data visualization module. Consider exploring more color palettes.",
                timeAgo: "1 day ago",
                stars: 4,
                userId: req.user._id
            }
        ];
        await Feedback.insertMany(dummyFeedback);

        res.status(201).json({ message: 'Dashboard data seeded successfully' });
    } catch (error) {
        console.error('Error seeding dashboard:', error);
        res.status(500).json({ message: 'Server error seeding dashboard' });
    }
});

module.exports = router;
