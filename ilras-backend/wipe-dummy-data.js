require('dotenv').config();
const mongoose = require('mongoose');

const Activity = require('./models/Activity');
const Feedback = require('./models/Feedback');
const Notification = require('./models/Notification');
const Message = require('./models/Message');

const wipeData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Assuming default local connection if no env provided, based on standard ilras setup
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ilras-db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected.');

        console.log('Clearing mocked Activities...');
        await Activity.deleteMany({});

        console.log('Clearing mocked Feedbacks...');
        await Feedback.deleteMany({});

        console.log('Clearing mocked Notifications...');
        await Notification.deleteMany({});

        console.log('Clearing chat Messages (optional, but good for a full restart)...');
        await Message.deleteMany({});

        console.log('Successfully wiped dummy dashboard data collections.');
        process.exit(0);
    } catch (err) {
        console.error('Error wiping data:', err);
        process.exit(1);
    }
};

wipeData();
