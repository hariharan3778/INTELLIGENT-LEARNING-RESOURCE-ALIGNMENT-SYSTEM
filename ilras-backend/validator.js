const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ilras');
        let user = await User.findOne();
        if(!user) return console.log('NO USER FOUND');
        
        user.timetable.push({
            courseId: new mongoose.Types.ObjectId(),
            title: 'Test',
            day: 'Monday',
            start: '09:00 AM',
            duration: 1,
            type: 'Lecture',
            color: 'from-blue-600 to-blue-800'
        });
        
        await user.save();
        console.log('SUCCESS');
    } catch(err) {
        console.error('ERROR OCCURRED:', err.message);
    } finally {
        process.exit();
    }
}
test();
