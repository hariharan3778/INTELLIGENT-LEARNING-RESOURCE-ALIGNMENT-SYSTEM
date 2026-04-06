const mongoose = require('mongoose');
const User = require('./models/User');

async function testTimetableAndClean() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ilras');
        console.log('Connected to DB');

        // Clean dummy users
        const res = await User.deleteMany({ $or: [{ googleId: null }, { googleId: { $exists: false } }] });
        console.log('Deleted dummy users:', res.deletedCount);

        const usersRemaining = await User.find();
        console.log('Users remaining:', usersRemaining.length);

        if (usersRemaining.length > 0) {
            const user = usersRemaining[0];
            try {
                user.timetable.push({
                    title: "Test Course",
                    day: "Monday",
                    start: "09:00 AM",
                    duration: 1,
                    type: "Lecture",
                    color: "orange"
                });
                await user.save();
                console.log('Saved timetable block successfully!');
            } catch (err) {
                console.error('Failed to save timetable:', err.message);
            }
        }
        
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
testTimetableAndClean();
