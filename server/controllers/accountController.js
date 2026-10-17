const User = require('../models/User');
const EmailHistory = require('../models/EmailHistory');
const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const MonthlyUsage = require('../models/MonthlyUsage');
const axios = require('axios');
const { verifyGoogleCredential } = require('../utils/googleVerify');

// Permanently deletes the logged-in user's account and everything they created.
//
// Re-authentication is required so a stolen session token alone cannot wipe an account:
//   - { password }   for accounts that have a password they know, or
//   - { credential } a fresh Google ID token, for accounts linked to Google.
// Failures return 403 (not 401) so the client doesn't treat them as an expired session.
exports.deleteAccount = async (req, res) => {
  try {
    const { password, credential, confirmEmail } = req.body || {};

    if (typeof confirmEmail !== 'string' || !confirmEmail.trim()) {
      return res.status(400).json({ message: 'Type your email address to confirm.' });
    }
    if (password !== undefined && typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid password.' });
    }
    if (credential !== undefined && typeof credential !== 'string') {
      return res.status(400).json({ message: 'Invalid credential.' });
    }
    if (!password && !credential) {
      return res.status(400).json({ message: 'Enter your password or confirm with Google.' });
    }

    // protect() hides the password hash, so load the full document
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Account not found.' });

    if (confirmEmail.toLowerCase().trim() !== user.email) {
      return res.status(400).json({ message: 'That email does not match your account.' });
    }

    let authorised = false;

    if (password) {
      authorised = await user.matchPassword(password);
    }

    if (!authorised && credential) {
      const verified = await verifyGoogleCredential(credential);
      if (!verified.ok) return res.status(verified.status).json({ message: verified.message });
      // The token must belong to THIS account's linked Google identity
      authorised = Boolean(user.googleId) && verified.payload.sub === user.googleId;
    }

    if (!authorised) {
      return res.status(403).json({ message: 'We could not confirm it is you. Check your password and try again.' });
    }

    // Stop recurring billing before deleting the account, otherwise the user could keep being charged.
    if (user.razorpaySubscriptionId && ['created', 'active'].includes(user.subscriptionStatus)) {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ message: 'Billing credentials are unavailable. Contact support to cancel billing before deleting this account.' });
      }
      try {
        await console.log('Razorpay cancellation diagnostic:', {
    keyMode: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')
        ? 'test'
        : process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_')
            ? 'live'
            : 'unknown',
    hasKeyId: Boolean(process.env.RAZORPAY_KEY_ID),
    hasKeySecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
    subscriptionId: user.razorpaySubscriptionId,
    subscriptionStatus: user.subscriptionStatus,
});axios.post(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(user.razorpaySubscriptionId)}/cancel`, {
          cancel_at_cycle_end: 0,
        }, {
          auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_KEY_SECRET },
          timeout: 15000,
        });
      } catch (billingError) {
        console.error('Account deletion subscription cancellation failed:', billingError.response?.data || billingError.message);
        return res.status(502).json({ message: 'Could not cancel the subscription. Your account was not deleted; please try again or contact support.' });
      }
    }

    // Dependent data first: if something fails midway the account still exists and the user can retry.
    await Promise.all([
      EmailHistory.deleteMany({ userId: user._id }),
      Resume.deleteMany({ userId: user._id }),
      ResumeAnalysis.deleteMany({ userId: user._id }),
      MonthlyUsage.deleteMany({ userId: user._id }),
    ]);
    await User.deleteOne({ _id: user._id });

    res.status(200).json({ message: 'Your account and data have been deleted.' });
  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({ message: 'Failed to delete your account. Please try again.' });
  }
};
