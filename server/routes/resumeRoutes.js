const express = require('express');
const router = express.Router();
const c = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const { requireVerified } = require('../middleware/requireVerified');
const { uploadResume } = require('../middleware/upload');
const { resumeLimiter, uploadLimiter } = require('../middleware/rateLimiters');

// Every resume route requires a logged-in, email-verified user
router.use(protect, requireVerified);

router.get('/', c.getResume);
router.put('/', c.saveResume);
router.delete('/', c.deleteResume);
router.post('/upload', uploadLimiter, uploadResume, c.uploadResume);

router.post('/analyze', resumeLimiter, c.analyzeResume);
router.get('/analyses', c.listAnalyses);
router.delete('/analyses/:id', c.deleteAnalysis);

module.exports = router;
