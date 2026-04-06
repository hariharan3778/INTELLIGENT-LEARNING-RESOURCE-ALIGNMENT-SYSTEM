const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const Resource = require('../models/Resource');
const auth = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const sharedAuth = [auth, authorizeRoles('student', 'faculty', 'admin')];

// GET /api/dashboard-data/courses
router.get('/courses', sharedAuth, async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        console.error('Error fetching dashboard courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/dashboard-data/resources (Global for students/faculty)
router.get('/resources', sharedAuth, async (req, res) => {
    try {
        const resources = await Resource.find().sort({ _id: -1 });
        res.json(resources);
    } catch (error) {
        console.error('Error fetching global resources:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/dashboard-data/notifications
router.get('/notifications', sharedAuth, async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [{ userId: req.user._id }, { userId: 'global' }]
        }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/dashboard-data/notifications/:id/read
router.put('/notifications/:id/read', sharedAuth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/dashboard-data/seed
router.post('/seed', sharedAuth, async (req, res) => {
    try {
        // Clear collections for this user only (ignoring generic Course seed since it's global)
        await Notification.deleteMany({ userId: req.user._id });

        // Seed Courses
        const dummyCourses = [
            { title: "Advanced MERN Stack Development", instructor: "Brad Traversy", level: "Advanced", progress: 65, category: "Web Development", thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
            { title: "Mastering C++ & Data Structures", instructor: "Abdul Bari", level: "Intermediate", progress: 20, category: "Programming", thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bfce8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
            { title: "Introduction to Cybersecurity", instructor: "NetworkChuck", level: "Beginner", progress: 90, category: "Security", thumbnail: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
            { title: "C Programming Fundamentals", instructor: "Jenny's Lectures", level: "Beginner", progress: 100, category: "Programming", thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" }
        ];

        // Only run if empty to avoid duplicating global catalogs for each user request
        const existingCourses = await Course.countDocuments();
        if (existingCourses === 0) {
            await Course.insertMany(dummyCourses);
        }

        // Seed Notifications
        const dummyNotifications = [
            { message: "System maintenance at midnight", type: "alert", userId: req.user._id },
            { message: "Assignment deadline approaching", type: "alert", userId: req.user._id },
            { message: "Message from Prof. Smith regarding your project", type: "mail", userId: req.user._id }
        ];
        await Notification.insertMany(dummyNotifications);

        res.status(201).json({ message: 'Dashboard data seeded successfully' });
    } catch (error) {
        console.error('Error seeding dashboard data:', error);
        res.status(500).json({ message: 'Server error seeding dashboard data' });
    }
});

// ================= BOOKMARKS API =================

// GET /api/dashboard-data/bookmarks
router.get('/bookmarks', sharedAuth, async (req, res) => {
    try {
        const user = await req.user.populate('savedResources');
        res.json(user.savedResources);
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/dashboard-data/bookmarks/:id
router.post('/bookmarks/:id', sharedAuth, async (req, res) => {
    try {
        const resourceId = req.params.id;

        // Prevent duplicate saves
        if (!req.user.savedResources.includes(resourceId)) {
            req.user.savedResources.push(resourceId);
            await req.user.save();
        }

        res.json({ message: 'Resource bookmarked successfully', savedResources: req.user.savedResources });
    } catch (error) {
        console.error('Error adding bookmark:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/dashboard-data/bookmarks/:id
router.delete('/bookmarks/:id', sharedAuth, async (req, res) => {
    try {
        const resourceId = req.params.id;
        req.user.savedResources = req.user.savedResources.filter(id => id.toString() !== resourceId);
        await req.user.save();

        res.json({ message: 'Resource removed from bookmarks', savedResources: req.user.savedResources });
    } catch (error) {
        console.error('Error removing bookmark:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ================= TIMETABLE API =================

// GET /api/dashboard-data/timetable
router.get('/timetable', sharedAuth, async (req, res) => {
    try {
        res.json(req.user.timetable || []);
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/dashboard-data/timetable
router.post('/timetable', sharedAuth, async (req, res) => {
    try {
        const { courseId, title, day, start, duration, type, color } = req.body;

        req.user.timetable.push({ courseId, title, day, start, duration, type, color });
        await req.user.save();

        res.json({ message: 'Class added to timetable', timetable: req.user.timetable });
    } catch (error) {
        console.error('Error adding to timetable:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// DELETE /api/dashboard-data/timetable/:blockId
router.delete('/timetable/:blockId', sharedAuth, async (req, res) => {
    try {
        req.user.timetable = req.user.timetable.filter(block => block._id.toString() !== req.params.blockId);
        await req.user.save();

        res.json({ message: 'Class removed from timetable', timetable: req.user.timetable });
    } catch (error) {
        console.error('Error removing from timetable:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
