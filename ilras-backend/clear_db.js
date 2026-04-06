require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const clearDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
        const res = await User.deleteMany({});
        console.log(`Deleted ${res.deletedCount} users.`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

clearDB();
