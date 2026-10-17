const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getBillingStatus, createSubscription, verifySubscriptionPayment, cancelSubscription } = require('../controllers/billingController');

router.use(protect);
router.get('/status', getBillingStatus);
router.post('/subscription', createSubscription);
router.post('/verify', verifySubscriptionPayment);
router.post('/cancel', cancelSubscription);
module.exports = router;
