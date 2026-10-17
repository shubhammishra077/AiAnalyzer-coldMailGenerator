const mongoose = require('mongoose');

const monthlyUsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true }, // UTC YYYY-MM
  emailGenerations: { type: Number, default: 0, min: 0 },
  resumeAnalyses: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

monthlyUsageSchema.index({ userId: 1, period: 1 }, { unique: true });
module.exports = mongoose.model('MonthlyUsage', monthlyUsageSchema);
