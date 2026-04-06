require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        await mongoose.connection.collection('users').dropIndex('googleId_1');
        console.log('Successfully dropped old googleId_1 index');
    } catch (e) {
        console.log('Error dropping index:', e.message);
    }
    process.exit();
});
