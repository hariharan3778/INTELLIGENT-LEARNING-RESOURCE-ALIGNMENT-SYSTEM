const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header
    const authHeader = req.header('Authorization');

    // Check if no auth header or not starting with Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Retrieve the full Mongoose User document
        const user = await User.findById(decoded._id);
        
        if (!user) {
            return res.status(401).json({ message: 'Authorization denied: User not found' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'Account is blocked by administrator' });
        }

        // Attach full user document to request
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
