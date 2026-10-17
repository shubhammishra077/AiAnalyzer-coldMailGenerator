const MonthlyUsage = require('../models/MonthlyUsage');

// Balanced free tier; premium is generous but bounded to protect provider spend.
const LIMITS = Object.freeze({
  free: Object.freeze({ emailGenerations: 10, resumeAnalyses: 5 }),
  premium: Object.freeze({ emailGenerations: 300, resumeAnalyses: 100 }),
});

const currentPeriod = (date = new Date()) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const isPremiumActive = (user, now = new Date()) => Boolean(
  user && user.plan === 'premium' && user.subscriptionStatus === 'active' &&
  user.subscriptionCurrentEnd && new Date(user.subscriptionCurrentEnd) > now
);

const getPlan = (user) => isPremiumActive(user) ? 'premium' : 'free';

const getUsage = async (userId, period = currentPeriod()) => {
  const usage = await MonthlyUsage.findOne({ userId, period }).lean();
  return usage || { emailGenerations: 0, resumeAnalyses: 0, period };
};

// Atomically reserves one unit before the expensive provider call. A failed provider
// request refunds the reservation. The unique index makes concurrent first use safe.
const reserveUsage = async ({ userId, user, feature }) => {
  if (!['emailGenerations', 'resumeAnalyses'].includes(feature)) throw new Error('Unknown usage feature');
  const plan = getPlan(user);
  const limit = LIMITS[plan][feature];
  const period = currentPeriod();
  let doc = await MonthlyUsage.findOneAndUpdate(
    { userId, period, [feature]: { $lt: limit } },
    { $inc: { [feature]: 1 }, $setOnInsert: { userId, period } },
    { new: true }
  );
  if (doc) return { allowed: true, plan, limit, period, usage: doc[feature] };

  // No row yet? Create it with the first unit, handling a concurrent insert safely.
  try {
    doc = await MonthlyUsage.create({ userId, period, [feature]: 1 });
    return { allowed: true, plan, limit, period, usage: doc[feature] };
  } catch (error) {
    if (error.code !== 11000) throw error;
    doc = await MonthlyUsage.findOneAndUpdate(
      { userId, period, [feature]: { $lt: limit } },
      { $inc: { [feature]: 1 } },
      { new: true }
    );
    if (doc) return { allowed: true, plan, limit, period, usage: doc[feature] };
  }

  const latest = await MonthlyUsage.findOne({ userId, period }).lean();
  return { allowed: false, plan, limit, period, usage: latest?.[feature] || 0 };
};

const refundUsage = async ({ userId, reservation, feature }) => {
  if (!reservation?.allowed) return;
  await MonthlyUsage.updateOne(
    { userId, period: reservation.period, [feature]: { $gt: 0 } },
    { $inc: { [feature]: -1 } }
  );
};

const snapshot = async (user) => {
  const plan = getPlan(user);
  const period = currentPeriod();
  const usage = await getUsage(user._id, period);
  return {
    plan,
    subscriptionStatus: user.subscriptionStatus || 'inactive',
    subscriptionCurrentEnd: user.subscriptionCurrentEnd || null,
    cancelAtPeriodEnd: Boolean(user.subscriptionCancelAtPeriodEnd),
    period,
    limits: LIMITS[plan],
    usage: {
      emailGenerations: usage.emailGenerations || 0,
      resumeAnalyses: usage.resumeAnalyses || 0,
    },
  };
};

module.exports = { LIMITS, currentPeriod, isPremiumActive, getPlan, getUsage, reserveUsage, refundUsage, snapshot };
