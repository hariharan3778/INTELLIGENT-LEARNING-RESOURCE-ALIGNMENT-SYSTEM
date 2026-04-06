const mongoose = require('mongoose');
const Activity = require('./models/Activity');
const Assessment = require('./models/Assessment');

async function testAnalytics() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ilras');
        const userId = new mongoose.Types.ObjectId();
        
        console.log("Testing with new userId:", userId);

        await Activity.insertMany([
            { userId: userId.toString(), day: 'Mon', hours: 4 },
            { userId: userId.toString(), day: 'Tue', hours: 6 }
        ]);

        const weeklyActivity = await Activity.find({ userId: userId.toString() })
            .sort({ createdAt: -1 })
            .limit(7);

        console.log('Weekly Activity:', weeklyActivity);

        const chartData = weeklyActivity.map(a => ({ day: a.day, hours: a.hours })).reverse();
        console.log('Chart Data:', chartData);

        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
testAnalytics();
