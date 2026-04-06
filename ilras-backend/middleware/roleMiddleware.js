const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
             return res.status(403).json({ 
                 message: `Role (${req.user.role}) is not allowed to access this resource. Allowed roles: ${allowedRoles.join(', ')}` 
             });
        }
        next();
    };
};

module.exports = { authorizeRoles };
