// Must run after `protect`. Blocks accounts whose email has not been verified.
const requireVerified = (req, res, next) => {
    if (!req.user || req.user.isVerified !== true) {
        return res.status(403).json({
            message: 'Please verify your email to use this feature.',
            needsVerification: true
        });
    }
    next();
};

module.exports = { requireVerified };
