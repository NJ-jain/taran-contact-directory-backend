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

// Phone direct login route for community members (No OTP required)
router.post('/phone/login', authController.phoneLogin);
router.post('/phone/send-otp', authController.phoneLogin); // Backwards compatibility alias
router.post('/phone/verify-otp', authController.phoneLogin); // Backwards compatibility alias

module.exports = router;
