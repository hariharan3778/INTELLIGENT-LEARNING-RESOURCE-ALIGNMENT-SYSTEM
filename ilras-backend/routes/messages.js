const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// POST /api/messages/send
router.post('/send', auth, async (req, res) => {
    try {
        let { receiverId, courseId, content } = req.body;

        // Auto-resolve string names to actual faculty ObjectIds (skip if receiver is 'group' or 'admin')
        if (receiverId && receiverId !== 'group' && receiverId !== 'admin' && !mongoose.Types.ObjectId.isValid(receiverId)) {
            const facultyUser = await User.findOne({ name: receiverId, role: 'faculty' })
                || await User.findOne({ role: 'faculty' }); // Fallback to any faculty

            if (!facultyUser) {
                return res.status(404).json({ message: 'No registered faculty found to receive message.' });
            }
            receiverId = facultyUser._id.toString();
        }

        const newMessage = new Message({
            senderId: req.user._id,
            receiverId,
            courseId: courseId || null,
            content,
            isRead: false
        });

        await newMessage.save();

        // Dispatch Notification to receiver for direct messages
        if (receiverId !== 'group') {
            const notification = new Notification({
                userId: receiverId === 'admin' ? 'global' : receiverId, // If to admin, maybe notify system or 'global' for dashboard counter
                message: `New message from ${req.user.name || 'a user'}`,
                type: 'mail'
            });
            await notification.save();
        }

        // Manually fetch sender since senderId is a String in schema, populate won't work automatically
        const senderUser = await User.findById(req.user._id).select('name role picture');

        res.status(201).json({
            success: true,
            message: {
                ...newMessage._doc,
                sender: senderUser // Send the complete fetched user object back to the client
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error sending message' });
    }
});

// GET /api/messages
// Fetches conversation history between logged-in user and any other specified user
router.get('/:otherUserId', auth, async (req, res) => {
    try {
        let { otherUserId } = req.params;
        const currentUserId = req.user._id;

        // Auto-resolve string names to actual faculty ObjectIds
        if (otherUserId && otherUserId !== 'admin' && !mongoose.Types.ObjectId.isValid(otherUserId)) {
            const facultyUser = await User.findOne({ name: otherUserId, role: 'faculty' })
                || await User.findOne({ role: 'faculty' });
            if (!facultyUser) {
                return res.status(404).json({ message: 'Instructor not found.' });
            }
            otherUserId = facultyUser._id.toString();
        }

        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUserId },
                // Special case for admin: if I am the student, otherUserId might be 'admin'
                (otherUserId === 'admin') ? { senderId: 'admin', receiverId: currentUserId } : null,
                (otherUserId === 'admin') ? { senderId: currentUserId, receiverId: 'admin' } : null,
                // If I am admin and otherUserId is a student, I might have replied as 'admin'
                (req.user.role === 'admin') ? { senderId: 'admin', receiverId: otherUserId } : null,
                (req.user.role === 'admin') ? { senderId: otherUserId, receiverId: 'admin' } : null
            ].filter(Boolean)
        }).sort({ createdAt: 1 }); // Oldest first for chat display

        // Also fetch the name of the other user for header UI
        let otherUser = null;
        if (mongoose.Types.ObjectId.isValid(otherUserId)) {
            otherUser = await User.findById(otherUserId).select('-password');
        } else if (otherUserId === 'admin') {
            otherUser = { _id: 'admin', name: 'ILRAS Admin', role: 'admin' };
        }

        res.json({
            messages,
            otherUser
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
});

// GET /api/messages/inbox/recent
// Helper for faculty/students to see whoever messaged them
router.get('/inbox/recent', auth, async (req, res) => {
    try {
        const myId = req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        // Find messages where I am sender or receiver 
        // OR if I am admin, any message addressed TO 'admin'
        const allMessages = await Message.find({
            $or: [
                { receiverId: myId },
                { senderId: myId },
                isAdmin ? { receiverId: 'admin' } : null,
                isAdmin ? { senderId: 'admin' } : null
            ].filter(Boolean)
        }).sort({ createdAt: -1 });

        const uniqueContacts = new Map();

        allMessages.forEach(msg => {
            // If it's a group message, we might treat it differently, but for direct inbox:
            if (msg.receiverId === 'group') return;

            const partnerId = msg.senderId === myId ? msg.receiverId : msg.senderId;
            if (partnerId === 'admin') {
                if (!uniqueContacts.has('admin')) {
                    uniqueContacts.set('admin', msg);
                }
                return;
            }

            if (!uniqueContacts.has(partnerId)) {
                uniqueContacts.set(partnerId, msg);
            }
        });

        // Resolve names
        const contacts = [];
        for (let [id, msg] of uniqueContacts) {
            if (id === 'admin') {
                contacts.push({
                    user: { _id: 'admin', name: 'ILRAS Admin (Support)', role: 'admin', picture: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff' },
                    lastMessage: msg
                });
                continue;
            }
            const user = await User.findById(id).select('name role picture');
            if (user) {
                contacts.push({ user, lastMessage: msg });
            }
        }

        res.json(contacts);
    } catch (error) {
        console.error('Error fetching inbox:', error);
        res.status(500).json({ message: 'Server error fetching inbox' });
    }
});

// GET /api/messages/group/:courseId
// Fetches the course-wide group chat
router.get('/group/:courseId', auth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const messages = await Message.find({
            receiverId: 'group',
            courseId: courseId
        }).sort({ createdAt: 1 });

        // Populate sender names manually just like we do above or via a quick join
        const populatedMessages = await Promise.all(messages.map(async (msg) => {
            const user = await User.findById(msg.senderId).select('name role picture');
            return {
                ...msg._doc,
                sender: user || { name: 'Unknown User' }
            };
        }));

        res.json({ messages: populatedMessages });
    } catch (error) {
        console.error('Error fetching group messages:', error);
        res.status(500).json({ message: 'Server error fetching group messages' });
    }
});

// GET /api/messages/unread-count
router.get('/unread/count', auth, async (req, res) => {
    try {
        const myId = req.user._id.toString();
        const count = await Message.countDocuments({
            receiverId: myId,
            isRead: false,
            courseId: null // Only for direct messages for now
        });
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/messages/mark-read/:otherUserId
router.put('/mark-read/:otherUserId', auth, async (req, res) => {
    try {
        const myId = req.user._id.toString();
        const { otherUserId } = req.params;

        await Message.updateMany(
            { senderId: otherUserId, receiverId: myId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
