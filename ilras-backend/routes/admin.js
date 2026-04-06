const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Resource = require('../models/Resource');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// Middleware to ensure user is admin
const adminAuth = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Admin only.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error in Admin Auth Middleware' });
    }
};

// GET /api/admin/stats
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeStudents = await User.countDocuments({ role: 'student' });
        const newResources = await Resource.countDocuments(); // Assume total resources for now

        res.json({
            totalUsers,
            activeStudents,
            newResources,
            systemHealth: "99.8%"
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server error fetching admin stats' });
    }
});

// GET /api/admin/activity
router.get('/activity', auth, adminAuth, async (req, res) => {
    try {
        // Fetch latest users
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(3);
        const recentResources = await Resource.find().sort({ createdAt: -1 }).limit(3);

        // Map to a common activity structure
        const activities = [];

        recentUsers.forEach(u => {
            activities.push({
                _id: 'u_' + u._id,
                type: 'user',
                title: 'New User Registration',
                description: `${u.name} registered as a ${u.role}`,
                timestamp: u.createdAt,
                actor: u.name,
                tag: 'USER'
            });
        });

        recentResources.forEach(r => {
            // Ideally we populate faculty name, falling back to a generic String if unstructured.
            const uploaderName = r.facultyId ? "Faculty Member" : "System";
            activities.push({
                _id: 'r_' + r._id,
                type: 'resource',
                title: 'Resource Upload',
                description: `Someone uploaded "${r.title}" course material`,
                timestamp: r.createdAt || new Date(),
                actor: uploaderName,
                tag: 'RESOURCE'
            });
        });

        // Sort by timestamp descending
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json(activities.slice(0, 10)); // return top 10
    } catch (error) {
        console.error('Error fetching admin activity:', error);
        res.status(500).json({ message: 'Server error fetching activity' });
    }
});

// --- USER MANAGEMENT ---

// GET /api/admin/users
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
});

// POST /api/admin/users
// Manual user creation
router.post('/users', auth, adminAuth, async (req, res) => {
    try {
        const { name, email, role, password } = req.body;

        const existingId = await User.findOne({ email });
        if (existingId) return res.status(400).json({ success: false, message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            role: role || 'student',
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ success: true, message: 'User created successfully', user: { name: newUser.name, email: newUser.email, role: newUser.role } });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, message: 'Server error creating user' });
    }
});

// PUT /api/admin/users/:id
// Update user details
router.put('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;

        await user.save();
        res.json({ success: true, message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Server error updating user' });
    }
});

// PUT /api/admin/users/:id/block
router.put('/users/:id/block', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.isBlocked = !user.isBlocked;
        await user.save();
        res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: user.isBlocked });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update user block status' });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'User revoked and deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

// --- COURSE MANAGEMENT ---

const Course = require('../models/Course');

// GET /api/admin/courses
router.get('/courses', auth, adminAuth, async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json({ success: true, courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching courses' });
    }
});

// POST /api/admin/courses
router.post('/courses', auth, adminAuth, async (req, res) => {
    try {
        const { title, instructor, level, category, thumbnail } = req.body;
        const newCourse = new Course({
            title,
            instructor,
            level,
            category,
            thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=500&q=60'
        });
        await newCourse.save();
        res.status(201).json({ success: true, message: 'Course added successfully', course: newCourse });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add course' });
    }
});

// PUT /api/admin/courses/:id
// Update course details
router.put('/courses/:id', auth, adminAuth, async (req, res) => {
    try {
        const { title, instructor, level, category, thumbnail } = req.body;
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        course.title = title || course.title;
        course.instructor = instructor || course.instructor;
        course.level = level || course.level;
        course.category = category || course.category;
        course.thumbnail = thumbnail || course.thumbnail;

        await course.save();
        res.json({ success: true, message: 'Course updated successfully', course });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, message: 'Server error updating course' });
    }
});

// DELETE /api/admin/courses/:id
router.delete('/courses/:id', auth, adminAuth, async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Course removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete course' });
    }
});

module.exports = router;
