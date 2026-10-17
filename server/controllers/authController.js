const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const { verifyGoogleCredential } = require('../utils/googleVerify');

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 8;
const RESET_TTL_MS = 30 * 60 * 1000;
const RESET_COOLDOWN_MS = 60 * 1000;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Cryptographically secure 6-digit OTP
const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

// Store only an HMAC of the OTP, bound to the user id
const hashOTP = (userId, otp) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${userId}:${otp}`).digest('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const safeEqualHex = (a, b) => {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// Sets a fresh OTP on the user doc and emails it. Returns true if the email went out.
const issueOTP = async (user) => {
  const otp = generateOTP();
  user.otp = hashOTP(user._id.toString(), otp);
  user.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  await user.save();

  const message = `Your OTP for verification is: ${otp}\n\nThis OTP is valid for 10 minutes.`;
  try {
    await sendEmail({ email: user.email, subject: 'Email Verification OTP - AI Cold Mail Generator', message });
    return true;
  } catch (error) {
    console.error('OTP email error:', error.message);
    return false;
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input' });
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: 'Password is too long' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified) {
      return res.status(400).json({ message: 'Email already registered. Please try logging in.' });
    }

    if (user) {
      // Unverified account: let them restart signup instead of being locked out,
      // but respect the resend cooldown so this can't be used to spam an inbox.
      if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
        return res.status(429).json({ message: 'Please wait a minute before requesting another OTP.' });
      }
      user.name = name.trim();
      user.password = password;
    } else {
      user = new User({ name: name.trim(), email: normalizedEmail, password });
    }

    const emailSent = await issueOTP(user);

    res.status(201).json({
      message: emailSent
        ? 'Registered. Please verify the OTP sent to your email.'
        : 'Account created, but we could not send the OTP email. Use "Resend OTP" to try again.',
      emailSent,
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }
    if (typeof userId !== 'string' || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be a 6-digit number' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified. Please login.' });
    }
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No active OTP. Please request a new one.' });
    }
    if (Date.now() > user.otpExpiry.getTime()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    if (!safeEqualHex(user.otp, hashOTP(user._id.toString(), otp))) {
      user.otpAttempts += 1;
      await user.save();
      const left = OTP_MAX_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({
        message: left > 0
          ? `Invalid OTP. ${left} attempt${left === 1 ? '' : 's'} left.`
          : 'Invalid OTP. Please request a new one.'
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      message: 'Email verified successfully!'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified. Please login.' });
    }

    if (user.otpLastSentAt) {
      const wait = OTP_RESEND_COOLDOWN_MS - (Date.now() - user.otpLastSentAt.getTime());
      if (wait > 0) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(wait / 1000)}s before requesting another OTP.`,
          retryAfterSeconds: Math.ceil(wait / 1000)
        });
      }
    }

    const emailSent = await issueOTP(user);
    if (!emailSent) {
      return res.status(502).json({ message: 'Could not send the OTP email. Please try again shortly.' });
    }

    res.status(200).json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Only reveal verification state after the password was correct
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email first',
        userId: user._id,
        email: user.email,
        needsVerification: true
      });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      token: generateToken(user._id),
      message: 'Login successful!'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

const FORGOT_RESPONSE = { message: 'If an account exists for that email, a reset link has been sent.' };

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Same answer whether or not the account exists, so this can't be used to find registered emails
    if (!user || !user.isVerified) {
      return res.status(200).json(FORGOT_RESPONSE);
    }

    if (user.resetSentAt && Date.now() - user.resetSentAt.getTime() < RESET_COOLDOWN_MS) {
      return res.status(200).json(FORGOT_RESPONSE);
    }

    const baseUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? null : 'http://localhost:5173');
    if (!baseUrl) {
      console.error('FRONTEND_URL is not set; cannot build a password reset link');
      return res.status(200).json(FORGOT_RESPONSE);
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpiry = new Date(Date.now() + RESET_TTL_MS);
    user.resetSentAt = new Date();
    await user.save();

    const link = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset your password - AI Cold Mail Generator',
        message: `We received a request to reset your password.\n\nOpen this link within 30 minutes:\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
        html: `<p>We received a request to reset your password.</p><p><a href="${link}">Reset your password</a> (valid for 30 minutes).</p><p>If you didn't ask for this, you can ignore this email.</p>`
      });
    } catch (error) {
      console.error('Reset email error:', error.message);
    }

    res.status(200).json(FORGOT_RESPONSE);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: 'Password is too long' });
    }

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    user.password = password; // hashed by the model's pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    user.resetSentAt = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({ message: 'Password updated. Please log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// ---------- Google sign-in ----------
exports.googleLogin = async (req, res) => {
  try {
    const verified = await verifyGoogleCredential((req.body || {}).credential);
    if (!verified.ok) return res.status(verified.status).json({ message: verified.message });
    const payload = verified.payload;

    const email = payload.email.toLowerCase().trim();
    const avatarUrl = typeof payload.picture === 'string' && payload.picture.startsWith('https://')
      ? payload.picture.slice(0, 500)
      : '';

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(409).json({ message: 'This email is already linked to a different Google account.' });
        }
        if (!user.isVerified) {
          // Someone may have pre-registered this address with a password they chose.
          // Google has now proven the real owner, so discard that password and any pending OTP.
          user.password = crypto.randomBytes(32).toString('hex');
          user.otp = undefined;
          user.otpExpiry = undefined;
          user.otpAttempts = 0;
          user.isVerified = true;
        }
        user.googleId = payload.sub;
        if (avatarUrl) user.avatarUrl = avatarUrl;
        await user.save();
      } else {
        user = await User.create({
          name: (payload.name || email.split('@')[0]).trim().slice(0, 100) || 'User',
          email,
          // Accounts created through Google get an unguessable password; they can set one via "Forgot password"
          password: crypto.randomBytes(32).toString('hex'),
          isVerified: true,
          googleId: payload.sub,
          avatarUrl,
        });
      }
    } else if (avatarUrl && user.avatarUrl !== avatarUrl) {
      user.avatarUrl = avatarUrl;
      await user.save();
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      token: generateToken(user._id),
      message: 'Login successful!'
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Google sign-in failed' });
  }
};
