const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const { snapshot, getPlan } = require('../services/entitlements');

const razorpayConfigured = () => Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_PLAN_ID && process.env.RAZORPAY_WEBHOOK_SECRET
);

exports.getBillingStatus = async (req, res) => {
  try {
    return res.status(200).json({
      ...(await snapshot(req.user)),
      pricePaise: Number(process.env.PREMIUM_PRICE_PAISE || 29900),
      currency: 'INR',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
      billingConfigured: razorpayConfigured(),
    });
  } catch (error) {
    console.error('Billing status error:', error.message);
    return res.status(500).json({ message: 'Could not load billing status' });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    if (!razorpayConfigured()) {
      return res.status(503).json({ message: 'Premium billing is not configured yet. Please try again later.' });
    }
    if (getPlan(req.user) === 'premium') {
      return res.status(409).json({ message: 'Your premium subscription is already active.' });
    }
    if (req.user.razorpaySubscriptionId && req.user.subscriptionStatus === 'created') {
      return res.status(200).json({
        subscriptionId: req.user.razorpaySubscriptionId,
        keyId: process.env.RAZORPAY_KEY_ID,
        pricePaise: Number(process.env.PREMIUM_PRICE_PAISE || 29900),
        currency: 'INR',
      });
    }
    if (req.user.razorpaySubscriptionId && req.user.subscriptionStatus === 'active') {
      return res.status(409).json({ message: 'A subscription is already associated with this account.' });
    }

    const response = await axios.post('https://api.razorpay.com/v1/subscriptions', {
      plan_id: process.env.RAZORPAY_PLAN_ID,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: { userId: String(req.user._id), product: 'AI Analyzer-coldMailGenerator Premium' },
    }, {
      auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_KEY_SECRET },
      timeout: 15000,
    });

    req.user.razorpaySubscriptionId = response.data.id;
    req.user.subscriptionStatus = 'created';
    req.user.subscriptionCancelAtPeriodEnd = false;
    await req.user.save();

    return res.status(201).json({
      subscriptionId: response.data.id,
      shortUrl: response.data.short_url || null,
      keyId: process.env.RAZORPAY_KEY_ID,
      pricePaise: Number(process.env.PREMIUM_PRICE_PAISE || 29900),
      currency: 'INR',
    });
  } catch (error) {
    console.error('Create subscription error:', error.response?.data || error.message);
    return res.status(502).json({ message: 'Could not start checkout. Please try again.' });
  }
};

const safeSignatureEqual = (expected, actual) => {
  if (typeof actual !== 'string') return false;
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(actual, 'hex');
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
};

exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_payment_id: paymentId, razorpay_subscription_id: subscriptionId, razorpay_signature: signature } = req.body || {};
    if (!paymentId || !subscriptionId || !signature) {
      return res.status(400).json({ message: 'Missing Razorpay payment verification fields.' });
    }
    if (subscriptionId !== req.user.razorpaySubscriptionId) {
      return res.status(400).json({ message: 'Subscription does not belong to this account.' });
    }
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${paymentId}|${subscriptionId}`).digest('hex');
    if (!safeSignatureEqual(expected, signature)) {
      return res.status(400).json({ message: 'Payment signature could not be verified.' });
    }

    // Checkout's signed success callback confirms the first payment. Webhooks remain
    // authoritative for later renewals, cancellations and payment failures.
    req.user.plan = 'premium';
    req.user.subscriptionStatus = 'active';
    req.user.subscriptionCurrentEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    req.user.subscriptionCancelAtPeriodEnd = false;
    await req.user.save();
    return res.status(200).json({ message: 'Payment verified. Premium is active.', ...(await snapshot(req.user)) });
  } catch (error) {
    console.error('Verify subscription error:', error.message);
    return res.status(500).json({ message: 'Could not verify the payment.' });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    if (!req.user.razorpaySubscriptionId || req.user.subscriptionStatus !== 'active') {
      return res.status(400).json({ message: 'There is no active subscription to cancel.' });
    }
    if (!razorpayConfigured()) return res.status(503).json({ message: 'Billing is not configured.' });
    await axios.post(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(req.user.razorpaySubscriptionId)}/cancel`, {
      cancel_at_cycle_end: 1,
    }, {
      auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_KEY_SECRET },
      timeout: 15000,
    });
    req.user.subscriptionCancelAtPeriodEnd = true;
    await req.user.save();
    return res.status(200).json({ message: 'Cancellation scheduled for the end of your billing period.', ...(await snapshot(req.user)) });
  } catch (error) {
    console.error('Cancel subscription error:', error.response?.data || error.message);
    return res.status(502).json({ message: 'Could not cancel the subscription. Please try again.' });
  }
};

exports.razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ message: 'Webhook is not configured.' });
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  if (!safeSignatureEqual(expected, signature)) return res.status(400).json({ message: 'Invalid webhook signature.' });

  try {
    const event = JSON.parse(req.body.toString('utf8'));
    const subscription = event.payload?.subscription?.entity;
    if (!subscription?.id) return res.status(200).json({ received: true });
    const user = await User.findOne({ razorpaySubscriptionId: subscription.id });
    if (!user) return res.status(200).json({ received: true });

    const end = subscription.current_end ? new Date(subscription.current_end * 1000) : user.subscriptionCurrentEnd;
    if (['subscription.activated', 'subscription.charged', 'subscription.resumed'].includes(event.event)) {
      user.plan = 'premium';
      user.subscriptionStatus = 'active';
      user.subscriptionCurrentEnd = end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (event.event === 'subscription.cancelled' || event.event === 'subscription.completed') {
      user.subscriptionCurrentEnd = end || new Date();
      if (event.event === 'subscription.cancelled' && user.subscriptionCurrentEnd > new Date()) {
        // Keep premium until the already-paid period ends.
        user.subscriptionStatus = 'active';
        user.plan = 'premium';
        user.subscriptionCancelAtPeriodEnd = true;
      } else {
        user.subscriptionStatus = 'expired';
        user.plan = 'free';
        user.subscriptionCancelAtPeriodEnd = false;
      }
    } else if (event.event === 'subscription.halted' || event.event === 'subscription.paused') {
      user.subscriptionStatus = 'halted';
      user.plan = 'free';
    }
    await user.save();
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook processing error:', error.message);
    return res.status(500).json({ message: 'Webhook processing failed.' });
  }
};
