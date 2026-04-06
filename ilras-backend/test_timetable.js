const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const fs = require('fs');

async function testTimetableSave() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ilras');
        
        let user = await User.findOne();
        if(!user) {
            fs.writeFileSync('timetable_result.txt', 'No user found');
            process.exit(0);
        }

        let course = await Course.findOne();
        if(!course) {
            fs.writeFileSync('timetable_result.txt', 'No courses found');
            process.exit(0);
        }

        user.timetable.push({
            courseId: course._id,
            title: course.title,
            day: 'Monday',
            start: '09:00 AM',
            duration: 1,
            type: 'Lecture',
            color: 'from-blue-600 to-blue-800'
        });

        await user.save();
        fs.writeFileSync('timetable_result.txt', 'SUCCESS');
        process.exit(0);
    } catch(err) {
        fs.writeFileSync('timetable_result.txt', 'ERROR: ' + String(err) + '\n' + err.stack);
        process.exit(1);
    }
}

testTimetableSave();
