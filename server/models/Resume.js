const mongoose = require('mongoose');

// One saved resume per user (plain text extracted from upload or pasted)
const resumeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    text: { type: String, required: true, maxlength: 20000 },
    fileName: { type: String, default: '', maxlength: 200 },
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
