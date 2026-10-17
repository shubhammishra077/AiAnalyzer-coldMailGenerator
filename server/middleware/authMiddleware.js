const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password -otp -resetPasswordToken');
        
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // A password reset invalidates every token issued before it
        if (req.user.passwordChangedAt &&
            decoded.iat < Math.floor(req.user.passwordChangedAt.getTime() / 1000)) {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
};

module.exports = { protect };
