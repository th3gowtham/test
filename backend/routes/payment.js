const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
let razorpay;
try {
    razorpay = require('../services/razorpay');
    console.log('Razorpay instance loaded in payment routes');
} catch (error) {
    console.error('Failed to load Razorpay instance:', error);
    throw error;
}

// Input sanitization function
const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
};

// Rate limiting
const createOrderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Create Order Route
router.post('/create-order', createOrderLimiter, async (req, res) => {
    console.log('Received create-order request:', req.body);
    try {
        const name = sanitizeString(req.body.name);
        const email = sanitizeString(req.body.email);
        const amount = parseFloat(req.body.amount);
        console.log('Parsed amount:', amount, 'Original amount:', req.body.amount);

        if (!name || !email || !amount) {
            console.log('Validation failed:', { name, email, amount });
            return res.status(400).json({ error: 'Missing required fields', received: { name, email, amount } });
        }

        if (amount <= 0 || isNaN(amount)) {
            console.log('Invalid amount:', amount);
            return res.status(400).json({ error: 'Invalid amount', received: amount });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise, rounded to avoid floating-point issues
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        console.log('Creating Razorpay order with options:', options);
        const order = await razorpay.orders.create(options);
        console.log('Razorpay order created successfully:', order.id);

        res.json({
            orderId: order.id,
            amount: amount * 100,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error creating order:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Request body:', req.body);
        res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
});

// Verify payment route
router.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment verification details' });
        }

        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature === expectedSign) {
            return res.status(200).json({ message: 'Payment verified successfully' });
        } else {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: 'Payment verification failed', details: error.message });
    }
});

module.exports = router;