const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Forgot password route (sends OTP)
router.post('/forgot-password', authController.forgotPassword);

// Verify OTP and reset password route
router.post('/verify-otp', authController.verifyOTP);

// Send OTP route (for other purposes)
router.post('/send-otp', authController.sendOTP);

module.exports = router;
