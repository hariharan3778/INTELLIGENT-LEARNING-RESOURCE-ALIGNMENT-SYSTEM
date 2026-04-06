const express = require('express');
const Curriculum = require('../models/Curriculum');

const router = express.Router();

// GET /api/curriculum?department=XYZ&semester=N
router.get('/', async (req, res) => {
    try {
        const { department, semester } = req.query;

        // Build query object dynamically based on provided params
        const query = {};
        if (department) query.department = department.toUpperCase();
        if (semester) query.semester = parseInt(semester);

        const curriculum = await Curriculum.find(query).sort({ courseCode: 1 });
        res.json(curriculum);
    } catch (error) {
        console.error('Error fetching curriculum:', error);
        res.status(500).json({ message: 'Server error while fetching curriculum' });
    }
});

// POST /api/curriculum/seed - Clears and inserts dummy data
router.post('/seed', async (req, res) => {
    try {
        await Curriculum.deleteMany({}); // Clear existing data

        const dummyData = [
            // Given CSBS Sem 5 Data
            { department: 'CSBS', semester: 5, courseCode: '22CB601', courseName: 'COMPUTER NETWORKS', type: 'Core', credits: 4 },
            { department: 'CSBS', semester: 5, courseCode: '22CB602', courseName: 'INFORMATION SECURITY', type: 'Core', credits: 3 },
            { department: 'CSBS', semester: 5, courseCode: '22CB603', courseName: 'ARTIFICIAL INTELLIGENCE', type: 'Core', credits: 4 },
            { department: 'CSBS', semester: 5, courseCode: '22CB604', courseName: 'IT WORKSHOP', type: 'Core', credits: 3 },
            { department: 'CSBS', semester: 5, courseCode: '22CB008', courseName: 'MODERN WEB APPLICATIONS', type: 'Elective', credits: 3 },
            { department: 'CSBS', semester: 5, courseCode: '22CB021', courseName: 'MACHINE LEARNING', type: 'Elective', credits: 3 },
            { department: 'CSBS', semester: 5, courseCode: '22CB028', courseName: 'FINANCIAL MANAGEMENT', type: 'Elective', credits: 3 },

            // More dummy courses spread across departments
            { department: 'CSE', semester: 1, courseCode: '22CS101', courseName: 'PROGRAMMING IN C', type: 'Core', credits: 4 },
            { department: 'CSE', semester: 2, courseCode: '22CS201', courseName: 'DATA STRUCTURES', type: 'Core', credits: 4 },
            { department: 'CSE', semester: 3, courseCode: '22CS301', courseName: 'DATABASE MANAGEMENT SYSTEMS', type: 'Core', credits: 4 },
            { department: 'CSE', semester: 4, courseCode: '22CS401', courseName: 'OPERATING SYSTEMS', type: 'Core', credits: 4 },

            { department: 'IT', semester: 1, courseCode: '22IT101', courseName: 'INTRODUCTION TO IT', type: 'Core', credits: 3 },
            { department: 'IT', semester: 3, courseCode: '22IT301', courseName: 'SOFTWARE ENGINEERING', type: 'Core', credits: 3 },
            { department: 'IT', semester: 5, courseCode: '22IT501', courseName: 'CLOUD COMPUTING', type: 'Elective', credits: 3 },

            { department: 'ECE', semester: 2, courseCode: '22EC201', courseName: 'ELECTRONIC CIRCUITS', type: 'Core', credits: 4 },
            { department: 'ECE', semester: 4, courseCode: '22EC401', courseName: 'DIGITAL SIGNAL PROCESSING', type: 'Core', credits: 4 },
            { department: 'ECE', semester: 6, courseCode: '22EC601', courseName: 'VLSI DESIGN', type: 'Elective', credits: 3 },

            { department: 'EEE', semester: 3, courseCode: '22EE301', courseName: 'ELECTRICAL MACHINES', type: 'Core', credits: 4 },
            { department: 'EEE', semester: 5, courseCode: '22EE501', courseName: 'POWER SYSTEMS', type: 'Core', credits: 4 },
            { department: 'EEE', semester: 7, courseCode: '22EE701', courseName: 'RENEWABLE ENERGY', type: 'Elective', credits: 3 },

            { department: 'MECH', semester: 2, courseCode: '22ME201', courseName: 'ENGINEERING MECHANICS', type: 'Core', credits: 4 },
            { department: 'MECH', semester: 4, courseCode: '22ME401', courseName: 'THERMODYNAMICS', type: 'Core', credits: 4 },
            { department: 'MECH', semester: 6, courseCode: '22ME601', courseName: 'ROBOTICS', type: 'Elective', credits: 3 },
            { department: 'MECH', semester: 8, courseCode: '22ME801', courseName: 'SUPPLY CHAIN MANAGEMENT', type: 'Elective', credits: 3 }
        ];

        await Curriculum.insertMany(dummyData);
        res.json({ message: 'Curriculum seeded successfully!', count: dummyData.length });
    } catch (error) {
        console.error('Error seeding curriculum:', error);
        res.status(500).json({ message: 'Server error while seeding curriculum' });
    }
});

module.exports = router;
