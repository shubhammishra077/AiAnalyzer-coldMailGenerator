const express = require('express');
const router = express.Router();
const { deleteAccount } = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');
const { accountLimiter } = require('../middleware/rateLimiters');

router.delete('/', protect, accountLimiter, deleteAccount);

module.exports = router;
