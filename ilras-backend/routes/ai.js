const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIChat = require('../models/AIChat');

// POST /ask - Get response from AI tutor
router.post('/ask', authMiddleware, async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("AI Error: GEMINI_API_KEY is not set in backend .env");
            return res.status(500).json({ success: false, message: 'AI configuration missing' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const { prompt, chatId } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Prompt is required' });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are an elite, highly intelligent academic tutor for the ILRAS platform. Your goal is to help students learn, not just give them the answers. When a student asks a question, explain the underlying concepts clearly, use formatting (bullet points, bold text) for readability, and encourage critical thinking. Do not hallucinate courses that are not part of the standard curriculum. If the student asks about a complex topic, you MUST provide a clickable YouTube search link for them to learn more. Format the link strictly like this: [Watch a video on X](https://www.youtube.com/results?search_query=X). You can also use standard Markdown for bolding, bullet points, and code blocks."
        });

        let chat;
        let history = [];

        if (chatId) {
            chat = await AIChat.findOne({ _id: chatId, user: req.user._id });
            if (!chat) {
                return res.status(404).json({ success: false, message: 'Chat session not found' });
            }
            // Format history for Gemini
            history = chat.messages.map(m => ({
                role: m.role === 'ai' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));
        }

        const chatSession = model.startChat({
            history: history,
        });

        const result = await chatSession.sendMessage(prompt);
        const text = result.response.text();

        if (chat) {
            chat.messages.push({ role: 'user', content: prompt });
            chat.messages.push({ role: 'ai', content: text });
            await chat.save();
        } else {
            const title = prompt.split(' ').slice(0, 5).join(' ') + (prompt.split(' ').length > 5 ? '...' : '');
            chat = new AIChat({
                user: req.user._id,
                title: title || 'New Chat',
                messages: [
                    { role: 'user', content: prompt },
                    { role: 'ai', content: text }
                ]
            });
            await chat.save();
        }

        res.json({ success: true, answer: text, chatId: chat._id });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ success: false, message: 'AI Error: ' + error.message });
    }
});

// GET /history - Get all chat sessions for the user
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const chats = await AIChat.find({ user: req.user._id })
            .select('_id title updatedAt')
            .sort({ updatedAt: -1 });
        res.json({ success: true, chats });
    } catch (error) {
        console.error("Fetch History Error:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
    }
});

// GET /history/:id - Get a specific chat session with full messages
router.get('/history/:id', authMiddleware, async (req, res) => {
    try {
        const chat = await AIChat.findOne({ _id: req.params.id, user: req.user._id });
        if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
        res.json({ success: true, chat });
    } catch (error) {
        console.error("Fetch Chat Error:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch chat session' });
    }
});

// DELETE /history/:id - Delete a specific chat session
router.delete('/history/:id', authMiddleware, async (req, res) => {
    try {
        const chat = await AIChat.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
        res.json({ success: true, message: 'Chat deleted successfully' });
    } catch (error) {
        console.error("Delete Chat Error:", error);
        res.status(500).json({ success: false, message: 'Failed to delete chat session' });
    }
});

module.exports = router;
