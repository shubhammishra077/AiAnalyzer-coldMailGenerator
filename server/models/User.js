const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    // Google sign-in (sparse so users without Google don't collide on null)
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String, default: '', maxlength: 500 },
    // otp holds an HMAC of the code, never the code itself
    otp: { type: String },
    otpExpiry: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: { type: Date },
    // Password reset: only a SHA-256 hash of the emailed token is stored
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
    resetSentAt: { type: Date },
    // Tokens issued before this moment are rejected (logs out other sessions after a reset)
    passwordChangedAt: { type: Date },
    // Billing state is always enforced by the server; never trust a client-side plan flag.
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    subscriptionStatus: { type: String, enum: ['inactive', 'created', 'active', 'cancelled', 'expired', 'halted'], default: 'inactive' },
    razorpaySubscriptionId: { type: String, default: null, index: true, sparse: true },
    subscriptionCurrentEnd: { type: Date, default: null },
    subscriptionCancelAtPeriodEnd: { type: Boolean, default: false },
    // Candidate background used to personalise generated outreach
    profile: {
        headline: { type: String, default: '', maxlength: 120 },        // e.g. "Backend Engineer at Acme"
        yearsExperience: { type: Number, min: 0, max: 60 },
        skills: { type: [String], default: [] },
        highlights: { type: String, default: '', maxlength: 1200 },     // real achievements, one per line
        targetRole: { type: String, default: '', maxlength: 120 },
        linkedinUrl: { type: String, default: '', maxlength: 200 },
        githubUrl: { type: String, default: '', maxlength: 200 },
        portfolioUrl: { type: String, default: '', maxlength: 200 },
    },
}, { timestamps: true });

// Accounts that never verify their email are deleted automatically after 7 days.
// The partial filter means verified accounts are never touched by this index.
userSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 7 * 24 * 60 * 60, partialFilterExpression: { isVerified: false } }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
