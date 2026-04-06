const mongoose = require('mongoose');
const Course = require('./models/Course');
mongoose.connect('mongodb://127.0.0.1:27017/ilras', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const courses = await Course.find();
        const depts = ['CSE', 'IT', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI & DS'];
        for (let c of courses) {
            if (!depts.includes(c.category)) {
                c.category = depts[Math.floor(Math.random() * depts.length)];
                await c.save();
            }
        }
        console.log('Done mapping courses');
        process.exit(0);
    })
    .catch(err => { console.error(err); process.exit(1); })
