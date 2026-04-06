const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// GET /api/analytics/student
router.get('/student', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Fetch real assessments
        const assessments = await Assessment.find({ userId }).sort({ date: -1 });

        // Calculate Average Score
        const avgScore = assessments.length > 0
            ? (assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length).toFixed(1)
            : 0;

        // 2. Calculate dynamic study hours from Timetable constraints
        // We sum the duration of all timetable blocks to find weekly scheduled hours.
        const timetable = req.user.timetable || [];
        const totalWeeklyHours = timetable.reduce((sum, block) => sum + (block.duration || 0), 0);
        
        // Let's assume Total Study Hours is the weekly hours * an arbitrary number of weeks (e.g. 4) for demonstration,
        // or just show the active weekly load. Let's just track the active weekly load for now as Total Hours logged.
        
        // 3. Weekly activity for chart - mapped from timetable explicitly!
        const daysMap = { 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0 };
        timetable.forEach(block => {
            if (daysMap[block.day] !== undefined) {
                daysMap[block.day] += (block.duration || 0);
            }
        });

        const chartData = [
            { day: 'Mon', hours: daysMap['Monday'] },
            { day: 'Tue', hours: daysMap['Tuesday'] },
            { day: 'Wed', hours: daysMap['Wednesday'] },
            { day: 'Thu', hours: daysMap['Thursday'] },
            { day: 'Fri', hours: daysMap['Friday'] },
            { day: 'Sat', hours: daysMap['Saturday'] },
            { day: 'Sun', hours: daysMap['Sunday'] }
        ];

        res.json({
            summary: {
                totalStudyHours: totalWeeklyHours,
                averageScore: avgScore,
                certificatesEarned: req.user.certificatesEarned || 0,
                studyHoursTrend: "+0%", // Dynamic logic would go here
                scoreTrend: "+0%"
            },
            recentAssessments: assessments.slice(0, 5),
            chartData: chartData
        });
    } catch (error) {
        console.error('Error fetching student analytics:', error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
});

module.exports = router;
