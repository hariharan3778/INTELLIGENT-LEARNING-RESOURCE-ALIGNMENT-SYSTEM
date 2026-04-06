require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Import the new Auth Route
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const dashboardRoutes = require('./routes/dashboard');
const curriculumRoutes = require('./routes/curriculum');
const dashboardApiRoutes = require('./routes/dashboardApi');
const facultyRoutes = require('./routes/faculty');
const messagesRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES ---
// This tells the server: "Any request starting with /api/auth goes to auth.js"
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/dashboard-data', dashboardApiRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', analyticsRoutes); // Registered analytics route
app.use('/api/ai', aiRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('ILRAS Backend is Running! 🚀');
});

app.listen(PORT, () => {
  console.log(`\n✅ Server is running on http://localhost:${PORT}`);
});