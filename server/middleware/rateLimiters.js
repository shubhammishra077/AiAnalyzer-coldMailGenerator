const rateLimit = require('express-rate-limit');

const json429 = (message) => (req, res) => res.status(429).json({ message });

// Broad safety net for every /api route
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429('Too many requests. Please slow down.')
});

// Login / register: slows credential stuffing and signup spam
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429('Too many attempts. Please try again in 15 minutes.')
});

// OTP verify / resend (per-user attempt cap in the controller is the main defence)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429('Too many OTP requests. Please try again later.')
});

// Generation costs real money: limit per logged-in user, not per IP.
// Must run after the `protect` middleware so req.user exists.
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? req.user._id.toString() : req.ip),
  handler: json429('Hourly generation limit reached (20/hour). Please try again later.')
});

// Resume analysis is the most expensive call (long prompt): stricter per-user cap
const resumeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? req.user._id.toString() : req.ip),
  handler: json429('Hourly resume analysis limit reached (10/hour). Please try again later.')
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? req.user._id.toString() : req.ip),
  handler: json429('Too many uploads. Please try again later.')
});

// Destructive and password-checking: keep guessing attempts very low
const accountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? req.user._id.toString() : req.ip),
  handler: json429('Too many attempts. Please try again later.')
});

module.exports = { apiLimiter, authLimiter, otpLimiter, generateLimiter, resumeLimiter, uploadLimiter, accountLimiter };
