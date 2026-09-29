const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail, sendWelcomeEmail } = require('../config/emailConfig');

const JWT_EXPIRATION = '24h';

const authController = {
  // Register a new user  
  register: async (req, res) => {
    try {
      const { email, password, category, aboutUs } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      }

      // Check if user already exists
      const normalizedEmail = email.toLowerCase().trim();
      if (await User.exists({ email: normalizedEmail })) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      // Hash the password with 12 rounds and create new user
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new User({
        email: normalizedEmail,
        password: hashedPassword,
        category: category || '',
        aboutUs: aboutUs || '',
        membersArray: [],
      });

      const savedUser = await newUser.save();

      if (!process.env.JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET environment variable is missing!');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
      }

      const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION });

      // Send welcome email (safe, no cleartext password)
      try {
        await sendWelcomeEmail(normalizedEmail);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError.message);
        // Do not fail registration if email provider has an issue
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: savedUser._id,
          email: savedUser.email,
          category: savedUser.category
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (!process.env.JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET environment variable is missing!');
        return res.status(500).json({ success: false, message: 'Server configuration error' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          category: user.category
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
    }
  },

  // Forgot password - Send cryptographically secure OTP
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        // Return a generic success to prevent email enumeration
        return res.status(200).json({ 
          success: true, 
          message: 'If an account exists with this email, an OTP has been sent.' 
        });
      }

      // Generate cryptographically secure 6-digit OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send OTP email
      await sendOTPEmail(normalizedEmail, otp, true);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully. Please check your email to verify and reset your password.'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
    }
  },

  // Send OTP (general purpose)
  sendOTP: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found with this email address' });
      }

      // Generate cryptographically secure 6-digit OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      await sendOTPEmail(normalizedEmail, otp, false);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully. Please check your email.'
      });

    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
    }
  },

  // Verify OTP and reset password
  verifyOTP: async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({
        email: normalizedEmail,
        otp: otp.trim(),
        otpExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      // If newPassword is provided, reset the password
      if (newPassword) {
        if (newPassword.length < 8) {
          return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return res.status(200).json({
          success: true,
          message: 'OTP verified and password reset successfully'
        });
      } else {
        // Just verify OTP without password reset
        return res.status(200).json({
          success: true,
          message: 'OTP verified successfully. You can now reset your password.'
        });
      }

    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: 'Error verifying OTP', error: error.message });
    }
  }
};

module.exports = authController;