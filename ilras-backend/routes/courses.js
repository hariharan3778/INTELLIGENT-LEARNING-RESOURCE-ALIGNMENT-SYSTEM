const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Resource = require('../models/Resource');
const auth = require('../middleware/authMiddleware');

// GET /api/courses
// Fetch all courses
router.get('/', auth, async (req, res) => {
    try {
        let courses = await Course.find();

        // Auto-seed courses if none exist (fixes "courses not found" issue)
        if (courses.length === 0) {
            const dummyCourses = [
                { title: "Engineering Mathematics I", instructor: "Dr. Raman", level: "Beginner", progress: 0, thumbnail: "https://picsum.photos/seed/math01/500/300", category: "Common" },
                { title: "Technical English", instructor: "Prof. Sarah", level: "Beginner", progress: 0, thumbnail: "https://picsum.photos/seed/eng01/500/300", category: "Common" },
                { title: "Programming in C", instructor: "Mr. Linus", level: "Beginner", progress: 0, thumbnail: "https://picsum.photos/seed/cprog/500/300", category: "Common" },
                { title: "Data Structures and Algorithms", instructor: "Dr. Turing", level: "Intermediate", progress: 0, thumbnail: "https://picsum.photos/seed/dsa/500/300", category: "CSE" },
                { title: "Web Technology", instructor: "Dr. Berners-Lee", level: "Intermediate", progress: 0, thumbnail: "https://picsum.photos/seed/web/500/300", category: "IT" }
            ];
            await Course.insertMany(dummyCourses);
            courses = await Course.find();
        }

        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Server error fetching courses' });
    }
});

// GET /api/courses/:id/resources
router.get('/:id/resources', auth, async (req, res) => {
    try {
        let resources = await Resource.find({ courseId: req.params.id }).sort({ _id: -1 });

        // Auto-seed resources if none exist for this course (fixes "not videos found" issue)
        if (resources.length === 0) {
            const course = await Course.findById(req.params.id);
            if (course) {
                const dummyResources = [
                    {
                        title: `${course.title} - Intro Video`,
                        fileType: 'video',
                        youtubeLink: 'https://www.youtube.com/watch?v=wXhTHyIgQ_U', // A safe educational demo video or dummy link
                        courseId: course._id,
                        subject: course.category,
                        difficulty: course.level
                    },
                    {
                        title: `${course.title} - Study Materials`,
                        fileType: 'pdf',
                        link: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // A safe dummy PDF
                        courseId: course._id,
                        subject: course.category,
                        difficulty: course.level
                    }
                ];
                await Resource.insertMany(dummyResources);
                resources = await Resource.find({ courseId: req.params.id }).sort({ _id: -1 });
            }
        }

        res.json(resources);
    } catch (error) {
        console.error('Error fetching course resources:', error);
        res.status(500).json({ message: 'Server error fetching resources' });
    }
});

// POST /api/courses/seed
// Insert dummy courses into the database
router.post('/seed', async (req, res) => {
    try {
        const dummyCourses = [
            // Common Courses
            { title: "Engineering Mathematics I", instructor: "Dr. Raman", level: "Beginner", progress: 0, thumbnail: "https://picsum.photos/seed/math01/500/300", category: "Common", semester: "SEM 1" },
            { title: "Technical English", instructor: "Prof. Sarah", level: "Beginner", progress: 0, thumbnail: "https://picsum.photos/seed/eng01/500/300", category: "Common", semester: "SEM 1" },
            { title: "Programming in C", instructor: "Mr. Linus", level: "Beginner", progress: 0, thumbnail: "https://picsum.photos/seed/cprog/500/300", category: "Common", semester: "SEM 1" },
            { title: "Engineering Physics", instructor: "Dr. Newton", level: "Beginner", progress: 0, thumbnail: "https://picsum.photos/seed/phys01/500/300", category: "Common", semester: "SEM 2" },

            // CSE Courses
            { title: "Data Structures and Algorithms", instructor: "Dr. Turing", level: "Intermediate", progress: 0, thumbnail: "https://picsum.photos/seed/dsa/500/300", category: "CSE", semester: "SEM 3" },
            { title: "Operating Systems", instructor: "Prof. Dijkstra", level: "Advanced", progress: 0, thumbnail: "https://picsum.photos/seed/os1/500/300", category: "CSE", semester: "SEM 4" },
            { title: "Database Management Systems", instructor: "Dr. Codd", level: "Intermediate", progress: 0, thumbnail: "https://picsum.photos/seed/dbms/500/300", category: "CSE", semester: "SEM 3" },
            { title: "Computer Networks", instructor: "Prof. Cerf", level: "Advanced", progress: 0, thumbnail: "https://picsum.photos/seed/net/500/300", category: "CSE", semester: "SEM 5" },

            // IT Courses
            { title: "Web Technology", instructor: "Dr. Berners-Lee", level: "Intermediate", progress: 0, thumbnail: "https://picsum.photos/seed/web/500/300", category: "IT", semester: "SEM 4" },
            { title: "Information Security", instructor: "Prof. Rivest", level: "Advanced", progress: 0, thumbnail: "https://picsum.photos/seed/sec/500/300", category: "IT", semester: "SEM 6" },
            { title: "Cloud Computing", instructor: "Dr. Bezos", level: "Advanced", progress: 0, thumbnail: "https://picsum.photos/seed/cloud/500/300", category: "IT", semester: "SEM 7" },

            // CSBS Courses
            { title: "Fundamentals of Economics", instructor: "Dr. Smith", level: "Beginner", progress: 0, thumbnail: "https://picsum.photos/seed/econ/500/300", category: "CSBS", semester: "SEM 2" },
            { title: "Business Strategy", instructor: "Prof. Porter", level: "Intermediate", progress: 0, thumbnail: "https://picsum.photos/seed/strat/500/300", category: "CSBS", semester: "SEM 4" },
            { title: "Software Design Pattern", instructor: "Dr. Gamma", level: "Intermediate", progress: 0, thumbnail: "https://picsum.photos/seed/design/500/300", category: "CSBS", semester: "SEM 5" },

            // AI & DS Courses
            { title: "Fundamentals of AI", instructor: "Prof. McCarthy", level: "Beginner", progress: 0, thumbnail: "https://picsum.photos/seed/ai/500/300", category: "AI & DS", semester: "SEM 3" },
            { title: "Machine Learning Techniques", instructor: "Dr. Ng", level: "Intermediate", progress: 0, thumbnail: "https://picsum.photos/seed/ml/500/300", category: "AI & DS", semester: "SEM 5" },
            { title: "Big Data Analytics", instructor: "Prof. Dean", level: "Advanced", progress: 0, thumbnail: "https://picsum.photos/seed/bigdata/500/300", category: "AI & DS", semester: "SEM 7" }
        ];

        await Course.deleteMany({}); // Optional: clear existing courses first
        const insertedCourses = await Course.insertMany(dummyCourses);

        res.status(201).json({
            message: 'Courses seeded successfully',
            count: insertedCourses.length,
            courses: insertedCourses
        });
    } catch (error) {
        console.error('Error seeding courses:', error);
        res.status(500).json({ message: 'Server error seeding courses' });
    }
});

module.exports = router;
