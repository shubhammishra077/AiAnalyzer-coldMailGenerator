const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, resendOTP, loginUser, forgotPassword, resetPassword, googleLogin } = require('../controllers/authController');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiters');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);

module.exports = router;
