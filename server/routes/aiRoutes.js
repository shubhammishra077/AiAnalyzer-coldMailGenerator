const express = require('express');
const router = express.Router();
const { generateEmail, getHistory, deleteHistoryItem } = require('../controllers/aiController');
const { updateTracking } = require('../controllers/trackingController');
const { protect } = require('../middleware/authMiddleware');
const { generateLimiter } = require('../middleware/rateLimiters');

router.post('/generate-email', protect, generateLimiter, generateEmail);
router.get('/history', protect, getHistory);
router.delete('/history/:id', protect, deleteHistoryItem);
router.patch('/history/:id/tracking', protect, updateTracking);

module.exports = router;
